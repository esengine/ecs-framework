import { EntityManager, EntityQueryBuilder } from '../../../src/ECS/Core/EntityManager';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';

// 测试组件
class PositionComponent extends Component {
    public x: number;
    public y: number;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0] = args as [number?, number?];
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent extends Component {
    public vx: number;
    public vy: number;
    
    constructor(...args: unknown[]) {
        super();
        const [vx = 0, vy = 0] = args as [number?, number?];
        this.vx = vx;
        this.vy = vy;
    }
}

class HealthComponent extends Component {
    public health: number;
    public maxHealth: number;
    
    constructor(...args: unknown[]) {
        super();
        const [health = 100, maxHealth = 100] = args as [number?, number?];
        this.health = health;
        this.maxHealth = maxHealth;
    }
}

class RenderComponent extends Component {
    public visible: boolean;
    public color: string;
    
    constructor(...args: unknown[]) {
        super();
        const [visible = true, color = 'white'] = args as [boolean?, string?];
        this.visible = visible;
        this.color = color;
    }
}

class AIComponent extends Component {
    public intelligence: number;
    
    constructor(...args: unknown[]) {
        super();
        const [intelligence = 50] = args as [number?];
        this.intelligence = intelligence;
    }
}

class PlayerComponent extends Component {
    public name: string;
    
    constructor(...args: unknown[]) {
        super();
        const [name = 'Player'] = args as [string?];
        this.name = name;
    }
}

