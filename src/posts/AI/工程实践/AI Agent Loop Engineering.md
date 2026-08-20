---
title: "AI Agent Loop Engineering 学习资料：智能体循环工程"
date: 2026-06-20
description: "Agent Loop Engineering 是设计和实现智能体执行循环的工程实践。它让 AI 从单次问答进化为能够多步推理、调用工具、从错误中恢复的自主系统。核心挑战是如何控制循环终止、管理跨轮状态、处理工具失败、在资源约束下完成任务。"
tags:
  - "AI"
  - "工程实践"
  - "Agent"
review:
  created: 2026-06-20
  lastReview: 2026-06-20
  reps: 0
  interval: 0
  ease: 2.5
  ease: 2.5---

# AI Agent Loop Engineering 学习资料：智能体循环工程

[返回索引](./AI Agent Loop Engineering学习资料.md)

## 学习目标

- 理解 Agent Loop 的核心机制：观察-推理-行动-更新循环
- 掌握不同 Loop 架构的适用场景和实现方式
- 能够设计可靠的终止条件和错误恢复策略
- 识别并避免常见的循环陷阱（无限循环、上下文溢出、资源浪费）

## 理论导读

Agent Loop Engineering（智能体循环工程）是设计和实现智能体执行循环的工程实践。它解决的核心问题是：如何让 AI 从单次问答进化为能够多步推理、调用工具、从错误中恢复的自主系统。

单次 LLM 调用就像一个没有记忆的专家：你问一个问题，它给一个答案，然后忘记一切。Agent Loop 则像一个有工具箱和笔记本的助手：它能读取信息、尝试操作、根据结果调整策略、持续推进直到任务完成。

核心挑战不是"能否循环"，而是"如何可靠地循环"：
- 何时停止（终止条件）
- 如何记住（状态管理）
- 失败了怎么办（错误恢复）
- 如何不浪费资源（Token 和时间预算）

类比：把 Agent Loop 想象成游戏中的回合制战斗系统。每个回合玩家观察战场、思考策略、执行动作、查看结果，然后进入下一回合。设计不良的战斗系统会让玩家卡死、无限循环或消耗过多资源。

## 核心心智模型

| 维度 | Agent Loop 中的含义 | 需要控制的点 |
| --- | --- | --- |
| 目标 | 用户任务或最终状态 | 是否明确、是否可验证 |
| 观察 | 工具结果、环境状态、错误信息 | 哪些保留、哪些压缩 |
| 推理 | 模型决策下一步做什么 | Token 成本、延迟 |
| 行动 | 工具调用、文件修改、API 请求 | 权限、失败处理 |
| 状态 | 已完成步骤、中间结果、计划 | 何时清理、如何恢复 |
| 终止 | 成功、失败、超时、资源耗尽 | 条件明确性、优先级 |

## 知识点详解

### 1. Agent Loop 基本循环

#### 是什么

Agent Loop 的基本循环是一个四步骤的重复过程：

```
观察（Observe）→ 推理（Reason）→ 行动（Act）→ 更新（Update）→ [循环]
```

- **观察**：收集当前状态信息（用户输入、工具结果、环境状态）
- **推理**：调用 LLM 分析观察结果，决定下一步行动
- **行动**：执行决策（调用工具、生成回复、修改文件）
- **更新**：将行动结果纳入上下文，为下一轮做准备

这个循环持续执行，直到满足终止条件。

#### 能干什么

适用场景：
- **多步推理任务**：需要分解为多个子任务（如"分析这个项目的测试覆盖率"）
- **工具依赖任务**：需要根据工具结果调整策略（如"搜索资料写报告"）
- **试错型任务**：需要尝试、验证、调整（如"修复失败的测试"）
- **交互式任务**：需要根据中间结果与用户确认（如"代码审查并修改"）

不适用场景：
- 单步就能回答的问题（如"什么是 REST API？"）
- 纯创作任务（写诗、写故事）
- 没有明确终止条件的开放性任务

#### 怎么用

最简单的 Loop 实现：

```python
def simple_agent_loop(user_query, tools, max_iterations=10):
    """
    最基础的 Agent Loop 实现
    """
    context = [{"role": "user", "content": user_query}]
    
    for iteration in range(max_iterations):
        # 1. 推理：让模型决定下一步
        response = call_llm(context)
        
        # 2. 检查终止：是否给出最终答案
        if response.is_final_answer:
            return response.content
        
        # 3. 行动：执行工具调用
        tool_results = []
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call.name, tool_call.args)
            tool_results.append(result)
        
        # 4. 更新：将结果加入上下文
        context.append({"role": "assistant", "content": response.content})
        context.append({"role": "tool", "content": tool_results})
    
    return "达到最大迭代次数，任务未完成"

# 使用示例
answer = simple_agent_loop(
    user_query="查询北京今天天气，然后推荐合适的户外活动",
    tools=[weather_api, search_tool]
)
```

