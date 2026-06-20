---
title: "测试触发说明"
date: 2026-06-20
description: "在 sourcecode/algojava 目录执行："
tags:
  - "source_code"
  - "algo_java"
category: "源码项目"
---

# 测试触发说明

## 一键触发

在 `source_code/algo_java` 目录执行：

```powershell
.\scripts\run-tests.ps1
```

脚本会做四件事：

1. 收集 `src/main/java` 和 `src/test/java` 下全部 Java 文件。
2. 清理并重新创建 `out/test` 编译目录。
3. 使用 `javac --release 21 -encoding UTF-8` 编译源码和测试。
4. 使用 `java -cp out/test com.example.algo.TestRunner` 运行测试。

## 测试如何组织

项目不使用外部 JUnit，原因是当前仓库其它任务曾遇到 Cargo/Maven 镜像不可达的问题。这里用一个轻量测试运行器保证 JDK 21 原生可运行。

- `Assertions`：提供 `equals`、`arrayEquals`、`matrixEquals`、`isTrue`、`isFalse`。
- `AlgoLibraryTest`：按知识域拆分测试方法。
- `TestRunner`：执行所有测试，并检查 `CoverageTopic` 的 51 个知识点是否全部命中。

## 测试场景

| 测试方法 | 覆盖场景 |
| --- | --- |
| `complexityAndTemplates` | 复杂度估算、结构选择、溢出安全中点、Java 21 模板、Python 模板易错点 |
| `arraysStringsHashPrefixDiff` | 两数之和、滑动窗口、三数之和、移动零、去重、正数窗口、前缀和、差分、取模前缀 |
| `stackQueueHeapAndBinarySearch` | 括号栈、Top K 堆、每日温度、滑动窗口最大值、柱状图、最小栈、数据流中位数、二分、二分答案、快速选择、区间合并 |
| `linkedTreeGraphSearch` | 链表反转/合并/判环、树层序/深度/LCA、邻接表、BFS 距离、DFS 连通块、岛屿数量、全排列、组合总和、网格最短路 |
| `dynamicProgrammingGreedyAndGraphs` | 一维 DP、Kadane、零钱兑换、LIS、LCS、背包、二维路径、区间 DP、树形 DP、状态压缩、贪心、并查集、拓扑排序、Dijkstra、Kruskal MST |
| `bitMathRandomAndAdvancedStructures` | 异或、位计数、GCD、筛质数、Fisher-Yates、权重随机、Trie、Fenwick、SegmentTree、LRU、RandomizedSet |
| `interviewWorkflowAndCoverage` | 面试题解表达、错题复盘、边界用例、知识点覆盖检查 |

## 覆盖率说明

当前项目内置的是“知识点覆盖率”：

- `CoverageTopic` 枚举列出 51 个文档知识点主题。
- 算法源码在对应知识点被执行时调用 `Coverage.hit(...)`。
- `TestRunner` 在所有测试结束后检查是否有遗漏主题。
- 当前验证结果为 `Knowledge coverage: 100% (51 topics)`。

如果后续环境允许引入 JaCoCo，可以再增加字节码行覆盖率报告；当前无外部依赖版本不依赖网络，保证在 JDK 21 下直接可运行。
