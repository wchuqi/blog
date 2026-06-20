---
title: "PostgreSQL 13 学习路线图"
date: 2026-06-20
description: "这份路线图面向已经具备基础 SQL 或后端开发经验的学习者。PostgreSQL 13 已在 2025 年进入 EOL，不建议新项目继续选用；如果工作环境仍在使用 PostgreSQL 13，本资料重点帮助你理解它的机制、排障方式和迁移前必…"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "学习路线图"
category: "数据库"
---

# PostgreSQL 13 学习路线图

这份路线图面向已经具备基础 SQL 或后端开发经验的学习者。PostgreSQL 13 已在 2025 年进入 EOL，不建议新项目继续选用；如果工作环境仍在使用 PostgreSQL 13，本资料重点帮助你理解它的机制、排障方式和迁移前必须掌握的生产能力。

## 阶段 1：基础认知

- 目标：理解 PostgreSQL 是什么、数据库集群和数据库的关系、`psql` 基本使用、连接和配置入口。
- 需要掌握：实例、cluster、database、schema、role、tablespace、WAL、checkpoint、autovacuum、extension。
- 例子：用 `createdb` 建库，用 `psql` 连接，用 `\dt`、`\d+`、`\x` 查看对象。
- 练习：安装 PostgreSQL 13，创建 `job_app` 数据库，建立一个 `candidate` 表并插入测试数据。
- 验收：能解释 PostgreSQL 进程结构，能找到 `postgresql.conf`、`pg_hba.conf`、`pg_wal` 的作用。
- 重点：数据库集群不是业务数据库，cluster 是一个 PostgreSQL 实例的数据目录和运行时环境。
- 易错：把 schema 当成 database。schema 是 database 内的命名空间，不能跨 database 直接查询。

## 阶段 2：SQL、建模和日常开发

- 目标：能写可靠的查询、建表语句、约束、索引和常见 DML。
- 需要掌握：DDL、DML、JOIN、聚合、窗口函数、CTE、UPSERT、数据类型、主键、外键、唯一约束、检查约束、默认值。
- 例子：订单表按业务唯一键做 `ON CONFLICT` 幂等写入。
- 练习：设计一套招聘系统表结构：候选人、岗位、投递、面试、Offer。
- 验收：能说明约束和索引的区别，能根据业务不变量选择约束。
- 重点：约束表达业务正确性，索引主要服务访问路径，二者可以相关但责任不同。
- 易错：只靠应用层校验唯一性，在并发写入时会出现重复数据。

## 阶段 3：事务、MVCC 和锁

- 目标：理解 PostgreSQL 并发控制的内部模型，能处理阻塞、死锁、隔离级别和长事务问题。
- 需要掌握：事务生命周期、快照、xmin、xmax、tuple version、READ COMMITTED、REPEATABLE READ、SERIALIZABLE、行锁、表锁、死锁检测。
- 例子：两个会话同时更新同一行时，后到事务等待行锁。
- 练习：用两个 `psql` 会话模拟更新冲突、不可重复读、可重复读快照。
- 验收：能用 `pg_stat_activity`、`pg_locks` 找出谁阻塞谁。
- 重点：PostgreSQL 用 MVCC 保留多个行版本，让读写尽量不互相阻塞。
- 易错：以为 MVCC 不需要锁。写写冲突、DDL、外键检查仍然会锁。

## 阶段 4：索引、执行计划和性能优化

- 目标：能读懂 `EXPLAIN (ANALYZE, BUFFERS)`，能判断是否需要索引、哪种索引、是否被正确使用。
- 需要掌握：顺序扫描、索引扫描、位图扫描、Nested Loop、Hash Join、Merge Join、排序、聚合、统计信息、选择率、代价模型、慢 SQL 定位、SQL 改写和复测。
- 例子：为 `WHERE status = 'open' AND created_at > now() - interval '7 days'` 建复合索引或部分索引。
- 练习：构造 100 万行测试数据，比较无索引、单列索引、复合索引、部分索引的计划差异；开启慢查询日志和 `pg_stat_statements`，输出 Top SQL 调优报告。
- 验收：能解释为什么某个索引没有被使用，能区分锁等待慢、I/O 慢、计划选错和 SQL 写法问题，能提出验证而不是猜测。
- 重点：优化器选择的是估算成本最低的访问路径，不是看见索引就用索引。
- 易错：无条件给每个列建索引。索引会增加写入成本、存储成本和维护成本。

## 阶段 5：备份恢复、复制和高可用

- 目标：具备生产数据库保护能力，能区分逻辑备份、物理备份、PITR、流复制、逻辑复制。
- 需要掌握：`pg_dump`、`pg_restore`、`pg_basebackup`、WAL 归档、恢复目标、replication slot、hot standby、logical replication。
- 例子：使用基础备份加 WAL 归档恢复到误删表之前。
- 练习：搭建一主一从，验证主库写入后从库查询延迟。
- 验收：能写出恢复步骤，并能说明 RPO、RTO 受哪些配置影响。
- 重点：没有验证过恢复的备份不能算可靠备份。
- 易错：只做 `pg_dump`，却以为可以恢复任意时间点。PITR 需要基础备份和连续 WAL。

## 阶段 6：安全、运维、排障和迁移