> **重点：** Loop 的价值在于"增量推进"——每一轮都基于上一轮的结果做出更好的决策。

> **易错：** 忘记设置 `max_iterations`，导致潜在的无限循环。
>
> 正确做法：始终设置明确的上限，简单任务 3-5 轮，复杂任务 10-20 轮。

### 2. Loop 架构类型对比

#### 背景

不同任务需要不同的 Loop 架构。选择错误的架构会导致效率低下或任务失败。

#### 方案对比

| 维度 | ReAct Loop | Plan-Execute Loop | Reflexion Loop | Tree Search Loop |
|------|-----------|------------------|----------------|------------------|
| 核心思路 | 推理+行动交替 | 先规划再执行 | 自我反思改进 | 探索多分支 |
| 适用场景 | 通用工具调用 | 明确多步任务 | 高质量要求 | 不确定性高 |
| 实现复杂度 | 低 | 中 | 高 | 高 |
| Token 消耗 | 中 | 中 | 高（多次尝试） | 很高（树展开） |
| 失败恢复 | 差（无预判） | 中（重新规划） | 好（反思改进） | 好（回溯） |
| 典型迭代数 | 3-10 | 5-15 | 3-5 轮×多次尝试 | 10-50 |

#### 架构详解

**ReAct Loop（推理行动循环）**

最常用的架构，每轮推理后立即行动：

```python
while not done:
    thought = model.think("我应该做什么？")
    action = model.decide(thought)
    observation = execute(action)
    done = check_completion(observation)
```

**Plan-Execute Loop（计划执行循环）**

先制定完整计划，再逐步执行：

```python
plan = model.create_plan(user_query)  # ["步骤1", "步骤2", "步骤3"]
for step in plan:
    result = execute_step(step)
    if result.failed:
        plan = model.replan(plan, result)  # 根据失败调整计划
```

**Reflexion Loop（反思循环）**

执行后自我评估，不满意则改进重试：

```python
for attempt in range(max_attempts):
    solution = agent.solve(task)
    evaluation = critic.evaluate(solution)
    if evaluation.score >= threshold:
        return solution
    reflection = critic.reflect(solution, evaluation)
    agent.update_from_reflection(reflection)
```

**Tree Search Loop（树搜索循环）**

探索多个可能路径，选择最优解：

```python
root = State(user_query)
frontier = [root]
while frontier:
    state = select_best(frontier)
    if is_goal(state):
        return extract_solution(state)
    children = expand(state)
    frontier.extend(children)
```

#### 选择建议

- 通用任务（搜索+总结）→ ReAct
- 明确流程任务（数据处理管道）→ Plan-Execute
- 代码/数学等可验证任务 → Reflexion
- 策略游戏、复杂决策 → Tree Search

> **重点：** 80% 的场景用 ReAct 就够了，不要过度设计。

### 3. 终止条件设计

#### 是什么

终止条件（Termination Condition）是决定 Loop 何时停止的规则集合。没有明确的终止条件，Agent 会无限运行或在错误状态下继续浪费资源。

终止条件分为三类：
- **成功终止**：任务完成、目标达成
- **失败终止**：错误累积、无法继续
- **资源终止**：超时、Token 耗尽、迭代次数上限

#### 能干什么

良好的终止条件设计能够：
- 防止无限循环和资源浪费
- 及时识别任务失败，避免无效尝试
- 在部分成功时优雅降级
- 提供清晰的失败原因用于调试

如果缺少终止条件：
- Agent 可能重复执行相同操作
- 消耗大量 API 调用和 Token
- 无法判断任务是否真正完成
- 难以定位失败原因

#### 怎么用

实现多层终止条件检查：

```python
class LoopController:
    def __init__(self, max_iterations=10, max_tokens=100000, timeout_seconds=300):
        self.max_iterations = max_iterations
        self.max_tokens = max_tokens
        self.timeout = timeout_seconds
        self.start_time = time.time()
        self.tokens_used = 0
        self.iteration = 0
        
    def should_terminate(self, state) -> tuple[bool, str]:
        """
        检查是否应该终止，返回 (是否终止, 原因)
        """
        # 1. 成功终止
        if state.goal_achieved:
            return True, "success"
        
        if state.has_final_answer:
            return True, "answered"
        
        # 2. 失败终止
        if state.consecutive_errors >= 3:
            return True, "error_threshold"
        
        if state.is_stuck():  # 检测循环
            return True, "loop_detected"
        
        # 3. 资源终止
        if self.iteration >= self.max_iterations:
            return True, "max_iterations"
        
        if self.tokens_used >= self.max_tokens:
            return True, "token_budget"
        
        if time.time() - self.start_time > self.timeout:
            return True, "timeout"
        
        return False, None

# 使用示例
controller = LoopController(max_iterations=15, max_tokens=50000)

while True:
    should_stop, reason = controller.should_terminate(agent_state)
    if should_stop:
        print(f"终止原因: {reason}")
        break
    
    # 执行一轮循环
    result = agent.step()
    controller.iteration += 1
    controller.tokens_used += result.tokens
```

