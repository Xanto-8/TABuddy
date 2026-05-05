@echo off
chcp 65001 >nul
echo =====================================
echo   TABuddy 自动更新发布工具
echo =====================================
echo.

setlocal enabledelayedexpansion

REM 获取当前版本号
set "VERSION="
for /f "tokens=*" %%a in ('node -e "console.log(require('./electron/config.js').APP_VERSION)"') do set VERSION=%%a

if "%VERSION%"=="" (
  echo [错误] 无法读取版本号
  pause
  exit /b 1
)

echo 当前版本: %VERSION%
echo.
echo 步骤 1/4: 清除旧的打包文件...
if exist "release" (
  rmdir /s /q "release"
  echo   已清理 release 目录
)

echo.
echo 步骤 2/4: 打包新版桌面应用...
call npm run electron:build:all
if %ERRORLEVEL% NEQ 0 (
  echo [错误] 打包失败，请检查错误信息
  pause
  exit /b 1
)
echo   打包完成

echo.
echo 步骤 3/4: 复制更新文件到网站目录...
if not exist "public\releases" mkdir "public\releases"

set "SETUP_FILE=TABuddy-Setup-%VERSION%.exe"
set "PORTABLE_FILE=TABuddy-Portable-%VERSION%.exe"
set "LATEST_YML=latest.yml"

if exist "release\!SETUP_FILE!" (
  copy /Y "release\!SETUP_FILE!" "public\releases\!SETUP_FILE!" >nul
  echo   已复制: %SETUP_FILE%
) else (
  echo [警告] 未找到安装包: %SETUP_FILE%
  dir release\*.exe /b 2>nul
)

if exist "release\!LATEST_YML!" (
  copy /Y "release\!LATEST_YML!" "public\releases\!LATEST_YML!" >nul
  echo   已复制: latest.yml
) else (
  echo [警告] 未找到 latest.yml，请检查打包是否成功
)

echo.
echo =====================================
echo   ✅ 发布准备完成！
echo =====================================
echo.
echo 下一步:
echo   部署 public/releases/ 目录到服务器即可
echo   (如果是 Vercel 部署，git push 即可)
echo.
echo   用户端将自动检测到版本 %VERSION% 更新
echo.
pause
