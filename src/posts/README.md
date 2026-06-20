---
title: "jobsearch"
date: 2026-06-20
description: "面向求职、面试和系统化复习的技术知识库。仓库内容以学习路线图、分章节学习资料、面试知识点和配套示例代码为主，覆盖后端、数据库、中间件、架构、算法、运维、前端框架和 AI 工程实践等方向。"
tags:
  - "求职资料"
category: "求职资料"
---

# job_search

面向求职、面试和系统化复习的技术知识库。仓库内容以学习路线图、分章节学习资料、面试知识点和配套示例代码为主，覆盖后端、数据库、中间件、架构、算法、运维、前端框架和 AI 工程实践等方向。

## 目录结构

```text
.
├── AI/                 # AI 工具、AI Agent、Prompt Engineering、Context Engineering 等
├── 工具&中间件/        # Redis、Nginx、Git、正则表达式等
├── 开发语言/           # Java、Python、Go、Rust 等语言学习资料
├── 数据库/             # MySQL、PostgreSQL、MongoDB 等数据库资料
├── 架构/               # 微服务、分布式系统、分布式锁与事务等
├── 框架/               # Spring Boot、Spring Cloud、Spring Framework、MyBatis、Vue3 等
├── 算法/               # 算法路线图、知识点、面试题和练习资料
├── 运维/               # Linux、生产排障和运维基础
└── source_code/        # 与学习资料配套的示例代码和测试项目
```

## 内容组织

多数主题目录包含以下几类资料：

- `学习路线图.md`：按阶段组织的学习路径。
- `学习资料.md`：主题知识的系统化总结。
- `study-material/`：分章节学习笔记、深度解析、练习项目和验收标准。
- `study-material/面试知识点/`：按知识块拆分的高频面试题、追问和参考答案。

## 示例代码

`source_code/` 下放置可运行或可测试的示例项目：

- `java_proj/`：Java 综合知识示例，使用 Maven 管理。
- `algo_java/`：Java 算法模板和练习代码。
- `py_proj/`：Python 综合知识示例，使用 `pyproject.toml` 管理。
- `algo_py/`：Python 算法模板和练习代码。
- `regex_proj/`：正则表达式示例和测试。
- `rust_proj/`：Rust 基础示例项目。
- `go_proj/`：预留的 Go 示例项目目录。

各子项目如包含 `README.md`、`TESTING.md` 或 `KNOWLEDGE_COVERAGE.md`，优先阅读对应文件获取运行方式和覆盖范围。

## 本地使用

克隆仓库后可直接按目录浏览 Markdown 资料。示例项目的依赖安装、测试和运行方式以各子项目说明为准。

常见构建产物和本地缓存已通过 `.gitignore` 排除，包括：

- Java/Maven/Rust 构建目录：`target/`、`out/`、`build/`
- Python 缓存和覆盖率文件：`__pycache__/`、`.pytest_cache/`、`.coverage`
- 本地工具和编辑器配置：`.claude/settings.local.json`、`.idea/`、`.vscode/`
- 日志、临时文件、本地环境变量和密钥类文件

## 维护约定

- 新增主题时保持“路线图 + 学习资料 + study-material + 面试知识点”的组织方式。
- 新增示例代码时补充对应 `README.md` 或 `TESTING.md`。
- 不提交构建产物、缓存、本地配置、密钥和临时文件。
- 对已有资料做大幅调整时，尽量保持章节编号和目录结构稳定，方便后续检索和引用。
