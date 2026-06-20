---
title: "分布式锁与事务学习资料：Redis 分布式锁、Redlock 和 fencing token"
date: 2026-06-20
description: "Redis 锁常用于防重复任务、热点资源串行化和降低并发冲突。基础写法是 SET key value NX PX ttl，其中 value 必须是持锁者唯一标识，释放时必须用 Lua 校验 value 后删除。"
tags:
  - "架构"
  - "分布式锁与事务"
category: "架构"
---

# 分布式锁与事务学习资料：Redis 分布式锁、Redlock 和 fencing token

[返回索引](../分布式锁与事务学习资料.md)

## 学习目标

- 掌握 Redis 锁的正确基本写法。
- 理解 Redlock 的设计意图和争议边界。
- 掌握 fencing token 的作用和落地方式。

## 理论导读

Redis 锁常用于防重复任务、热点资源串行化和降低并发冲突。基础写法是 `SET key value NX PX ttl`，其中 value 必须是持锁者唯一标识，释放时必须用 Lua 校验 value 后删除。

Redis 锁的最大误区是把它当作强一致锁。Redis 主从复制异步、客户端可能暂停、TTL 会过期，导致旧持锁者和新持锁者都可能执行。对资金、库存、权益等关键资源，必须让下游使用 fencing token、版本号或状态机拒绝旧操作。

## 基本命令

```bash
SET lock:order:o1001 8f5c... NX PX 30000
```

释放锁 Lua：

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

## fencing token

fencing token 是单调递增令牌。每次成功获得锁时获得一个更大的 token，下游资源只接受比自己已见过 token 更大的请求。

```text
A 获得锁 token=10，暂停超过 TTL
B 获得锁 token=11，成功写入资源
A 恢复后携带 token=10 写入
下游发现 10 < 11，拒绝 A
```

Redis 可以用 `INCR lock:order:o1001:token` 生成 token，但必须注意：token 的真正保护发生在下游数据库或资源服务中。

```sql
UPDATE order_resource
SET owner = 'worker-b',
    last_token = 11
WHERE id = 'o1001'
  AND last_token < 11;
```

## Redlock

Redlock 使用多个相互独立的 Redis 节点。客户端尝试在多数节点上获得锁，并判断耗时是否小于有效租约窗口。它试图降低单个 Redis 节点宕机或主从切换造成的风险。

需要谨慎理解：

- Redlock 依赖时间窗口和多数成功，不等于共识协议。
- 网络分区、进程暂停、时钟漂移和下游无 token 校验时仍可能出问题。
- 对关键一致性资源，应优先用数据库约束、etcd/ZooKeeper、fencing token 和状态机兜底。

## 适用场景

| 场景 | 是否适合 Redis 锁 | 说明 |
| --- | --- | --- |
| 防止多个实例重复跑缓存预热 | 适合 | 偶发重复可接受 |
| 定时任务防重复执行 | 适合 | 任务必须幂等 |
| 秒杀库存扣减最终保护 | 不应只靠 Redis 锁 | 库存服务需原子扣减 |
| 支付扣款互斥 | 高风险 | 需要支付流水幂等和对账 |
| 全局唯一主调度器 | 视风险而定 | 高可靠场景可用 ZK/etcd |

## 练习

实现一个 Redis 锁模板伪代码：

```java
<T> T withLock(String key, Duration ttl, Supplier<T> action) {
    String requestId = UUID.randomUUID().toString();
    boolean locked = redis.set(key, requestId, "NX", "PX", ttl.toMillis());
    if (!locked) {
        throw new LockBusyException();
    }
    try {
        return action.get();
    } finally {
        redis.eval(RELEASE_LOCK_LUA, List.of(key), List.of(requestId));
    }
}
```

扩展要求：加入执行超时、可选续期、失败指标和业务幂等检查。

## 验收

- 能写出 Redis 锁获取和释放的安全基本形式。
- 能解释 Redlock 的目标和边界。
- 能设计 fencing token 的下游校验。

## 重点

- Redis 锁 value 必须唯一，释放必须校验 value。
- Redlock 不是免除业务幂等和 fencing token 的理由。
- 锁只管进入临界区，下游资源必须保护最终状态。

## 易错

> **易错：** 用 `SETNX` 后再单独 `EXPIRE`。
>
> 正确做法：使用原子命令 `SET key value NX PX ttl`，避免设置锁成功但设置过期时间失败。

