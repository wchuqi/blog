---
title: "Python学习资料：并发、异步事件循环和 GIL 深入"
date: 2026-06-20
description: "并发不是“让程序自动变快”，而是让程序在等待期间做别的事，或把工作拆到多个执行单元。Python 里有三类常见并发模型：线程、进程、协程。它们解决的问题不同，成本也不同。"
tags:
  - "开发语言"
  - "Python"
category: "开发语言"
---

# Python学习资料：并发、异步事件循环和 GIL 深入

[返回索引](../Python学习资料.md)

## 学习目标

- 深入理解线程、进程、协程、事件循环和 GIL 的真实适用边界。
- 掌握任务调度、阻塞、锁、队列、取消、超时和异常传播。
- 能为 IO 密集、CPU 密集、混合型任务选择合适方案。
- 能排查异步代码卡住、线程竞争、进程池失败和吞吐不升反降的问题。

## 理论导读

并发不是“让程序自动变快”，而是让程序在等待期间做别的事，或把工作拆到多个执行单元。Python 里有三类常见并发模型：线程、进程、协程。它们解决的问题不同，成本也不同。

CPython 的 GIL 让同一进程内多个线程通常不能同时执行 Python 字节码。这对 CPU 密集任务影响明显，但对阻塞 IO 任务不一定是问题，因为线程等待 IO 时可以让出执行机会。协程则完全依赖显式 `await` 让出控制权。进程能利用多核，但有序列化、启动和通信成本。

## 核心心智模型

先判断瓶颈：

- 大部分时间在等网络、磁盘、数据库：考虑线程或异步。
- 大部分时间在算 CPU：考虑进程、向量化、C 扩展、算法优化。
- 大部分时间在内存分配和数据搬运：考虑流式处理、减少对象、批处理。
- 需要响应大量连接：考虑异步或成熟框架。

## GIL 的机制和影响

GIL 是 CPython 解释器内部的一把锁。持有 GIL 的线程才能执行 Python 字节码。它简化了 CPython 对象内存管理，尤其是引用计数的线程安全问题。

GIL 的影响：

- CPU 密集 Python 代码中，多线程通常无法线性利用多核。
- IO 等待时，线程可以释放执行机会，仍有并发收益。
- 某些 C 扩展在长时间计算时会释放 GIL。
- 多进程每个进程有自己的解释器和 GIL，可以利用多核。

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

def cpu_work(n: int) -> int:
    return sum(i * i for i in range(n))

with ProcessPoolExecutor() as pool:
    print(list(pool.map(cpu_work, [1_000_000] * 4)))
```

> **重点：** GIL 不是“Python 不能并发”，而是限制 CPython 多线程执行 Python 字节码的 CPU 并行。

## 线程模型

线程共享同一进程内存，创建成本比进程低，适合阻塞 IO。风险在于共享状态竞争。

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

def read_size(path: Path) -> int:
    return path.stat().st_size

paths = list(Path(".").glob("*.md"))
with ThreadPoolExecutor(max_workers=8) as pool:
    futures = [pool.submit(read_size, path) for path in paths]
    for future in as_completed(futures):
        print(future.result())
```

线程同步工具：

- `Lock`：保护临界区。
- `RLock`：同一线程可重复获取的锁。
- `Semaphore`：限制并发数量。
- `Event`：线程间通知。
- `Queue`：线程安全任务队列。

> **易错：** 多线程中对共享字典、列表做复合操作，以为有 GIL 就绝对安全。GIL 不等于业务层原子性。

## 进程模型

进程之间内存隔离，适合 CPU 密集任务。进程池需要把函数和参数序列化发送给子进程，因此函数通常要定义在模块顶层，参数和返回值要可 pickle。

```python
from concurrent.futures import ProcessPoolExecutor

def square(n):
    return n * n

if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:
        print(list(pool.map(square, range(10))))
```

Windows 上尤其要注意 `if __name__ == "__main__"`，否则子进程导入主模块时可能重复启动进程。

进程适用边界：

- 计算量足够大，能抵消进程通信成本。
- 参数和结果可序列化。
- 不依赖大量共享状态。

## 协程和事件循环

协程使用单线程内的协作式调度。`await` 是让出控制权的点。事件循环负责管理可运行任务、定时器、IO 就绪事件和任务回调。

```python
import asyncio

async def worker(name: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return name

async def main():
    results = await asyncio.gather(
        worker("a", 1),
        worker("b", 1),
    )
    print(results)

asyncio.run(main())
```

协程并发的关键不是“同时执行 CPU”，而是在等待 IO 时切换任务。

## `asyncio` 任务、取消和超时

