#!/bin/bash

# 构建WASM到core库的脚本

set -e

echo "🚀 开始构建 WASM 到 core 库..."

# 确保在正确的目录
cd "$(dirname "$0")"

# 确保目标目录存在
mkdir -p ../core/wasm

# 构建WASM包
echo "📦 构建 WASM 包..."
wasm-pack build --target web --out-dir temp-pkg

# 检查构建是否成功
if [ ! -d "temp-pkg" ]; then
    echo "❌ WASM构建失败"
    exit 1
fi

# 复制文件到core库，排除不需要的文件
echo "📁 复制文件到 core/wasm..."
cp temp-pkg/*.wasm ../core/wasm/
cp temp-pkg/*.js ../core/wasm/
cp temp-pkg/*.ts ../core/wasm/

# 清理临时文件
echo "🧹 清理临时文件..."
rm -rf temp-pkg

echo "✅ 构建完成！WASM文件已输出到 packages/core/wasm/"
echo ""
echo "文件列表："
ls -la ../core/wasm/
echo ""
echo "🎯 现在可以在 TypeScript 中直接导入 WASM 模块了！"