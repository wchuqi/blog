---
title: "Pi-Agent 学习文档"
date: 2026-09-19
description: "Pi 是一个极简的终端 coding harness：默认只给模型 read / write / edit / bash 四个工具，把子 Agent、plan mode、权限弹窗、MCP 都留给扩展生态去补。它的设计取向是「让 pi 适配你的工作流，而不是你去适配 pi，而且不需要 fork 和改内部」。"
tags:
  - "AI"
  - "工具"
  - "Pi-Agent"
review:
  created: 2026-09-19
  lastReview: 2026-09-19
  reps: 0
  interval: 0
  ease: 2.5
noReview: true
---

Pi 是 npm 包 `@earendil-works/pi-coding-agent`，一个极简的终端 coding harness。

「harness」这个词比「AI 编程助手」更准确——它指的是**把模型、工具、上下文注入和 agent 循环组装起来的那一层**。模型本身不属于它：Pi 可以换任意 provider，包括本地 llama.cpp。所以它的价值不在模型能力，而在交互设计和扩展能力。

它的设计取向是一句话：**让 pi 适配你的工作流，而不是你去适配 pi，而且不需要 fork 和改内部。**

这条取向落到具体做法上只有两条：

1. **核心保持最小**——默认只给模型四个工具，功能性的东西默认不存在。
2. **扩展做得极深**——TypeScript 扩展不仅能加工具和命令，还能替换内置工具、改写压缩逻辑、接管 UI。

理解这两条，后面所有「Pi 为什么没有 X」的问题都能自己回答。

> 资料以包内 README 与 `docs/` 为准。Pi 迭代较快，涉及具体命令和配置项时以本机 `pi --help` 与 `/hotkeys` 输出为准。

## 目录

