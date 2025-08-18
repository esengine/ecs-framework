#!/bin/bash

# Linux/macOS构建脚本

print_help() {
    echo "ECS Core Rust WASM构建脚本"
    echo ""
    echo "用法:"
    echo "  ./build.sh          # 构建WASM包"
    echo "  ./build.sh --install # 安装依赖并构建"
    echo "  ./build.sh --help    # 显示帮助"
    echo ""
    echo "环境要求:"
    echo "  - Rust (rustup)"
    echo "  - wasm-pack"
}

# 解析参数
INSTALL=false
for arg in "$@"; do
    case $arg in
        --install)
            INSTALL=true
            shift
            ;;
        --help)
            print_help
            exit 0
            ;;
        *)
            echo "未知参数: $arg"
            print_help
            exit 1
            ;;
    esac
done

echo "开始构建Rust WASM包..."

# 检查Rust是否安装
if ! command -v cargo &> /dev/null; then
    echo "错误: 未找到cargo命令"
    if [ "$INSTALL" = true ]; then
        echo "正在安装Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    else
        echo "请先安装Rust: https://rustup.rs/"
        echo "或者使用 --install 参数自动安装"
        exit 1
    fi
fi

# 确保环境变量加载
if [ -f ~/.cargo/env ]; then
    source ~/.cargo/env
fi

# 检查wasm-pack是否安装
if ! command -v wasm-pack &> /dev/null; then
    echo "未找到wasm-pack，正在安装..."
    if [ "$INSTALL" = true ] || { echo "是否安装wasm-pack? (y/N)"; read -r response; [ "$response" = "y" ] || [ "$response" = "Y" ]; }; then
        curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
    else
        echo "请先安装wasm-pack: https://rustwasm.github.io/wasm-pack/installer/"
        exit 1
    fi
fi

# 添加wasm32目标
echo "添加wasm32目标..."
rustup target add wasm32-unknown-unknown

# 构建WASM包
echo "构建WASM包..."
export RUST_LOG=warn  # 减少日志输出

if wasm-pack build --target web --out-dir ../core/src/wasm --out-name ecs-core-rust; then
    echo "构建成功!"
    echo "生成的文件位于: ../core/src/wasm/"
    
    # 显示生成的文件
    echo -e "\n生成的文件:"
    ls -la ../core/src/wasm/ | grep -v '^d' | awk '{print "  " $9}' | grep -v '^$'
else
    echo "构建失败，退出码: $?"
    exit 1
fi

echo -e "\n构建完成!"
echo "现在可以在TypeScript中使用WASM版本的ECS核心了。"