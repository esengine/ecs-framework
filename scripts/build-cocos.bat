@echo off
setlocal enabledelayedexpansion

echo.
echo 🎮 构建 ECS Framework WASM for Cocos Creator
echo ============================================
echo.

:: 设置变量
set "RUST_DIR=src\wasm\rust-ecs-core"
set "OUTPUT_DIR=cocos-pkg"
set "WASM_NAME=ecs_wasm_core"

:: 检查必要工具
echo 🔍 检查构建环境...

where wasm-pack >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 wasm-pack
    echo 请运行: cargo install wasm-pack
    goto :error
)

where rustc >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Rust 编译器
    echo 请安装 Rust: https://rustup.rs/
    goto :error
)

echo ✅ 构建环境检查通过

:: 进入 Rust 项目目录
cd /d "%RUST_DIR%"
if %errorlevel% neq 0 (
    echo ❌ 错误: 无法进入目录 %RUST_DIR%
    goto :error
)

echo.
echo 📦 开始编译 WASM 模块...
echo 目标环境: Cocos Creator (Web + Native)
echo.

:: 清理之前的构建
if exist "pkg" (
    echo 🧹 清理旧的构建文件...
    rmdir /s /q "pkg"
)

:: 使用 wasm-pack 构建（针对 web 环境）
echo 🔨 编译 WASM 模块...
wasm-pack build --target web --release --no-typescript --out-dir pkg --out-name %WASM_NAME%
if %errorlevel% neq 0 (
    echo ❌ WASM 编译失败
    goto :error
)

echo ✅ WASM 编译完成

:: 回到项目根目录
cd ..\..\..

:: 创建输出目录
if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
) else (
    echo 🧹 清理输出目录...
    del /q "%OUTPUT_DIR%\*.*" 2>nul
)

echo.
echo 📁 处理输出文件...

:: 复制和处理 JavaScript 胶水代码
set "JS_SOURCE=%RUST_DIR%\pkg\%WASM_NAME%.js"
set "TS_TARGET=%OUTPUT_DIR%\%WASM_NAME%.ts"

if exist "%JS_SOURCE%" (
    echo ✓ 复制并转换 JS 文件为 TS: %WASM_NAME%.ts
    copy "%JS_SOURCE%" "%TS_TARGET%" >nul
) else (
    echo ❌ 错误: 未找到生成的 JS 文件
    goto :error
)

:: 复制 WASM 文件（原生端用 .bin，微信小游戏用 .wasm）
set "WASM_SOURCE=%RUST_DIR%\pkg\%WASM_NAME%_bg.wasm"
set "BIN_TARGET=%OUTPUT_DIR%\%WASM_NAME%_bg.bin"
set "WASM_TARGET=%OUTPUT_DIR%\%WASM_NAME%_bg.wasm"

if exist "%WASM_SOURCE%" (
    echo ✓ 复制 WASM 文件（原生端）: %WASM_NAME%_bg.bin
    copy "%WASM_SOURCE%" "%BIN_TARGET%" >nul
    
    echo ✓ 复制 WASM 文件（微信小游戏）: %WASM_NAME%_bg.wasm
    copy "%WASM_SOURCE%" "%WASM_TARGET%" >nul
) else (
    echo ❌ 错误: 未找到生成的 WASM 文件
    goto :error
)

:: 复制 TypeScript 类型定义（如果存在）
set "DTS_SOURCE=%RUST_DIR%\pkg\%WASM_NAME%.d.ts"
set "DTS_TARGET=%OUTPUT_DIR%\%WASM_NAME%.d.ts"
set "BG_DTS_SOURCE=%RUST_DIR%\pkg\%WASM_NAME%_bg.wasm.d.ts"
set "BG_DTS_TARGET=%OUTPUT_DIR%\%WASM_NAME%_bg.wasm.d.ts"

if exist "%DTS_SOURCE%" (
    echo ✓ 复制类型定义: %WASM_NAME%.d.ts
    copy "%DTS_SOURCE%" "%DTS_TARGET%" >nul
)

if exist "%BG_DTS_SOURCE%" (
    echo ✓ 复制 WASM 类型定义: %WASM_NAME%_bg.wasm.d.ts
    copy "%BG_DTS_SOURCE%" "%BG_DTS_TARGET%" >nul
)