**循环检测实现**：

```python
class LoopDetector:
    def __init__(self, window_size=3):
        self.action_history = []
        self.window_size = window_size
    
    def add_action(self, action):
        """记录动作"""
        action_signature = f"{action.tool}:{hash(str(action.args))}"
        self.action_history.append(action_signature)
    
    def is_looping(self) -> bool:
        """检测是否在循环"""
        if len(self.action_history) < self.window_size * 2:
            return False
        
        recent = self.action_history[-self.window_size:]
        previous = self.action_history[-self.window_size*2:-self.window_size]
        
        # 如果最近的动作序列与之前完全相同
        return recent == previous
```

> **重点：** 终止条件应该分层检查，优先级：成功 > 失败 > 资源限制。

> **易错：** 只检查迭代次数，不检查循环和错误累积。
>
> 正确做法：至少实现三类终止条件，并记录终止原因用于分析。

### 4. 状态管理与上下文

#### 是什么

状态管理是在 Loop 的多次迭代中维护和更新信息的机制。由于 LLM 本身无状态，所有"记忆"都必须通过上下文显式传递。

状态包括：
- **长期状态**：用户目标、任务约束、已确认的决策
- **中期状态**：当前计划、已完成步骤、待办事项
- **短期状态**：本轮工具结果、最近错误、下一步动作
- **元数据**：迭代次数、Token 使用、性能指标

#### 能干什么

良好的状态管理能够：
- 让 Agent 记住已完成的工作，避免重复
- 在中断后恢复任务
- 压缩历史以应对上下文窗口限制
- 提供可观测性（知道 Agent 在想什么）

缺乏状态管理会导致：
- Agent 忘记已做过的尝试
- 重复调用相同工具
- 上下文窗口溢出
- 无法回溯和调试

#### 怎么用

实现结构化状态管理：

```python
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class AgentState:
    """Agent 的完整状态"""
    # 长期状态
    goal: str
    constraints: List[str]
    
    # 中期状态
    plan: List[str]
    completed_steps: List[str]
    current_step: Optional[str]
    
    # 短期状态
    last_observation: str
    recent_errors: List[str]
    next_action: Optional[str]
    
    # 元数据
    iteration: int
    tokens_used: int
    tool_calls: List[dict]
    
    def to_context(self) -> str:
        """转换为 LLM 可读的上下文"""
        context = f"""
目标: {self.goal}

已完成: {', '.join(self.completed_steps)}
当前步骤: {self.current_step or '规划中'}
待办: {', '.join(self.plan)}

最近观察: {self.last_observation}

轮次: {self.iteration}
"""
        return context.strip()
    
    def update_from_result(self, result):
        """从执行结果更新状态"""
        self.iteration += 1
        self.tokens_used += result.tokens
        self.last_observation = result.output
        
        if result.success and self.current_step:
            self.completed_steps.append(self.current_step)
            if self.plan:
                self.current_step = self.plan.pop(0)
        elif result.error:
            self.recent_errors.append(result.error)

# 使用示例
state = AgentState(
    goal="修复失败的测试用例",
    constraints=["不修改测试代码", "保持向后兼容"],
    plan=["运行测试", "分析错误", "修改代码", "验证修复"],
    completed_steps=[],
    current_step=None,
    last_observation="",
    recent_errors=[],
    next_action=None,
    iteration=0,
    tokens_used=0,
    tool_calls=[]
)

# 每轮循环
for i in range(max_iterations):
    # 将状态转换为上下文
    context = state.to_context()
    
    # LLM 基于状态做决策
    action = llm.decide(context)
    
    # 执行并更新状态
    result = execute(action)
    state.update_from_result(result)
```

**上下文压缩策略**：

```python
def compress_context(state, max_tokens=8000):
    """
    当上下文过长时压缩
    """
    # 必须保留的部分
    essential = {
        "goal": state.goal,
        "constraints": state.constraints,
        "completed": state.completed_steps,
        "current": state.current_step
    }
    
    # 检查 Token 数
    if count_tokens(state.to_context()) > max_tokens:
        # 压缩历史观察
        state.last_observation = summarize(state.last_observation, max_length=200)
        
        # 只保留最近 3 个错误
        state.recent_errors = state.recent_errors[-3:]
        
        # 压缩工具调用历史
        state.tool_calls = [
            {"tool": call["tool"], "success": call["success"]}
            for call in state.tool_calls[-5:]  # 只保留最近 5 次
        ]
    
    return state
```

