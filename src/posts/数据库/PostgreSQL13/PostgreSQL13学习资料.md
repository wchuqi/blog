---
title: "PostgreSQL 13 学习资料"
date: 2026-06-20
description: "这是一份索引文件。详细内容按知识点拆分到 study-material/ 目录，覆盖 PostgreSQL 13 从基础使用、SQL 开发、事务并发、性能优化到生产运维、备份恢复、高可用、安全和面试复习。"
tags:
  - "数据库"
  - "PostgreSQL13"
  - "学习资料总览"
category: "数据库"
---

# PostgreSQL 13 学习资料

这是一份索引文件。详细内容按知识点拆分到 `study-material/` 目录，覆盖 PostgreSQL 13 从基础使用、SQL 开发、事务并发、性能优化到生产运维、备份恢复、高可用、安全和面试复习。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 安装配置和 `psql` | [01-安装配置和psql.md](study-material/01-安装配置和psql.md) |
| 2 | SQL 基础和数据建模 | [02-SQL基础和数据建模.md](study-material/02-SQL基础和数据建模.md) |
| 3 | 数据类型、约束和 Schema | [03-数据类型约束和Schema.md](study-material/03-数据类型约束和Schema.md) |
| 4 | 事务、MVCC 和锁 | [04-事务MVCC和锁.md](study-material/04-事务MVCC和锁.md) |
| 5 | 索引类型和查询规划 | [05-索引类型和查询规划.md](study-material/05-索引类型和查询规划.md) |
| 6 | 性能优化和执行计划 | [06-性能优化和执行计划.md](study-material/06-性能优化和执行计划.md) |
| 7 | 函数、触发器、视图和扩展 | [07-函数触发器视图和扩展.md](study-material/07-函数触发器视图和扩展.md) |
| 8 | 备份恢复和 WAL | [08-备份恢复和WAL.md](study-material/08-备份恢复和WAL.md) |
| 9 | 复制、高可用和逻辑复制 | [09-复制高可用和逻辑复制.md](study-material/09-复制高可用和逻辑复制.md) |
| 10 | 安全权限和连接管理 | [10-安全权限和连接管理.md](study-material/10-安全权限和连接管理.md) |
| 11 | 运维监控和故障排查 | [11-运维监控和故障排查.md](study-material/11-运维监控和故障排查.md) |
| 12 | 实战项目和综合练习 | [12-实战项目和练习.md](study-material/12-实战项目和练习.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-PostgreSQL13完整知识点清单.md](study-material/14-PostgreSQL13完整知识点清单.md) |
| 15 | 存储结构、WAL 和 Checkpoint 深度解析 | [15-存储结构WAL和检查点深度解析.md](study-material/15-存储结构WAL和检查点深度解析.md) |
| 16 | MVCC 可见性、锁和隔离级别深度解析 | [16-MVCC可见性锁和隔离级别深度解析.md](study-material/16-MVCC可见性锁和隔离级别深度解析.md) |
| 17 | 优化器代价模型和执行计划深度解析 | [17-优化器代价模型和执行计划深度解析.md](study-material/17-优化器代价模型和执行计划深度解析.md) |
| 18 | VACUUM、冻结、膨胀和 Autovacuum 深度解析 | [18-VACUUM冻结膨胀和Autovacuum深度解析.md](study-material/18-VACUUM冻结膨胀和Autovacuum深度解析.md) |
| 19 | 复制、PITR 和高可用深度解析 | [19-复制PITR和高可用深度解析.md](study-material/19-复制PITR和高可用深度解析.md) |
| 20 | 生产参数调优和容量规划 | [20-生产参数调优和容量规划.md](study-material/20-生产参数调优和容量规划.md) |
| 21 | 故障案例和排障剧本 | [21-故障案例和排障剧本.md](study-material/21-故障案例和排障剧本.md) |
| 22 | 实验手册和自测题 | [22-实验手册和自测题.md](study-material/22-实验手册和自测题.md) |
| 23 | 慢 SQL 定位和 SQL 调优 | [23-慢SQL定位和SQL调优.md](study-material/23-慢SQL定位和SQL调优.md) |
| 24 | pgvector 向量检索和 RAG 实践 | [24-pgvector向量检索和RAG实践.md](study-material/24-pgvector向量检索和RAG实践.md) |

## 使用建议

- 初学或系统补漏：按 0 到 12 顺序学习，边读边执行 SQL 和命令。
- 面试复习：先读 [14-PostgreSQL13完整知识点清单.md](study-material/14-PostgreSQL13完整知识点清单.md)，再读 [13-面试知识点整理.md](study-material/13-面试知识点整理.md)。
- 性能专项：重点读 4、5、6、11、17、23。
- 运维专项：重点读 1、8、9、10、11。
- 深度机制专项：重点读 15、16、17、18、19。
- 生产能力专项：重点读 20、21、22。
- AI 检索和 RAG 专项：重点读 7、24，并结合 5、6、10、11 理解扩展、索引、执行计划、权限和运维。
- 生产迁移：重点关注 PostgreSQL 13 已 EOL 的风险，并结合 8、9、10、11 制定升级前验证方案。

## 环境假设

- 数据库版本：PostgreSQL 13。
- 常用工具：`psql`、`createdb`、`pg_dump`、`pg_restore`、`pg_basebackup`、`pg_ctl`、`pg_isready`。
- 示例库：`job_app`。
- 示例业务：招聘系统，包括候选人、岗位、投递、面试、Offer。

## 学习验收

完成本资料后，你应该能够：

- 独立设计中等复杂度业务表结构。
- 用 SQL 处理查询、统计、分页、幂等写入和报表分析。
- 解释事务隔离、MVCC、锁等待和死锁。
- 阅读执行计划并定位慢查询。
- 能用日志、`pg_stat_statements`、`pg_stat_activity` 和执行计划完成慢 SQL 定位与调优闭环。
- 制定备份恢复和复制方案。
- 管理权限、连接、监控、日志和常见故障。
- 使用 pgvector 设计向量表、选择距离函数、建立 HNSW 或 IVFFlat 索引，并解释召回率、过滤条件和生产风险。
- 回答 PostgreSQL 后端或 DBA 面试中的机制类和场景类问题。
