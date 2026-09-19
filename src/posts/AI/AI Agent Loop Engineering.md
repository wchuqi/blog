---
title: "AI Agent Loop Engineering"
date: 2026-08-21
tags:
  - "AI"
  - "Agent"
review:
  created: 2026-08-21
  lastReview: 2026-08-23
  reps: 0
  interval: 0
  ease: 2.5
noReview: true
---
# AI Agent Loop Engineering

> Engineering the control flow and decision cycles that enable AI agents to operate autonomously, handle complex tasks, and adapt to changing conditions.

**Category**: AI Systems / Agent Architecture  
**Difficulty**: Advanced  
**Prerequisites**: Understanding of AI agents, prompt engineering, system design patterns, error handling

## What Is AI Agent Loop Engineering?

**AI Agent Loop Engineering** is the practice of designing, implementing, and optimizing the core execution cycles that govern how AI agents perceive their environment, make decisions, take actions, and learn from outcomes. It's the architectural backbone that transforms a language model from a single-shot responder into an autonomous system capable of multi-step reasoning, tool use, and goal-directed behavior.

Think of it like building the "operating system" for an AI agent — just as an OS manages processes, handles interrupts, and coordinates resources, an agent loop manages reasoning cycles, orchestrates tool calls, and coordinates the flow of information between the model, tools, and external systems.

### Why It Exists

AI agents need to handle tasks that cannot be solved in a single model invocation:
- **Multi-step reasoning**: Breaking complex problems into subtasks
- **Tool orchestration**: Deciding which tools to use and in what sequence
- **Error recovery**: Handling failures and retrying with different strategies
- **State management**: Maintaining context across multiple iterations
- **Resource constraints**: Operating within token budgets and time limits

Without proper loop engineering, agents either fail unpredictably, waste resources, or get stuck in unproductive cycles.

## Core Concepts

### 3.1 The Agent Loop

At its core, an agent loop is a cycle of four fundamental operations:

```
Observe → Reason → Act → Update → [repeat]
```

- **Observe**: Gather information from the environment (user input, tool results, system state)
- **Reason**: Use the language model to analyze observations and decide what to do next
- **Act**: Execute actions (call tools, generate responses, modify state)
- **Update**: Incorporate results back into the agent's context for the next iteration

This cycle continues until a termination condition is met (goal achieved, max iterations reached, error encountered).

### 3.2 Loop Types

Different architectures organize loops in different ways:

#### ReAct Loop (Reason + Act)
The most common pattern where the model reasons about what to do, then acts:
```
User Query → Reasoning → Tool Call → Observation → Reasoning → Tool Call → ... → Final Answer
```

#### Plan-Execute Loop
Separate planning from execution:
```
User Query → Generate Plan → Execute Step 1 → Execute Step 2 → ... → Verify Result
```

#### Reflexion Loop
Add self-critique and refinement:
```
Attempt → Evaluate → Reflect → Refine → Re-attempt → ...
```

#### Tree Search Loop
Explore multiple branches and backtrack:
```
State → Generate Options → Evaluate Each → Select Best → Expand → ... → Find Solution
```

### 3.3 Termination Conditions

Every loop needs clear exit criteria to avoid infinite cycles:

- **Success conditions**: Goal achieved, task completed, answer found
- **Failure conditions**: Error threshold exceeded, contradiction detected
- **Resource limits**: Max iterations, token budget exhausted, timeout
- **User intervention**: Explicit stop signal, approval required

### 3.4 State Management

Loops must maintain state across iterations:

- **Conversation history**: Full context of prior turns
- **Working memory**: Intermediate results, tool outputs, observations
- **Metadata**: Iteration count, token usage, timing information
- **Persistent state**: Long-term memory, cached results, learned preferences

### 3.5 Control Flow Patterns

How the loop decides what to do next:

