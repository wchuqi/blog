---
title: "PostgreSQL 13 学习资料：完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查 PostgreSQL 13 学习覆盖是否完整。它不是简短提纲，而是从基础、内部机制、日常开发、生产运维、性能、安全、复制和面试维度列出必须掌握的范围。"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "知识清单"
category: "数据库"
---

# PostgreSQL 13 学习资料：完整知识点清单

[返回索引](../PostgreSQL13学习资料.md)

这份清单用于检查 PostgreSQL 13 学习覆盖是否完整。它不是简短提纲，而是从基础、内部机制、日常开发、生产运维、性能、安全、复制和面试维度列出必须掌握的范围。

## 一、基础和环境

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 版本生命周期 | PostgreSQL 13 已 EOL，生产应规划升级 | [00-总览与心智模型.md](00-总览与心智模型.md) |
| 实例层级 | cluster、database、schema、table、role | [00-总览与心智模型.md](00-总览与心智模型.md) |
| 安装初始化 | `initdb`、数据目录、服务启动 | [01-安装配置和psql.md](01-安装配置和psql.md) |
| 客户端工具 | `psql`、`createdb`、`pg_isready` | [01-安装配置和psql.md](01-安装配置和psql.md) |
| 配置文件 | `postgresql.conf`、`pg_hba.conf`、`pg_ident.conf` | [01-安装配置和psql.md](01-安装配置和psql.md) |
| 参数生效 | reload、restart、session、user context | [01-安装配置和psql.md](01-安装配置和psql.md) |

## 二、SQL 和数据建模

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| SQL 逻辑顺序 | FROM、WHERE、GROUP BY、HAVING、SELECT、ORDER BY | [02-SQL基础和数据建模.md](02-SQL基础和数据建模.md) |
| JOIN | inner、left、full、cross、ON 和 WHERE 区别 | [02-SQL基础和数据建模.md](02-SQL基础和数据建模.md) |
| 聚合和窗口函数 | 分组统计、Top N、最近记录 | [02-SQL基础和数据建模.md](02-SQL基础和数据建模.md) |
| CTE | 拆分复杂查询、递归查询基础 | [02-SQL基础和数据建模.md](02-SQL基础和数据建模.md) |
| UPSERT | `ON CONFLICT`、冲突目标、幂等写入 | [02-SQL基础和数据建模.md](02-SQL基础和数据建模.md) |
| 数据建模 | 实体、关系、业务不变量、状态流转 | [02-SQL基础和数据建模.md](02-SQL基础和数据建模.md) |

## 三、数据类型、约束和对象

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 数值和金额 | integer、bigint、numeric、浮点风险 | [03-数据类型约束和Schema.md](03-数据类型约束和Schema.md) |
| 时间类型 | date、timestamp、timestamptz、时区 | [03-数据类型约束和Schema.md](03-数据类型约束和Schema.md) |
| JSONB | 查询、GIN 索引、边界 | [03-数据类型约束和Schema.md](03-数据类型约束和Schema.md) |
| NULL | 三值逻辑、唯一约束中的 NULL | [03-数据类型约束和Schema.md](03-数据类型约束和Schema.md) |
| 约束 | 主键、唯一、外键、检查、排斥约束 | [03-数据类型约束和Schema.md](03-数据类型约束和Schema.md) |
| Schema | `search_path`、命名空间、安全风险 | [03-数据类型约束和Schema.md](03-数据类型约束和Schema.md) |
| 函数和触发器 | PL/pgSQL、触发时机、波动性 | [07-函数触发器视图和扩展.md](07-函数触发器视图和扩展.md) |
| 视图和扩展 | 视图、物化视图、扩展安装 | [07-函数触发器视图和扩展.md](07-函数触发器视图和扩展.md) |

## 四、内部机制

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 进程模型 | 后端进程、WAL writer、checkpointer、autovacuum | [00-总览与心智模型.md](00-总览与心智模型.md) |
| MVCC | 行版本、快照、可见性、旧版本清理 | [04-事务MVCC和锁.md](04-事务MVCC和锁.md) |
| 事务隔离 | READ COMMITTED、REPEATABLE READ、SERIALIZABLE | [04-事务MVCC和锁.md](04-事务MVCC和锁.md) |
| 锁 | 行锁、表锁、锁等待、死锁 | [04-事务MVCC和锁.md](04-事务MVCC和锁.md) |
| WAL | 预写日志、提交、崩溃恢复、归档 | [08-备份恢复和WAL.md](08-备份恢复和WAL.md) |
| Checkpoint | 脏页刷盘、恢复时间、I/O 抖动 | [11-运维监控和故障排查.md](11-运维监控和故障排查.md) |
| Autovacuum | dead tuple、freeze、膨胀控制 | [11-运维监控和故障排查.md](11-运维监控和故障排查.md) |

