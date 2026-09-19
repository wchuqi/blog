# 站内链接体检报告

生成时间：本次改造后（`python scripts/check-links.py --all` 可复现）

## 汇总

| 项 | 数量 |
|---|---|
| 扫描文章 | 11356 |
| `[[双链]]` | 10 |
| Markdown 链接 | 3097 |
| **解析失败（真断链）** | **13** |
| 含空格但未加尖括号（静默失效） | 0 |

改造前：图谱只有 80 条边（因为只认 `[[双链]]`，而全站只有 10 处）；
3097 条 Markdown 链接虽然存在，但既进不了图谱，渲染时也因 href 未解码而全部 404。

## 13 条真断链

都是内容层面的问题（引用了不存在的文件），不是代码问题。**代码侧已修完，这些需要写内容或改链接。**

### A. `AI/工程实践/AI Agent Loop Engineering.md:30`（1 条）

```markdown
[返回索引](<./AI Agent Loop Engineering学习资料.md>)
```

指向 `AI/工程实践/AI Agent Loop Engineering学习资料.md`，但该目录下只有
`AI Agent Loop Engineering.md` 本身。**目录名与文件名不匹配**——入口页实际在
`AI/AI Agent Loop Engineering.md`（上一级目录）。

修法二选一：
- 改链接为 `../AI Agent Loop Engineering.md`
- 或把该文件移进 `AI/工程实践/AI Agent Loop Engineering/` 目录并改名
  （后者会让它变成一个主题，符合 `lib/topics.ts` 的约定）

### B. `框架/SpringBoot框架/SpringBoot4学习资料.md:58-68`（11 条）

链接表指向 `study-material/23-*` 到 `33-*`，但这些文件**从未创建**。
`study-material/` 里只有 `01-*` 到 `22-*` 加 `SpringBoot4-*` 三个文件。

看起来是 SpringBoot4 索引页从 SpringBoot（旧版）索引页**复制**了表格，
而旧版有 33 个文件、4.x 版只写到 22。

修法：删掉表格里 23–33 行，或补齐这些文件。

### C. `框架/SpringBoot框架/study-material/SpringBoot4-13-面试知识点整理.md:40`（1 条）

```markdown
[07-架构级深水区场景题.md](面试知识点/07-架构级深水区场景题.md)
```

`面试知识点/` 下只有 `01-*` 到 `06-*`，没有 07。

## 已修复的历史问题（供参考）

1. **3097 条站内链接全部 404**：`resolveMarkdownPostHref` 收到的 href 是
   percent-encoded 的，与中文 slug 比对永远失败，链接原样渲染成
   `<a href="xx.md">`，被 SPA 当相对路径解析。
2. **222 处含空格链接静默失效**：`](../AI RAG学习资料.md)` 在 CommonMark 里
   不是链接（GitHub 同样不认）。已批量改为 `](<../AI RAG学习资料.md>)`。
3. **图谱只认 `[[双链]]`**：全站只有 10 处双链，却忽略 3097 处 Markdown 链接。