> **重点：** 状态不是"保存所有信息"，而是"保留有用信息，压缩或丢弃冗余"。

### 5. 错误处理与恢复

#### 是什么

在 Agent Loop 中，错误是常态而非异常。工具可能失败、模型可能幻觉、网络可能超时、资源可能不足。错误处理与恢复机制决定了 Agent 是"脆弱易碎"还是"韧性可靠"。

错误类型：
- **工具错误**：API 超时、参数错误、权限不足
- **模型错误**：幻觉工具、格式错误、无效决策
- **逻辑错误**：陷入循环、偏离目标、死锁
- **资源错误**：上下文溢出、Token 耗尽、时间超限

#### 能干什么

良好的错误处理能够：
- 从临时性失败中自动恢复（重试）
- 在多次失败后切换策略（降级）
- 记录错误上下文用于调试
- 避免错误传播导致任务全盘失败

如果缺少错误处理：
- 单个工具失败导致整个任务崩溃
- 模型幻觉的工具调用直接报错
- 无法判断错误是临时还是永久
- 难以复现和修复问题

#### 怎么用

实现分层错误处理：

```python
class RobustAgentLoop:
    def __init__(self, max_retries=3, fallback_strategy=None):
        self.max_retries = max_retries
        self.fallback = fallback_strategy
        self.error_log = []
    
    def execute_with_retry(self, action, state):
        """
        带重试的工具执行
        """
        retry_count = 0
        last_error = None
        
        while retry_count < self.max_retries:
            try:
                result = self.execute_tool(action)
                
                # 验证结果
                if self.validate_result(result):
                    return result
                else:
                    raise ValueError("结果验证失败")
                    
            except TemporaryError as e:
                # 临时性错误：重试
                retry_count += 1
                last_error = e
                time.sleep(2 ** retry_count)  # 指数退避
                
            except PermanentError as e:
                # 永久性错误：立即放弃
                self.error_log.append({
                    "action": action,
                    "error": str(e),
                    "type": "permanent"
                })
                return None
        
        # 重试耗尽，执行降级策略
        if self.fallback:
            return self.fallback(action, last_error)
        
        return None
    
    def execute_tool(self, action):
        """执行单个工具调用"""
        tool = self.tools.get(action.tool_name)
        
        if not tool:
            # 模型幻觉了不存在的工具
            raise PermanentError(f"工具 {action.tool_name} 不存在")
        
        try:
            # 验证参数
            tool.validate_args(action.args)
            
            # 执行（带超时）
            result = tool.execute(action.args, timeout=30)
            return result
            
        except TimeoutError:
            raise TemporaryError("工具执行超时")
        except ValidationError as e:
            raise PermanentError(f"参数错误: {e}")
        except ConnectionError:
            raise TemporaryError("网络连接失败")
    
    def validate_result(self, result):
        """验证工具结果的合理性"""
        if result is None:
            return False
        
        if len(str(result)) > 100000:  # 结果过大
            return False
        
        if "error" in result and result["error"]:
            return False
        
        return True

# 降级策略示例
def search_fallback(action, error):
    """搜索工具失败时的降级策略"""
    # 使用缓存的结果
    cached = cache.get(action.args["query"])
    if cached:
        return {"source": "cache", "data": cached}
    
    # 使用备用搜索引擎
    backup_result = backup_search_api(action.args["query"])
    return backup_result

# 使用示例
agent = RobustAgentLoop(
    max_retries=3,
    fallback_strategy=search_fallback
)

result = agent.execute_with_retry(action, state)
if result is None:
    # 所有尝试都失败了
    state.add_error("工具执行失败")
    # 让 LLM 知道失败，尝试其他方法
    state.last_observation = f"工具 {action.tool_name} 执行失败，请尝试其他方法"
```

**错误上下文注入**：

```python
def inject_error_context(state, error):
    """
    将错误信息以结构化方式告知模型
    """
    error_context = f"""
前一步操作失败：
- 工具: {error.tool}
- 原因: {error.message}
- 类型: {'可重试' if error.is_temporary else '无法恢复'}

建议：
{generate_suggestion(error)}
"""
    state.last_observation = error_context
    return state

def generate_suggestion(error):
    """根据错误类型生成建议"""
    suggestions = {
        "timeout": "尝试减小查询范围或使用更简单的参数",
        "not_found": "检查输入是否正确，或尝试搜索相关替代项",
        "permission": "此操作需要特殊权限，尝试其他方法",
        "rate_limit": "API 调用频率超限，稍后重试或使用缓存"
    }
    return suggestions.get(error.type, "尝试不同的方法或简化任务")
```

