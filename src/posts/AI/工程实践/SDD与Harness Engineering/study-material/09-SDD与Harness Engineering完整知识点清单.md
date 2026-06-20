---
title: "SDD与Harness Engineering完整知识点清单"
date: 2026-06-20
description: "这份清单用于检查是否真正掌握 SDD 和 Harness Engineering，而不是只停留在概念解释。建议读完每个模块后回到本文件逐项核对。"
tags:
  - "AI"
  - "工程实践"
  - "SDD与Harness Engineering"
  - "知识清单"
category: "AI"
---

# SDD与Harness Engineering完整知识点清单

[返回索引](../SDD与Harness Engineering学习资料.md)

这份清单用于检查是否真正掌握 SDD 和 Harness Engineering，而不是只停留在概念解释。建议读完每个模块后回到本文件逐项核对。

## 1. 基础术语

- SDD: Specification-Driven Development / Spec-Driven Development。
- Spec: 可审查、可执行、可验证、可追踪的规格。
- Harness: 围绕 Agent 的上下文、工具、权限、验证、运行时和反馈系统。
- Agent: 能根据目标进行多步推理、调用工具并改变工作区状态的 AI 执行体。
- Context: Agent 当前可见的信息集合。
- Tool: Agent 可调用的动作接口。
- Policy: 约束 Agent 行动的权限、审批和风险规则。
- Verifier: 对 Agent 结果进行检查的测试、扫描、规则和评审机制。
- Trajectory: Agent 执行过程的轨迹，包括观察、计划、工具调用、输出和验证结果。
- Eval: 用代表性任务评估 Agent + Harness 系统质量的方法。

## 2. SDD基础知识域

- 需求澄清。
- 用户场景。
- 功能需求。
- 非功能需求。
- 边界条件。
- 不做范围。
- 验收标准。
- 领域模型。
- 状态机。
- API契约。
- 任务拆解。
- 规格评审。
- 规格变更记录。

## 3. SDD深度机制

- 规格正确性：语义正确、结构正确、可验证、可追踪。
- 可执行规格：自然语言、结构化规格、可运行规格。
- 需求追踪矩阵：Spec ID 到代码、测试、运行指标的映射。
- 规格覆盖率：有验证证据的规格条款比例。
- 不变量：任何执行路径都不能破坏的规则。
- 状态机约束：合法状态、非法状态、迁移条件、副作用。
- 前置条件和后置条件。
- 幂等、重试、补偿、回滚的规格化表达。
- 兼容性规格：API、schema、错误码、事件格式。
- 歧义消除：把“尽快、合理、兼容、默认”等词转成可判断条件。

## 4. 规格解析和冲突消解

- 规格来源优先级。
- 规格元数据：id、version、status、owner、scope、supersedes。
- draft、approved、deprecated、active 的状态含义。
- 多规格冲突检测。
- 安全、合规、隐私、资金规则的优先级。
- API契约和新需求冲突处理。
- 新规格和旧测试冲突处理。
- 领域不变量和实现便利冲突处理。
- 冲突报告模板。
- 人工审批和阻塞条件。

## 5. Harness基础知识域

- 上下文装配。
- 工具白名单。
- 工具网关。
- 权限分层。
- 沙箱环境。
- 审批机制。
- 测试强制执行。
- 静态检查。
- 架构规则。
- 安全扫描。
- 任务恢复。
- 轨迹记录。
- 失败复盘。
- 评估和指标。

## 6. Harness运行时架构

- Spec Store：规格存储、版本和作用域。
- Context Builder：上下文选择、排序、压缩。
- Knowledge Retriever：检索代码、文档、测试和历史记录。
- Policy Engine：路径权限、工具权限、审批策略。
- Agent Loop：observe、plan、act、verify、reflect。
- Tool Router：工具调用、参数校验、输出摘要、审计。
- Verifier：测试、lint、类型检查、契约检查、架构检查。
- Trajectory Store：执行轨迹、命令记录、失败证据。
- Evaluator：Eval cases、评分、质量趋势。

## 7. Agent状态模型

- CREATED。
- CONTEXT_READY。
- PLAN_PROPOSED。
- PLAN_APPROVED。
- EDITING。
- VERIFYING。
- FIXING。
- READY_FOR_REVIEW。
- DONE。
- ESCALATED。
- BLOCKED_BY_SPEC_CONFLICT。
- BLOCKED_BY_PERMISSION。
- FAILED_BY_VALIDATION。

必须掌握：

- 进入每个状态的条件。
- 哪些状态允许编辑。
- 哪些状态必须人工审批。
- 哪些失败允许自动重试。
- 何时停止，何时转人工。

