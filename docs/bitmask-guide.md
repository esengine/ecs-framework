# 位掩码使用指南

本文档详细解释ECS框架中位掩码的概念、原理和使用方法。

## 目录

1. [什么是位掩码](#什么是位掩码)
2. [位掩码的优势](#位掩码的优势)
3. [基础使用方法](#基础使用方法)
4. [高级位掩码操作](#高级位掩码操作)
5. [实际应用场景](#实际应用场景)
6. [性能优化技巧](#性能优化技巧)

## 什么是位掩码

### 基本概念

位掩码（BitMask）是一种使用二进制位来表示状态或属性的技术。在ECS框架中，每个组件类型对应一个二进制位，实体的组件组合可以用一个数字来表示。

### 简单例子

假设我们有以下组件：
- PositionComponent → 位置 0 (二进制: 001)
- VelocityComponent → 位置 1 (二进制: 010)  
- HealthComponent → 位置 2 (二进制: 100)

那么一个同时拥有Position和Health组件的实体，其位掩码就是：
```
001 (Position) + 100 (Health) = 101 (二进制) = 5 (十进制)
```

### 可视化理解

```typescript
// 组件类型对应的位位置
PositionComponent  → 位置0 → 2^0 = 1   → 二进制: 001
VelocityComponent  → 位置1 → 2^1 = 2   → 二进制: 010
HealthComponent    → 位置2 → 2^2 = 4   → 二进制: 100
RenderComponent    → 位置3 → 2^3 = 8   → 二进制: 1000

// 实体的组件组合示例
实体A: Position + Velocity        → 001 + 010 = 011 (二进制) = 3 (十进制)
实体B: Position + Health          → 001 + 100 = 101 (二进制) = 5 (十进制)  
实体C: Position + Velocity + Health → 001 + 010 + 100 = 111 (二进制) = 7 (十进制)
```

## 位掩码的优势

### 1. 极快的查询速度

```typescript
// 传统方式：需要遍历组件列表
function hasComponents(entity, componentTypes) {
    for (const type of componentTypes) {
        if (!entity.hasComponent(type)) {
            return false;
        }
    }
    return true;
}

// 位掩码方式：一次位运算即可
function hasComponentsMask(entityMask, requiredMask) {
    return (entityMask & requiredMask) === requiredMask;
}
```

### 2. 内存效率

```typescript
// 一个bigint可以表示64个组件的组合状态
// 相比存储组件列表，内存使用量大大减少

const entity = scene.createEntity("Player");
entity.addComponent(new PositionComponent());
entity.addComponent(new HealthComponent());

// 获取位掩码（只是一个数字）
const mask = entity.componentMask; // bigint类型
console.log(`位掩码: ${mask}`); // 输出: 5 (二进制: 101)
```

### 3. 批量操作优化

```typescript
// 可以快速筛选大量实体
const entities = scene.getAllEntities();
const requiredMask = BigInt(0b101); // Position + Health

const filteredEntities = entities.filter(entity => 
    (entity.componentMask & requiredMask) === requiredMask
);
```

## 基础使用方法

### 获取实体的位掩码

```typescript
import { Scene, Entity, Component } from '@esengine/ecs-framework';

// 创建组件
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(public maxHealth: number = 100) {
        super();
    }
}

// 创建实体并添加组件
const scene = new Scene();
const entity = scene.createEntity("Player");

console.log(`初始位掩码: ${entity.componentMask}`); // 0

entity.addComponent(new PositionComponent(100, 200));
console.log(`添加Position后: ${entity.componentMask}`); // 可能是 1

entity.addComponent(new HealthComponent(100));
console.log(`添加Health后: ${entity.componentMask}`); // 可能是 5

// 查看二进制表示
console.log(`二进制表示: ${entity.componentMask.toString(2)}`);
```

### 手动检查位掩码

```typescript
// 检查实体是否拥有特定组件组合
function checkEntityComponents(entity: Entity) {
    const mask = entity.componentMask;
    
    // 将位掩码转换为二进制字符串查看
    const binaryString = mask.toString(2).padStart(8, '0');
    console.log(`实体组件状态: ${binaryString}`);
    
    // 分析每一位
    console.log(`位0 (Position): ${(mask & 1n) !== 0n ? '有' : '无'}`);
    console.log(`位1 (Velocity): ${(mask & 2n) !== 0n ? '有' : '无'}`);
    console.log(`位2 (Health): ${(mask & 4n) !== 0n ? '有' : '无'}`);
    console.log(`位3 (Render): ${(mask & 8n) !== 0n ? '有' : '无'}`);
}
```

## 高级位掩码操作

### 使用BitMaskOptimizer

框架提供了BitMaskOptimizer类来简化位掩码操作：

```typescript
import { BitMaskOptimizer } from '@esengine/ecs-framework';

// 获取优化器实例
const optimizer = BitMaskOptimizer.getInstance();

// 注册组件类型（建议在游戏初始化时进行）
optimizer.registerComponentType('PositionComponent');
optimizer.registerComponentType('VelocityComponent');
optimizer.registerComponentType('HealthComponent');
optimizer.registerComponentType('RenderComponent');

// 创建单个组件的掩码
const positionMask = optimizer.createSingleComponentMask('PositionComponent');
console.log(`Position掩码: ${positionMask} (二进制: ${positionMask.toString(2)})`);

// 创建组合掩码
const movementMask = optimizer.createCombinedMask(['PositionComponent', 'VelocityComponent']);
console.log(`Movement掩码: ${movementMask} (二进制: ${movementMask.toString(2)})`);

// 检查实体是否匹配掩码
const entity = scene.createEntity("TestEntity");
entity.addComponent(new PositionComponent());
entity.addComponent(new VelocityComponent());

const hasMovementComponents = optimizer.maskContainsAllComponents(
    entity.componentMask, 
    ['PositionComponent', 'VelocityComponent']
);
console.log(`实体拥有移动组件: ${hasMovementComponents}`);
```

### 位掩码分析工具

```typescript
// 分析位掩码的实用函数
class MaskAnalyzer {
    private optimizer = BitMaskOptimizer.getInstance();
    
    // 分析实体的组件组合
    analyzeEntity(entity: Entity): void {
        const mask = entity.componentMask;
        const componentNames = this.optimizer.maskToComponentNames(mask);
        const componentCount = this.optimizer.getComponentCount(mask);
        
        console.log(`实体 ${entity.name} 分析:`);
        console.log(`- 位掩码: ${mask} (二进制: ${mask.toString(2)})`);
        console.log(`- 组件数量: ${componentCount}`);
        console.log(`- 组件列表: ${componentNames.join(', ')}`);
    }
    
    // 比较两个实体的组件差异
    compareEntities(entityA: Entity, entityB: Entity): void {
        const maskA = entityA.componentMask;
        const maskB = entityB.componentMask;
        
        const commonMask = maskA & maskB;
        const onlyInA = maskA & ~maskB;
        const onlyInB = maskB & ~maskA;
        
        console.log(`实体比较:`);
        console.log(`- 共同组件: ${this.optimizer.maskToComponentNames(commonMask).join(', ')}`);
        console.log(`- 仅在A中: ${this.optimizer.maskToComponentNames(onlyInA).join(', ')}`);
        console.log(`- 仅在B中: ${this.optimizer.maskToComponentNames(onlyInB).join(', ')}`);
    }
    
    // 查找具有特定组件组合的实体
    findEntitiesWithMask(entities: Entity[], requiredComponents: string[]): Entity[] {
        const requiredMask = this.optimizer.createCombinedMask(requiredComponents);
        
        return entities.filter(entity => 
            (entity.componentMask & requiredMask) === requiredMask
        );
    }
}

// 使用示例
const analyzer = new MaskAnalyzer();
analyzer.analyzeEntity(entity);
```

## 实际应用场景

### 1. 高性能实体查询

```typescript
class GameSystem {
    private optimizer = BitMaskOptimizer.getInstance();
    private movementMask: bigint;
    private combatMask: bigint;
    
    constructor() {
        // 预计算常用掩码
        this.movementMask = this.optimizer.createCombinedMask([
            'PositionComponent', 'VelocityComponent'
        ]);
        
        this.combatMask = this.optimizer.createCombinedMask([
            'PositionComponent', 'HealthComponent', 'WeaponComponent'
        ]);
    }
    
    // 快速查找移动实体
    findMovingEntities(entities: Entity[]): Entity[] {
        return entities.filter(entity => 
            (entity.componentMask & this.movementMask) === this.movementMask
        );
    }
    
    // 快速查找战斗单位
    findCombatUnits(entities: Entity[]): Entity[] {
        return entities.filter(entity => 
            (entity.componentMask & this.combatMask) === this.combatMask
        );
    }
}
```

### 2. 实体分类和管理

```typescript
class EntityClassifier {
    private optimizer = BitMaskOptimizer.getInstance();
    
    // 定义实体类型掩码
    private readonly ENTITY_TYPES = {
        PLAYER: this.optimizer.createCombinedMask([
            'PositionComponent', 'HealthComponent', 'InputComponent'
        ]),
        ENEMY: this.optimizer.createCombinedMask([
            'PositionComponent', 'HealthComponent', 'AIComponent'
        ]),
        PROJECTILE: this.optimizer.createCombinedMask([
            'PositionComponent', 'VelocityComponent', 'DamageComponent'
        ]),
        PICKUP: this.optimizer.createCombinedMask([
            'PositionComponent', 'PickupComponent'
        ])
    };
    
    // 根据组件组合判断实体类型
    classifyEntity(entity: Entity): string {
        const mask = entity.componentMask;
        
        for (const [type, typeMask] of Object.entries(this.ENTITY_TYPES)) {
            if ((mask & typeMask) === typeMask) {
                return type;
            }
        }
        
        return 'UNKNOWN';
    }
    
    // 批量分类实体
    classifyEntities(entities: Entity[]): Map<string, Entity[]> {
        const classified = new Map<string, Entity[]>();
        
        for (const entity of entities) {
            const type = this.classifyEntity(entity);
            if (!classified.has(type)) {
                classified.set(type, []);
            }
            classified.get(type)!.push(entity);
        }
        
        return classified;
    }
}
```

## 性能优化技巧

### 1. 预计算常用掩码

```typescript
class MaskCache {
    private optimizer = BitMaskOptimizer.getInstance();
    
    // 预计算游戏中常用的组件组合
    public readonly COMMON_MASKS = {
        RENDERABLE: this.optimizer.createCombinedMask([
            'PositionComponent', 'RenderComponent'
        ]),
        MOVABLE: this.optimizer.createCombinedMask([
            'PositionComponent', 'VelocityComponent'
        ]),
        LIVING: this.optimizer.createCombinedMask([
            'HealthComponent'
        ]),
        INTERACTIVE: this.optimizer.createCombinedMask([
            'PositionComponent', 'ColliderComponent'
        ])
    };
    
    constructor() {
        // 预计算常用组合以提升性能
        this.optimizer.precomputeCommonMasks([
            ['PositionComponent', 'RenderComponent'],
            ['PositionComponent', 'VelocityComponent'],
            ['PositionComponent', 'HealthComponent', 'WeaponComponent']
        ]);
    }
}
```

### 2. 位掩码调试工具

```typescript
// 位掩码调试工具
class MaskDebugger {
    private optimizer = BitMaskOptimizer.getInstance();
    
    // 可视化位掩码
    visualizeMask(mask: bigint, maxBits: number = 16): string {
        const binary = mask.toString(2).padStart(maxBits, '0');
        const components = this.optimizer.maskToComponentNames(mask);
        
        let visualization = `位掩码: ${mask} (二进制: ${binary})\n`;
        visualization += `组件: ${components.join(', ')}\n`;
        visualization += `可视化: `;
        
        for (let i = maxBits - 1; i >= 0; i--) {
            const bit = (mask & (1n << BigInt(i))) !== 0n ? '1' : '0';
            visualization += bit;
            if (i % 4 === 0 && i > 0) visualization += ' ';
        }
        
        return visualization;
    }
}
```

## 最佳实践

### 1. 组件注册

```typescript
// 在游戏初始化时注册所有组件类型
function initializeComponentTypes() {
    const optimizer = BitMaskOptimizer.getInstance();
    
    // 按使用频率注册（常用的组件分配较小的位位置）
    optimizer.registerComponentType('PositionComponent');    // 位置0
    optimizer.registerComponentType('VelocityComponent');    // 位置1
    optimizer.registerComponentType('HealthComponent');      // 位置2
    optimizer.registerComponentType('RenderComponent');      // 位置3
    // ... 其他组件
}
```

### 2. 掩码缓存管理

```typescript
// 定期清理掩码缓存以避免内存泄漏
setInterval(() => {
    const optimizer = BitMaskOptimizer.getInstance();
    const stats = optimizer.getCacheStats();
    
    // 如果缓存过大，清理一部分
    if (stats.size > 1000) {
        optimizer.clearCache();
        console.log('位掩码缓存已清理');
    }
}, 60000); // 每分钟检查一次
```

## 总结

位掩码是ECS框架中的核心优化技术，它提供了：

1. **极快的查询速度** - 位运算比遍历快数百倍
2. **内存效率** - 用一个数字表示复杂的组件组合
3. **批量操作优化** - 可以快速处理大量实体
4. **灵活的查询构建** - 支持复杂的组件组合查询

通过理解和正确使用位掩码，可以显著提升游戏的性能表现。记住要在游戏初始化时注册组件类型，预计算常用掩码，并合理管理缓存。 