- **Sequential**: Execute predefined steps in order
- **Conditional**: Branch based on observations or results
- **Iterative**: Repeat until convergence or satisfaction
- **Reactive**: Respond to events as they occur
- **Proactive**: Anticipate needs and act preemptively

## How It Works

A typical agent loop operates through these stages:

### Stage 1: Initialization
```python
# Set up the agent with initial context
agent_state = {
    "goal": user_query,
    "context": [],
    "iteration": 0,
    "max_iterations": 10,
    "tools": available_tools,
    "status": "active"
}
```

### Stage 2: Loop Execution
```
WHILE agent_state.status == "active" AND agent_state.iteration < max_iterations:
    
    1. Construct prompt with current context
    2. Call language model for reasoning
    3. Parse model output for actions/tool calls
    4. Execute actions and collect results
    5. Update agent state with new observations
    6. Check termination conditions
    7. Increment iteration counter
    
END WHILE
```

### Stage 3: Post-Processing
```python
# After loop exits
if agent_state.status == "success":
    return final_answer
elif agent_state.status == "max_iterations":
    return partial_result_with_explanation
else:
    handle_error(agent_state.error)
```

### Information Flow Diagram

```
┌─────────────────────────────────────────────┐
│          User Query / Goal                  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│     Agent State (Context + Memory)          │
└──────────────┬──────────────────────────────┘
               │
      ┌────────▼─────────┐
      │                  │
      │  Iteration Loop  │◄──────────┐
      │                  │           │
      └────────┬─────────┘           │
               │                     │
               ▼                     │
    ┌──────────────────┐            │
    │  Language Model  │            │
    │    (Reasoning)   │            │
    └──────────┬───────┘            │
               │                     │
               ▼                     │
    ┌──────────────────┐            │
    │  Action Parser   │            │
    └──────────┬───────┘            │
               │                     │
        ┌──────┴──────┐             │
        │             │             │
        ▼             ▼             │
   ┌────────┐    ┌────────┐        │
   │ Tool   │    │Response│        │
   │Executor│    │Generator│       │
   └────┬───┘    └────┬───┘        │
        │             │             │
        └──────┬──────┘             │
               │                     │
               ▼                     │
    ┌──────────────────┐            │
    │ Update Context   │            │
    │ Check Termination│────No──────┘
    └──────────┬───────┘
               │
             Yes (Done)
               │
               ▼
    ┌──────────────────┐
    │  Final Result    │
    └──────────────────┘
```

## Practical Examples

### 5.1 Basic Example: Simple ReAct Loop

This is the simplest working agent loop that implements Reason + Act:

```python
def simple_react_loop(user_query, tools, max_iterations=5):
    """
    Basic ReAct loop: model reasons, then acts, then observes result.
    """
    context = [{"role": "user", "content": user_query}]
    
    for iteration in range(max_iterations):
        # REASON: Ask model what to do
        response = call_language_model(context)
        
        # Parse the response
        if is_final_answer(response):
            return response.content
        
        # ACT: Execute tool calls
        tool_results = []
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call.name, tool_call.args)
            tool_results.append(result)
        
        # OBSERVE: Add results to context
        context.append({"role": "assistant", "tool_calls": response.tool_calls})
        context.append({"role": "tool", "content": tool_results})
    
    return "Max iterations reached without finding answer"

# Usage
tools = [search_web, calculate, read_file]
answer = simple_react_loop("What is the population of Tokyo?", tools)
print(answer)
```

**Expected Output:**
```
Iteration 1: Model decides to search_web("Tokyo population")
Tool returns: "Tokyo has approximately 14 million people in the city proper..."
Iteration 2: Model synthesizes answer
Final answer: "Tokyo has approximately 14 million people in the city proper and 
37 million in the greater metropolitan area."
```

### 5.2 Intermediate Example: Loop with Error Recovery

A more robust loop that handles failures and retries:

