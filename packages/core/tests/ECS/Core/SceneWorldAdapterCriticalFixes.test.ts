import { Scene } from '../../../src/ECS/Scene';
import { SceneWorldAdapter } from '../../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';

class NumberComponent extends Component {
    public value: number = 0;
    public infinity: number = Infinity;
    public nan: number = NaN;
    public negative: number = -Infinity;
}

class ArrayComponent extends Component {
    public numbers: number[] = [];
    public strings: string[] = [];
    public booleans: boolean[] = [];
    public mixed: any[] = [];
}

describe('SceneWorldAdapter - 关键修复验证', () => {
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
        ComponentRegistry.register(NumberComponent);
        ComponentRegistry.register(ArrayComponent);
    });

    afterEach(() => {
        scene1.unload();
        scene2.unload();
    });

    describe('NaN/Infinity 规范化', () => {
        test('NaN和Infinity应被规范化为0', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new NumberComponent();
            comp.value = 42;
            comp.infinity = Infinity;
            comp.nan = NaN;
            comp.negative = -Infinity;
            entity.addComponent(comp);
            scene1.addEntity(entity);

            // 编码并解码
            const encoded = adapter1.encode({ deterministic: true });
            adapter2.decode(encoded);

            // 验证解码后的值
            const decodedEntity = scene2.entities.buffer[0];
            const decodedComp = decodedEntity.getComponent(NumberComponent)!;
            
            expect(decodedComp.value).toBe(42);
            expect(decodedComp.infinity).toBe(0); // Infinity → 0
            expect(decodedComp.nan).toBe(0);      // NaN → 0
            expect(decodedComp.negative).toBe(0); // -Infinity → 0
        });

        test('数组中的NaN/Infinity也应被规范化', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new ArrayComponent();
            comp.numbers = [1, NaN, Infinity, -Infinity, 5];
            entity.addComponent(comp);
            scene1.addEntity(entity);

            // 编码并解码
            const encoded = adapter1.encode({ deterministic: true });
            adapter2.decode(encoded);

            // 验证解码后的值
            const decodedEntity = scene2.entities.buffer[0];
            const decodedComp = decodedEntity.getComponent(ArrayComponent)!;
            
            expect(decodedComp.numbers).toEqual([1, 0, 0, 0, 5]);
        });
    });

    describe('数组类型签名差异化', () => {
        test('不同类型的数组应产生不同签名', () => {
            // Scene1: 数字数组
            const entity1 = new Entity('TestEntity', 1);
            const comp1 = new ArrayComponent();
            comp1.numbers = [1, 2, 3];
            entity1.addComponent(comp1);
            scene1.addEntity(entity1);

            // Scene2: 字符串数组
            const entity2 = new Entity('TestEntity', 1);
            const comp2 = new ArrayComponent();
            comp2.strings = ['1', '2', '3']; // 字符串而不是数字
            entity2.addComponent(comp2);
            scene2.addEntity(entity2);

            const sig1 = adapter1.signature();
            const sig2 = adapter2.signature();

            expect(sig1).not.toBe(sig2);
        });

        test('布尔数组与数字数组应产生不同签名', () => {
            // Scene1: 布尔数组
            const entity1 = new Entity('TestEntity', 1);
            const comp1 = new ArrayComponent();
            comp1.booleans = [true, false, true];
            entity1.addComponent(comp1);
            scene1.addEntity(entity1);

            // Scene2: 数字数组
            const entity2 = new Entity('TestEntity', 1);
            const comp2 = new ArrayComponent();
            comp2.numbers = [1, 0, 1]; // 数字而不是布尔
            entity2.addComponent(comp2);
            scene2.addEntity(entity2);

            const sig1 = adapter1.signature();
            const sig2 = adapter2.signature();

            expect(sig1).not.toBe(sig2);
        });

        test('相同内容但不同顺序的数组应产生相同签名', () => {
            // 由于我们按组件类型字母顺序处理，相同组件的相同字段应该产生相同签名
            const createScene = (scene: Scene, arr: number[]) => {
                const entity = new Entity('TestEntity', 1);
                const comp = new ArrayComponent();
                comp.numbers = arr;
                entity.addComponent(comp);
                scene.addEntity(entity);
            };

            createScene(scene1, [1, 2, 3]);
            createScene(scene2, [1, 2, 3]);

            const sig1 = adapter1.signature();
            const sig2 = adapter2.signature();

            expect(sig1).toBe(sig2);
        });
    });

    describe('Float32 精度统一性', () => {
        test('相同的Float32值应产生相同签名', () => {
            const setupScene = (scene: Scene) => {
                const entity = new Entity('TestEntity', 1);
                const comp = new NumberComponent();
                // 使用一个在Float32和Float64间有微小差异的数
                comp.value = 0.1 + 0.2; // 这个值在浮点运算中会有精度问题
                entity.addComponent(comp);
                scene.addEntity(entity);
            };

            setupScene(scene1);
            setupScene(scene2);

            const sig1 = adapter1.signature();
            const sig2 = adapter2.signature();

            expect(sig1).toBe(sig2);
        });

        test('编码解码后数字精度应保持一致', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new NumberComponent();
            comp.value = 0.1 + 0.2; // 精度敏感的值
            entity.addComponent(comp);
            scene1.addEntity(entity);

            const originalSig = adapter1.signature();
            
            // 编码解码
            const encoded = adapter1.encode({ deterministic: true });
            adapter2.decode(encoded);
            
            const decodedSig = adapter2.signature();
            
            expect(decodedSig).toBe(originalSig);
        });
    });

    describe('ID池确定性恢复', () => {
        test('解码时应清除非确定性ID池字段', () => {
            // 创建一些实体来填充ID池
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            scene1.addEntity(entity1);
            scene1.addEntity(entity2);

            // 模拟一些ID回收（通过销毁实体）
            entity2.destroy();

            const encoded = adapter1.encode({ deterministic: true });
            
            // 检查编码的数据结构
            const jsonStr = new TextDecoder().decode(encoded);
            const data = JSON.parse(jsonStr);
            
            // 确定性模式下，pendingRecycle应为空
            expect(data.identifierPool.pendingRecycle).toEqual([]);
            expect(data.identifierPool.stats.totalAllocated).toBe(0);
            expect(data.identifierPool.stats.totalRecycled).toBe(0);
        });
    });

    describe('版本兼容性严格校验', () => {
        test('主版本号不同应拒绝解码', () => {
            const invalidData = {
                version: '2.0.0',
                entities: [],
                identifierPool: {
                    nextAvailableIndex: 0,
                    freeIndices: [],
                    generations: [],
                    pendingRecycle: [],
                    stats: { totalAllocated: 0, totalRecycled: 0, currentActive: 0, memoryExpansions: 0 }
                },
                componentStorage: [],
                timestamp: 0
            };

            const buffer = new TextEncoder().encode(JSON.stringify(invalidData)).buffer;

            expect(() => {
                adapter1.decode(buffer);
            }).toThrow('快照版本不兼容: 2.0.0');
        });

        test('小版本号不同应能正常解码', () => {
            const compatibleData = {
                version: '1.1.0',
                entities: [],
                identifierPool: {
                    nextAvailableIndex: 0,
                    freeIndices: [],
                    generations: [],
                    pendingRecycle: [],
                    stats: { totalAllocated: 0, totalRecycled: 0, currentActive: 0, memoryExpansions: 0 }
                },
                componentStorage: [],
                timestamp: 0
            };

            const buffer = new TextEncoder().encode(JSON.stringify(compatibleData)).buffer;

            expect(() => {
                adapter1.decode(buffer);
            }).not.toThrow();
        });
    });

    describe('JSON属性顺序完全稳定性', () => {
        test('多次编码应产生完全相同的字节序列', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new ArrayComponent();
            comp.numbers = [3, 1, 2];
            comp.strings = ['c', 'a', 'b'];
            comp.booleans = [true, false];
            entity.addComponent(comp);
            scene1.addEntity(entity);

            // 多次编码
            const encoded1 = adapter1.encode({ deterministic: true });
            const encoded2 = adapter1.encode({ deterministic: true });
            const encoded3 = adapter1.encode({ deterministic: true });

            // 转换为Uint8Array进行比较
            const bytes1 = new Uint8Array(encoded1);
            const bytes2 = new Uint8Array(encoded2);
            const bytes3 = new Uint8Array(encoded3);

            // 应该完全相同
            expect(bytes1).toEqual(bytes2);
            expect(bytes2).toEqual(bytes3);

            // 字符串形式也应该相同
            const str1 = new TextDecoder().decode(encoded1);
            const str2 = new TextDecoder().decode(encoded2);
            const str3 = new TextDecoder().decode(encoded3);

            expect(str1).toBe(str2);
            expect(str2).toBe(str3);
        });
    });
});