## 五、索引和优化

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 索引类型 | B-tree、Hash、GIN、GiST、SP-GiST、BRIN | [05-索引类型和查询规划.md](05-索引类型和查询规划.md) |
| 复合索引 | 列顺序、等值、范围、排序 | [05-索引类型和查询规划.md](05-索引类型和查询规划.md) |
| 部分索引 | 热点子集、谓词匹配 | [05-索引类型和查询规划.md](05-索引类型和查询规划.md) |
| 表达式索引 | 函数条件、大小写不敏感查询 | [05-索引类型和查询规划.md](05-索引类型和查询规划.md) |
| 覆盖索引 | `INCLUDE`、index-only scan、可见性映射 | [05-索引类型和查询规划.md](05-索引类型和查询规划.md) |
| 执行计划 | Seq Scan、Index Scan、Bitmap Scan | [06-性能优化和执行计划.md](06-性能优化和执行计划.md) |
| Join 算法 | Nested Loop、Hash Join、Merge Join | [06-性能优化和执行计划.md](06-性能优化和执行计划.md) |
| 统计信息 | `ANALYZE`、`pg_stats`、扩展统计 | [06-性能优化和执行计划.md](06-性能优化和执行计划.md) |
| 参数影响 | `work_mem`、`shared_buffers`、并发成本 | [06-性能优化和执行计划.md](06-性能优化和执行计划.md) |
| 慢 SQL 采集 | 慢查询日志、`pg_stat_statements`、`auto_explain`、应用 trace | [23-慢SQL定位和SQL调优.md](23-慢SQL定位和SQL调优.md) |
| 慢 SQL 分类 | 锁等待、I/O、CPU、排序落盘、行数估算错误、深分页、N+1 | [23-慢SQL定位和SQL调优.md](23-慢SQL定位和SQL调优.md) |
| SQL 调优闭环 | 现场快照、执行计划、假设验证、最小改动、复测和回滚 | [23-慢SQL定位和SQL调优.md](23-慢SQL定位和SQL调优.md) |
| 深度慢 SQL 机制 | wait event、generic/custom plan、CTE 物化、临时文件、Hash 分批 | [23-慢SQL定位和SQL调优.md](23-慢SQL定位和SQL调优.md) |
| 索引匹配规则 | B-tree 扫描边界、部分索引谓词蕴含、表达式索引匹配 | [23-慢SQL定位和SQL调优.md](23-慢SQL定位和SQL调优.md) |

## 六、备份、恢复和复制

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 逻辑备份 | `pg_dump`、`pg_restore`、`pg_dumpall` | [08-备份恢复和WAL.md](08-备份恢复和WAL.md) |
| 物理备份 | `pg_basebackup`、基础备份、备份清单 | [08-备份恢复和WAL.md](08-备份恢复和WAL.md) |
| PITR | 基础备份、连续 WAL、恢复目标 | [08-备份恢复和WAL.md](08-备份恢复和WAL.md) |
| RPO/RTO | 数据丢失窗口、恢复时间 | [08-备份恢复和WAL.md](08-备份恢复和WAL.md) |
| 物理复制 | 流复制、hot standby、同步复制 | [09-复制高可用和逻辑复制.md](09-复制高可用和逻辑复制.md) |
| 复制槽 | WAL 保留、滞后风险、`max_slot_wal_keep_size` | [09-复制高可用和逻辑复制.md](09-复制高可用和逻辑复制.md) |
| 逻辑复制 | publication、subscription、replica identity | [09-复制高可用和逻辑复制.md](09-复制高可用和逻辑复制.md) |
| 高可用 | 故障检测、提升、防脑裂、客户端切换 | [09-复制高可用和逻辑复制.md](09-复制高可用和逻辑复制.md) |