```python
class AgentLoop:
    def __init__(self, tools, max_iterations=10, max_retries=3):
        self.tools = tools
        self.max_iterations = max_iterations
        self.max_retries = max_retries
        
    def run(self, user_query):
        state = {
            "context": [{"role": "user", "content": user_query}],
            "iteration": 0,
            "retry_count": 0,
            "last_error": None
        }
        
        while state["iteration"] < self.max_iterations:
            try:
                # Generate next action
                response = self._reason(state)
                
                # Check if done
                if self._is_complete(response):
                    return self._extract_answer(response)
                
                # Execute actions
                results = self._act(response)
                
                # Update state with observations
                self._update_state(state, response, results)
                state["retry_count"] = 0  # Reset on success
                
            except ToolExecutionError as e:
                # Handle tool failures
                state["last_error"] = str(e)
                state["retry_count"] += 1
                
                if state["retry_count"] >= self.max_retries:
                    # Add error to context and let model try different approach
                    state["context"].append({
                        "role": "system",
                        "content": f"Previous approach failed: {e}. Try alternative method."
                    })
                    state["retry_count"] = 0
                else:
                    # Simple retry
                    continue
            
            state["iteration"] += 1
        
        return {"status": "incomplete", "reason": "max_iterations_reached"}
    
    def _reason(self, state):
        """Call LLM to decide next action"""
        prompt = self._build_prompt(state)
        return call_language_model(prompt)
    
    def _act(self, response):
        """Execute tool calls from model response"""
        results = []
        for tool_call in response.tool_calls:
            tool = self.tools[tool_call.name]
            result = tool.execute(**tool_call.args)
            results.append(result)
        return results
    
    def _update_state(self, state, response, results):
        """Add new information to context"""
        state["context"].append({
            "role": "assistant",
            "content": response.content,
            "tool_calls": response.tool_calls
        })
        state["context"].append({
            "role": "tool",
            "content": results
        })

# Usage
agent = AgentLoop(tools={"search": search_tool, "calculator": calc_tool})
result = agent.run("Find the average GDP of G7 countries")
```

### 5.3 Advanced Example: Multi-Agent Loop with Reflection

A sophisticated loop that uses self-critique and refinement:

