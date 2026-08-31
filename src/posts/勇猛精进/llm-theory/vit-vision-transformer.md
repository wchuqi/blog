---
title: ViT：多模态 Transformer 第二期——1 分钟看懂 ViT
date: 2025-12-16
description: ViT 如何在不改动 Transformer 架构的前提下，把图片切成 patch 序列并映射成嵌入向量，完成图像分类。
tags:
  - "ViT"
  - "多模态"
  - "Transformer"
review:
  created: 2025-12-16
  lastReview: 2025-12-16
  reps: 0
  interval: 0
  ease: 2.5
noReview: true
---

ViT 的核心思路是：**尽量不对 Transformer 架构做任何改动**来完成图像分类任务——那就得让图像数据变得像文本一样，去适应 Transformer 的工作方式。那么 ViT 是怎么把图片变成类似文本的序列的呢？

## 图片切块（Patch）

首先把图片按固定大小分割成一个个小块，即 **patch**。

例如输入图像大小为 224×224 像素，每个 patch 设定为 14×14 像素，就能得到 16×16 = 256 个 patch 组成的序列。

## Patch 转嵌入向量

接下来把 patch 转换为对应的嵌入向量：

1. 把每个 patch 展平为一维向量；
2. 通过一个共享的线性层，映射到 Transformer 模型所需的特征维度。

以刚才的例子计算：每个 patch 是 14×14 像素、3 个通道，展平后就是 14 × 14 × 3 = **588 维**。假设 embedding 设定的特征维度是 **768**，就通过一个线性变换从 588 维转化为 768 维。

至此完成从图像到向量序列的转变。

## 与文本的对应关系

- 图像切片（patch）相当于文本里的**分词**步骤；
- 线性投射层起到了类似文本**嵌入（embedding）**的作用。

后续还有 ViT 的分类标签（class token）和位置编码，见下一期。

> 来源：视频转录/图文整理