- 目标：能把 PostgreSQL 13 放进真实生产环境，处理权限、连接池、监控、膨胀、升级和迁移风险。
- 需要掌握：role、grant、default privileges、`pg_hba.conf`、SSL、连接池、autovacuum、bloat、统计视图、日志、版本升级。
- 例子：拆分应用账号、只读账号和 DBA 账号，避免应用账号拥有 schema owner 权限。
- 练习：配置慢查询日志，定位 Top SQL，处理一个表膨胀案例。
- 验收：能给出 PostgreSQL 13 升级到受支持版本的迁移检查清单。
- 重点：PostgreSQL 13 已 EOL，安全补丁和 bugfix 停止后，生产环境应规划升级。
- 易错：把超级用户账号给应用。任何 SQL 注入或误操作都可能变成实例级事故。

## 阶段 7：内部机制深度

- 目标：理解 PostgreSQL 的 page、tuple、WAL、snapshot、锁、优化器、VACUUM、freeze 和复制 timeline。
- 需要掌握：heap page、line pointer、TOAST、FSM、VM、HOT update、WAL record、LSN、checkpoint、snapshot xmin/xmax/xip、SSI、join cost、extended statistics、replication slot。
- 例子：解释一次 `UPDATE` 如何同时产生新旧 tuple、WAL、索引维护、VM 位变化和后续 VACUUM 压力。
- 练习：完成深度章节中的 HOT、长事务、数据倾斜、排序落盘、PITR 设计实验。
- 验收：能把慢查询、膨胀、WAL 暴涨、复制延迟和锁等待映射到底层机制。
- 重点：深度不是背术语，而是能从运行时现象反推机制。
- 易错：只看 SQL 结果，不看 tuple 生命周期、WAL、统计信息和后台维护。

## 阶段 8：生产演练和事故复盘

- 目标：形成生产可用能力，能写排障剧本、容量规划、恢复演练和升级计划。
- 需要掌握：现场快照、Top SQL、阻塞链、连接治理、checkpoint、autovacuum 策略、复制故障、PITR、pg_rewind、EOL 升级。
- 例子：线上 WAL 暴涨时，按归档、复制槽、备库延迟、批量写入、备份状态逐项排查。
- 练习：用 `job_app` 项目提交一份数据库设计、性能计划、备份恢复、权限和故障剧本报告。
- 验收：能在不扩大事故的前提下完成定位、止血、恢复和长期修复。
- 重点：高危操作要有证据和回滚路径。
- 易错：故障中直接重启、删除 WAL、全局乱调参数或未隔离旧主就切换。

## 阶段 9：pgvector、向量检索和 RAG 实践

- 目标：理解 pgvector 如何把向量检索放进 PostgreSQL，能为语义搜索、相似简历推荐和 RAG 检索设计可验证的方案。
- 需要掌握：`vector`、`halfvec`、`bit`、`sparsevec`、L2、内积、余弦距离、HNSW、IVFFlat、过滤条件、召回率、重排序、扩展安装和升级。
- 例子：为候选人简历片段保存 embedding，用 `ORDER BY embedding <=> $query LIMIT 10` 查找语义最相近的片段。
- 练习：在 PostgreSQL 13 测试库安装 pgvector，创建 `resume_chunk` 表，分别比较精确扫描、HNSW 和 IVFFlat 的执行计划与召回差异。
- 验收：能说明为什么近似索引会牺牲召回率，为什么带 `WHERE` 过滤时可能返回不足，如何用参数、部分索引、分区或重排序修正。
- 重点：pgvector 是 PostgreSQL 扩展，不是把 PostgreSQL 变成无成本的专用向量数据库；事务、备份、权限、WAL、VACUUM 和查询规划仍然照常影响它。
- 易错：只看向量距离，不做业务过滤、权限过滤、版本过滤和结果重排序，导致 RAG 检索结果相关但不可用。

## 推荐学习节奏

| 周期 | 学习重点 | 产出 |
| --- | --- | --- |
| 第 1 周 | 安装、对象层级、`psql`、基本 SQL | 能独立建库建表并完成 CRUD |
| 第 2 周 | 数据建模、约束、JOIN、窗口函数 | 完成招聘系统数据模型 |
| 第 3 周 | 事务、MVCC、锁、隔离级别 | 能模拟并解释阻塞和死锁 |
| 第 4 周 | 索引、执行计划、统计信息、慢 SQL 定位 | 能优化 3 个真实慢查询，并提交定位证据和复测结果 |
| 第 5 周 | 备份恢复、WAL、复制 | 完成一次 PITR 演练 |
| 第 6 周 | 权限、安全、监控、排障、升级 | 输出一份生产检查清单 |
| 第 7 周 | 存储、MVCC、优化器、VACUUM 深度机制 | 完成 5 个机制实验和解释报告 |
| 第 8 周 | 高可用、参数规划、故障剧本、综合项目 | 输出一份生产级 PostgreSQL 13 方案 |
| 第 9 周 | pgvector、向量索引、RAG 检索链路 | 输出一份向量检索表设计、索引评估和召回测试报告 |

## 最终能力清单

- 能解释 PostgreSQL 13 的内部结构和关键生命周期。
- 能设计符合业务约束的数据模型。
- 能写出可维护的 SQL，并理解执行计划。
- 能判断事务隔离、锁和并发异常。
- 能选择合适的索引并验证效果。
- 能定位慢 SQL 的来源、根因和影响面，并做 SQL、索引、统计信息或参数层面的调优。
- 能完成备份恢复和基础高可用搭建。
- 能做权限收敛、连接治理、慢查询定位和膨胀处理。
- 能使用 pgvector 构建可验证的语义检索能力，并解释索引、过滤、召回率和生产运维边界。
- 能识别 PostgreSQL 13 EOL 风险并规划升级。