```python
class ReflexionAgent:
    """
    Agent that reflects on its own outputs and iteratively improves them.
    """
    def __init__(self, actor_model, critic_model, tools):
        self.actor = actor_model
        self.critic = critic_model
        self.tools = tools
        self.memory = []
    
    def run(self, task, quality_threshold=0.8, max_attempts=5):
        """
        Attempt task, evaluate quality, reflect, and refine until satisfactory.
        """
        attempt_history = []
        
        for attempt in range(max_attempts):
            # ACT: Generate solution attempt
            solution = self._attempt_task(task, attempt_history)
            
            # EVALUATE: Critic assesses quality
            evaluation = self._evaluate_solution(task, solution)
            
            attempt_history.append({
                "attempt": attempt + 1,
                "solution": solution,
                "evaluation": evaluation
            })
            
            # Check if quality is sufficient
            if evaluation["score"] >= quality_threshold:
                return {
                    "solution": solution,
                    "attempts": attempt + 1,
                    "final_score": evaluation["score"]
                }
            
            # REFLECT: Generate critique for next attempt
            reflection = self._generate_reflection(attempt_history)
            attempt_history[-1]["reflection"] = reflection
            
            # Add to long-term memory
            self.memory.append({
                "task_type": self._classify_task(task),
                "failure_pattern": reflection["key_issues"],
                "successful_fix": None  # Will update if next attempt succeeds
            })
        
        return {
            "solution": attempt_history[-1]["solution"],
            "attempts": max_attempts,
            "final_score": attempt_history[-1]["evaluation"]["score"],
            "status": "incomplete"
        }
    
    def _attempt_task(self, task, history):
        """Actor generates solution, informed by previous attempts"""
        context = self._build_actor_context(task, history)
        
        response = self.actor.generate(
            prompt=context,
            tools=self.tools,
            max_iterations=10
        )
        
        return response
    
    def _evaluate_solution(self, task, solution):
        """Critic evaluates solution quality"""
        evaluation_prompt = f"""
        Task: {task}
        
        Solution: {solution}
        
        Evaluate this solution on:
        1. Correctness (0-1)
        2. Completeness (0-1)
        3. Efficiency (0-1)
        4. Clarity (0-1)
        
        Provide overall score and specific issues found.
        """
        
        critique = self.critic.generate(
            prompt=evaluation_prompt,
            format="json",
            schema={
                "correctness": "float",
                "completeness": "float", 
                "efficiency": "float",
                "clarity": "float",
                "issues": "list[str]",
                "score": "float"
            }
        )
        
        return critique
    
    def _generate_reflection(self, history):
        """Generate insights from failed attempts"""
        recent_attempts = history[-3:]  # Last 3 attempts
        
        reflection_prompt = f"""
        You attempted this task {len(recent_attempts)} times.
        
        {self._format_attempt_history(recent_attempts)}
        
        Analyze what went wrong and what to change:
        - What patterns of mistakes keep recurring?
        - What assumptions were incorrect?
        - What alternative approaches should be tried?
        """
        
        reflection = self.critic.generate(prompt=reflection_prompt)
        return reflection
    
    def _build_actor_context(self, task, history):
        """Build prompt for actor that includes reflections"""
        context = f"Task: {task}\n\n"
        
        if history:
            context += "Previous attempts and lessons learned:\n"
            for item in history[-2:]:  # Last 2 attempts
                context += f"\nAttempt {item['attempt']}:\n"
                context += f"Issues: {item['evaluation']['issues']}\n"
                if 'reflection' in item:
                    context += f"Reflection: {item['reflection']}\n"
        
        # Add relevant patterns from long-term memory
        relevant_memories = self._retrieve_relevant_memories(task)
        if relevant_memories:
            context += "\nRelevant past experiences:\n"
            for mem in relevant_memories:
                context += f"- {mem['failure_pattern']} → {mem['successful_fix']}\n"
        
        return context

# Usage Example
actor = LanguageModel("gpt-4")
critic = LanguageModel("gpt-4")
tools = [code_executor, web_search, file_system]

agent = ReflexionAgent(actor, critic, tools)

result = agent.run(
    task="Write a Python function to find the longest palindromic substring",
    quality_threshold=0.85,
    max_attempts=5
)

print(f"Solution found in {result['attempts']} attempts")
print(f"Final score: {result['final_score']}")
print(result['solution'])
```

**Expected Flow:**
```
Attempt 1: Basic brute force solution
Evaluation: Correctness 0.7, Efficiency 0.3, Score 0.6
Reflection: "Approach is too slow for large strings, need better algorithm"

Attempt 2: Dynamic programming approach
Evaluation: Correctness 0.9, Efficiency 0.7, Score 0.82
Reflection: "Close but edge cases with single characters not handled"

Attempt 3: Refined DP with edge case handling
Evaluation: Correctness 1.0, Efficiency 0.8, Score 0.88
Status: Success ✓
```

## Key Points & Takeaways

- **Agent loops are the execution engine** that transforms single-shot LLM calls into autonomous, multi-step problem solvers
- **The core cycle is Observe → Reason → Act → Update** — this pattern repeats until termination conditions are met
- **Termination conditions are critical** — without them, agents waste resources or loop infinitely
- **State management is non-trivial** — context grows with each iteration, requiring careful memory management
- **Error handling must be built into the loop** — tools fail, models hallucinate, resources run out
- **Different loop architectures serve different purposes** — ReAct for tool use, Plan-Execute for complex tasks, Reflexion for quality
- **Observability is essential** — instrument loops to track iterations, token usage, tool calls, and decision points
- **The model is stateless; the loop provides continuity** — all memory and context must be explicitly managed
- **Resource constraints shape loop design** — token budgets, time limits, and API costs influence termination logic
- **Testing loops is harder than testing functions** — non-determinism and emergent behavior require different validation strategies

