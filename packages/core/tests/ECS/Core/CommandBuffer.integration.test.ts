import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Entity } from '../../../src/ECS/Entity';

// 测试组件
class HealthComponent extends Component {
    public health: number;
    public maxHealth: number;
    
    constructor(health: number = 100, maxHealth: number = 100) {
        super();
        this.health = health;
        this.maxHealth = maxHealth;
    }
}

class DamageComponent extends Component {
    public damage: number;
    
    constructor(damage: number = 10) {
        super();
        this.damage = damage;
    }
}

class DeadComponent extends Component {
    constructor() {
        super();
    }
}

// 测试系统 - 处理伤害并使用CommandBuffer
class DamageSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(HealthComponent, DamageComponent));
    }

    protected override process(entities: Entity[]): void {
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent)!;
            const damage = entity.getComponent(DamageComponent)!;
            
            // 直接修改数据字段（不走CommandBuffer）
            health.health -= damage.damage;
            
            // 结构性变更使用CommandBuffer
            if (health.health <= 0) {
                // 添加死亡组件
                this.scene!.commandBuffer.addComponent(entity.id, DeadComponent);
                // 移除伤害组件
                this.scene!.commandBuffer.removeComponent(entity.id, DamageComponent);
            } else {
                // 移除伤害组件（伤害只作用一次）
                this.scene!.commandBuffer.removeComponent(entity.id, DamageComponent);
            }
        }
    }
}

// 清理死亡实体的系统
class DeathSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(DeadComponent));
    }

    protected override process(entities: Entity[]): void {
        for (const entity of entities) {
            // 销毁死亡的实体
            this.scene!.commandBuffer.destroyEntity(entity.id);
        }
    }
}

// 生成器系统 - 定期创建新实体
class SpawnerSystem extends EntitySystem {
    private spawnTimer: number = 0;
    private spawnInterval: number = 60; // 60帧生成一次
    private spawnCount: number = 0;

    constructor() {
        super(Matcher.empty()); // 不需要匹配特定实体
    }

    protected override process(): void {
        this.spawnTimer++;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnCount++;
            
            // 使用CommandBuffer创建新实体
            this.scene!.commandBuffer.createEntity(`Spawned_${this.spawnCount}`);
            
            // 限制生成数量
            if (this.spawnCount >= 5) {
                this.scene!.commandBuffer.removeComponent(-1, HealthComponent); // 这个操作会失败，但不会崩溃
            }
        }
    }
}

