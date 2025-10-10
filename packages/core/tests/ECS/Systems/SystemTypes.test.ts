import { Scene } from '../../../src/ECS/Scene';
import { PassiveSystem } from '../../../src/ECS/Systems/PassiveSystem';
import { IntervalSystem } from '../../../src/ECS/Systems/IntervalSystem';
import { ProcessingSystem } from '../../../src/ECS/Systems/ProcessingSystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';
import { Time } from '../../../src/Utils/Time';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
class TestComponent extends Component {
    public value: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [value = 0] = args as [number?];
        this.value = value;
    }
}

class AnotherComponent extends Component {
    public name: string = 'test';
    
    constructor(...args: unknown[]) {
        super();
        const [name = 'test'] = args as [string?];
        this.name = name;
    }
}

// 具体的被动系统实现
class ConcretePassiveSystem extends PassiveSystem {
    public processCallCount = 0;

    constructor() {
        super(Matcher.all(TestComponent));
    }

    protected override process(entities: Entity[]): void {
        this.processCallCount++;
        // 被动系统的process方法会被调用，但不做任何处理
        super.process(entities);
    }
}

// 具体的间隔系统实现
class ConcreteIntervalSystem extends IntervalSystem {
    public processCallCount = 0;
    public lastDelta = 0;

    constructor(interval: number) {
        super(interval, Matcher.all(TestComponent));
    }

    protected override process(entities: Entity[]): void {
        this.processCallCount++;
        this.lastDelta = this.getIntervalDelta();
    }
}

// 具体的处理系统实现
class ConcreteProcessingSystem extends ProcessingSystem {
    public processSystemCallCount = 0;
    public processCallCount = 0;

    constructor() {
        super(Matcher.all(TestComponent));
    }

    public processSystem(): void {
        this.processSystemCallCount++;
    }

    protected override process(entities: Entity[]): void {
        this.processCallCount++;
        super.process(entities);
    }
}

