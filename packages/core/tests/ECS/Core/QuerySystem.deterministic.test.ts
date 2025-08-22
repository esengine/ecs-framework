import { Core } from '../../../src/Core';
import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';

// 测试组件
class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

describe('QuerySystem确定性测试', () => {
    let scene: Scene;
    let querySystem: QuerySystem;
    let entities: Entity[];

    beforeEach(() => {
        // 重置Core状态
        if ((Core as any)._instance) {
            (Core as any)._instance = null;
        }
        Core.create({ debug: false });
        Core.deterministicSortingEnabled = true; // 启用确定性排序
        scene = new Scene();
        querySystem = scene.querySystem;
        
        // 创建测试实体（故意用不按顺序的方式）
        entities = [];
        const ids = [5, 1, 8, 3, 9, 2, 7, 4, 6]; // 非顺序ID
        
        for (const id of ids) {
            const entity = new Entity(`Entity_${id}`, id);
            entity.scene = scene;
            entity.addComponent(new PositionComponent(id * 10, id * 20));
            
            // 部分实体添加Velocity组件
            if (id % 2 === 0) {
                entity.addComponent(new VelocityComponent(id, id * 2));
            }
            
            entities.push(entity);
            querySystem.addEntity(entity);
        }
    });

    afterEach(() => {
        Core.deterministicSortingEnabled = false; // 恢复默认设置
        if ((Core as any)._instance) {
            (Core as any)._instance = null;
        }
    });

    describe('queryAll确定性测试', () => {
        test('查询结果应该按ID排序', () => {
            const result = querySystem.queryAll(PositionComponent);
            
            // 检查所有实体都按ID升序排列
            for (let i = 1; i < result.entities.length; i++) {
                expect(result.entities[i].id).toBeGreaterThan(result.entities[i - 1].id);
            }
            
            // 验证ID顺序
            const ids = result.entities.map(e => e.id);
            expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        test('多次查询结果应该完全一致', () => {
            const result1 = querySystem.queryAll(PositionComponent);
            const result2 = querySystem.queryAll(PositionComponent);
            const result3 = querySystem.queryAll(PositionComponent);
            
            const ids1 = result1.entities.map(e => e.id);
            const ids2 = result2.entities.map(e => e.id);
            const ids3 = result3.entities.map(e => e.id);
            
            expect(ids1).toEqual(ids2);
            expect(ids1).toEqual(ids3);
        });

        test('组合查询也应该保持确定性', () => {
            const result = querySystem.queryAll(PositionComponent, VelocityComponent);
            
            // 只有偶数ID的实体有VelocityComponent
            const expectedIds = [2, 4, 6, 8];
            const actualIds = result.entities.map(e => e.id);
            
            expect(actualIds).toEqual(expectedIds);
            
            // 多次查询应该一致
            const result2 = querySystem.queryAll(PositionComponent, VelocityComponent);
            expect(actualIds).toEqual(result2.entities.map(e => e.id));
        });
    });

    describe('queryAny确定性测试', () => {
        test('queryAny结果应该按ID排序', () => {
            const result = querySystem.queryAny(VelocityComponent);
            
            // 验证ID升序
            for (let i = 1; i < result.entities.length; i++) {
                expect(result.entities[i].id).toBeGreaterThan(result.entities[i - 1].id);
            }
        });

        test('多次queryAny结果应该一致', () => {
            const result1 = querySystem.queryAny(VelocityComponent);
            const result2 = querySystem.queryAny(VelocityComponent);
            
            expect(result1.entities.map(e => e.id)).toEqual(result2.entities.map(e => e.id));
        });
    });

    describe('缓存确定性测试', () => {
        test('缓存命中和未命中结果应该一致', () => {
            // 第一次查询（未命中缓存）
            const result1 = querySystem.queryAll(PositionComponent);
            expect(result1.fromCache).toBe(false);
            
            // 第二次查询（命中缓存）
            const result2 = querySystem.queryAll(PositionComponent);
            expect(result2.fromCache).toBe(true);
            
            // 结果应该完全一致
            expect(result1.entities.map(e => e.id)).toEqual(result2.entities.map(e => e.id));
        });

        test('清理缓存后重新查询仍然确定性', () => {
            const result1 = querySystem.queryAll(PositionComponent);
            
            // 手动清理缓存（通过内部方法）
            (querySystem as any).queryCache.clear();
            
            const result2 = querySystem.queryAll(PositionComponent);
            
            expect(result1.entities.map(e => e.id)).toEqual(result2.entities.map(e => e.id));
        });
    });

    describe('getAllEntities确定性测试', () => {
        test('getAllEntities应该按ID排序', () => {
            const allEntities = querySystem.getAllEntities();
            
            // 验证ID升序
            for (let i = 1; i < allEntities.length; i++) {
                expect(allEntities[i].id).toBeGreaterThan(allEntities[i - 1].id);
            }
            
            // 验证完整的ID序列
            expect(allEntities.map(e => e.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        test('多次调用getAllEntities结果一致', () => {
            const result1 = querySystem.getAllEntities();
            const result2 = querySystem.getAllEntities();
            
            expect(result1.map(e => e.id)).toEqual(result2.map(e => e.id));
        });
    });

    describe('动态实体变化确定性', () => {
        test('添加实体后查询仍然确定性', () => {
            // 添加新实体（ID在中间）
            const newEntity = new Entity('NewEntity', 100); // 大ID
            newEntity.scene = scene;
            newEntity.addComponent(new PositionComponent(100, 200));
            querySystem.addEntity(newEntity);
            
            const result = querySystem.queryAll(PositionComponent);
            const ids = result.entities.map(e => e.id);
            
            // 新实体应该按ID顺序插入到正确位置
            expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]);
        });

        test('移除实体后查询仍然确定性', () => {
            // 移除中间的实体
            const entityToRemove = entities.find(e => e.id === 5)!;
            querySystem.removeEntity(entityToRemove);
            
            const result = querySystem.queryAll(PositionComponent);
            const ids = result.entities.map(e => e.id);
            
            // ID序列应该少了5，但仍然有序
            expect(ids).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
        });
    });

    describe('性能基准测试', () => {
        test('确定性排序不应显著影响查询性能', () => {
            // 创建更多实体进行性能测试
            for (let i = 10; i < 100; i++) {
                const entity = new Entity(`PerfEntity_${i}`, i);
                entity.scene = scene;
                entity.addComponent(new PositionComponent(i, i * 2));
                querySystem.addEntity(entity);
            }
            
            const start = performance.now();
            
            // 执行多次查询
            for (let i = 0; i < 100; i++) {
                querySystem.queryAll(PositionComponent);
            }
            
            const end = performance.now();
            const duration = end - start;
            
            // 100次查询应该在合理时间内完成（具体阈值可根据需要调整）
            expect(duration).toBeLessThan(1000); // 1秒内
            
            console.log(`100次确定性查询耗时: ${duration.toFixed(2)}ms`);
        });
    });
});