@echo off
chcp 65001 >nul
REM 统一开发脚本：
REM   dev.bat        启动本地开发环境（清理残留进程 + 生成快照 + API server + Vite）
REM   dev.bat sync   复习完后同步数据（生成快照 + git 提交）

cd /d %~dp0

if /i "%~1"=="sync" goto :sync

REM ---------- 无窗口启动：以隐藏方式重启自身，输出全部写入 dev.log ----------
REM 隐藏实例负责启动服务；再起一个后台监视器，就绪后自动打开浏览器，失败则弹窗提示。
if not "%DEV_HIDDEN%"=="1" (
  powershell -NoProfile -Command "$env:DEV_HIDDEN='1'; Start-Process cmd -ArgumentList '/c %~f0' -WindowStyle Hidden"
  start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0scripts\dev-monitor.ps1"
  exit /b 0
)

call :start_dev > "%~dp0dev.log" 2>&1
goto :eof

:start_dev
REM ---------- 启动本地开发 ----------
REM 清理上一次残留的进程（占用 3001 / 5173 端口的）
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 .*LISTENING"') do taskkill /pid %%a /f >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 .*LISTENING"') do taskkill /pid %%a /f >nul 2>&1

echo [dev] 生成复习数据快照（public/review.json）...
python scripts/sync-reviews.py
if errorlevel 1 (
  echo [dev] 警告：生成 review.json 失败，/review 页面可能显示“暂无数据”。
)

echo [dev] 启动 FastAPI API server (http://127.0.0.1:3001) ...
powershell -NoProfile -Command "Start-Process -FilePath 'python' -ArgumentList 'scripts/api-server.py' -WorkingDirectory '%~dp0' -WindowStyle Hidden"

echo [dev] 启动 Vite dev server (http://localhost:5173) ...
call npm run dev -- --no-open
goto :eof

REM ---------- 同步复习数据 ----------
:sync
echo [sync] 1/3 生成复习数据快照（刷 frontmatter + review.json）...
python scripts/sync-reviews.py
if errorlevel 1 (
  echo [sync] sync-reviews.py 执行失败，终止。
  exit /b 1
)

echo [sync] 2/3 暂存变更...
git add src/posts public/review.json

echo [sync] 3/3 提交...
git commit -m "chore: sync review data (frontmatter 快照 + review.json)"

echo [sync] 完成。推送到远程请手动运行：git push