- [为什么很多东西「没有」](#为什么很多东西没有)
- [安装与认证](#安装与认证)
- [四种运行模式](#四种运行模式)
- [交互模式](#交互模式)
- [会话：树、分支与压缩](#会话树分支与压缩)
- [上下文注入](#上下文注入)
- [三种扩展层次](#三种扩展层次)
- [Skills](#skills)
- [Extensions](#extensions)
- [Pi 包](#pi-包)
- [模型与 Provider](#模型与-provider)
- [安全边界](#安全边界)
- [程序化集成](#程序化集成)
- [团队落地](#团队落地)
- [附录：速查表](#附录速查表)

## 为什么很多东西「没有」

官方把一批常见功能明确列为「不做」。这张表值得先看，因为它决定了你该怎么评价 Pi：

| 不做 | 官方建议的替代 | 隐含判断 |
| --- | --- | --- |
| MCP | 把能力做成带 README 的 CLI 工具 + Skill，或写扩展加 MCP 支持 | 协议层不是必需的抽象 |
| 子 Agent | tmux 起多个 pi 实例，或自己写扩展，或装现成包 | 多实例已能表达，内建会限制实现方式 |
| 权限弹窗 | 跑在容器里，或用扩展做确认流程 | 进程内沙箱容易被误认为安全边界 |
| plan mode | 把计划写到文件里，或用扩展实现 | 产物是文件，状态管理不必内建 |
| 内置 to-do | 用 `TODO.md`，官方理由是「它们会干扰模型」 | — |
| 后台 bash | 用 tmux，理由是「完全可观测、可直接交互」 | — |

统一逻辑是：**这些功能本质上都是「在特定事件上做特定处理」，而事件已经暴露给扩展了。**

所以要主动说出这个取舍的代价，才算真的理解它：

- 开箱体验弱，需要自己搭。
- 生态成熟度依赖社区，质量参差。
- 新用户容易误判为「功能少」。
- 团队引入时要自己建准入与治理流程。

什么场景下这个取舍不划算？追求「开箱即用、统一体验」的团队场景——这时 Pi 的自定义成本可能高于直接用工具有限但一致的产品。

## 安装与认证

```bash
# npm 安装（推荐加 --ignore-scripts）
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# 安装脚本（Linux / macOS）
curl -fsSL https://pi.dev/install.sh | sh

# 卸载（两种安装方式都用 npm 卸载）
npm uninstall -g @earendil-works/pi-coding-agent
```

用 pnpm / Yarn / Bun 全局装的，用对应的全局移除命令（`pnpm remove -g ...` 等）。

`--ignore-scripts` 的含义值得注意：Pi 正常安装**不需要**依赖的生命周期脚本。少执行一段安装期代码就少一个攻击面。

认证分两类，可以共存：

```bash
# API Key
export ANTHROPIC_API_KEY=sk-ant-...
pi

# 订阅登录（Claude Pro/Max、ChatGPT Plus/Pro(Codex)、GitHub Copilot）
pi
/login
```

内置 provider 覆盖三类：

- **订阅**：Anthropic Claude Pro/Max、OpenAI ChatGPT Plus/Pro（Codex）、GitHub Copilot。
- **API Key**：Anthropic、OpenAI、Azure OpenAI、Google Gemini / Vertex、Amazon Bedrock、DeepSeek、Mistral、Groq、Cerebras、xAI、OpenRouter、Hugging Face、Fireworks、Together、Baseten、Kimi For Coding、MiniMax、Xiaomi MiMo 系列、Cloudflare AI Gateway / Workers AI、NVIDIA NIM、ZAI Coding Plan、OpenCode Zen / Go、Vercel AI Gateway 等。
- **本地**：llama.cpp router server（`/login llama.cpp` 配置，`/llama` 管理，`/model` 选中）。优势是代码不出网，某些合规场景下是唯一可行选项。

## 四种运行模式

| 模式 | 启动 | 谁在驱动 | 输出 |
| --- | --- | --- | --- |
| 交互 | 默认 `pi` | 人 | TUI |
| 打印 | `pi -p "..."` | 脚本 | 纯文本 |
| JSON | `pi --mode json` | 脚本 | 事件 JSONL |
| RPC | `pi --mode rpc` | 任意进程 | 协议 JSONL（LF 分隔） |
| SDK | import 包 | Node 应用 | API 对象 |

关键认知：**它们不是不同产品，而是同一内核的不同接口**。会话、工具、扩展、权限概念完全通用。理解了交互模式，另外三种基本是接口与输出格式的差异。

选择依据很简单：

```text
驱动方是 Node 应用？        → SDK
否则目标语言能起子进程吗？   → RPC
只想要结构化输出做后处理？   → JSON 或打印模式
```

打印模式有个容易忽略的能力：**它也会读管道 stdin 并合并进首个 prompt**。

```bash
cat README.md | pi -p "Summarize this text"
```

常用的命令行参数：

```bash
# 只读模式审查代码：不给 write/edit，杜绝改动
pi --tools read,grep,find,ls -p "Review the code"

# 模型带 provider 前缀，不用再写 --provider
pi --model openai/gpt-4o "Help me refactor"
pi --model sonnet:high "Solve this complex problem"    # 带思考等级简写

# 精确加载：忽略所有扩展发现，只加载指定的一个
pi --no-extensions -e ./my-ext.ts

# 会话
pi -c                  # 继续最近会话
pi -r                  # 浏览并选择历史会话
pi --session <path|id> # 指定会话
pi --no-session        # 临时模式，不保存

# @ 引用文件
pi @code.ts @test.ts "Review these files"
```

内置工具名：`read`、`bash`、`powershell`（Windows）、`edit`、`write`、`grep`、`find`、`ls`。注意 `--tools` 白名单是**跨内置、扩展、自定义工具**统一生效的；要「禁内置但保留扩展工具」得用 `--no-builtin-tools`。

## 交互模式

界面自上而下四个区：

| 区域 | 内容 |
| --- | --- |
| 启动头 | 快捷键提示、已加载的 AGENTS.md、prompt 模板、skills、扩展 |
| 消息区 | 消息、助手回复、工具调用与结果、通知、错误、扩展 UI |
| 编辑器 | 输入区；边框颜色表示思考等级，边框本身是流式工作指示器 |
| 页脚 | 工作目录、会话名、token/缓存用量、花费、上下文占用、当前模型 |

页脚的 token 指标：`↑` 输入、`↓` 输出、`R` 缓存读、`W` 缓存写、`CH` 最近缓存命中率。这几个数字直接影响成本——命中率高时同样的上下文花费会低很多。

### 编辑器

| 功能 | 操作 |
| --- | --- |
| 引用文件 | 输入 `@` 模糊搜索 |
| 路径补全 | `Tab` |
| 多行输入 | `Shift+Enter`（Windows Terminal 用 `Ctrl+Enter`） |
| 外部编辑器 | `Ctrl+G`，按 `externalEditor` → `$VISUAL` → `$EDITOR` → 平台默认 |
| 粘贴 | `Ctrl+V` 贴图或文本（Windows 用 `Alt+V`），或把图片拖进终端 |
| 执行 shell | `!command` 执行并把输出发给模型；`!!command` 执行但不发 |

`!` 与 `!!` 的区别很实用：想「我查一下但不想污染上下文」就用 `!!`。

### 斜杠命令

| 命令 | 作用 |
| --- | --- |
| `/login`、`/logout` | 管理 provider 凭据 |
| `/model`、`/thinking` | 切换模型 / 思考等级（选择器内 `Ctrl+S` 存为启动默认） |
| `/scoped-models` | 启停参与 `Ctrl+P` 循环的模型 |
| `/settings` | 主题、消息投递、传输层等 |
| `/new`、`/resume`、`/name`、`/session` | 会话管理 |
| `/tree`、`/fork`、`/clone` | 分支操作（见下一节） |
| `/compact [prompt]` | 手动压缩上下文 |
| `/export`、`/import`、`/share` | 导出 / 导入 / 上传 gist |
| `/trust` | 保存项目信任决策（需重启生效） |
| `/reload` | 重载快捷键、扩展、skills、prompts、主题、上下文文件 |
| `/hotkeys`、`/changelog`、`/quit` | 快捷键、版本历史、退出 |

`/reload` 是扩展开发时的关键命令——改完扩展不用重启进程。

### 快捷键

| 按键 | 作用 |
| --- | --- |
| `Ctrl+C` / 两次 | 清空编辑器 / 退出 |
| `Escape` / 两次 | 取消中止 / 打开 `/tree` |
| `Ctrl+L` | 模型选择器 |
| `Ctrl+P` / `Shift+Ctrl+P` | 前后循环已 scoped 的模型 |
| `Shift+Tab` | 循环思考等级 |
| `Ctrl+O` / `Ctrl+T` | 折叠展开工具输出 / 思考块 |
| `Ctrl+X` | 复制最后一条助手消息；关闭 copy-on-select 时复制选中文本 |

自定义快捷键写在 `~/.pi/agent/keybindings.json`。

### 消息队列

Agent 工作时你依然可以提交消息，两种语义：

| 按键 | 语义 | 投递时机 |
| --- | --- | --- |
| `Enter` | **steering**（插队） | 当前助手轮次执行完那批工具调用后 |
| `Alt+Enter` | **follow-up**（等完） | agent 全部工作完成后 |

`Escape` 中止并把排队消息还原到编辑器，`Alt+Up` 把排队消息取回。

投递方式可在 settings 里配：`steeringMode` / `followUpMode` 取 `"one-at-a-time"`（默认）或 `"all"`；`transport` 选 provider 传输偏好（`"sse"` / `"websocket"` / `"auto"`）。

> **平台坑**：Windows Terminal 下 `Alt+Enter` 默认是全屏切换，需要按 `docs/terminal-setup.md` 重映射，否则 Pi 收不到 follow-up 快捷键。

### 什么时候用 steering，什么时候用 Escape

模型正在跑长任务，你已经发现方向不对：

```text
不要按 Escape 直接打断 —— 那会丢掉它已经建立的理解。
按 Enter 发一条 steering 消息：「先别改配置文件，我们只讨论方案」，
它会在当前工具批次结束后收到，并调整方向。
```

差别不是「快慢」，而是**在哪个边界被处理**。选错会导致模型在错误的时机收到指令。

## 会话：树、分支与压缩

Pi 的会话存成 JSONL，而且结构是**树**：每条记录带 `id` 和 `parentId`。

这个数据结构选择直接决定交互体验。多数 AI 工具的会话是线性的，想改方向只能新开会话从头说；Pi 可以**原地跳回任意历史节点继续**，所有分支仍在同一个文件里。

好处是把「走错方向」的成本从「重讲一遍」降到「跳回去」。代价是单文件持续增长。

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。

### 四个分支入口

| 入口 | 作用域 | 是否产生新文件 | 场景 |
| --- | --- | --- | --- |
| `/tree` | 当前会话任意节点，原地 | 否 | 走错路了，回退到某点重来 |
| `/fork` | 某条**用户消息**（prompt 会放进编辑器供改） | 是 | 把某个起点单独立成会话 |
| `/clone` | 当前**活跃分支**当前位置 | 是 | 保留分支现状再另开一条探索 |
| `--fork <path\|id>` | 命令行指定会话 | 是 | 从 CLI 角度派生会话 |

`/tree` 的操作细节：输入字符即搜索；`Ctrl+←/→` 或 `Alt+←/→` 在分支间跳转；`←/→` 翻页；`Ctrl+O` 循环过滤模式（默认 → 无工具 → 仅用户消息 → 仅带标签 → 全部）；`Ctrl+X` 复制选中消息；`Shift+L` 打标签当书签，`Shift+T` 切换标签时间戳。

### 压缩

上下文窗口有限，长会话必然撞墙。Pi 用**摘要替换早期消息**、保留近期消息。

| 方式 | 说明 |
| --- | --- |
| 手动 | `/compact` 或 `/compact <自定义指令>` |
| 自动（溢出恢复） | 撞上限时触发，压缩后重试 |
| 自动（主动） | 接近上限时提前压缩 |

**压缩是有损的。** 细节会丢，但完整历史仍在 JSONL 里，用 `/tree` 可以回看。给 `/compact` 传自定义指令可以指定保留重点，例如 `/compact 保留数据库 schema 和失败过的方案`。

机制上有几个决策点：在哪条消息处分界（切割点规则），以及不能把一次工具调用和它的结果切散。压缩本身也是一次模型调用，会消耗 token 与花费。

### 分支摘要

从树的旧节点继续时，那条分支之后的历史不在当前上下文里。Pi 用**分支摘要**把「那条分支上发生了什么」压缩注入，避免完全丢失上下文，并做累计文件追踪。

摘要结构通常含：目标、约束与偏好、进度（已完成 / 进行中 / 阻塞）。

压缩与摘要逻辑都可以通过扩展改写——这是「不内置策略、把策略交给扩展」的又一例证。

### 怎么选

```text
想改某个决策方向            → /tree 跳回去
上下文长但早期细节不再需要  → /compact
上下文长且还需要完整推理链  → /fork 或新开会话
```

> **易错**：把 `/compact` 当成无损总结，压缩后继续追问细节。被摘要掉的细节不在上下文里了，需要细节应该用 `/tree` 回到原始消息。

## 上下文注入

上下文文件解决的是**重复交代**问题：与其每次对话都说明「我们用什么包管理器、测试怎么跑、哪些目录别动」，不如让 Pi 每次启动自动加载。

### 加载顺序与合并语义

Pi 启动时从以下位置查找 `AGENTS.md`（或 `CLAUDE.md`）：

1. `~/.pi/agent/AGENTS.md`（全局）
2. 从当前工作目录逐级向上到根，各级目录下的
3. 当前目录

**所有匹配的文件会拼接，不是覆盖。** 唯一例外：某目录存在 `AGENTS.override.md` 时，Pi 用它替代**该目录**的 `AGENTS.md`/`CLAUDE.md`，其他目录照常拼接。

这个设计解决的是「不同粒度的规则共存」：

```text
~/.pi/agent/AGENTS.md          个人偏好：回复用中文、提交前先跑 lint
repo-a/AGENTS.md               仓库 A：Node + pnpm，测试用 vitest
repo-a/packages/db/AGENTS.md   子模块：改 schema 必须附迁移脚本
```

在 `repo-a` 根目录起 Pi，模型同时看到三级；进 `packages/db` 起 Pi，也是三级。关闭加载用 `--no-context-files` / `-nc`。

### 一份 AGENTS.md 该写什么

按「每次都需要」原则筛选，通常四块：

```markdown
## 命令
- 安装依赖：`npm install`
- 构建：`npm run build`（含类型检查，没有单独的 typecheck 脚本）
- 测试：`npm test`

## 项目结构
- `src/` 源码、`scripts/` 脚本、`tests/` 测试

## 约定
- 提交信息用中文，格式 `类型: 描述`
- 修改公共接口必须同步更新类型定义

## 注意事项
- 不要直接改 `dist/`，它是构建产物
- `config.json` 里的超时值是线上调优结果，不要为了本地方便调小
```

反例（不该写进来）：一次性讨论的结论、大段日志与报错栈、详细业务背景。判据是「这条信息是不是每次任务都需要」。写太多会挤占上下文预算，还会稀释重点。详细的背景应该放单独文档，由 `AGENTS.md` 里一个链接指向它。

### 系统提示

| 文件 | 行为 |
| --- | --- |
| `.pi/SYSTEM.md` 或 `~/.pi/agent/SYSTEM.md` | **替换**默认系统提示 |
| `APPEND_SYSTEM.md` | 在系统提示后**追加** |

命令行对应 `--system-prompt`（替换）与 `--append-system-prompt`（追加）。

> **替换是危险操作。** 默认系统提示里包含 Pi 对工具用法、行为规范、安全约束的说明。整体替换掉，模型可能不知道有哪些工具、该怎么调用。绝大多数场景应该用追加。

## 三种扩展层次

从轻到重：

| 层次 | 形态 | 执行主体 | 能否强制 | 安全影响 |
| --- | --- | --- | --- | --- |
| Prompt 模板 | Markdown，`/名称` 展开 | 模型 | 否 | 低 |
| Skill | 带 frontmatter 的 `SKILL.md` | 模型 | 否 | 中（可指示模型执行命令） |
| Extension | TypeScript 模块 | Pi 运行时 | **是** | 高（任意代码执行） |
| Pi 包 | 上面几者的分发单元 | — | — | 取决于包含什么 |

**选型判据只有一句话**：如果模型这次没照做，是不是严重问题？

- 只是效率低 → Skill 就够。
- 会造成破坏 → 必须用 Extension。

这条界线是安全的基石，因为它区分了「建议」和「保证」。安全规则如果只落在 Skill 或 `AGENTS.md` 里，是**不保证生效**的。

Prompt 模板与 Skill 的区别在调用方式：模板需要你显式 `/名称` 调用；Skill 可以被 agent 按 description 自动加载。所以「我总会主动喊它」用模板，「希望它在相关任务里自动生效」用 Skill。

## Skills

Skill 遵循 [Agent Skills 标准](https://agentskills.io)，本质是**一段可以被按需注入上下文的文本**——通常是某类任务的操作流程，或某个领域的知识。

### 位置与调用

| 位置 | 作用域 |
| --- | --- |
| `~/.pi/agent/skills/` | 全局 |
| `~/.agents/skills/` | 全局（跨工具共享目录） |
| `.pi/skills/` | 项目 |
| `.agents/skills/` | 项目（会从 cwd 向上逐级查找祖先目录） |

关闭发现用 `--no-skills`，显式加载用 `--skill <path>`（可重复）。同名冲突时保留先找到的。

调用两种方式并存：`/skill:name` 显式调用，或让 agent 根据 description 自动加载。

### 写法

```markdown
---
name: pdf-processing
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents.
---

# PDF Processing

## Setup

Install dependencies:

```bash
npm install pdf-lib
```

## Usage

Extract text from a single file...
```

frontmatter 字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | ≤64 字符，只能小写字母、数字、连字符；不能以连字符开头/结尾，不能有连续连字符 |
| `description` | 是 | ≤1024 字符，说明「做什么」和「何时用」 |
| `license` / `compatibility` / `metadata` | 否 | 许可证 / 环境要求 / 任意键值 |
| `allowed-tools` | 否 | 空格分隔的预批准工具列表（实验性） |
| `disable-model-invocation` | 否 | 设 `true` 从系统提示隐藏，只能 `/skill:name` 调用 |

合法 name：`pdf-processing`、`data-analysis`、`code-review`。非法：`PDF-Processing`、`-pdf`、`pdf--processing`。

Pi 不要求 name 与父目录同名——官方认为标准里的这条要求对「多工具共享的 skill 目录」不合理。

### description 比正文更重要

description 决定 agent 何时加载这个 skill，所以要具体：

```yaml
# 好：说了能做什么 + 何时用
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents.

# 差：既没说能力也没说时机
description: Helps with PDFs.
```

### 校验

多数问题只产生警告但仍加载：name 超长或含非法字符、name 首尾有连字符或有连续连字符、description 超 1024 字符。

以下情况**不会加载**：声明为 skill 但缺 description；`SKILL.md` 格式错误。其他不带合法 skill frontmatter 的 Markdown 会被忽略。

> **易错**：把 Skill 当「可以强制执行的安全规则」。它是给模型看的**文本建议**，模型可以不遵守。安全相关的规则不要只写在 Skill 里。

## Extensions

Extension 是 Pi 最深的一层扩展点，也是它区别于其他 harness 的核心。

多数工具的可扩展性是「提供若干插件槽」——你只能在厂商预留的位置插东西。Pi 的做法是**把内部事件暴露出来**：从项目信任判定、会话启停、输入处理、每个 turn、每次工具调用，一直到进程退出，都有对应事件。扩展可以监听、修改、甚至取消这些环节。

这就是官方敢不做子 Agent 和 plan mode 的原因：它们本质都是「在特定事件上做特定处理」。

### 最小示例

`~/.pi/agent/extensions/my-extension.ts`：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // 监听事件
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Extension loaded!", "info");
  });

  // 拦截危险工具调用
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });

  // 注册自定义工具
  pi.registerTool({
    name: "greet",
    label: "Greet",
    description: "Greet someone by name",
    parameters: Type.Object({
      name: Type.String({ description: "Name to greet" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: {},
      };
    },
  });

  // 注册自定义命令
  pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello ${args || "world"}!`, "info");
    },
  });
}
```

用 `-e` 测试，不必安装：

```bash
pi -e ./my-extension.ts
```

default export 也可以是 `async`。Pi 会等异步工厂完成才继续启动，这适合做一次性初始化，比如先拉远程模型列表再 `pi.registerProvider()`。

### 位置

| 位置 | 作用域 |
| --- | --- |
| `~/.pi/agent/extensions/*.ts` | 全局 |
| `~/.pi/agent/extensions/*/index.ts` | 全局（子目录形式） |
| `.pi/extensions/*.ts` | 项目 |
| `.pi/extensions/*/index.ts` | 项目（子目录形式） |

项目下的 `.pi/extensions` **只在项目被信任后才加载**。也可以在 `settings.json` 里追加路径或包：

```json
{
  "packages": ["npm:@foo/bar@1.0.0", "git:github.com/user/repo@v1"],
  "extensions": ["/path/to/local/extension.ts", "/path/to/extension/dir"]
}
```

### 事件生命周期

```text
pi 启动
  ├─► project_trust          （仅用户/全局与 CLI 扩展参与，早于项目资源加载）
  ├─► session_start { reason: "startup" }
  └─► resources_discover { reason: "startup" }

用户发消息
  ├─► （先查扩展命令，命中则短路）
  ├─► input                  （可拦截、改写、直接处理）
  ├─► （未处理则做 skill / 模板展开）
  ├─► before_agent_start     （可注入消息、改系统提示）
  ├─► agent_start
  ├─► message_start / message_update / message_end
  │
  │   ┌─── turn（模型调用工具时循环）───┐
  │   ├─► turn_start
  │   ├─► context                    （可修改消息）
  │   ├─► before_provider_headers    （可改 header）
  │   ├─► before_provider_request    （可查看/替换 payload）
  │   ├─► after_provider_response    （状态码 + header，流消费前）
  │   │
  │   │   模型响应，可能调用工具：
  │   │     ├─► tool_execution_start
  │   │     ├─► tool_call            （可 block）
  │   │     ├─► tool_execution_update
  │   │     ├─► tool_result          （可修改）
  │   │     └─► tool_execution_end
  │   │
  │   └─► turn_end
  │
  ├─► agent_end
  └─► agent_settled           （无重试/压缩/follow-up 残留）
```

会话操作相关：

| 操作 | 事件序列 |
| --- | --- |
| `/new` 或 `/resume` | `session_before_switch`（可取消）→ `session_shutdown` → `session_start` → `resources_discover` |
| `/fork` 或 `/clone` | `session_before_fork`（可取消）→ `session_shutdown` → `session_start` → `resources_discover` |
| `/name` | `session_info_changed` |
| `/compact` 或自动压缩 | `session_before_compact`（可取消或定制）→ `session_compact` / `session_compact_failed` |
| `/tree` 导航 | `session_before_tree`（可取消或定制）→ `session_tree` |
| `/model` 或 Ctrl+P | `thinking_level_select`（若思考等级受影响）→ `model_select` |
| 退出 | `session_shutdown` |

反过来查更实用——**想做某件事该挂哪个事件**：

| 想做的事 | 事件 |
| --- | --- |
| 禁止改某些文件 | `tool_call` + block |
| 危险命令前确认 | `tool_call` |
| 会话开始注入环境信息 | `session_start` |
| 改写用户输入 | `input` |
| 动态修改系统提示 | `before_agent_start` |
| 工具输出脱敏/截断 | `tool_result` |
| 换压缩策略 | `session_before_compact` |
| 统计 token 与花费 | `turn_end` / `agent_settled` |
| 转发到自建网关 | `before_provider_request` / `before_provider_headers` |
| 防止切走未保存会话 | `session_before_switch` |

### 能力边界

扩展能做的事情（官方列举）：自定义工具**或整体替换内置工具**、子 Agent 和 plan mode、自定义压缩与摘要、权限门与路径保护、自定义编辑器与 UI 组件、状态行与页头页脚、Git checkpoint 与自动提交、SSH 与沙箱执行、MCP server 集成、把 pi 伪装成 Claude Code、等待时的消遣（Doom 确实能跑）。

这张清单本身就是论据：这些能力里**没有一项是「厂商赏赐的插件位」**，它们都是在通用事件上实现的。

### ExtensionContext

| 成员 | 作用 |
| --- | --- |
| `ctx.ui` | UI 助手：`notify`、`confirm`、`input`、`select` |
| `ctx.mode` / `ctx.hasUI` | 当前运行模式 / 是否有 UI |
| `ctx.cwd` | 工作目录 |
| `ctx.isProjectTrusted()` | 项目是否已信任 |
| `ctx.sessionManager` | 会话读写 |
| `ctx.modelRegistry` / `ctx.model` / `ctx.thinkingLevel` / `ctx.scopedModels` | 模型与推理等级 |
| `ctx.signal` | 中止信号 |
| `ctx.isIdle()` / `ctx.abort()` / `ctx.hasPendingMessages()` | 运行状态 |
| `ctx.shutdown()` | 请求关闭 |
| `ctx.getContextUsage()` / `ctx.compact()` | 上下文占用 / 触发压缩 |
| `ctx.getSystemPrompt()` | 读取当前系统提示 |

命令上下文另有：`getSystemPromptOptions()`、`waitForIdle()`、`newSession()`、`fork()`、`navigateTree()`、`switchSession()`。

> **`ctx.hasUI` 必须检查。** 在 `-p` / `--mode json` / `--mode rpc` 下没有 UI，`ctx.ui.confirm` 之类的调用会失败或挂住，把自动化流水线卡死。安全相关的扩展在无 UI 时应**默认拒绝**，而不是默认放行——否则最需要它的场景反而失效。

### 一个完整的例子

团队规范要求「不允许直接改受保护路径」：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROTECTED = ["src/core/", "package.json"];

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    const writeTools = ["write", "edit"];
    if (!writeTools.includes(event.toolName)) return;

    const path: string | undefined = event.input.path;
    if (!path) return;
    if (!PROTECTED.some((p) => path.includes(p))) return;

    // 无 UI 时默认拒绝，而不是静默放行
    if (!ctx.hasUI) {
      return { block: true, reason: `受保护路径需要人工确认：${path}` };
    }
    const ok = await ctx.ui.confirm("受保护路径", `确认修改 ${path}？`);
    if (!ok) return { block: true, reason: "用户拒绝" };
  });
}
```

为什么必须是 Extension：写在 `AGENTS.md` 里只是建议，模型可能忘；挂在 `tool_call` 上 `block` 才是强制。

扩展如果需要持有资源（连接、定时器、子进程），要在 `session_shutdown` 时清理，否则会泄漏。

## Pi 包

Pi 包把扩展、技能、Prompt 模板、主题打包，用 npm 或 git 分发。

```bash
pi install npm:@foo/pi-tools
pi install npm:@foo/pi-tools@1.2.3        # 固定版本
pi install git:github.com/user/repo@v1    # 标签或提交
pi install https://github.com/user/repo@v1
pi install ssh://git@github.com/user/repo@v1

pi remove npm:@foo/pi-tools
pi list
pi config                                 # 启停包内资源

pi update --extensions                    # 只更新包
pi update --all                           # 更新 pi 和包
```

加 `-l` 做项目本地安装（装到 `.pi/git/`、`.pi/npm/`），否则装到 `~/.pi/agent/git/` 或 `~/.pi/agent/npm/`。

声明方式：在 `package.json` 加 `pi` 字段，或用约定目录自动发现（`extensions/`、`skills/`、`prompts/`、`themes/`）。

```json
{
  "name": "my-pi-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

> **版本固定的一个坑**：git 的 `@ref` 是固定标签或提交，被固定的包会被 `pi update --extensions` 和 `pi update --all` **跳过**。想把已有包挪到新版本，要重新 `pi install git:host/user/repo@new-ref`。这对团队是好事（不会被静默升级），但意味着必须建立主动升级流程，否则安全修复也拿不到。

> **依赖的一个坑**：git 包默认用 `npm install --omit=dev` 装依赖，所以**运行时要用的依赖必须放 `dependencies`**。配了 `npmCommand` 时 git 包会改用普通 `install`。用 Node 版本管理器时可以设置 `npmCommand` 让包安装复用稳定环境：`["mise", "exec", "node@20", "--", "npm"]`。

### 安全

官方给了一行明确警告：**Pi 包以完整系统权限运行**。

| 包内资源 | 风险 |
| --- | --- |
| Extension | 任意代码执行，可读环境变量里的 API Key、SSH 私钥、任意可写文件 |
| Skill | 文本，但可指示模型执行命令 → 间接 prompt injection |
| Prompt 模板 | 内容进上下文，风险较低但可被用于诱导 |
| 依赖树 | `npm install` 会拉整棵依赖，攻击面不止包本身 |

管理措施：只装可信来源；不可信的先用 `pi install -l` 装到项目沙箱审查源码；固定版本；用 `pi config` 关掉不需要的资源；容器里跑。

## 模型与 Provider

模型目录是**动态的**：Pi 为每个内置 provider 维护一份「支持工具调用的模型」清单，会自动刷新，`pi update --models` 可强制刷新。这解决了「新模型发布但工具没更新」的问题。

| 操作 | 方式 |
| --- | --- |
| 切换模型 | `/model` 或 `Ctrl+L` |
| 存为启动默认 | 选择器里按 `Ctrl+S` |
| 限制循环范围 | `--models "claude-*,gpt-4o"` |
| 启停参与循环的模型 | `/scoped-models` |
| 列出可用模型 | `--list-models [search]` |

思考等级：`off` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`。命令行 `--thinking <level>`，交互 `/thinking`，`Shift+Tab` 循环。

> **易错**：以为 `--thinking high` 是全局持久设置。它是本次运行的参数；而且换到不支持高档位的模型时**等级会被重新钳制**——这解释了一个常见困惑：「我明明设了 high，换模型后变低了」。

### 自定义 provider

两条路径，门槛差别很大：

| 情况 | 做法 | 位置 |
| --- | --- | --- |
| 协议兼容（OpenAI / Anthropic / Google 风格） | 加 provider 与模型条目 | `~/.pi/agent/models.json` |
| 自定义协议或需要 OAuth | 写扩展调 `pi.registerProvider()` | 扩展 |

```json
// ~/.pi/agent/models.json
{
  "providers": {
    "corp-gateway": {
      "type": "openai",
      "baseUrl": "https://llm.corp.internal/v1",
      "apiKey": "$CORP_LLM_KEY"
    }
  }
}
```

接自建网关时**先判断协议兼容性**——兼容就改 JSON（分钟级），不兼容或要走 OAuth 才写扩展（天级）。

需要联网拉模型列表时，扩展的 default export 必须用 `async`：Pi 会等异步工厂完成再继续启动，这样 `registerProvider` 时才能拿到完整列表（否则 `/model` 选择器里是空的）。

`PI_CACHE_RETENTION=long` 可开启更长的 prompt 缓存（Anthropic 1 小时、OpenAI 24 小时），适合「同一项目反复起会话」的工作方式。

## 安全边界

这是最容易产生误解的一节。先把最关键的一句记住：

> **项目信任（project trust）不是沙箱，它不限制你开始工作后模型能要求工具做什么。**

它只是**输入加载守卫**：防止一个仓库在你批准之前，就通过 `.pi/settings.json`、项目扩展等静默改变 Pi 的行为。批准之后，模型和扩展能做的事与信任与否无关——都受你的用户权限约束。

### 触发判定的资源

Pi 认为项目含有「需要信任的资源」，是指从当前工作目录能找到以下任意一项：

- `.pi/settings.json`
- `.pi/extensions`、`.pi/skills`、`.pi/prompts`、`.pi/themes`
- `.pi/SYSTEM.md` 或 `.pi/APPEND_SYSTEM.md`
- 当前目录或任一祖先目录下的 `.agents/skills`

**空的 `.pi` 目录不算。**

信任允许加载：项目 `settings.json`、项目 `.pi` 资源、通过项目设置配置的缺失项目包、项目本地扩展与项目包扩展。不信任则跳过这些。

**但上下文文件是例外**：`AGENTS.override.md`、`AGENTS.md`、`CLAUDE.md` **无论信任与否都会加载**（除非 `-nc`）。这点容易被忽略——它们能影响模型行为，却不在信任门的保护范围内。

决策保存在 `~/.pi/agent/trust.json`，按规范化目录记录，查找时优先用当前或父路径上最近的决策。交互里 `/trust` 可保存决策，但它**只写文件，当前会话不会重载**，要重启 Pi。

### 判定之前的加载顺序

信任决策做出之前，Pi 只加载上下文文件、用户/全局扩展、CLI 通过 `-e` 传入的扩展。这样设计是为了让这几类扩展有机会处理 `project_trust` 事件（比如企业全局扩展可以统一决策）。第一个返回确定决策的扩展拥有决策权。

### 非交互模式的差异

`-p`、`--mode json`、`--mode rpc` **不弹信任提示**。无保存决策时按 `defaultProjectTrust` 处理：

| 取值 | 行为 |
| --- | --- |
| `"ask"`（默认） | **忽略**这些项目资源 |
| `"never"` | 忽略 |
| `"always"` | 信任 |

注意 `"ask"` 在无交互时退化成「忽略」而不是「询问」——这是 CI 里「配置看起来没生效」的常见原因。单次覆盖用 `--approve` / `-a` 或 `--no-approve` / `-na`。`pi update` 从不提示。

### 没有内置沙箱意味着什么

官方文档把边界说得很直白：**Pi 以启动它的用户账号权限运行，并把这个用户可写的文件视为同一个本地信任边界。**

具体表现：内置工具能读、写、改文件、跑 shell 命令，权限就是 Pi 进程的权限；扩展以同样权限运行；包安装、shell 命令、语言服务器、测试命令都是普通本地进程。

这是**有意为之**。官方理由是：一个部分实现的进程内沙箱容易被误解为安全边界，但它实际上仍然依赖宿主 shell、文件系统、包管理器和凭据。**真正的隔离必须来自操作系统或虚拟化层。**

所以项目信任能防什么、不能防什么：

**能防**：仓库在你批准前静默改变 Pi 的行为。

**不能防**：不受信任的代码、prompt、模型输出。特别是 **prompt injection**——官方明确说这是「本地 agent 的预期风险，无法被 Pi 可靠阻止」。注入载体包括仓库文件、注释、文档、上下文文件、构建产物，而这些正是 agent 必须读的东西，过滤等于不工作。

### 三层手段各管什么

| 需求 | 正确做法 |
| --- | --- |
| 防止仓库静默改我的 Pi 配置 | 项目信任（Pi 提供） |
| 限制模型能改哪些文件 | 扩展拦截 `tool_call` |
| 完全隔离不受信代码 | 容器 / 虚拟机（OS 层） |

把这三层的职责搞混是安全设计里最常见的错误。

```text
场景：要在一个陌生开源仓库上让 Pi 跑一阵子。

不要直接在宿主机上跑，即使你「信任」了这个项目。
原因：项目信任只保证它不能偷偷改你的 Pi 配置；
      批准之后，模型仍可以按你的权限读写文件、跑命令。
      而仓库里的 README、注释、测试数据都可能是 prompt injection 的载体。

正确做法：在容器里跑，只挂载目标仓库，不放任何凭据。
```

容器化的实际收益：文件系统隔离、凭据隔离、网络出口限制、可丢弃（跑完就删）。代价是工具链、语言服务器、依赖缓存都要在容器里重新准备。

## 程序化集成

三种方式共享同一套会话与工具机制。

### SDK

```typescript
import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

await session.prompt("What files are in the current directory?");
```

`ModelRuntime.create()` 是异步的；`SessionManager.inMemory()` 表示会话不落盘，适合一次性任务或测试。需要多会话运行时替换时用 `createAgentSessionRuntime()` 与 `AgentSessionRuntime`。

优势是**进程内**：可以直接拿到会话对象、订阅事件、注入自定义工具，没有序列化损失。

### RPC

```bash
pi --mode rpc
```

通过 stdin/stdout 交换 JSONL。

> **一个必须知道的分帧细节**：RPC 使用严格的 **LF 分隔** JSONL 分帧。客户端必须**只**按 `\n` 切分记录，不要用 Node `readline`、Python `for line in stdout` 这类通用行读取器——它们也会在 JSON 载荷内部的 Unicode 分隔符（`\u2028` 行分隔符、`\u2029` 段分隔符）处切分，于是**一条完整记录被切成两条**，解析直接失败。

正确做法是手动按单字节 `\n` 扫描缓冲区。这个坑很典型：**协议分帧不能依赖运行时提供的「行」抽象**，因为「行」的定义在不同层不一致。

### JSON 事件流

```bash
pi --mode json
```

输出所有事件为 JSON 行，适合日志采集、成本统计、接进可观测体系、离线分析一次运行的过程。与 RPC 的区别：JSON 模式是**单向输出**，RPC 是**双向协议**（可持续交互、切换会话、响应 UI 请求）。

### 环境变量

Pi 会给自己设置两个标识变量，供子进程识别自己在 Pi 里运行：

| 变量 | 值 |
| --- | --- |
| `AI_AGENT` | `pi` |
| `PI_CODING_AGENT` | `true` |

工具执行时还会注入会话元数据：`PI_SESSION_ID`、`PI_SESSION_FILE`（临时会话为空）、`PI_PROVIDER`、`PI_MODEL`、`PI_REASONING_LEVEL`。它们是**每条命令启动时解析**的，所以模型中途换模型后，后续命令看到的是新值。

## 团队落地

按四层递进，每层解决不同问题：

```text
第 1 层  上下文      AGENTS.md
  全局 ~/.pi/agent/AGENTS.md   个人偏好
  仓库根 AGENTS.md              团队规范
  子包 AGENTS.md                模块约定
  → 三层拼接生效（Pi 的上下文文件是多层级拼接而非覆盖）

第 2 层  流程固化    Skill
  把「发布前检查」「新增 API 的步骤」这类流程写成 skill
  为什么不用 AGENTS.md：这些流程不是每次任务都需要，写进上下文会常驻占用预算

第 3 层  强制约束    Extension
  禁止修改受保护路径、禁止高危命令、schema 改动必须带迁移
  为什么必须用 Extension：前两层都是建议，模型可以不遵守
  必须处理 ctx.hasUI 为假的情况

第 4 层  集成治理
  Pi 包分发上述资源，固定版本，pi config 控制加载
  容器化运行，只在需要时挂载凭据
```

**第 3 层的验收方式很关键**：要做对照实验——把拦截逻辑临时移除，确认违规操作会成功。否则无法区分「扩展生效了」和「模型恰好自己没做」，你的扩展可能是无效代码。

审计清单应该覆盖：Pi 版本固定策略、第三方包准入与版本固定、可访问目录与凭据范围、出网限制、失败与回滚路径、遥测与离线模式设置。

什么场景不该用 Pi：团队只想开箱即用、不要自建；无法提供隔离环境；需要强合规审计但团队无 DevOps 能力；对模型能力有强绑定需求（频繁换 provider 时提示工程积累无法复用）。这些是**适配条件**，不是缺陷。

## 附录：速查表

### 环境变量

| 变量 | 作用 |
| --- | --- |
| `PI_CODING_AGENT_DIR` | 覆盖配置目录（默认 `~/.pi/agent`） |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话目录（被 `--session-dir` 覆盖） |
| `PI_OFFLINE` | 关闭所有启动期网络操作 |
| `PI_SKIP_VERSION_CHECK` | 只跳过版本更新检查 |
| `PI_TELEMETRY` | 控制安装/更新遥测与 provider 归因头 |
| `PI_CACHE_RETENTION` | `long` 开启长缓存 |
| `PI_PACKAGE_DIR` | 覆盖包目录（Nix/Guix 场景） |
| `VISUAL` / `EDITOR` | Ctrl+G 外部编辑器兜底 |

### 容易踩的坑

| 坑 | 正确理解 |
| --- | --- |
| 以为项目信任是沙箱 | 它只是输入加载守卫，不限制模型行为 |
| 以为 `--approve` 放宽模型权限 | 它只控制是否信任项目本地资源 |
| 在 `AGENTS.md` 里写「必须」的规则 | 那是建议；必须用 Extension 强制 |
| 扩展没检查 `ctx.hasUI` | 非交互模式下会挂住或静默放行 |
| 以为 `/compact` 无损 | 有损；需要细节用 `/tree` 回看原始消息 |
| 用 `SYSTEM.md` 替换系统提示 | 会丢掉工具用法与安全说明；优先 `APPEND_SYSTEM.md` |
| 用 `readline` 实现 RPC 客户端 | 会在 `\u2028`/`\u2029` 处错误切分 |
| 期待 `pi update --all` 升级固定版本的包 | 被 `@ref` 固定的包会被跳过 |
| 以为 `--thinking high` 全局持久 | 是本次运行参数，且换模型时可能被钳制 |
| 改完扩展后重启 Pi | 用 `/reload` 即可 |

### 参考

- 官网：https://pi.dev
- npm：https://www.npmjs.com/package/@earendil-works/pi-coding-agent
- 设计理念（为什么没有 MCP / 子 Agent / plan mode）：https://mariozechner.at/posts/2025-11-30-pi-coding-agent/
- MCP 取舍的完整论证：https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/
