@echo off
chcp 65001 >nul
title Cocos ECS Extension - 热更新管理后台

echo.
echo ======================================
echo  🚀 Cocos ECS Extension 热更新管理后台
echo ======================================
echo.

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 获取Node.js版本
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js版本: %NODE_VERSION%

:: 检查是否首次运行
if not exist "admin-backend\node_modules" (
    echo.
    echo 📦 首次运行，正在安装依赖...
    cd admin-backend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    cd ..
    echo ✅ 依赖安装完成
)

:: 启动服务
echo.
echo 🚀 启动热更新管理后台...
echo 📍 管理界面地址: http://localhost:3001
echo.
echo 💡 提示: 按 Ctrl+C 可停止服务
echo.

cd admin-backend
call npm run dev

pause 