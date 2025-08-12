# @esengine/ecs-framework-network-server

ECS Framework 网络库 - 服务端实现

## 概述

这是 ECS Framework 网络库的服务端包，提供了：

- 权威服务端实现
- 客户端会话管理
- 房间和匹配系统
- 反作弊验证
- 网络同步权威控制

## 特性

- **权威服务端**: 所有网络状态由服务端权威控制
- **客户端验证**: 验证客户端输入和操作的合法性
- **房间系统**: 支持多房间和实例管理
- **反作弊**: 内置反作弊验证机制
- **高性能**: 针对大量客户端连接进行优化

## 安装

```bash
npm install @esengine/ecs-framework-network-server
```

## 基本用法

```typescript
import { NetworkServerManager } from '@esengine/ecs-framework-network-server';
import { NetworkComponent, SyncVar, ServerRpc } from '@esengine/ecs-framework-network-shared';

// 启动服务端
const server = new NetworkServerManager();
await server.startServer({
    port: 7777,
    maxConnections: 100
});

// 创建权威网络组件
@NetworkComponent()
class ServerPlayerController extends NetworkBehaviour {
    @SyncVar()
    public position: Vector3 = { x: 0, y: 0, z: 0 };
    
    @SyncVar()
    public health: number = 100;
    
    @ServerRpc({ requiresOwnership: true, rateLimit: 10 })
    public movePlayer(direction: Vector3): void {
        // 服务端权威的移动处理
        if (this.validateMovement(direction)) {
            this.position.add(direction);
        }
    }
    
    @ServerRpc({ requiresAuth: true })
    public takeDamage(damage: number, attackerId: number): void {
        // 服务端权威的伤害处理
        if (this.validateDamage(damage, attackerId)) {
            this.health -= damage;
            
            if (this.health <= 0) {
                this.handlePlayerDeath();
            }
        }
    }
}
```

## 房间系统

```typescript
import { RoomManager, Room } from '@esengine/ecs-framework-network-server';

// 创建房间管理器
const roomManager = new RoomManager();

// 创建房间
const gameRoom = roomManager.createRoom({
    name: 'Game Room 1',
    maxPlayers: 4,
    isPrivate: false
});

// 玩家加入房间
gameRoom.addPlayer(clientId, playerData);

// 房间事件处理
gameRoom.onPlayerJoined((player) => {
    console.log(`Player ${player.name} joined room ${gameRoom.name}`);
});

gameRoom.onPlayerLeft((player) => {
    console.log(`Player ${player.name} left room ${gameRoom.name}`);
});
```

## 权限验证

```typescript
import { AuthSystem } from '@esengine/ecs-framework-network-server';

// 配置认证系统
const authSystem = new AuthSystem({
    tokenSecret: 'your-secret-key',
    sessionTimeout: 30 * 60 * 1000, // 30分钟
    maxLoginAttempts: 5
});

// 客户端认证
authSystem.onClientAuth(async (clientId, credentials) => {
    const user = await validateCredentials(credentials);
    if (user) {
        return { userId: user.id, permissions: user.permissions };
    }
    return null;
});

// RPC 权限检查
@ServerRpc({ requiresAuth: true, requiresOwnership: true })
public adminCommand(command: string): void {
    // 只有已认证且拥有权限的客户端可以调用
    this.executeAdminCommand(command);
}
```

## License

MIT