# 快速入门

本指南将帮助您快速上手 ECS Framework，这是一个专业级的实体组件系统框架，采用现代化架构设计，专为高性能游戏开发打造。

## 安装

```bash
npm install @esengine/ecs-framework
```

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
        
        // 初始化ECS框架
        Core.create(true);
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
        this.ecsScene.update();
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
        super(Matcher.empty().all(PositionComponent, SpriteComponent));
        this.layaScene = layaScene;
    }
    
    protected process(entities: Entity[]): void {
        entities.forEach(entity => {
            const pos = entity.getComponent(PositionComponent);
            const sprite = entity.getComponent(SpriteComponent);
            
            if (pos && sprite && sprite.layaSprite) {
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
import { Component as CocosComponent, _decorator } from 'cc';
import { Core, Scene as ECSScene, EntityManager, EntitySystem } from '@esengine/ecs-framework';

const { ccclass, property } = _decorator;

@ccclass('ECSGameManager')
export class ECSGameManager extends CocosComponent {
    private ecsScene: ECSScene;
    private entityManager: EntityManager;
    
    start() {
        // 初始化ECS框架
        Core.create(true);
        this.ecsScene = new ECSScene();
        this.ecsScene.name = "CocosGameScene";
        Core.scene = this.ecsScene;
        
        this.entityManager = new EntityManager();
        this.setupSystems();
    }
    
    update(deltaTime: number) {
        // 在Cocos的update中更新ECS
        this.ecsScene.update();
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
        super(Matcher.empty().all(PositionComponent, SpriteComponent));
        this.rootNode = rootNode;
    }
    
    protected process(entities: Entity[]): void {
        entities.forEach(entity => {
            const pos = entity.getComponent(PositionComponent);
            const sprite = entity.getComponent(SpriteComponent);
            
            if (pos && sprite && sprite.cocosNode) {
                sprite.cocosNode.setPosition(pos.x, pos.y);
            }
        });
    }
}

// 将ECSGameManager脚本挂载到场景根节点
```

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
        Core.create(true);
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
        
        Time.update(deltaTime);
        this.scene.update();
        
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
        Core.create(true);
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
        const update = () => {
            this.scene.update();
            requestAnimationFrame(update);
        };
        update();
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
    
    constructor(x: number = 0, y: number = 0) {
        super();
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
    
    constructor(x: number = 0, y: number = 0) {
        super();
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
    
    constructor(maxHealth: number = 100) {
        super();
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
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }
    
    protected process(entities: Entity[]): void {
        const movingEntities = this.scene.querySystem.queryAll(PositionComponent, VelocityComponent);
        
        movingEntities.entities.forEach(entity => {
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            
            if (position && velocity) {
                position.x += velocity.x * Time.deltaTime;
                position.y += velocity.y * Time.deltaTime;
            }
        });
    }
}

class HealthSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }
    
    protected process(entities: Entity[]): void {
        const healthEntities = this.scene.querySystem.queryAll(HealthComponent);
        
        healthEntities.entities.forEach(entity => {
            const health = entity.getComponent(HealthComponent);
            if (health && health.currentHealth <= 0) {
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

```typescript
import { Core, CoreEvents } from '@esengine/ecs-framework';

// 监听框架事件
Core.emitter.addObserver(CoreEvents.frameUpdated, this.onFrameUpdate, this);

// 发射自定义事件
Core.emitter.emit("playerDied", { player: entity, score: 1000 });

// 移除监听
Core.emitter.removeObserver(CoreEvents.frameUpdated, this.onFrameUpdate);
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