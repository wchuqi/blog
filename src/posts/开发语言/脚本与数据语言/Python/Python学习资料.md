---
title: "Python学习资料"
date: 2026-06-20
description: "这是一套面向 Python 3.x 的中文学习资料。内容从基础语法、运行模型、数据结构逐步推进到工程化、并发、性能、排障和面试准备。"
tags:
  - "开发语言"
  - "Python"
  - "学习资料总览"
category: "开发语言"
---

# Python学习资料

这是一套面向 Python 3.x 的中文学习资料。内容从基础语法、运行模型、数据结构逐步推进到工程化、并发、性能、排障和面试准备。

版本假设：以 Python 3.10+ 为主要学习目标，兼顾 Python 3.8 到 3.13 的通用能力；不覆盖 Python 2。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览、环境和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 语法基础和运行模型 | [01-语法基础和运行模型.md](study-material/01-语法基础和运行模型.md) |
| 2 | 内置类型和数据结构 | [02-内置类型和数据结构.md](study-material/02-内置类型和数据结构.md) |
| 3 | 控制流、函数和作用域 | [03-控制流函数和作用域.md](study-material/03-控制流函数和作用域.md) |
| 4 | 面向对象和数据模型 | [04-面向对象和数据模型.md](study-material/04-面向对象和数据模型.md) |
| 5 | 模块、包和导入机制 | [05-模块包和导入机制.md](study-material/05-模块包和导入机制.md) |
| 6 | 异常处理和文件 IO | [06-异常处理和文件IO.md](study-material/06-异常处理和文件IO.md) |
| 7 | 迭代器、生成器和推导式 | [07-迭代器生成器和推导式.md](study-material/07-迭代器生成器和推导式.md) |
| 8 | 函数式工具、装饰器和上下文管理器 | [08-函数式工具装饰器和上下文管理器.md](study-material/08-函数式工具装饰器和上下文管理器.md) |
| 9 | 标准库常用能力 | [09-标准库常用能力.md](study-material/09-标准库常用能力.md) |
| 10 | 虚拟环境、依赖和项目结构 | [10-虚拟环境依赖和项目结构.md](study-material/10-虚拟环境依赖和项目结构.md) |
| 11 | 测试、调试、日志和质量工具 | [11-测试调试日志和质量工具.md](study-material/11-测试调试日志和质量工具.md) |
| 12 | 并发、异步和性能 | [12-并发异步和性能.md](study-material/12-并发异步和性能.md) |
| 13 | 面试知识点整理 | [13-面试知识点整理.md](study-material/13-面试知识点整理.md) |
| 14 | Python 完整知识点清单 | [14-Python完整知识点清单.md](study-material/14-Python完整知识点清单.md) |
| 15 | 综合练习项目 | [15-综合练习项目.md](study-material/15-综合练习项目.md) |
| 16 | CPython 运行时、对象模型和内存管理 | [16-CPython运行时对象模型和内存管理.md](study-material/16-CPython运行时对象模型和内存管理.md) |
| 17 | 描述符、属性查找和元类 | [17-描述符属性查找和元类.md](study-material/17-描述符属性查找和元类.md) |
| 18 | 类型提示、泛型和静态分析 | [18-类型提示泛型和静态分析.md](study-material/18-类型提示泛型和静态分析.md) |
| 19 | 导入系统、打包发布和依赖解析 | [19-导入系统打包发布和依赖解析.md](study-material/19-导入系统打包发布和依赖解析.md) |
| 20 | 并发、异步事件循环和 GIL 深入 | [20-并发异步事件循环和GIL深入.md](study-material/20-并发异步事件循环和GIL深入.md) |
| 21 | 性能剖析、内存优化和大规模数据处理 | [21-性能剖析内存优化和大规模数据处理.md](study-material/21-性能剖析内存优化和大规模数据处理.md) |
| 22 | 生产安全、配置、可观测性和可靠性 | [22-生产安全配置可观测性和可靠性.md](study-material/22-生产安全配置可观测性和可靠性.md) |

## 使用建议

先读 [Python学习路线图.md](Python学习路线图.md)，再按上表顺序学习。每个章节都包含学习目标、理论导读、心智模型、例子、练习、验收标准、重点、难点和易错点。

复习时优先看 `重点` 和 `易错`。准备面试时先看 [13-面试知识点整理.md](study-material/13-面试知识点整理.md)，再按类别阅读 `study-material/面试知识点/` 下的文件。

如果你已经有 Python 基础，不必从第 0 章开始。可以直接阅读第 16 到 22 章的深入专题，再回到前面章节补缺口。

## 产出建议

学习过程中至少完成三个产出：一个命令行脚本、一个带测试的小工具包、一个使用标准库完成的自动化项目。最后用 [15-综合练习项目.md](study-material/15-综合练习项目.md) 做综合验收。

## 扩展模块

| 模块 | 说明 | 入口 |
| --- | --- | --- |
| FastAPI | Python Web API 框架学习资料，覆盖路由、Pydantic、依赖注入、异步、数据库、安全、测试、部署和面试准备。 | [FastApi/FastApi学习资料.md](FastApi/FastApi学习资料.md) |
| NumPy | Python 数值计算基础学习资料，覆盖 ndarray、dtype、shape、strides、索引、广播、ufunc、统计线代、性能和面试准备。 | [Numpy/Numpy学习资料.md](Numpy/Numpy学习资料.md) |
| Pandas | Python 表格数据分析学习资料，覆盖 Series、DataFrame、Index、dtype、缺失值、IO、清洗、groupby、merge、时间序列、性能和面试准备。 | [Pandas/Pandas学习资料.md](Pandas/Pandas学习资料.md) |
| Paramiko | Python SSH 自动化学习资料，覆盖 SSH 安全模型、Host Key、认证、命令执行、SFTP、跳板机、并发、超时重试、排障和面试准备。 | [paramiko/Paramiko学习资料.md](paramiko/Paramiko学习资料.md) |
