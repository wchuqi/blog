---
title: Markdown 写作语法速查
date: 2026-06-08
description: 一篇用来测试各种 Markdown 渲染效果的文章，涵盖标题、列表、代码、表格、数学符号、任务列表等。
tags:
  - "Markdown"
  - "教程"
category: 技术
---

这篇文章用来演示并测试博客对各种 Markdown 语法的渲染效果。

如果你还没看过项目说明，可以先回到 [[hello-world|博客搭建说明]]。

## 标题层级

目录（TOC）会自动抓取 `h2` 和 `h3`，点击可以跳转。

### 这是一个三级标题

### 另一个三级标题

## 文本样式

普通段落里可以用 **加粗**、*斜体*、~~删除线~~、`行内代码`，以及 [外部链接](https://github.com)。

## 列表

无序列表：

- 苹果
- 香蕉
  - 嵌套项
  - 另一个嵌套项
- 橙子

有序列表：

1. 第一步
2. 第二步
3. 第三步

任务列表（GFM）：

- [x] 搭建项目骨架
- [x] 写文章加载逻辑
- [ ] 部署上线

## 代码块

```javascript
// 斐波那契数列
function fib(n) {
  let [a, b] = [0, 1]
  for (let i = 0; i < n; i++) {
    ;[a, b] = [b, a + b]
  }
  return a
}
```

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)
```

## 表格

| 语言 | 类型 | 诞生年份 |
| --- | --- | --- |
| Python | 动态 | 1991 |
| TypeScript | 静态 | 2012 |
| Rust | 静态 | 2010 |

## 引用

> 过早的优化是万恶之源。
>
> —— Donald Knuth

## 分割线

---

以上就是常见语法。换行、空格、缩进都会被正确处理。
