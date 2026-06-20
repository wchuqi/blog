---
title: "分布式锁与事务学习资料：Saga/TCC 状态机异常控制和悬挂治理深度解析"
date: 2026-06-20
description: "Saga 推进要使用乐观条件，避免多个调度器同时推进同一个实例："
tags:
  - "架构"
  - "分布式锁与事务"
  - "深度解析"
category: "架构"
---

# 分布式锁与事务学习资料：Saga/TCC 状态机异常控制和悬挂治理深度解析

[返回索引](../分布式锁与事务学习资料.md)

## 学习目标

- 能把 Saga/TCC 从概念落到表结构、状态机和恢复任务。
- 掌握 Saga 并发推进、补偿顺序、超时扫描。
- 掌握 TCC 空回滚、悬挂和幂等的治理表设计。

## Saga 表设计

```sql
CREATE TABLE saga_instance (
  saga_id VARCHAR(64) PRIMARY KEY,
  business_key VARCHAR(128) NOT NULL,
  saga_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  current_step VARCHAR(64),
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE saga_step_log (
  id VARCHAR(64) PRIMARY KEY,
  saga_id VARCHAR(64) NOT NULL,
  step_name VARCHAR(64) NOT NULL,
  action_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  request_id VARCHAR(128) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL
);
```

Saga 推进要使用乐观条件，避免多个调度器同时推进同一个实例：

```sql
UPDATE saga_instance
SET status = 'RUNNING',
    current_step = :next_step,
    updated_at = CURRENT_TIMESTAMP
WHERE saga_id = :saga_id
  AND status IN ('NEW', 'RETRYING')
  AND next_retry_at <= CURRENT_TIMESTAMP;
```

## Saga 补偿顺序

补偿通常按已成功步骤的逆序执行。原因是后续步骤可能依赖前置步骤的资源。如果先补偿前置步骤，后续补偿可能找不到资源上下文。

例子：

```text
1. 预留库存成功
2. 扣款成功
3. 开通权益失败

补偿顺序：
1. 退款
2. 释放库存
3. 关闭订单
```

## TCC 分支事务表

```sql
CREATE TABLE tcc_branch (
  xid VARCHAR(64) NOT NULL,
  branch_id VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  try_request_id VARCHAR(128),
  confirm_request_id VARCHAR(128),
  cancel_request_id VARCHAR(128),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  PRIMARY KEY (xid, branch_id)
);
```

状态可以是：

- `TRYING`
- `TRY_SUCCESS`
- `CONFIRMED`
- `CANCELING`
- `CANCELED`
- `CANCEL_BEFORE_TRY`

## 空回滚处理

Cancel 到达时，如果没有 Try 记录，不能什么都不做。应写入 `CANCEL_BEFORE_TRY`：

```sql
INSERT INTO tcc_branch(xid, branch_id, resource_id, status, created_at, updated_at)
VALUES (:xid, :branch_id, :resource_id, 'CANCEL_BEFORE_TRY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (xid, branch_id) DO NOTHING;
```

这样迟到的 Try 会发现该 xid 已经取消，拒绝预留资源。

## 悬挂治理

Try 执行前必须检查：

```sql
SELECT status
FROM tcc_branch
WHERE xid = :xid
  AND branch_id = :branch_id;
```

如果状态是 `CANCEL_BEFORE_TRY` 或 `CANCELED`，Try 必须失败或返回已取消，不能再冻结资源。

## 幂等治理

Confirm 重复到达：

- 如果已 `CONFIRMED`，直接返回成功。
- 如果仍是 `TRY_SUCCESS`，执行确认。
- 如果已 `CANCELED`，返回失败或异常，由协调器处理。

Cancel 重复到达：

- 如果已 `CANCELED`，返回成功。
- 如果 `TRY_SUCCESS`，释放资源并改为 `CANCELED`。
- 如果没有 Try，写 `CANCEL_BEFORE_TRY`。

## 练习

为“库存冻结”写 TCC 状态转移表：

| 当前状态 | 请求 | 处理 |
| --- | --- | --- |
| 无记录 | Try | 冻结库存，写 TRY_SUCCESS |
| 无记录 | Cancel | 写 CANCEL_BEFORE_TRY |
| CANCEL_BEFORE_TRY | Try | 拒绝 Try |
| TRY_SUCCESS | Confirm | 扣减冻结库存，写 CONFIRMED |
| TRY_SUCCESS | Cancel | 释放冻结库存，写 CANCELED |

## 验收

- 能写 Saga 实例表和步骤日志表。
- 能解释 Saga 为什么要逆序补偿。
- 能写 TCC 空回滚和悬挂治理逻辑。

## 易错

> **易错：** Cancel 找不到 Try 记录就直接返回成功，不留任何痕迹。
>
> 正确做法：必须记录空回滚状态，防止迟到 Try 再次预留资源。

