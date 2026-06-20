---
title: "Prompt Engineering 学习资料：Prompt 技术谱系和推理模式深度解析"
date: 2026-06-20
description: "Zero-shot 只提供任务说明，不提供示例。它适合模型已经熟悉的通用任务，例如摘要、改写、常见分类。"
tags:
  - "AI"
  - "工程实践"
  - "Prompt Engineering"
  - "深度解析"
category: "AI"
---

# Prompt Engineering 学习资料：Prompt 技术谱系和推理模式深度解析

[返回索引](../Prompt Engineering学习资料.md)

## 学习目标

- 建立完整的 prompt 技术谱系，而不是只掌握 few-shot 和模板。
- 理解每类技术解决的问题、适用边界、失败模式和评估方式。
- 能在面试或方案设计中说明为什么选某种 prompting pattern。

## 技术谱系总览

| 类别 | 技术 | 解决的问题 | 主要风险 |
| --- | --- | --- | --- |
| 指令型 | zero-shot、role prompting、constraint prompting | 快速定义任务 | 规则含糊、不可评估 |
| 示例型 | few-shot、反例、动态示例检索 | 输出模式和边界学习 | 示例偏差、schema 冲突 |
| 分解型 | least-to-most、prompt chaining、plan-then-execute | 复杂任务拆解 | 链路长、错误传播 |
| 证据型 | retrieve-then-read、grounded answer、cite-then-answer | 降低幻觉 | 引用不准、检索失败 |
| 推理型 | CoT、self-consistency、verifier、critique-revise | 多步推理和校验 | 成本高、伪推理 |
| 行动型 | ReAct、tool use、function calling、workflow agent | 调用工具完成任务 | 越权、循环、状态污染 |
| 优化型 | APE、prompt search、eval-driven iteration | 自动改进 prompt | 过拟合评估集 |
| 安全型 | prompt injection guard、refusal policy、sandboxed context | 降低攻击风险 | 只靠 prompt 防护不足 |

## 1. Zero-shot

Zero-shot 只提供任务说明，不提供示例。它适合模型已经熟悉的通用任务，例如摘要、改写、常见分类。

```text
请把下面文本总结成 3 条要点，每条不超过 30 字。
```

适用：

- 任务简单。
- 输出格式不复杂。
- 错误成本低。

不适用：

- 业务规则特殊。
- 类别边界模糊。
- 输出必须严格结构化。

## 2. Few-shot

Few-shot 通过输入输出样例定义模式。它不是让模型记住知识，而是让模型模仿当前任务的映射关系。

关键设计：

- 示例覆盖真实分布。
- 示例输出完全符合 schema。
- 边界样例比普通样例更有价值。
- 示例不能和规则冲突。

失败模式：

- 过拟合示例风格。
- 学到示例中的错误。
- 示例太长挤占任务上下文。
- 动态示例检索带入隐私或偏见。

## 3. Chain-of-Thought 与可见中间产物

CoT 的思想是让模型把复杂问题拆成中间步骤。但生产中不一定要输出完整思维过程，更推荐输出“可检查中间产物”：

- 提取到的事实。
- 使用的约束。
- 证据编号。
- 候选方案。
- 自检结果。

```text
不要输出冗长推理。请输出：
1. 已知事实
2. 关键约束
3. 结论
4. 支持证据
5. 不确定项
```

> **重点：** 工程上关心可验证性，不关心模型把所有内部推理文本展示出来。

## 4. Self-consistency

Self-consistency 是对同一问题生成多个候选，再用投票、评分或规则选择结果。它适合数学、逻辑、多路径推理和分类不稳定场景。

流程：

```text
生成 N 个候选 -> 归一化答案 -> 投票/评分 -> 输出最终结果
```

取舍：

- 优点：降低偶然错误。
- 缺点：成本和延迟乘以 N。
- 风险：如果 prompt 或知识源本身错，多数候选也会一起错。

## 5. Least-to-most

先解决简单子问题，再解决复杂问题。适合题目可自然拆解的任务。

例子：

```text
1. 先列出所有约束。
2. 再判断每个候选方案是否满足约束。
3. 最后选择满足约束最多且风险最低的方案。
```

## 6. ReAct

ReAct 将 reasoning 和 acting 结合：模型先判断下一步需要什么，再调用工具观察结果，再继续。生产中应把它实现成受控工作流，而不是让模型无限自由循环。

```text
Thought: 需要查询职位。
Action: search_jobs(...)
Observation: 返回 10 个职位。
Thought: 需要按简历匹配排序。
Action: rank_jobs(...)
```

风险：

- Thought 变成不可审计的自由文本。
- Action 权限过大。
- Observation 中包含提示注入。
- 无限循环。

工程修正：

- 用状态机代替自由 ReAct。
- 限制工具集合。
- 最大步数。
- 工具结果结构化。
- 写操作确认。

## 7. Critique-Revise

先生成，再评审，再修订。适合写作、代码、方案设计和 prompt 优化。

```text
第一步：生成初稿。
第二步：按 rubrics 找问题。
第三步：只修复这些问题，输出最终版。
```

注意：

- 评审标准必须明确。
- 修订不能引入新事实。
- 重要任务要外部校验，不只靠模型自检。

## 8. Verifier / Judge

Verifier 用于检查候选结果是否满足规则。它可以是模型，也可以是程序。

| 检查类型 | 更适合 |
| --- | --- |
| JSON 格式 | 程序 |
| 枚举合法 | 程序 |
| 事实引用支持 | 模型 + 人工抽检 |
| 语气自然 | 模型或人工 |
| 权限合法 | 后端程序 |

## 练习

为“候选人简历筛选”分别设计：

- zero-shot prompt。
- few-shot prompt。
- extract-then-reason prompt。
- critique-revise prompt。
- verifier prompt。

比较 5 种方式在准确性、成本、可解释性和稳定性上的差异。

## 验收

- 能说出 8 类 prompt 技术及适用场景。
- 能解释 CoT、self-consistency、ReAct 的工程风险。
- 能根据任务选择 prompting pattern，而不是套万能模板。

## 易错

> **易错：** 把高级 prompting 技术当作固定提分技巧。
>
> 正确做法：先判断任务失败模式，再选择能针对失败模式的技术。

