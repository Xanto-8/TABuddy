@echo off
echo Cleaning server cache and restarting...
echo.

REM 停止所有node进程
echo Stopping all node processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo All node processes stopped
) else (
    echo No running node processes found
)

REM 清理.next缓存目录
echo Cleaning .next cache directory...
if exist ".next" (
    rmdir /s /q ".next"
    echo .next directory cleaned
) else (
    echo .next directory does not exist
)

REM 清理node_modules/.cache目录
echo Cleaning node_modules cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo node_modules/.cache directory cleaned
) else (
    echo node_modules/.cache directory does not exist
)

REM 重启开发服务器
echo Restarting development server...
echo Server will start in a new window...
echo.

REM 启动新窗口运行开发服务器
start cmd /k "npm run dev"

echo Server restart completed!
echo Check server status in the new window
echo Server URL: http://localhost:3000
echo.
pause