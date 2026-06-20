---
title: "PostgreSQL 13 学习资料：MVCC 可见性、锁和隔离级别深度解析"
date: 2026-06-20
description: "MVCC 的表层说法是“多版本并发控制”，但真正决定行为的是可见性判断。每条查询都有一个 snapshot，snapshot 描述当前事务能看到哪些事务的结果。heap tuple 上有 xmin 和 xmax，PostgreSQL 通过事…"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "深度解析"
category: "数据库"
---

# PostgreSQL 13 学习资料：MVCC 可见性、锁和隔离级别深度解析

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 深入理解 PostgreSQL 快照、事务 ID、tuple 可见性和 `pg_xact` 状态判断。
- 区分 tuple lock、heavyweight lock、lightweight lock、buffer pin 和 predicate lock。
- 能解释 READ COMMITTED、REPEATABLE READ、SERIALIZABLE 下的异常和重试策略。
- 能从 `pg_stat_activity`、`pg_locks`、等待事件和 SQL 时间线还原并发问题。

## 理论导读

MVCC 的表层说法是“多版本并发控制”，但真正决定行为的是可见性判断。每条查询都有一个 snapshot，snapshot 描述当前事务能看到哪些事务的结果。heap tuple 上有 `xmin` 和 `xmax`，PostgreSQL 通过事务状态和 snapshot 规则决定 tuple 对当前查询是否可见。

锁则是另一条线。MVCC 让读写减少阻塞，但不是消灭锁。PostgreSQL 仍需要锁保护行更新、DDL、关系元数据、缓冲区、谓词冲突和内部结构。很多线上问题来自把所有等待都叫“锁”，却不区分等待的资源类型。

## 核心心智模型

### 1. Snapshot 是一张事务可见性名单

简化理解，snapshot 包含：

- `xmin`：小于它的事务通常已经结束，结果可见性可根据提交状态判断。
- `xmax`：大于等于它的事务对当前 snapshot 不可见。
- `xip`：snapshot 创建时仍活跃的事务 ID 列表，这些事务即使之后提交，对当前 snapshot 也不可见。

tuple 可见性判断不是“最新行就是可见”，而是：

```text
tuple.xmin 创建者是否对当前 snapshot 可见
AND
tuple.xmax 删除者或替换者是否对当前 snapshot 不可见
```

### 2. 锁是并发修改的秩序

MVCC 解决“读者看到哪个版本”，锁解决“多个写者如何排队”和“结构变化如何协调”。读写不阻塞是有限条件下成立的，例如普通 SELECT 和 UPDATE 通常不互相阻塞，但两个 UPDATE 同一行会互相等待。

## 知识点详解

## 一、事务 ID 和 tuple 可见性

观察系统列：

```sql
DROP TABLE IF EXISTS mvcc_lab;
CREATE TABLE mvcc_lab(id int PRIMARY KEY, value text);
INSERT INTO mvcc_lab VALUES (1, 'v1');

SELECT xmin, xmax, ctid, * FROM mvcc_lab;
```

开启事务后更新：

```sql
BEGIN;
UPDATE mvcc_lab SET value = 'v2' WHERE id = 1;
SELECT xmin, xmax, ctid, * FROM mvcc_lab;
```

另一个会话在提交前看到什么，取决于它自己的 snapshot 和隔离级别。

### 事务状态存在哪里

事务是否提交不是只看 tuple。PostgreSQL 还会查事务提交状态，历史上常称 CLOG，现在相关文件在 `pg_xact`。为了避免反复查提交日志，PostgreSQL 可能把 hint bits 写回 tuple 页面，提示某个 `xmin` 或 `xmax` 已提交或已中止。

生产影响：

- 第一次访问冷数据时可能触发 hint bits 写入，读查询也可能导致脏页。
- `VACUUM FREEZE` 会把老事务 ID 处理成冻结状态，避免事务 ID 回卷风险。

## 二、READ COMMITTED 的时间线

READ COMMITTED 每条语句开始时获取新 snapshot。

会话 A：

```sql
BEGIN;
SELECT value FROM mvcc_lab WHERE id = 1; -- 看到 v1
```

会话 B：

```sql
UPDATE mvcc_lab SET value = 'v2' WHERE id = 1;
COMMIT;
```

会话 A：

```sql
SELECT value FROM mvcc_lab WHERE id = 1; -- READ COMMITTED 下看到 v2
COMMIT;
```

这不是脏读，因为会话 A 看到的是会话 B 已提交结果。但这是不可重复读。

## 三、REPEATABLE READ 的时间线

REPEATABLE READ 在事务内复用同一个 snapshot。