describe('CommandBuffer集成测试 - 系统协作场景', () => {
    let scene: Scene;
    let damageSystem: DamageSystem;
    let deathSystem: DeathSystem;
    let spawnerSystem: SpawnerSystem;

    beforeEach(() => {
        scene = new Scene();
        damageSystem = new DamageSystem();
        deathSystem = new DeathSystem();
        spawnerSystem = new SpawnerSystem();
        
        scene.addSystem(damageSystem);
        scene.addSystem(deathSystem);
        scene.addSystem(spawnerSystem);
    });

    test('伤害系统应该正确处理实体生命值和状态变更', () => {
        // 创建测试实体
        const entity1 = scene.createEntity('Warrior');
        entity1.addComponent(new HealthComponent(50, 100));
        entity1.addComponent(new DamageComponent(20));
        
        const entity2 = scene.createEntity('Mage');
        entity2.addComponent(new HealthComponent(30, 80));
        entity2.addComponent(new DamageComponent(40)); // 足以致命
        
        expect(entity1.hasComponent(DamageComponent)).toBe(true);
        expect(entity2.hasComponent(DamageComponent)).toBe(true);
        expect(entity1.hasComponent(DeadComponent)).toBe(false);
        expect(entity2.hasComponent(DeadComponent)).toBe(false);
        
        // 执行一帧更新
        scene.update();
        
        // 检查数据字段变更（直接生效）
        expect(entity1.getComponent(HealthComponent)?.health).toBe(30);
        expect(entity2.getComponent(HealthComponent)?.health).toBe(-10);
        
        // 检查结构性变更（通过CommandBuffer延迟生效）
        expect(entity1.hasComponent(DamageComponent)).toBe(false); // 已移除
        expect(entity2.hasComponent(DamageComponent)).toBe(false); // 已移除
        expect(entity1.hasComponent(DeadComponent)).toBe(false);   // 未死亡
        expect(entity2.hasComponent(DeadComponent)).toBe(true);    // 已死亡
    });

    test('死亡系统应该清理死亡实体', () => {
        // 创建已死亡的实体
        const deadEntity = scene.createEntity('DeadEntity');
        deadEntity.addComponent(new HealthComponent(0, 100));
        deadEntity.addComponent(new DeadComponent());
        
        const aliveEntity = scene.createEntity('AliveEntity');
        aliveEntity.addComponent(new HealthComponent(50, 100));
        
        const initialCount = scene.entities.count;
        expect(scene.findEntity('DeadEntity')).not.toBeNull();
        
        // 执行更新
        scene.update();
        
        // 死亡实体应该被移除
        expect(scene.entities.count).toBe(initialCount - 1);
        expect(scene.findEntity('DeadEntity')).toBeNull();
        expect(scene.findEntity('AliveEntity')).not.toBeNull();
    });

    test('生成器系统应该定期创建新实体', () => {
        const initialCount = scene.entities.count;
        
        // 模拟多帧更新
        for (let frame = 0; frame < 180; frame++) { // 3次生成周期
            scene.update();
        }
        
        // 应该生成了3个新实体
        expect(scene.entities.count).toBe(initialCount + 3);
        expect(scene.findEntity('Spawned_1')).not.toBeNull();
        expect(scene.findEntity('Spawned_2')).not.toBeNull();
        expect(scene.findEntity('Spawned_3')).not.toBeNull();
    });

    test('复杂场景：伤害→死亡→清理的完整流程', () => {
        // 创建一个即将死亡的实体
        const dyingEntity = scene.createEntity('DyingEntity');
        dyingEntity.addComponent(new HealthComponent(10, 100));
        dyingEntity.addComponent(new DamageComponent(15)); // 致命伤害
        
        const entityId = dyingEntity.id;
        const initialCount = scene.entities.count;
        
        expect(scene.findEntityById(entityId)).not.toBeNull();
        
        // 第一帧：处理伤害，添加死亡标记
        scene.update();
        
        let entity = scene.findEntityById(entityId);
        expect(entity).not.toBeNull(); // 实体还在
        expect(entity?.hasComponent(DeadComponent)).toBe(true); // 但已标记死亡
        expect(entity?.getComponent(HealthComponent)?.health).toBe(-5); // 生命值为负
        
        // 第二帧：清理死亡实体
        scene.update();
        
        // 实体应该被彻底移除
        expect(scene.findEntityById(entityId)).toBeNull();
        expect(scene.entities.count).toBe(initialCount - 1);
    });

    test('多系统协作的复杂场景', () => {
        // 创建多个不同状态的实体
        const entities = [
            { name: 'Tank', health: 100, damage: 10 },
            { name: 'Glass Cannon', health: 20, damage: 50 },
            { name: 'Healer', health: 60, damage: 30 },
            { name: 'Berserker', health: 80, damage: 80 } // 自杀式攻击
        ];
        
        for (const entityData of entities) {
            const entity = scene.createEntity(entityData.name);
            entity.addComponent(new HealthComponent(entityData.health, entityData.health));
            entity.addComponent(new DamageComponent(entityData.damage));
        }
        
        const initialCount = scene.entities.count;
        
        // 执行多帧更新，观察系统协作
        const frames = 300; // 5个生成周期
        for (let frame = 0; frame < frames; frame++) {
            scene.update();
            
            // 记录中间状态用于调试
            if (frame % 60 === 0) {
                const aliveCount = scene.entities.count;
                const deadEntities = scene.querySystem.queryAll(DeadComponent).entities.length;
                console.log(`帧 ${frame}: 存活实体 ${aliveCount}, 死亡实体 ${deadEntities}`);
            }
        }
        
        // 验证最终状态
        const finalCount = scene.entities.count;
        const spawnedEntities = scene.entities.buffer.filter(e => e.name.startsWith('Spawned_'));
        
        // 应该有生成的实体
        expect(spawnedEntities.length).toBe(5);
        
        // 原始实体根据伤害情况可能死亡
        const survivingOriginalEntities = scene.entities.buffer.filter(e => 
            entities.some(data => data.name === e.name)
        );
        
        console.log(`最终状态: 总实体数 ${finalCount}, 生成实体 ${spawnedEntities.length}, 存活原始实体 ${survivingOriginalEntities.length}`);
        
        // 基本合理性检查
        expect(finalCount).toBeGreaterThan(0);
        expect(finalCount).toBeLessThanOrEqual(initialCount + 5); // 最多原始+生成的实体
    });

    test('CommandBuffer统计信息在系统协作中的表现', () => {
        // 创建一些实体
        for (let i = 0; i < 3; i++) {
            const entity = scene.createEntity(`Entity_${i}`);
            entity.addComponent(new HealthComponent(25, 100));
            entity.addComponent(new DamageComponent(30)); // 足以致命
        }
        
        const stats1 = scene.commandBuffer.getStats();
        expect(stats1.totalProcessed).toBe(0);
        expect(stats1.applyCount).toBe(0);
        
        // 执行几帧更新
        for (let frame = 0; frame < 5; frame++) {
            scene.update();
        }
        
        const stats2 = scene.commandBuffer.getStats();
        
        // 应该有操作被处理
        expect(stats2.totalProcessed).toBeGreaterThan(0);
        expect(stats2.applyCount).toBeGreaterThan(0);
        expect(stats2.pendingOps).toBe(0); // 所有操作都应该被处理完
        
        console.log('CommandBuffer统计信息:', stats2);
    });
});