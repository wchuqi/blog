---
title: "算法文档知识点源码和测试覆盖矩阵"
date: 2026-06-20
description: "本项目根据 算法 目录下全部 Markdown 文档建立。源码位于 src/main/java/com/example/algo/AlgoLibrary.java，测试位于 src/test/java/com/example/algo/Al…"
tags:
  - "source_code"
  - "algo_java"
category: "源码项目"
---

# 算法文档知识点源码和测试覆盖矩阵

本项目根据 `算法` 目录下全部 Markdown 文档建立。源码位于 `src/main/java/com/example/algo/AlgoLibrary.java`，测试位于 `src/test/java/com/example/algo/AlgoLibraryTest.java`。

## 源码模块覆盖

| 源码分组 | 覆盖知识点 |
| --- | --- |
| `ComplexityBasics` | 输入规模、复杂度、结构选择、HashMap 计数、溢出安全中点 |
| `ArraysStrings` | 数组、字符串、双指针、滑动窗口、两数之和、三数之和、去重、原地移动 |
| `HashPrefixDiff` | 前缀和、区间和、和为 K 子数组、差分数组、取模前缀 |
| `StackQueueHeap` | 栈、队列、双端队列、堆、单调栈、单调队列、最小栈、数据流中位数 |
| `BinarySortSelect` | 二分查找、lower_bound、二分答案、快速选择、排序、区间合并 |
| `LinkedTreeGraph` | 链表、二叉树、图、DFS、BFS、visited、岛屿数量、LCA |
| `BacktrackingSearch` | 回溯、排列、组合、网格 BFS 最短路 |
| `DynamicProgramming` | 一维 DP、二维 DP、背包、子序列、区间 DP、树形 DP、状态压缩、Kadane、LIS、LCS |
| `GreedyGraph` | 贪心、区间、并查集、拓扑排序、最短路、最小生成树 |
| `BitMathRandomized` | 位运算、GCD、筛法、Fisher-Yates、权重随机 |
| `AdvancedStructures` | Trie、树状数组、线段树、LRU、RandomizedSet |
| `Java21Templates` | Java 21 集合模板、排序模板、邻接表模板、Python 模板风险意识 |
| `InterviewWorkflow` | 解题流程、题解表达、错题复盘、边界测试和验收 |

## 文档到源码/测试映射

| 文档 | 对应源码/测试 |
| --- | --- |
| `算法学习资料.md` | 全项目索引，由本矩阵和全部测试覆盖 |
| `算法学习路线图.md` | `ComplexityBasics`、`ArraysStrings`、`HashPrefixDiff`、`StackQueueHeap`、`BinarySortSelect`、`LinkedTreeGraph`、`BacktrackingSearch`、`DynamicProgramming`、`GreedyGraph`、`BitMathRandomized`、`AdvancedStructures` |
| `00-总览与心智模型.md` | `InterviewWorkflow`、`ComplexityBasics`、`CoverageTopic.PROBLEM_SOLVING_FLOW` |
| `01-复杂度和数据结构基础.md` | `ComplexityBasics`、`StackQueueHeap`、`Java21Templates` |
| `02-数组字符串双指针和滑动窗口.md` | `ArraysStrings` |
| `03-哈希表前缀和差分.md` | `HashPrefixDiff`、`ArraysStrings.twoSum` |
| `04-栈队列单调结构和堆.md` | `StackQueueHeap` |
| `05-二分查找排序和选择.md` | `BinarySortSelect` |
| `06-链表树图和遍历.md` | `LinkedTreeGraph` |
| `07-回溯DFS和BFS.md` | `BacktrackingSearch`、`LinkedTreeGraph` |
| `08-动态规划.md` | `DynamicProgramming` |
| `09-贪心并查集和拓扑排序.md` | `GreedyGraph` |
| `10-位运算数学和随机化.md` | `BitMathRandomized` |
| `11-Java21和Python3算法模板.md` | `Java21Templates`、所有 Java 集合和算法实现 |
| `12-LeetCode典型题解.md` | LC1 `twoSum`、LC3 `longestSubstringWithoutRepeat`、LC15 `threeSum`、LC53 `maxSubArray`、LC102 `levelOrder`、LC146 `LruCache`、LC200 `numIslands`、LC300 `lengthOfLIS` |
| `13-面试知识点整理.md` | `InterviewWorkflow`、`TESTING.md` 中测试场景说明 |
| `14-算法完整知识点清单.md` | `CoverageTopic` 51 个主题和全部源码分组 |
| `15-练习计划和验收.md` | `InterviewWorkflow.review`、`TestRunner` 知识点覆盖检查 |
| `面试知识点/01-复杂度和基础结构.md` | `ComplexityBasics`、`StackQueueHeap` |
| `面试知识点/02-数组哈希和双指针.md` | `ArraysStrings`、`HashPrefixDiff` |
| `面试知识点/03-树图搜索和动态规划.md` | `LinkedTreeGraph`、`BacktrackingSearch`、`DynamicProgramming` |
| `面试知识点/04-系统化刷题和场景题.md` | `InterviewWorkflow`、`TESTING.md` |

## 覆盖验证

运行：

```powershell
.\scripts\run-tests.ps1
```

当前结果：

```text
[PASS] AlgoLibraryTest
All tests passed. Knowledge coverage: 100% (51 topics).
```
