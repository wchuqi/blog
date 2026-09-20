---
name: video-to-markdown
description: Turns a Bilibili (B站) or Douyin (抖音) URL — video or image-text post (图文) — into a Markdown note, by downloading it with the local jjdown CLI and transcribing the speech or images to text. Use when the user gives a bilibili.com / b23.tv / douyin.com link and wants it downloaded, transcribed, or summarized (下载、转写、提取文案、整理成笔记).
---

# video-to-markdown

URL → Markdown 笔记：**下载 → 转文字 → 写笔记**。

底层是本机 **dancer**（jjdown）的 CLI，它直连 B 站官方 API / 抖音 vendor，自带
ASR 语音转写。完整手册：`D:\dancer\docs\CLI.md`。

本 skill 只给流程和踩坑点，不封装 CLI —— 下面每条命令都是可以直接执行的。唯一的
脚本 `scripts/sync-env.py` 补的是 CLI 的一个缺口（设 API Key），见「凭据」。

## 流程

### 0. 体检（可选，不确定环境时先跑）

```bash
python D:/dancer/server/cli.py doctor --json
```

有 `error` 先修（数据库 / 输出目录 / ffmpeg）；`warn` 里和本次任务相关的再管
（抖音登录态、ASR 配置）。

### 1. 探测：拿标题和资源清单

```bash
python D:/dancer/server/cli.py probe "<url>" --json
```

返回 `{platform, kind, title, resources: [{rid, page, title, media_hint}], total}`。

- `kind`：`single` / `multi_p` / `fav` / `up` / `season` / `douyin_item` /
  `douyin_user` / `douyin_collect`
- `media_hint`：`video` = 视频，`gallery` = 图文
- `title` 就是要用的目录名

### 2. 下载

**B 站**：产物平铺在 `-o` 目录下，用上一步的 `title` 当目录名：

```bash
python D:/dancer/server/cli.py download "<url>" \
  -o "D:/blog/.download/<标题>" \
  --asr --asr-provider siliconflow \
  --json
```

**抖音**：必须带上项目里的 cookie 文件；注意**抖音路径不支持 `--asr`**（传了会被静默忽略，见「踩坑」），而且产物会自己套两层子目录 `<作者>/<日期_标题_rid>/`，所以 `-o` 直接给 `.download` 根目录就好：

```bash
python D:/dancer/server/cli.py download "<url>" \
  -o "D:/blog/.download" \
  --platform douyin --cookie-mode file --cookie-file "D:/blog/.cookie" \
  --json
```

其他常用参数（详见 CLI.md 第 8 节）：

| 参数 | 说明 |
|---|---|
| `--quality 116` | B 站清晰度码，默认 80=1080P，116=1080P60，120=4K |
| `--limit 20` | 合集 / UP 主 / 收藏夹的条数上限，`0`=不限 |
| `--audio-only` | 只要音频 |
| `--danmaku --ass` | 弹幕 XML + 转 ASS |
| `--subtitle --sub-lang zh-CN` | CC 字幕 |

返回 `files[]`，每项带 **绝对路径** `path` 和 `types`（`视频`/`音频`/`弹幕`/…）。
`skipped=true` 表示命中缓存跳过，`failed=true` 表示该文件失败。

默认跳过已存在的产物，所以**重跑是幂等的**；要强制重下得加 `--overwrite`。

### 3. 转写（抖音需要单独跑）

B 站加 `--asr` 就完事。**抖音得自己调 ASR**（CLI 不支持）：

```bash
cd D:/dancer/server && python -c "
import sys, os; sys.path.insert(0, os.getcwd())
from pathlib import Path
from app.services.asr.runner import run_asr
D = next(Path('D:/blog/.download/<作者>').iterdir())   # 含 mp4 的那层
mp4 = next(D.glob('*.mp4'))
print(run_asr(str(mp4), str(D), mp4.stem, provider='siliconflow', output_format='md'))
"
```

产出 `<名字>_asr.zh.md`（带时间轴）。已存在且非空时会直接复用，所以重跑是幂等的。

> 图片类内容（`media_hint: gallery`）不走 ASR。

### 4. 写笔记

产物落地后，读转写文本，自己写出笔记。两种平台的目录形状不同：

```
# B 站：平铺在 <输出>/<标题>/
.download/<标题>/
  <名字>.mp4 / .m4a / .jpg …      原始资源
  <名字>_audio.wav                抽出的音轨
  <名字>_asr.zh.md                语音转写  ← 素材
  <名字>-笔记.md                   ← 你来写

# 抖音：vendor 自己套 <作者>/<日期_标题_rid>/
.download/<作者>/<日期_标题_rid>/
  <日期_标题_rid>.mp4             原始资源
  <日期_标题_rid>_data.json       作品元数据（时长等，ffprobe 取不到时可从这里读）
  <日期_标题_rid>_asr.zh.md       语音转写  ← 素材
  <日期_标题_rid>-笔记.md          ← 你来写
```

