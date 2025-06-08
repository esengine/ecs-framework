#!/bin/bash

# Rust WASM构建脚本
echo "开始构建Rust ECS WASM模块..."

# 检查是否安装了必要的工具
if ! command -v wasm-pack &> /dev/null; then
    echo "错误：未找到wasm-pack，请先安装："
    echo "curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

# 构建WASM模块
echo "正在编译WASM模块..."
wasm-pack build --target web --out-dir pkg --release

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ WASM模块构建成功！"
    echo "生成的文件位于 pkg/ 目录："
    ls -la pkg/
    
    echo ""
    echo "📦 生成的文件说明："
    echo "  - ecs_wasm_core.js: JavaScript绑定"
    echo "  - ecs_wasm_core_bg.wasm: WebAssembly二进制文件"
    echo "  - ecs_wasm_core.d.ts: TypeScript类型定义"
    
    echo ""
    echo "🚀 使用方法："
    echo "import init, { EcsCore } from './pkg/ecs_wasm_core.js';"
    echo "await init();"
    echo "const ecs = new EcsCore();"
else
    echo "❌ 构建失败！"
    exit 1
fi 