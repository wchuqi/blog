---
title: "Paramiko学习资料：SSH 安全模型、Host Key 和认证"
date: 2026-06-20
description: "SSH 安全模型包含两个核心问题：客户端如何确认“连接的是正确服务器”，服务器如何确认“用户有权限登录”。前者靠服务器 Host Key，后者靠密码、私钥、Agent 等认证方式。"
tags:
  - "开发语言"
  - "paramiko"
category: "开发语言"
---

# Paramiko学习资料：SSH 安全模型、Host Key 和认证

[返回索引](../Paramiko学习资料.md)

## 学习目标

- 理解服务器身份校验和用户认证的区别。
- 掌握 Host Key 策略。
- 了解密码、私钥、Agent 和证书类认证的边界。

## 理论导读

SSH 安全模型包含两个核心问题：客户端如何确认“连接的是正确服务器”，服务器如何确认“用户有权限登录”。前者靠服务器 Host Key，后者靠密码、私钥、Agent 等认证方式。

跳过 Host Key 校验会让中间人攻击更容易发生。自动化脚本不能因为方便就默认信任所有未知主机。

## Host Key 策略

```python
client = paramiko.SSHClient()
client.load_system_host_keys()
client.set_missing_host_key_policy(paramiko.RejectPolicy())
```

开发环境可以临时使用 `AutoAddPolicy`，但生产环境应维护 known_hosts 或指纹白名单。

## 认证方式比较

| 方式 | 优点 | 风险 |
| --- | --- | --- |
| 密码 | 简单 | 泄露风险高，难审计 |
| 私钥 | 适合自动化 | 私钥文件权限和 passphrase 管理 |
| SSH Agent | 不直接暴露私钥 | Agent 生命周期和转发风险 |
| 跳板机认证 | 统一入口 | 链路复杂，排障成本高 |

## 练习

用错误 Host Key 或错误密码连接测试环境，分别观察异常和日志。

## 验收

- 能解释 Host Key 校验的作用。
- 能区分认证失败和主机身份不可信。
- 能说明私钥文件为什么不应提交到仓库。

## 重点

- 生产脚本中未知主机应拒绝或走审批，不应无条件添加。

## 难点

- 主机重装后 Host Key 变化，既可能是正常变更，也可能是安全风险，需要有变更记录确认。

## 易错

> **易错：** 把 Host Key 校验失败当成普通网络错误忽略。
>
> 正确做法：核对主机指纹和变更记录，再更新 known_hosts。

