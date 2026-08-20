@echo off
REM 同步复习数据到公网：刷写 frontmatter 快照 + 生成 public/review.json + git 提交。
REM 复习完后运行此脚本即可。

cd /d %~dp0

echo [sync] 1/3 生成复习数据快照（刷 frontmatter + review.json）...
python scripts/sync-reviews.py
if errorlevel 1 (
  echo [sync] sync-reviews.py 执行失败，终止。
  exit /b 1
)

echo [sync] 2/3 暂存变更...
git add src/posts public/review.json

echo [sync] 3/3 提交（可在弹出的编辑器里改提交信息）...
git commit -m "chore: sync review data

- 更新文章 frontmatter 复习快照
- 重新生成 public/review.json"

echo [sync] 完成。推送到远程请手动运行：git push