会话 A：

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT value FROM mvcc_lab WHERE id = 1; -- v1
```

会话 B：

```sql
UPDATE mvcc_lab SET value = 'v2' WHERE id = 1;
COMMIT;
```

会话 A：

```sql
SELECT value FROM mvcc_lab WHERE id = 1; -- 仍然 v1
COMMIT;
```

注意：如果会话 A 之后也尝试更新同一行，可能遇到 serialization failure，因为它的 snapshot 已经过旧，不能安全更新一个已被并发事务改过的行。

## 四、SERIALIZABLE 和 SSI

PostgreSQL 的 SERIALIZABLE 使用 Serializable Snapshot Isolation。它不是简单给所有数据加大锁，而是跟踪读写依赖，发现可能无法串行化的危险结构时中止其中一个事务。

典型写偏斜问题：

```text
规则：至少保留一名医生值班

事务 A 看到医生 1 和医生 2 都在值班，于是让医生 1 下班
事务 B 看到医生 1 和医生 2 都在值班，于是让医生 2 下班
两个事务分别更新不同的行，在较弱隔离下都能提交，最终无人值班
```

SERIALIZABLE 会通过读写依赖检测这类风险，并让一个事务失败。应用必须重试整个事务。

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- read business invariant
-- write change
COMMIT;
```

错误处理原则：

- 捕获 SQLSTATE `40001`。
- 回滚当前事务。
- 退避后重试整个业务事务。
- 不要只重试失败的最后一条 SQL。

## 五、锁类型的层次

| 类型 | 保护对象 | 你通常如何看到 |
| --- | --- | --- |
| heavyweight lock | relation、transactionid、tuple 等逻辑资源 | `pg_locks` |
| row-level lock | 行更新冲突 | `pg_locks` 中常表现为 transactionid 等等待 |
| lightweight lock | 共享内存内部结构 | 等待事件 `LWLock` |
| buffer pin | buffer 被使用，阻止某些操作 | 等待事件 `BufferPin` |
| predicate lock | SERIALIZABLE 读依赖 | `pg_locks` 中 `SIReadLock` |

### 表级锁模式

常见表级锁模式从弱到强包括：

- `ACCESS SHARE`：普通 SELECT。
- `ROW SHARE`：`SELECT FOR UPDATE/SHARE`。
- `ROW EXCLUSIVE`：INSERT、UPDATE、DELETE。
- `SHARE UPDATE EXCLUSIVE`：VACUUM、ANALYZE、CREATE INDEX CONCURRENTLY 等。
- `SHARE`、`SHARE ROW EXCLUSIVE`、`EXCLUSIVE`。
- `ACCESS EXCLUSIVE`：很多 DDL、TRUNCATE、VACUUM FULL。

`ACCESS EXCLUSIVE` 与几乎所有锁冲突，所以线上 DDL 要特别谨慎。

### 行锁模式

PostgreSQL 行锁常见语法：

```sql
SELECT * FROM application WHERE id = 1 FOR UPDATE;
SELECT * FROM application WHERE id = 1 FOR NO KEY UPDATE;
SELECT * FROM application WHERE id = 1 FOR SHARE;
SELECT * FROM application WHERE id = 1 FOR KEY SHARE;
```

`FOR UPDATE` 最强，通常用于即将更新或删除行。外键检查可能使用 `KEY SHARE`，因为它关心被引用键是否被改动。

## 六、外键和锁的隐藏成本

外键不仅是约束，也会带来锁和查询成本。

例子：

```sql
CREATE TABLE parent(id bigint PRIMARY KEY);
CREATE TABLE child(
  id bigint PRIMARY KEY,
  parent_id bigint NOT NULL REFERENCES parent(id)
);
```

删除 parent 时，PostgreSQL 需要检查 child 是否有引用。如果 child.parent_id 没有索引，大表检查会很慢，并且持锁时间变长。

生产规则：

- 外键引用列通常应建索引，特别是会删除或更新父表键时。
- 大批量删除父表前，先评估子表检查成本和锁影响。

## 七、死锁的形成和诊断

死锁不是“慢”，而是等待环。

会话 A：

```sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
```

会话 B：

```sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 2;
UPDATE account SET balance = balance + 100 WHERE id = 1;
```

如果 A 锁住 1，B 锁住 2，然后互相等对方的行，就形成死锁。PostgreSQL 的 deadlock detector 会中止一个事务。

避免策略：

- 固定访问顺序，例如总是按 id 从小到大更新。
- 缩短事务，避免事务中做网络调用。
- 合理使用 `lock_timeout` 防止无限等待。
- 捕获死锁错误并重试整个事务。

## 八、排查阻塞链

PostgreSQL 提供 `pg_blocking_pids`：

```sql
SELECT
  pid,
  usename,
  state,
  wait_event_type,
  wait_event,
  pg_blocking_pids(pid) AS blocking_pids,
  now() - query_start AS query_age,
  query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0
ORDER BY query_age DESC;
```

