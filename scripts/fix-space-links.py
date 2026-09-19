"""把含空格的裸 Markdown 链接目标包进尖括号，使其成为合法 CommonMark 链接。

背景：`[文本](../AI RAG学习资料.md)` 在 CommonMark 里根本不是链接（目标是纯文本），
GitHub、react-markdown、Obsidian 都不认。必须写成 `[文本](<../AI RAG学习资料.md>)`。

为什么用尖括号而不是 %20：
  - 原始 Markdown 里路径仍然可读，Obsidian 里能正常跳转
  - %20 会把 216 个文件里的中文路径变成一串转义，人工维护时极难辨认
  - 前端 normalizeLinkTarget 两者都能解码，所以对站点等价

跳过：围栏代码块、行内代码、图片（![]）、已带尖括号的、外链、含 %20 的。
"""
import os, re, posixpath, sys

ROOT = 'src/posts'
DRY = '--apply' not in sys.argv

link_re = re.compile(r'(!?)\[([^\]\n]*)\]\(([^)\n]*)\)')
# 链接目标可能带 title：url "title" / url 'title' / url (title)
title_re = re.compile(r'^(.*?)(\s+(?:"[^"]*"|\'[^\']*\'|\([^)]*\)))$')

def collect_files():
    out = []
    for r, d, fs in os.walk(ROOT):
        if '.solomd' in r.split(os.sep):
            continue
        for f in fs:
            if f.endswith('.md'):
                out.append(os.path.join(r, f))
    return out

def slugs():
    s = set()
    for p in collect_files():
        s.add(os.path.relpath(p, ROOT).replace(os.sep, '/')[:-3])
    return s

SLUGS = slugs()

def resolve(cur, target):
    t = target.replace('%20', ' ')
    if t.startswith('/'):
        t = t.strip('/')
        return t[6:] if t.startswith('posts/') else t
    return posixpath.normpath(posixpath.join(posixpath.dirname(cur), t))

def fix_segment(seg, stats, broken):
    def repl(m):
        bang, text, inner = m.group(1), m.group(2), m.group(3)
        if bang == '!':
            return m.group(0)  # 图片单独统计，不在这里改
        tm = title_re.match(inner)
        url, title = (tm.group(1), tm.group(2)) if tm else (inner, '')
        if not url.endswith('.md'):
            return m.group(0)
        if url.startswith('<') and url.endswith('>'):
            return m.group(0)
        if '%20' in url:
            return m.group(0)
        if re.match(r'^[a-z][a-z\d+.-]*:', url, re.I):
            return m.group(0)
        if ' ' not in url:
            return m.group(0)
        stats['fixed'] += 1
        return f'{bang}[{text}](<{url}>{title})'
    return link_re.sub(repl, seg)

def main():
    stats = {'fixed': 0, 'files': 0, 'images': 0, 'broken_after': 0}
    broken = []
    changed = []
    for p in collect_files():
        text = open(p, encoding='utf-8').read()
        cur = os.path.relpath(p, ROOT).replace(os.sep, '/')[:-3]
        lines = text.split('\n')
        out = []
        in_code = False
        for line in lines:
            stripped = line.lstrip()
            if stripped.startswith('```') or stripped.startswith('~~~'):
                in_code = not in_code
                out.append(line)
                continue
            if in_code:
                out.append(line)
                continue
            # 行内代码（`...`）内的内容不是链接，只处理反引号外的片段
            parts = line.split('`')
            new_parts = []
            for i, seg in enumerate(parts):
                if i % 2 == 1:
                    new_parts.append(seg)
                    continue
                before = stats['fixed']
                seg = fix_segment(seg, stats, broken)
                new_parts.append(seg)
            out.append('`'.join(new_parts))
        new_text = '\n'.join(out)
        if new_text != text:
            stats['files'] += 1
            changed.append(p)
            if not DRY:
                open(p, 'w', encoding='utf-8', newline='').write(new_text)

    print(f"{'[DRY-RUN] ' if DRY else ''}改写 {stats['fixed']} 处链接，涉及 {stats['files']} 个文件")
    print(f'样例文件: {changed[:3]}')
    return stats

if __name__ == '__main__':
    main()
