---
title: "算法文档知识点源码和测试覆盖矩阵"
date: 2026-06-20
description: "本项目根据 算法 目录下全部 Markdown 文档建立。源码位于 src/algopy/algorithms.py，测试位于 tests/testalgorithms.py。"
tags:
  - "source_code"
  - "algo_py"
category: "源码项目"
---

# 算法文档知识点源码和测试覆盖矩阵

本项目根据 `算法` 目录下全部 Markdown 文档建立。源码位于 `src/algo_py/algorithms.py`，测试位于 `tests/test_algorithms.py`。

## 源码分组覆盖

| 源码能力 | 覆盖知识点 |
| --- | --- |
| 复杂度和模板 | 输入规模、复杂度、结构选择、Python 模板、Java 21 模板意识、安全中点 |
| 数组字符串 | 数组、字符串、双指针、滑动窗口、两数之和、三数之和、去重、原地移动 |
| 哈希前缀差分 | 哈希表、前缀和、区间和、和为 K 子数组、差分数组、取模前缀 |
| 栈队列堆 | 栈、队列、双端队列、堆、单调栈、单调队列、最小栈、数据流中位数 |
| 二分排序选择 | 二分查找、lower_bound、二分答案、快速选择、排序、区间合并 |
| 链表树图 | 链表、二叉树、图、DFS、BFS、visited、岛屿数量、LCA |
| 回溯搜索 | 排列、组合、网格 BFS 最短路 |
| 动态规划 | 一维 DP、二维 DP、背包、子序列、区间 DP、树形 DP、状态压缩、Kadane、LIS、LCS |
| 贪心和图算法 | 贪心、区间、并查集、拓扑排序、最短路、最小生成树 |
| 位运算数学随机化 | 异或、位计数、GCD、筛法、Fisher-Yates、权重随机 |
| 高级结构 | Trie、树状数组、线段树、LRU、RandomizedSet |
| 面试复盘 | 解题流程、题解表达、错题复盘、边界测试和验收 |

## 文档到源码/测试映射

| 文档 | 对应源码/测试 |
| --- | --- |
| `算法学习资料.md` | 全项目索引，由本矩阵和全部测试覆盖 |
| `算法学习路线图.md` | `algorithms.py` 全部能力分组 |
| `00-总览与心智模型.md` | `analyze_two_sum`、`review`、`has_complete_explanation` |
| `01-复杂度和数据结构基础.md` | `fits_input_size`、`frequency_count`、`choose_structure` |
| `02-数组字符串双指针和滑动窗口.md` | `two_sum`、`longest_substring_without_repeat`、`three_sum`、`move_zeroes`、`min_subarray_len_positive` |
| `03-哈希表前缀和差分.md` | `prefix_sums`、`range_sum`、`subarray_sum_equals_k`、`apply_range_adds`、`subarrays_div_by_k` |
| `04-栈队列单调结构和堆.md` | `valid_parentheses`、`top_k_frequent`、`daily_temperatures`、`sliding_window_max`、`largest_rectangle_area`、`MinStack`、`MedianFinder` |
| `05-二分查找排序和选择.md` | `binary_search_closed`、`lower_bound`、`min_eating_speed`、`kth_largest`、`merge_intervals` |
| `06-链表树图和遍历.md` | `reverse_list`、`merge_two_lists`、`has_cycle`、`level_order`、`max_depth`、`lowest_common_ancestor`、`adjacency_list`、`bfs_distances`、`connected_components` |
| `07-回溯DFS和BFS.md` | `permute`、`combination_sum`、`shortest_path_in_grid`、`num_islands` |
| `08-动态规划.md` | `climb_stairs`、`max_subarray`、`coin_change`、`length_of_lis`、`longest_common_subsequence`、`can_partition`、`min_path_sum`、`matrix_chain_min_cost`、`rob_tree`、`count_subsets_with_mask` |
| `09-贪心并查集和拓扑排序.md` | `can_jump`、`erase_overlap_intervals`、`UnionFind`、`can_finish_courses`、`dijkstra`、`minimum_spanning_tree_weight` |
| `10-位运算数学和随机化.md` | `single_number`、`hamming_weight`、`gcd`、`count_primes`、`fisher_yates`、`weighted_pick` |
| `11-Java21和Python3算法模板.md` | `python_templates_demo`、`java21_template_awareness`、集合/堆/队列/排序/递归相关实现 |
| `12-LeetCode典型题解.md` | LC1、LC3、LC15、LC53、LC102、LC146、LC200、LC300 对应函数 |
| `13-面试知识点整理.md` | `analyze_two_sum`、`review`、`TESTING.md` 测试场景 |
| `14-算法完整知识点清单.md` | `CoverageTopic` 51 个主题和全部测试 |
| `15-练习计划和验收.md` | `review`、`Coverage.missed_topics`、`test_interview_workflow_and_coverage` |
| `面试知识点/01-复杂度和基础结构.md` | 复杂度、结构选择、栈队列相关测试 |
| `面试知识点/02-数组哈希和双指针.md` | 数组、哈希、双指针、滑动窗口相关测试 |
| `面试知识点/03-树图搜索和动态规划.md` | 树、图、DFS/BFS、DP 相关测试 |
| `面试知识点/04-系统化刷题和场景题.md` | 面试表达、错题复盘、边界用例相关测试 |

## 覆盖验证

运行：

```powershell
.\scripts\run-tests.ps1
```

当前结果：

```text
Ran 7 tests
OK
Knowledge coverage: 100% (51 topics).
```
