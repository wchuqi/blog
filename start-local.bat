@echo off
REM 启动本地开发环境：先生成复习数据快照，再并行启动 Vite dev (5173) + FastAPI API server (3001)
REM 关闭本窗口即可同时停止两个进程。

cd /d %~dp0

echo [start-local] 生成复习数据快照（public/review.json）...
python scripts/sync-reviews.py
if errorlevel 1 (
  echo [start-local] 警告：生成 review.json 失败，/review 页面可能显示“暂无数据”。
)

echo [start-local] 启动 FastAPI API server (http://127.0.0.1:3001) ...
start "blog-api-server" cmd /k "python scripts/api-server.py"

echo [start-local] 启动 Vite dev server (http://localhost:5173) ...
call npm run dev
