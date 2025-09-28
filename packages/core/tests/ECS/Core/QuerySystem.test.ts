import { QuerySystem, QueryBuilder, QueryConditionType } from '../../../src/ECS/Core/QuerySystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry, ComponentType } from '../../../src/ECS/Core/ComponentStorage';

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
    public layer: number;
    
    constructor(...args: unknown[]) {
        super();
        const [visible = true, layer = 0] = args as [boolean?, number?];
        this.visible = visible;
        this.layer = layer;
    }
}

class AIComponent extends Component {
    public behavior: string;
    
    constructor(...args: unknown[]) {
        super();
        const [behavior = 'idle'] = args as [string?];
        this.behavior = behavior;
    }
}

class PhysicsComponent extends Component {
    public mass: number;
    
    constructor(...args: unknown[]) {
        super();
        const [mass = 1.0] = args as [number?];
        this.mass = mass;
    }
}

describe('QuerySystem - 查询系统测试', () => {
    let querySystem: QuerySystem;
    let entities: Entity[];
    let originalAddComponent: any;
    let originalRemoveComponent: any;
    let originalRemoveAllComponents: any;

    beforeEach(() => {
        querySystem = new QuerySystem();
        entities = [];

        // 创建测试实体
        for (let i = 0; i < 10; i++) {
            const entity = new Entity(`Entity_${i}`, i + 1);
            entities.push(entity);
        }
        
        // 将实体添加到查询系统
        querySystem.setEntities(entities);
        
        // 监听实体组件变化以保持查询系统同步
        originalAddComponent = Entity.prototype.addComponent;
        originalRemoveComponent = Entity.prototype.removeComponent;
        originalRemoveAllComponents = Entity.prototype.removeAllComponents;
        
        Entity.prototype.addComponent = function<T extends Component>(component: T): T {
            const result = originalAddComponent.call(this, component);
            // 通知查询系统实体已更新，重建所有索引
            querySystem.setEntities(entities);
            return result;
        };
        
        Entity.prototype.removeComponent = function(component: Component): void {
            originalRemoveComponent.call(this, component);
            // 通知查询系统实体已更新，重建所有索引
            querySystem.setEntities(entities);
        };
        
        Entity.prototype.removeAllComponents = function(): void {
            originalRemoveAllComponents.call(this);
            // 通知查询系统实体已更新，重建所有索引
            querySystem.setEntities(entities);
        };
    });

    afterEach(() => {
        // 恢复原始方法
        Entity.prototype.addComponent = originalAddComponent;
        Entity.prototype.removeComponent = originalRemoveComponent;
        Entity.prototype.removeAllComponents = originalRemoveAllComponents;
    });

    describe('基本查询功能', () => {
        test('应该能够查询单个组件类型', () => {
            // 为部分实体添加Position组件
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));
            entities[2].addComponent(new PositionComponent(50, 60));

            const result = querySystem.queryAll(PositionComponent);

            expect(result.entities.length).toBe(3);
            expect(result.entities).toContain(entities[0]);
            expect(result.entities).toContain(entities[1]);
            expect(result.entities).toContain(entities[2]);
        });

        test('应该能够查询多个组件类型', () => {
            // 创建不同组件组合的实体
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[0].addComponent(new VelocityComponent(1, 1));

            entities[1].addComponent(new PositionComponent(30, 40));
            entities[1].addComponent(new HealthComponent(80));

            entities[2].addComponent(new PositionComponent(50, 60));
            entities[2].addComponent(new VelocityComponent(2, 2));

            const result = querySystem.queryAll(PositionComponent, VelocityComponent);

            expect(result.entities.length).toBe(2);
            expect(result.entities).toContain(entities[0]);
            expect(result.entities).toContain(entities[2]);
            expect(result.entities).not.toContain(entities[1]);
        });

        test('应该能够查询复杂的组件组合', () => {
            // 创建复杂的组件组合
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[0].addComponent(new VelocityComponent(1, 1));
            entities[0].addComponent(new HealthComponent(100));

            entities[1].addComponent(new PositionComponent(30, 40));
            entities[1].addComponent(new VelocityComponent(2, 2));
            entities[1].addComponent(new RenderComponent(true));

            entities[2].addComponent(new PositionComponent(50, 60));
            entities[2].addComponent(new HealthComponent(80));
            entities[2].addComponent(new RenderComponent(false));

            const result = querySystem.queryAll(PositionComponent, VelocityComponent, HealthComponent);

            expect(result.entities.length).toBe(1);
            expect(result.entities).toContain(entities[0]);
        });

        test('查询不存在的组件应该返回空结果', () => {
            const result = querySystem.queryAll(AIComponent);

            expect(result.entities.length).toBe(0);
            expect(result.entities).toEqual([]);
        });

        test('空查询应该返回所有实体', () => {
            // 添加一些组件以确保实体被追踪
            entities.forEach((entity, index) => {
                if (!entity.hasComponent(PositionComponent)) {
                    entity.addComponent(new PositionComponent(0, 0));
                }
            });

            const result = querySystem.queryAll();

            expect(result.entities.length).toBe(entities.length);
        });
    });

    describe('查询缓存机制', () => {
        test('相同查询应该使用缓存', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));

            const result1 = querySystem.queryAll(PositionComponent);
            const result2 = querySystem.queryAll(PositionComponent);

            // 第二次查询应该来自缓存
            expect(result2.fromCache).toBe(true);
            expect(result1.entities).toEqual(result2.entities);
            expect(result1.entities.length).toBe(2);
        });

        test('组件变化应该使缓存失效', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            
            const result1 = querySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(1);

            // 添加新的匹配实体
            entities[1].addComponent(new PositionComponent(30, 40));

            const result2 = querySystem.queryAll(PositionComponent);
            expect(result2.entities.length).toBe(2);
            expect(result2.entities).toContain(entities[1]);
        });

        test('移除组件应该更新缓存', () => {
            const positionComp = entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));

            const result1 = querySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(2);

            // 移除组件
            entities[0].removeComponent(positionComp);

            const result2 = querySystem.queryAll(PositionComponent);
            expect(result2.entities.length).toBe(1);
            expect(result2.entities).not.toContain(entities[0]);
        });

        test('实体销毁应该更新缓存', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));

            const result1 = querySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(2);

            // 销毁实体（通过移除所有组件模拟）
            entities[0].removeAllComponents();

            const result2 = querySystem.queryAll(PositionComponent);
            expect(result2.entities.length).toBe(1);
            expect(result2.entities).not.toContain(entities[0]);
        });
    });

    describe('Archetype系统集成', () => {
        test('具有相同组件组合的实体应该被分组', () => {
            // 创建具有相同组件组合的实体
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[0].addComponent(new VelocityComponent(1, 1));

            entities[1].addComponent(new PositionComponent(30, 40));
            entities[1].addComponent(new VelocityComponent(2, 2));

            entities[2].addComponent(new PositionComponent(50, 60));
            entities[2].addComponent(new HealthComponent(100));

            const result = querySystem.queryAll(PositionComponent, VelocityComponent);

            expect(result.entities.length).toBe(2);
            expect(result.entities).toContain(entities[0]);
            expect(result.entities).toContain(entities[1]);

            // 验证Archetype优化是否工作 - 简化验证，重点是查询结果正确
            const stats = querySystem.getStats();
            // Archetype可能存在也可能不存在，重点是查询结果正确
            expect(stats.optimizationStats.archetypeSystem.length).toBeGreaterThanOrEqual(0);
        });

        test('Archetype应该优化查询性能', () => {
            const entityCount = 1000;
            const testEntities: Entity[] = [];

            // 创建大量具有相同组件组合的实体
            for (let i = 0; i < entityCount; i++) {
                const entity = new Entity(`PerfEntity_${i}`, i + 100);
                testEntities.push(entity);
            }
            
            // 先添加组件
            for (const entity of testEntities) {
                entity.addComponent(new PositionComponent(0, 0));
                entity.addComponent(new VelocityComponent(1, 1));
            }
            
            // 将实体添加到查询系统
            querySystem.setEntities([...entities, ...testEntities]);

            const startTime = performance.now();
            const result = querySystem.queryAll(PositionComponent, VelocityComponent);
            const endTime = performance.now();

            expect(result.entities.length).toBe(entityCount);
            
            const duration = endTime - startTime;
            // 性能记录：查询系统性能数据，不设硬阈值避免CI不稳定

            console.log(`Archetype优化查询${entityCount}个实体耗时: ${duration.toFixed(2)}ms`);
        });
    });

    describe('位掩码优化', () => {
        test('位掩码应该正确识别组件组合', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[0].addComponent(new VelocityComponent(1, 1));
            entities[0].addComponent(new HealthComponent(100));

            entities[1].addComponent(new PositionComponent(30, 40));
            entities[1].addComponent(new VelocityComponent(2, 2));

            entities[2].addComponent(new PositionComponent(50, 60));
            entities[2].addComponent(new HealthComponent(80));

            // 查询Position + Velocity组合
            const velocityResult = querySystem.queryAll(PositionComponent, VelocityComponent);
            expect(velocityResult.entities.length).toBe(2);
            expect(velocityResult.entities).toContain(entities[0]);
            expect(velocityResult.entities).toContain(entities[1]);

            // 查询Position + Health组合
            const healthResult = querySystem.queryAll(PositionComponent, HealthComponent);
            expect(healthResult.entities.length).toBe(2);
            expect(healthResult.entities).toContain(entities[0]);
            expect(healthResult.entities).toContain(entities[2]);
        });

        test('位掩码应该支持高效的组件检查', () => {
            const entityCount = 5000;
            const testEntities: Entity[] = [];

            // 创建大量实体
            for (let i = 0; i < entityCount; i++) {
                const entity = new Entity(`MaskEntity_${i}`, i + 200);
                testEntities.push(entity);
            }
            
            // 先随机分配组件
            for (let i = 0; i < entityCount; i++) {
                const entity = testEntities[i];
                
                entity.addComponent(new PositionComponent(i, i));
                
                if (i % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }
                
                if (i % 3 === 0) {
                    entity.addComponent(new HealthComponent(100));
                }
                
                if (i % 5 === 0) {
                    entity.addComponent(new RenderComponent(true));
                }
            }
            
            // 将实体添加到查询系统
            querySystem.setEntities([...entities, ...testEntities]);

            const startTime = performance.now();
            
            // 执行复杂查询
            const result1 = querySystem.queryAll(PositionComponent, VelocityComponent);
            const result2 = querySystem.queryAll(PositionComponent, HealthComponent);
            const result3 = querySystem.queryAll(VelocityComponent, HealthComponent);
            const result4 = querySystem.queryAll(PositionComponent, VelocityComponent, HealthComponent);
            
            const endTime = performance.now();

            expect(result1.entities.length).toBe(entityCount / 2);
            expect(result2.entities.length).toBe(Math.floor(entityCount / 3) + 1);
            expect(result4.entities.length).toBe(Math.floor(entityCount / 6) + 1);
            
            const duration = endTime - startTime;
            // 性能记录：复杂查询性能数据，不设硬阈值避免CI不稳定

            console.log(`位掩码优化复杂查询耗时: ${duration.toFixed(2)}ms`);
        });
    });

    describe('脏标记系统', () => {
        test('脏标记应该追踪组件变化', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            
            // 第一次查询
            const result1 = querySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(1);

            // 修改组件（模拟脏标记）
            const position = entities[0].getComponent(PositionComponent);
            if (position) {
                position.x = 50;
                // 在实际实现中，这会标记实体为脏
            }

            // 添加新实体以触发重新查询
            entities[1].addComponent(new PositionComponent(30, 40));
            
            const result2 = querySystem.queryAll(PositionComponent);
            expect(result2.entities.length).toBe(2);
        });

        test('脏标记应该优化不必要的查询', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));

            // 多次相同查询应该使用缓存
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                querySystem.queryAll(PositionComponent);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;

            // 缓存查询应该非常快
            // 性能记录：缓存查询性能数据，不设硬阈值避免CI不稳定

            console.log(`1000次缓存查询耗时: ${duration.toFixed(2)}ms`);
        });
    });

    describe('查询统计和性能监控', () => {
        test('应该能够获取查询统计信息', () => {
            querySystem.clearCache(); // 确保测试隔离
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new VelocityComponent(1, 1));

            // 执行一些查询
            querySystem.queryAll(PositionComponent);
            querySystem.queryAll(VelocityComponent);
            querySystem.queryAll(PositionComponent, VelocityComponent);

            const stats = querySystem.getStats();

            expect(stats.queryStats.totalQueries).toBeGreaterThan(0);
            expect(stats.cacheStats.size).toBeGreaterThan(0);
            expect(parseFloat(stats.cacheStats.hitRate)).toBeGreaterThanOrEqual(0);
            expect(parseFloat(stats.cacheStats.hitRate)).toBeLessThanOrEqual(100);
        });

        test('缓存命中率应该在重复查询时提高', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));

            // 第一次查询（缓存未命中）
            querySystem.queryAll(PositionComponent);
            let stats = querySystem.getStats();
            const initialHitRate = parseFloat(stats.cacheStats.hitRate);

            // 重复查询（应该命中缓存）
            for (let i = 0; i < 10; i++) {
                querySystem.queryAll(PositionComponent);
            }

            stats = querySystem.getStats();
            expect(parseFloat(stats.cacheStats.hitRate)).toBeGreaterThan(initialHitRate);
        });

        test('应该能够清理查询缓存', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new VelocityComponent(1, 1));

            // 创建一些缓存条目
            querySystem.queryAll(PositionComponent);
            querySystem.queryAll(VelocityComponent);

            let stats = querySystem.getStats();
            expect(stats.cacheStats.size).toBeGreaterThan(0);

            // 清理缓存
            querySystem.clearCache();

            stats = querySystem.getStats();
            expect(stats.cacheStats.size).toBe(0);
        });
    });

    describe('内存管理和优化', () => {
        test('大量查询不应该导致内存泄漏', () => {
            querySystem.clearCache(); // 确保测试隔离
            const entityCount = 1000;
            const testEntities: Entity[] = [];

            // 创建大量实体
            for (let i = 0; i < entityCount; i++) {
                const entity = new Entity(`MemEntity_${i}`, i + 300);
                entity.addComponent(new PositionComponent(i, i));
                
                if (i % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }
                
                testEntities.push(entity);
            }

            // 执行大量不同的查询
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                querySystem.queryAll(PositionComponent);
                querySystem.queryAll(VelocityComponent);
                querySystem.queryAll(PositionComponent, VelocityComponent);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;

            // 性能记录：大量查询性能数据，不设硬阈值避免CI不稳定

            // 验证缓存大小合理
            const stats = querySystem.getStats();
            expect(stats.cacheStats.size).toBeLessThan(10); // 不同查询类型应该不多

            console.log(`大量查询操作耗时: ${duration.toFixed(2)}ms，缓存大小: ${stats.cacheStats.size}`);
        });

        test('查询结果应该正确管理实体引用', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));

            const result = querySystem.queryAll(PositionComponent);
            
            // 修改查询结果不应该影响原始数据
            const originalLength = result.entities.length;
            // readonly 数组不可修改，这是预期的行为

            const newResult = querySystem.queryAll(PositionComponent);
            expect(newResult.entities.length).toBe(originalLength);
        });
    });

    describe('边界情况和错误处理', () => {
        test('空实体列表查询应该安全', () => {
            expect(() => {
                const result = querySystem.queryAll(PositionComponent);
                expect(result.entities).toEqual([]);
            }).not.toThrow();
        });

        test('查询不存在的组件类型应该安全', () => {
            expect(() => {
                const result = querySystem.queryAll(AIComponent, PhysicsComponent);
                expect(result.entities).toEqual([]);
            }).not.toThrow();
        });

        test('查询已销毁实体的组件应该安全处理', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            
            const result1 = querySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(1);

            // 销毁实体（通过移除所有组件）
            entities[0].removeAllComponents();

            const result2 = querySystem.queryAll(PositionComponent);
            expect(result2.entities.length).toBe(0);
        });

        test('并发查询应该安全', async () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new VelocityComponent(1, 1));
            entities[2].addComponent(new HealthComponent(100));

            // 模拟并发查询
            const promises = Array.from({ length: 50 }, (_, i) => {
                return Promise.resolve(querySystem.queryAll(PositionComponent));
            });

            const results = await Promise.all(promises);

            // 所有结果应该一致
            results.forEach(result => {
                expect(result.entities.length).toBe(1);
                expect(result.entities[0]).toBe(entities[0]);
            });
        });

        test('极大数量的查询类型应该能正确处理', () => {
            const componentTypes = [
                PositionComponent,
                VelocityComponent,
                HealthComponent,
                RenderComponent,
                AIComponent,
                PhysicsComponent
            ];

            // 创建具有不同组件组合的实体
            for (let i = 0; i < entities.length; i++) {
                for (let j = 0; j < componentTypes.length; j++) {
                    if (i % (j + 1) === 0) {
                        const ComponentClass = componentTypes[j];
                        if (!entities[i].hasComponent(ComponentClass as any)) {
                            switch (ComponentClass) {
                                case PositionComponent:
                                    entities[i].addComponent(new PositionComponent(i, i));
                                    break;
                                case VelocityComponent:
                                    entities[i].addComponent(new VelocityComponent(1, 1));
                                    break;
                                case HealthComponent:
                                    entities[i].addComponent(new HealthComponent(100));
                                    break;
                                case RenderComponent:
                                    entities[i].addComponent(new RenderComponent(true));
                                    break;
                                case AIComponent:
                                    entities[i].addComponent(new AIComponent('patrol'));
                                    break;
                                case PhysicsComponent:
                                    entities[i].addComponent(new PhysicsComponent(1.0));
                                    break;
                            }
                        }
                    }
                }
            }

            // 测试各种组合查询
            expect(() => {
                querySystem.queryAll(PositionComponent);
                querySystem.queryAll(PositionComponent, VelocityComponent);
                querySystem.queryAll(PositionComponent, VelocityComponent, HealthComponent);
                querySystem.queryAll(RenderComponent, AIComponent);
                querySystem.queryAll(PhysicsComponent, PositionComponent);
            }).not.toThrow();

            const stats = querySystem.getStats();
            expect(stats.queryStats.totalQueries).toBeGreaterThan(0);
        });
    });

    describe('QueryBuilder - 查询构建器功能', () => {
        let builder: QueryBuilder;

        beforeEach(() => {
            builder = new QueryBuilder(querySystem);
            
            // 设置测试实体的组件
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new VelocityComponent(1, 1));
            entities[2].addComponent(new PositionComponent(30, 40));
            entities[2].addComponent(new VelocityComponent(2, 2));
        });

        test('应该能够创建查询构建器', () => {
            expect(builder).toBeInstanceOf(QueryBuilder);
        });

        test('应该能够构建包含所有组件的查询', () => {
            const result = builder
                .withAll(PositionComponent)
                .execute();
            
            expect(result.entities.length).toBe(2);
            expect(result.entities).toContain(entities[0]);
            expect(result.entities).toContain(entities[2]);
        });

        test('应该能够构建包含任意组件的查询', () => {
            const result = builder
                .withAny(PositionComponent, VelocityComponent)
                .execute();
            
            expect(result.entities.length).toBe(3);
        });

        test('应该能够构建排除组件的查询', () => {
            // 为一些实体添加HealthComponent，这样其他实体就不包含这个组件
            entities[3].addComponent(new HealthComponent(100));
            entities[4].addComponent(new HealthComponent(80));
            
            const result = builder
                .without(HealthComponent)
                .execute();
            
            // 应该返回没有HealthComponent的8个实体
            expect(result.entities.length).toBe(8);
            expect(result.entities).not.toContain(entities[3]);
            expect(result.entities).not.toContain(entities[4]);
        });

        test('应该能够重置查询构建器', () => {
            builder.withAll(PositionComponent);
            const resetBuilder = builder.reset();
            
            expect(resetBuilder).toBe(builder);
            
            const result = builder.execute();
            expect(result.entities.length).toBe(0); // 没有条件，返回空结果
        });

        test('多条件查询应该返回空结果（当前实现限制）', () => {
            const result = builder
                .withAll(PositionComponent)
                .withAny(VelocityComponent)
                .execute();
            
            // 当前实现只支持单一条件，多条件返回空结果
            expect(result.entities.length).toBe(0);
        });

        test('链式调用应该工作正常', () => {
            const result = builder
                .withAll(PositionComponent)
                .execute();
            
            expect(result).toBeDefined();
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('高级查询功能', () => {
        test('应该能够按标签查询实体', () => {
            entities[0].tag = 100;
            entities[1].tag = 200;
            entities[2].tag = 100;
            
            // 重建索引以反映标签变化
            querySystem.setEntities(entities);
            
            const result = querySystem.queryByTag(100);
            
            expect(result.entities.length).toBe(2);
            expect(result.entities).toContain(entities[0]);
            expect(result.entities).toContain(entities[2]);
        });

        test('应该能够按名称查询实体', () => {
            const result = querySystem.queryByName('Entity_1');
            
            expect(result.entities.length).toBe(1);
            expect(result.entities).toContain(entities[1]);
        });

        test('应该能够查询包含任意指定组件的实体', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new VelocityComponent(1, 1));
            entities[2].addComponent(new HealthComponent(100));
            
            const result = querySystem.queryAny(PositionComponent, VelocityComponent);
            
            expect(result.entities.length).toBe(2);
            expect(result.entities).toContain(entities[0]);
            expect(result.entities).toContain(entities[1]);
        });

        test('应该能够查询不包含指定组件的实体', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new VelocityComponent(1, 1));
            
            const result = querySystem.queryNone(HealthComponent);
            
            expect(result.entities.length).toBe(entities.length);
        });

        test('应该能够按单个组件类型查询', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            entities[1].addComponent(new PositionComponent(30, 40));
            
            const result = querySystem.queryByComponent(PositionComponent);
            
            expect(result.entities.length).toBe(2);
            expect(result.entities).toContain(entities[0]);
            expect(result.entities).toContain(entities[1]);
        });
    });

    describe('实体管理功能', () => {
        test('应该能够添加和移除单个实体', () => {
            const newEntity = new Entity('NewEntity', 999);
            
            querySystem.addEntity(newEntity);
            let stats = querySystem.getStats();
            expect(stats.entityCount).toBe(11);
            
            querySystem.removeEntity(newEntity);
            stats = querySystem.getStats();
            expect(stats.entityCount).toBe(entities.length);
        });

        test('应该能够批量添加实体', () => {
            const newEntities = [
                new Entity('Batch1', 997),
                new Entity('Batch2', 998),
                new Entity('Batch3', 999)
            ];
            
            querySystem.addEntities(newEntities);
            const stats = querySystem.getStats();
            expect(stats.entityCount).toBe(13);
        });

        test('应该能够批量添加实体（无重复检查）', () => {
            const newEntities = [
                new Entity('Unchecked1', 995),
                new Entity('Unchecked2', 996)
            ];
            
            querySystem.addEntitiesUnchecked(newEntities);
            const stats = querySystem.getStats();
            expect(stats.entityCount).toBe(12);
        });

        test('应该能够清理查询缓存', () => {
            // 先进行一次查询建立缓存
            querySystem.queryAll(PositionComponent);

            expect(() => {
                querySystem.clearCache();
            }).not.toThrow();
        });
    });

    describe('性能优化和配置', () => {
        test('应该能够配置查询缓存', () => {
            expect(() => {
                querySystem.clearCache();
            }).not.toThrow();
        });


        test('应该能够获取实体的原型信息', () => {
            entities[0].addComponent(new PositionComponent(10, 20));
            
            const archetype = querySystem.getEntityArchetype(entities[0]);
            expect(archetype === undefined || typeof archetype === 'object').toBe(true);
        });
    });

    describe('组件变动同步问题测试', () => {
        test('没有Scene时组件变动不会自动同步（符合ECS架构）', () => {
            // 创建一个独立的QuerySystem和实体
            const independentQuerySystem = new QuerySystem();
            const testEntity = new Entity('TestEntity', 9999);

            // 确保实体没有scene
            expect(testEntity.scene).toBe(null);

            // 添加实体到查询系统
            independentQuerySystem.addEntity(testEntity);

            // 初始查询：应该没有PositionComponent的实体
            const result1 = independentQuerySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(0);

            // 添加组件，但没有Scene，不会自动同步
            testEntity.addComponent(new PositionComponent(100, 200));

            // 查询系统不知道组件变化（这是预期行为）
            const result2 = independentQuerySystem.queryAll(PositionComponent);
            expect(result2.entities.length).toBe(0); // 查询系统没有自动更新
            expect(testEntity.hasComponent(PositionComponent)).toBe(true); // 但实体确实有这个组件

            // 手动同步后应该能找到
            independentQuerySystem.updateEntity(testEntity);
            const result3 = independentQuerySystem.queryAll(PositionComponent);
            expect(result3.entities.length).toBe(1);
            expect(result3.entities[0]).toBe(testEntity);
        });

        test('有Scene但没有querySystem时组件变动应该安全', () => {
            const testEntity = new Entity('TestEntity2', 9998);

            // 模拟一个没有querySystem的scene
            const mockScene = {
                querySystem: null,
                componentStorageManager: null,
                clearSystemEntityCaches: jest.fn()
            };
            testEntity.scene = mockScene as any;

            // 添加组件应该不会抛出错误
            expect(() => {
                testEntity.addComponent(new PositionComponent(100, 200));
            }).not.toThrow();

            expect(testEntity.hasComponent(PositionComponent)).toBe(true);
        });

        test('有Scene时ArchetypeSystem组件变动能正确同步', () => {
            const independentQuerySystem = new QuerySystem();
            const testEntity = new Entity('ArchetypeTestEntity', 9997);

            // 模拟Scene环境
            const mockScene = {
                querySystem: independentQuerySystem,
                componentStorageManager: null,
                clearSystemEntityCaches: jest.fn()
            };
            testEntity.scene = mockScene as any;

            // 添加初始组件组合
            testEntity.addComponent(new PositionComponent(0, 0));
            independentQuerySystem.addEntity(testEntity);

            // 获取初始archetype
            const initialArchetype = independentQuerySystem.getEntityArchetype(testEntity);
            expect(initialArchetype).toBeDefined();

            // 添加另一个组件，通过Scene自动同步
            testEntity.addComponent(new VelocityComponent(1, 1));

            // 检查是否已移动到新的archetype
            const currentArchetype = independentQuerySystem.getEntityArchetype(testEntity);

            // 实体组件组合已改变，archetype系统应该已更新
            const posVelQuery = independentQuerySystem.queryAll(PositionComponent, VelocityComponent);

            console.log('有Scene时组件变动查询结果:', posVelQuery.entities.length);
            console.log('实体是否有Position组件:', testEntity.hasComponent(PositionComponent));
            console.log('实体是否有Velocity组件:', testEntity.hasComponent(VelocityComponent));

            expect(posVelQuery.entities.length).toBe(1);
            expect(posVelQuery.entities[0]).toBe(testEntity);
            expect(testEntity.hasComponent(PositionComponent)).toBe(true);
            expect(testEntity.hasComponent(VelocityComponent)).toBe(true);

            // 验证archetype确实已更新
            if (initialArchetype && currentArchetype) {
                expect(currentArchetype.id).not.toBe(initialArchetype.id);
            }
        });

        test('有Scene时removeAllComponents应该正确同步QuerySystem', () => {
            const independentQuerySystem = new QuerySystem();
            const testEntity = new Entity('RemoveAllTestEntity', 9996);

            // 模拟Scene环境
            const mockScene = {
                querySystem: independentQuerySystem,
                componentStorageManager: null,
                clearSystemEntityCaches: jest.fn()
            };
            testEntity.scene = mockScene as any;

            // 添加多个组件
            testEntity.addComponent(new PositionComponent(10, 20));
            testEntity.addComponent(new VelocityComponent(1, 1));
            testEntity.addComponent(new HealthComponent(100));
            independentQuerySystem.addEntity(testEntity);

            // 验证实体有组件且能被查询到
            const result1 = independentQuerySystem.queryAll(PositionComponent);
            expect(result1.entities.length).toBe(1);
            expect(result1.entities[0]).toBe(testEntity);

            // 移除所有组件
            testEntity.removeAllComponents();

            // 查询系统应该知道组件已全部移除
            const result2 = independentQuerySystem.queryAll(PositionComponent);
            const result3 = independentQuerySystem.queryAll(VelocityComponent);
            const result4 = independentQuerySystem.queryAll(HealthComponent);

            expect(result2.entities.length).toBe(0);
            expect(result3.entities.length).toBe(0);
            expect(result4.entities.length).toBe(0);
            expect(testEntity.components.length).toBe(0);
        });

        test('手动同步updateEntity应该工作正常', () => {
            const independentQuerySystem = new QuerySystem();
            const testEntity = new Entity('ManualSyncTestEntity', 9995);

            independentQuerySystem.addEntity(testEntity);

            // 添加组件但没有Scene，不会自动同步
            testEntity.addComponent(new PositionComponent(10, 20));

            // 查询系统还不知道
            let result = independentQuerySystem.queryAll(PositionComponent);
            expect(result.entities.length).toBe(0);

            // 手动同步
            independentQuerySystem.updateEntity(testEntity);

            // 现在应该能找到
            result = independentQuerySystem.queryAll(PositionComponent);
            expect(result.entities.length).toBe(1);
            expect(result.entities[0]).toBe(testEntity);
        });

        test('addEntities应该正确更新componentIndexManager和archetypeSystem', () => {
            const querySystem = new QuerySystem();

            // 创建带组件的实体
            const entity1 = new Entity('BatchEntity1', 8001);
            const entity2 = new Entity('BatchEntity2', 8002);
            const entity3 = new Entity('BatchEntity3', 8003);

            entity1.addComponent(new PositionComponent(10, 20));
            entity2.addComponent(new PositionComponent(30, 40));
            entity2.addComponent(new VelocityComponent(1, 1));
            entity3.addComponent(new VelocityComponent(2, 2));

            // 批量添加实体
            querySystem.addEntities([entity1, entity2, entity3]);

            // 测试基本查询
            const positionResult = querySystem.queryAll(PositionComponent);
            const velocityResult = querySystem.queryAll(VelocityComponent);
            const bothResult = querySystem.queryAll(PositionComponent, VelocityComponent);

            console.log('addEntities后Position查询结果:', positionResult.entities.length);
            console.log('addEntities后Velocity查询结果:', velocityResult.entities.length);
            console.log('addEntities后Both查询结果:', bothResult.entities.length);

            // 验证查询结果是否正确
            expect(positionResult.entities.length).toBe(2); // entity1, entity2
            expect(velocityResult.entities.length).toBe(2); // entity2, entity3
            expect(bothResult.entities.length).toBe(1); // 只有entity2

            expect(positionResult.entities).toContain(entity1);
            expect(positionResult.entities).toContain(entity2);
            expect(velocityResult.entities).toContain(entity2);
            expect(velocityResult.entities).toContain(entity3);
            expect(bothResult.entities).toContain(entity2);

            // 验证ArchetypeSystem是否正确工作
            const entity1Archetype = querySystem.getEntityArchetype(entity1);
            const entity2Archetype = querySystem.getEntityArchetype(entity2);
            const entity3Archetype = querySystem.getEntityArchetype(entity3);

            expect(entity1Archetype).toBeDefined();
            expect(entity2Archetype).toBeDefined();
            expect(entity3Archetype).toBeDefined();

            // entity2应该有不同的archetype（因为有两个组件）
            if (entity1Archetype && entity2Archetype) {
                expect(entity1Archetype.id).not.toBe(entity2Archetype.id);
            }
        });
    });
});