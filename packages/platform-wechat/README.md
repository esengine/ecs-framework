# @esengine/platform-wechat

微信小游戏平台适配器，为 ECS Framework 提供微信小游戏环境支持。

## 安装

```bash
npm install @esengine/platform-wechat
```

## 使用

```typescript
import { PlatformManager } from '@esengine/ecs-framework';
import { WeChatAdapter } from '@esengine/platform-wechat';

// 注册微信小游戏适配器
const adapter = new WeChatAdapter();
PlatformManager.getInstance().registerAdapter(adapter);

// 使用子系统
const canvas = adapter.canvas.createCanvas();
const ctx = canvas.getContext('webgl');

// 加载 WASM 模块
const instance = await adapter.wasm.instantiate('path/to/module.wasm');
```

## 子系统

| 子系统 | 描述 |
|--------|------|
| `canvas` | Canvas 创建、WebGL 上下文 |
| `audio` | 音频播放、音量控制 |
| `storage` | 本地存储 |
| `network` | 网络请求、WebSocket |
| `input` | 触摸输入 |
| `file` | 文件系统操作 |
| `wasm` | WebAssembly 加载 |

## 平台限制

- **SharedArrayBuffer**: 不支持
- **Worker**: 支持，但有限制（需独立文件，最多 1 个）
- **eval**: 不支持
- **WASM**: 支持，使用 `WXWebAssembly`

## game.json 配置

```json
{
  "workers": "workers",
  "subpackages": [
    {
      "name": "wasm",
      "root": "wasm/"
    }
  ]
}
```

## License

MIT
