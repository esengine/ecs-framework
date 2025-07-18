import { Entity } from '../../src/ECS/Entity';
import { Component } from '../../src/ECS/Component';

// 测试组件类
class PerfTestComponent1 extends Component {
    public value: number = 1;
}

class PerfTestComponent2 extends Component {
    public value: number = 2;
}

class PerfTestComponent3 extends Component {
    public value: number = 3;
}

class PerfTestComponent4 extends Component {
    public value: number = 4;
}

class PerfTestComponent5 extends Component {
    public value: number = 5;
}

class PerfTestComponent6 extends Component {
    public value: number = 6;
}

class PerfTestComponent7 extends Component {
    public value: number = 7;
}

class PerfTestComponent8 extends Component {
    public value: number = 8;
}

describe('Entity - 性能测试', () => {

    describe('典型游戏实体性能测试', () => {
        test('3-5个组件的实体性能测试', () => {
            const entity = new Entity('TypicalEntity', 1);
            
            // 添加典型游戏实体的组件数量（3-5个）
            entity.addComponent(new PerfTestComponent1());
            entity.addComponent(new PerfTestComponent2());
            entity.addComponent(new PerfTestComponent3());
            entity.addComponent(new PerfTestComponent4());
            entity.addComponent(new PerfTestComponent5());

            const iterations = 10000;
            const startTime = performance.now();

            // 模拟典型的组件访问模式
            for (let i = 0; i < iterations; i++) {
                entity.getComponent(PerfTestComponent1);
                entity.getComponent(PerfTestComponent3);
                entity.getComponent(PerfTestComponent5);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`典型实体(5组件) ${iterations * 3}次组件获取耗时: ${duration.toFixed(2)}ms`);
            
            // 优化后应该有很好的性能
            expect(duration).toBeLessThan(50); // 应该在50ms内完成
        });

        test('内存使用优化验证', () => {
            const entities: Entity[] = [];
            const entityCount = 1000;

            // 创建大量实体，每个实体有少量组件
            for (let i = 0; i < entityCount; i++) {
                const entity = new Entity(`Entity_${i}`, i);
                entity.addComponent(new PerfTestComponent1());
                entity.addComponent(new PerfTestComponent2());
                entity.addComponent(new PerfTestComponent3());
                entities.push(entity);
            }

            // 测试批量组件访问性能
            const startTime = performance.now();

            for (const entity of entities) {
                entity.getComponent(PerfTestComponent1);
                entity.getComponent(PerfTestComponent2);
                entity.getComponent(PerfTestComponent3);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`${entityCount}个实体，每个3个组件，总计${entityCount * 3}次组件获取耗时: ${duration.toFixed(2)}ms`);
            
            // 优化后的内存使用应该更高效
            expect(duration).toBeLessThan(100); // 应该在100ms内完成
        });

        test('组件添加和移除性能测试', () => {
            const entity = new Entity('TestEntity', 1);
            const iterations = 1000;

            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                // 添加组件
                const comp1 = entity.addComponent(new PerfTestComponent1());
                const comp2 = entity.addComponent(new PerfTestComponent2());
                const comp3 = entity.addComponent(new PerfTestComponent3());

                // 获取组件
                entity.getComponent(PerfTestComponent1);
                entity.getComponent(PerfTestComponent2);
                entity.getComponent(PerfTestComponent3);

                // 移除组件
                entity.removeComponent(comp1);
                entity.removeComponent(comp2);
                entity.removeComponent(comp3);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`${iterations}次组件添加-获取-移除循环耗时: ${duration.toFixed(2)}ms`);
            
            // 优化后应该有良好的添加/移除性能
            expect(duration).toBeLessThan(200); // 应该在200ms内完成
        });
    });

    describe('极端情况性能测试', () => {
        test('单个组件高频访问性能', () => {
            const entity = new Entity('SingleComponentEntity', 1);
            entity.addComponent(new PerfTestComponent1());

            const iterations = 100000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                entity.getComponent(PerfTestComponent1);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`单组件${iterations}次高频访问耗时: ${duration.toFixed(2)}ms`);
            
            // 单组件访问应该非常快
            expect(duration).toBeLessThan(80); // 应该在80ms内完成
        });

        test('多组件实体性能测试', () => {
            const entity = new Entity('MultiComponentEntity', 1);
            
            // 添加8个组件（比典型情况多）
            entity.addComponent(new PerfTestComponent1());
            entity.addComponent(new PerfTestComponent2());
            entity.addComponent(new PerfTestComponent3());
            entity.addComponent(new PerfTestComponent4());
            entity.addComponent(new PerfTestComponent5());
            entity.addComponent(new PerfTestComponent6());
            entity.addComponent(new PerfTestComponent7());
            entity.addComponent(new PerfTestComponent8());

            const iterations = 5000;
            const startTime = performance.now();

            // 随机访问不同组件
            for (let i = 0; i < iterations; i++) {
                entity.getComponent(PerfTestComponent1);
                entity.getComponent(PerfTestComponent4);
                entity.getComponent(PerfTestComponent7);
                entity.getComponent(PerfTestComponent2);
                entity.getComponent(PerfTestComponent8);
                entity.getComponent(PerfTestComponent3);
                entity.getComponent(PerfTestComponent6);
                entity.getComponent(PerfTestComponent5);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`多组件实体(8组件) ${iterations * 8}次随机访问耗时: ${duration.toFixed(2)}ms`);
            
            // 即使是多组件，优化后的性能也应该良好
            expect(duration).toBeLessThan(100); // 应该在100ms内完成
        });

        test('hasComponent性能测试', () => {
            const entity = new Entity('HasComponentTestEntity', 1);
            
            entity.addComponent(new PerfTestComponent1());
            entity.addComponent(new PerfTestComponent3());
            entity.addComponent(new PerfTestComponent5());

            const iterations = 50000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                entity.hasComponent(PerfTestComponent1); // 存在
                entity.hasComponent(PerfTestComponent2); // 不存在
                entity.hasComponent(PerfTestComponent3); // 存在
                entity.hasComponent(PerfTestComponent4); // 不存在
                entity.hasComponent(PerfTestComponent5); // 存在
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`${iterations * 5}次hasComponent检查耗时: ${duration.toFixed(2)}ms`);
            
            // hasComponent应该通过位掩码快速完成
            expect(duration).toBeLessThan(150); // 应该在150ms内完成
        });
    });

    describe('内存效率测试', () => {
        test('大量实体内存使用测试', () => {
            const entities: Entity[] = [];
            const entityCount = 5000;

            const startTime = performance.now();

            // 创建大量实体，模拟真实游戏场景
            for (let i = 0; i < entityCount; i++) {
                const entity = new Entity(`Entity_${i}`, i);
                
                // 每个实体随机添加2-6个组件
                const componentCount = 2 + (i % 5);
                if (componentCount >= 1) entity.addComponent(new PerfTestComponent1());
                if (componentCount >= 2) entity.addComponent(new PerfTestComponent2());
                if (componentCount >= 3) entity.addComponent(new PerfTestComponent3());
                if (componentCount >= 4) entity.addComponent(new PerfTestComponent4());
                if (componentCount >= 5) entity.addComponent(new PerfTestComponent5());
                if (componentCount >= 6) entity.addComponent(new PerfTestComponent6());
                
                entities.push(entity);
            }

            const creationTime = performance.now() - startTime;

            // 测试访问性能
            const accessStartTime = performance.now();
            
            for (const entity of entities) {
                entity.getComponent(PerfTestComponent1);
                if (entity.hasComponent(PerfTestComponent3)) {
                    entity.getComponent(PerfTestComponent3);
                }
                if (entity.hasComponent(PerfTestComponent5)) {
                    entity.getComponent(PerfTestComponent5);
                }
            }

            const accessTime = performance.now() - accessStartTime;

            console.log(`创建${entityCount}个实体耗时: ${creationTime.toFixed(2)}ms`);
            console.log(`访问${entityCount}个实体的组件耗时: ${accessTime.toFixed(2)}ms`);

            // 优化后应该有良好的批量处理性能
            expect(creationTime).toBeLessThan(500); // 创建应该在500ms内完成
            expect(accessTime).toBeLessThan(100);   // 访问应该在100ms内完成
        });
    });
});
