---
title: "算法学习资料：回溯、DFS 和 BFS"
date: 2026-06-20
description: "回溯是系统化试错：选择一个分支，继续深入，如果不满足条件就撤销选择，尝试下一个分支。DFS 关注“沿着一条路走到底”，BFS 关注“按层扩散”。在无权图最短路中，BFS 第一次到达目标时通常就是最短距离。"
tags:
  - "算法"
category: "算法"
---

# 算法学习资料：回溯、DFS 和 BFS

[返回索引](../算法学习资料.md)

## 学习目标

- 掌握回溯的选择、撤销和剪枝。
- 理解 DFS 与 BFS 的适用场景。
- 能处理排列、组合、子集、矩阵搜索和最短步数问题。

## 理论导读

回溯是系统化试错：选择一个分支，继续深入，如果不满足条件就撤销选择，尝试下一个分支。DFS 关注“沿着一条路走到底”，BFS 关注“按层扩散”。在无权图最短路中，BFS 第一次到达目标时通常就是最短距离。

## 回溯模板

```python
def backtrack(path, choices):
    if is_done(path):
        ans.append(path.copy())
        return
    for choice in choices:
        if not valid(choice):
            continue
        path.append(choice)
        backtrack(path, next_choices)
        path.pop()
```

## Java 21 示例：全排列

```java
import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> ans = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        backtrack(nums, used, new ArrayList<>(), ans);
        return ans;
    }

    private void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> ans) {
        if (path.size() == nums.length) {
            ans.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            backtrack(nums, used, path, ans);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
```

## Python 3 示例：全排列

```python
class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        ans: list[list[int]] = []
        used = [False] * len(nums)
        path: list[int] = []

        def dfs() -> None:
            if len(path) == len(nums):
                ans.append(path.copy())
                return
            for i, x in enumerate(nums):
                if used[i]:
                    continue
                used[i] = True
                path.append(x)
                dfs()
                path.pop()
                used[i] = False

        dfs()
        return ans
```

## 练习

- LeetCode 39：组合总和。
- LeetCode 46：全排列。
- LeetCode 51：N 皇后。
- LeetCode 79：单词搜索。
- LeetCode 994：腐烂的橘子。

## 验收

- 能说出 path、choices、结束条件分别是什么。
- 能解释 BFS 为什么要按层处理。

> **重点：** 回溯中“选择”和“撤销选择”必须成对出现。
>
> **难点：** 去重排列和组合需要先排序，再按层跳过重复选择。
>
> **易错：** 把 `path` 直接加入答案导致后续修改污染结果，正确做法是加入副本。

