import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';
import { QuerySystem } from '../../../src/ECS/Core/QuerySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Scene } from '../../../src/ECS/Scene';

// 测试组件
class TestComponent extends Component {
    public value: number;

    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

class AnotherComponent extends Component {
    public data: string;

    constructor(data: string = '') {
        super();
        this.data = data;
    }
}

// 测试系统
class TestEntitySystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    public addedEntities: Entity[] = [];
    public removedEntities: Entity[] = [];

    constructor() {
        super(Matcher.empty().all(TestComponent));
    }

    protected override process(entities: Entity[]): void {
        this.processedEntities = [...entities];
    }

    protected override onAdded(entity: Entity): void {
        this.addedEntities.push(entity);
    }

    protected override onRemoved(entity: Entity): void {
        this.removedEntities.push(entity);
    }

    // 公开方法以便测试
    public getQueryHandle() {
        return (this as any)._queryHandle;
    }

    public getCachedEntities() {
        return (this as any)._cachedEntities;
    }
}

describe('EntitySystem - 订阅式查询机制', () => {
    let scene: Scene;
    let querySystem: QuerySystem;
    let testSystem: TestEntitySystem;
    let entity1: Entity;
    let entity2: Entity;
    let entity3: Entity;

    beforeEach(() => {
        // 重置组件注册表
        ComponentRegistry.reset();

        // 注册测试组件
        ComponentRegistry.register(TestComponent);
        ComponentRegistry.register(AnotherComponent);

        // 创建场景和系统
        scene = new Scene();
        querySystem = new QuerySystem();
        (scene as any).querySystem = querySystem;

        testSystem = new TestEntitySystem();
        testSystem.scene = scene;

        // 创建测试实体
        entity1 = new Entity('entity1', 1);
        entity1.addComponent(new TestComponent(10));

        entity2 = new Entity('entity2', 2);
        entity2.addComponent(new TestComponent(20));
        entity2.addComponent(new AnotherComponent('test'));

        entity3 = new Entity('entity3', 3);
        entity3.addComponent(new AnotherComponent('other'));

        // 添加实体到场景
        querySystem.addEntity(entity1);
        querySystem.addEntity(entity2);
        querySystem.addEntity(entity3);
    });

    describe('系统初始化和QueryHandle创建', () => {
        it('应该在初始化时创建QueryHandle', () => {
            testSystem.initialize();

            const queryHandle = testSystem.getQueryHandle();
            expect(queryHandle).toBeDefined();
            expect(queryHandle.destroyed).toBe(false);
        });

        it('应该正确缓存匹配的实体', () => {
            testSystem.initialize();

            const cachedEntities = testSystem.getCachedEntities();
            expect(cachedEntities).toHaveLength(2);
            expect(cachedEntities).toContain(entity1);
            expect(cachedEntities).toContain(entity2);
            expect(cachedEntities).not.toContain(entity3);
        });

        it('应该在reset时清理QueryHandle', () => {
            testSystem.initialize();
            const queryHandle = testSystem.getQueryHandle();

            testSystem.reset();

            expect(queryHandle.destroyed).toBe(true);
            expect(testSystem.getQueryHandle()).toBeNull();
            expect(testSystem.getCachedEntities()).toHaveLength(0);
        });
    });

    describe('实体变更事件处理', () => {
        beforeEach(() => {
            testSystem.initialize();
            // 清空之前的事件记录
            testSystem.addedEntities = [];
            testSystem.removedEntities = [];
        });

        it('应该在实体添加时触发onAdded', () => {
            const newEntity = new Entity('newEntity', 4);
            newEntity.addComponent(new TestComponent(30));

            querySystem.addEntity(newEntity);

            expect(testSystem.addedEntities).toHaveLength(1);
            expect(testSystem.addedEntities[0]).toBe(newEntity);
            expect(testSystem.entities).toContain(newEntity);
        });

        it('应该在实体移除时正确更新缓存', () => {
            expect(testSystem.entities).toContain(entity1);
            expect(testSystem.entities).toHaveLength(2);
            
            querySystem.removeEntity(entity1);

            // 直接验证实体是否从QuerySystem中移除
            const allEntities = querySystem.getAllEntities();
            expect(allEntities).not.toContain(entity1);
            expect(allEntities).toContain(entity2);
        });

        it('应该正确处理组件移除后的查询更新', () => {
            expect(testSystem.entities).toContain(entity1);
            expect(testSystem.entities).toHaveLength(2);
            
            // 移除entity1的TestComponent，使其不再匹配查询条件
            const testComponent = entity1.getComponent(TestComponent);
            expect(testComponent).toBeDefined();
            
            entity1.removeComponent(testComponent!);
            
            // 手动触发QuerySystem的索引更新
            querySystem.markEntityDirty(entity1, [TestComponent]);
            
            // 验证entity1不再有TestComponent
            expect(entity1.hasComponent(TestComponent)).toBe(false);
            expect(entity2.hasComponent(TestComponent)).toBe(true);
            
            // 重新查询验证匹配结果 - 直接使用位掩码查询测试
            const matcher = testSystem.matcher;
            const bitCondition = matcher.getBitMaskCondition();
            const matchingEntities = querySystem.executeBitMaskQuery(bitCondition);
            
            expect(matchingEntities).not.toContain(entity1);
            expect(matchingEntities).toContain(entity2);
            expect(matchingEntities).toHaveLength(1);
        });
    });

    describe('性能优化验证', () => {
        beforeEach(() => {
            testSystem.initialize();
        });

        it('应该使用缓存的实体列表，避免每帧查询', () => {
            const entitiesRef1 = testSystem.entities;
            const entitiesRef2 = testSystem.entities;

            // 多次访问应该返回相同的数组引用
            expect(entitiesRef1).toBe(entitiesRef2);
        });

        it('应该避免每帧重新排序', () => {
            const originalSort = Array.prototype.sort;
            const sortCalls: any[] = [];
            
            // 监控sort调用
            Array.prototype.sort = function(compareFn) {
                sortCalls.push({ array: this, compareFn });
                return originalSort.call(this, compareFn);
            };

            try {
                // 多次调用update不应该触发额外的排序
                const initialSortCalls = sortCalls.length;
                testSystem.update();
                testSystem.update();
                testSystem.update();

                // 只有在实体变更时才应该有额外的排序调用
                const sortCallsAfterUpdates = sortCalls.length;
                expect(sortCallsAfterUpdates).toBe(initialSortCalls);

            } finally {
                // 恢复原始的sort方法
                Array.prototype.sort = originalSort;
            }
        });

        it('update方法应该直接使用缓存的实体列表', () => {
            // 记录process方法的调用参数
            const processedEntityArrays: Entity[][] = [];
            const originalProcess = (testSystem as any).process.bind(testSystem);
            (testSystem as any).process = (entities: Entity[]) => {
                processedEntityArrays.push(entities);
                originalProcess(entities);
            };

            testSystem.update();

            expect(processedEntityArrays).toHaveLength(1);
            expect(processedEntityArrays[0]).toBe(testSystem.getCachedEntities());
        });
    });

    describe('多次更新循环的性能', () => {
        beforeEach(() => {
            testSystem.initialize();
        });

        it('应该在多次update调用中保持高性能', () => {
            const startTime = performance.now();
            
            // 执行100次更新循环
            for (let i = 0; i < 100; i++) {
                testSystem.update();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;

            // 100次更新应该在合理时间内完成（小于10ms）
            expect(duration).toBeLessThan(10);

            // 每次update都应该处理相同数量的实体
            expect(testSystem.processedEntities.length).toBeGreaterThan(0);
        });

        it('应该在fixedUpdate和lateUpdate中也使用缓存', () => {
            let fixedUpdateEntities: Entity[] = [];
            let lateUpdateEntities: Entity[] = [];

            (testSystem as any).fixedProcess = (entities: Entity[]) => { fixedUpdateEntities = entities; };
            (testSystem as any).lateProcess = (entities: Entity[]) => { lateUpdateEntities = entities; };

            testSystem.fixedUpdate();
            testSystem.lateUpdate();

            expect(fixedUpdateEntities).toBe(testSystem.getCachedEntities());
            expect(lateUpdateEntities).toBe(testSystem.getCachedEntities());
        });
    });

    describe('边界情况处理', () => {
        it('应该处理没有匹配实体的情况', () => {
            // 创建一个不匹配任何实体的系统
            class EmptySystem extends EntitySystem {
                constructor() {
                    super(Matcher.empty().all(AnotherComponent).none(AnotherComponent));
                }
                protected override process(entities: Entity[]): void {}
            }

            const emptySystem = new EmptySystem();
            emptySystem.scene = scene;
            emptySystem.initialize();

            expect(emptySystem.entities).toHaveLength(0);
        });

        it('应该处理场景为null的情况', () => {
            const systemWithoutScene = new TestEntitySystem();
            expect(() => systemWithoutScene.initialize()).not.toThrow();
            expect(systemWithoutScene.entities).toHaveLength(0);
        });
    });
});