# 快速入门

本指南将帮助您快速上手 ECS Framework，这是一个专业级的实体组件系统框架，采用现代化架构设计，专为高性能游戏开发打造。

## 安装

```bash
npm install @esengine/ecs-framework
```

## 更新机制说明

ECS框架需要在游戏引擎的更新循环中调用，并传入deltaTime：

```typescript
// 统一的更新方式：让外部引擎传入deltaTime
Core.update(deltaTime);
```

**不同平台的集成方式：**
- **Laya引擎**：使用 `Laya.timer.delta / 1000`
- **Cocos Creator**：使用组件的 `update(deltaTime)` 参数
- **原生浏览器**：自己计算deltaTime
- **Node.js服务器**：自己计算deltaTime

**优势：**
- 与引擎时间系统完全同步
- 支持引擎的时间缩放和暂停功能
- 更精确的时间控制
- 统一的API，简化集成

## Core配置

### 基础配置

ECS框架提供了灵活的配置选项来满足不同项目需求：

```typescript
import { Core, ICoreConfig } from '@esengine/ecs-framework';

// 方式1：简化配置（向后兼容）
Core.create(true);  // 启用调试模式
Core.create(false); // 发布模式
Core.create();      // 默认调试模式

// 方式2：详细配置（推荐）
const config: ICoreConfig = {
    debug: true,                    // 启用调试模式
    enableEntitySystems: true,     // 启用实体系统（默认true）
    debugConfig: {                 // 可选：远程调试配置
        enabled: true,
        websocketUrl: 'ws://localhost:8080',
        autoReconnect: true,
        updateInterval: 1000,       // 调试数据更新间隔（毫秒）
        channels: {                 // 调试数据通道
            entities: true,         // 实体信息
            systems: true,          // 系统信息
            performance: true,      // 性能数据
            components: true,       // 组件信息
            scenes: true           // 场景信息
        }
    }
};

const core = Core.create(config);
```

### 调试功能

ECS框架内置了强大的调试功能，支持运行时监控和远程调试：

#### Cocos Creator专用调试插件

** 对于Cocos Creator用户，我们提供了专门的可视化调试插件：**

