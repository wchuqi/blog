---
title: "SQL 学习资料：SQL注入权限和安全边界"
date: 2026-06-20
description: "SQL 注入不是“用户输入里有奇怪字符”这么简单，而是应用把用户输入拼接成 SQL 结构的一部分，让攻击者改变了原本的语义。防注入的核心是把 SQL 结构和数据值分离：SQL 结构由程序固定，用户输入作为参数绑定。对于排序字段、表名、列名这…"
tags:
  - "数据库"
  - "SQL"
category: "数据库"
---

# SQL 学习资料：SQL注入权限和安全边界

[返回索引](../SQL学习资料.md)

## 学习目标

- 理解 SQL 注入的本质。
- 掌握参数化查询和动态 SQL 白名单。
- 理解最小权限、审计、脱敏和导出风险。

## 理论导读

SQL 注入不是“用户输入里有奇怪字符”这么简单，而是应用把用户输入拼接成 SQL 结构的一部分，让攻击者改变了原本的语义。防注入的核心是把 SQL 结构和数据值分离：SQL 结构由程序固定，用户输入作为参数绑定。对于排序字段、表名、列名这种不能参数化的位置，要使用白名单映射，而不是直接拼接。

## 错误示例

```java
String sql = "SELECT * FROM candidates WHERE email = '" + email + "'";
```

如果 `email` 为：

```text
' OR '1'='1
```

SQL 语义被改变。

## 参数化查询

```java
PreparedStatement ps = conn.prepareStatement(
    "SELECT * FROM candidates WHERE email = ?"
);
ps.setString(1, email);
```

## 动态 ORDER BY

错误：

```java
String sql = "SELECT * FROM jobs ORDER BY " + sortField;
```

正确：白名单映射。

```java
Map<String, String> allowed = Map.of(
    "createdAt", "created_at",
    "salary", "max_salary"
);
String column = allowed.getOrDefault(sortField, "created_at");
String sql = "SELECT * FROM jobs ORDER BY " + column + " DESC";
```

排序方向也要白名单：

```java
String direction = "asc".equalsIgnoreCase(inputDirection) ? "ASC" : "DESC";
```

## 权限最小化

- 应用账号只授予必要表和必要操作。
- 读写账号分离。
- 报表导出账号限制范围。
- 禁止应用账号拥有 DDL 超级权限。
- 敏感表单独授权和审计。

## 脱敏和导出

SQL 安全还包括：

- 邮箱、手机号、身份证、薪资等敏感字段脱敏。
- 导出任务审批和审计。
- 日志中避免打印完整 SQL 参数。
- 备份文件加密和权限控制。

## 练习

1. 找出一个字符串拼接 SQL 的注入风险。
2. 把动态查询改成参数化。
3. 为动态排序实现白名单。
4. 设计应用账号权限：候选人查询、投递写入、报表读取。

## 验收

- 能解释 SQL 注入本质。
- 能区分值参数化和结构白名单。
- 能给出最小权限方案。

## 重点

- 参数化处理值，白名单处理 SQL 结构。

## 难点

- 动态表名、列名、排序方向不能靠普通占位符解决。

## 易错

> **易错：** 只做字符串转义就认为安全。
>
> 正确做法：优先参数化查询，无法参数化的结构部分使用严格白名单。

