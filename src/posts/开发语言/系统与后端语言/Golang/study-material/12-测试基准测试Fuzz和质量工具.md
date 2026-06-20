---
title: "Golang 学习资料：测试、基准测试、Fuzz 和质量工具"
date: 2026-06-20
description: "Go 的测试能力内置在工具链里，测试文件以 test.go 结尾，测试函数由 go test 自动发现。表驱动测试适合覆盖大量输入输出组合。基准测试衡量性能，Fuzz 用随机变异输入发现边界 bug，race detector 检查并发数据…"
tags:
  - "开发语言"
  - "Golang"
category: "开发语言"
---

# Golang 学习资料：测试、基准测试、Fuzz 和质量工具

[返回索引](../Golang学习资料.md)

## 学习目标

- 掌握单元测试、表驱动测试、子测试、测试替身、覆盖率。
- 掌握 benchmark、pprof、fuzz、race detector。
- 能把测试纳入日常开发和 CI。

## 理论导读

Go 的测试能力内置在工具链里，测试文件以 `_test.go` 结尾，测试函数由 `go test` 自动发现。表驱动测试适合覆盖大量输入输出组合。基准测试衡量性能，Fuzz 用随机变异输入发现边界 bug，race detector 检查并发数据竞争。

## 核心心智模型

测试不是“证明代码没 bug”，而是固定已经理解的行为边界。每个表格用例都是一条业务契约。

## 知识点详解

### 表驱动测试

```go
func TestAdd(t *testing.T) {
	tests := []struct {
		name string
		a, b int
		want int
	}{
		{"positive", 1, 2, 3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Add(tt.a, tt.b); got != tt.want {
				t.Fatalf("got %d, want %d", got, tt.want)
			}
		})
	}
}
```

### 常用命令

```powershell
go test ./...
go test -cover ./...
go test -race ./...
go test -bench=. -benchmem ./...
go test -fuzz=FuzzParse ./...
```

## 练习

为一个 URL 解析函数编写表驱动测试、Fuzz 测试和 benchmark，比较不同实现的分配次数。

## 验收

- 能解释 `t.Fatal` 与 `t.Error` 的差异。
- 能读懂 benchmark 的 ns/op、B/op、allocs/op。
- 能在 CI 中执行测试、race 和 vet。

## 重点

- 表驱动测试是 Go 项目的常规测试组织方式。
- 性能优化必须先测量，再修改。

## 难点

- benchmark 容易被编译器优化、缓存、输入规模和外部 IO 干扰。

## 易错

> **易错：** 只测试正常路径，不测试错误、空值、边界和并发场景。
>
> 正确做法：用表格把输入类别列全，尤其覆盖 nil、空集合、超时和非法输入。
