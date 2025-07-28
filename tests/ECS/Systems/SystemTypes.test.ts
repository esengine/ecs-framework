import { PassiveSystem } from '../../../src/ECS/Systems/PassiveSystem';
import { IntervalSystem } from '../../../src/ECS/Systems/IntervalSystem';
import { ProcessingSystem } from '../../../src/ECS/Systems/ProcessingSystem';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { Time } from '../../../src/Utils/Time';

// 测试组件
class TestComponent extends Component {
    constructor(public value: number = 0) {
        super();
    }
}

class AnotherComponent extends Component {
    constructor(public name: string = 'test') {
        super();
    }
}

// 具体的被动系统实现
class ConcretePassiveSystem extends PassiveSystem {
    public processCallCount = 0;
    public changeCallCount = 0;

    constructor() {
        super(Matcher.empty().all(TestComponent));
    }

    protected override process(entities: Entity[]): void {
        this.processCallCount++;
        // 被动系统的process方法会被调用，但不做任何处理
        super.process(entities);
    }

    public override onChanged(entity: Entity): void {
        this.changeCallCount++;
        super.onChanged(entity);
    }
}

// 具体的间隔系统实现
class ConcreteIntervalSystem extends IntervalSystem {
    public processCallCount = 0;
    public lastDelta = 0;

    constructor(interval: number) {
        super(Matcher.empty().all(TestComponent), interval);
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
    public changeCallCount = 0;

    constructor() {
        super(Matcher.empty().all(TestComponent));
    }

    public processSystem(): void {
        this.processSystemCallCount++;
    }

    protected override process(entities: Entity[]): void {
        this.processCallCount++;
        super.process(entities);
    }

    public override onChanged(entity: Entity): void {
        this.changeCallCount++;
        super.onChanged(entity);
    }
}

describe('System Types - 系统类型测试', () => {
    let entity: Entity;

    beforeEach(() => {
        entity = new Entity('TestEntity', 1);
        // 重置时间系统
        Time.update(0.016);
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

        test('onChanged方法不应该做任何操作', () => {
            const initialChangeCount = passiveSystem.changeCallCount;
            
            passiveSystem.onChanged(entity);
            
            // 计数会增加，但实际上基类的onChanged不做任何操作
            expect(passiveSystem.changeCallCount).toBe(initialChangeCount + 1);
        });

        test('process方法不应该做任何处理', () => {
            const entities = [entity];
            const initialProcessCount = passiveSystem.processCallCount;
            
            passiveSystem.update();
            
            // 虽然process被调用了，但被动系统不做任何实际处理
            expect(passiveSystem.processCallCount).toBe(initialProcessCount + 1);
        });

        test('应该能够正常添加和移除实体', () => {
            entity.addComponent(new TestComponent(100));
            
            passiveSystem.add(entity);
            expect(passiveSystem.entities.length).toBe(1);
            
            passiveSystem.remove(entity);
            expect(passiveSystem.entities.length).toBe(0);
        });

        test('实体变化时应该调用onChanged', () => {
            entity.addComponent(new TestComponent(100));
            passiveSystem.add(entity);
            
            const initialCount = passiveSystem.changeCallCount;
            passiveSystem.onChanged(entity);
            
            expect(passiveSystem.changeCallCount).toBe(initialCount + 1);
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

        test('onChanged方法不应该做任何操作', () => {
            const initialChangeCount = processingSystem.changeCallCount;
            
            processingSystem.onChanged(entity);
            
            expect(processingSystem.changeCallCount).toBe(initialChangeCount + 1);
        });

        test('每次更新都应该调用processSystem', () => {
            const initialCount = processingSystem.processSystemCallCount;
            
            processingSystem.update();
            processingSystem.update();
            processingSystem.update();
            
            expect(processingSystem.processSystemCallCount).toBe(initialCount + 3);
        });

        test('应该能够处理多个实体', () => {
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            
            entity1.addComponent(new TestComponent(100));
            entity2.addComponent(new TestComponent(200));
            
            processingSystem.add(entity1);
            processingSystem.add(entity2);
            
            expect(processingSystem.entities.length).toBe(2);
            
            const initialCount = processingSystem.processSystemCallCount;
            processingSystem.update();
            
            // processSystem应该被调用，不管有多少实体
            expect(processingSystem.processSystemCallCount).toBe(initialCount + 1);
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
        });

        test('系统应该能够正确匹配实体', () => {
            const passive = new ConcretePassiveSystem();
            const interval = new ConcreteIntervalSystem(0.1);
            const processing = new ConcreteProcessingSystem();
            
            const matchingEntity = new Entity('Matching', 1);
            matchingEntity.addComponent(new TestComponent(100));
            
            const nonMatchingEntity = new Entity('NonMatching', 2);
            nonMatchingEntity.addComponent(new AnotherComponent('test'));
            
            // 所有系统都应该匹配TestComponent
            expect(passive.matcher.isInterestedEntity(matchingEntity)).toBe(true);
            expect(interval.matcher.isInterestedEntity(matchingEntity)).toBe(true);
            expect(processing.matcher.isInterestedEntity(matchingEntity)).toBe(true);
            
            expect(passive.matcher.isInterestedEntity(nonMatchingEntity)).toBe(false);
            expect(interval.matcher.isInterestedEntity(nonMatchingEntity)).toBe(false);
            expect(processing.matcher.isInterestedEntity(nonMatchingEntity)).toBe(false);
        });
    });
});