:: 生成 Cocos Creator 使用指南
echo.
echo 📋 生成使用指南...
(
echo # ECS Framework WASM for Cocos Creator
echo.
echo ## 文件说明
echo.
echo - `%WASM_NAME%.ts` - WASM 胶水代码（原 JS 文件重命名）
echo - `%WASM_NAME%_bg.bin` - WASM 二进制文件（原生端使用）
echo - `%WASM_NAME%_bg.wasm` - WASM 二进制文件（微信小游戏使用）
echo - `%WASM_NAME%.d.ts` - TypeScript 类型定义
echo.
echo ## 在 Cocos Creator 中使用
echo.
echo ### 1. 导入文件到项目
echo.
echo 1. 将 `%WASM_NAME%.ts` 放到 assets/scripts/ 目录
echo 2. 将 `%WASM_NAME%_bg.bin` 导入为 BufferAsset（原生端）
echo 3. 将 `%WASM_NAME%_bg.wasm` 放到微信小游戏构建目录
echo.
echo ### 2. 组件代码示例
echo.
echo ```typescript
echo import { _decorator, Component, BufferAsset } from 'cc';
echo import { initSync } from './%WASM_NAME%';
echo.
echo const { ccclass, property } = _decorator;
echo.
echo @ccclass('WasmLoader'^)
echo export class WasmLoader extends Component {
echo     @property(BufferAsset^) 
echo     wasmAsset!: BufferAsset;
echo.
echo     start(^) {
echo         this.initWasm(^);
echo     }
echo.
echo     private async initWasm(^) {
echo         try {
echo             // 检查平台
echo             if (typeof wx !== 'undefined'^) {
echo                 // 微信小游戏环境
echo                 initSync("/%WASM_NAME%_bg.wasm"^);
echo             } else {
echo                 // 原生端/浏览器环境
echo                 const wasmBuffer = this.wasmAsset?.buffer(^);
echo                 if (wasmBuffer^) {
echo                     initSync(wasmBuffer^);
echo                 } else {
echo                     console.error('WASM 资源未正确加载'^);
echo                     return;
echo                 }
echo             }
echo             
echo             console.log('✅ ECS WASM 模块初始化成功'^);
echo             
echo             // 这里可以开始使用 WASM 导出的函数
echo             // 例如: wasmFunction(^);
echo             
echo         } catch (error^) {
echo             console.error('❌ WASM 初始化失败:', error^);
echo             console.log('↪️ 将使用 JavaScript 实现'^);
echo         }
echo     }
echo }
echo ```
echo.
echo ### 3. 微信小游戏配置
echo.
echo 使用 build-templates 自动复制 WASM 文件：
echo.
echo 1. 在项目 build-templates/wechatgame/ 目录下创建构建脚本
echo 2. 构建时会自动复制 %WASM_NAME%_bg.wasm 到发布目录
echo.
echo ## 注意事项
echo.
echo 1. 确保在使用 ECS 系统前初始化 WASM 模块
echo 2. 原生端使用 .bin 文件，微信小游戏使用 .wasm 文件
echo 3. 如果 WASM 初始化失败，框架会自动回退到 JavaScript 实现
echo 4. WASM 主要优化查询性能，对大多数应用场景提升有限
echo.
echo ## 重新构建
echo.
echo 运行 `build-cocos.bat` 重新编译最新的 WASM 模块
) > "%OUTPUT_DIR%\README.md"

:: 显示构建结果
echo.
echo 📊 构建结果：
for %%f in ("%OUTPUT_DIR%\*.*") do (
    call :filesize "%%f"
    echo   %%~nxf: !size! KB
)

echo.
echo ✅ 构建完成！
echo 📦 输出目录: %OUTPUT_DIR%
echo 📋 使用说明: %OUTPUT_DIR%\README.md
echo.
echo 💡 下一步：
echo 1. 将文件导入到 Cocos Creator 项目
echo 2. 参考 README.md 集成到游戏中
echo 3. 对于微信小游戏，使用 build-templates 自动复制 WASM 文件
echo.

goto :end

:filesize
set "file=%~1"
for %%A in ("%file%") do set "bytes=%%~zA"
set /a size=bytes/1024
if %size% lss 1 set size=1
goto :eof

:error
echo.
echo ❌ 构建失败！
echo 请检查错误信息并重试。
echo.
pause
exit /b 1

:end
pause 