> **重点：** 错误处理的目标是"让 Agent 知道出错了，并给出有用的上下文"，而不是静默重试。

> **易错：** 对所有错误都无限重试，浪费资源。
>
> 正确做法：区分临时错误（可重试）和永久错误（立即放弃），并在重试失败后切换策略。

### 6. 可观测性与调试

#### 是什么

可观测性（Observability）是指从系统外部理解系统内部状态的能力。对于 Agent Loop，这意味着能够回答：
- Agent 在第 N 轮想了什么、做了什么？
- 为什么 Agent 选择了 A 而不是 B？
- 哪一步开始偏离目标？
- 资源消耗分布在哪里？

核心指标：
- **结构化日志**：每轮的输入、输出、决策
- **性能指标**：Token 使用、延迟、成功率
- **状态快照**：关键时刻的完整状态
- **决策轨迹**：为什么做出某个决策

#### 能干什么

良好的可观测性能够：
- 快速定位失败原因
- 优化 Token 和时间消耗
- 验证 Agent 行为符合预期
- 积累可复现的测试案例

缺乏可观测性会导致：
- Agent 像黑盒，只能猜测内部逻辑
- 无法复现偶发性错误
- 难以评估改进效果
- 无法解释 Agent 的决策

#### 怎么用

实现分层可观测性：

```python
import logging
import json
from datetime import datetime

class ObservableLoop:
    def __init__(self, task_id, emit_events=True):
        self.task_id = task_id
        self.emit_events = emit_events
        self.logger = logging.getLogger(f"agent.{task_id}")
        self.events = []
    
    def emit(self, event_type, data):
        """发出结构化事件"""
        event = {
            "task_id": self.task_id,
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "data": data
        }
        
        self.events.append(event)
        
        if self.emit_events:
            # 输出到日志系统
            self.logger.info(json.dumps(event))
    
    def run(self, query):
        self.emit("loop.start", {"query": query})
        
        for iteration in range(self.max_iterations):
            self.emit("iteration.start", {"iteration": iteration})
            
            # 推理阶段
            reasoning = self.reason(query)
            self.emit("reasoning", {
                "content": reasoning,
                "tokens": count_tokens(reasoning)
            })
            
            # 决策阶段
            action = self.decide(reasoning)
            self.emit("decision", {
                "tool": action.tool,
                "args": action.args,
                "confidence": action.confidence
            })
            
            # 执行阶段
            start = time.time()
            result = self.execute(action)
            duration = time.time() - start
            
            self.emit("execution", {
                "tool": action.tool,
                "success": result.success,
                "duration_ms": int(duration * 1000),
                "output_size": len(str(result.output))
            })
            
            # 检查终止
            should_stop, reason = self.check_termination(result)
            if should_stop:
                self.emit("loop.end", {
                    "reason": reason,
                    "iterations": iteration + 1,
                    "total_tokens": self.total_tokens
                })
                break
        
        return self.get_summary()
    
    def get_summary(self):
        """生成执行摘要"""
        return {
            "task_id": self.task_id,
            "total_iterations": len([e for e in self.events if e["type"] == "iteration.start"]),
            "total_tokens": sum(e["data"].get("tokens", 0) for e in self.events),
            "tools_used": list(set(
                e["data"]["tool"] for e in self.events if e["type"] == "execution"
            )),
            "success": self.events[-1]["data"]["reason"] == "success",
            "timeline": self.events
        }

# 使用示例
agent = ObservableLoop(task_id="task-123", emit_events=True)
result = agent.run("查询并分析最新的 AI 论文")

# 分析执行轨迹
print(f"总轮次: {result['total_iterations']}")
print(f"总 Token: {result['total_tokens']}")
print(f"使用工具: {result['tools_used']}")
```

**可视化轨迹**：

```python
def visualize_trace(events):
    """
    生成可视化的执行轨迹
    """
    print("Agent 执行轨迹:")
    print("=" * 60)
    
    for event in events:
        if event["type"] == "iteration.start":
            print(f"\n第 {event['data']['iteration'] + 1} 轮:")
        
        elif event["type"] == "reasoning":
            tokens = event["data"]["tokens"]
            print(f"  💭 推理 ({tokens} tokens)")
        
        elif event["type"] == "decision":
            tool = event["data"]["tool"]
            print(f"  ⚡ 决策: {tool}")
        
        elif event["type"] == "execution":
            duration = event["data"]["duration_ms"]
            success = "✓" if event["data"]["success"] else "✗"
            print(f"  {success} 执行: {duration}ms")
        
        elif event["type"] == "loop.end":
            reason = event["data"]["reason"]
            print(f"\n终止: {reason}")
            print(f"总计: {event['data']['iterations']} 轮, {event['data']['total_tokens']} tokens")

# 输出示例：
# Agent 执行轨迹:
# ============================================================
# 
# 第 1 轮:
#   💭 推理 (150 tokens)
#   ⚡ 决策: search_papers
#   ✓ 执行: 450ms
# 
# 第 2 轮:
#   💭 推理 (200 tokens)
#   ⚡ 决策: analyze_text
#   ✓ 执行: 1200ms
# 
# 终止: success
# 总计: 2 轮, 3500 tokens
```

