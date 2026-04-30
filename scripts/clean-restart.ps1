# 清理缓存并重启开发服务器脚本
# 使用方法: .\scripts\clean-restart.ps1

Write-Host "正在清理服务器缓存并重启..." -ForegroundColor Cyan

# 1. 停止所有node进程
Write-Host "停止所有node进程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Write-Host "已停止进程: $($process.Id)" -ForegroundColor Green
        } catch {
            Write-Host "无法停止进程: $($process.Id)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "没有找到运行的node进程" -ForegroundColor Yellow
}

# 2. 清理.next缓存目录
Write-Host "清理.next缓存目录..." -ForegroundColor Yellow
if (Test-Path ".next") {
    try {
        Remove-Item -Recurse -Force ".next"
        Write-Host "已清理.next目录" -ForegroundColor Green
    } catch {
        Write-Host "清理.next目录失败: $_" -ForegroundColor Red
    }
} else {
    Write-Host ".next目录不存在" -ForegroundColor Yellow
}

# 3. 清理node_modules/.cache目录
Write-Host "清理node_modules缓存..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    try {
        Remove-Item -Recurse -Force "node_modules\.cache"
        Write-Host "已清理node_modules/.cache目录" -ForegroundColor Green
    } catch {
        Write-Host "清理node_modules/.cache失败: $_" -ForegroundColor Red
    }
} else {
    Write-Host "node_modules/.cache目录不存在" -ForegroundColor Yellow
}

# 4. 重启开发服务器
Write-Host "重启开发服务器..." -ForegroundColor Yellow
Write-Host "服务器将在新窗口中启动..." -ForegroundColor Cyan

# 启动新PowerShell窗口运行开发服务器
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Write-Host "服务器重启完成！" -ForegroundColor Green
Write-Host "请在新打开的窗口中查看服务器状态" -ForegroundColor Cyan
Write-Host "服务器地址: http://localhost:3000" -ForegroundColor Cyan