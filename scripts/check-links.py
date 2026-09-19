"""站内链接体检：列出所有指向不存在文章的链接。

检查两类写法（与 vite.config.ts / src/lib/posts.ts 的解析规则保持一致）：
  [[双链]]                  宽松匹配：完整 slug -> frontmatter 标题 -> slug 后缀
  [文本](<相对路径.md>)      严格匹配：按来源文章所在目录展开相对路径，必须精确命中

另外单独列出「裸写含空格目标」——这种在 CommonMark 里根本不是链接，
解析器与站点都看不到它，属于静默失效，最容易漏。

用法：
    python scripts/check-links.py            # 摘要 + 前 40 条明细
    python scripts/check-links.py --all      # 全部明细
"""
import os, re, posixpath, sys, collections

ROOT = 'src/posts'

# 与 vite.config.ts 的 extractNoteLinks 保持一致
BARE_LINK = re.compile(r'(!?)\[([^\]\n]*)\]\(([^)\n]*)\)')
WIKI_LINK = re.compile(r'\[\[([^\]\|\n]+)(?:\|([^\]\n]+))?\]\]')
FENCE = re.compile(r'^\s*(```|~~~)')


def collect_files():
    out = []
    for r, d, fs in os.walk(ROOT):
        if '.solomd' in r.split(os.sep):
            continue
        for f in fs:
            if f.endswith('.md'):
                out.append(os.path.join(r, f))
    return out


def load_index():
    """slug -> frontmatter title"""
    slugs, titles = {}, {}
    for p in collect_files():
        slug = os.path.relpath(p, ROOT).replace(os.sep, '/')[:-3]
        text = open(p, encoding='utf-8', errors='ignore').read()
        m = re.search(r'^title:\s*"?(.*?)"?\s*$', text, re.M)
        slugs[slug] = p
        if m:
            titles[m.group(1)] = slug
    return slugs, titles


def parse_md_target(inner):
    """与 vite.config.ts 的 parseMdLinkTarget 一致"""
    value = inner.strip()
    if value.startswith('<') and value.endswith('>'):
        value = value[1:-1]
    value = re.sub(r'\s+(?:"[^"]*"|\'[^\']*\'|\([^)]*\))\s*$', '', value)
    h = value.find('#')
    if h >= 0:
        value = value[:h]
    return value if value.lower().endswith('.md') else None


def resolve_relative(cur, target):
    """target 是已剥掉 .md 的 slug 路径"""
    t = target.replace('%20', ' ')
    if t.startswith('/'):
        t = t.strip('/')
        return t[6:] if t.startswith('posts/') else t
    if '/' not in t:
        return None  # 纯文件名交给宽松匹配
    return posixpath.normpath(posixpath.join(posixpath.dirname(cur), t))


def strip_frontmatter(text):
    """丢掉 frontmatter，返回 (起始行号, 正文)。

    必须跳过：vite 插件抽链接时拿的是 parsed.body，本来就不含 frontmatter。
    不跳的话 description 里的 Shell 语法（如 `[[ ]]`、`[[ == ]]`）会被当成双链误报。
    """
    m = re.match(r'^---\r?\n.*?\r?\n---\r?\n', text, re.S)
    if not m:
        return 1, text
    return text[:m.end()].count('\n') + 1, text[m.end():]


def find_post(slugs, titles, target):
    """严格镜像 src/lib/posts.ts 的 findPostByLink：完整 slug -> 标题 -> slug 后缀。

    后缀匹配是最宽松的一步，也是“多主题同名文件”会连错边的原因，
    所以它只作为纯文件名链接与 [[双链]] 的兜底（与运行时一致）。
    """
    norm = re.sub(r'^/?posts/', '', target)
    if norm in slugs:
        return slugs[norm]
    if target in titles:
        return slugs[titles[target]]
    suffix = '/' + norm
    for s in slugs:
        if s.endswith(suffix):
            return slugs[s]
    return None


def main():
    show_all = '--all' in sys.argv
    slugs, titles = load_index()
    title_slugs = set(titles.values())

    broken = []
    bare_space = []
    stats = collections.Counter()

    for slug, path in slugs.items():
        text = open(path, encoding='utf-8', errors='ignore').read()
        base_lineno, body = strip_frontmatter(text)
        in_code = False
        for offset, line in enumerate(body.split('\n')):
            lineno = base_lineno + offset
            if FENCE.match(line):
                in_code = not in_code
                continue
            if in_code:
                continue
            # 行内代码里的不算
            segments = [s for i, s in enumerate(line.split('`')) if i % 2 == 0]

            for seg in segments:
                for m in BARE_LINK.finditer(seg):
                    if m.group(1) == '!':
                        continue
                    raw_inner = m.group(3)
                    target = parse_md_target(raw_inner)
                    if target is None:
                        # 含空格且没写尖括号 —— CommonMark 不认为是链接，静默失效
                        if ' ' in raw_inner and raw_inner.lower().endswith('.md'):
                            bare_space.append((slug, lineno, m.group(0)))
                        continue
                    if re.match(r'^[a-z][a-z\d+.-]*:', target, re.I):
                        continue
                    stats['md'] += 1
                    # 剥掉 .md，否则永远匹配不上 slug（slug 无后缀）
                    target = target[:-3]
                    # 与运行时 resolveMarkdownPostHref 完全一致：
                    #   含 `/` 的路径先按“来源目录 + 相对路径”精确解析；
                    #   纯文件名（含 `./x.md`）或精确解析未命中，再走宽松匹配。
                    resolved = resolve_relative(slug, target)
                    hit = None
                    if resolved is not None:
                        hit = slugs.get(resolved)
                    if hit is None:
                        hit = find_post(slugs, titles, target)
                    if hit is None:
                        broken.append((slug, lineno, m.group(0), resolved or target))

                for m in WIKI_LINK.finditer(seg):
                    stats['wiki'] += 1
                    t = m.group(1).strip()
                    if find_post(slugs, titles, t) is None:
                        broken.append((slug, lineno, m.group(0), t))

    print(f"扫描 {len(slugs)} 篇文章")
    print(f"  双链 [[...]]          {stats['wiki']}")
    print(f"  Markdown 链接          {stats['md']}")
    print(f"  解析失败（真断链）      {len(broken)}")
    print(f"  含空格但未加尖括号      {len(bare_space)}  ← 静默失效，CommonMark 不认")
    print()

    def dump(title, items, fmt):
        if not items:
            return
        print(f'--- {title} ---')
        limit = len(items) if show_all else min(40, len(items))
        for it in items[:limit]:
            print('  ' + fmt(it))
        if len(items) > limit:
            print(f'  …还有 {len(items) - limit} 条（--all 看全部）')
        print()

    dump('断链', broken, lambda x: f'{x[0]}:{x[1]}  {x[2]}  ->  {x[3]}')
    dump('含空格未加尖括号', bare_space, lambda x: f'{x[0]}:{x[1]}  {x[2]}')

    return 1 if broken or bare_space else 0


if __name__ == '__main__':
    sys.exit(main())
