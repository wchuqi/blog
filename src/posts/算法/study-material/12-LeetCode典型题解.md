---
title: "算法学习资料：LeetCode 典型题解"
date: 2026-06-20
description: "这份题解选择覆盖面较高的经典题，每题给出思路、复杂度、Java 21 和 Python 3 写法。后续刷题时可以按这里的格式继续追加。"
tags:
  - "算法"
category: "算法"
---

# 算法学习资料：LeetCode 典型题解

[返回索引](../算法学习资料.md)

这份题解选择覆盖面较高的经典题，每题给出思路、复杂度、Java 21 和 Python 3 写法。后续刷题时可以按这里的格式继续追加。

## LeetCode 1：两数之和

题型：哈希表。

思路：扫描数组时，用哈希表保存“数值 -> 下标”。当前数为 `x`，如果 `target - x` 已经出现，就找到答案。

复杂度：时间 `O(n)`，空间 `O(n)`。

### Java 21

```java
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                return new int[] {seen.get(need), i};
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
```

### Python 3

```python
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen: dict[int, int] = {}
        for i, x in enumerate(nums):
            need = target - x
            if need in seen:
                return [seen[need], i]
            seen[x] = i
        return []
```

> **易错：** 先把所有数放入哈希表再查，可能把同一个元素用两次。

## LeetCode 3：无重复字符的最长子串

题型：滑动窗口。

思路：`left` 表示当前无重复窗口左边界，哈希表记录字符最后出现位置。遇到重复字符时，只能把 `left` 向右移动，不能回退。

复杂度：时间 `O(n)`，空间 `O(k)`，`k` 是字符集大小。

### Java 21

```java
import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int left = 0, ans = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (last.containsKey(c)) {
                left = Math.max(left, last.get(c) + 1);
            }
            last.put(c, right);
            ans = Math.max(ans, right - left + 1);
        }
        return ans;
    }
}
```

### Python 3

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last: dict[str, int] = {}
        left = ans = 0
        for right, ch in enumerate(s):
            if ch in last:
                left = max(left, last[ch] + 1)
            last[ch] = right
            ans = max(ans, right - left + 1)
        return ans
```

## LeetCode 15：三数之和

题型：排序 + 双指针。

思路：先排序，枚举第一个数，然后在右侧用双指针寻找两数和。为了避免重复，枚举值和指针移动时都要跳过重复值。

复杂度：时间 `O(n^2)`，空间取决于排序实现。

### Java 21

```java
import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> ans = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            if (nums[i] > 0) break;
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    ans.add(List.of(nums[i], nums[left], nums[right]));
                    left++;
                    right--;
                    while (left < right && nums[left] == nums[left - 1]) left++;
                    while (left < right && nums[right] == nums[right + 1]) right--;
                } else if (sum < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return ans;
    }
}
```

### Python 3

```python
class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        ans: list[list[int]] = []
        n = len(nums)
        for i in range(n - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            if nums[i] > 0:
                break
            left, right = i + 1, n - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if total == 0:
                    ans.append([nums[i], nums[left], nums[right]])
                    left += 1
                    right -= 1
                    while left < right and nums[left] == nums[left - 1]:
                        left += 1
                    while left < right and nums[right] == nums[right + 1]:
                        right -= 1
                elif total < 0:
                    left += 1
                else:
                    right -= 1
        return ans
```

## LeetCode 53：最大子数组和

题型：动态规划 / Kadane 算法。

思路：`cur` 表示以当前元素结尾的最大子数组和。要么接在前面，要么从当前元素重新开始。

复杂度：时间 `O(n)`，空间 `O(1)`。

### Java 21

```java
class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0], ans = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            ans = Math.max(ans, cur);
        }
        return ans;
    }
}
```

### Python 3

```python
class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        cur = ans = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            ans = max(ans, cur)
        return ans
