# Windows PowerShell构建脚本
param(
    [switch]$Install,
    [switch]$Help
)

if ($Help) {
    Write-Host "ECS Core Rust WASM构建脚本"
    Write-Host ""
    Write-Host "用法:"
    Write-Host "  .\build.ps1          # 构建WASM包"
    Write-Host "  .\build.ps1 -Install # 安装依赖并构建"
    Write-Host "  .\build.ps1 -Help    # 显示帮助"
    Write-Host ""
    Write-Host "环境要求:"
    Write-Host "  - Rust (rustup)"
    Write-Host "  - wasm-pack"
    exit
}

Write-Host "开始构建Rust WASM包..." -ForegroundColor Green

# 检查Rust是否安装
if (!(Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到cargo命令" -ForegroundColor Red
    if ($Install) {
        Write-Host "正在安装Rust..." -ForegroundColor Yellow
        # 下载并运行Rust安装程序
        Invoke-RestMethod -Uri https://win.rustup.rs/ -OutFile rustup-init.exe
        .\rustup-init.exe -y --default-toolchain stable
        Remove-Item rustup-init.exe
        
        # 重新加载PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        # 添加Cargo到当前会话的PATH
        if (Test-Path "$env:USERPROFILE\.cargo\bin") {
            $env:PATH += ";$env:USERPROFILE\.cargo\bin"
        }
    } else {
        Write-Host "请先安装Rust: https://rustup.rs/" -ForegroundColor Red
        Write-Host "或者使用 -Install 参数自动安装" -ForegroundColor Yellow
        exit 1
    }
}

# 检查wasm-pack是否安装
if (!(Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
    Write-Host "未找到wasm-pack，正在安装..." -ForegroundColor Yellow
    if ($Install -or (Read-Host "是否安装wasm-pack? (y/N)").ToLower() -eq 'y') {
        # 使用cargo安装wasm-pack
        cargo install wasm-pack
    } else {
        Write-Host "请先安装wasm-pack: https://rustwasm.github.io/wasm-pack/installer/" -ForegroundColor Red
        exit 1
    }
}

# 添加wasm32目标
Write-Host "添加wasm32目标..." -ForegroundColor Yellow
rustup target add wasm32-unknown-unknown

# 构建WASM包
Write-Host "构建WASM包..." -ForegroundColor Yellow
$env:RUST_LOG = "warn"  # 减少日志输出

try {
    wasm-pack build --target web --out-dir ..\core\src\wasm --out-name ecs-core-rust
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "构建成功!" -ForegroundColor Green
        Write-Host "生成的文件位于: ..\core\src\wasm\" -ForegroundColor Green
        
        # 显示生成的文件
        Write-Host "`n生成的文件:" -ForegroundColor Cyan
        Get-ChildItem ..\core\src\wasm\ | ForEach-Object {
            Write-Host "  $($_.Name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "构建失败，退出码: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "构建过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n构建完成!" -ForegroundColor Green
Write-Host "现在可以在TypeScript中使用WASM版本的ECS核心了。" -ForegroundColor Green