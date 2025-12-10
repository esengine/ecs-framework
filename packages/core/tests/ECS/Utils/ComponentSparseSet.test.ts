import { ComponentSparseSet } from '../../../src/ECS/Utils/ComponentSparseSet';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { Scene } from '../../../src/ECS/Scene';
import { ECSComponent } from '../../../src/ECS/Decorators';

// 测试组件类
@ECSComponent('SparseSet_PositionComponent')
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

@ECSComponent('SparseSet_VelocityComponent')
class VelocityComponent extends Component {
    constructor(public dx: number = 0, public dy: number = 0) {
        super();
    }
}

@ECSComponent('SparseSet_HealthComponent')
class HealthComponent extends Component {
    constructor(public health: number = 100, public maxHealth: number = 100) {
        super();
    }
}

@ECSComponent('SparseSet_RenderComponent')
class RenderComponent extends Component {
    constructor(public visible: boolean = true) {
        super();
    }
}

describe('ComponentSparseSet', () => {
    let componentSparseSet: ComponentSparseSet;
    let entity1: Entity;
    let entity2: Entity;
    let entity3: Entity;
    let scene: Scene;

    beforeEach(() => {
        componentSparseSet = new ComponentSparseSet();
        scene = new Scene();

        entity1 = scene.createEntity('entity1');
        entity1.addComponent(new PositionComponent(10, 20));
        entity1.addComponent(new VelocityComponent(1, 2));

        entity2 = scene.createEntity('entity2');
        entity2.addComponent(new PositionComponent(30, 40));
        entity2.addComponent(new HealthComponent(80, 100));

        entity3 = scene.createEntity('entity3');
        entity3.addComponent(new VelocityComponent(3, 4));
        entity3.addComponent(new HealthComponent(50, 100));
        entity3.addComponent(new RenderComponent(true));
    });

    describe('基本实体操作', () => {
        it('应该能添加实体', () => {
            componentSparseSet.addEntity(entity1);
            
            expect(componentSparseSet.size).toBe(1);
            expect(componentSparseSet.getAllEntities()).toContain(entity1);
        });

        it('应该能移除实体', () => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
            
            componentSparseSet.removeEntity(entity1);
            
            expect(componentSparseSet.size).toBe(1);
            expect(componentSparseSet.getAllEntities()).not.toContain(entity1);
            expect(componentSparseSet.getAllEntities()).toContain(entity2);
        });

        it('应该处理重复添加实体', () => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity1);
            
            expect(componentSparseSet.size).toBe(1);
        });

        it('应该处理移除不存在的实体', () => {
            componentSparseSet.removeEntity(entity1);
            
            expect(componentSparseSet.size).toBe(0);
        });
    });

    describe('单组件查询', () => {
        beforeEach(() => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
            componentSparseSet.addEntity(entity3);
        });

        it('应该能查询Position组件', () => {
            const entities = componentSparseSet.queryByComponent(PositionComponent);
            
            expect(entities.size).toBe(2);
            expect(entities.has(entity1)).toBe(true);
            expect(entities.has(entity2)).toBe(true);
            expect(entities.has(entity3)).toBe(false);
        });

        it('应该能查询Velocity组件', () => {
            const entities = componentSparseSet.queryByComponent(VelocityComponent);
            
            expect(entities.size).toBe(2);
            expect(entities.has(entity1)).toBe(true);
            expect(entities.has(entity2)).toBe(false);
            expect(entities.has(entity3)).toBe(true);
        });

        it('应该能查询Health组件', () => {
            const entities = componentSparseSet.queryByComponent(HealthComponent);
            
            expect(entities.size).toBe(2);
            expect(entities.has(entity1)).toBe(false);
            expect(entities.has(entity2)).toBe(true);
            expect(entities.has(entity3)).toBe(true);
        });

        it('应该能查询Render组件', () => {
            const entities = componentSparseSet.queryByComponent(RenderComponent);
            
            expect(entities.size).toBe(1);
            expect(entities.has(entity3)).toBe(true);
        });
    });

    describe('多组件AND查询', () => {
        beforeEach(() => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
            componentSparseSet.addEntity(entity3);
        });

        it('应该能查询Position+Velocity组件', () => {
            const entities = componentSparseSet.queryMultipleAnd([PositionComponent, VelocityComponent]);
            
            expect(entities.size).toBe(1);
            expect(entities.has(entity1)).toBe(true);
        });

        it('应该能查询Position+Health组件', () => {
            const entities = componentSparseSet.queryMultipleAnd([PositionComponent, HealthComponent]);
            
            expect(entities.size).toBe(1);
            expect(entities.has(entity2)).toBe(true);
        });

        it('应该能查询Velocity+Health组件', () => {
            const entities = componentSparseSet.queryMultipleAnd([VelocityComponent, HealthComponent]);
            
            expect(entities.size).toBe(1);
            expect(entities.has(entity3)).toBe(true);
        });

        it('应该能查询三个组件', () => {
            const entities = componentSparseSet.queryMultipleAnd([
                VelocityComponent, 
                HealthComponent, 
                RenderComponent
            ]);
            
            expect(entities.size).toBe(1);
            expect(entities.has(entity3)).toBe(true);
        });

        it('应该处理不存在的组合', () => {
            const entities = componentSparseSet.queryMultipleAnd([
                PositionComponent, 
                VelocityComponent, 
                HealthComponent, 
                RenderComponent
            ]);
            
            expect(entities.size).toBe(0);
        });
    });

    describe('多组件OR查询', () => {
        beforeEach(() => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
            componentSparseSet.addEntity(entity3);
        });

        it('应该能查询Position或Velocity组件', () => {
            const entities = componentSparseSet.queryMultipleOr([PositionComponent, VelocityComponent]);
            
            expect(entities.size).toBe(3);
            expect(entities.has(entity1)).toBe(true);
            expect(entities.has(entity2)).toBe(true);
            expect(entities.has(entity3)).toBe(true);
        });

        it('应该能查询Health或Render组件', () => {
            const entities = componentSparseSet.queryMultipleOr([HealthComponent, RenderComponent]);
            
            expect(entities.size).toBe(2);
            expect(entities.has(entity1)).toBe(false);
            expect(entities.has(entity2)).toBe(true);
            expect(entities.has(entity3)).toBe(true);
        });

        it('应该处理单个组件的OR查询', () => {
            const entities = componentSparseSet.queryMultipleOr([RenderComponent]);
            
            expect(entities.size).toBe(1);
            expect(entities.has(entity3)).toBe(true);
        });
    });

    describe('组件检查', () => {
        beforeEach(() => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
        });

        it('应该能检查实体是否有组件', () => {
            expect(componentSparseSet.hasComponent(entity1, PositionComponent)).toBe(true);
            expect(componentSparseSet.hasComponent(entity1, VelocityComponent)).toBe(true);
            expect(componentSparseSet.hasComponent(entity1, HealthComponent)).toBe(false);
            
            expect(componentSparseSet.hasComponent(entity2, PositionComponent)).toBe(true);
            expect(componentSparseSet.hasComponent(entity2, HealthComponent)).toBe(true);
            expect(componentSparseSet.hasComponent(entity2, VelocityComponent)).toBe(false);
        });

        it('应该处理不存在的实体', () => {
            expect(componentSparseSet.hasComponent(entity3, PositionComponent)).toBe(false);
        });
    });

    describe('位掩码操作', () => {
        beforeEach(() => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
        });

        it('应该能获取实体的组件位掩码', () => {
            const mask1 = componentSparseSet.getEntityMask(entity1);
            const mask2 = componentSparseSet.getEntityMask(entity2);
            
            expect(mask1).toBeDefined();
            expect(mask2).toBeDefined();
            expect(mask1).not.toEqual(mask2);
        });

        it('应该处理不存在的实体', () => {
            const mask = componentSparseSet.getEntityMask(entity3);
            expect(mask).toBeUndefined();
        });
    });

    describe('遍历操作', () => {
        beforeEach(() => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
        });

        it('应该能遍历所有实体', () => {
            const entities: Entity[] = [];
            const masks: any[] = [];
            const indices: number[] = [];
            
            componentSparseSet.forEach((entity, mask, index) => {
                entities.push(entity);
                masks.push(mask);
                indices.push(index);
            });
            
            expect(entities.length).toBe(2);
            expect(masks.length).toBe(2);
            expect(indices).toEqual([0, 1]);
            expect(entities).toContain(entity1);
            expect(entities).toContain(entity2);
        });
    });

    describe('工具方法', () => {
        it('应该能检查空状态', () => {
            expect(componentSparseSet.isEmpty).toBe(true);
            
            componentSparseSet.addEntity(entity1);
            expect(componentSparseSet.isEmpty).toBe(false);
        });

        it('应该能清空数据', () => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
            
            componentSparseSet.clear();
            
            expect(componentSparseSet.size).toBe(0);
            expect(componentSparseSet.isEmpty).toBe(true);
        });

        it('应该提供内存统计', () => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
            
            const stats = componentSparseSet.getMemoryStats();
            
            expect(stats.entitiesMemory).toBeGreaterThan(0);
            expect(stats.masksMemory).toBeGreaterThan(0);
            expect(stats.mappingsMemory).toBeGreaterThan(0);
            expect(stats.totalMemory).toBe(
                stats.entitiesMemory + stats.masksMemory + stats.mappingsMemory
            );
        });

        it('应该能验证数据结构完整性', () => {
            componentSparseSet.addEntity(entity1);
            componentSparseSet.addEntity(entity2);
            componentSparseSet.removeEntity(entity1);
            
            expect(componentSparseSet.validate()).toBe(true);
        });
    });

    describe('边界情况', () => {
        it('应该处理空查询', () => {
            componentSparseSet.addEntity(entity1);
            
            const andResult = componentSparseSet.queryMultipleAnd([]);
            const orResult = componentSparseSet.queryMultipleOr([]);
            
            expect(andResult.size).toBe(0);
            expect(orResult.size).toBe(0);
        });

        it('应该处理未注册的组件类型', () => {
            class UnknownComponent extends Component {}
            
            componentSparseSet.addEntity(entity1);
            
            const entities = componentSparseSet.queryByComponent(UnknownComponent);
            expect(entities.size).toBe(0);
        });

        it('应该正确处理实体组件变化', () => {
            // 添加实体
            componentSparseSet.addEntity(entity1);
            expect(componentSparseSet.hasComponent(entity1, PositionComponent)).toBe(true);
            
            // 移除组件后重新添加实体
            entity1.removeComponentByType(PositionComponent);
            componentSparseSet.addEntity(entity1);
            
            expect(componentSparseSet.hasComponent(entity1, PositionComponent)).toBe(false);
            expect(componentSparseSet.hasComponent(entity1, VelocityComponent)).toBe(true);
        });
    });

    describe('性能测试', () => {
        it('应该处理大量实体操作', () => {
            const entities: Entity[] = [];
            
            // 创建大量实体
            for (let i = 0; i < 1000; i++) {
                const entity = scene.createEntity(`entity${i}`);
                entity.addComponent(new PositionComponent(i, i));

                if (i % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }
                if (i % 3 === 0) {
                    entity.addComponent(new HealthComponent(100, 100));
                }

                entities.push(entity);
                componentSparseSet.addEntity(entity);
            }
            
            expect(componentSparseSet.size).toBe(1000);
            
            // 查询性能测试
            const positionEntities = componentSparseSet.queryByComponent(PositionComponent);
            expect(positionEntities.size).toBe(1000);
            
            const velocityEntities = componentSparseSet.queryByComponent(VelocityComponent);
            expect(velocityEntities.size).toBe(500);
            
            const healthEntities = componentSparseSet.queryByComponent(HealthComponent);
            expect(healthEntities.size).toBeGreaterThan(300);
            
            // AND查询
            const posVelEntities = componentSparseSet.queryMultipleAnd([PositionComponent, VelocityComponent]);
            expect(posVelEntities.size).toBe(500);
        });
    });
});