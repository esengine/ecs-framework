# 组件设计最佳实践指南

组件是ECS架构的核心，设计良好的组件是构建高质量游戏的基础。本指南将教你如何设计出清晰、高效、可维护的组件。

## 组件设计原则

### 1. 数据为主，逻辑为辅

**核心理念：** 组件主要存储数据，复杂逻辑放在系统中处理。

```typescript
// ✅ 好的设计：主要是数据
class HealthComponent extends Component {
    public maxHealth: number;
    public currentHealth: number;
    public regenRate: number = 0;
    public lastDamageTime: number = 0;
    
    constructor(maxHealth: number = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
    
    // 简单的辅助方法是可以的
    isDead(): boolean {
        return this.currentHealth <= 0;
    }
    
    getHealthPercentage(): number {
        return this.currentHealth / this.maxHealth;
    }
}

// ❌ 不好的设计：包含太多逻辑
class BadHealthComponent extends Component {
    public maxHealth: number;
    public currentHealth: number;
    
    takeDamage(damage: number) {
        this.currentHealth -= damage;
        
        // 这些逻辑应该在系统中处理
        if (this.currentHealth <= 0) {
            this.entity.destroy();           // 销毁逻辑
            this.playDeathSound();           // 音效逻辑
            this.createDeathEffect();       // 特效逻辑
            this.updatePlayerScore(100);    // 分数逻辑
        }
    }
}
```

### 2. 单一职责原则

每个组件只负责一个方面的数据。

```typescript
// ✅ 好的设计：单一职责
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public maxSpeed: number = 100;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

class RotationComponent extends Component {
    public angle: number = 0;
    public angularVelocity: number = 0;
    
    constructor(angle: number = 0) {
        super();
        this.angle = angle;
    }
}

// ❌ 不好的设计：职责混乱
class TransformComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public velocityX: number = 0;
    public velocityY: number = 0;
    public angle: number = 0;
    public scale: number = 1;
    public health: number = 100;    // 和变换无关
    public ammo: number = 30;       // 和变换无关
}
```

### 3. 组合优于继承

使用多个小组件组合，而不是大而全的组件继承。

```typescript
// ✅ 好的设计：组合方式
class Player {
    constructor(scene: Scene) {
        const player = scene.createEntity("Player");
        
        // 通过组合不同组件实现功能
        player.addComponent(new PositionComponent(100, 100));
        player.addComponent(new VelocityComponent());
        player.addComponent(new HealthComponent(100));
        player.addComponent(new PlayerInputComponent());
        player.addComponent(new WeaponComponent());
        player.addComponent(new InventoryComponent());
        
        return player;
    }
}

// 创建不同类型的实体很容易
class Enemy {
    constructor(scene: Scene) {
        const enemy = scene.createEntity("Enemy");
        
        // 复用相同的组件，但组合不同
        enemy.addComponent(new PositionComponent(200, 200));
        enemy.addComponent(new VelocityComponent());
        enemy.addComponent(new HealthComponent(50));
        enemy.addComponent(new AIComponent());     // 不同：AI而不是玩家输入
        enemy.addComponent(new WeaponComponent()); // 相同：都有武器
        // 没有库存组件
        
        return enemy;
    }
}

// ❌ 不好的设计：继承方式
class GameObject {
    public x: number;
    public y: number;
    public health: number;
    // ... 很多属性
}

class PlayerGameObject extends GameObject {
    public input: InputData;
    public inventory: Item[];
    // 强制继承了不需要的属性
}

class EnemyGameObject extends GameObject {
    public ai: AIData;
    // 继承了不需要的库存等属性
}
```

## 常见组件类型和设计

### 1. 数据组件（Data Components）

纯数据存储，没有或很少有方法。

