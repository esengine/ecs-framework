import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { ReactiveQueryChangeType } from '../../../src/ECS/Core/ReactiveQuery';

class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }

    public reset(): void {
        this.x = 0;
        this.y = 0;
    }
}

class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;

    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }

    public reset(): void {
        this.vx = 0;
        this.vy = 0;
    }
}

class HealthComponent extends Component {
    public hp: number = 100;

    constructor(hp: number = 100) {
        super();
        this.hp = hp;
    }

    public reset(): void {
        this.hp = 100;
    }
}

describe('ReactiveQuery', () => {
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene();
    });

    afterEach(() => {
        scene.end();
        jest.clearAllTimers();
    });

    describe('基础功能', () => {
        test('应该能够创建响应式查询', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent]);

            expect(query).toBeDefined();
            expect(query.count).toBe(0);
            expect(query.getEntities()).toEqual([]);
        });

        test('应该能够初始化查询结果', () => {
            const entity1 = scene.createEntity('entity1');
            entity1.addComponent(new PositionComponent(10, 20));

            const entity2 = scene.createEntity('entity2');
            entity2.addComponent(new PositionComponent(30, 40));

            const query = scene.querySystem.createReactiveQuery([PositionComponent]);

            expect(query.count).toBe(2);
            expect(query.getEntities()).toContain(entity1);
            expect(query.getEntities()).toContain(entity2);
        });

        test('应该能够销毁响应式查询', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent]);

            scene.querySystem.destroyReactiveQuery(query);

            expect(query.active).toBe(false);
        });
    });

    describe('实体添加通知', () => {
        test('应该在添加匹配实体时通知订阅者', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            const entity = scene.createEntity('test');
            entity.addComponent(new PositionComponent(10, 20));

            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe(ReactiveQueryChangeType.ADDED);
            expect(changes[0].entity).toBe(entity);
        });

        test('不应该在添加不匹配实体时通知订阅者', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            const entity = scene.createEntity('test');
            entity.addComponent(new HealthComponent(100));

            expect(changes).toHaveLength(0);
        });

        test('批量模式应该合并通知', (done) => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: true,
                batchDelay: 10
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            const entity1 = scene.createEntity('entity1');
            entity1.addComponent(new PositionComponent(10, 20));

            const entity2 = scene.createEntity('entity2');
            entity2.addComponent(new PositionComponent(30, 40));

            setTimeout(() => {
                expect(changes).toHaveLength(1);
                expect(changes[0].type).toBe(ReactiveQueryChangeType.BATCH_UPDATE);
                expect(changes[0].added).toHaveLength(2);
                done();
            }, 50);
        });
    });

    describe('实体移除通知', () => {
        test('应该在移除匹配实体时通知订阅者', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new PositionComponent(10, 20));

            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            scene.destroyEntities([entity]);

            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe(ReactiveQueryChangeType.REMOVED);
            expect(changes[0].entity).toBe(entity);
        });

        test('不应该在移除不匹配实体时通知订阅者', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new HealthComponent(100));

            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            scene.destroyEntities([entity]);

            expect(changes).toHaveLength(0);
        });
    });

    describe('实体变化通知', () => {
        test('应该在实体从不匹配变为匹配时通知添加', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new HealthComponent(100));

            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            entity.addComponent(new PositionComponent(10, 20));

            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe(ReactiveQueryChangeType.ADDED);
            expect(changes[0].entity).toBe(entity);
        });

        test('应该在实体从匹配变为不匹配时通知移除', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new PositionComponent(10, 20));

            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            const positionComp = entity.getComponent(PositionComponent);
            if (positionComp) {
                entity.removeComponent(positionComp);
            }

            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe(ReactiveQueryChangeType.REMOVED);
            expect(changes[0].entity).toBe(entity);
        });

        test('应该在实体组件变化但仍匹配时不通知', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new PositionComponent(10, 20));
            entity.addComponent(new HealthComponent(100));

            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            const healthComp = entity.getComponent(HealthComponent);
            if (healthComp) {
                entity.removeComponent(healthComp);
            }

            expect(changes).toHaveLength(0);
        });
    });

    describe('多组件查询', () => {
        test('应该正确匹配多个组件', () => {
            const entity1 = scene.createEntity('entity1');
            entity1.addComponent(new PositionComponent(10, 20));
            entity1.addComponent(new VelocityComponent(1, 1));

            const entity2 = scene.createEntity('entity2');
            entity2.addComponent(new PositionComponent(30, 40));

            const query = scene.querySystem.createReactiveQuery([PositionComponent, VelocityComponent]);

            expect(query.count).toBe(1);
            expect(query.getEntities()).toContain(entity1);
            expect(query.getEntities()).not.toContain(entity2);
        });

        test('应该在实体满足所有组件时通知添加', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new PositionComponent(10, 20));

            const query = scene.querySystem.createReactiveQuery([PositionComponent, VelocityComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            entity.addComponent(new VelocityComponent(1, 1));

            expect(changes).toHaveLength(1);
            expect(changes[0].type).toBe(ReactiveQueryChangeType.ADDED);
            expect(changes[0].entity).toBe(entity);
        });
    });

    describe('订阅管理', () => {
        test('应该能够取消订阅', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            const unsubscribe = query.subscribe((change) => {
                changes.push(change);
            });

            const entity1 = scene.createEntity('entity1');
            entity1.addComponent(new PositionComponent(10, 20));

            expect(changes).toHaveLength(1);

            unsubscribe();

            const entity2 = scene.createEntity('entity2');
            entity2.addComponent(new PositionComponent(30, 40));

            expect(changes).toHaveLength(1);
        });

        test('应该能够取消所有订阅', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes1: any[] = [];
            query.subscribe((change) => {
                changes1.push(change);
            });

            const changes2: any[] = [];
            query.subscribe((change) => {
                changes2.push(change);
            });

            const entity1 = scene.createEntity('entity1');
            entity1.addComponent(new PositionComponent(10, 20));

            expect(changes1).toHaveLength(1);
            expect(changes2).toHaveLength(1);

            query.unsubscribeAll();

            const entity2 = scene.createEntity('entity2');
            entity2.addComponent(new PositionComponent(30, 40));

            expect(changes1).toHaveLength(1);
            expect(changes2).toHaveLength(1);
        });

        test('应该能够暂停和恢复查询', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            query.pause();

            const entity1 = scene.createEntity('entity1');
            entity1.addComponent(new PositionComponent(10, 20));

            expect(changes).toHaveLength(0);

            query.resume();

            const entity2 = scene.createEntity('entity2');
            entity2.addComponent(new PositionComponent(30, 40));

            expect(changes).toHaveLength(1);
        });
    });

    describe('性能测试', () => {
        test('应该高效处理大量实体变化', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            let changeCount = 0;
            query.subscribe(() => {
                changeCount++;
            });

            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                const entity = scene.createEntity(`entity${i}`);
                entity.addComponent(new PositionComponent(i, i));
            }

            const endTime = performance.now();

            expect(changeCount).toBe(1000);
            expect(endTime - startTime).toBeLessThan(100);
        });

        test('批量模式应该减少通知次数', (done) => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: true,
                batchDelay: 10
            });

            let changeCount = 0;
            query.subscribe(() => {
                changeCount++;
            });

            for (let i = 0; i < 100; i++) {
                const entity = scene.createEntity(`entity${i}`);
                entity.addComponent(new PositionComponent(i, i));
            }

            setTimeout(() => {
                expect(changeCount).toBe(1);
                done();
            }, 50);
        });
    });

    describe('边界情况', () => {
        test('应该处理重复添加同一实体', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new PositionComponent(10, 20));

            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            scene.querySystem.addEntity(entity);
            scene.querySystem.addEntity(entity);

            expect(changes).toHaveLength(0);
        });

        test('应该处理查询结果为空的情况', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent]);

            expect(query.count).toBe(0);
            expect(query.getEntities()).toEqual([]);
        });

        test('应该在销毁后停止通知', () => {
            const query = scene.querySystem.createReactiveQuery([PositionComponent], {
                enableBatchMode: false
            });

            const changes: any[] = [];
            query.subscribe((change) => {
                changes.push(change);
            });

            query.dispose();

            const entity = scene.createEntity('test');
            entity.addComponent(new PositionComponent(10, 20));

            expect(changes).toHaveLength(0);
        });
    });
});
