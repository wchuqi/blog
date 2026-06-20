---
title: "Golang 学习资料：Golang 完整知识点清单"
date: 2026-06-20
description: "Go 版本、发布策略、向后兼容承诺。"
tags:
  - "开发语言"
  - "Golang"
  - "知识清单"
category: "开发语言"
---

# Golang 学习资料：Golang 完整知识点清单

[返回索引](../Golang学习资料.md)

## 1. 基础和术语

- Go 版本、发布策略、向后兼容承诺。
- package、module、workspace、import path、module path。
- 标识符导出规则、注释文档、`go doc`。
- 零值、nil、常量、iota、类型转换、短变量声明。

## 2. 语言核心

- 基础类型、命名类型、类型别名。
- 数组、切片、map、字符串、rune、byte。
- 函数、多返回值、闭包、defer。
- 指针、方法、方法集、值接收者和指针接收者。
- 结构体、嵌入字段、组合。
- 接口、空接口、any、类型断言、类型 switch、接口 nil。
- 错误处理、错误包装、panic、recover。
- 泛型、类型参数、约束、类型集合、comparable。

## 3. 工具链和依赖

- `go run`、`go build`、`go test`、`go fmt`、`go vet`、`go env`。
- `go mod init`、`go mod tidy`、`go get`、`go list`、`go mod why`、`go mod graph`。
- MVS 依赖选择、语义化导入版本、`replace`、`exclude`、私有模块。
- `go.work` 工作区、多模块仓库、构建标签、交叉编译。

## 4. 并发和运行时

- goroutine 生命周期、栈增长、泄漏。
- channel 缓冲、关闭、select、公平性和超时。
- context 取消、截止时间和值传递边界。
- sync 包：Mutex、RWMutex、WaitGroup、Once、Cond、Pool、Map。
- atomic、数据竞争、race detector。
- G/M/P 调度器、网络轮询、系统调用、抢占。
- Go 内存模型、happens-before、可见性。
- runtime 启动流程、主 goroutine、`main.main` 返回后的进程退出语义。
- 本地运行队列、全局运行队列、work stealing、异步抢占、阻塞 syscall 的 P 移交。
- netpoller、非阻塞 socket、fd 资源、慢连接与超时治理。
- goroutine profile、block profile、mutex profile、trace 中的阻塞状态解释。

## 5. 内存、GC 和性能

- 栈和堆、逃逸分析、对象分配、内联。
- GC 三色标记、写屏障、GOGC、GOMEMLIMIT。
- pprof CPU、heap、goroutine、mutex、block profile。
- trace、benchmark、allocs/op、锁竞争、系统调用。
- slice 预分配、对象复用、sync.Pool 边界、JSON 性能。
- 结构体字段对齐、padding、指针字段扫描成本、对象数量与 GC 压力。
- slice header、map bucket/overflow、string 不可变字节序列、interface 动态类型和值。
- heap inuse、heap alloc、heap objects、RSS、container working set 的口径差异。
- CPU 热点、内存增长、P99 抖动、吞吐下降的证据链排查。

## 6. 标准库和后端开发

- `io`、`os`、`bufio`、`bytes`、`strings`、`strconv`、`time`。
- `encoding/json`、`encoding/xml`、`crypto`、`hash`。
- `net`、`net/http`、HTTP client/server、Transport、超时、连接池。
- `database/sql`、连接池、事务、上下文取消。
- 日志、配置、flag、模板、压缩、文件路径。

## 7. 工程实践

- 项目结构、包边界、internal、API 稳定性。
- 单元测试、集成测试、表驱动测试、mock/fake。
- Fuzz、benchmark、race、coverage、vet、staticcheck。
- CI、构建版本信息、容器镜像、交叉编译。
- 配置优先级、secret 管理、日志脱敏、错误码。
- 可观测性：日志、指标、trace、pprof、健康检查。
- 优雅关闭、超时、重试、限流、熔断、背压。
- `go build` 文件选择、构建标签、构建缓存、链接器 `-ldflags -X`、`go version -m`。
- 包初始化顺序、包级变量、`init` 副作用控制和显式启动流程。
- HTTP client/server 超时矩阵、Transport 连接池、body 关闭、重试幂等性。
- 发布止血、回滚、限流、降级、事故复盘和预防动作。

## 8. 安全和风险

- HTTP 默认超时风险。
- `os/exec` 命令注入。
- 路径穿越、文件权限、临时文件。
- 反序列化和 JSON 大包风险。
- TLS 配置、证书校验、代理和私有仓库凭据。
- 依赖供应链、校验数据库、私有模块泄露。
- `GOPRIVATE`、`GONOSUMDB`、`GOPROXY` 对私有依赖路径泄露的影响。
- pprof 和 debug 端点访问控制。
- 日志中的 token、cookie、Authorization、请求体和个人信息脱敏。
- 重试风暴、无界队列、无界缓存、无限 goroutine 创建的稳定性风险。

## 9. 面试和评估

- 切片、map、接口 nil、defer、panic、错误包装。
- goroutine/channel/context/锁/atomic 的选择。
- 调度器、GC、逃逸分析、内存模型。
- Go modules MVS 和版本升级。
- HTTP 服务生产配置、性能定位和故障排查。

## 完整性自查

- 能写可测试的业务包。
- 能写无竞态的并发任务。
- 能解释 Go modules 的版本选择。
- 能用 pprof 和 benchmark 证明性能判断。
- 能部署带超时、日志、指标和优雅关闭的服务。
