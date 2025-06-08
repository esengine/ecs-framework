@echo off
chcp 65001 >nul
REM Rust WASM构建脚本 (Windows版本)
echo 开始构建Rust ECS WASM模块...

REM 检查是否安装了必要的工具
where wasm-pack >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到wasm-pack，请先安装：
    echo curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf ^| sh
    echo 或者访问: https://rustwasm.github.io/wasm-pack/installer/
    pause
    exit /b 1
)

REM 检查是否安装了Rust
where rustc >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到Rust，请先安装：
    echo 访问: https://rustup.rs/
    pause
    exit /b 1
)

REM 清理之前的构建缓存
echo 清理之前的构建缓存...
if exist Cargo.lock del Cargo.lock
if exist target rmdir /s /q target
if exist pkg rmdir /s /q pkg
cargo clean

echo 更新依赖...
cargo update

REM 设置环境变量解决getrandom问题
set RUSTFLAGS=--cfg getrandom_backend="wasm_js"

REM 构建WASM模块
echo 正在编译WASM模块...
wasm-pack build --target web --out-dir pkg --release

REM 检查构建是否成功
if %errorlevel% equ 0 (
    echo ✅ WASM模块构建成功！
    echo 生成的文件位于 pkg/ 目录：
    dir pkg
    
    echo.
    echo 📦 生成的文件说明：
    echo   - ecs_wasm_core.js: JavaScript绑定
    echo   - ecs_wasm_core_bg.wasm: WebAssembly二进制文件
    echo   - ecs_wasm_core.d.ts: TypeScript类型定义
    
    echo.
    echo 🚀 使用方法：
    echo import init, { EcsCore } from './pkg/ecs_wasm_core.js';
    echo await init^(^);
    echo const ecs = new EcsCore^(^);
) else (
    echo ❌ 构建失败！
    pause
    exit /b 1
)

pause