## 七、安全和生产运维

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 权限模型 | role、database、schema、table、sequence 权限 | [10-安全权限和连接管理.md](10-安全权限和连接管理.md) |
| 默认权限 | 未来对象授权、对象创建者上下文 | [10-安全权限和连接管理.md](10-安全权限和连接管理.md) |
| RLS | 行级安全策略、租户隔离 | [10-安全权限和连接管理.md](10-安全权限和连接管理.md) |
| 认证 | `pg_hba.conf`、SCRAM、SSL | [10-安全权限和连接管理.md](10-安全权限和连接管理.md) |
| 连接池 | PgBouncer、session、transaction 模式 | [10-安全权限和连接管理.md](10-安全权限和连接管理.md) |
| 监控 | `pg_stat_activity`、`pg_stat_user_tables`、日志 | [11-运维监控和故障排查.md](11-运维监控和故障排查.md) |
| 排障 | 慢查询、锁等待、连接耗尽、WAL 暴涨 | [11-运维监控和故障排查.md](11-运维监控和故障排查.md)、[23-慢SQL定位和SQL调优.md](23-慢SQL定位和SQL调优.md) |
| 升级 | EOL 风险、扩展兼容、逻辑复制迁移 | [11-运维监控和故障排查.md](11-运维监控和故障排查.md) |

## 八、pgvector 和向量检索

| 知识域 | 必须掌握 | 对应章节 |
| --- | --- | --- |
| 扩展安装 | PostgreSQL 13 需要安装 pgvector 二进制文件并在目标数据库执行 `CREATE EXTENSION vector` | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 向量类型 | `vector`、`halfvec`、`bit`、`sparsevec` 的存储、维度限制和适用场景 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 距离函数 | L2、内积、余弦、L1、Hamming、Jaccard 与 embedding 模型输出的匹配关系 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 操作符类 | `vector_l2_ops`、`vector_ip_ops`、`vector_cosine_ops` 与查询操作符匹配规则 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 精确搜索 | 无近似索引时按距离排序的全量扫描、完美召回和成本边界 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| HNSW | 多层图索引、`m`、`ef_construction`、`hnsw.ef_search`、构建内存和召回权衡 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| IVFFlat | 训练数据、lists、probes、数据量不足时召回下降和重建策略 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 过滤和重排序 | 过滤选择率、部分索引、分区、候选集重排和 top k 不足排查 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 迭代扫描 | `strict_order`、`relaxed_order`、扫描上限参数和资源边界 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 混合检索 | 向量召回、全文检索、RRF、reranker 和上下文组装 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 量化和两阶段检索 | `halfvec`、binary quantization、subvector 索引和原向量重排 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| RAG 表设计 | 文档、chunk、embedding、metadata、租户、版本、删除标记和权限过滤 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 质量评测 | 精确搜索基准、recall@k、P95/P99、过滤后候选数和人工相关性 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |
| 生产运维 | 索引构建、WAL 放大、VACUUM、备份恢复、扩展升级、监控和故障剧本 | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |

## 九、高频易错清单

- 把 schema 当 database。
- 只靠应用层保证唯一性。
- 把 `timestamp` 和 `timestamptz` 混用。
- 认为 MVCC 不需要锁。
- 长事务不提交，导致 VACUUM 无法清理。
- 为每个列都建索引。
- 不看 `EXPLAIN ANALYZE` 就优化。
- 只看平均耗时，不看总耗时、调用次数、锁等待和 buffer 读写。
- 未复测就宣称 SQL 已优化。
- 只做备份不做恢复演练。
- 把复制当备份。
- 创建复制槽但不监控 WAL。
- 应用使用超级用户。
- 只授权表权限，忘记 schema `USAGE`。
- PostgreSQL 13 EOL 后仍无升级计划。
- 安装 pgvector 后忘记在每个业务数据库执行 `CREATE EXTENSION vector`。
- embedding 模型变更后把不同维度或不同语义空间的向量混在同一列。
- 把 `<#>` 当普通内积从大到小排序；它返回的是负内积，索引查询要按升序使用。
- 创建近似索引后不做召回率评估，以为结果一定和精确搜索完全相同。
- 带租户、权限或状态过滤时只调向量索引参数，不检查过滤后候选数量。
- 建了 `vector_l2_ops` 索引却用余弦距离查询，或者表达式索引和查询 cast 不一致。
- 用纯向量检索处理错误码、函数名、专有名词等精确词项，不做全文检索混合召回。
- 使用 `halfvec` 或 binary quantization 后不做原向量重排和 recall@k 回归。

## 十、最终验收清单