- **插件地址**：[cocos-ecs-framework 调试插件](https://store.cocos.com/app/detail/7823)
- **插件版本**：v1.0.0
- **支持版本**：Cocos Creator v3.0.0+
- **支持平台**：Android | iOS | HTML5

这个插件提供了完整的ECS可视化调试界面，包括实体查看器、组件编辑器、系统监控、性能分析等功能。

#### 通用调试配置

```typescript
// 运行时启用调试
Core.enableDebug({
    enabled: true,
    websocketUrl: 'ws://localhost:8080',
    autoReconnect: true,
    updateInterval: 500,
    channels: {
        entities: true,
        systems: true,
        performance: true,
        components: false,    // 可以选择性禁用某些通道
        scenes: true
    }
});

// 获取调试数据
const debugData = Core.getDebugData();
console.log('当前实体数量:', debugData?.entities?.totalEntities);

// 禁用调试
Core.disableDebug();

// 检查调试状态
if (Core.isDebugEnabled) {
    console.log('调试模式已启用');
}
```

### 生产环境配置建议

```typescript
// 开发环境 - Cocos Creator
const devConfigForCocos: ICoreConfig = {
    debug: true,
    enableEntitySystems: true,
    debugConfig: {
        enabled: true,
        websocketUrl: 'ws://localhost:8080',  // 连接Cocos插件
        autoReconnect: true,
        updateInterval: 1000,
        channels: {
            entities: true,
            systems: true,
            performance: true,
            components: true,
            scenes: true
        }
    }
};

// 开发环境 - 其他平台
const devConfig: ICoreConfig = {
    debug: true,
    enableEntitySystems: true,
    debugConfig: {
        enabled: true,
        websocketUrl: 'ws://localhost:8080',
        autoReconnect: true,
        updateInterval: 1000,
        channels: {
            entities: true,
            systems: true,
            performance: true,
            components: true,
            scenes: true
        }
    }
};

// 生产环境
const prodConfig: ICoreConfig = {
    debug: false,                   // 关闭调试以提升性能
    enableEntitySystems: true,
    // debugConfig 可以省略或设为 undefined
};

const isDevelopment = process.env.NODE_ENV === 'development';
Core.create(isDevelopment ? devConfig : prodConfig);
```

** 调试功能说明：**
- **Cocos Creator**：推荐使用[官方调试插件](https://store.cocos.com/app/detail/7823)获得最佳调试体验
- **其他平台**：可以通过WebSocket连接自定义调试工具
- **生产环境**：建议关闭调试功能以获得最佳性能

## 平台集成

### Laya引擎

```typescript
import { Scene as LayaScene } from "laya/display/Scene";
import { Core, Scene as ECSScene, EntityManager, EntitySystem } from '@esengine/ecs-framework';

class LayaECSGame extends LayaScene {
    private ecsScene: ECSScene;
    private entityManager: EntityManager;
    
    constructor() {
        super();
        
        // 初始化ECS框架（简化方式）
        Core.create(true); // 启用调试模式
        // 完整配置示例: Core.create({ debug: true, enableEntitySystems: true, debugConfig: {...} })
        
        this.ecsScene = new ECSScene();
        this.ecsScene.name = "LayaGameScene";
        Core.scene = this.ecsScene;
        
        this.entityManager = new EntityManager();
        this.setupSystems();
    }
    
    onAwake(): void {
        super.onAwake();
        // 使用Laya的帧循环更新ECS
        Laya.timer.frameLoop(1, this, this.updateECS);
    }
    
    onDestroy(): void {
        Laya.timer.clear(this, this.updateECS);
        super.onDestroy();
    }
    
    private updateECS(): void {
        // 使用Laya的deltaTime更新ECS
        const deltaTime = Laya.timer.delta / 1000; // 转换为秒
        Core.update(deltaTime);
    }
    
    private setupSystems(): void {
        this.ecsScene.addEntityProcessor(new LayaRenderSystem(this));
        this.ecsScene.addEntityProcessor(new MovementSystem());
    }
}

// Laya渲染系统
class LayaRenderSystem extends EntitySystem {
    private layaScene: LayaScene;
    
    constructor(layaScene: LayaScene) {
        super(Matcher.all(PositionComponent, SpriteComponent));
        this.layaScene = layaScene;
    }
    
    protected override process(entities: Entity[]): void {
        entities.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            const sprite = entity.getComponent(SpriteComponent)!;
            
            if (sprite.layaSprite) {
                sprite.layaSprite.x = pos.x;
                sprite.layaSprite.y = pos.y;
            }
        });
    }
}

// 使用方法
Laya.Scene.open("GameScene.scene", false, null, null, LayaECSGame);
```

### Cocos Creator

```typescript
import { Component as CocosComponent, _decorator, Node } from 'cc';
import { Core, Scene as ECSScene, EntityManager, EntitySystem } from '@esengine/ecs-framework';

const { ccclass, property } = _decorator;

@ccclass('ECSGameManager')
export class ECSGameManager extends CocosComponent {
    private ecsScene: ECSScene;
    private entityManager: EntityManager;
    
    start() {
        // 初始化ECS框架（简化方式）
        Core.create(true); // 启用调试模式
        // 完整配置示例: Core.create({ debug: true, enableEntitySystems: true, debugConfig: {...} })
        
        this.ecsScene = new ECSScene();
        this.ecsScene.name = "CocosGameScene";
        Core.scene = this.ecsScene;
        
        this.entityManager = new EntityManager();
        this.setupSystems();
    }
    
    update(deltaTime: number) {
        // 使用Cocos Creator的deltaTime更新ECS
        Core.update(deltaTime);
    }
    
    onDestroy() {
        if (this.ecsScene) {
            this.ecsScene.onDestroy();
        }
    }
    
    private setupSystems(): void {
        this.ecsScene.addEntityProcessor(new CocosRenderSystem(this.node));
        this.ecsScene.addEntityProcessor(new MovementSystem());
    }
    
    public getEntityManager(): EntityManager {
        return this.entityManager;
    }
}

// Cocos渲染系统
class CocosRenderSystem extends EntitySystem {
    private rootNode: Node;
    
    constructor(rootNode: Node) {
        super(Matcher.all(PositionComponent, SpriteComponent));
        this.rootNode = rootNode;
    }
    
    protected override process(entities: Entity[]): void {
        entities.forEach(entity => {
            const pos = entity.getComponent(PositionComponent)!;
            const sprite = entity.getComponent(SpriteComponent)!;
            
            if (sprite.cocosNode) {
                sprite.cocosNode.setPosition(pos.x, pos.y);
            }
        });
    }
}

// 将ECSGameManager脚本挂载到场景根节点
```

** Cocos Creator调试提示：**
为了获得最佳的ECS调试体验，建议安装我们的专用调试插件：
- 插件地址：[https://store.cocos.com/app/detail/7823](https://store.cocos.com/app/detail/7823)
- 支持Cocos Creator v3.0.0+
- 提供实体查看器、组件编辑器、系统监控等功能

### Node.js后端

```typescript
import { Core, Scene, EntityManager, EntitySystem, Time } from '@esengine/ecs-framework';

class ServerGameManager {
    private scene: Scene;
    private entityManager: EntityManager;
    private isRunning: boolean = false;
    private tickRate: number = 60; // 60 TPS
    private lastUpdate: number = Date.now();
    
    constructor() {
        // 初始化ECS框架（简化方式）
        Core.create(true); // 启用调试模式
        // 完整配置示例: Core.create({ debug: true, enableEntitySystems: true, debugConfig: {...} })
        
        this.scene = new Scene();
        this.scene.name = "ServerScene";
        Core.scene = this.scene;
        
        this.entityManager = new EntityManager();
        this.setupSystems();
    }
    
    public start(): void {
        this.isRunning = true;
        console.log(`游戏服务器启动，TPS: ${this.tickRate}`);
        this.gameLoop();
    }
    
    public stop(): void {
        this.isRunning = false;
    }
    
    private gameLoop(): void {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // 使用计算出的deltaTime更新ECS
        Core.update(deltaTime);
        
        const frameTime = 1000 / this.tickRate;
        const processingTime = Date.now() - now;
        const delay = Math.max(0, frameTime - processingTime);
        
        setTimeout(() => this.gameLoop(), delay);
    }
    
    private setupSystems(): void {
        this.scene.addEntityProcessor(new ServerMovementSystem());
        this.scene.addEntityProcessor(new NetworkSyncSystem());
        this.scene.addEntityProcessor(new AISystem());
    }
    
    public handlePlayerInput(playerId: string, input: any): void {
        const playerEntity = this.findPlayerEntity(playerId);
        if (playerEntity) {
            const inputComp = playerEntity.getComponent(InputComponent);
            if (inputComp) {
                inputComp.updateInput(input);
            }
        }
    }
    
    public getWorldState(): any {
        const entities = this.entityManager
            .query()
            .withAll(PositionComponent, NetworkComponent)
            .execute();
            
        return entities.map(entity => ({
            id: entity.id,
            position: entity.getComponent(PositionComponent),
        }));
    }
    
    private findPlayerEntity(playerId: string): Entity | null {
        const players = this.entityManager
            .query()
            .withAll(PlayerComponent)
            .execute();
            
        return players.find(player => 
            player.getComponent(PlayerComponent).playerId === playerId
        ) || null;
    }
}

// 启动服务器
const server = new ServerGameManager();
server.start();
```

### 原生浏览器

```typescript
import { Core, Scene, EntityManager, EntitySystem } from '@esengine/ecs-framework';

class BrowserGame {
    private scene: Scene;
    private entityManager: EntityManager;
    
    constructor() {
        // 初始化ECS框架（简化方式）
        Core.create(true); // 启用调试模式
        // 完整配置示例: Core.create({ debug: true, enableEntitySystems: true, debugConfig: {...} })
        
        this.scene = new Scene();
        this.scene.name = "BrowserScene";
        Core.scene = this.scene;
        
        this.entityManager = new EntityManager();
        this.setupSystems();
    }
    
    public start(): void {
        this.createEntities();
        this.gameLoop();
    }
    
    private gameLoop(): void {
        let lastTime = 0;
        const update = (currentTime: number) => {
            // 计算deltaTime并更新ECS（原生浏览器环境）
            const deltaTime = lastTime > 0 ? (currentTime - lastTime) / 1000 : 0.016;
            lastTime = currentTime;
            Core.update(deltaTime);
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }
    
    private setupSystems(): void {
        this.scene.addEntityProcessor(new MovementSystem());
        this.scene.addEntityProcessor(new RenderSystem());
    }
    
    private createEntities(): void {
        const player = this.entityManager.createEntity("Player");
        player.addComponent(new PositionComponent(400, 300));
        player.addComponent(new VelocityComponent(0, 0));
    }
}

const game = new BrowserGame();
game.start();
```

## 基础组件定义

```typescript
import { Component } from '@esengine/ecs-framework';

// 位置组件
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0] = args as [number?, number?];
        this.x = x;
        this.y = y;
    }
    
    public reset() {
        this.x = 0;
        this.y = 0;
    }
}

// 速度组件
class VelocityComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0] = args as [number?, number?];
        this.x = x;
        this.y = y;
    }
    
    public reset() {
        this.x = 0;
        this.y = 0;
    }
}

// 生命值组件
class HealthComponent extends Component {
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        const [maxHealth = 100] = args as [number?];
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
    
    public reset() {
        this.maxHealth = 100;
        this.currentHealth = 100;
    }
    
    public takeDamage(damage: number): void {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
    }
    
    public heal(amount: number): void {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
    
    public isDead(): boolean {
        return this.currentHealth <= 0;
    }
}
```

## 基础系统创建

```typescript
import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PositionComponent, VelocityComponent));
    }
    
    protected override process(entities: Entity[]): void {
        entities.forEach(entity => {
            const position = entity.getComponent(PositionComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            
            position.x += velocity.x * Time.deltaTime;
            position.y += velocity.y * Time.deltaTime;
        });
    }
}

class HealthSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(HealthComponent));
    }
    
    protected override process(entities: Entity[]): void {
        entities.forEach(entity => {
            const health = entity.getComponent(HealthComponent)!;
            if (health.currentHealth <= 0) {
                entity.destroy();
            }
        });
    }
}
```

## 实体管理

```typescript
// 创建实体
const player = entityManager.createEntity("Player");
player.addComponent(new PositionComponent(100, 100));
player.addComponent(new VelocityComponent(5, 0));
player.addComponent(new HealthComponent(100));

// 批量创建实体
const enemies = scene.createEntities(50, "Enemy");
enemies.forEach(enemy => {
    enemy.addComponent(new PositionComponent(Math.random() * 800, Math.random() * 600));
    enemy.addComponent(new HealthComponent(50));
});

// 查询实体
const movingEntities = entityManager
    .query()
    .withAll(PositionComponent, VelocityComponent)
    .execute();

const healthEntities = entityManager.getEntitiesWithComponent(HealthComponent);
const enemiesByTag = entityManager.getEntitiesByTag(2);
```

## 事件系统

推荐使用Scene的事件系统或EntityManager的事件系统：

```typescript
// 使用EntityManager的事件系统（推荐）
const eventBus = entityManager.eventBus;

// 监听ECS事件
eventBus.onEntityCreated((data) => {
    console.log(`实体创建: ${data.entityName}`);
});

eventBus.onComponentAdded((data) => {
    console.log(`组件添加: ${data.componentType}`);
});

// 发射自定义事件
eventBus.emit('player:died', { player: entity, score: 1000 });

// 使用装饰器自动注册事件监听器
import { EventHandler } from '@esengine/ecs-framework';

class GameSystem {
    @EventHandler('player:died')
    onPlayerDied(data: { player: Entity; score: number }) {
        console.log(`玩家死亡，得分: ${data.score}`);
    }
}
```

## 性能监控

```typescript
// 获取场景统计
const sceneStats = scene.getStats();
console.log('实体数量:', sceneStats.entityCount);
console.log('系统数量:', sceneStats.processorCount);

// 获取查询统计
const queryStats = scene.querySystem.getStats();
console.log('查询统计:', queryStats);
```

## 下一步

- [EntityManager 使用指南](entity-manager-example.md) - 详细了解实体管理器的高级功能
- [性能优化指南](performance-optimization.md) - 深入了解三大性能优化系统
- [核心概念](core-concepts.md) - 深入了解 ECS 架构和设计原理
- [查询系统使用指南](query-system-usage.md) - 学习高性能查询系统的详细用法 