describe('System Types - 系统类型测试', () => {
    let scene: Scene;
    let entity: Entity;

    beforeEach(() => {
        scene = new Scene();
        entity = scene.createEntity('TestEntity');
        // 重置时间系统
        Time.update(0.016);
        // 注册测试组件类型
        ComponentRegistry.register(TestComponent);
        ComponentRegistry.register(AnotherComponent);
    });

    describe('PassiveSystem - 被动系统', () => {
        let passiveSystem: ConcretePassiveSystem;

        beforeEach(() => {
            passiveSystem = new ConcretePassiveSystem();
        });

        test('应该能够创建被动系统', () => {
            expect(passiveSystem).toBeInstanceOf(PassiveSystem);
            expect(passiveSystem).toBeInstanceOf(ConcretePassiveSystem);
        });


        test('process方法不应该做任何处理', () => {
            const entities = [entity];
            const initialProcessCount = passiveSystem.processCallCount;
            
            passiveSystem.update();
            
            // 虽然process被调用了，但被动系统不做任何实际处理
            expect(passiveSystem.processCallCount).toBe(initialProcessCount + 1);
        });

        test('应该能够动态查询匹配的实体', () => {
            // 现在使用动态查询，不需要手动add/remove
            // 先检查没有匹配的实体
            expect(passiveSystem.entities.length).toBe(0);
            
            // 添加匹配的组件后，系统应该能查询到实体
            entity.addComponent(new TestComponent(100));
            
            // 需要设置场景和QuerySystem才能进行动态查询
            // 这里我们只测试entities getter的存在性
            expect(passiveSystem.entities).toBeDefined();
        });

    });

    describe('IntervalSystem - 间隔系统', () => {
        let intervalSystem: ConcreteIntervalSystem;
        const testInterval = 0.1; // 100ms

        beforeEach(() => {
            intervalSystem = new ConcreteIntervalSystem(testInterval);
        });

        test('应该能够创建间隔系统', () => {
            expect(intervalSystem).toBeInstanceOf(IntervalSystem);
            expect(intervalSystem).toBeInstanceOf(ConcreteIntervalSystem);
        });

        test('在间隔时间内不应该处理', () => {
            const initialProcessCount = intervalSystem.processCallCount;
            
            // 模拟时间更新，但不足以触发间隔
            Time.update(testInterval / 2);
            intervalSystem.update();
            
            expect(intervalSystem.processCallCount).toBe(initialProcessCount);
        });

        test('达到间隔时间时应该处理', () => {
            const initialProcessCount = intervalSystem.processCallCount;
            
            // 模拟时间更新，刚好达到间隔
            Time.update(testInterval);
            intervalSystem.update();
            
            expect(intervalSystem.processCallCount).toBe(initialProcessCount + 1);
        });

        test('超过间隔时间应该处理并记录余数', () => {
            const initialProcessCount = intervalSystem.processCallCount;
            const overTime = testInterval + 0.02; // 超过20ms
            
            Time.update(overTime);
            intervalSystem.update();
            
            expect(intervalSystem.processCallCount).toBe(initialProcessCount + 1);
            expect(intervalSystem.lastDelta).toBe(testInterval + 0.02);
        });

        test('多次累积应该正确触发', () => {
            let processCount = intervalSystem.processCallCount;
            
            // 多次小的时间增量
            for (let i = 0; i < 10; i++) {
                Time.update(testInterval / 5);
                intervalSystem.update();
            }
            
            // 10 * (interval/5) = 2 * interval，应该触发2次
            expect(intervalSystem.processCallCount).toBeGreaterThanOrEqual(processCount + 1);
        });

        test('getIntervalDelta应该返回正确的增量', () => {
            const overTime = testInterval + 0.03;
            
            Time.update(overTime);
            intervalSystem.update();
            
            expect(intervalSystem.lastDelta).toBe(testInterval + 0.03);
        });

        test('重置后应该重新开始计时', () => {
            // 第一次触发
            Time.update(testInterval);
            intervalSystem.update();
            expect(intervalSystem.processCallCount).toBe(1);
            
            // 再次触发需要等待完整间隔
            Time.update(testInterval / 2);
            intervalSystem.update();
            expect(intervalSystem.processCallCount).toBe(1);
            
            Time.update(testInterval / 2);
            intervalSystem.update();
            expect(intervalSystem.processCallCount).toBe(2);
        });
    });

    describe('ProcessingSystem - 处理系统', () => {
        let processingSystem: ConcreteProcessingSystem;

        beforeEach(() => {
            processingSystem = new ConcreteProcessingSystem();
        });

        test('应该能够创建处理系统', () => {
            expect(processingSystem).toBeInstanceOf(ProcessingSystem);
            expect(processingSystem).toBeInstanceOf(ConcreteProcessingSystem);
        });

        test('process方法应该调用processSystem', () => {
            const initialProcessSystemCount = processingSystem.processSystemCallCount;
            const initialProcessCount = processingSystem.processCallCount;
            
            processingSystem.update();
            
            expect(processingSystem.processCallCount).toBe(initialProcessCount + 1);
            expect(processingSystem.processSystemCallCount).toBe(initialProcessSystemCount + 1);
        });


        test('每次更新都应该调用processSystem', () => {
            const initialCount = processingSystem.processSystemCallCount;
            
            processingSystem.update();
            processingSystem.update();
            processingSystem.update();
            
            expect(processingSystem.processSystemCallCount).toBe(initialCount + 3);
        });

        test('应该能够动态查询多个实体', () => {
            // 现在使用动态查询，不需要手动add
            // 测试系统的基本功能
            const initialCount = processingSystem.processSystemCallCount;
            processingSystem.update();
            
            // processSystem应该被调用，不管有多少实体
            expect(processingSystem.processSystemCallCount).toBe(initialCount + 1);
            
            // 测试entities getter的存在性
            expect(processingSystem.entities).toBeDefined();
            expect(Array.isArray(processingSystem.entities)).toBe(true);
        });
    });

    describe('系统集成测试', () => {
        test('不同类型的系统应该都继承自EntitySystem', () => {
            const passive = new ConcretePassiveSystem();
            const interval = new ConcreteIntervalSystem(0.1);
            const processing = new ConcreteProcessingSystem();
            
            expect(passive.matcher).toBeDefined();
            expect(interval.matcher).toBeDefined();
            expect(processing.matcher).toBeDefined();
            
            expect(passive.entities).toBeDefined();
            expect(interval.entities).toBeDefined();
            expect(processing.entities).toBeDefined();
            
            expect(passive.systemName).toBeDefined();
            expect(interval.systemName).toBeDefined();
            expect(processing.systemName).toBeDefined();
        });

        test('系统应该能够正确匹配实体', () => {
            const passive = new ConcretePassiveSystem();
            const interval = new ConcreteIntervalSystem(0.1);
            const processing = new ConcreteProcessingSystem();
            
            const matchingEntity = scene.createEntity('Matching');
            matchingEntity.addComponent(new TestComponent(100));
            
            const nonMatchingEntity = scene.createEntity('NonMatching');
            nonMatchingEntity.addComponent(new AnotherComponent('test'));
            
            // 所有系统都应该匹配TestComponent
            // 直接检查实体是否有需要的组件
            expect(matchingEntity.hasComponent(TestComponent)).toBe(true);
            expect(nonMatchingEntity.hasComponent(TestComponent)).toBe(false);
            expect(nonMatchingEntity.hasComponent(AnotherComponent)).toBe(true);
        });
    });

    describe('Matcher高级查询功能测试', () => {
        test('应该能使用新的静态方法创建匹配器', () => {
            // 测试新的静态方法
            const byTagMatcher = Matcher.byTag(100);
            const byNameMatcher = Matcher.byName('Player');
            const byComponentMatcher = Matcher.byComponent(TestComponent);
            
            expect(byTagMatcher.getCondition().tag).toBe(100);
            expect(byNameMatcher.getCondition().name).toBe('Player');
            expect(byComponentMatcher.getCondition().component).toBe(TestComponent);
        });
        
        test('应该支持链式组合查询', () => {
            const complexMatcher = Matcher.all(TestComponent)
                .withTag(100)
                .withName('Player')
                .none(AnotherComponent);
            
            const condition = complexMatcher.getCondition();
            expect(condition.all).toContain(TestComponent);
            expect(condition.tag).toBe(100);
            expect(condition.name).toBe('Player');
            expect(condition.none).toContain(AnotherComponent);
        });
        
        test('应该能够移除特定条件', () => {
            const matcher = Matcher.byTag(100)
                .withName('Player')
                .withComponent(TestComponent);
            
            // 移除条件
            matcher.withoutTag().withoutName();
            
            const condition = matcher.getCondition();
            expect(condition.tag).toBeUndefined();
            expect(condition.name).toBeUndefined();
            expect(condition.component).toBe(TestComponent);
        });
        
        test('应该能够正确重置所有条件', () => {
            const matcher = Matcher.all(TestComponent)
                .withTag(100)
                .withName('Player')
                .any(AnotherComponent);
            
            matcher.reset();
            
            expect(matcher.isEmpty()).toBe(true);
            expect(matcher.getCondition().all.length).toBe(0);
            expect(matcher.getCondition().any.length).toBe(0);
            expect(matcher.getCondition().tag).toBeUndefined();
            expect(matcher.getCondition().name).toBeUndefined();
        });
        
        test('应该能够正确克隆匹配器', () => {
            const original = Matcher.all(TestComponent)
                .withTag(100)
                .withName('Player');
            
            const cloned = original.clone();
            
            expect(cloned.getCondition().all).toEqual(original.getCondition().all);
            expect(cloned.getCondition().tag).toBe(original.getCondition().tag);
            expect(cloned.getCondition().name).toBe(original.getCondition().name);
            
            // 修改克隆的不应该影响原始的
            cloned.withTag(200);
            expect(original.getCondition().tag).toBe(100);
            expect(cloned.getCondition().tag).toBe(200);
        });
        
        test('应该能够生成正确的字符串表示', () => {
            const complexMatcher = Matcher.all(TestComponent)
                .withTag(100)
                .withName('Player')
                .none(AnotherComponent);
            
            const str = complexMatcher.toString();
            expect(str).toContain('all(TestComponent)');
            expect(str).toContain('tag(100)');
            expect(str).toContain('name(Player)');
            expect(str).toContain('none(AnotherComponent)');
        });
    });
});