import { Scene } from '../../../src/ECS/Scene';
import { SceneWorldAdapter } from '../../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';

class TestComponent extends Component {
    public value: number = 0;
    public text: string = '';
    public active: boolean = true;
    public items: number[] = [];
}

class AnotherComponent extends Component {
    public score: number = 100;
    public name: string = 'test';
}

describe('SceneWorldAdapter - 确定性测试', () => {
    let scene1: Scene;
    let scene2: Scene;
    let adapter1: SceneWorldAdapter;
    let adapter2: SceneWorldAdapter;

    beforeEach(() => {
        scene1 = new Scene();
        scene2 = new Scene();
        adapter1 = new SceneWorldAdapter(scene1);
        adapter2 = new SceneWorldAdapter(scene2);
        
        // 注册测试组件
        ComponentRegistry.register(TestComponent);
        ComponentRegistry.register(AnotherComponent);
    });

    afterEach(() => {
        scene1.unload();
        scene2.unload();
    });

    describe('编码顺序确定性', () => {
        test('相同状态在不同插入顺序下应产生相同的编码结果', () => {
            // Scene1: 先创建实体1，再创建实体2
            const entity1_s1 = new Entity('Entity1', 1);
            entity1_s1.addComponent(new TestComponent());
            entity1_s1.getComponent(TestComponent)!.value = 42;
            entity1_s1.getComponent(TestComponent)!.text = 'hello';
            
            const entity2_s1 = new Entity('Entity2', 2);
            entity2_s1.addComponent(new AnotherComponent());
            entity2_s1.getComponent(AnotherComponent)!.score = 200;
            
            scene1.addEntity(entity1_s1);
            scene1.addEntity(entity2_s1);

            // Scene2: 先创建实体2，再创建实体1（相反顺序）
            const entity2_s2 = new Entity('Entity2', 2);
            entity2_s2.addComponent(new AnotherComponent());
            entity2_s2.getComponent(AnotherComponent)!.score = 200;
            
            const entity1_s2 = new Entity('Entity1', 1);
            entity1_s2.addComponent(new TestComponent());
            entity1_s2.getComponent(TestComponent)!.value = 42;
            entity1_s2.getComponent(TestComponent)!.text = 'hello';
            
            scene2.addEntity(entity2_s2);
            scene2.addEntity(entity1_s2);

            // 确定性编码应该产生相同结果
            const encoded1 = adapter1.encode({ deterministic: true });
            const encoded2 = adapter2.encode({ deterministic: true });

            // 转为字符串比较
            const str1 = new TextDecoder().decode(encoded1);
            const str2 = new TextDecoder().decode(encoded2);
            
            expect(str1).toBe(str2);
        });

        test('相同状态应产生相同签名', () => {
            // 创建相同的世界状态
            const setupScene = (scene: Scene) => {
                const entity = new Entity('TestEntity', 1);
                const comp = new TestComponent();
                comp.value = 123;
                comp.text = 'test';
                comp.active = false;
                comp.items = [1, 2, 3];
                entity.addComponent(comp);
                scene.addEntity(entity);
            };

            setupScene(scene1);
            setupScene(scene2);

            const sig1 = adapter1.signature();
            const sig2 = adapter2.signature();

            expect(sig1).toBe(sig2);
        });

        test('组件数据值变化应影响签名', () => {
            const entity1 = new Entity('Entity', 1);
            const comp1 = new TestComponent();
            comp1.value = 100;
            entity1.addComponent(comp1);
            scene1.addEntity(entity1);

            const entity2 = new Entity('Entity', 1);
            const comp2 = new TestComponent();
            comp2.value = 200; // 不同的值
            entity2.addComponent(comp2);
            scene2.addEntity(entity2);

            const sig1 = adapter1.signature();
            const sig2 = adapter2.signature();

            expect(sig1).not.toBe(sig2);
        });
    });

    describe('确定性编码选项', () => {
        test('确定性模式下时间戳应为0', () => {
            const entity = new Entity('TestEntity', 1);
            scene1.addEntity(entity);

            const encoded = adapter1.encode({ deterministic: true });
            const jsonStr = new TextDecoder().decode(encoded);
            const data = JSON.parse(jsonStr);

            expect(data.timestamp).toBe(0);
        });

        test('非确定性模式下应包含真实时间戳', () => {
            const entity = new Entity('TestEntity', 1);
            scene1.addEntity(entity);

            const before = Date.now();
            const encoded = adapter1.encode({ deterministic: false });
            const after = Date.now();

            const jsonStr = new TextDecoder().decode(encoded);
            const data = JSON.parse(jsonStr);

            expect(data.timestamp).toBeGreaterThanOrEqual(before);
            expect(data.timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('版本兼容性', () => {
        test('应拒绝不兼容版本的快照', () => {
            const badData = JSON.stringify({
                version: '2.0.0',
                entities: [],
                identifierPool: {},
                componentStorage: []
            });
            const buffer = new TextEncoder().encode(badData).buffer;

            expect(() => {
                adapter1.decode(buffer);
            }).toThrow('快照版本不兼容');
        });

        test('应接受兼容版本的快照', () => {
            const goodData = JSON.stringify({
                version: '1.0.0',
                entities: [],
                identifierPool: {
                    nextAvailableIndex: 0,
                    freeIndices: [],
                    generations: [],
                    pendingRecycle: [],
                    stats: { totalAllocated: 0, totalRecycled: 0, currentActive: 0, memoryExpansions: 0 }
                },
                componentStorage: []
            });
            const buffer = new TextEncoder().encode(goodData).buffer;

            expect(() => {
                adapter1.decode(buffer);
            }).not.toThrow();
        });
    });

    describe('往返一致性', () => {
        test('编码解码后应保持数据完整性', () => {
            // 创建复杂状态
            const entity1 = new Entity('Entity1', 1);
            const comp1 = new TestComponent();
            comp1.value = 42;
            comp1.text = 'hello';
            comp1.active = true;
            comp1.items = [1, 2, 3];
            entity1.addComponent(comp1);

            const another1 = new AnotherComponent();
            another1.score = 999;
            another1.name = 'test';
            entity1.addComponent(another1);

            scene1.addEntity(entity1);

            const originalSig = adapter1.signature();
            const encoded = adapter1.encode({ deterministic: true });

            // 解码到新场景
            adapter2.decode(encoded);
            const decodedSig = adapter2.signature();

            expect(decodedSig).toBe(originalSig);

            // 验证具体数据
            const entities = scene2.entities.buffer;
            expect(entities).toHaveLength(1);
            
            const decodedEntity = entities[0];
            expect(decodedEntity.name).toBe('Entity1');
            expect(decodedEntity.id).toBe(1);

            const decodedTestComp = decodedEntity.getComponent(TestComponent);
            expect(decodedTestComp).toBeDefined();
            expect(decodedTestComp!.value).toBe(42);
            expect(decodedTestComp!.text).toBe('hello');
            expect(decodedTestComp!.active).toBe(true);
            expect(decodedTestComp!.items).toEqual([1, 2, 3]);

            const decodedAnotherComp = decodedEntity.getComponent(AnotherComponent);
            expect(decodedAnotherComp).toBeDefined();
            expect(decodedAnotherComp!.score).toBe(999);
            expect(decodedAnotherComp!.name).toBe('test');
        });
    });

    describe('JSON对象属性顺序稳定性', () => {
        test('多次编码相同状态应产生字节完全相同的结果', () => {
            const entity = new Entity('Entity', 1);
            const comp = new TestComponent();
            comp.value = 123;
            comp.text = 'abc';
            entity.addComponent(comp);
            scene1.addEntity(entity);

            const encoded1 = adapter1.encode({ deterministic: true });
            const encoded2 = adapter1.encode({ deterministic: true });

            // 字节级别完全相同
            expect(new Uint8Array(encoded1)).toEqual(new Uint8Array(encoded2));
        });
    });
});