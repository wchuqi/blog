+++
author = "peach"
title = "Algo"
date = "2025-08-17"
description = "Algo go go go!!!"
categories = [
    "Algo"
]
tags = [
    "Algo",
]
image = "the-creative-exchange-d2zvqp3fpro-unsplash.jpg"
+++

[https://algo.itcharge.cn/](https://algo.itcharge.cn/)

[https://chat.qwen.ai/](https://chat.qwen.ai/)


# 算法

## 常用数据结构&API

```java
// List<Integer> -> int[]
List<Integer> res = new ArrayList<>();
int[] res_1 = res.stream()
        .mapToInt(Number::intValue) // Integer转int
        .toArray();
```

<br>

```java
// 在 Java 17 中，将 Deque<Character> 转换为 String
Deque<Character> deque = new ArrayDeque<>();
deque.add('H');
deque.add('e');
deque.add('l');
deque.add('l');
deque.add('o');

✅ 优点：性能好、内存利用率高、适合大字符集。
StringBuilder sb = new StringBuilder();
for (char c : deque) {
    sb.append(c);
}
String result = sb.toString();
System.out.println(result); // "Hello"

✅ 优点：代码简洁，适合函数式编程风格
⚠️ 注意：性能略低于 StringBuilder，小数据量无感
String result = deque.stream()
                     .map(String::valueOf)  // 将 Character 转为 String
                     .collect(Collectors.joining());
System.out.println(result); // "Hello"
```

### java.util.HashMap

基于哈希表（Hash Table） 实现的 Map 接口，提供高效的增删改查操作，平均时间复杂度为 O(1)。

不保证元素的顺序（插入顺序、自然顺序）。

JDK 8+ 新增的便捷方法（函数式增强）

```java
// 获取值，若不存在则返回默认值
getOrDefault(Object key, V defaultValue)
// 若键不存在才插入
putIfAbsent(K key, V value)
// 若键不存在，则用函数计算值并放入
computeIfAbsent(K key, Function mappingFunction)

// 合并值（如统计词频）
merge(K key, V value, BiFunction<V,V,V> remappingFunction)
// 遍历键值对（函数式）
forEach(BiConsumer<K,V>)

int count = map.getOrDefault("orange", 0); // 如果没有 orange，返回 0
map.putIfAbsent("apple", 99); // 只有 apple 不存在时才设置
// 构建 Map<String, List<String>> 防止空指针
Map<String, List<String>> grouped = new HashMap<>();
grouped.computeIfAbsent("group1", k -> new ArrayList<>())
        .add("item1");

Map<String, Integer> wordCount = new HashMap<>();
String[] words = {"hello", "world", "hello", "java"};
for (String word : words) {
    wordCount.merge(word, 1, Integer::sum);
}
// 结果: {hello=2, world=1, java=1}

map.forEach((key, value) -> System.out.println(key + ": " + value));
```

### java.util.TreeMap

基于红黑树（Red-Black Tree）实现的**有序**映射（SortedMap），它会根据键（key）的自然顺序或自定义比较器进行排序。

适用场景
- 需要按键有序存储（如排行榜、时间轴）
- 范围查询（如查找 10~50 分之间的学生）
- 查找“最接近”的键（floorKey, ceilingKey）
- 实现 LRU 缓存的有序管理（配合双向链表）

基础增删查改

```java
put(K key, V value)	// 插入键值对，若键已存在则替换值
get(Object key)	// 获取指定键的值，不存在返回null
remove(Object key)	// 删除指定键的映射
containsKey(Object key)	// 判断是否包含某个键
containsValue(Object value)	// 判断是否包含某个值（较慢，O(n)）
size()	// 返回映射数量
isEmpty()	// 是否为空
```

有序性相关方法
```java
firstKey()/firstEntry()	// 返回最小键 / 最小键值对
lastKey()/lastEntry()	// 返回最大键 / 最大键值对
lowerKey(K key)/lowerEntry(K key)	// 返回小于给定键的最大键及其映射
floorKey(K key)/floorEntry(K key)	// 返回小于等于给定键的最大键
ceilingKey(K key)/ceilingEntry(K key)	// 返回大于等于给定键的最小键
higherKey(K key)/higherEntry(K key)	// 返回大于给定键的最小键
pollFirstEntry()	// 获取并移除最小键值对
pollLastEntry()	// 获取并移除最大键值对

TreeMap<Integer, String> map = new TreeMap<>();
map.put(10, "A");
map.put(20, "B");
map.put(30, "C");

System.out.println(map.firstKey());        // 10
System.out.println(map.lastKey());         // 30
System.out.println(map.lowerKey(25));      // 20
System.out.println(map.ceilingKey(25));    // 30
System.out.println(map.floorKey(20));      // 20
System.out.println(map.higherKey(20));     // 30

System.out.println(map.pollFirstEntry());  // 10=A
System.out.println(map.size());            // 2
```

子映射（Submap）操作
```java
subMap(K fromKey, K toKey)	// 返回[fromKey, toKey)范围的视图
headMap(K toKey)	// 返回小于toKey的所有键的视图
tailMap(K fromKey)	// 返回大于等于fromKey的所有键的视图
subMap(K from, boolean inclusive, K to, boolean inclusive)	// 可指定是否包含边界

TreeMap<Integer, String> map = new TreeMap<>();
map.put(10, "A");
map.put(20, "B");
map.put(30, "C");
map.put(40, "D");

SortedMap<Integer, String> sub = map.subMap(15, 35); // [20, 30)
System.out.println(sub); // {20=B, 30=C}

SortedMap<Integer, String> head = map.headMap(25);   // < 25
System.out.println(head); // {10=A, 20=B}

SortedMap<Integer, String> tail = map.tailMap(30);   // >= 30
System.out.println(tail); // {30=C, 40=D}
```

遍历方式
```java
遍历 Entry（推荐）
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

遍历 Key
for (String key : map.keySet()) {
    System.out.println(key);
}

使用 Iterator（可删除）
Iterator<Map.Entry<Integer, String>> it = map.entrySet().iterator();
while (it.hasNext()) {
    Map.Entry<Integer, String> entry = it.next();
    if (entry.getValue().equals("B")) {
        it.remove(); // 安全删除
    }
}
```

### java.util.ArrayDeque

高性能双端队列，性能优于 LinkedList 和旧的 Stack 类。不允许 null

作为双端队列使用（头尾操作）
```java
offer/poll/peek // 方法更安全，失败时返回 null 或 false，而 add/remove/get 失败抛异常。

addFirst(e)/offerFirst(e)	// 在头部添加元素
addLast(e)/offerLast(e)	// 在尾部添加元素

removeFirst()/pollFirst()	// 移除并返回头部元素
removeLast()/pollLast()	// 移除并返回尾部元素

getFirst()/peekFirst()	// 查看头部元素（不删除）
getLast()/peekLast()	// 查看尾部元素（不删除）
```

作为普通队列使用（FIFO）
```java
offer(e)/add(e)	// 入队（等价于addLast）

poll()/remove()	// 出队（等价于removeFirst）

peek()/element()	// 查看队首
```

作为栈使用（LIFO）推荐替代 Stack 类
```java
push(e)	// 入栈（等价于addFirst）
pop()	// 出栈（等价于removeFirst）
peek()	// 查看栈顶
```

其他常用方法
```java
size()	// 返回元素个数
isEmpty()	// 是否为空
contains(Object o)	// 是否包含某元素
iterator()	// 返回从头到尾的迭代器
descendingIterator()	// 返回从尾到头的迭代器
```

<br>

```java
// 创建空的双端队列
ArrayDeque<Integer> deque = new ArrayDeque<>();
// 指定初始容量（可选）
ArrayDeque<String> deque2 = new ArrayDeque<>(16);

ArrayDeque<Integer> deque = new ArrayDeque<>();
deque.addLast(10);     // [10]
deque.addLast(20);     // [10, 20]
deque.addFirst(5);     // [5, 10, 20]

System.out.println(deque.getFirst());  // 5
System.out.println(deque.getLast());   // 20

System.out.println(deque.removeFirst()); // 5 → [10, 20]
System.out.println(deque.removeLast());  // 20 → [10]

ArrayDeque<String> queue = new ArrayDeque<>();
queue.offer("A"); // A
queue.offer("B"); // A B
queue.offer("C"); // A B C

while (!queue.isEmpty()) {
    System.out.print(queue.poll() + " "); // A B C
}

ArrayDeque<Integer> stack = new ArrayDeque<>();
stack.push(1); // 1
stack.push(2); // 2 1
stack.push(3); // 3 2 1

System.out.println(stack.peek()); // 3
System.out.println(stack.pop());  // 3
System.out.println(stack.pop());  // 2

ArrayDeque<Integer> deque = new ArrayDeque<>();
deque.add(1); // 1
deque.add(2); // 1 2
deque.add(3); // 1 2 3

// 正向遍历
for (Integer n : deque) {
    System.out.print(n + " "); // 1 2 3
}

// 反向遍历（适合栈遍历）
Iterator<Integer> it = deque.descendingIterator();
while (it.hasNext()) {
    System.out.print(it.next() + " "); // 3 2 1
}
```

用 ArrayDeque 实现回文检查
```java
import java.util.ArrayDeque;
import java.util.Deque;

public class PalindromeChecker {
    public static boolean isPalindrome(String str) {
        Deque<Character> deque = new ArrayDeque<>();
        String cleaned = str.toLowerCase().replaceAll("[^a-z0-9]", "");

        for (char c : cleaned.toCharArray()) {
            deque.addLast(c);
        }

        while (deque.size() > 1) {
            if (!deque.removeFirst().equals(deque.removeLast())) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome("A man a plan a canal Panama")); // true
        System.out.println(isPalindrome("race a car")); // false
    }
}
```


### java.util.Arrays

- 排序前记得 sort()，否则 binarySearch() 结果错误。
- 修改 asList() 返回的 List 会抛异常，如需修改请用 new ArrayList<>(Arrays.asList(arr))。
- 多维数组比较用 deepEquals()，打印用 deepToString()。
- 大数据量处理优先使用 Arrays.stream() 配合 Lambda。

用途：将一维数组转换为可读的字符串格式。
```java
int[] arr = {3, 1, 4, 1, 5};
System.out.println(Arrays.toString(arr)); // 输出: [3, 1, 4, 1, 5]
int[] arr = {3, 1, 4, 1, 5};
Arrays.sort(arr);
System.out.println(Arrays.toString(arr)); // [1, 1, 3, 4, 5]

Arrays.deepToString(multiArray)
用途：打印多维数组（如二维数组）。
int[][] matrix = {{1, 2}, {3, 4}, {5, 6}};
System.out.println(Arrays.deepToString(matrix)); 
// [[1, 2], [3, 4], [5, 6]]

用途：对数组进行排序（升序），使用优化的快速排序/归并排序算法。
// 字符串数组排序（字典序）
String[] strs = {"Java", "C++", "Python"};
Arrays.sort(strs);
System.out.println(Arrays.toString(strs)); // [C++, Java, Python]

自定义排序（配合 Comparator）
Integer[] nums = {3, 1, 4, 1, 5};
Arrays.sort(nums, Collections.reverseOrder()); // 降序
System.out.println(Arrays.toString(nums)); // [5, 4, 3, 1, 1]

Arrays.binarySearch(array, key)
用途：在已排序的数组中使用二分查找，返回目标元素的索引，找不到返回负值。
int[] arr = {1, 3, 4, 5, 7, 9};
int index = Arrays.binarySearch(arr, 5);
System.out.println("5 的索引: " + index); // 3
int notFound = Arrays.binarySearch(arr, 6);
System.out.println("6 的索引: " + notFound); // -5（插入点为 -(-5)-1=4）

Arrays.copyOf(original, newLength)
用途：复制数组，可以指定新长度（支持扩容或截断）。
int[] arr = {1, 2, 3};
int[] copy = Arrays.copyOf(arr, 5); // 扩容到5，补0
System.out.println(Arrays.toString(copy)); // [1, 2, 3, 0, 0]
int[] shorter = Arrays.copyOf(arr, 2); // 截断
System.out.println(Arrays.toString(shorter)); // [1, 2]

Arrays.copyOfRange(original, from, to)
用途：复制数组的指定范围 [from, to)（左闭右开）。
int[] arr = {1, 2, 3, 4, 5};
int[] range = Arrays.copyOfRange(arr, 1, 4);
System.out.println(Arrays.toString(range)); // [2, 3, 4]

Arrays.equals(array1, array2)
用途：判断两个数组是否“相等”（长度相同且对应元素相等）。
int[] a = {1, 2, 3};
int[] b = {1, 2, 3};
System.out.println(Arrays.equals(a, b)); // true
int[] c = {1, 2};
System.out.println(Arrays.equals(a, c)); // false

Arrays.fill(array, value)
用途：用指定值填充整个数组或部分范围。
int[] arr = new int[5];
Arrays.fill(arr, 7);
System.out.println(Arrays.toString(arr)); // [7, 7, 7, 7, 7]
// 填充部分
Arrays.fill(arr, 1, 4, 9); // 索引 [1,4) 填为 9
System.out.println(Arrays.toString(arr)); // [7, 9, 9, 9, 7]

Arrays.asList(array)
用途：将数组转换为 List，但注意：返回的是固定大小的 List，不能增删元素。
String[] strs = {"Java", "Python", "Go"};
List<String> list = Arrays.asList(strs);
System.out.println(list); // [Java, Python, Go]
// ❌ list.add("Rust"); // 抛出 UnsupportedOperationException

Arrays.stream(array)（Java 8+）
用途：将数组转换为 Stream，便于使用函数式编程。
int[] numbers = {1, 2, 3, 4, 5};
int sum = Arrays.stream(numbers).sum();
System.out.println("总和: " + sum); // 15
// 过滤并打印偶数
Arrays.stream(numbers)
      .filter(n -> n % 2 == 0)
      .forEach(System.out::println);
```


### java.util.TreeSet

特点：
- 有序（默认自动升序）
- 去重集合
- 不允许null
- 插入、删除、查找时间复杂度：O(log n)

基本操作
```java
add(E e)	// 添加元素
remove(Object o)	// 删除元素
contains(Object o)	// 判断是否包含元素
size()	// 返回元素个数
isEmpty()	// 是否为空

Set<Integer> set_1 = new TreeSet<>();
set_1.add(3);
set_1.add(1);
set_1.add(2);
System.out.println(set_1); // [1, 2, 3]

Set<Integer> set_2 = new TreeSet<>(new Comparator<Integer>() {
    @Override
    public int compare(Integer o1, Integer o2) {
        return o2 - o1;
    }
});
// 或者
// Set<Integer> set_2 = new TreeSet<>((o1, o2) -> o2 - o1);
// TreeSet<Integer> set_2 = new TreeSet<>((a, b) -> b.compareTo(a));
set_2.add(1);
set_2.add(3);
set_2.add(2);
System.out.println(set_2); // [3, 2, 1]

System.out.println("集合: " + set);        // [5, 10, 20]
System.out.println("大小: " + set.size()); // 3
System.out.println("包含10? " + set.contains(10)); // true
set.remove(20);
```

排序相关方法
```java
first()	// 返回最小元素
last()	// 返回最大元素
headSet(E toElement)	// 返回小于toElement的子集（不包含 toElement）
tailSet(E fromElement)	// 返回大于等于fromElement的子集
subSet(E from, E to)	// 返回[from, to)范围内的子集

TreeSet<Integer> set = new TreeSet<>();
set.addAll(Arrays.asList(5, 10, 15, 20, 25));

System.out.println("最小值: " + set.first());  // 5
System.out.println("最大值: " + set.last());   // 25
System.out.println("小于15: " + set.headSet(15));   // [5, 10]
System.out.println("大于等于15: " + set.tailSet(15)); // [15, 20, 25]
System.out.println("10到20之间: " + set.subSet(10, 20)); // [10, 15]
```

实用方法
```java
lower(E e)	// 返回小于e的最大元素，不存在则返回null
floor(E e)	// 返回小于等于e的最大元素
higher(E e)	// 返回大于e的最小元素
ceiling(E e)	// 返回大于等于e的最小元素
pollFirst()	// 获取并移除最小元素
pollLast()	// 获取并移除最大元素

TreeSet<Integer> set = new TreeSet<>();
set.addAll(Arrays.asList(5, 10, 15, 20));

System.out.println("lower(12): " + set.lower(12));   // 10
System.out.println("floor(10): " + set.floor(10));   // 10
System.out.println("higher(12): " + set.higher(12)); // 15
System.out.println("ceiling(10): " + set.ceiling(10)); // 10

System.out.println("弹出最小: " + set.pollFirst()); // 5
System.out.println("当前集合: " + set);             // [10, 15, 20]

System.out.println("弹出最大: " + set.pollLast());  // 20
System.out.println("当前集合: " + set);             // [10, 15]
```

遍历方式
```java
TreeSet<Integer> set = new TreeSet<>(Arrays.asList(3, 1, 4, 1, 5));

// 方式1：增强 for 循环
for (Integer num : set) {
    System.out.print(num + " "); // 1 3 4 5
}

// 方式2：迭代器（升序）
Iterator<Integer> it = set.iterator();
while (it.hasNext()) {
    System.out.print(it.next() + " ");
}

// 方式3：降序遍历
Iterator<Integer> descIt = set.descendingIterator();
while (descIt.hasNext()) {
    System.out.print(descIt.next() + " "); // 5 4 3 1
}
```

