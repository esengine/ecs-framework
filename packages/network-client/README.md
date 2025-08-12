# ECS Framework 网络库 - 客户端

该包提供了完整的网络客户端功能，包括连接管理、预测、插值等现代网络游戏必需的特性。

## 主要功能

- ✅ **传输层支持**: WebSocket 和 HTTP 两种传输方式
- ✅ **网络客户端**: 完整的连接、认证、房间管理
- ✅ **网络行为**: ClientNetworkBehaviour 基类和 NetworkIdentity 组件
- ✅ **装饰器系统**: @SyncVar, @ClientRpc, @ServerRpc 装饰器
- ✅ **客户端预测**: 减少网络延迟感知的预测系统
- ✅ **插值系统**: 平滑的网络对象状态同步
- ✅ **TypeScript**: 完整的类型支持

## 安装

```bash
npm install @esengine/ecs-framework-network-client
```

## 快速开始

```typescript
import { 
  NetworkClient, 
  WebSocketClientTransport,
  ClientNetworkBehaviour,
  SyncVar,
  ServerRpc 
} from '@esengine/ecs-framework-network-client';

// 创建网络客户端
const client = new NetworkClient({
  transport: 'websocket',
  transportConfig: {
    host: 'localhost',
    port: 8080,
    secure: false
  }
});

// 连接到服务器
await client.connect();

// 认证
const userInfo = await client.authenticate('username', 'password');

// 获取房间列表
const rooms = await client.getRoomList();

// 加入房间
const roomInfo = await client.joinRoom('room-id');
```

## 网络行为示例

```typescript
class PlayerController extends ClientNetworkBehaviour {
  @SyncVar({ clientCanModify: true })
  position: { x: number; y: number } = { x: 0, y: 0 };
  
  @SyncVar()
  health: number = 100;

  @ServerRpc({ requireLocalPlayer: true })
  async move(direction: string): Promise<void> {
    // 这个方法会被发送到服务器执行
  }

  @ClientRpc()
  onDamaged(damage: number): void {
    // 这个方法会被服务器调用
    console.log(`Received damage: ${damage}`);
  }
}
```

## 预测和插值

```typescript
import { PredictionSystem, InterpolationSystem } from '@esengine/ecs-framework-network-client';

// 启用预测系统
const predictionSystem = new PredictionSystem(scene, 64, 500);
scene.addSystem(predictionSystem);

// 启用插值系统
const interpolationSystem = new InterpolationSystem(scene, {
  delay: 100,
  enableExtrapolation: false
});
scene.addSystem(interpolationSystem);
```

## 编译状态

✅ **编译成功** - 所有 TypeScript 错误已修复，包生成完成

## License

MIT