# @esengine/platform-common

平台通用接口定义包，定义了所有平台子系统的接口规范。

## 安装

```bash
npm install @esengine/platform-common
```

## 用途

此包仅包含 TypeScript 接口定义，供各平台适配器包实现：

- `@esengine/platform-wechat` - 微信小游戏
- `@esengine/platform-web` - Web 浏览器
- `@esengine/platform-bytedance` - 抖音小游戏

## 接口列表

### Canvas/渲染
- `IPlatformCanvasSubsystem`
- `IPlatformCanvas`
- `IPlatformImage`

### 音频
- `IPlatformAudioSubsystem`
- `IPlatformAudioContext`

### 存储
- `IPlatformStorageSubsystem`

### 网络
- `IPlatformNetworkSubsystem`
- `IPlatformWebSocket`

### 输入
- `IPlatformInputSubsystem`

### 文件系统
- `IPlatformFileSubsystem`

### WASM
- `IPlatformWASMSubsystem`

## License

MIT