```typescript
// 位置信息
class PositionComponent extends Component {
    public x: number;
    public y: number;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
    
    // 简单的辅助方法
    distanceTo(other: PositionComponent): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    set(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

// 统计信息
class StatsComponent extends Component {
    public strength: number = 10;
    public agility: number = 10;
    public intelligence: number = 10;
    public vitality: number = 10;
    
    // 计算派生属性
    getMaxHealth(): number {
        return this.vitality * 10;
    }
    
    getDamage(): number {
        return this.strength * 2;
    }
    
    getMoveSpeed(): number {
        return this.agility * 5;
    }
}

// 渲染信息
class SpriteComponent extends Component {
    public textureName: string;
    public width: number;
    public height: number;
    public tint: number = 0xFFFFFF;
    public alpha: number = 1.0;
    public visible: boolean = true;
    
    constructor(textureName: string, width: number = 0, height: number = 0) {
        super();
        this.textureName = textureName;
        this.width = width;
        this.height = height;
    }
}
```

### 2. 标记组件（Tag Components）

用于标识实体状态或类型的空组件。

```typescript
// 标记组件通常不包含数据
class PlayerComponent extends Component {
    // 空组件，仅用于标记这是玩家实体
}

class EnemyComponent extends Component {
    // 空组件，仅用于标记这是敌人实体
}

class DeadComponent extends Component {
    // 标记实体已死亡
    public deathTime: number;
    
    constructor() {
        super();
        this.deathTime = Time.totalTime;
    }
}

class InvincibleComponent extends Component {
    // 标记实体无敌状态
    public duration: number;
    
    constructor(duration: number = 2.0) {
        super();
        this.duration = duration;
    }
}

// 使用标记组件进行查询
class PlayerSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PlayerComponent));
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是玩家实体
        for (const entity of entities) {
            // 处理玩家逻辑
        }
    }
}

class EnemySystem extends EntitySystem {
    constructor() {
        super(Matcher.all(EnemyComponent));
    }
    
    protected process(entities: Entity[]): void {
        // entities已经是敌人实体
        for (const entity of entities) {
            // 处理敌人逻辑
        }
    }
}
```

### 3. 行为组件（Behavior Components）

包含简单行为逻辑的组件。

```typescript
class WeaponComponent extends Component {
    public damage: number;
    public fireRate: number;
    public ammo: number;
    public maxAmmo: number;
    public lastFireTime: number = 0;
    
    constructor(damage: number = 10, fireRate: number = 0.5) {
        super();
        this.damage = damage;
        this.fireRate = fireRate;
        this.maxAmmo = 30;
        this.ammo = this.maxAmmo;
    }
    
    canFire(): boolean {
        return this.ammo > 0 && 
               Time.totalTime - this.lastFireTime >= this.fireRate;
    }
    
    fire(): boolean {
        if (this.canFire()) {
            this.ammo--;
            this.lastFireTime = Time.totalTime;
            return true;
        }
        return false;
    }
    
    reload() {
        this.ammo = this.maxAmmo;
    }
    
    getAmmoPercentage(): number {
        return this.ammo / this.maxAmmo;
    }
}

class InventoryComponent extends Component {
    private items: Map<string, number> = new Map();
    public maxCapacity: number = 20;
    
    addItem(itemType: string, quantity: number = 1): boolean {
        if (this.getTotalItems() + quantity > this.maxCapacity) {
            return false;
        }
        
        const current = this.items.get(itemType) || 0;
        this.items.set(itemType, current + quantity);
        return true;
    }
    
    removeItem(itemType: string, quantity: number = 1): boolean {
        const current = this.items.get(itemType) || 0;
        if (current < quantity) {
            return false;
        }
        
        const newAmount = current - quantity;
        if (newAmount === 0) {
            this.items.delete(itemType);
        } else {
            this.items.set(itemType, newAmount);
        }
        return true;
    }
    
    hasItem(itemType: string, quantity: number = 1): boolean {
        const current = this.items.get(itemType) || 0;
        return current >= quantity;
    }
    
    getTotalItems(): number {
        let total = 0;
        this.items.forEach(quantity => total += quantity);
        return total;
    }
    
    getItems(): Map<string, number> {
        return new Map(this.items); // 返回副本
    }
}
```

## 组件通信和依赖

### 1. 组件间通信

组件间不应直接通信，通过系统或事件系统进行通信。