> **重点：** 可观测性要从第一行代码就设计进去，事后添加成本很高。

## 例子

### 例子 1：最简单的 ReAct Loop

**场景**：实现一个能搜索和计算的问答 Agent

**实现**：

```python
def simple_react_agent(question, max_iterations=5):
    """
    最简单的 ReAct 实现：推理-行动循环
    """
    # 可用工具
    tools = {
        "search": lambda q: f"搜索结果: {q} 的信息...",
        "calculator": lambda expr: eval(expr)
    }
    
    context = [{"role": "user", "content": question}]
    
    for i in range(max_iterations):
        print(f"\n=== 第 {i+1} 轮 ===")
        
        # 调用 LLM 推理
        response = call_llm(context, tools=tools.keys())
        
        # 检查是否给出最终答案
        if response.type == "final_answer":
            return response.content
        
        # 执行工具调用
        if response.type == "tool_call":
            tool_name = response.tool_call.name
            tool_args = response.tool_call.args
            
            print(f"调用工具: {tool_name}({tool_args})")
            
            # 执行工具
            result = tools[tool_name](**tool_args)
            print(f"工具结果: {result}")
            
            # 将结果加入上下文
            context.append({"role": "assistant", "tool_call": response.tool_call})
            context.append({"role": "tool", "content": str(result)})
    
    return "达到最大迭代次数，未完成任务"

# 使用示例
answer = simple_react_agent("北京到上海的距离是多少公里？乘以2是多少？")

# 预期执行流程：
# 第 1 轮: 调用 search("北京到上海距离") → "约1318公里"
# 第 2 轮: 调用 calculator("1318 * 2") → 2636
# 第 3 轮: 返回最终答案 "2636公里"
```

**说明**：
- 每轮推理都基于前面所有的观察结果
- 工具调用和结果都追加到上下文中
- 通过 `max_iterations` 防止无限循环

**运行结果**：
```
=== 第 1 轮 ===
调用工具: search(北京到上海距离)
工具结果: 约1318公里

=== 第 2 轮 ===
调用工具: calculator(1318 * 2)
工具结果: 2636

=== 第 3 轮 ===
最终答案: 北京到上海的距离约1318公里，乘以2是2636公里。
```

### 例子 2：带错误恢复的生产级 Loop

**Situation（背景）**：
某代码助手 Agent 需要执行用户的代码修改请求，但工具调用经常因为文件不存在、权限问题、格式错误而失败。初期版本一旦失败就崩溃，导致用户体验很差。

**Task（任务）**：
增强 Agent 的错误恢复能力，使其能够：
1. 从临时性错误中自动恢复（重试）
2. 识别永久性错误并切换策略
3. 记录错误上下文供调试

**Action（行动）**：