```

## LeetCode 102：二叉树的层序遍历

题型：BFS。

思路：队列保存当前层节点。每轮先记录队列长度，只处理这一层节点，再加入下一层。

复杂度：时间 `O(n)`，空间 `O(w)`，`w` 是最大层宽。

### Java 21

```java
import java.util.*;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> ans = new ArrayList<>();
        if (root == null) return ans;
        Queue<TreeNode> q = new ArrayDeque<>();
        q.offer(root);
        while (!q.isEmpty()) {
            int size = q.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll();
                level.add(node.val);
                if (node.left != null) q.offer(node.left);
                if (node.right != null) q.offer(node.right);
            }
            ans.add(level);
        }
        return ans;
    }
}
```

### Python 3

```python
from collections import deque
from typing import Optional

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> list[list[int]]:
        if root is None:
            return []
        ans = []
        q = deque([root])
        while q:
            level = []
            for _ in range(len(q)):
                node = q.popleft()
                level.append(node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            ans.append(level)
        return ans
```

## LeetCode 146：LRU 缓存

题型：哈希表 + 双向链表 / 有序字典。

思路：哈希表负责 `O(1)` 定位节点，双向链表负责维护最近使用顺序。访问或更新时把节点移动到头部，容量超限时删除尾部。

复杂度：`get` 和 `put` 都是 `O(1)`。

### Java 21

```java
import java.util.*;

class LRUCache {
    private final int capacity;
    private final LinkedHashMap<Integer, Integer> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true);
    }

    public int get(int key) {
        return map.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        map.put(key, value);
        if (map.size() > capacity) {
            Iterator<Integer> it = map.keySet().iterator();
            it.next();
            it.remove();
        }
    }
}
```

### Python 3

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.data: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key: int, value: int) -> None:
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
```

> **重点：** 面试官如果要求手写双向链表，就不能只用库。若未限制，库写法可以快速表达机制。

## LeetCode 200：岛屿数量

题型：矩阵 DFS / BFS。

思路：遍历每个格子，遇到陆地就答案加一，并用 DFS 或 BFS 把同一岛屿全部标记为水。

复杂度：时间 `O(mn)`，空间取决于递归栈或队列。

### Java 21

```java
class Solution {
    private int rows;
    private int cols;

    public int numIslands(char[][] grid) {
        rows = grid.length;
        cols = grid[0].length;
        int ans = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == '1') {
                    ans++;
                    dfs(grid, r, c);
                }
            }
        }
        return ans;
    }

    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c);
        dfs(grid, r - 1, c);
        dfs(grid, r, c + 1);
        dfs(grid, r, c - 1);
    }
}
```

### Python 3

```python
class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        rows, cols = len(grid), len(grid[0])

        def dfs(r: int, c: int) -> None:
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != "1":
                return
            grid[r][c] = "0"
            dfs(r + 1, c)
            dfs(r - 1, c)
            dfs(r, c + 1)
            dfs(r, c - 1)

        ans = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    ans += 1
                    dfs(r, c)
        return ans
```

## LeetCode 300：最长递增子序列

题型：动态规划 / 贪心 + 二分。

思路：维护数组 `tails`，`tails[i]` 表示长度为 `i + 1` 的递增子序列中，最小可能结尾值。结尾越小，后续越容易接新元素。

复杂度：时间 `O(n log n)`，空间 `O(n)`。

### Java 21

```java
class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];
        int size = 0;
        for (int x : nums) {
            int left = 0, right = size;
            while (left < right) {
                int mid = left + (right - left) / 2;
                if (tails[mid] < x) left = mid + 1;
                else right = mid;
            }
            tails[left] = x;
            if (left == size) size++;
        }
        return size;
    }
}
```

### Python 3

```python
from bisect import bisect_left

class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        tails: list[int] = []
        for x in nums:
            i = bisect_left(tails, x)
            if i == len(tails):
                tails.append(x)
            else:
                tails[i] = x
        return len(tails)
```

> **难点：** `tails` 不一定是真实的最终子序列，它维护的是不同长度下的最优结尾。

