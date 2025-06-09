# Cocos Creator 使用指南

本指南专门针对在 Cocos Creator 3.8+ 中使用 @esengine/ecs-framework。

## 安装

```bash
npm install @esengine/ecs-framework
```

## WASM 支持（可选）

🚀 **WASM 模块已独立发布，需要手动下载和配置**

WASM 模块不再包含在 npm 包中，如需使用请从 [GitHub Release](https://github.com/esengine/ecs-framework/releases) 下载。

- 不使用 WASM：框架自动使用 JavaScript 实现，功能完全正常
- 使用 WASM：提供查询性能优化，需要手动配置

## 基本使用

### 1. 创建 ECS 核心

```typescript
import { Core } from '@esengine/ecs-framework';

// 在Cocos组件中初始化
export class GameManager extends Component {
    private core: Core;
    
    onLoad() {
        // 创建核心实例
        this.core = Core.create(true);
        console.log('ECS核心已初始化');
        
        // 可选：加载WASM支持（需要先下载WASM包）
        this.loadWasmSupport();
    }
    
    private async loadWasmSupport() {
        try {
            // 1. 导入WASM胶水代码（需要将文件放到项目中）
            const { default: wasmFactory } = await import('./ecs_wasm_core.js');
            
            // 2. 使用Cocos API加载WASM文件（需要先导入到资源管理器）
            const wasmFile = await this.loadWasmOrAsm("wasmFiles", "ecs_wasm_core", "your-wasm-uuid");
            
            // 3. 初始化WASM支持
            const { ecsCore } = await import('@esengine/ecs-framework');
            const success = await ecsCore.initializeWasm(wasmFactory, wasmFile);
            
            if (success) {
                console.log('✅ ECS WASM加速已启用');
            } else {
                console.log('⚠️ WASM初始化失败，使用JavaScript实现');
            }
        } catch (error) {
            console.log('⚠️ WASM不可用，使用JavaScript实现:', error);
        }
    }
}
```

### 2. 创建组件

```typescript
import { Component } from '@esengine/ecs-framework';

// 位置组件
export class Position extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

// 速度组件
export class Velocity extends Component {
    constructor(public dx: number = 0, public dy: number = 0) {
        super();
    }
}

// 精灵组件（关联Cocos节点）
export class SpriteComponent extends Component {
    constructor(public node: Node) {
        super();
    }
}
```

### 3. 创建系统

```typescript
import { EntitySystem, Family } from '@esengine/ecs-framework';

export class MovementSystem extends EntitySystem {
    constructor() {
        super(Family.all(Position, Velocity).get());
    }
    
    public processEntity(entity: Entity, deltaTime: number): void {
        const pos = entity.getComponent(Position);
        const vel = entity.getComponent(Velocity);
        
        pos.x += vel.dx * deltaTime;
        pos.y += vel.dy * deltaTime;
    }
}

export class SpriteRenderSystem extends EntitySystem {
    constructor() {
        super(Family.all(Position, SpriteComponent).get());
    }
    
    public processEntity(entity: Entity, deltaTime: number): void {
        const pos = entity.getComponent(Position);
        const sprite = entity.getComponent(SpriteComponent);
        
        // 同步位置到Cocos节点
        sprite.node.setPosition(pos.x, pos.y);
    }
}
```

### 4. 创建场景

```typescript
import { Scene } from '@esengine/ecs-framework';

export class GameScene extends Scene {
    private movementSystem: MovementSystem;
    private spriteRenderSystem: SpriteRenderSystem;
    
    public initialize(): void {
        // 添加系统
        this.movementSystem = this.addEntityProcessor(new MovementSystem());
        this.spriteRenderSystem = this.addEntityProcessor(new SpriteRenderSystem());
        
        // 创建一些实体用于测试
        this.createTestEntities();
    }
    
    private createTestEntities(): void {
        for (let i = 0; i < 10; i++) {
            const entity = this.createEntity();
            
            // 添加位置组件
            entity.addComponent(new Position(
                Math.random() * 800, 
                Math.random() * 600
            ));
            
            // 添加速度组件
            entity.addComponent(new Velocity(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200
            ));
            
            // 创建Cocos节点并添加精灵组件
            const node = new Node();
            const sprite = node.addComponent(Sprite);
            // 设置精灵贴图...
            
            entity.addComponent(new SpriteComponent(node));
        }
    }
}
```

### 5. 在Cocos组件中集成

```typescript
import { Component, _decorator } from 'cc';
import { Core } from '@esengine/ecs-framework';

const { ccclass } = _decorator;

@ccclass('ECSGameManager')
export class ECSGameManager extends Component {
    private core: Core;
    private gameScene: GameScene;
    
    onLoad() {
        // 初始化ECS核心
        this.core = Core.create(true);
        
        // 创建游戏场景
        this.gameScene = new GameScene();
        Core.scene = this.gameScene;
        
        console.log('ECS系统已启动');
    }
    
    update(deltaTime: number) {
        // ECS系统会自动处理更新
        // Core.emitter 会自动触发 frameUpdated 事件
    }
    
    onDestroy() {
        // 清理资源
        if (this.core) {
            // 执行必要的清理
        }
    }
}
```

## 高级功能

### 事件系统

```typescript
import { EventBus, ECSEventType } from '@esengine/ecs-framework';

// 监听实体创建事件
EventBus.subscribe(ECSEventType.EntityCreated, (data) => {
    console.log('实体已创建:', data.entityId);
});

// 发射自定义事件
EventBus.emit('player-scored', { score: 100, playerId: 'player1' });
```

### 性能监控

```typescript
import { PerformanceMonitor } from '@esengine/ecs-framework';

// 获取性能统计
const stats = PerformanceMonitor.instance.getStats();
console.log('系统性能:', stats);
```

### 对象池

```typescript
import { PoolManager } from '@esengine/ecs-framework';

// 获取对象池管理器
const poolManager = PoolManager.getInstance();

// 创建对象池
const bulletPool = poolManager.createPool('bullets', () => new BulletComponent(), 100);

// 获取对象
const bullet = bulletPool.obtain();

// 归还对象
bulletPool.free(bullet);
```

## 性能建议

1. **合理使用Family查询**: 避免过于复杂的组件查询
2. **批量操作**: 使用事件系统进行批量更新
3. **对象池**: 频繁创建/销毁的对象使用对象池
4. **定期清理**: 及时移除不需要的实体和组件

## 注意事项

1. 🔧 **WASM 支持**: 在 Cocos Creator 中自动禁用，使用 JavaScript 实现
2. 🎯 **内存管理**: 注意及时清理不需要的实体，避免内存泄漏
3. 🔄 **更新循环**: ECS 系统会自动集成到 Cocos 的更新循环中
4. 📦 **模块化**: 建议按功能拆分不同的系统和组件

## 故障排除

### 常见问题

**Q: 为什么看到"检测到Cocos Creator环境，WASM需要手动配置"的警告？**
A: 这是正常的。框架会自动回退到JavaScript实现，功能完全正常。

**Q: 如何确认ECS系统正在运行？**
A: 查看控制台输出，应该能看到"ECS核心已初始化"等日志。

**Q: 性能是否受到影响？**
A: JavaScript实现的性能已经很好，对于大多数游戏场景足够使用。

## 示例项目

完整的示例项目请参考：[GitHub示例仓库](https://github.com/esengine/ecs-framework/tree/master/examples/cocos)

## 技术支持

如遇问题，请访问：
- [GitHub Issues](https://github.com/esengine/ecs-framework/issues)
- [官方文档](https://github.com/esengine/ecs-framework#readme) 