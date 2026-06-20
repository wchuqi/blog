---
title: "TypeScript学习资料"
date: 2026-06-20
description: "这是一份面向求职、工程实践和长期复习的 TypeScript 学习资料索引。详细内容按知识点拆分到 study-material/ 目录。"
tags:
  - "开发语言"
  - "TypeScript"
  - "学习资料总览"
category: "开发语言"
---

# TypeScript学习资料

这是一份面向求职、工程实践和长期复习的 TypeScript 学习资料索引。详细内容按知识点拆分到 `study-material/` 目录。

## 学习顺序

| 顺序 | 知识点 | 文件 |
| --- | --- | --- |
| 0 | 总览和心智模型 | [00-总览与心智模型.md](study-material/00-总览与心智模型.md) |
| 1 | 环境、工具链和 tsconfig | [01-环境工具链和tsconfig.md](study-material/01-环境工具链和tsconfig.md) |
| 2 | JavaScript 基础和类型标注 | [02-JavaScript基础和类型标注.md](study-material/02-JavaScript基础和类型标注.md) |
| 3 | 类型系统基础和结构化类型 | [03-类型系统基础和结构化类型.md](study-material/03-类型系统基础和结构化类型.md) |
| 4 | 联合、交叉、字面量和收窄 | [04-联合交叉字面量和收窄.md](study-material/04-联合交叉字面量和收窄.md) |
| 5 | 函数、对象、类和接口 | [05-函数对象类和接口.md](study-material/05-函数对象类和接口.md) |
| 6 | 泛型、约束和类型参数 | [06-泛型约束和类型参数.md](study-material/06-泛型约束和类型参数.md) |
| 7 | `keyof`、`typeof` 和索引访问 | [07-类型查询keyof和索引访问.md](study-material/07-类型查询keyof和索引访问.md) |
| 8 | 条件类型、映射类型和模板字面量类型 | [08-条件类型映射类型和模板字面量类型.md](study-material/08-条件类型映射类型和模板字面量类型.md) |
| 9 | 模块、声明文件和类型发布 | [09-模块系统声明文件和类型发布.md](study-material/09-模块系统声明文件和类型发布.md) |
| 10 | 编译模式、模块解析和配置层 | [10-编译模式模块解析和配置层.md](study-material/10-编译模式模块解析和配置层.md) |
| 11 | 工程化、测试、Lint 和运行时边界 | [11-工程化测试Lint和运行时边界.md](study-material/11-工程化测试Lint和运行时边界.md) |
| 12 | 前端和 Node 工程实践 | [12-前端Node和框架类型实践.md](study-material/12-前端Node和框架类型实践.md) |
| 13 | 异步、错误处理和安全边界 | [13-异步错误处理和安全边界.md](study-material/13-异步错误处理和安全边界.md) |
| 14 | 面试知识点整理 | [14-面试知识点整理.md](study-material/14-面试知识点整理.md) |
| 15 | 完整知识点清单 | [15-TypeScript完整知识点清单.md](study-material/15-TypeScript完整知识点清单.md) |
| 16 | 综合练习项目 | [16-综合练习项目.md](study-material/16-综合练习项目.md) |
| 17 | 版本迁移和大型项目治理 | [17-版本迁移和大型项目治理.md](study-material/17-版本迁移和大型项目治理.md) |
| 18 | 编译器架构和类型检查流程深度解析 | [18-编译器架构和类型检查流程深度解析.md](study-material/18-编译器架构和类型检查流程深度解析.md) |
| 19 | 结构化类型兼容性和控制流分析深度解析 | [19-结构化类型兼容性和控制流分析深度解析.md](study-material/19-结构化类型兼容性和控制流分析深度解析.md) |
| 20 | 泛型推断、条件类型分发和 infer 深度解析 | [20-泛型推断条件类型分发和infer深度解析.md](study-material/20-泛型推断条件类型分发和infer深度解析.md) |
| 21 | 模块解析、声明文件和包导出深度解析 | [21-模块解析声明文件和包导出深度解析.md](study-material/21-模块解析声明文件和包导出深度解析.md) |
| 22 | tsconfig 严格模式迁移和类型性能深度解析 | [22-tsconfig严格模式迁移和类型性能深度解析.md](study-material/22-tsconfig严格模式迁移和类型性能深度解析.md) |
| 23 | 运行时边界、Schema 和类型安全 API 设计 | [23-运行时边界Schema和类型安全API设计深度解析.md](study-material/23-运行时边界Schema和类型安全API设计深度解析.md) |
| 24 | 生产案例和排障手册深度版 | [24-生产案例和排障手册深度版.md](study-material/24-生产案例和排障手册深度版.md) |
| 25 | 深度实验手册和能力验收 | [25-深度实验手册和能力验收.md](study-material/25-深度实验手册和能力验收.md) |

## 使用建议

- 入门学习：按 00 到 05 阅读，先建立“类型系统服务 JavaScript 代码”的心智模型。
- 进阶学习：重点读 06 到 10，掌握泛型、类型运算、模块解析和 tsconfig。
- 工程使用：重点读 10 到 13、16、17，把类型检查接入构建、测试、CI 和发布流程。
- 深度补强：读完 00 到 17 后，按 18 到 25 深入编译器、类型兼容、泛型推断、模块解析、类型性能和生产排障。
- 面试复习：先读 15 完整清单，再读 14 和 `study-material/面试知识点/`；中高级面试重点读 18 到 25。
- 排障参考：遇到类型推断、模块解析、声明文件、`strict` 迁移问题时，优先查 18、20、21、22、24。

## 环境假设

- Node.js 已安装。
- 包管理器可以使用 npm、pnpm 或 yarn。
- 示例以 TypeScript 官方编译器 `tsc`、现代 ESM/CJS 混合生态和 `strict` 模式为默认讨论对象。
