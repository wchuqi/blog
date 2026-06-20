---
title: "pyproj Python 知识点源码工程"
date: 2026-06-20
description: "本工程基于 开发语言/Python/ 目录中的学习文档创建，使用 Python 3.14。"
tags:
  - "source_code"
  - "py_proj"
category: "源码项目"
---

# py_proj Python 知识点源码工程

本工程基于 `开发语言/Python/` 目录中的学习文档创建，使用 Python 3.14。

目标：

- 每个 Python 文档知识点都有对应源码示例。
- 每个源码示例都有单元测试覆盖。
- 覆盖率门槛固定为 100%，缺失行会让测试失败。

## 目录结构

```text
py_proj/
  pyproject.toml
  README.md
  TESTING.md
  docs/
    test-scenarios.md
  src/py_proj/
    *.py
  tests/
    test_*.py
```

## 源码和文档对应关系

| 文档知识点 | 源码模块 | 测试文件 |
| --- | --- | --- |
| 语法基础和运行模型 | `basics.py` | `tests/test_basics.py` |
| 内置类型和数据结构 | `data_structures.py` | `tests/test_data_structures.py` |
| 控制流、函数和作用域 | `control_flow.py` | `tests/test_control_flow.py` |
| 面向对象和数据模型 | `oop.py` | `tests/test_oop.py` |
| 模块包和导入机制 | `modules_packages.py`、`import_system.py` | `tests/test_modules_packages.py`、`tests/test_import_system.py` |
| 异常处理和文件 IO | `exceptions_io.py` | `tests/test_exceptions_io.py` |
| 迭代器、生成器和推导式 | `iterators_generators.py` | `tests/test_iterators_generators.py` |
| 函数式工具、装饰器和上下文管理器 | `functional.py` | `tests/test_functional.py` |
| 标准库常用能力 | `stdlib_utils.py` | `tests/test_stdlib_utils.py` |
| 虚拟环境、依赖和项目结构 | `project_structure.py` | `tests/test_project_structure.py` |
| 测试、调试、日志和质量工具 | `testing_logging.py` | `tests/test_testing_logging.py` |
| 并发、异步、事件循环和 GIL | `concurrency.py` | `tests/test_concurrency.py` |
| CPython 运行时、对象模型和内存 | `cpython_runtime.py` | `tests/test_cpython_runtime.py` |
| 描述符、属性查找和元类 | `descriptors_metaclasses.py` | `tests/test_descriptors_metaclasses.py` |
| 类型提示、泛型和静态分析 | `type_hints.py` | `tests/test_type_hints.py` |
| 性能剖析和大规模数据处理 | `performance.py` | `tests/test_performance.py` |
| 生产安全、配置、可观测性和可靠性 | `production.py` | `tests/test_production.py` |
| 第三方 regex 模块 | `regex_usage.py` | `tests/test_regex_usage.py` |

## 使用方式

先安装开发依赖：

```powershell
python -m pip install -e ".[dev]"
```

运行完整测试和覆盖率：

```powershell
python -m pytest --cov=py_proj --cov-report=term-missing --cov-fail-under=100
```

详细测试触发方式见 [TESTING.md](TESTING.md)，测试场景清单见 [docs/test-scenarios.md](docs/test-scenarios.md)。
