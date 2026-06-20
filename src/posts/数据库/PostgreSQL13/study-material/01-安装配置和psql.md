---
title: "PostgreSQL 13 学习资料：安装配置和 psql"
date: 2026-06-20
description: "PostgreSQL 的运行依赖一个数据目录。数据目录里保存数据库文件、WAL、配置文件和运行状态。初始化由 initdb 完成，启动后服务监听本地或网络端口，客户端通过 libpq 连接，认证规则由 pghba.conf 决定。"
tags:
  - "数据库"
  - "PostgreSQL13"
category: "数据库"
---

# PostgreSQL 13 学习资料：安装配置和 psql

[返回索引](../PostgreSQL13学习资料.md)

## 学习目标

- 能安装或连接 PostgreSQL 13，并完成基本初始化。
- 掌握配置文件、连接认证、服务管理和 `psql` 常用命令。
- 理解配置层级和参数生效方式。

## 理论导读

PostgreSQL 的运行依赖一个数据目录。数据目录里保存数据库文件、WAL、配置文件和运行状态。初始化由 `initdb` 完成，启动后服务监听本地或网络端口，客户端通过 libpq 连接，认证规则由 `pg_hba.conf` 决定。

配置不是单一入口。`postgresql.conf` 管运行参数，`pg_hba.conf` 管谁可以从哪里用什么方式认证，`pg_ident.conf` 管系统用户和数据库用户映射。部分参数可以在线 reload，部分必须 restart，部分可以在 session 级别设置。

## 核心心智模型

把 PostgreSQL 配置看成三层门禁：

1. 服务是否监听：`listen_addresses` 和 `port`。
2. 来源是否允许：`pg_hba.conf` 按顺序匹配规则。
3. 用户是否有权限：role、database、schema、对象权限。

其中 `pg_hba.conf` 是顺序匹配，第一条命中就停止。规则顺序错误是连接故障的高频原因。

## 知识点详解

### 1. 常用命令

```powershell
psql -h localhost -p 5432 -U postgres -d postgres
createdb -h localhost -U postgres job_app
dropdb -h localhost -U postgres job_app
pg_isready -h localhost -p 5432
```

`psql` 内部命令常用清单：

| 命令 | 作用 |
| --- | --- |
| `\l` | 列出数据库 |
| `\c job_app` | 切换数据库 |
| `\dn` | 列出 schema |
| `\dt` | 列出表 |
| `\d+ table_name` | 查看表结构和存储信息 |
| `\df` | 查看函数 |
| `\x` | 切换扩展显示 |
| `\timing` | 显示 SQL 耗时 |
| `\e` | 调用编辑器编辑 SQL |
| `\copy` | 客户端导入导出 |

### 2. 配置文件

```sql
SHOW config_file;
SHOW hba_file;
SHOW data_directory;
SHOW shared_buffers;
SHOW max_connections;
```

常见配置项：

| 参数 | 作用 | 常见注意点 |
| --- | --- | --- |
| `listen_addresses` | 监听地址 | 改成 `*` 只表示服务监听，不表示认证放行 |
| `port` | 端口 | 默认 5432 |
| `max_connections` | 最大连接数 | 过大可能增加内存压力，生产常配连接池 |
| `shared_buffers` | 共享缓冲区 | 通常是内存规划重点之一 |
| `work_mem` | 排序、哈希等操作内存 | 是每个操作节点可能使用，不是全局总量 |
| `maintenance_work_mem` | VACUUM、CREATE INDEX 等维护内存 | 大表维护时影响明显 |
| `wal_level` | WAL 记录级别 | 逻辑复制需要 `logical` |
| `log_min_duration_statement` | 慢查询日志阈值 | 排查慢 SQL 必备 |

### 3. 参数生效方式

```sql
SELECT name, setting, context
FROM pg_settings
WHERE name IN ('shared_buffers', 'work_mem', 'max_connections');
```

`context` 表示参数修改级别，例如 `postmaster` 需要重启，`sighup` 需要 reload，`user` 可以会话级修改。

```sql
ALTER SYSTEM SET log_min_duration_statement = '500ms';
SELECT pg_reload_conf();
```

### 4. `pg_hba.conf` 匹配规则

规则格式大致为：

```text
TYPE  DATABASE  USER  ADDRESS  METHOD
```

示例：

```text
local   all      all                  peer
host    job_app  app_user  10.0.0.0/24 md5
host    all      all       127.0.0.1/32 md5
```

匹配从上到下进行，第一条匹配后不再继续。生产环境应把更具体的规则放在更前面。

## 例子

创建学习数据库和账号：

```sql
CREATE ROLE app_user LOGIN PASSWORD 'change_me';
CREATE DATABASE job_app OWNER app_user;
\c job_app
CREATE SCHEMA hr AUTHORIZATION app_user;
```

查看连接：

```sql
SELECT pid, usename, datname, client_addr, application_name, state
FROM pg_stat_activity
ORDER BY backend_start DESC;
```

## 练习

1. 找到当前实例的 `data_directory`、`config_file`、`hba_file`。
2. 新建 `job_app` 数据库和 `app_user` 登录账号。
3. 设置慢查询日志阈值为 500ms 并 reload。
4. 用错误密码连接一次，观察日志和错误信息。

## 验收

- 能解释 `postgresql.conf` 和 `pg_hba.conf` 的职责差异。
- 能判断一个参数修改后是否需要重启。
- 能用 `psql` 完成对象查看、连接切换、执行计时和表结构查看。

## 重点

- `pg_hba.conf` 是顺序匹配。
- `work_mem` 是单个操作可能使用的内存，不是总限制。
- 参数修改前要确认 `pg_settings.context`。

## 难点

- 连接失败往往不是一个原因：监听地址、网络、安全组、`pg_hba.conf`、用户名密码、数据库权限都可能参与。

## 易错

> **易错：** 修改 `listen_addresses='*'` 后认为所有客户端都能连接。
>
> 正确做法：还要检查端口、防火墙和 `pg_hba.conf`。

> **易错：** 为了解决连接不够直接把 `max_connections` 调得很大。
>
> 正确做法：先评估连接池、慢 SQL、事务占用和内存预算。

