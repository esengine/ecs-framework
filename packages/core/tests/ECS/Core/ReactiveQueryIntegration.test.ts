import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { ReactiveQuery, ReactiveQueryChangeType } from '../../../src/ECS/Core/ReactiveQuery';

class TransformComponent extends Component {
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

class RenderableComponent extends Component {
    public visible: boolean = true;

    public reset(): void {
        this.visible = true;
    }
}

class ReactiveRenderSystem extends EntitySystem {
    private reactiveQuery!: ReactiveQuery;
    private addedCount = 0;
    private removedCount = 0;

    public override initialize(): void {
        super.initialize();

        if (this.scene) {
            this.reactiveQuery = this.scene.querySystem.createReactiveQuery(
                [TransformComponent, RenderableComponent],
                {
                    enableBatchMode: false
                }
            );

            this.reactiveQuery.subscribe((change) => {
                if (change.type === ReactiveQueryChangeType.ADDED) {
                    this.addedCount++;
                } else if (change.type === ReactiveQueryChangeType.REMOVED) {
                    this.removedCount++;
                }
            });
        }
    }

    public getAddedCount(): number {
        return this.addedCount;
    }

    public getRemovedCount(): number {
        return this.removedCount;
    }

    public getQueryEntities() {
        return this.reactiveQuery.getEntities();
    }

    public override dispose(): void {
        if (this.reactiveQuery && this.scene) {
            this.scene.querySystem.destroyReactiveQuery(this.reactiveQuery);
        }
    }
}

describe('ReactiveQuery集成测试', () => {
    let scene: Scene;
    let renderSystem: ReactiveRenderSystem;

    beforeEach(() => {
        scene = new Scene();
        renderSystem = new ReactiveRenderSystem(Matcher.empty());
        scene.addEntityProcessor(renderSystem);
    });

    afterEach(() => {
        scene.end();
        jest.clearAllTimers();
    });

    describe('EntitySystem集成', () => {
        test('应该在实体添加时收到通知', () => {
            const entity1 = scene.createEntity('entity1');
            entity1.addComponent(new TransformComponent(10, 20));
            entity1.addComponent(new RenderableComponent());

            expect(renderSystem.getAddedCount()).toBe(1);
            expect(renderSystem.getQueryEntities()).toContain(entity1);
        });

        test('应该在实体移除时收到通知', () => {
            const entity = scene.createEntity('entity');
            entity.addComponent(new TransformComponent(10, 20));
            entity.addComponent(new RenderableComponent());

            expect(renderSystem.getAddedCount()).toBe(1);

            scene.destroyEntities([entity]);

            expect(renderSystem.getRemovedCount()).toBe(1);
            expect(renderSystem.getQueryEntities()).not.toContain(entity);
        });

        test('应该在组件变化时收到正确通知', () => {
            const entity = scene.createEntity('entity');
            entity.addComponent(new TransformComponent(10, 20));

            expect(renderSystem.getAddedCount()).toBe(0);

            entity.addComponent(new RenderableComponent());

            expect(renderSystem.getAddedCount()).toBe(1);
            expect(renderSystem.getQueryEntities()).toContain(entity);

            const renderComp = entity.getComponent(RenderableComponent);
            if (renderComp) {
                entity.removeComponent(renderComp);
            }

            expect(renderSystem.getRemovedCount()).toBe(1);
            expect(renderSystem.getQueryEntities()).not.toContain(entity);
        });

        test('应该高效处理批量实体变化', () => {
            const entities = [];

            for (let i = 0; i < 100; i++) {
                const entity = scene.createEntity(`entity${i}`);
                entity.addComponent(new TransformComponent(i, i));
                entity.addComponent(new RenderableComponent());
                entities.push(entity);
            }

            expect(renderSystem.getAddedCount()).toBe(100);
            expect(renderSystem.getQueryEntities().length).toBe(100);

            scene.destroyEntities(entities);

            expect(renderSystem.getRemovedCount()).toBe(100);
            expect(renderSystem.getQueryEntities().length).toBe(0);
        });
    });

    describe('性能对比', () => {
        test('响应式查询应该避免每帧重复查询', () => {
            for (let i = 0; i < 50; i++) {
                const entity = scene.createEntity(`entity${i}`);
                entity.addComponent(new TransformComponent(i, i));
                entity.addComponent(new RenderableComponent());
            }

            expect(renderSystem.getAddedCount()).toBe(50);

            const initialCount = renderSystem.getAddedCount();

            for (let i = 0; i < 100; i++) {
                scene.update();
            }

            expect(renderSystem.getAddedCount()).toBe(initialCount);
        });
    });
});
