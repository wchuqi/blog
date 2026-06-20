---
title: "正则表达式项目知识点覆盖映射"
date: 2026-06-20
description: "本项目根据 工具&中间件/正则表达式 目录中的所有文档初始化，源码位于 src/regexproj，测试位于 tests/testregexknowledge.py。"
tags:
  - "source_code"
  - "docs"
category: "源码项目"
---

# 正则表达式项目知识点覆盖映射

本项目根据 `工具&中间件/正则表达式` 目录中的所有文档初始化，源码位于 `src/regex_proj`，测试位于 `tests/test_regex_knowledge.py`。

| 文档/领域 | 已覆盖知识点 | 源码 | 测试 |
| --- | --- | --- | --- |
| 00 总览与心智模型 | 匹配、查找、提取、替换、分割、校验、parser 边界、回溯心智模型、方言差异 | `patterns.py`, `operations.py`, `engine.py`, `dialects.py`, `review.py` | `test_patterns_*`, `test_operations_*`, `test_engine_*`, `test_dialects_*`, `test_review_*` |
| 01 字符转义和字符类 | 普通/特殊字符、转义、点号、字符类、范围、取反、类内特殊规则、预定义类、Unicode/ASCII、双重转义 | `patterns.py`, `dialects.py` | `test_patterns_character_escaping_and_classes`, `test_dialects_source_literals` |
| 02 量词贪婪惰性占有 | `*`、`+`、`?`、`{m,n}`、贪婪、惰性、占有、原子组、作用范围、明确边界 | `quantifiers.py` | `test_quantifiers_greedy_lazy_possessive_and_scope` |
| 03 分组捕获引用命名组 | 捕获组、非捕获组、命名组、URL/日志字段、分支优先级、反向引用、替换引用 | `groups.py`, `operations.py`, `dialects.py` | `test_groups_*`, `test_operations_*`, `test_dialects_*` |
| 04 锚点边界修饰符 | `^`、`$`、`\A`、`\Z`、`\b`、全量校验、局部查找、ignorecase、multiline、dotAll、verbose | `assertions.py` | `test_assertions_anchors_boundaries_flags_and_lookaround` |
| 05 断言和环视 | 正向/负向先行、正向/负向后行、密码包含规则、断言不消耗字符、lookbehind 兼容风险 | `assertions.py`, `dialects.py` | `test_assertions_*`, `test_dialects_features_*` |
| 06 引擎机制和回溯 | 匹配起点、分支顺序、量词选择点、捕获组随回溯变化、NFA 和 RE2 对比 | `engine.py` | `test_engine_execution_trace_and_complexity_helpers` |
| 07 性能灾难性回溯 ReDoS | 嵌套量词、重叠分支、模糊重复、可选项堆叠、攻击输入、改写策略、运行时防护 | `redos.py`, `quantifiers.py` | `test_redos_audit_attack_rewrite_and_conditions`, `test_quantifiers_*` |
| 08 提取替换分割清洗 | 命名组提取、日期替换、逗号/空白分割、空白清洗、失败处理 | `operations.py` | `test_operations_extract_replace_split_clean_and_project_parser` |
| 09 方言差异 | Java/JavaScript/Python/PCRE/.NET/RE2、源码字符串、特性支持、API 行为、Unicode、替换语法 | `dialects.py` | `test_dialects_*` |
| 10 实战案例 | Nginx 日志、用户名/表单校验、手机号脱敏、URL 提取、行尾空白清洗、parser 边界 | `operations.py`, `patterns.py`, `review.py` | `test_operations_*`, `test_patterns_*`, `test_review_*` |
| 11 调试测试维护 | 调试步骤、正例/反例/边界/脏数据/性能样本、命名组、verbose、变更风险 | `assertions.py`, `review.py` | `test_assertions_*`, `test_review_*` |
| 12 综合练习项目 | 日志清洗与结构化提取、字段转换、邮箱脱敏、异常样本行号、超长/多余字段失败路径 | `operations.py` | `test_operations_extract_replace_split_clean_and_project_parser` |
| 13 面试知识点整理和面试目录 | 高频概念、语法机制、性能安全、线上排查、路径白名单、复杂正则维护、迁移检查 | `engine.py`, `redos.py`, `review.py`, `dialects.py` | `test_engine_*`, `test_redos_*`, `test_review_*`, `test_dialects_*` |
| 14 完整知识点清单 | 覆盖地图中的 18 个领域、必会知识、易遗漏点、错误清单、自测问题 | 全部源码模块 | 全部测试 |
| 15 引擎执行轨迹深度解析 | `a.*b` 五步轨迹、分支结果、捕获组回溯、`^(a+)+$` 拆分组合 | `engine.py` | `test_engine_execution_trace_and_complexity_helpers` |
| 16 ReDoS 审计和复杂度分析 | 风险三条件、线性/二次/指数直觉、危险模式、慢失败样本、修复优先级 | `redos.py`, `review.py` | `test_redos_*`, `test_review_*` |
| 17 正则方言深度对照 | 源码层、引擎层、API 层、全局状态、Unicode、替换语法、迁移检查表 | `dialects.py` | `test_dialects_*` |
| 18 正则设计评审清单和案例库 | 设计文档模板、正确性/性能/安全/维护/兼容评审、邮箱/URL/日志/密码/路径案例、测试模板 | `review.py` | `test_review_docs_case_studies_templates_and_findings` |

覆盖验证命令：

```powershell
python -m coverage run -m pytest
python -m coverage report
```