## Common Pitfalls & Mistakes

### 7.1 Infinite Loops and Oscillation

**What it is**: The agent gets stuck repeating the same actions without making progress.

**Why it happens**: 
- No clear termination signal
- Model doesn't recognize it's in a loop
- Insufficient context pruning causes repeated decisions

> ❌ **Wrong**:
> ```python
> while not done:
>     action = model.decide(context)
>     result = execute(action)
>     context.append(result)
>     # No check if we're making progress!
> ```

> ✅ **Correct**:
> ```python
> MAX_ITERATIONS = 10
> seen_states = set()
> 
> for iteration in range(MAX_ITERATIONS):
>     state_hash = hash_state(context)
>     if state_hash in seen_states:
>         # Detected a loop!
>         context.append("You seem to be repeating yourself. Try a different approach.")
>         seen_states.clear()
>     
>     seen_states.add(state_hash)
>     action = model.decide(context)
>     result = execute(action)
>     context.append(result)
>     
>     if is_goal_achieved(result):
>         break
> ```

### 7.2 Context Window Overflow

**What it is**: The conversation history grows too large and exceeds the model's context limit.

**Why it happens**:
- Each iteration adds messages to context
- Tool outputs can be very large (file contents, web pages)
- No strategy for pruning or summarizing old information

> ❌ **Wrong**:
> ```python
> context = []
> for i in range(20):
>     context.append(user_message)
>     response = model.generate(context)  # Context keeps growing!
>     context.append(response)
> ```

> ✅ **Correct**:
> ```python
> def manage_context(context, max_tokens=8000):
>     # Keep system prompt, original query, and recent history
>     system = context[0]
>     original_query = context[1]
>     recent = context[-6:]  # Last 3 turns (6 messages)
>     
>     # Summarize middle history if needed
>     if count_tokens(context) > max_tokens:
>         middle = context[2:-6]
>         summary = model.summarize(middle)
>         return [system, original_query, summary] + recent
>     
>     return context
> 
> for i in range(20):
>     context = manage_context(context)
>     response = model.generate(context)
>     context.append(response)
> ```

### 7.3 Poor Error Handling

**What it is**: The loop crashes or returns unhelpful errors when tools fail or models misbehave.

**Why it happens**:
- Assuming tools always succeed
- Not validating model outputs before execution
- No fallback strategies

> ❌ **Wrong**:
> ```python
> def agent_loop(query):
>     for i in range(10):
>         action = model.decide(query)
>         result = tools[action.tool].execute(action.args)  # What if this fails?
>         query = f"{query}\nResult: {result}"
> ```

> ✅ **Correct**:
> ```python
> def agent_loop(query, max_retries=3):
>     retry_count = 0
>     
>     for i in range(10):
>         try:
>             action = model.decide(query)
>             
>             # Validate action before executing
>             if not is_valid_action(action):
>                 query += "\nInvalid action format. Please use: {tool_name, args}"
>                 continue
>             
>             result = tools[action.tool].execute(action.args)
>             retry_count = 0  # Reset on success
>             query = f"{query}\nResult: {result}"
>             
>         except ToolError as e:
>             retry_count += 1
>             if retry_count >= max_retries:
>                 return f"Failed after {max_retries} retries: {e}"
>             
>             query += f"\nTool failed: {e}. Try a different approach."
>         
>         except ModelError as e:
>             return f"Model error: {e}"
> ```

### 7.4 Ignoring Token Costs and Latency

**What it is**: The loop makes excessive API calls or includes unnecessary information in each prompt.

**Why it happens**:
- Not considering the cumulative cost of iterations
- Including full history when only recent context matters
- Making redundant tool calls

> ❌ **Wrong**:
> ```python
> # Sending entire history every time
> for i in range(50):  # 50 iterations = 50 expensive API calls
>     response = model.generate(full_history)  # Repeating old info
>     full_history.append(response)
> ```

