import { describe, it, expect } from '@jest/globals';
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

class TestGameScene extends Scene {
    private renderSystem: TestRenderSystem | null = null;

    public override initialize(): void {
        super.initialize();

        console.log('\n=== Scene.initialize() 开始 ===');

        // 1. 先添加System（这是GameScene的做法）
        console.log('步骤1: 添加RenderSystem');
        this.renderSystem = new TestRenderSystem();
        this.addEntityProcessor(this.renderSystem);

        // 2. 然后创建实体（这是GameScene的做法）
        console.log('\n步骤2: 创建实体');
        const entity = this.createEntity('Player');
        console.log(`实体已创建: ${entity.name}(${entity.id})`);

        console.log('\n步骤3: 添加组件');
        entity.addComponent(new TestTransform(100, 200));
        entity.addComponent(new TestRenderable('player-sprite'));
        console.log(`实体组件数量: ${entity.components.length}`);

        console.log('=== Scene.initialize() 结束 ===\n');
    }

    public getRenderSystem(): TestRenderSystem | null {
        return this.renderSystem;
    }
}

describe('响应式查询时序测试（模拟GameScene）', () => {
    it('应该在Scene.initialize()中先添加System再创建实体时正常工作', () => {
        console.log('\n\n========== 测试开始 ==========');

        const scene = new TestGameScene();

        console.log('\n调用scene.initialize()');
        scene.initialize();

        console.log('\n调用Scene.begin()');
        scene.begin();

        console.log('\n第一次Scene.update()');
        scene.update();

        const renderSystem = scene.getRenderSystem();
        expect(renderSystem).not.toBeNull();

        console.log(`\nRenderSystem找到的实体数量: ${renderSystem!.entitiesFound.length}`);
        expect(renderSystem!.entitiesFound.length).toBe(1);

        console.log('========== 测试结束 ==========\n\n');
    });
});