## 8. 上下文选择算法

- 必选上下文和候选上下文。
- 分阶段上下文：理解任务、计划、实现、验证、修复。
- 上下文评分：相关性、权威性、新鲜度、本地性、历史有效性。
- 惩罚项：冲突风险、token 成本、过期风险、噪声。
- 上下文压缩：日志摘要、失败断言、函数片段、状态机表、diff 摘要。
- 上下文污染：旧文档、无关 README、过期 issue、非权威讨论。
- 上下文缺失：关键规格、API契约、测试、领域模型未提供。

## 9. 工具调度和权限

- 读操作优先于写操作。
- 计划前禁止编辑。
- 高风险操作需要审批。
- 修改后必须触发验证。
- 重复失败要进入转人工。
- 工具输出要结构化摘要。
- 工具错误要分类：命令不存在、测试失败、权限不足、超时、网络失败、输出过长。
- install dependency、database migration、production deploy、secret access 默认高风险。
- 删除、移动、大规模重构必须有范围校验和审批。

## 10. 验证体系

- 编译和类型检查。
- lint 和格式检查。
- 单元测试。
- 集成测试。
- 契约测试。
- E2E测试。
- 属性测试。
- 架构依赖检查。
- 安全扫描。
- secret scan。
- 许可证扫描。
- 规格覆盖检查。
- 人工评审。
- 运行指标和告警。

## 11. Evals和质量度量

- Eval case 设计。
- 任务成功率。
- 首次通过率。
- 规格覆盖率。
- 越界修改率。
- 回归率。
- 人审拒绝率。
- 转人工准确率。
- 平均修复次数。
- 上下文 precision/recall。
- 测试选择准确率。
- 成本指标：token、工具调用、测试时间、人审时间。
- 质量趋势：Harness 改动前后是否变好。

## 12. 故障归因

- 规格缺失。
- 规格冲突。
- 上下文缺失。
- 上下文污染。
- 工具缺失。
- 工具反馈不可读。
- 权限过宽。
- 权限过窄。
- 验证缺失。
- Runtime 控制失败。
- 模型误判。
- 人工审批缺失。
- 组织规则未沉淀。

## 13. 高风险场景

- 支付和退款。
- 认证和授权。
- 用户隐私和数据导出。
- 数据库迁移。
- 生产配置。
- CI/CD 和部署脚本。
- 第三方依赖新增。
- 公开 API 变更。
- 跨模块重构。
- 安全策略。
- 订单、库存、账务等状态机。

## 14. 与相关概念的区别

- SDD vs TDD：规格定义意图，测试验证意图。
- SDD vs BDD：BDD 场景可成为 SDD 的行为规格。
- SDD vs DDD：DDD 领域模型可作为 SDD 的领域规格。
- SDD vs 传统需求文档：SDD 必须参与实现、验证和追踪。
- Harness vs Prompt Engineering：prompt 是输入，Harness 是运行系统。
- Harness vs Context Engineering：上下文选择是 Harness 的一部分。
- Harness vs DevOps：Harness 借鉴自动化、验证、观测和反馈。
- Harness vs Platform Engineering：成熟 Harness 往往平台化，但起点可以很轻量。

## 15. 组织落地

- 规格模板。
- Agent 规则文件。
- 高风险模块清单。
- 统一测试入口。
- 审批策略。
- 轨迹记录。
- 失败复盘模板。
- Eval 任务集。
- 指标仪表盘。
- 平台化路线。
- 团队角色：业务 owner、领域 owner、架构 owner、安全、平台、测试、开发。

## 16. 面试高频追问

- SDD 如何保证规格不是文档负担。
- 如何判断规格正确。
- 如何把规格映射到测试。
- Agent 遇到规格冲突怎么办。
- Harness 运行时有哪些组件。
- Agent 控制循环如何设计。
- 上下文选择有什么算法。
- 工具权限如何设计。
- 测试通过但业务错误如何复盘。
- 如何设计 Eval cases。
- 如何判断 Harness 改进有效。
- 哪些任务必须转人工。
- 如何在团队中渐进落地。

## 17. 最终掌握标准

- 能写出可执行规格，而不是泛泛需求。
- 能建立 Spec ID、代码、测试、指标之间的追踪关系。
- 能设计规格冲突消解规则。
- 能画出 Harness 运行时架构。
- 能设计 Agent 状态机和控制循环。
- 能设计上下文选择算法和工具调度规则。
- 能设计验证矩阵和 Eval cases。
- 能对 Agent 失败做系统归因。
- 能提出组织级落地路线和平台化边界。