- 能搭建 PostgreSQL 13 学习环境。
- 能设计招聘系统数据库模型并写出约束。
- 能完成复杂 SQL、窗口函数和 UPSERT。
- 能解释 MVCC、隔离级别、锁等待和死锁。
- 能设计并验证索引。
- 能读懂执行计划并优化慢查询。
- 能用 `pg_stat_statements`、日志、阻塞链和执行计划给出慢 SQL 根因。
- 能完成逻辑备份、物理备份和 PITR 演练。
- 能搭建基础物理复制和逻辑复制。
- 能按最小权限设计账号。
- 能处理生产常见故障。
- 能用 pgvector 完成语义检索原型、索引评估、召回验证和生产风险说明。
- 能解释 HNSW 图结构、IVFFlat 聚类、操作符类匹配、迭代扫描、量化重排和混合检索的取舍。
- 能回答机制题和场景题。

## 十一、深度章节导航

| 深度主题 | 需要能回答的问题 | 文件 |
| --- | --- | --- |
| 存储、WAL、Checkpoint | 一次 UPDATE 在 heap、index、WAL、VM、VACUUM 上分别发生什么 | [15-存储结构WAL和检查点深度解析.md](15-存储结构WAL和检查点深度解析.md) |
| MVCC、锁、隔离级别 | snapshot 如何判断 tuple 可见，SERIALIZABLE 为什么需要重试 | [16-MVCC可见性锁和隔离级别深度解析.md](16-MVCC可见性锁和隔离级别深度解析.md) |
| 优化器和执行计划 | 优化器如何用统计信息、成本参数和 join 搜索选计划 | [17-优化器代价模型和执行计划深度解析.md](17-优化器代价模型和执行计划深度解析.md) |
| VACUUM、freeze、膨胀 | autovacuum 触发公式是什么，为什么 VACUUM 后文件不变小 | [18-VACUUM冻结膨胀和Autovacuum深度解析.md](18-VACUUM冻结膨胀和Autovacuum深度解析.md) |
| 复制、PITR、高可用 | LSN、timeline、slot、promote、pg_rewind 如何协作 | [19-复制PITR和高可用深度解析.md](19-复制PITR和高可用深度解析.md) |
| 参数和容量 | 如何估算连接、内存、WAL、临时文件和维护任务预算 | [20-生产参数调优和容量规划.md](20-生产参数调优和容量规划.md) |
| 故障排查 | 慢查询、锁、WAL、复制、膨胀事故如何按证据处理 | [21-故障案例和排障剧本.md](21-故障案例和排障剧本.md) |
| 实验和自测 | 如何用实验验证机制，而不是只背概念 | [22-实验手册和自测题.md](22-实验手册和自测题.md) |
| 慢 SQL 和 SQL 调优 | 如何从 Top SQL、阻塞链、执行计划、统计信息和索引设计定位根因并复测 | [23-慢SQL定位和SQL调优.md](23-慢SQL定位和SQL调优.md) |
| pgvector | 如何把语义检索、近似索引、过滤召回和 RAG 生产链路放进 PostgreSQL | [24-pgvector向量检索和RAG实践.md](24-pgvector向量检索和RAG实践.md) |

## 十二、深度验收清单

- 能解释 heap page 内部结构、tuple 系统列和 HOT update。
- 能解释 WAL、full page writes、checkpoint 和崩溃恢复的关系。
- 能用 snapshot 的 `xmin`、`xmax`、活跃事务列表解释可见性。
- 能区分 heavyweight lock、row lock、LWLock、buffer pin 和 predicate lock。
- 能解释 SSI 如何通过读写依赖检测串行化冲突。
- 能从 `pg_stats` 解释选择率估算和数据倾斜。
- 能解释 generic plan 和 custom plan 的性能差异。
- 能写出 autovacuum 触发公式，并为大表设置表级参数。
- 能说明 freeze 和事务 ID 回卷风险。
- 能根据 LSN 拆解复制延迟。
- 能解释 timeline、promote 和 pg_rewind 的关系。
- 能按负载估算 `work_mem`、连接数、WAL 和备份空间。
- 能写生产故障的现场快照 SQL、止血动作和长期修复。
- 能完成慢 SQL 调优报告：现象、证据、根因、改动、风险、回滚和复测指标。
- 能解释慢 SQL 背后的等待事件、计划缓存、统计信息、CTE 优化边界和索引匹配规则。
- 能解释 pgvector 近似索引为什么会改变查询结果，如何用精确搜索样本计算 recall@k。
- 能针对 pgvector 的查询慢、结果不足、WAL 暴涨、VACUUM 慢和恢复失败写出排障步骤。
