# @esengine/ecs-framework-network-shared

ECS Framework 网络库 - 共享组件和类型定义

## 概述

这是 ECS Framework 网络库的共享包，包含了客户端和服务端通用的：

- 装饰器定义 (`@SyncVar`, `@ClientRpc`, `@ServerRpc` 等)
- 类型定义和接口
- 序列化/反序列化工具
- Protobuf 自动生成机制
- 网络消息基类

## 特性

- **装饰器驱动**: 基于装饰器自动生成网络协议
- **类型安全**: 完整的 TypeScript 支持
- **自动序列化**: 基于 Protobuf 的高性能序列化
- **零配置**: 无需手写 .proto 文件
- **ECS 集成**: 深度集成 ECS 框架的特性

## 安装

```bash
npm install @esengine/ecs-framework-network-shared
```

## 基本用法

```typescript
import { NetworkComponent, SyncVar, ClientRpc, ServerRpc } from '@esengine/ecs-framework-network-shared';

@NetworkComponent()
class PlayerController extends Component {
    @SyncVar({ onChanged: 'onHealthChanged' })
    public health: number = 100;

    @SyncVar()
    public playerName: string = '';

    @ClientRpc()
    public showDamage(damage: number): void {
        // 客户端显示伤害效果
    }

    @ServerRpc()
    public movePlayer(direction: Vector3): void {
        // 服务端处理玩家移动
    }

    private onHealthChanged(oldValue: number, newValue: number): void {
        console.log(`生命值从 ${oldValue} 变为 ${newValue}`);
    }
}
```

## License

MIT