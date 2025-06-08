# Rust WebAssembly 编译指南

本指南将帮助您从零开始安装Rust环境并编译WASM模块。

## 📋 前置要求

- Windows 10/11 或 macOS/Linux
- 稳定的网络连接
- 管理员权限（用于安装软件）

## 🚀 第一步：安装 Rust

### Windows 用户

1. **下载 Rust 安装器**
   - 访问 https://rustup.rs/
   - 点击 "DOWNLOAD RUSTUP-INIT.EXE (64-BIT)"
   - 或者直接下载：https://win.rustup.rs/x86_64

2. **运行安装器**
   ```cmd
   # 下载后运行
   rustup-init.exe
   ```
   
3. **选择安装选项**
   - 出现提示时，选择 "1) Proceed with installation (default)"
   - 等待安装完成

4. **重启命令行**
   - 关闭当前命令行窗口
   - 重新打开 cmd 或 PowerShell

### macOS/Linux 用户

```bash
# 使用官方安装脚本
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 重新加载环境变量
source ~/.cargo/env
```

## 🔧 第二步：安装 wasm-pack

wasm-pack 是编译 Rust 到 WebAssembly 的官方工具。

### Windows 用户

```cmd
# 方法1：使用 cargo 安装（推荐）
cargo install wasm-pack

# 方法2：下载预编译版本
# 访问 https://github.com/rustwasm/wasm-pack/releases
# 下载最新的 Windows 版本
```

### macOS/Linux 用户

```bash
# 方法1：使用官方安装脚本
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 方法2：使用 cargo 安装
cargo install wasm-pack
```

## ✅ 第三步：验证安装

打开新的命令行窗口，运行以下命令验证安装：

```cmd
# 检查 Rust 版本
rustc --version

# 检查 Cargo 版本
cargo --version

# 检查 wasm-pack 版本
wasm-pack --version
```

如果所有命令都能正常显示版本号，说明安装成功！

## 🏗️ 第四步：编译 WASM 模块

现在可以编译我们的 Rust WASM 模块了：

### 使用批处理文件（Windows 推荐）

```cmd
# 进入项目目录
cd D:\project\ecs-framework\source\src\wasm\rust-ecs-core

# 运行批处理文件
build.bat
```

### 使用命令行（跨平台）

```bash
# 进入项目目录
cd source/src/wasm/rust-ecs-core

# 编译 WASM 模块
wasm-pack build --target web --out-dir pkg --release
```

### 编译选项说明

- `--target web`: 生成适用于浏览器的模块
- `--out-dir pkg`: 输出到 pkg 目录
- `--release`: 发布模式，启用优化

## 📦 第五步：验证编译结果

编译成功后，`pkg` 目录应该包含以下文件：

```
pkg/
├── ecs_wasm_core.js           # JavaScript 绑定
├── ecs_wasm_core_bg.wasm      # WebAssembly 二进制文件
├── ecs_wasm_core.d.ts         # TypeScript 类型定义
├── package.json               # NPM 包配置
└── README.md                  # 包说明
```

## 🧪 第六步：测试 WASM 模块

创建一个简单的测试文件来验证模块是否正常工作：

```html
<!DOCTYPE html>
<html>
<head>
    <title>WASM ECS 测试</title>
</head>
<body>
    <h1>Rust WASM ECS 测试</h1>
    <div id="output"></div>
    
    <script type="module">
        import init, { EcsCore } from './pkg/ecs_wasm_core.js';
        
        async function run() {
            try {
                // 初始化 WASM 模块
                await init();
                
                // 创建 ECS 核心实例
                const ecs = new EcsCore();
                
                // 创建实体
                const entity = ecs.create_entity();
                console.log('创建实体:', entity);
                
                // 显示结果
                document.getElementById('output').innerHTML = 
                    `✅ WASM 模块加载成功！<br>创建的实体ID: ${entity}`;
                    
            } catch (error) {
                console.error('错误:', error);
                document.getElementById('output').innerHTML = 
                    `❌ 错误: ${error.message}`;
            }
        }
        
        run();
    </script>
</body>
</html>
```

## 🔧 故障排除

### 常见问题

1. **"rustc 不是内部或外部命令"**
   - 重启命令行窗口
   - 检查环境变量是否正确设置
   - 重新安装 Rust

2. **"wasm-pack 不是内部或外部命令"**
   - 确保 wasm-pack 安装成功
   - 重启命令行窗口
   - 尝试使用 `cargo install wasm-pack` 重新安装

3. **编译错误**
   - 检查 Rust 版本是否为最新稳定版
   - 运行 `rustup update` 更新 Rust
   - 检查网络连接，确保能下载依赖

4. **WASM 模块加载失败**
   - 确保使用 HTTP 服务器而不是直接打开文件
   - 检查浏览器是否支持 WebAssembly
   - 查看浏览器控制台的错误信息

### 更新工具

```bash
# 更新 Rust
rustup update

# 更新 wasm-pack
cargo install wasm-pack --force
```

## 🎯 下一步

编译成功后，您可以：

1. 在项目中使用 `WasmLoader` 加载模块
2. 运行性能基准测试
3. 集成到您的游戏或应用中

## 📞 获取帮助

如果遇到问题，可以：

1. 查看 Rust 官方文档：https://doc.rust-lang.org/
2. 查看 wasm-pack 文档：https://rustwasm.github.io/wasm-pack/
3. 检查项目的 GitHub Issues
4. 在 Rust 社区寻求帮助：https://users.rust-lang.org/ 