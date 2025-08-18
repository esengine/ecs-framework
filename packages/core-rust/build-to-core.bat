@echo off
setlocal enabledelayedexpansion

REM 构建WASM到core库的脚本 (Windows版本)

echo 🚀 开始构建 WASM 到 core 库...

REM 确保在正确的目录
cd /d "%~dp0"

REM 确保目标目录存在
if not exist "..\core\wasm" mkdir "..\core\wasm"

REM 构建WASM包
echo 📦 构建 WASM 包...
wasm-pack build --target web --out-dir temp-pkg

REM 检查构建是否成功
if not exist "temp-pkg" (
    echo ❌ WASM构建失败
    exit /b 1
)

REM 复制文件到core库
echo 📁 复制文件到 core\wasm...
copy "temp-pkg\*.wasm" "..\core\wasm\" >nul
copy "temp-pkg\*.js" "..\core\wasm\" >nul
copy "temp-pkg\*.ts" "..\core\wasm\" >nul

REM 清理临时文件
echo 🧹 清理临时文件...
rmdir /s /q temp-pkg

echo ✅ 构建完成！WASM文件已输出到 packages\core\wasm\
echo.
echo 文件列表：
dir "..\core\wasm\"
echo.
echo 🎯 现在可以在 TypeScript 中直接导入 WASM 模块了！

pause