```python
class ResilientCodeAgent:
    """
    带错误恢复的代码 Agent
    """
    def __init__(self):
        self.max_retries = 3
        self.max_iterations = 15
        self.error_history = []
    
    def run(self, user_request):
        state = AgentState(goal=user_request)
        
        for iteration in range(self.max_iterations):
            # 生成下一步行动
            action = self.decide_action(state)
            
            # 带恢复地执行
            result = self.execute_with_recovery(action, state)
            
            # 更新状态
            if result.success:
                state.update_success(action, result)
                
                # 检查是否完成
                if self.is_goal_achieved(state):
                    return {"status": "success", "result": state.output}
            else:
                state.update_failure(action, result)
                
                # 检查是否应该放弃
                if self.should_give_up(state):
                    return {
                        "status": "failed",
                        "reason": "连续失败次数过多",
                        "errors": self.error_history
                    }
        
        return {"status": "timeout", "partial_result": state.output}
    
    def execute_with_recovery(self, action, state):
        """
        带重试和降级的执行
        """
        for attempt in range(self.max_retries):
            try:
                # 执行工具调用
                result = self.execute_tool(action)
                return result
                
            except FileNotFoundError as e:
                # 永久性错误：文件不存在
                self.error_history.append({
                    "action": action,
                    "error": "file_not_found",
                    "message": str(e)
                })
                
                # 提供上下文让 Agent 尝试其他方法
                return Result(
                    success=False,
                    error="文件不存在，请检查路径或尝试先列出目录"
                )
            
            except PermissionError as e:
                # 永久性错误：权限不足
                self.error_history.append({
                    "action": action,
                    "error": "permission_denied",
                    "message": str(e)
                })
                
                return Result(
                    success=False,
                    error="权限不足，请使用只读操作或请求用户授权"
                )
            
            except TimeoutError as e:
                # 临时性错误：重试
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)  # 指数退避
                    continue
                else:
                    return Result(
                        success=False,
                        error="操作超时，请尝试减小范围或分批处理"
                    )
            
            except Exception as e:
                # 未知错误：记录并放弃
                self.error_history.append({
                    "action": action,
                    "error": "unknown",
                    "message": str(e)
                })
                return Result(success=False, error=f"未知错误: {e}")
        
        return Result(success=False, error="重试次数耗尽")
    
    def should_give_up(self, state):
        """判断是否应该放弃"""
        # 连续失败 3 次
        if state.consecutive_failures >= 3:
            return True
        
        # 相同错误重复出现
        recent_errors = [e["error"] for e in self.error_history[-3:]]
        if len(set(recent_errors)) == 1:  # 都是同一个错误
            return True
        
        return False

# 使用示例
agent = ResilientCodeAgent()

result = agent.run("读取 config.json 并修改 port 配置为 8080")

if result["status"] == "success":
    print("✓ 任务完成")
elif result["status"] == "failed":
    print(f"✗ 任务失败: {result['reason']}")
    print(f"错误历史: {result['errors']}")
```

**Result（结果）**：
- 任务成功率从 65% 提升到 92%
- 平均恢复时间 < 5 秒
- 用户报告"Agent 更智能了，知道换方法"
- 错误日志帮助发现了 3 个工具实现的 bug

**关键决策**：
区分永久性错误和临时性错误，前者立即反馈给 LLM 寻求替代方案，后者自动重试。避免在死胡同里浪费资源。

### 例子 3：Plan-Execute 架构对比

**场景**：对比 ReAct 和 Plan-Execute 在同一任务上的表现差异

**初始版本（ReAct）**：

```python
# ❌ 问题：每一步都要思考，容易偏离目标
def react_approach(task):
    context = [task]
    
    for i in range(10):
        # 每轮都重新思考下一步
        thought = llm.think(context)  # "我应该做什么？"
        action = llm.decide(thought)
        result = execute(action)
        context.append(result)
        
        # 可能走偏
        if result.contains_interesting_info:
            # Agent 可能被吸引去探索，忘记原始目标
            ...
```

**问题分析**：
- 没有整体规划，容易被中间结果带偏
- 每轮推理都消耗 Token
- 难以评估进度（不知道还要多少步）

**改进版本（Plan-Execute）**：

```python
# ✅ 改进：先规划再执行，保持目标聚焦
def plan_execute_approach(task):
    # 1. 规划阶段：生成完整计划
    plan = llm.create_plan(task)
    # 返回: ["步骤1: 搜索资料", "步骤2: 提取关键数据", "步骤3: 生成报告"]
    
    print(f"执行计划: {plan}")
    
    # 2. 执行阶段：逐步执行
    results = []
    for step in plan:
        result = execute_step(step)
        results.append(result)
        
        # 如果失败，重新规划剩余部分
        if result.failed:
            remaining = plan[plan.index(step):]
            plan = llm.replan(remaining, result)
            print(f"重新规划: {plan}")
    
    # 3. 总结阶段
    return llm.synthesize(task, results)
```

**改进效果**：
- 任务完成率提升：70% → 88%
- 平均 Token 消耗降低 30%（减少重复思考）
- 用户可见的进度条："步骤 2/5"
- 更容易调试（知道在哪一步出错）

### 例子 4：循环陷阱诊断实战

**Situation（背景）**：
生产环境中发现部分 Agent 任务消耗了全部 20 轮迭代但未完成，用户等待很久后得到"超时"提示。

**Task（任务）**：
诊断为什么 Agent 陷入循环，并实现防护机制。

**Action（行动）**：

