---
title: "测试触发说明"
date: 2026-06-20
description: "在 sourcecode/algopy 目录执行："
tags:
  - "source_code"
  - "algo_py"
category: "源码项目"
---

# 测试触发说明

## 一键触发

在 `source_code/algo_py` 目录执行：

```powershell
.\scripts\run-tests.ps1
```

脚本做两件事：

1. 设置 `PYTHONPATH=src`，让测试可以导入 `algo_py` 包。
2. 执行 `python -m unittest discover -s tests -p "test_*.py" -v`。

## 测试组织

项目使用 Python 标准库 `unittest`，不依赖 pytest/coverage.py 等外部包。

- `knowledge_coverage.py`：定义 51 个知识点主题，并提供命中追踪器。
- `algorithms.py`：每个算法函数执行时标记对应知识点。
- `test_algorithms.py`：按知识域组织单元测试，并在 `tearDownClass` 检查是否有遗漏主题。

## 测试场景

| 测试方法 | 覆盖场景 |
| --- | --- |
| `test_complexity_and_templates` | 复杂度估算、结构选择、安全中点、Python 模板、Java 21 模板意识 |
| `test_arrays_strings_hash_prefix_diff` | 两数之和、滑动窗口、三数之和、移动零、去重、正数窗口、前缀和、差分、取模前缀 |
| `test_stack_queue_heap_and_binary_search` | 括号栈、Top K、每日温度、滑动窗口最大值、柱状图、最小栈、数据流中位数、二分、二分答案、快速选择、区间合并 |
| `test_linked_tree_graph_search` | 链表反转/合并/判环、树层序/深度/LCA、邻接表、BFS 距离、DFS 连通块、岛屿数量、全排列、组合总和、网格最短路 |
| `test_dynamic_programming_greedy_and_graphs` | 一维 DP、Kadane、零钱兑换、LIS、LCS、背包、二维路径、区间 DP、树形 DP、状态压缩、贪心、并查集、拓扑、Dijkstra、Kruskal MST |
| `test_bit_math_random_and_advanced_structures` | 异或、位计数、GCD、筛质数、Fisher-Yates、权重随机、Trie、Fenwick、SegmentTree、LRU、RandomizedSet |
| `test_interview_workflow_and_coverage` | 面试题解表达、错题复盘、边界用例、覆盖主题数量检查 |

## 覆盖率说明

当前项目内置的是“知识点覆盖率”：

- `CoverageTopic` 枚举列出 51 个文档知识点主题。
- 算法源码在对应知识点被执行时调用 `Coverage.hit(...)`。
- 测试结束时检查 `Coverage.missed_topics()` 是否为空。
- 当前验证结果为 `Knowledge coverage: 100% (51 topics)`。

如果后续允许引入 `coverage.py`，可以再补行覆盖率报告；当前版本保持零外部依赖，保证 Python 3.14 直接可运行。