- **视频**：读 `<名字>_asr.zh.md`，写出 `<名字>-笔记.md`。
- **图文**（`media_hint: gallery`，没有转写文件）：**直接看图片**。你能读图，
  不需要再调 OCR/VL 接口，把图里的文字和画面内容整理成笔记即可。
- 一个视频有多个分P/多件作品时，会有多份 `_asr.zh.md`，各自配一份笔记。

笔记没有固定模板，按内容走。转写通常有识别错误和碎片，**不要照抄**：挑出真正
有信息量的部分，注明时间戳，把明显的误识别标注出来而不是当成事实。

## 凭据

凭据放**仓库根**，不进版本库：

| 文件 | 内容 | 用途 |
|---|---|---|
| `.cookie` | 抖音登录 Cookie（整行 Cookie 头或 JSON） | 抖音全系接口 |
| `.env` | API Key、代理、B 站登录态 | ASR / 图片识别 / 高清 |

模板是 `.env.example` / `.cookie.example`，复制后填值。

`.cookie` 通过 `--cookie-file` 传给 CLI，**不写进 dancer 的登录态存储**，
不会覆盖你在客户端已保存的登录。

`.env` 需要落进 dancer 的 `settings` 表（CLI 和 ASR 都从那里读），用脚本同步：

```bash
python .agents/skills/video-to-markdown/scripts/sync-env.py            # 同步
python .agents/skills/video-to-markdown/scripts/sync-env.py --dry-run  # 先看会改什么
```

空值会跳过，不覆盖 dancer 里已有的配置。

支持的键：`SILICONFLOW_API_KEY` / `SILICONFLOW_MODEL`（云端 ASR）、
`FUNASR_DEVICE`（本地 ASR）、`LLM_*`、`VL_*`、`PROXY_HTTP(S)`、
`BILIBILI_COOKIE`（解锁 1080P+ 和字幕）。

## 踩坑

- **抖音路径不支持 `--asr`**。`douyin_adapter.py` 里没有任何 `asr` 相关代码，传了 `--asr` 会被**静默忽略**（不报错、不警告、产物里只有视频和 `_data.json`）。抖音的转写得按上面「3. 转写」那段自己调 `run_asr`。
- **B 站未登录只有 480P**。日志里会出现 `清晰度: 32 480P 清晰`，即使你请求
  `--quality 80`。要高清就在 `.env` 里配 `BILIBILI_COOKIE`。
- **抖音 403 不一定只是 Cookie 问题**。先看是不是这一类：
  `Blocked by ArgusSecurityPlugin Uifid Not Found` / `Signature Not Found` /
  `Sign Invalid`——这是风控（Argus）在拦，不是登录态失效，换 Cookie 没用。
  区分方法：Cookie 过期的特征是 `get_video_detail` 拿不到 `desc`、**标题退化成 aweme_id**；
  风控拦截的特征是标题能拿到（走浏览器兜底）但 HTTP 接口一律 403。
  抖音的 `x-secsdk-web-signature` 由站点自己的混淆 JS 生成且与请求上下文绑定，
  纯 HTTP 复现不了，所以 vendor 里加了一层浏览器兜底（会弹一个 Chromium 窗口，下载完自动关）。
- **抖音登录可能有假成功**：`login` 会先把已保存的 Cookie 注入浏览器，再调
  `user/profile/self` 判断登录态——这个宽松接口会被过期的 `sessionid` 骗过，
  于是**跳过扫码并把旧 Cookie 原样存回**。遇到这种“秒成功但接口仍然 403”，
  先备份并清掉旧凭据（`cookie douyin --clear`），再跑 `login`，才会真的弹二维码。
  自检：`python D:/dancer/server/cli.py cookie douyin --json` 看 `has_sessionid`
  （它只说明「有这个字段」，不代表没过期）。
- **不要从仓库根直接跑 CLI 并 `2>&1`**。stdout 只有 JSON，日志在 stderr，
  合并会破坏 JSON 解析。
- **Windows 编码**：CLI 输出中文，必要时设 `PYTHONIOENCODING=utf-8`，
  否则按 GBK 解会乱码。
- **CLI 会往 cwd 写 `.cookies.json`**（vendor 的 CookieManager 用相对路径）。
  从仓库根跑就会落到仓库里，`.gitignore` 已忽略；介意的话换个 cwd 跑。
- **长视频转写很慢**（ASR 串行）。跑之前先跟用户确认，别默认挂一个小时的视频；
  先用 `probe` 确认条目数，批量务必配 `--limit`。
- **批量链接只建一个目录**：收藏夹 / UP 主 / 合集的所有条目平铺在同一个
  `-o` 目录下，不会按作品分子目录。
- **`--asr` 曾经是空操作**：`downloader._run_asr_for_page` 读的是 `DownloadArgs`
  的**类**属性而非实例属性，永远拿到 `None` 就 return 了。这是 dancer 侧的 bug，
  已修复（本地 `D:\dancer` 不是 git 仓库，改动未提交）。
