---
title: "Java设计模式学习资料：设计原则、SOLID 和 UML"
date: 2026-06-20
description: "设计原则是模式成立的基础。没有原则，模式会退化成模板代码。Java 里的设计模式通常围绕三件事展开："
tags:
  - "开发语言"
  - "Java设计模式"
category: "开发语言"
---

# Java设计模式学习资料：设计原则、SOLID 和 UML

[返回索引](../Java设计模式学习资料.md)

## 学习目标

- 掌握设计模式背后的原则，而不是只背模式结构。
- 能用简单 UML 类图描述接口、继承、组合、依赖和关联。
- 能判断某个抽象是否真的降低了耦合。

## 理论导读

设计原则是模式成立的基础。没有原则，模式会退化成模板代码。Java 里的设计模式通常围绕三件事展开：

- 把变化点从稳定代码中隔离出来。
- 让高层业务依赖抽象，而不是依赖具体实现。
- 用组合和多态替代不断膨胀的条件分支。

## SOLID

| 原则 | 含义 | Java 中的判断方式 |
| --- | --- | --- |
| SRP 单一职责 | 一个类只承担一个变化原因 | 类名是否能清晰描述职责，修改原因是否单一 |
| OCP 开闭原则 | 对扩展开放，对修改关闭 | 新增能力时是否少改旧代码 |
| LSP 里氏替换 | 子类必须能替换父类 | 使用父类型处换成子类型是否破坏语义 |
| ISP 接口隔离 | 不强迫调用方依赖不用的方法 | 接口是否过大，是否出现空实现 |
| DIP 依赖倒置 | 高层模块依赖抽象 | Service 是否依赖接口而不是具体渠道实现 |

## UML 类图最小语法

| 关系 | 语义 | Java 例子 |
| --- | --- | --- |
| 继承 | is-a | `class Cat extends Animal` |
| 实现 | can-do | `class SmsSender implements Sender` |
| 关联 | 长期知道对方 | `OrderService` 持有 `PaymentService` |
| 聚合 | 弱整体-部分 | 部门包含员工，员工可独立存在 |
| 组合 | 强整体-部分 | 订单项依附订单生命周期 |
| 依赖 | 临时使用 | 方法参数或局部变量使用某类型 |

## 例子：从 if-else 到策略

重构前：

```java
class DiscountService {
    BigDecimal discount(String type, BigDecimal amount) {
        if ("VIP".equals(type)) {
            return amount.multiply(new BigDecimal("0.8"));
        }
        if ("NEW_USER".equals(type)) {
            return amount.subtract(new BigDecimal("20"));
        }
        return amount;
    }
}
```

重构后：

```java
interface DiscountStrategy {
    String type();
    BigDecimal apply(BigDecimal amount);
}

class VipDiscount implements DiscountStrategy {
    public String type() { return "VIP"; }
    public BigDecimal apply(BigDecimal amount) {
        return amount.multiply(new BigDecimal("0.8"));
    }
}

class DiscountService {
    private final Map<String, DiscountStrategy> strategies;

    DiscountService(List<DiscountStrategy> strategies) {
        this.strategies = strategies.stream()
                .collect(Collectors.toMap(DiscountStrategy::type, Function.identity()));
    }

    BigDecimal discount(String type, BigDecimal amount) {
        return strategies.getOrDefault(type, a -> a).apply(amount);
    }
}
```

这个例子体现了：

- OCP：新增折扣类型时新增类，少改旧逻辑。
- DIP：调用方依赖 `DiscountStrategy` 抽象。
- SRP：每个策略只负责一种折扣规则。

## 重点

- 设计原则是判断模式是否合理的尺子。
- UML 不需要画得复杂，能表达依赖方向和职责边界即可。
- OCP 不是“永远不改旧代码”，而是让常见扩展少改核心流程。

## 难点

- 抽象过早会制造间接层，抽象过晚会让重构成本升高。
- LSP 经常被忽略，例如子类覆盖方法后抛出父类语义外的异常。
- ISP 在业务系统里常表现为“一个巨大的 Service 接口被所有人依赖”。

## 易错

> **易错：** 看到 `if-else` 就认为必须用策略。
>
> 正确做法：如果分支稳定、数量少、变化频率低，保持简单分支可能更好。

> **易错：** 抽象类被当成公共垃圾桶，所有子类共享不了的逻辑也塞进去。
>
> 正确做法：抽象类只放稳定骨架和真正共享的默认实现。

## 练习

1. 为一个通知发送模块画 UML：`Sender`、`SmsSender`、`EmailSender`、`NotificationService`。
2. 指出它满足哪些 SOLID 原则。
3. 增加 `DingTalkSender`，观察是否需要修改核心发送流程。

## 验收

- 能根据类图说出代码里的依赖方向。
- 能识别违反 SOLID 的坏味道。
- 能解释某个模式背后主要依赖哪几个原则。
