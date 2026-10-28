---
title: Z-Image（造相）文生图模型本地部署零踩坑实录
date: 2025-12-23
description: Z-Image 官方仓库要点、模型变体与架构说明，以及 conda 环境 + CUDA 12.2 下运行 inference.py 的部署步骤、关键参数与提示词示例。
tags:
  - "Z-Image"
  - "文生图"
  - "本地部署"
  - "开源模型"
review:
  created: 2025-12-23
  lastReview: 2025-12-23
  reps: 0
  interval: 0
  ease: 2.5
noReview: true
---

## 模型概览

Z-Image（造相）是一个强大且高效的图像生成基础模型，仅 **6B 参数**，采用具有单流扩散变换器（Single-Stream DiT）的高效架构。官方提供三个变体：

| 变体 | 说明 |
| --- | --- |
| **Z-Image-Turbo** | 精简版，仅需 8 次 NFEs（函数评估次数）即可匹敌或超越领先竞争对手；在 H800 上提供亚秒级推理延迟；可在 **16G 显存**的消费级设备上轻松运行 |
| **Z-Image-Base** | 非精简基础模型，面向社区微调和自定义开发（发布时即将上线） |
| **Z-Image-Edit** | 针对图像编辑任务微调的变体，支持创意性图生图，可按自然语言指令精确编辑 |

### 核心能力

- 擅长生成逼真的图像
- **双语文本渲染**（英文和中文）
- 强大的指令遵循能力

### 架构：S3-DIT

采用可扩展的单流 DiT（S3-DIT）架构：文本标记、视觉语义标记和图像 VAE 标记在序列级别上被连接为统一的输入流，与双流方法相比最大限度地提高了参数效率。结构由交替的 Single-Stream Attention Block 和 Single-Stream FFN Block 堆叠组成。

## 获取渠道

- 模型权重：Hugging Face / ModelScope 提供 Z-Image-Turbo 的 Checkpoint 与 Online Demo
- 官方仓库提供 PDF 技术报告与在线艺术画廊

## 部署环境

实测环境信息：

- Python 环境通过 conda 创建：`conda create -n z-image python=3.10 -y`
- CUDA compilation tools release **12.2**（V12.2.140）
- PyTorch 版本要求 ≥ 2.5.0（启动时会自动检查，"PyTorch version is >= 2.5.0, check pass"）

## 关键参数（inference.py）

官方示例脚本的默认配置：

```python
dtype = torch.bfloat16          # 精度
compile = False                 # 默认关闭以保证兼容性
height = 512
width = 512
num_inference_steps = 8         # Turbo 仅需 8 步
guidance_scale = 0.0
seed = 42
attn_backend = os.environ.get("ZIMAGE_ATTENTION", "native_flash")
```

设备选择优先级：`cuda -> tpu -> mps -> cpu`。

可用注意力后端列表：`flash`、`flash_varlen`、`flash_3`、`flash_varlen_3`、`native`、`native_flash`、`native_math`，默认使用 `native_flash`。

模型路径支持两种方式：

- `ensure_model_weights("ckpts/z-image-turbo", verify=False)` 自动下载（`verify=True` 可用 md5 校验）
- 直接指定本地目录 `model_dir`

## 运行结果

```text
Chosen device: cuda
Loading checkpoint shards: 100%
Generating image: 512x512, steps=8, cfg=0.0
Denoising: 100%
Time taken: 4.74 seconds
```

512x512、8 步采样，单张生成约 **4.74 秒**，输出 `example.png`，运行丝滑无报错。

## 提示词示例（中文长描述 + 文字渲染）

```text
蛋形脑袋的白色牛头梗，短而顺滑的纯白被毛，眼神锐利又带点戏谑，耳朵微微竖起。
前爪稳稳攥着一把银色半自动手枪，枪身金属质感锃亮，枪口径直对准画面外的观者——
营造出"正对着你"的沉浸式瞄准效果。
光线昏暗的复古房间，木质墙板斑驳，一盏暖橙色壁灯投下柔和阴影，
地板上散落着泛黄的旧报纸剪报。
狗头叼着烟，带着大金链子，头顶显示中文：给你机会不中用啊
```

中文文字渲染（头顶标语）正常生成。

> 来源：视频转录/图文整理