```python
# 1. 添加循环检测
class LoopDetector:
    def __init__(self, window_size=3):
        self.history = []
        self.window = window_size
    
    def add_state(self, state):
        """记录状态指纹"""
        fingerprint = hash((
            state.current_action,
            frozenset(state.completed_steps),
            state.last_observation[:100]  # 只取前100字符
        ))
        self.history.append(fingerprint)
    
    def detect_loop(self):
        """检测是否在重复相同模式"""
        if len(self.history) < self.window * 2:
            return False
        
        recent = self.history[-self.window:]
        previous = self.history[-self.window*2:-self.window]
        
        if recent == previous:
            return True, "完全重复的动作序列"
        
        # 检测振荡（A→B→A→B）
        if len(set(recent)) == 2 and recent[0] == recent[2]:
            return True, "在两个状态间振荡"
        
        return False, None
    
    def get_diagnosis(self):
        """生成诊断报告"""
        from collections import Counter
        action_freq = Counter(self.history[-10:])
        most_common = action_freq.most_common(1)[0]
        
        return {
            "pattern": "循环",
            "repeated_action": most_common[0],
            "frequency": most_common[1],
            "suggestion": "目标条件可能不明确，或工具结果无法满足终止条件"
        }

# 2. 集成到 Agent
class LoopSafeAgent:
    def __init__(self):
        self.detector = LoopDetector(window_size=3)
    
    def run(self, task):
        state = AgentState(goal=task)
        
        for iteration in range(20):
            # 记录状态
            self.detector.add_state(state)
            
            # 检测循环
            is_looping, pattern = self.detector.detect_loop()
            if is_looping:
                diagnosis = self.detector.get_diagnosis()
                
                # 给 Agent 反馈
                state.inject_feedback(
                    f"检测到循环模式: {pattern}。"
                    f"你似乎重复执行 {diagnosis['repeated_action']}。"
                    f"建议: {diagnosis['suggestion']}"
                )
                
                # 清空检测器，给 Agent 一次机会改正
                self.detector = LoopDetector()
            
            # 继续执行
            action = self.decide(state)
            result = self.execute(action)
            state.update(result)
            
            if state.is_complete():
                return {"status": "success", "iterations": iteration + 1}
        
        return {"status": "loop_timeout", "diagnosis": self.detector.get_diagnosis()}

# 使用示例
agent = LoopSafeAgent()
result = agent.run("修复测试失败")

if result["status"] == "loop_timeout":
    print("Agent 陷入循环:")
    print(result["diagnosis"])
```

**Result（结果）**：
- 循环超时问题降低 80%
- 剩余 20% 的循环能被检测到并提前终止
- 诊断报告帮助改进了 prompt 设计
- 发现了 3 个工具返回结果不明确的问题

**关键决策**：
不是简单限制迭代次数，而是检测"无效的重复"，并给 Agent 反馈让它自我纠正。

## 练习

1. **基础练习**：实现一个最简单的 Agent Loop，支持 2 个工具（搜索和计算），能正确终止。

2. **状态管理练习**：为你的 Loop 添加结构化状态，包含目标、已完成步骤、当前步骤。实现状态的序列化和恢复。

3. **错误处理练习**：模拟工具随机失败（30% 概率），实现重试机制和降级策略，确保任务成功率 > 80%。

4. **循环检测练习**：设计一个会陷入循环的任务场景，实现循环检测器，能在 3 轮内识别并中断。

5. **综合练习**：实现一个 Plan-Execute Agent，能够：
   - 根据用户任务生成 3-5 步计划
   - 逐步执行并记录结果
   - 如果某步失败，重新规划剩余步骤
   - 提供清晰的进度反馈

## 验收

- 能准确描述 Agent Loop 的四个基本步骤和执行流程。
- 能根据任务类型选择合适的 Loop 架构（ReAct/Plan-Execute/Reflexion）。
- 能设计包含成功、失败、资源三类的终止条件。
- 能实现基本的错误处理和重试机制。
- 能识别并诊断常见的循环陷阱（无限循环、上下文溢出）。

## 重点

Agent Loop 的可靠性不是来自"更聪明的模型"，而是来自"更好的工程设计"：明确的终止条件、结构化的状态管理、分层的错误处理、完善的可观测性。

## 难点

难点是平衡灵活性与控制：
- 太灵活：Agent 可能偏离目标、陷入循环、浪费资源
- 太严格：Agent 无法处理意外情况、缺少创造性

解决思路：用"护栏"而非"轨道"——设定边界和检查点，但允许 Agent 在边界内自由探索。

## 易错

> **易错：** 把 Agent Loop 当成"让 LLM 多调用几次工具"。
>
> 正确理解：Loop 是一个完整的控制系统，包含状态管理、终止检测、错误恢复、资源控制等多个子系统。

> **易错：** 只关注"能不能跑"，不关注"为什么这样跑"。
>
> 正确做法：从第一天就加入可观测性，记录每轮的决策依据、资源消耗、失败原因。

> **易错：** 用固定的迭代次数作为唯一终止条件。
>
> 正确做法：实现多层终止条件，优先级：任务完成 > 无法继续 > 资源耗尽。

> **易错：** 对所有错误都一视同仁地重试。
>
> 正确做法：区分临时性错误（值得重试）和永久性错误（立即放弃并告知 LLM）。

