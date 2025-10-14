import { describe, it, expect, beforeEach } from '@jest/globals';
import { Scene, Entity, Component, EntitySystem, Matcher, ECSComponent } from '../src';

@ECSComponent('TestTransform')
class TestTransform extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

@ECSComponent('TestRenderable')
class TestRenderable extends Component {
    constructor(public sprite: string = 'default') {
        super();
    }
}

class TestRenderSystem extends EntitySystem {
    public entitiesFound: Entity[] = [];

    constructor() {
        super(Matcher.all(TestTransform, TestRenderable));
    }

    protected override process(entities: readonly Entity[]): void {
        this.entitiesFound = Array.from(entities);
        console.log(`TestRenderSystem.process: 找到 ${entities.length} 个实体`);
    }

    protected override onAdded(entity: Entity): void {
        console.log(`TestRenderSystem.onAdded: 实体 ${entity.name}(${entity.id}) 被添加`);
    }
}

describe('响应式查询调试', () => {
    let scene: Scene;
    let system: TestRenderSystem;

    beforeEach(() => {
        scene = new Scene();
        system = new TestRenderSystem();
        scene.addEntityProcessor(system);
        scene.begin();
    });

    it('应该在实体添加组件后能被System发现', () => {
        console.log('\n=== 测试开始 ===');

        // 1. 创建实体（此时没有组件）
        console.log('\n步骤1: 创建实体');
        const entity = scene.createEntity('TestEntity');
        console.log(`实体已创建: ${entity.name}(${entity.id})`);
        console.log(`QuerySystem中的实体数量: ${scene.querySystem.getAllEntities().length}`);

        // 2. 添加组件
        console.log('\n步骤2: 添加 TestTransform 组件');
        entity.addComponent(new TestTransform(100, 200));
        console.log(`实体组件数量: ${entity.components.length}`);

        console.log('\n步骤3: 添加 TestRenderable 组件');
        entity.addComponent(new TestRenderable('test-sprite'));
        console.log(`实体组件数量: ${entity.components.length}`);

        // 3. 触发系统更新
        console.log('\n步骤4: 更新Scene');
        scene.update();

        // 4. 检查System是否找到了实体
        console.log(`\nSystem找到的实体数量: ${system.entitiesFound.length}`);
        if (system.entitiesFound.length > 0) {
            console.log(`找到的实体: ${system.entitiesFound.map(e => `${e.name}(${e.id})`).join(', ')}`);
        }

        // 5. 直接查询QuerySystem
        console.log('\n步骤5: 直接查询QuerySystem');
        const queryResult = scene.querySystem.queryAll(TestTransform, TestRenderable);
        console.log(`QuerySystem.queryAll 返回: ${queryResult.entities.length} 个实体`);

        console.log('\n=== 测试结束 ===\n');

        expect(system.entitiesFound.length).toBe(1);
        expect(system.entitiesFound[0]).toBe(entity);
        expect(queryResult.entities.length).toBe(1);
        expect(queryResult.entities[0]).toBe(entity);
    });

    it('应该测试响应式查询的内部状态', () => {
        console.log('\n=== 响应式查询内部状态测试 ===');

        // 创建实体并添加组件
        const entity = scene.createEntity('TestEntity');
        entity.addComponent(new TestTransform(100, 200));
        entity.addComponent(new TestRenderable('test-sprite'));

        // 获取QuerySystem的内部状态
        const querySystem = scene.querySystem as any;
        console.log(`\n响应式查询数量: ${querySystem._reactiveQueries.size}`);
        console.log(`组件索引数量: ${querySystem._reactiveQueriesByComponent.size}`);

        // 检查响应式查询
        for (const [key, query] of querySystem._reactiveQueries) {
            console.log(`\n查询: ${key}`);
            console.log(`  实体数量: ${(query as any)._entities.length}`);
            console.log(`  实体ID集合: ${Array.from((query as any)._entityIdSet).join(', ')}`);
        }

        console.log('\n=== 测试结束 ===\n');
    });
});
