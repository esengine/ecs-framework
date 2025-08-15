import { ComponentIndex } from '../../../src/ECS/Core/ComponentIndex';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';

// 测试组件类
class TransformComponent extends Component {
    constructor(public x: number = 0, public y: number = 0, public rotation: number = 0) {
        super();
    }
}

class PhysicsComponent extends Component {
    constructor(public mass: number = 1, public friction: number = 0.1) {
        super();
    }
}

class AudioComponent extends Component {
    constructor(public volume: number = 1.0, public muted: boolean = false) {
        super();
    }
}

class GraphicsComponent extends Component {
    constructor(public color: string = '#ffffff', public alpha: number = 1.0) {
        super();
    }
}

describe('ComponentIndex with SparseSet', () => {
    let componentIndex: ComponentIndex;
    let entities: Entity[];

    beforeEach(() => {
        componentIndex = new ComponentIndex();
        entities = [];
        
        // 创建测试实体
        for (let i = 0; i < 5; i++) {
            const entity = new Entity(`testEntity${i}`, i);
            entities.push(entity);
        }
        
        // entity0: Transform
        entities[0].addComponent(new TransformComponent(10, 20, 30));
        
        // entity1: Transform + Physics
        entities[1].addComponent(new TransformComponent(40, 50, 60));
        entities[1].addComponent(new PhysicsComponent(2.0, 0.2));
        
        // entity2: Physics + Audio
        entities[2].addComponent(new PhysicsComponent(3.0, 0.3));
        entities[2].addComponent(new AudioComponent(0.8, false));
        
        // entity3: Transform + Physics + Audio
        entities[3].addComponent(new TransformComponent(70, 80, 90));
        entities[3].addComponent(new PhysicsComponent(4.0, 0.4));
        entities[3].addComponent(new AudioComponent(0.6, true));
        
        // entity4: Graphics
        entities[4].addComponent(new GraphicsComponent('#ff0000', 0.5));
        
        // 添加所有实体到索引
        entities.forEach(entity => componentIndex.addEntity(entity));
    });

    describe('基本索引操作', () => {
        it('应该正确添加实体到索引', () => {
            const stats = componentIndex.getStats();
            expect(stats.size).toBe(5);
        });

        it('应该能移除实体', () => {
            componentIndex.removeEntity(entities[0]);
            
            const stats = componentIndex.getStats();
            expect(stats.size).toBe(4);
            
            const transformEntities = componentIndex.query(TransformComponent);
            expect(transformEntities.has(entities[0])).toBe(false);
        });

        it('应该能清空索引', () => {
            componentIndex.clear();
            
            const stats = componentIndex.getStats();
            expect(stats.size).toBe(0);
        });
    });

    describe('单组件查询', () => {
        it('应该能查询Transform组件', () => {
            const result = componentIndex.query(TransformComponent);
            
            expect(result.size).toBe(3);
            expect(result.has(entities[0])).toBe(true);
            expect(result.has(entities[1])).toBe(true);
            expect(result.has(entities[3])).toBe(true);
        });

        it('应该能查询Physics组件', () => {
            const result = componentIndex.query(PhysicsComponent);
            
            expect(result.size).toBe(3);
            expect(result.has(entities[1])).toBe(true);
            expect(result.has(entities[2])).toBe(true);
            expect(result.has(entities[3])).toBe(true);
        });

        it('应该能查询Audio组件', () => {
            const result = componentIndex.query(AudioComponent);
            
            expect(result.size).toBe(2);
            expect(result.has(entities[2])).toBe(true);
            expect(result.has(entities[3])).toBe(true);
        });

        it('应该能查询Graphics组件', () => {
            const result = componentIndex.query(GraphicsComponent);
            
            expect(result.size).toBe(1);
            expect(result.has(entities[4])).toBe(true);
        });
    });

    describe('多组件AND查询', () => {
        it('应该能查询Transform+Physics组件', () => {
            const result = componentIndex.queryMultiple([TransformComponent, PhysicsComponent], 'AND');
            
            expect(result.size).toBe(2);
            expect(result.has(entities[1])).toBe(true);
            expect(result.has(entities[3])).toBe(true);
        });

        it('应该能查询Physics+Audio组件', () => {
            const result = componentIndex.queryMultiple([PhysicsComponent, AudioComponent], 'AND');
            
            expect(result.size).toBe(2);
            expect(result.has(entities[2])).toBe(true);
            expect(result.has(entities[3])).toBe(true);
        });

        it('应该能查询Transform+Physics+Audio组件', () => {
            const result = componentIndex.queryMultiple([TransformComponent, PhysicsComponent, AudioComponent], 'AND');
            
            expect(result.size).toBe(1);
            expect(result.has(entities[3])).toBe(true);
        });

        it('应该处理不存在的组合', () => {
            const result = componentIndex.queryMultiple([TransformComponent, GraphicsComponent], 'AND');
            expect(result.size).toBe(0);
        });
    });

    describe('多组件OR查询', () => {
        it('应该能查询Transform或Graphics组件', () => {
            const result = componentIndex.queryMultiple([TransformComponent, GraphicsComponent], 'OR');
            
            expect(result.size).toBe(4);
            expect(result.has(entities[0])).toBe(true);
            expect(result.has(entities[1])).toBe(true);
            expect(result.has(entities[3])).toBe(true);
            expect(result.has(entities[4])).toBe(true);
        });

        it('应该能查询Audio或Graphics组件', () => {
            const result = componentIndex.queryMultiple([AudioComponent, GraphicsComponent], 'OR');
            
            expect(result.size).toBe(3);
            expect(result.has(entities[2])).toBe(true);
            expect(result.has(entities[3])).toBe(true);
            expect(result.has(entities[4])).toBe(true);
        });

        it('应该能查询所有组件类型', () => {
            const result = componentIndex.queryMultiple([
                TransformComponent, 
                PhysicsComponent, 
                AudioComponent, 
                GraphicsComponent
            ], 'OR');
            
            expect(result.size).toBe(5);
        });
    });

    describe('边界情况', () => {
        it('应该处理空组件列表', () => {
            const andResult = componentIndex.queryMultiple([], 'AND');
            const orResult = componentIndex.queryMultiple([], 'OR');
            
            expect(andResult.size).toBe(0);
            expect(orResult.size).toBe(0);
        });

        it('应该处理单组件查询', () => {
            const result = componentIndex.queryMultiple([TransformComponent], 'AND');
            const directResult = componentIndex.query(TransformComponent);
            
            expect(result.size).toBe(directResult.size);
            expect([...result]).toEqual([...directResult]);
        });

        it('应该处理重复添加实体', () => {
            const initialStats = componentIndex.getStats();
            
            componentIndex.addEntity(entities[0]);
            
            const finalStats = componentIndex.getStats();
            expect(finalStats.size).toBe(initialStats.size);
        });
    });

    describe('性能统计', () => {
        it('应该跟踪查询统计信息', () => {
            // 执行一些查询
            componentIndex.query(TransformComponent);
            componentIndex.queryMultiple([PhysicsComponent, AudioComponent], 'AND');
            componentIndex.queryMultiple([TransformComponent, GraphicsComponent], 'OR');
            
            const stats = componentIndex.getStats();
            
            expect(stats.queryCount).toBe(3);
            expect(stats.avgQueryTime).toBeGreaterThanOrEqual(0);
            expect(stats.memoryUsage).toBeGreaterThan(0);
            expect(stats.lastUpdated).toBeGreaterThan(0);
        });

        it('应该提供准确的内存使用信息', () => {
            const stats = componentIndex.getStats();
            
            expect(stats.memoryUsage).toBeGreaterThan(0);
            expect(stats.size).toBe(5);
        });
    });

    describe('动态实体管理', () => {
        it('应该处理实体组件变化', () => {
            // 为实体添加新组件
            entities[4].addComponent(new TransformComponent(100, 200, 300));
            componentIndex.addEntity(entities[4]); // 重新添加以更新索引
            
            const result = componentIndex.query(TransformComponent);
            expect(result.has(entities[4])).toBe(true);
            expect(result.size).toBe(4);
        });

        it('应该处理实体组件移除', () => {
            // 验证初始状态
            const initialResult = componentIndex.query(TransformComponent);
            expect(initialResult.has(entities[1])).toBe(true);
            expect(initialResult.size).toBe(3);
            
            // 创建一个没有Transform组件的新实体，模拟组件移除后的状态
            const modifiedEntity = new Entity('modifiedEntity', entities[1].id);
            modifiedEntity.addComponent(new PhysicsComponent(2.0, 0.2)); // 只保留Physics组件
            
            // 从索引中移除原实体，添加修改后的实体
            componentIndex.removeEntity(entities[1]);
            componentIndex.addEntity(modifiedEntity);
            
            const result = componentIndex.query(TransformComponent);
            expect(result.has(entities[1])).toBe(false);
            expect(result.has(modifiedEntity)).toBe(false);
            expect(result.size).toBe(2);
            
            // 验证Physics查询仍然能找到修改后的实体
            const physicsResult = componentIndex.query(PhysicsComponent);
            expect(physicsResult.has(modifiedEntity)).toBe(true);
        });
    });

    describe('复杂查询场景', () => {
        it('应该支持复杂的组合查询', () => {
            // 查询有Transform和Physics但没有Audio的实体
            const withTransformPhysics = componentIndex.queryMultiple([TransformComponent, PhysicsComponent], 'AND');
            const withAudio = componentIndex.queryMultiple([AudioComponent], 'OR');
            
            const withoutAudio = new Set([...withTransformPhysics].filter(e => !withAudio.has(e)));
            
            expect(withoutAudio.size).toBe(1);
            expect(withoutAudio.has(entities[1])).toBe(true);
        });

        it('应该支持性能敏感的批量查询', () => {
            const startTime = performance.now();
            
            // 执行大量查询
            for (let i = 0; i < 100; i++) {
                componentIndex.query(TransformComponent);
                componentIndex.queryMultiple([PhysicsComponent, AudioComponent], 'AND');
                componentIndex.queryMultiple([TransformComponent, GraphicsComponent], 'OR');
            }
            
            const duration = performance.now() - startTime;
            
            // 应该在合理时间内完成
            expect(duration).toBeLessThan(100);
            
            const stats = componentIndex.getStats();
            expect(stats.queryCount).toBe(300);
        });
    });
});