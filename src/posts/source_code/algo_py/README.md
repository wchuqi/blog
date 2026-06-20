---
title: "algopy"
date: 2026-06-20
description: "基于 算法 目录全部文档生成的 Python 3.14 算法项目。"
tags:
  - "source_code"
  - "algo_py"
category: "源码项目"
---

# algo_py

基于 `算法` 目录全部文档生成的 Python 3.14 算法项目。

项目只依赖 Python 标准库，使用 `unittest` 运行单元测试。测试会执行所有算法示例，并通过 `CoverageTopic` / `Coverage` 检查 51 个文档知识点主题是否全部命中。

## 运行测试

```powershell
.\scripts\run-tests.ps1
```

预期输出包含：

```text
Ran 7 tests
OK
Knowledge coverage: 100% (51 topics).
```

## 目录

```text
src/algo_py/
  algorithms.py          # 算法源码，按文档章节分组
  knowledge_coverage.py  # 51 个知识点主题和覆盖追踪器

tests/
  test_algorithms.py     # unittest 单元测试

scripts/
  run-tests.ps1          # 设置 PYTHONPATH 并触发测试
```

完整文档映射见 `KNOWLEDGE_COVERAGE.md`，测试触发说明见 `TESTING.md`。