```typescript
// ✅ 好的设计：通过事件通信
class HealthComponent extends Component {
    public currentHealth: number;
    public maxHealth: number;
    
    takeDamage(damage: number) {
        this.currentHealth -= damage;
        
        // 发送事件，让其他系统响应
        // 注意：需要在实际使用中获取EntityManager实例
        // 示例：entityManager.eventBus.emit('health:damaged', {...});
        
        if (this.currentHealth <= 0) {
            // 示例：entityManager.eventBus.emit('health:died', {...});
            console.log('实体死亡');
        }
    }
}

// 其他组件响应事件
class AnimationComponent extends Component {
    onAddedToEntity() {
        super.onAddedToEntity();
        
        // 监听受伤事件（需要在实际使用中获取EntityManager实例）
        // 示例：entityManager.eventBus.on('health:damaged', this.onDamaged, { context: this });
    }
    
    onRemovedFromEntity() {
        // 事件监听会在组件移除时自动清理
        // 如需手动清理，保存listenerId并调用eventBus.off()
        super.onRemovedFromEntity();
    }
    
    private onDamaged(data: any) {
        if (data.entity === this.entity) {
            this.playHurtAnimation();
        }
    }
}

// ❌ 不好的设计：直接依赖其他组件
class BadHealthComponent extends Component {
    takeDamage(damage: number) {
        this.currentHealth -= damage;
        
        // 直接操作其他组件
        const animation = this.entity.getComponent(AnimationComponent);
        if (animation) {
            animation.playHurtAnimation(); // 紧耦合
        }
        
        const sound = this.entity.getComponent(SoundComponent);
        if (sound) {
            sound.playHurtSound(); // 紧耦合
        }
    }
}
```

### 2. 可选依赖

有时组件需要其他组件配合工作，但应该优雅处理缺失的情况。

```typescript
class MovementComponent extends Component {
    public speed: number = 100;
    
    update() {
        // 可选依赖：输入组件
        const input = this.entity.getComponent(InputComponent);
        const velocity = this.entity.getComponent(VelocityComponent);
        
        if (input && velocity) {
            // 根据输入设置速度
            velocity.x = input.horizontal * this.speed;
            velocity.y = input.vertical * this.speed;
        }
        
        // 可选依赖：AI组件
        const ai = this.entity.getComponent(AIComponent);
        if (ai && velocity && !input) {
            // AI控制移动（如果没有输入）
            velocity.x = ai.moveDirection.x * this.speed;
            velocity.y = ai.moveDirection.y * this.speed;
        }
    }
}
```

## 组件性能优化

### 1. 对象池优化

对于频繁创建/销毁的组件，使用对象池。

```typescript
class PooledBulletComponent extends Component {
    public damage: number = 10;
    public speed: number = 200;
    public direction: { x: number; y: number } = { x: 0, y: 0 };
    public lifetime: number = 5.0;
    private currentLifetime: number = 0;
    
    // 重置组件状态，用于对象池
    reset() {
        this.damage = 10;
        this.speed = 200;
        this.direction.set(0, 0);
        this.lifetime = 5.0;
        this.currentLifetime = 0;
    }
    
    // 配置子弹
    configure(damage: number, speed: number, direction: { x: number; y: number }) {
        this.damage = damage;
        this.speed = speed;
        this.direction = direction.copy();
    }
    
    update() {
        this.currentLifetime += Time.deltaTime;
        
        if (this.currentLifetime >= this.lifetime) {
            // 生命周期结束，回收到对象池
            BulletPool.release(this.entity);
        }
    }
}

// 对象池管理
class BulletPool {
    private static pool: Entity[] = [];
    
    static get(): Entity {
        if (this.pool.length > 0) {
            const bullet = this.pool.pop()!;
            bullet.enabled = true;
            return bullet;
        } else {
            return this.createBullet();
        }
    }
    
    static release(bullet: Entity) {
        bullet.enabled = false;
        bullet.getComponent(PooledBulletComponent)?.reset();
        this.pool.push(bullet);
    }
    
    private static createBullet(): Entity {
        const bullet = Core.scene.createEntity("Bullet");
        bullet.addComponent(new PooledBulletComponent());
        bullet.addComponent(new PositionComponent());
        bullet.addComponent(new VelocityComponent());
        return bullet;
    }
}
```

