import { ArchetypeSystem } from '../src/ECS/Core/ArchetypeSystem';
import { ComponentIndexManager } from '../src/ECS/Core/ComponentIndex';
import { Entity } from '../src/ECS/Entity';
import { Component } from '../src/ECS/Component';

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
    public hp: number;

    constructor(...args: unknown[]) {
        super();
        const [hp = 100] = args as [number?];
        this.hp = hp;
    }
}

describe('ArchetypeSystem vs ComponentIndexManager 对比测试', () => {
    let archetypeSystem: ArchetypeSystem;
    let componentIndexManager: ComponentIndexManager;
    let entities: Entity[];

    beforeEach(() => {
        archetypeSystem = new ArchetypeSystem();
        componentIndexManager = new ComponentIndexManager();
        entities = [];
    });

    describe('功能等价性验证', () => {
        test('单组件查询应该返回相同结果', () => {
            // 创建测试实体
            for (let i = 0; i < 100; i++) {
                const entity = new Entity(`Entity${i}`, i);
                entity.addComponent(new PositionComponent(i, i));

                if (i % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }

                entities.push(entity);
                archetypeSystem.addEntity(entity);
                componentIndexManager.addEntity(entity);
            }

            // 使用 ArchetypeSystem 查询
            const archetypeEntities = archetypeSystem.getEntitiesByComponent(PositionComponent);

            // 使用 ComponentIndexManager 查询
            const indexEntities = Array.from(componentIndexManager.query(PositionComponent));

            // 应该返回相同数量
            expect(archetypeEntities.length).toBe(indexEntities.length);
            expect(archetypeEntities.length).toBe(100);

            // 应该包含相同的实体
            const archetypeIds = new Set(archetypeEntities.map(e => e.id));
            const indexIds = new Set(indexEntities.map(e => e.id));

            expect(archetypeIds).toEqual(indexIds);
        });

        test('多组件 AND 查询应该返回相同结果', () => {
            // 创建测试实体
            for (let i = 0; i < 100; i++) {
                const entity = new Entity(`Entity${i}`, i);
                entity.addComponent(new PositionComponent(i, i));

                if (i % 2 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }

                if (i % 3 === 0) {
                    entity.addComponent(new HealthComponent(100));
                }

                entities.push(entity);
                archetypeSystem.addEntity(entity);
                componentIndexManager.addEntity(entity);
            }

            // ArchetypeSystem 查询
            const archetypeResult = archetypeSystem.queryArchetypes([PositionComponent, VelocityComponent], 'AND');
            const archetypeEntities: Entity[] = [];
            for (const archetype of archetypeResult.archetypes) {
                for (const entity of archetype.entities) {
                    archetypeEntities.push(entity);
                }
            }

            // ComponentIndexManager 查询
            const indexEntities = Array.from(componentIndexManager.queryMultiple([PositionComponent, VelocityComponent], 'AND'));

            // 验证结果
            expect(archetypeEntities.length).toBe(indexEntities.length);
            expect(archetypeEntities.length).toBe(50); // i % 2 === 0

            const archetypeIds = new Set(archetypeEntities.map(e => e.id));
            const indexIds = new Set(indexEntities.map(e => e.id));
            expect(archetypeIds).toEqual(indexIds);
        });

        test('多组件 OR 查询应该返回相同结果', () => {
            // 创建测试实体
            for (let i = 0; i < 100; i++) {
                const entity = new Entity(`Entity${i}`, i);

                if (i % 2 === 0) {
                    entity.addComponent(new PositionComponent(i, i));
                }

                if (i % 3 === 0) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }

                entities.push(entity);
                archetypeSystem.addEntity(entity);
                componentIndexManager.addEntity(entity);
            }

            // ArchetypeSystem 查询
            const archetypeResult = archetypeSystem.queryArchetypes([PositionComponent, VelocityComponent], 'OR');
            const archetypeEntities: Entity[] = [];
            for (const archetype of archetypeResult.archetypes) {
                for (const entity of archetype.entities) {
                    archetypeEntities.push(entity);
                }
            }

            // ComponentIndexManager 查询
            const indexEntities = Array.from(componentIndexManager.queryMultiple([PositionComponent, VelocityComponent], 'OR'));

            // 验证结果 - 有 Position 或 Velocity 的实体
            expect(archetypeEntities.length).toBe(indexEntities.length);

            const archetypeIds = new Set(archetypeEntities.map(e => e.id));
            const indexIds = new Set(indexEntities.map(e => e.id));
            expect(archetypeIds).toEqual(indexIds);
        });

        test('空查询应该返回空结果', () => {
            // 创建一些实体但不添加 HealthComponent
            for (let i = 0; i < 10; i++) {
                const entity = new Entity(`Entity${i}`, i);
                entity.addComponent(new PositionComponent(i, i));
                archetypeSystem.addEntity(entity);
                componentIndexManager.addEntity(entity);
            }

            // 查询不存在的组件
            const archetypeEntities = archetypeSystem.getEntitiesByComponent(HealthComponent);
            const indexEntities = Array.from(componentIndexManager.query(HealthComponent));

            expect(archetypeEntities.length).toBe(0);
            expect(indexEntities.length).toBe(0);
        });
    });

    describe('性能对比', () => {
        test('单组件查询性能对比', () => {
            // 准备大量数据
            for (let i = 0; i < 1000; i++) {
                const entity = new Entity(`Entity${i}`, i);
                entity.addComponent(new PositionComponent(i, i));
                archetypeSystem.addEntity(entity);
                componentIndexManager.addEntity(entity);
            }

            // ArchetypeSystem 性能测试
            const archetypeStart = performance.now();
            for (let i = 0; i < 100; i++) {
                archetypeSystem.getEntitiesByComponent(PositionComponent);
            }
            const archetypeDuration = performance.now() - archetypeStart;

            // ComponentIndexManager 性能测试
            const indexStart = performance.now();
            for (let i = 0; i < 100; i++) {
                componentIndexManager.query(PositionComponent);
            }
            const indexDuration = performance.now() - indexStart;

            console.log(`ArchetypeSystem: ${archetypeDuration.toFixed(2)}ms`);
            console.log(`ComponentIndexManager: ${indexDuration.toFixed(2)}ms`);
            console.log(`Ratio: ${(archetypeDuration / indexDuration).toFixed(2)}x`);

            // 两者应该都很快
            expect(archetypeDuration).toBeLessThan(100);
            expect(indexDuration).toBeLessThan(100);
        });
    });
});