> ✅ **Correct**:
> ```python
> # Use sliding window and cache intermediate results
> for i in range(50):
>     # Only send what's needed
>     relevant_context = extract_relevant(history, current_goal)
>     response = model.generate(relevant_context)
>     
>     # Cache expensive computations
>     if should_cache(response):
>         cache[response.key] = response.result
> ```

### 7.5 No Observable Behavior

**What it is**: The loop runs as a black box with no visibility into what's happening internally.

**Why it happens**:
- No logging or instrumentation
- No way to track why decisions were made
- Difficult to debug when things go wrong

> ❌ **Wrong**:
> ```python
> def agent_loop(query):
>     for i in range(10):
>         action = model.decide(query)
>         result = execute(action)
>         # User has no idea what's happening!
> ```

> ✅ **Correct**:
> ```python
> import logging
> 
> def agent_loop(query, logger=None):
>     logger = logger or logging.getLogger(__name__)
>     
>     for i in range(10):
>         logger.info(f"Iteration {i}: Reasoning about next action")
>         
>         action = model.decide(query)
>         logger.info(f"Decided: {action.tool}({action.args})")
>         
>         result = execute(action)
>         logger.info(f"Result: {result[:100]}...")  # Truncate long results
>         
>         # Emit events for monitoring
>         emit_metric("iteration", i)
>         emit_metric("tokens_used", count_tokens(query))
> ```

## Best Practices

### 8.1 Design for Observability from Day One

Every loop should emit structured logs showing:
- Iteration number
- Model reasoning (the "why" behind actions)
- Tool calls and their results
- Token usage per iteration
- Timing information

```python
class ObservableLoop:
    def __init__(self, emit_event):
        self.emit = emit_event
    
    def run(self, task):
        self.emit("loop.start", {"task": task})
        
        for i in range(max_iter):
            self.emit("iteration.start", {"iteration": i})
            
            reasoning = self.reason(task)
            self.emit("reasoning", {"content": reasoning})
            
            action = self.decide(reasoning)
            self.emit("action", {"tool": action.tool, "args": action.args})
            
            result = self.execute(action)
            self.emit("result", {"data": result, "tokens": count_tokens(result)})
```

### 8.2 Implement Progressive Complexity

Start simple, add sophistication only when needed:
1. **Phase 1**: Basic loop with fixed iterations
2. **Phase 2**: Add termination conditions
3. **Phase 3**: Add error handling and retries
4. **Phase 4**: Add context management
5. **Phase 5**: Add reflection and self-improvement

Don't build a reflexive multi-agent system when a simple ReAct loop solves the problem.

### 8.3 Use Guardrails and Validation

Validate model outputs before executing them:

```python
def safe_execute(action, validators):
    # Validate before execution
    for validator in validators:
        if not validator.check(action):
            raise ValidationError(validator.reason)
    
    # Execute with sandboxing
    try:
        result = execute_sandboxed(action)
    except Exception as e:
        # Log and handle gracefully
        log_error(action, e)
        return ErrorResult(e)
    
    return result
```

Common validations:
- Tool exists and is allowed
- Arguments match expected schema
- No dangerous operations (file deletion, network calls to untrusted hosts)
- Resource limits not exceeded

### 8.4 Plan for Context Management Early

Context management strategies:
- **Sliding window**: Keep only recent N messages
- **Summarization**: Compress old history into summaries
- **Retrieval**: Store history externally, retrieve relevant parts
- **Hierarchical**: Separate working memory from long-term memory

Choose based on task requirements:
- Short tasks → sliding window
- Long conversations → summarization
- Knowledge-intensive → retrieval
- Complex reasoning → hierarchical

### 8.5 Test Loop Behavior, Not Just Components

Unit testing individual components isn't enough. Test:

