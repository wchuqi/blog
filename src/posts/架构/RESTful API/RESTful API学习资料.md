---
title: "RESTful API学习资料"
date: 2026-06-20
description: "这是一份 RESTful API 学习资料索引。详细内容按知识点拆分到 study-material/ 目录，适合后端开发、前端联调、接口设计评审和面试复习。"
tags:
  - "架构"
  - "RESTful API"
  - "学习资料总览"
category: "架构"
---

# RESTful API学习资料

这是一份 RESTful API 学习资料索引。详细内容按知识点拆分到 `study-material/` 目录，适合后端开发、前端联调、接口设计评审和面试复习。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | HTTP基础和资源建模 | [01-HTTP基础和资源建模.md](study-material/01-HTTP基础和资源建模.md) |
| 2 | URI路径查询和命名规范 | [02-URI路径查询和命名规范.md](study-material/02-URI路径查询和命名规范.md) |
| 3 | HTTP方法安全性幂等性 | [03-HTTP方法安全性幂等性.md](study-material/03-HTTP方法安全性幂等性.md) |
| 4 | 请求响应表示和内容协商 | [04-请求响应表示和内容协商.md](study-material/04-请求响应表示和内容协商.md) |
| 5 | 状态码错误模型和ProblemDetails | [05-状态码错误模型和ProblemDetails.md](study-material/05-状态码错误模型和ProblemDetails.md) |
| 6 | 认证授权安全和CORS | [06-认证授权安全和CORS.md](study-material/06-认证授权安全和CORS.md) |
| 7 | 分页过滤排序和批量操作 | [07-分页过滤排序和批量操作.md](study-material/07-分页过滤排序和批量操作.md) |
| 8 | 缓存条件请求和并发控制 | [08-缓存条件请求和并发控制.md](study-material/08-缓存条件请求和并发控制.md) |
| 9 | 版本兼容和演进策略 | [09-版本兼容和演进策略.md](study-material/09-版本兼容和演进策略.md) |
| 10 | OpenAPI契约测试和文档 | [10-OpenAPI契约测试和文档.md](study-material/10-OpenAPI契约测试和文档.md) |
| 11 | 网关限流观测和排障 | [11-网关限流观测和排障.md](study-material/11-网关限流观测和排障.md) |
| 12 | 设计实战项目 | [12-RESTful API设计实战项目.md](study-material/12-RESTful API设计实战项目.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | 完整知识点清单 | [14-RESTful API完整知识点清单.md](study-material/14-RESTful API完整知识点清单.md) |
| 15 | REST约束成熟度和架构取舍深度解析 | [15-REST约束成熟度和架构取舍深度解析.md](study-material/15-REST约束成熟度和架构取舍深度解析.md) |
| 16 | 资源建模决策树和反模式深度解析 | [16-资源建模决策树和反模式深度解析.md](study-material/16-资源建模决策树和反模式深度解析.md) |
| 17 | HTTP语义状态码和错误边界深度解析 | [17-HTTP语义状态码和错误边界深度解析.md](study-material/17-HTTP语义状态码和错误边界深度解析.md) |
| 18 | 幂等重试并发和一致性深度解析 | [18-幂等重试并发和一致性深度解析.md](study-material/18-幂等重试并发和一致性深度解析.md) |
| 19 | 安全威胁模型OAuth2 JWT和多租户深度解析 | [19-安全威胁模型OAuth2 JWT和多租户深度解析.md](study-material/19-安全威胁模型OAuth2 JWT和多租户深度解析.md) |
| 20 | 缓存分页性能网关和排障深度解析 | [20-缓存分页性能网关和排障深度解析.md](study-material/20-缓存分页性能网关和排障深度解析.md) |
| 21 | 契约版本治理和评审清单深度解析 | [21-契约版本治理和评审清单深度解析.md](study-material/21-契约版本治理和评审清单深度解析.md) |

## 使用建议

- 系统学习：按顺序阅读 00 到 12，再用 14 检查遗漏。
- 面试复习：先读 00、03、05、06、08、09，再刷 13 和 `面试知识点/`。
- 接口评审：重点看 02、03、04、05、07、09、10。
- 生产排障：重点看 05、06、08、11。
- 深度提升：读完基础后重点看 15 到 21，按“架构约束、建模决策、协议边界、分布式可靠性、安全、性能、治理”的顺序复盘。

## 练习主线

建议围绕“电商订单 API”完成贯穿练习：用户浏览商品、加入购物车、下单、支付、取消、退款、查询订单、后台发货、售后处理。每章都把概念落到这条主线上。
