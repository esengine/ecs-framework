@echo off
echo 正在构建 WASM 模块...

REM 方法1：尝试正常构建
echo 尝试正常构建...
wasm-pack build --target web --out-dir pkg --release
if %ERRORLEVEL% == 0 (
    echo ✅ 构建成功！
    goto :success
)

echo ❌ 正常构建失败，尝试其他方法...

REM 方法2：设置代理（如果有的话）
REM set HTTPS_PROXY=http://127.0.0.1:7890
REM set HTTP_PROXY=http://127.0.0.1:7890

REM 方法3：禁用 wasm-opt 优化
echo 尝试禁用 wasm-opt 优化...
wasm-pack build --target web --out-dir pkg --release -- --no-default-features
if %ERRORLEVEL% == 0 (
    echo ✅ 构建成功（已禁用优化）！
    goto :success
)

REM 方法4：手动下载 binaryen
echo 尝试手动处理 binaryen...
if not exist "tools\binaryen" (
    echo 请手动下载 binaryen 到 tools 目录
    echo 下载地址: https://github.com/WebAssembly/binaryen/releases/download/version_117/binaryen-version_117-x86_64-windows.tar.gz
    echo 或者使用国内镜像源
)

REM 方法5：使用环境变量跳过下载
echo 尝试跳过 binaryen 下载...
set WASM_PACK_CACHE_DISABLE=1
wasm-pack build --target web --out-dir pkg --release --mode no-install
if %ERRORLEVEL% == 0 (
    echo ✅ 构建成功（跳过下载）！
    goto :success
)

echo ❌ 所有方法都失败了
echo 建议：
echo 1. 检查网络连接
echo 2. 使用 VPN 或代理
echo 3. 手动下载 binaryen 工具
echo 4. 临时禁用 wasm-opt 优化
goto :end

:success
echo 🎉 WASM 模块构建完成！
echo 输出目录: pkg/

:end
pause 