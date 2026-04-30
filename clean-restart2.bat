@echo off
echo Cleaning server cache and restarting...
echo.

REM Stop all node processes
echo Stopping all node processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo All node processes stopped
) else (
    echo No running node processes found
)

REM Clean .next cache directory
echo Cleaning .next cache directory...
if exist ".next" (
    rmdir /s /q ".next"
    echo .next directory cleaned
) else (
    echo .next directory does not exist
)

REM Clean node_modules/.cache directory
echo Cleaning node_modules cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo node_modules/.cache directory cleaned
) else (
    echo node_modules/.cache directory does not exist
)

REM Restart development server
echo Restarting development server...
echo Server will start in a new window...
echo.

REM Start new window with development server
start cmd /k "npm run dev"

echo Server restart completed!
echo Check server status in the new window
echo Server URL: http://localhost:3000
echo.
pause