```python
def test_loop_convergence():
    """Agent should reach goal within reasonable iterations"""
    agent = AgentLoop()
    result = agent.run("What is 2+2?", max_iterations=10)
    
    assert result.status == "success"
    assert result.iterations <= 3  # Should be fast for simple questions

def test_loop_handles_tool_failure():
    """Agent should recover from tool failures"""
    agent = AgentLoop(tools=[FlakyTool()])
    result = agent.run("Use the flaky tool", max_iterations=10)
    
    # Should either succeed with retries or fail gracefully
    assert result.status in ["success", "tool_failure"]
    assert result.error_message is not None

def test_loop_respects_budget():
    """Agent should stop when token budget exhausted"""
    agent = AgentLoop(max_tokens=1000)
    result = agent.run("Complex task", max_iterations=100)
    
    assert result.tokens_used <= 1000
```

### 8.6 Separate Control Logic from Business Logic

Keep loop orchestration separate from domain-specific logic:

```python
# Good: Generic loop engine
class AgentLoop:
    def run(self, task, strategy):
        while not self.should_terminate():
            action = strategy.decide(self.state)
            result = self.execute(action)
            self.update(result)

# Domain logic is pluggable
class CodeGenerationStrategy:
    def decide(self, state):
        # Domain-specific reasoning
        pass

class DataAnalysisStrategy:
    def decide(self, state):
        # Different domain logic
        pass
```

This makes loops reusable across different agent types.

## FAQ / Common Questions

### Q: How many iterations should a loop have?

It depends on task complexity:
- **Simple queries** (lookup, calculation): 1-3 iterations
- **Multi-step reasoning** (research, analysis): 5-10 iterations
- **Complex problem-solving** (coding, planning): 10-20 iterations
- **Emergent behavior** (exploration, creativity): 20-50 iterations

Set `max_iterations` based on task type, but always have a limit. Monitor average iterations in production to tune this value.

### Q: Should I use parallel tool calls or sequential?

**Sequential** when:
- Output of Tool A is input to Tool B
- Tools modify shared state
- Order matters for correctness

**Parallel** when:
- Tools are independent
- Gathering multiple data sources
- Speed is critical

```python
# Sequential
user_id = get_user_id(email)
orders = get_orders(user_id)  # Depends on user_id

# Parallel
results = await asyncio.gather(
    search_docs(query),
    search_web(query),
    search_database(query)
)
```

### Q: How do I prevent the model from hallucinating actions?

Use strict parsing and validation:

```python
def parse_action(model_output, allowed_tools):
    try:
        action = json.loads(model_output)
    except JSONDecodeError:
        return None, "Invalid JSON format"
    
    if action["tool"] not in allowed_tools:
        return None, f"Unknown tool: {action['tool']}"
    
    schema = allowed_tools[action["tool"]].schema
    if not validate_args(action["args"], schema):
        return None, "Arguments don't match schema"
    
    return action, None
```

Use structured output modes (function calling, JSON mode) when available rather than parsing free text.

### Q: When should I use reflection/self-critique?

Use reflection when:
- Quality matters more than speed
- Tasks have objective correctness criteria (code, math, logic)
- You can afford multiple attempts
- The cost of errors is high

Skip reflection when:
- First attempt is usually good enough
- No clear quality metric
- Speed is critical
- Token budget is tight

### Q: How do I handle non-deterministic behavior in testing?

Strategies:
1. **Snapshot testing**: Record successful runs, detect regressions
2. **Property testing**: Assert invariants (e.g., "must terminate", "uses ≤ N tokens")
3. **Mocking**: Replace model with deterministic mock for control flow tests
4. **Statistical testing**: Run multiple times, assert success rate ≥ threshold

```python
def test_agent_convergence_rate():
    """Agent should succeed 95%+ of the time"""
    successes = 0
    runs = 100
    
    for _ in range(runs):
        result = agent.run("Simple task")
        if result.status == "success":
            successes += 1
    
    assert successes / runs >= 0.95
```