### 2. 数据紧凑性

保持组件数据紧凑，避免不必要的对象分配。

```typescript
// ✅ 好的设计：紧凑的数据结构
class ParticleComponent extends Component {
    // 使用基本类型，避免对象分配
    public x: number = 0;
    public y: number = 0;
    public velocityX: number = 0;
    public velocityY: number = 0;
    public life: number = 1.0;
    public maxLife: number = 1.0;
    public size: number = 1.0;
    public color: number = 0xFFFFFF;
    
    // 计算属性，避免存储冗余数据
    get alpha(): number {
        return this.life / this.maxLife;
    }
}

// ❌ 不好的设计：过多对象分配
class BadParticleComponent extends Component {
    public position: { x: number; y: number } = { x: 0, y: 0 };     // 对象分配
    public velocity: { x: number; y: number } = { x: 0, y: 0 };     // 对象分配
    public color: Color = new Color();            // 对象分配
    public transform: Transform = new Transform(); // 对象分配
    
    // 冗余数据
    public alpha: number = 1.0;
    public life: number = 1.0;
    public maxLife: number = 1.0;
}
```

## 组件调试和测试

### 1. 调试友好的组件

```typescript
class DebugFriendlyComponent extends Component {
    public someValue: number = 0;
    private debugName: string;
    
    constructor(debugName: string = "Unknown") {
        super();
        this.debugName = debugName;
    }
    
    // 提供有用的调试信息
    toString(): string {
        return `${this.constructor.name}(${this.debugName}): value=${this.someValue}`;
    }
    
    // 验证组件状态
    validate(): boolean {
        if (this.someValue < 0) {
            console.warn(`${this} has invalid value: ${this.someValue}`);
            return false;
        }
        return true;
    }
    
    // 获取调试信息
    getDebugInfo(): any {
        return {
            name: this.debugName,
            value: this.someValue,
            entityId: this.entity?.id,
            isValid: this.validate()
        };
    }
}
```

### 2. 单元测试

```typescript
// 组件测试示例
describe('HealthComponent', () => {
    let healthComponent: HealthComponent;
    
    beforeEach(() => {
        healthComponent = new HealthComponent(100);
    });
    
    test('初始状态正确', () => {
        expect(healthComponent.currentHealth).toBe(100);
        expect(healthComponent.maxHealth).toBe(100);
        expect(healthComponent.isDead()).toBe(false);
    });
    
    test('受伤功能正确', () => {
        healthComponent.takeDamage(30);
        expect(healthComponent.currentHealth).toBe(70);
        expect(healthComponent.getHealthPercentage()).toBe(0.7);
    });
    
    test('死亡检测正确', () => {
        healthComponent.takeDamage(100);
        expect(healthComponent.isDead()).toBe(true);
    });
});
```

## 常见问题和最佳实践

### Q: 组件应该有多大？

A: 组件应该尽可能小和专注。如果一个组件有超过10个字段，考虑拆分。

### Q: 组件可以包含方法吗？

A: 可以，但应该是简单的辅助方法。复杂逻辑应该在系统中处理。

### Q: 如何处理组件之间的依赖？

A: 
1. 优先使用组合而不是依赖
2. 通过事件系统通信
3. 在系统中处理组件间的协调

### Q: 什么时候使用继承？

A: 很少使用。只在有明确的"是一个"关系时使用，如：

```typescript
abstract class ColliderComponent extends Component {
    abstract checkCollision(other: ColliderComponent): boolean;
}

class CircleColliderComponent extends ColliderComponent {
    public radius: number;
    
    checkCollision(other: ColliderComponent): boolean {
        // 圆形碰撞检测
    }
}

class BoxColliderComponent extends ColliderComponent {
    public width: number;
    public height: number;
    
    checkCollision(other: ColliderComponent): boolean {
        // 方形碰撞检测
    }
}
```

遵循这些原则，你就能设计出高质量、易维护的组件系统！ 