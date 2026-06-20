---
title: "测试触发说明"
date: 2026-06-20
description: "本文说明 pyproj 的测试如何被触发、如何按范围运行，以及覆盖率如何校验。"
tags:
  - "source_code"
  - "py_proj"
category: "源码项目"
---

# 测试触发说明

本文说明 `py_proj` 的测试如何被触发、如何按范围运行，以及覆盖率如何校验。

## 环境前提

使用 Python 3.14：

```powershell
python --version
```

安装项目和测试依赖：

```powershell
python -m pip install -e ".[dev]"
```

`-e` 表示 editable install。源码文件修改后不需要重新安装，下一次测试会直接使用当前源码。

## pytest 如何发现测试

测试发现规则来自 `pyproject.toml`：

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--tb=short"
```

触发流程：

1. 执行 `python -m pytest`。
2. pytest 进入 `tests/` 目录。
3. 扫描 `test_*.py` 文件。
4. 执行 `Test*` 类中的 `test_*` 方法，以及模块级 `test_*` 函数。
5. pytest-cov 在测试运行时统计 `src/py_proj` 包的源码行覆盖率。

## 常用命令

运行全部测试：

```powershell
python -m pytest
```

运行全部测试并要求 100% 覆盖率：

```powershell
python -m pytest --cov=py_proj --cov-report=term-missing --cov-fail-under=100
```

运行单个测试文件：

```powershell
python -m pytest tests/test_data_structures.py
```

运行单个测试类：

```powershell
python -m pytest tests/test_oop.py::TestVector
```

运行单个测试方法：

```powershell
python -m pytest tests/test_oop.py::TestVector::test_add
```

按关键字筛选：

```powershell
python -m pytest -k "retry or timeout"
```

运行标记为 slow 的测试：

```powershell
python -m pytest -m slow
```

跳过 slow 测试：

```powershell
python -m pytest -m "not slow"
```

## 覆盖率失败如何定位

如果覆盖率不足，使用：

```powershell
python -m pytest --cov=py_proj --cov-report=term-missing
```

`Missing` 列会显示没有被测试触发的源码行。处理方式：

- 如果是正常业务分支，补单元测试。
- 如果是异常分支，构造异常输入或用 `monkeypatch` 模拟异常。
- 如果是平台差异分支，使用 monkeypatch 模拟不同平台能力。
- 如果是理论上不可达的解释性分支，才使用 `# pragma: no cover` 排除，并在注释中说明原因。

## 当前验收命令

本工程的最终验收命令固定为：

```powershell
python -m pytest --cov=py_proj --cov-report=term-missing --cov-fail-under=100
```

预期结果：

```text
402 passed
TOTAL 1736 statements, 0 missed, 100% coverage
```