## Related Topics & Further Reading

### Related Concepts

- **Prompt Engineering**: How you structure prompts directly affects loop behavior and decision quality
- **Tool Use / Function Calling**: The mechanism agents use to interact with external systems during loops
- **Retrieval-Augmented Generation (RAG)**: Loops that incorporate external knowledge retrieval
- **Chain-of-Thought Reasoning**: The reasoning pattern that happens within each loop iteration
- **Multi-Agent Systems**: Coordinating multiple agent loops working together
- **Agentic Workflows**: Higher-level orchestration patterns built on top of agent loops
- **LangChain / LangGraph**: Frameworks that provide pre-built loop implementations
- **Memory Systems**: How agents maintain state across loop iterations and sessions

### Learning Path

1. **Start here**: Master basic ReAct loops and understand the observe-reason-act-update cycle
2. **Next**: Study error handling patterns and context management strategies
3. **Then**: Explore reflection and self-improvement mechanisms
4. **Advanced**: Multi-agent coordination and complex workflow orchestration
5. **Production**: Observability, testing, and optimization techniques

### Key Papers & Resources

- **ReAct Paper** (Yao et al., 2022): "ReAct: Synergizing Reasoning and Acting in Language Models" — foundational pattern for agent loops
- **Reflexion Paper** (Shinn et al., 2023): "Reflexion: Language Agents with Verbal Reinforcement Learning" — self-improvement loops
- **Tree of Thoughts** (Yao et al., 2023): Search-based loop architectures
- **LangChain Documentation**: Practical implementations of various loop patterns
- **Anthropic's Tool Use Guide**: Best practices for tool-calling loops
- **OpenAI's Function Calling Docs**: Structured output for reliable action parsing

### Open Source Implementations

- **LangChain**: Python/JS framework with pre-built agent executors
- **AutoGPT**: Open-source autonomous agent with complex loops
- **BabyAGI**: Minimalist task-driven autonomous agent loop
- **LangGraph**: Explicit graph-based agent loops with state management

## Summary

AI Agent Loop Engineering is the foundational discipline for building autonomous AI systems that can tackle complex, multi-step tasks. At its core, an agent loop implements the cycle of observation, reasoning, action, and state updates — transforming single-shot language model calls into persistent, goal-directed agents.

The key challenges in loop engineering are **termination conditions** (preventing infinite loops), **state management** (maintaining context across iterations), **error recovery** (handling tool failures and model mistakes), and **resource management** (staying within token and time budgets). Different loop architectures — ReAct, Plan-Execute, Reflexion, Tree Search — serve different purposes, and choosing the right pattern depends on task complexity, quality requirements, and resource constraints.

Successful loop engineering requires progressive complexity (start simple, add sophistication only when needed), strong observability (instrument every decision point), rigorous validation (check model outputs before execution), and thoughtful testing (assert loop behavior, not just component correctness).

Apply agent loops when tasks require multi-step reasoning, tool orchestration, or adaptive problem-solving. Use simpler patterns when a single model call suffices. Master the basics first — a well-engineered ReAct loop outperforms a poorly designed reflexive multi-agent system every time.

**What it is**: The loop makes excessive API calls or includes unnecessary information in each prompt.

**Why it happens**:
- Not considering the cumulative cost of iterations
- Including full history when only recent context matters
- Making redundant tool calls

> ❌ **Wrong**:
> ```python
> # Sending entire history every time
> for i in range(50):  # 50 iterations = 50 expensive API calls
>     response = model.generate(full_history)  # Repeating old info
>     full_history.append(response)
> ```

> ✅ **Correct**:
> ```python
> # Use sliding window and cache intermediate results
> for i in range(50):
>     # Only send what's needed
>     relevant_context = extract_relevant(history, current_goal)
>     response = model.generate(relevant_context)
>     
>     # Cache expensive computations
>     if should_cache(response):
>         cache[response.key] = response.result
> ```