找出阻塞源：

```sql
WITH blocked AS (
  SELECT pid, unnest(pg_blocking_pids(pid)) AS blocking_pid
  FROM pg_stat_activity
)
SELECT
  b.pid AS blocked_pid,
  blocked.query AS blocked_query,
  b.blocking_pid,
  blocking.state AS blocking_state,
  blocking.query AS blocking_query
FROM blocked b
JOIN pg_stat_activity blocked ON blocked.pid = b.pid
JOIN pg_stat_activity blocking ON blocking.pid = b.blocking_pid;
```

处理顺序：

1. 确认阻塞源是否为正常长事务、DDL、批处理或异常会话。
2. 优先联系业务或等待短事务完成。
3. 可以先 `pg_cancel_backend` 取消查询。
4. 必要时 `pg_terminate_backend` 终止会话，但要接受事务回滚。

## 九、锁超时和语句超时

生产中可以设置：

```sql
SET lock_timeout = '3s';
SET statement_timeout = '30s';
SET idle_in_transaction_session_timeout = '60s';
```

区别：

| 参数 | 控制什么 |
| --- | --- |
| `lock_timeout` | 等锁超过时间就失败 |
| `statement_timeout` | 单条语句执行总时间 |
| `idle_in_transaction_session_timeout` | 事务中空闲超过时间断开 |

应用要理解这些错误，并决定是否重试。

## 例子：库存扣减的正确并发模型

错误做法：

```sql
SELECT stock FROM inventory WHERE sku = 'A';
-- 应用判断 stock > 0
UPDATE inventory SET stock = stock - 1 WHERE sku = 'A';
```

并发下可能超卖。更好的方式：

```sql
UPDATE inventory
SET stock = stock - 1
WHERE sku = 'A'
  AND stock > 0
RETURNING stock;
```

如果返回 0 行，表示库存不足。这个写法把判断和修改合成一条原子 UPDATE。

如果还要写订单：

```sql
BEGIN;

UPDATE inventory
SET stock = stock - 1
WHERE sku = 'A'
  AND stock > 0
RETURNING stock;

INSERT INTO orders(sku, status)
VALUES ('A', 'created');

COMMIT;
```

应用必须确认 UPDATE 返回了行，再插入订单。

## 实操任务

### 任务 1：对比隔离级别

用两个会话分别验证 READ COMMITTED 和 REPEATABLE READ 下重复读取结果。

验收：

- 能写出两条时间线。
- 能解释为什么 READ COMMITTED 不脏读但会不可重复读。

### 任务 2：构造死锁并修复

创建账户表，两个事务按相反顺序更新两行。然后改为按 id 升序更新，确认死锁消失。

验收：

- 能在日志中找到 deadlock 信息。
- 能说明固定访问顺序为什么有效。

### 任务 3：验证外键索引影响

创建 parent 和 child，大量 child 行引用 parent。比较 child 外键列有无索引时删除 parent 的计划和耗时。

验收：

- 能解释外键检查为什么需要访问子表。
- 能说明未建索引如何放大锁持有时间。

## 验收

- 能用 snapshot 解释 tuple 可见性。
- 能说明 `xmin`、`xmax`、`ctid` 的含义和边界。
- 能区分 READ COMMITTED、REPEATABLE READ、SERIALIZABLE 的实际行为。
- 能解释 SERIALIZABLE 为什么需要事务级重试。
- 能按阻塞链找出 blocking pid。
- 能说明外键、DDL 和长事务如何制造锁问题。

## 重点

- MVCC 负责可见性，锁负责并发秩序。
- PostgreSQL 不脏读，但不同隔离级别下快照刷新时机不同。
- SERIALIZABLE 通过检测危险依赖保护串行化，不是简单阻塞所有并发。
- `idle in transaction` 是生产高危状态。

## 难点

- 锁等待的表象可能是 relation lock、transactionid lock、buffer pin 或 LWLock，不应都按“行锁”处理。
- SERIALIZABLE 下失败是正确行为，应用必须有重试设计。

## 易错

> **易错：** 认为普通 SELECT 一定不会对数据库造成写入。
>
> 正确做法：普通 SELECT 可能设置 hint bits，使页面变脏。它不是业务写入，但可能产生磁盘写回。

> **易错：** 用 `SELECT` 后应用判断，再 `UPDATE`，以为事务里就安全。
>
> 正确做法：并发条件要尽量放进原子 UPDATE、唯一约束或显式锁中。

> **易错：** 锁等待时直接 kill 所有 active 会话。
>
> 正确做法：先找阻塞源，评估回滚影响，再选择 cancel 或 terminate。