```python
import asyncio

async def fetch():
    await asyncio.sleep(10)
    return "done"

async def main():
    try:
        result = await asyncio.wait_for(fetch(), timeout=1)
    except TimeoutError:
        print("timeout")

asyncio.run(main())
```

取消是异步系统的重要机制。被取消的协程会收到 `CancelledError`，清理逻辑应放在 `finally` 中。

```python
async def run_job():
    try:
        await asyncio.sleep(100)
    finally:
        print("cleanup")
```

> **难点：** 吞掉 `CancelledError` 会破坏上层超时和取消语义。

## 阻塞调用破坏事件循环

```python
import asyncio
import time

async def bad():
    time.sleep(3)  # 阻塞整个事件循环

async def good():
    await asyncio.sleep(3)
```

常见阻塞来源：

- `time.sleep`
- 同步 HTTP 客户端
- 同步数据库驱动
- 大量 CPU 计算
- 大文件同步读写

解决思路：

- 使用异步库。
- 把阻塞函数丢到线程池：`asyncio.to_thread(...)`。
- CPU 密集任务用进程池或单独服务。

## 并发限制和背压

并发过高会压垮数据库、API、文件系统或自身内存。需要用信号量、队列、批处理和超时控制背压。

```python
import asyncio

sem = asyncio.Semaphore(10)

async def limited_call(item):
    async with sem:
        await asyncio.sleep(0.1)
        return item
```

> **重点：** 并发系统要限制入口速率和资源使用，不是任务越多越好。

## 异常传播

`asyncio.gather` 默认遇到异常会传播，其他任务处理方式取决于版本和调用方式。结构化并发中，更推荐使用 Python 3.11+ 的 `asyncio.TaskGroup`。

```python
import asyncio

async def main():
    async with asyncio.TaskGroup() as tg:
        tg.create_task(asyncio.sleep(1))
        tg.create_task(asyncio.sleep(2))
```

`TaskGroup` 能把任务生命周期约束在上下文内，减少后台任务泄漏。

## 选择表

| 场景 | 优先方案 | 说明 |
| --- | --- | --- |
| 少量阻塞 IO | 同步代码 | 简单可靠。 |
| 多个文件或网络 IO | 线程池 | 改造成本低。 |
| 大量异步网络连接 | `asyncio` | 需要异步库配合。 |
| CPU 密集计算 | 进程池或专用计算库 | 绕开 GIL 限制。 |
| 混合任务 | 分层处理 | IO 异步，CPU 交给进程或外部服务。 |

## 排障清单

| 症状 | 可能原因 |
| --- | --- |
| 异步程序卡住 | 协程内有阻塞调用，或任务等待永不完成。 |
| CPU 占满但吞吐低 | 算法复杂度差、GIL、多进程通信成本高。 |
| 线程版结果不稳定 | 共享状态竞争、锁粒度不对。 |
| 进程池启动异常 | 函数不可 pickle、缺少 `__main__` 保护、参数太大。 |
| 并发提高后更慢 | 外部服务限流、磁盘瓶颈、上下文切换成本。 |
| 内存上涨 | 任务创建过多、结果一次性聚合、队列无界。 |

## 练习

1. 对同一批 URL 或模拟 IO 任务分别写同步、线程池、异步版本，记录耗时。
2. 对 CPU 密集求和任务分别写线程池和进程池版本，解释差异。
3. 写一个异步任务，加入超时、取消和 `finally` 清理。
4. 用 `asyncio.Semaphore` 限制并发，比较无限并发和限制并发的稳定性。
5. 在异步函数里故意调用 `time.sleep`，观察其他任务是否被卡住。

## 验收

- 能准确解释 GIL 的作用和边界。
- 能为不同瓶颈选择线程、进程或协程。
- 能说明事件循环如何通过 `await` 调度任务。
- 能处理异步超时、取消和并发限制。
- 能解释为什么并发提高不一定提升吞吐。

## 重点

- 并发方案由瓶颈决定。
- GIL 影响 CPython 多线程 CPU 并行，但不否定线程处理 IO 的价值。
- 异步代码必须保持调用链非阻塞。
- 生产并发必须有超时、限流、取消和资源清理。

## 难点

- 取消和异常传播容易被错误捕获破坏。
- 线程共享状态导致的问题可能低概率出现，测试不一定稳定复现。
- 进程池性能取决于计算量和序列化成本的比例。

## 易错

> **易错：** 把 `async def` 当成自动并发。
>
> 正确做法：协程需要被事件循环调度，并在 `await` 可等待对象时让出控制权。

> **易错：** 创建无界任务列表再 `gather`。
>
> 正确做法：使用队列、信号量、批处理或流式消费控制内存和外部压力。
