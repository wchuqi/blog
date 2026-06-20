---
title: "PostgreSQL 13 学习资料：事务、MVCC 和锁"
date: 2026-06-20
description: "事务让一组操作具备原子性、一致性、隔离性和持久性。PostgreSQL 的并发控制以 MVCC 为核心：更新一行时并不是原地覆盖，而是产生新版本，旧版本在一段时间内保留给仍需要旧快照的事务读取。"
tags:
  - "数据库"
  - "PostgreSQL13"
category: "数据库"
---

# PostgreSQL 13 学习资料：事务、MVCC 和锁

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 理解事务 ACID、隔离级别和 PostgreSQL 的 MVCC。
- 能判断读写冲突、锁等待、死锁和长事务造成的问题。
- 能用系统视图定位阻塞链路。

## 理论导读

事务让一组操作具备原子性、一致性、隔离性和持久性。PostgreSQL 的并发控制以 MVCC 为核心：更新一行时并不是原地覆盖，而是产生新版本，旧版本在一段时间内保留给仍需要旧快照的事务读取。

MVCC 的好处是读写并发更好，普通读不会阻塞普通写，普通写也不会阻塞快照读。但它不是没有代价：过期行版本需要 VACUUM 清理，长事务会让旧版本无法回收，写写冲突仍需要锁。

## 核心心智模型

一行数据不是一张固定卡片，而是一串版本链。每个事务拿到一个快照，快照决定它能看到哪些版本。更新会追加新版本并把旧版本标记为不再对新事务可见。VACUUM 负责把不再被任何活跃快照需要的旧版本清掉。

## 知识点详解

### 1. 隔离级别

| 隔离级别 | PostgreSQL 行为 | 典型现象 |
| --- | --- | --- |
| READ COMMITTED | 每条 SQL 开始时获取新快照 | 同一事务内两次查询可能看到不同结果 |
| REPEATABLE READ | 事务开始后使用同一快照 | 同一事务内查询结果稳定 |
| SERIALIZABLE | 通过 SSI 检测串行化冲突 | 可能提交时报错，需要重试 |

PostgreSQL 13 中，`READ UNCOMMITTED` 会按 `READ COMMITTED` 处理，不允许脏读。

### 2. MVCC 可见性

每个行版本有创建它的事务 ID 和删除或更新它的事务 ID。查询时根据当前快照判断版本是否可见。简化规则是：

- 创建该版本的事务已经提交，并且在当前快照可见。
- 删除或替换该版本的事务未提交，或在当前快照不可见。

### 3. 行锁和表锁

常见行级锁：

| 语句 | 典型锁行为 |
| --- | --- |
| `UPDATE` | 锁定被更新的行 |
| `DELETE` | 锁定被删除的行 |
| `SELECT ... FOR UPDATE` | 显式锁定待更新行 |
| `SELECT ... FOR SHARE` | 获取共享锁，限制并发修改 |

常见表级锁由 DDL、VACUUM、索引创建、外键检查等触发。多数 DML 会拿较弱的表锁，用来和 DDL 协调。

### 4. 死锁

死锁发生在两个或多个事务互相等待对方持有的锁。PostgreSQL 会检测死锁，并中止其中一个事务。

典型模式：

```text
事务 A：先更新 id=1，再更新 id=2
事务 B：先更新 id=2，再更新 id=1
```

避免方式是固定访问顺序，缩短事务，必要时使用 `SELECT ... FOR UPDATE` 提前锁定。

### 5. 长事务危害

长事务会让旧版本不能被 VACUUM 清理，造成：

- 表和索引膨胀。
- autovacuum 压力增大。
- `age(datfrozenxid)` 增大，极端情况下有事务 ID 回卷风险。
- 主从复制延迟和查询冲突风险升高。

## 例子

查看当前长事务：

```sql
SELECT
  pid,
  usename,
  datname,
  state,
  now() - xact_start AS xact_age,
  query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_age DESC;
```

查看阻塞关系：

```sql
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks
  ON blocked_locks.pid = blocked.pid
JOIN pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
 AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
 AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
 AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
 AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
 AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
 AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
 AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
 AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
 AND blocking_locks.pid <> blocked_locks.pid
JOIN pg_stat_activity blocking
  ON blocking.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted
  AND blocking_locks.granted;
```

事务重试示例：

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;

UPDATE account
SET balance = balance - 100
WHERE id = 1;

UPDATE account
SET balance = balance + 100
WHERE id = 2;

COMMIT;
```

如果 SERIALIZABLE 提交失败，应用应捕获错误并重试整个事务，而不是只重试最后一条 SQL。

## 练习

1. 开两个 `psql` 会话，分别更新同一行，观察第二个会话等待。
2. 构造两个事务按相反顺序更新两行，观察死锁报错。
3. 在一个会话开启事务不提交，另一个会话大量更新表，观察 dead tuple 增长。
4. 比较 `READ COMMITTED` 和 `REPEATABLE READ` 下同一事务内两次查询结果。

## 验收

- 能解释 PostgreSQL 为什么没有脏读。
- 能用 `pg_stat_activity` 和 `pg_locks` 找阻塞源。
- 能说明长事务和表膨胀的关系。
- 能为业务写出事务重试策略。

## 重点

- MVCC 提升读写并发，但需要 VACUUM 清理旧版本。
- 写写冲突仍然依赖锁。
- SERIALIZABLE 失败是正确性保护，不是简单 bug。

## 难点

- 可见性、快照、锁等待和 VACUUM 之间互相影响，需要用时间线理解。

## 易错

> **易错：** 以为 `REPEATABLE READ` 一定能防止所有并发异常。
>
> 正确做法：需要严格串行化语义时使用 `SERIALIZABLE`，并在应用层支持事务重试。

> **易错：** 排查锁等待时只看被阻塞 SQL，不找阻塞源。
>
> 正确做法：通过 `pg_locks` 和 `pg_stat_activity` 找 blocking pid，再判断是否需要取消或终止。