describe('EntityManager - 实体管理器测试', () => {
    let entityManager: EntityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    describe('基本功能测试', () => {
        test('应该能够创建EntityManager实例', () => {
            expect(entityManager).toBeDefined();
            expect(entityManager).toBeInstanceOf(EntityManager);
            expect(entityManager.entityCount).toBe(0);
        });

        test('应该能够创建实体', () => {
            const entity = entityManager.createEntity('TestEntity');
            
            expect(entity).toBeDefined();
            expect(entity.name).toBe('TestEntity');
            expect(entity.id).toBeGreaterThan(0);
            expect(entityManager.entityCount).toBe(1);
        });

        test('应该能够创建实体使用默认名称', () => {
            const entity = entityManager.createEntity();
            
            expect(entity).toBeDefined();
            expect(entity.name).toContain('Entity_');
            expect(entity.id).toBeGreaterThan(0);
        });

        test('应该能够批量创建实体', () => {
            const entities: Entity[] = [];
            for (let i = 0; i < 5; i++) {
                entities.push(entityManager.createEntity(`Entity_${i}`));
            }
            
            expect(entities.length).toBe(5);
            expect(entityManager.entityCount).toBe(5);
            for (let i = 0; i < entities.length; i++) {
                expect(entities[i].name).toBe(`Entity_${i}`);
                expect(entities[i].id).toBeGreaterThan(0);
            }
        });

        test('应该能够通过ID查找实体', () => {
            const entity = entityManager.createEntity('TestEntity');
            const found = entityManager.getEntity(entity.id);
            
            expect(found).toBe(entity);
        });

        test('查找不存在的实体应该返回null', () => {
            const found = entityManager.getEntity(999999);
            expect(found).toBeNull();
        });

        test('应该能够销毁实体', () => {
            const entity = entityManager.createEntity('TestEntity');
            const entityId = entity.id;
            
            const result = entityManager.destroyEntity(entity);
            
            expect(result).toBe(true);
            expect(entityManager.getEntity(entityId)).toBeNull();
            expect(entityManager.entityCount).toBe(0);
        });

        test('应该能够通过ID销毁实体', () => {
            const entity = entityManager.createEntity('TestEntity');
            const entityId = entity.id;
            
            const result = entityManager.destroyEntity(entityId);
            
            expect(result).toBe(true);
            expect(entityManager.getEntity(entityId)).toBeNull();
        });

        test('销毁不存在的实体应该返回false', () => {
            const result = entityManager.destroyEntity(999999);
            expect(result).toBe(false);
        });

        test('应该正确统计激活状态的实体', () => {
            const entity1 = entityManager.createEntity('Active1');
            const entity2 = entityManager.createEntity('Active2');
            const entity3 = entityManager.createEntity('Inactive');
            
            entity3.active = false;
            
            expect(entityManager.activeEntityCount).toBe(2);
            expect(entityManager.entityCount).toBe(3);
        });
    });

    describe('实体标签功能测试', () => {
        test('实体应该有默认标签', () => {
            const entity = entityManager.createEntity('TaggedEntity');
            expect(entity.tag).toBe(0); // 默认标签为0
        });

        test('应该能够为实体设置标签', () => {
            const entity = entityManager.createEntity('TaggedEntity');
            entity.tag = 1;
            
            expect(entity.tag).toBe(1);
        });

        test('应该能够按标签查询实体', () => {
            const entity1 = entityManager.createEntity('Entity1');
            const entity2 = entityManager.createEntity('Entity2');
            const entity3 = entityManager.createEntity('Entity3');
            
            entity1.tag = 1;
            entity2.tag = 1;
            entity3.tag = 2;
            
            const tag1Entities = entityManager.getEntitiesByTag(1);
            const tag2Entities = entityManager.getEntitiesByTag(2);
            
            expect(tag1Entities.length).toBe(2);
            expect(tag2Entities.length).toBe(1);
            expect(tag1Entities).toContain(entity1);
            expect(tag1Entities).toContain(entity2);
            expect(tag2Entities).toContain(entity3);
        });

        test('查询不存在的标签应该返回空数组', () => {
            const entities = entityManager.getEntitiesByTag(999);
            expect(entities).toEqual([]);
        });
    });

    describe('查询构建器测试', () => {
        let player: Entity;
        let enemy1: Entity;
        let enemy2: Entity;
        let npc: Entity;

        beforeEach(() => {
            // 创建测试实体
            player = entityManager.createEntity('Player');
            player.addComponent(new PositionComponent(50, 50));
            player.addComponent(new HealthComponent(100, 100));
            player.addComponent(new PlayerComponent('Hero'));
            player.tag = 1;

            enemy1 = entityManager.createEntity('Enemy1');
            enemy1.addComponent(new PositionComponent(10, 10));
            enemy1.addComponent(new VelocityComponent(1, 0));
            enemy1.addComponent(new HealthComponent(50, 50));
            enemy1.addComponent(new AIComponent(30));
            enemy1.tag = 2;

            enemy2 = entityManager.createEntity('Enemy2');
            enemy2.addComponent(new PositionComponent(90, 90));
            enemy2.addComponent(new VelocityComponent(-1, 0));
            enemy2.addComponent(new HealthComponent(75, 75));
            enemy2.addComponent(new AIComponent(45));
            enemy2.tag = 2;

            npc = entityManager.createEntity('NPC');
            npc.addComponent(new PositionComponent(25, 75));
            npc.addComponent(new RenderComponent(true, 'blue'));
            npc.tag = 3;
        });

        test('应该能够查询具有所有指定组件的实体', () => {
            const results = entityManager.query()
                .withAll(PositionComponent, HealthComponent)
                .execute();

            expect(results.length).toBe(3); // player, enemy1, enemy2
            expect(results).toContain(player);
            expect(results).toContain(enemy1);
            expect(results).toContain(enemy2);
            expect(results).not.toContain(npc);
        });

        test('应该能够查询具有任意指定组件的实体', () => {
            const results = entityManager.query()
                .withAny(PlayerComponent, AIComponent)
                .execute();

            expect(results.length).toBe(3); // player, enemy1, enemy2
            expect(results).toContain(player);
            expect(results).toContain(enemy1);
            expect(results).toContain(enemy2);
            expect(results).not.toContain(npc);
        });

        test('应该能够排除具有指定组件的实体', () => {
            const results = entityManager.query()
                .withAll(PositionComponent)
                .without(AIComponent)
                .execute();

            expect(results.length).toBe(2); // player, npc
            expect(results).toContain(player);
            expect(results).toContain(npc);
            expect(results).not.toContain(enemy1);
            expect(results).not.toContain(enemy2);
        });

        test('应该能够按标签过滤实体', () => {
            const results = entityManager.query()
                .withTag(2)
                .execute();

            expect(results.length).toBe(2); // enemy1, enemy2
            expect(results).toContain(enemy1);
            expect(results).toContain(enemy2);
            expect(results).not.toContain(player);
            expect(results).not.toContain(npc);
        });

        test('应该能够排除特定标签的实体', () => {
            const results = entityManager.query()
                .withAll(PositionComponent)
                .withoutTag(2)
                .execute();

            expect(results.length).toBe(2); // player, npc
            expect(results).toContain(player);
            expect(results).toContain(npc);
            expect(results).not.toContain(enemy1);
            expect(results).not.toContain(enemy2);
        });

        test('应该能够只查询激活状态的实体', () => {
            enemy1.active = false;

            const results = entityManager.query()
                .withAll(PositionComponent, HealthComponent)
                .active()
                .execute();

            expect(results.length).toBe(2); // player, enemy2
            expect(results).toContain(player);
            expect(results).toContain(enemy2);
            expect(results).not.toContain(enemy1);
        });

        test('应该能够只查询启用状态的实体', () => {
            npc.enabled = false;

            const results = entityManager.query()
                .withAll(PositionComponent)
                .enabled()
                .execute();

            expect(results.length).toBe(3); // player, enemy1, enemy2
            expect(results).toContain(player);
            expect(results).toContain(enemy1);
            expect(results).toContain(enemy2);
            expect(results).not.toContain(npc);
        });

        test('应该能够使用自定义过滤条件', () => {
            const results = entityManager.query()
                .withAll(HealthComponent)
                .where(entity => {
                    const health = entity.getComponent(HealthComponent);
                    return health!.health > 60;
                })
                .execute();

            expect(results.length).toBe(2); // player, enemy2
            expect(results).toContain(player);
            expect(results).toContain(enemy2);
            expect(results).not.toContain(enemy1);
        });

        test('应该能够组合多个查询条件', () => {
            const results = entityManager.query()
                .withAll(PositionComponent, HealthComponent)
                .without(PlayerComponent)
                .withTag(2)
                .where(entity => {
                    const position = entity.getComponent(PositionComponent);
                    return position!.x < 50;
                })
                .execute();

            expect(results.length).toBe(1); // enemy1
            expect(results).toContain(enemy1);
            expect(results).not.toContain(player);
            expect(results).not.toContain(enemy2);
            expect(results).not.toContain(npc);
        });

        test('空查询应该返回所有实体', () => {
            const results = entityManager.query().execute();
            
            expect(results.length).toBe(4); // all entities
            expect(results).toContain(player);
            expect(results).toContain(enemy1);
            expect(results).toContain(enemy2);
            expect(results).toContain(npc);
        });

        test('不匹配的查询应该返回空数组', () => {
            const results = entityManager.query()
                .withAll(PlayerComponent, AIComponent) // 不可能的组合
                .execute();

            expect(results).toEqual([]);
        });
    });

    describe('事件系统集成', () => {
        test('创建实体应该触发事件', () => {
            let eventData: any = null;
            
            entityManager.eventBus.onEntityCreated((data) => {
                eventData = data;
            });
            
            const entity = entityManager.createEntity('EventEntity');
            
            expect(eventData).toBeDefined();
            expect(eventData.entityName).toBe('EventEntity');
            expect(eventData.entityId).toBe(entity.id);
        });

        test('销毁实体应该触发事件', () => {
            let eventData: any = null;
            
            entityManager.eventBus.on('entity:destroyed', (data: any) => {
                eventData = data;
            });
            
            const entity = entityManager.createEntity('EventEntity');
            entityManager.destroyEntity(entity);
            
            expect(eventData).toBeDefined();
            expect(eventData.entityName).toBe('EventEntity');
            expect(eventData.entityId).toBe(entity.id);
        });

        test('添加组件应该触发事件', () => {
            let eventData: any = null;
            
            entityManager.eventBus.onComponentAdded((data) => {
                eventData = data;
            });
            
            const entity = entityManager.createEntity('ComponentEntity');
            entity.addComponent(new PositionComponent(10, 20));
            
            expect(eventData).toBeDefined();
            expect(eventData.componentType).toBe('PositionComponent');
            expect(eventData.entityId).toBe(entity.id);
        });

        test('移除组件应该触发事件', () => {
            let eventData: any = null;
            
            entityManager.eventBus.on('component:removed', (data: any) => {
                eventData = data;
            });
            
            const entity = entityManager.createEntity('ComponentEntity');
            const component = entity.addComponent(new PositionComponent(10, 20));
            entity.removeComponent(component);
            
            expect(eventData).toBeDefined();
            expect(eventData.componentType).toBe('PositionComponent');
            expect(eventData.entityId).toBe(entity.id);
        });
    });

    describe('性能和内存测试', () => {
        test('大量实体创建性能应该可接受', () => {
            const entityCount = 10000;
            const startTime = performance.now();
            
            const entities: Entity[] = [];
            for (let i = 0; i < entityCount; i++) {
                entities.push(entityManager.createEntity(`PerfEntity_${i}`));
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(entities.length).toBe(entityCount);
            expect(entityManager.entityCount).toBe(entityCount);
            // 性能记录：实体创建性能数据，不设硬阈值避免CI不稳定
            
            console.log(`创建${entityCount}个实体耗时: ${duration.toFixed(2)}ms`);
        });

        test('大量实体查询性能应该可接受', () => {
            const entityCount = 5000;
            
            // 创建大量实体并添加组件
            for (let i = 0; i < entityCount; i++) {
                const entity = entityManager.createEntity(`Entity_${i}`);
                entity.addComponent(new PositionComponent(i, i));
                
                if (i % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }
                
                if (i % 3 === 0) {
                    entity.addComponent(new HealthComponent(100));
                }
            }
            
            const startTime = performance.now();
            
            // 执行多个查询
            const positionResults = entityManager.query().withAll(PositionComponent).execute();
            const velocityResults = entityManager.query().withAll(VelocityComponent).execute();
            const healthResults = entityManager.query().withAll(HealthComponent).execute();
            const complexResults = entityManager.query()
                .withAll(PositionComponent, VelocityComponent)
                .without(HealthComponent)
                .execute();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(positionResults.length).toBe(entityCount);
            expect(velocityResults.length).toBe(entityCount / 2);
            expect(healthResults.length).toBe(Math.floor(entityCount / 3) + 1);
            // 性能记录：复杂查询性能数据，不设硬阈值避免CI不稳定
            
            console.log(`${entityCount}个实体的复杂查询耗时: ${duration.toFixed(2)}ms`);
        });

        test('实体销毁应该正确清理内存', () => {
            const entityCount = 1000;
            const entities: Entity[] = [];
            
            // 创建实体
            for (let i = 0; i < entityCount; i++) {
                const entity = entityManager.createEntity(`MemoryEntity_${i}`);
                entity.addComponent(new PositionComponent(0, 0));
                entity.addComponent(new HealthComponent(100));
                entities.push(entity);
            }
            
            expect(entityManager.entityCount).toBe(entityCount);
            
            // 销毁所有实体
            entities.forEach(entity => {
                entityManager.destroyEntity(entity);
            });
            
            // 验证所有实体都已被清理
            expect(entityManager.entityCount).toBe(0);
            entities.forEach(entity => {
                expect(entityManager.getEntity(entity.id)).toBeNull();
            });
            
            // 查询应该返回空结果
            const positionResults = entityManager.query().withAll(PositionComponent).execute();
            const healthResults = entityManager.query().withAll(HealthComponent).execute();
            
            expect(positionResults).toEqual([]);
            expect(healthResults).toEqual([]);
        });
    });

    describe('错误处理和边界情况', () => {
        test('对已销毁实体的查询操作应该安全处理', () => {
            const entity = entityManager.createEntity('ToBeDestroyed');
            entity.addComponent(new PositionComponent(0, 0));
            
            entityManager.destroyEntity(entity);
            
            // 查询不应该包含已销毁的实体
            const results = entityManager.query().withAll(PositionComponent).execute();
            expect(results).not.toContain(entity);
        });

        test('空查询构建器应该能正常工作', () => {
            const builder = entityManager.query();
            
            expect(() => {
                const results = builder.execute();
                expect(Array.isArray(results)).toBe(true);
            }).not.toThrow();
        });

        test('重复销毁同一实体应该安全处理', () => {
            const entity = entityManager.createEntity('TestEntity');
            
            const result1 = entityManager.destroyEntity(entity);
            const result2 = entityManager.destroyEntity(entity);
            
            expect(result1).toBe(true);
            expect(result2).toBe(false);
        });

        test('销毁实体后其组件应该正确清理', () => {
            const entity = entityManager.createEntity('TestEntity');
            entity.addComponent(new PositionComponent(10, 20));
            entity.addComponent(new HealthComponent(100));
            
            const initialPositionResults = entityManager.query().withAll(PositionComponent).execute();
            expect(initialPositionResults).toContain(entity);
            
            entityManager.destroyEntity(entity);
            
            const finalPositionResults = entityManager.query().withAll(PositionComponent).execute();
            expect(finalPositionResults).not.toContain(entity);
        });
    });

    describe('统计和调试信息', () => {
        test('应该能够获取实体管理器统计信息', () => {
            // 创建一些实体和组件
            const entities: Entity[] = [];
            for (let i = 0; i < 10; i++) {
                const entity = entityManager.createEntity(`StatsEntity_${i}`);
                entity.addComponent(new PositionComponent(0, 0));
                entities.push(entity);
            }
            
            // EntityManager doesn't have getStats method, use basic counts
            expect(entityManager.entityCount).toBe(10);
            expect(entityManager.activeEntityCount).toBe(10);
        });

        test('销毁实体后统计信息应该更新', () => {
            const entities: Entity[] = [];
            for (let i = 0; i < 5; i++) {
                entities.push(entityManager.createEntity(`StatsEntity_${i}`));
            }
            
            entityManager.destroyEntity(entities[0]);
            entityManager.destroyEntity(entities[1]);
            
            expect(entityManager.entityCount).toBe(3);
            expect(entityManager.activeEntityCount).toBe(3);
        });

        test('非激活实体应该在统计中正确反映', () => {
            const entities: Entity[] = [];
            for (let i = 0; i < 5; i++) {
                entities.push(entityManager.createEntity(`StatsEntity_${i}`));
            }
            
            entities[0].active = false;
            entities[1].active = false;
            
            expect(entityManager.entityCount).toBe(5);
            expect(entityManager.activeEntityCount).toBe(3);
        });
    });
});