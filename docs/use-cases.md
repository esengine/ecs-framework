# ECS框架使用场景示例

本文档展示ECS框架在不同类型游戏中的具体应用案例。

## 目录

1. [小型休闲游戏](#小型休闲游戏)
2. [中型动作游戏](#中型动作游戏)
3. [大型策略游戏](#大型策略游戏)
4. [MMO游戏](#mmo游戏)

## 小型休闲游戏

### 场景：简单的飞机大战游戏

```typescript
import { 
    Scene, 
    EntityManager, 
    Entity, 
    Component, 
    EntitySystem,
    Matcher 
} from '@esengine/ecs-framework';

// 组件定义
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class PlayerComponent extends Component {}
class EnemyComponent extends Component {}
class BulletComponent extends Component {}

// 游戏管理器
class PlaneWarGame {
    private scene: Scene;
    private entityManager: EntityManager;
    
    constructor() {
        this.scene = new Scene();
        this.entityManager = new EntityManager();
        this.setupGame();
    }
    
    private setupGame(): void {
        // 创建玩家
        const player = this.entityManager.createEntity("Player");
        player.addComponent(new PositionComponent(400, 500));
        player.addComponent(new VelocityComponent(0, 0));
        player.addComponent(new PlayerComponent());
        player.tag = 1; // 玩家标签
        
        // 创建敌人
        this.spawnEnemies(5);
        
        // 添加系统
        this.scene.addEntityProcessor(new MovementSystem());
        this.scene.addEntityProcessor(new CollisionSystem());
        this.scene.addEntityProcessor(new CleanupSystem());
    }
    
    private spawnEnemies(count: number): void {
        const enemies = this.scene.createEntities(count, "Enemy");
        enemies.forEach((enemy, index) => {
            enemy.addComponent(new PositionComponent(
                Math.random() * 800,
                -50
            ));
            enemy.addComponent(new VelocityComponent(0, 100));
            enemy.addComponent(new EnemyComponent());
            enemy.tag = 2; // 敌人标签
        });
    }
    
    public update(): void {
        this.scene.update();
    }
}

// 移动系统
class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }
    
    protected process(entities: Entity[]): void {
        const movingEntities = this.scene.querySystem.queryAll(
            PositionComponent, 
            VelocityComponent
        );
        
        movingEntities.entities.forEach(entity => {
            const pos = entity.getComponent(PositionComponent);
            const vel = entity.getComponent(VelocityComponent);
            
            pos.x += vel.x * Time.deltaTime;
            pos.y += vel.y * Time.deltaTime;
        });
    }
}

## 中型动作游戏

### 场景：2D平台跳跃游戏

```typescript
// 更复杂的组件
class HealthComponent extends Component {
    constructor(
        public maxHealth: number = 100,
        public currentHealth: number = 100
    ) {
        super();
    }
}

class AnimationComponent extends Component {
    constructor(
        public currentAnimation: string = "idle",
        public frameIndex: number = 0,
        public frameTime: number = 0
    ) {
        super();
    }
}

class PhysicsComponent extends Component {
    constructor(
        public mass: number = 1,
        public friction: number = 0.8,
        public isGrounded: boolean = false
    ) {
        super();
    }
}

// 平台游戏管理器
class PlatformGame {
    private scene: Scene;
    private entityManager: EntityManager;
    
    constructor() {
        this.scene = new Scene();
        this.entityManager = new EntityManager();
        this.setupGame();
    }
    
    private setupGame(): void {
        // 创建玩家
        this.createPlayer();
        
        // 创建敌人
        this.createEnemies(10);
        
        // 创建平台
        this.createPlatforms();
        
        // 添加系统（按更新顺序）
        this.scene.addEntityProcessor(new InputSystem()).updateOrder = 10;
        this.scene.addEntityProcessor(new PhysicsSystem()).updateOrder = 20;
        this.scene.addEntityProcessor(new AnimationSystem()).updateOrder = 30;
        this.scene.addEntityProcessor(new CombatSystem()).updateOrder = 40;
        this.scene.addEntityProcessor(new RenderSystem()).updateOrder = 50;
    }
    
    private createPlayer(): void {
        const player = this.entityManager.createEntity("Player");
        player.addComponent(new PositionComponent(100, 300));
        player.addComponent(new VelocityComponent(0, 0));
        player.addComponent(new HealthComponent(100));
        player.addComponent(new AnimationComponent("idle"));
        player.addComponent(new PhysicsComponent(1, 0.8));
        player.tag = 1;
    }
    
    private createEnemies(count: number): void {
        const enemies = this.scene.createEntities(count, "Enemy");
        enemies.forEach((enemy, index) => {
            enemy.addComponent(new PositionComponent(
                200 + index * 100,
                300
            ));
            enemy.addComponent(new VelocityComponent(0, 0));
            enemy.addComponent(new HealthComponent(50));
            enemy.addComponent(new AnimationComponent("patrol"));
            enemy.addComponent(new PhysicsComponent(0.8, 0.9));
            enemy.tag = 2;
        });
    }
    
    private createPlatforms(): void {
        const platforms = this.scene.createEntities(5, "Platform");
        platforms.forEach((platform, index) => {
            platform.addComponent(new PositionComponent(
                index * 200,
                400 + Math.random() * 100
            ));
            platform.tag = 3; // 平台标签
        });
    }
}

## 大型策略游戏

### 场景：即时战略游戏

```typescript
// 策略游戏组件
class UnitComponent extends Component {
    constructor(
        public unitType: string,
        public playerId: number,
        public level: number = 1
    ) {
        super();
    }
}

class AIComponent extends Component {
    constructor(
        public state: string = "idle",
        public target: Entity | null = null,
        public lastDecisionTime: number = 0
    ) {
        super();
    }
}

class ResourceComponent extends Component {
    constructor(
        public gold: number = 0,
        public wood: number = 0,
        public food: number = 0
    ) {
        super();
    }
}

// 策略游戏管理器
class StrategyGame {
    private scene: Scene;
    private entityManager: EntityManager;
    private players: Map<number, Entity> = new Map();
    
    constructor() {
        this.scene = new Scene();
        this.entityManager = new EntityManager();
        this.setupGame();
    }
    
    private setupGame(): void {
        // 创建玩家
        this.createPlayers(4);
        
        // 为每个玩家创建初始单位
        this.players.forEach((player, playerId) => {
            this.createInitialUnits(playerId, 10);
        });
        
        // 添加系统
        this.scene.addEntityProcessor(new AISystem()).updateOrder = 10;
        this.scene.addEntityProcessor(new CombatSystem()).updateOrder = 20;
        this.scene.addEntityProcessor(new ResourceSystem()).updateOrder = 30;
        this.scene.addEntityProcessor(new UnitManagementSystem()).updateOrder = 40;
    }
    
    private createPlayers(count: number): void {
        for (let i = 0; i < count; i++) {
            const player = this.entityManager.createEntity(`Player_${i}`);
            player.addComponent(new ResourceComponent(1000, 500, 100));
            player.tag = 10 + i; // 玩家标签从10开始
            this.players.set(i, player);
        }
    }
    
    private createInitialUnits(playerId: number, count: number): void {
        const units = this.scene.createEntities(count, `Unit_${playerId}`);
        
        units.forEach((unit, index) => {
            unit.addComponent(new PositionComponent(
                playerId * 200 + Math.random() * 100,
                playerId * 200 + Math.random() * 100
            ));
            unit.addComponent(new UnitComponent("warrior", playerId));
            unit.addComponent(new HealthComponent(100));
            unit.addComponent(new AIComponent());
            unit.tag = 20 + playerId; // 单位标签
        });
    }
    
    // 批量单位操作
    public createArmy(playerId: number, unitType: string, count: number): Entity[] {
        const units = this.scene.createEntities(count, `${unitType}_${playerId}`);
        
        // 批量配置组件
        units.forEach(unit => {
            unit.addComponent(new UnitComponent(unitType, playerId));
            unit.addComponent(new HealthComponent(100));
            unit.addComponent(new PositionComponent(
                Math.random() * 1000,
                Math.random() * 1000
            ));
            unit.tag = 20 + playerId;
        });
        
        return units;
    }
    
    // 查询玩家的所有单位
    public getPlayerUnits(playerId: number): Entity[] {
        return this.entityManager
            .query()
            .withAll(UnitComponent)
            .withTag(20 + playerId)
            .execute();
    }
    
    // 查询特定类型的单位
    public getUnitsByType(unitType: string): Entity[] {
        return this.entityManager
            .query()
            .withAll(UnitComponent)
            .where(entity => {
                const unit = entity.getComponent(UnitComponent);
                return unit && unit.unitType === unitType;
            })
            .execute();
    }
}

// AI系统
class AISystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(AIComponent, UnitComponent));
    }
    
    protected process(entities: Entity[]): void {
        const aiUnits = this.entityManager
            .query()
            .withAll(AIComponent, UnitComponent)
            .execute();
        
        aiUnits.forEach(unit => {
            this.processAI(unit);
        });
    }
    
    private processAI(unit: Entity): void {
        const ai = unit.getComponent(AIComponent);
        const unitComp = unit.getComponent(UnitComponent);
        
        if (!ai || !unitComp) return;
        
        // 简单AI逻辑
        switch (ai.state) {
            case "idle":
                this.findTarget(unit);
                break;
            case "attack":
                this.attackTarget(unit);
                break;
            case "move":
                this.moveToTarget(unit);
                break;
        }
    }
    
    private findTarget(unit: Entity): void {
        const unitComp = unit.getComponent(UnitComponent);
        if (!unitComp) return;
        
        // 查找敌方单位
        const enemies = this.entityManager
            .query()
            .withAll(UnitComponent)
            .where(entity => {
                const enemyUnit = entity.getComponent(UnitComponent);
                return enemyUnit && enemyUnit.playerId !== unitComp.playerId;
            })
            .execute();
        
        if (enemies.length > 0) {
            const ai = unit.getComponent(AIComponent);
            if (ai) {
                ai.target = enemies[0];
                ai.state = "attack";
            }
        }
    }
    
    private attackTarget(unit: Entity): void {
        // 攻击逻辑
    }
    
    private moveToTarget(unit: Entity): void {
        // 移动逻辑
    }
}

## MMO游戏

### 场景：大型多人在线游戏

```typescript
// MMO特有组件
class NetworkComponent extends Component {
    constructor(
        public playerId: string,
        public isLocal: boolean = false,
        public lastSyncTime: number = 0
    ) {
        super();
    }
}

class InventoryComponent extends Component {
    public items: Map<string, number> = new Map();
    
    addItem(itemId: string, count: number): void {
        const current = this.items.get(itemId) || 0;
        this.items.set(itemId, current + count);
    }
}

class GuildComponent extends Component {
    constructor(
        public guildId: string,
        public rank: string = "member"
    ) {
        super();
    }
}

// MMO游戏管理器
class MMOGame {
    private scene: Scene;
    private entityManager: EntityManager;
    private localPlayerId: string;
    
    constructor(localPlayerId: string) {
        this.scene = new Scene();
        this.entityManager = new EntityManager();
        this.localPlayerId = localPlayerId;
        this.setupGame();
    }
    
    private setupGame(): void {
        // 添加MMO特有系统
        this.scene.addEntityProcessor(new NetworkSyncSystem()).updateOrder = 5;
        this.scene.addEntityProcessor(new PlayerSystem()).updateOrder = 10;
        this.scene.addEntityProcessor(new NPCSystem()).updateOrder = 15;
        this.scene.addEntityProcessor(new GuildSystem()).updateOrder = 20;
        this.scene.addEntityProcessor(new InventorySystem()).updateOrder = 25;
    }
    
    // 创建玩家角色
    public createPlayer(playerId: string, isLocal: boolean = false): Entity {
        const player = this.entityManager.createEntity(`Player_${playerId}`);
        player.addComponent(new PositionComponent(0, 0));
        player.addComponent(new HealthComponent(1000));
        player.addComponent(new NetworkComponent(playerId, isLocal));
        player.addComponent(new InventoryComponent());
        player.tag = isLocal ? 1 : 2; // 本地玩家标签1，远程玩家标签2
        
        return player;
    }
    
    // 批量创建NPC
    public createNPCs(count: number): Entity[] {
        const npcs = this.scene.createEntities(count, "NPC");
        
        npcs.forEach((npc, index) => {
            npc.addComponent(new PositionComponent(
                Math.random() * 2000,
                Math.random() * 2000
            ));
            npc.addComponent(new HealthComponent(500));
            npc.addComponent(new AIComponent("patrol"));
            npc.tag = 3; // NPC标签
        });
        
        return npcs;
    }
    
    // 查询附近的玩家
    public getNearbyPlayers(centerX: number, centerY: number, radius: number): Entity[] {
        return this.entityManager
            .query()
            .withAll(PositionComponent, NetworkComponent)
            .where(entity => {
                const pos = entity.getComponent(PositionComponent);
                if (!pos) return false;
                
                const distance = Math.sqrt(
                    Math.pow(pos.x - centerX, 2) + 
                    Math.pow(pos.y - centerY, 2)
                );
                return distance <= radius;
            })
            .execute();
    }
    
    // 查询公会成员
    public getGuildMembers(guildId: string): Entity[] {
        return this.entityManager
            .query()
            .withAll(GuildComponent, NetworkComponent)
            .where(entity => {
                const guild = entity.getComponent(GuildComponent);
                return guild && guild.guildId === guildId;
            })
            .execute();
    }
    
    // 获取在线玩家统计
    public getOnlinePlayerStats(): any {
        const allPlayers = this.entityManager.getEntitiesWithComponent(NetworkComponent);
        const localPlayers = this.entityManager.getEntitiesByTag(1);
        const remotePlayers = this.entityManager.getEntitiesByTag(2);
        
        return {
            total: allPlayers.length,
            local: localPlayers.length,
            remote: remotePlayers.length
        };
    }
}

// 网络同步系统
class NetworkSyncSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(NetworkComponent));
    }
    
    protected process(entities: Entity[]): void {
        const networkEntities = this.entityManager.getEntitiesWithComponent(NetworkComponent);
        
        networkEntities.forEach(entity => {
            const network = entity.getComponent(NetworkComponent);
            if (!network || network.isLocal) return;
            
            // 同步远程实体数据
            this.syncRemoteEntity(entity);
        });
    }
    
    private syncRemoteEntity(entity: Entity): void {
        // 网络同步逻辑
        const network = entity.getComponent(NetworkComponent);
        if (!network) return;
        
        const currentTime = Date.now();
        if (currentTime - network.lastSyncTime > 100) { // 100ms同步一次
            // 发送同步数据
            network.lastSyncTime = currentTime;
        }
    }
}

## 性能优化建议

### 小型游戏（< 1000实体）
- 使用简单的查询方法
- 不需要复杂的优化
- 重点关注代码可读性

### 中型游戏（1000-10000实体）
- 使用标签查询优化性能
- 实现基础的对象池
- 缓存频繁查询的结果

### 大型游戏（10000-100000实体）
- 使用时间分片处理大量实体
- 实现空间分区优化邻近查询
- 使用批量操作减少单次调用开销

### MMO游戏（100000+实体）
- 实现分区管理，只处理相关区域的实体
- 使用异步处理避免阻塞主线程
- 实现智能缓存和预加载机制

## 总结

ECS框架的灵活性使其能够适应各种规模的游戏开发需求：

1. **小型游戏**：简单直接，快速开发
2. **中型游戏**：平衡性能和复杂度
3. **大型游戏**：充分利用优化特性
4. **MMO游戏**：处理海量实体和复杂交互

选择合适的架构模式和优化策略，可以让ECS框架在不同场景下都发挥最佳性能。 