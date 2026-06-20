---
title: "算法学习资料：Java 21 和 Python 3 算法模板"
date: 2026-06-20
description: "重点： 面试语言要选最稳的，而不是最炫的。"
tags:
  - "算法"
category: "算法"
---

# 算法学习资料：Java 21 和 Python 3 算法模板

[返回索引](../算法学习资料.md)

## 学习目标

- 快速查找 Java 21 和 Python 3 的常用算法写法。
- 避免因为 API 不熟导致面试实现失误。
- 建立自己的模板库。

## Java 21 常用模板

### 哈希计数

```java
Map<Integer, Integer> freq = new HashMap<>();
for (int x : nums) {
    freq.merge(x, 1, Integer::sum);
}
```

### 双端队列

```java
Deque<Integer> dq = new ArrayDeque<>();
dq.offerLast(1);
dq.offerFirst(2);
int a = dq.pollFirst();
int b = dq.peekLast();
```

### 小顶堆和大顶堆

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
```

### 排序

```java
Arrays.sort(nums);
List<int[]> intervals = new ArrayList<>();
intervals.sort(Comparator.comparingInt(a -> a[0]));
```

### 图邻接表

```java
List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
graph.get(u).add(v);
```

### BFS

```java
Queue<Integer> q = new ArrayDeque<>();
boolean[] visited = new boolean[n];
q.offer(start);
visited[start] = true;
while (!q.isEmpty()) {
    int cur = q.poll();
    for (int next : graph.get(cur)) {
        if (visited[next]) continue;
        visited[next] = true;
        q.offer(next);
    }
}
```

### DFS

```java
void dfs(int cur, List<List<Integer>> graph, boolean[] visited) {
    visited[cur] = true;
    for (int next : graph.get(cur)) {
        if (!visited[next]) dfs(next, graph, visited);
    }
}
```

## Python 3 常用模板

### 哈希计数

```python
from collections import Counter, defaultdict

freq = Counter(nums)
count = defaultdict(int)
for x in nums:
    count[x] += 1
```

### 双端队列

```python
from collections import deque

q = deque([start])
q.append(x)
y = q.popleft()
```

### 堆

```python
import heapq

heap = []
heapq.heappush(heap, x)
smallest = heapq.heappop(heap)

max_heap = []
heapq.heappush(max_heap, -x)
largest = -heapq.heappop(max_heap)
```

### 排序

```python
nums.sort()
intervals.sort(key=lambda x: x[0])
```

### 递归深度

```python
import sys
sys.setrecursionlimit(1_000_000)
```

### BFS

```python
from collections import deque

q = deque([start])
visited = {start}
while q:
    cur = q.popleft()
    for nxt in graph[cur]:
        if nxt in visited:
            continue
        visited.add(nxt)
        q.append(nxt)
```

### DFS

```python
def dfs(cur: int) -> None:
    visited.add(cur)
    for nxt in graph[cur]:
        if nxt not in visited:
            dfs(nxt)
```

## Java 与 Python 选择建议

| 场景 | Java 21 | Python 3 |
| --- | --- | --- |
| 后端岗位现场面试 | 类型清晰，贴近岗位 | 写得快，但要注意性能 |
| 图和 DP 大数组 | 性能稳定 | 可能需要优化和调递归限制 |
| 字符串和哈希题 | API 稍重 | 表达简洁 |
| 设计题 | 类结构清晰 | 快速实现方便 |

## 验收

- 能不查资料写出哈希计数、堆、BFS、DFS、二分。
- 能知道 Java 和 Python 各自容易超时或写错的地方。

> **重点：** 面试语言要选最稳的，而不是最炫的。
>
> **易错：** Python 默认递归深度较低；Java `Stack` 类不推荐，优先用 `ArrayDeque`。

