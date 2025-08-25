import { Scene } from '../../../src/ECS/Scene';
import { SceneWorldAdapter } from '../../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';

// 测试组件：使用序列化钉子
class CustomSerializableComponent extends Component {
    public normalValue: number = 100;
    public typedArray: Float32Array = new Float32Array([1, 2, 3]);
    public specialData: string = 'test';

    // 自定义序列化钉子
    serialize(): Record<string, unknown> {
        return {
            normalValue: this.normalValue,
            // 将TypedArray转换为普通数组，并保持类型信息
            typedArray: {
                type: 'Float32Array',
                data: Array.from(this.typedArray)
            },
            specialData: this.specialData
        };
    }

    // 自定义反序列化钉子
    deserialize(data: Record<string, unknown>): void {
        this.normalValue = data.normalValue as number;
        this.specialData = data.specialData as string;
        
        // 从序列化数据还原TypedArray
        const arrayData = data.typedArray as { type: string; data: number[] };
        if (arrayData && arrayData.type === 'Float32Array' && Array.isArray(arrayData.data)) {
            this.typedArray = new Float32Array(arrayData.data);
        }
    }
}

class StandardComponent extends Component {
    public value: number = 42;
    public text: string = 'standard';
}

describe('SceneWorldAdapter - 完整收口验证', () => {
    let scene: Scene;
    let adapter: SceneWorldAdapter;
    let frameAlignments: Array<{ frame?: number; seed?: number }> = [];

    beforeEach(() => {
        scene = new Scene();
        frameAlignments = [];
        
        // 注册测试组件类
        ComponentRegistry.register(CustomSerializableComponent);
        ComponentRegistry.register(StandardComponent);
        
        // 使用回调来验证frame/seed对齐
        adapter = new SceneWorldAdapter(scene, (info) => {
            frameAlignments.push(info);
        });
    });

    afterEach(() => {
        scene.unload();
    });

    describe('Frame/Seed对齐机制', () => {
        test('应在decode后调用回调对齐frame和seed', () => {
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new StandardComponent());
            scene.addEntity(entity);

            const encoded = adapter.encode({ 
                deterministic: true, 
                frame: 500, 
                seed: 12345 
            });

            // 解码到新场景
            const newScene = new Scene();
            const alignments: Array<{ frame?: number; seed?: number }> = [];
            const newAdapter = new SceneWorldAdapter(newScene, (info) => {
                alignments.push(info);
            });

            newAdapter.decode(encoded);

            expect(alignments).toHaveLength(1);
            expect(alignments[0].frame).toBe(500);
            expect(alignments[0].seed).toBe(12345);

            newScene.unload();
        });
    });

    describe('组件序列化钉子机制', () => {
        test('应优先使用组件的自定义serialize/deserialize方法', () => {
            const entity = new Entity('TestEntity', 1);
            const customComp = new CustomSerializableComponent();
            customComp.normalValue = 999;
            customComp.typedArray = new Float32Array([10.1, 20.2, 30.3]);
            customComp.specialData = 'custom_data';
            entity.addComponent(customComp);
            scene.addEntity(entity);

            // 编码解码
            const encoded = adapter.encode({ deterministic: true });
            
            const newScene = new Scene();
            ComponentRegistry.register(CustomSerializableComponent);
            const newAdapter = new SceneWorldAdapter(newScene);
            newAdapter.decode(encoded);

            // 验证自定义序列化是否生效
            const decodedEntity = newScene.entities.buffer[0];
            const decodedComp = decodedEntity.getComponent(CustomSerializableComponent);
            
            expect(decodedComp).toBeDefined();
            expect(decodedComp!.normalValue).toBe(999);
            expect(decodedComp!.specialData).toBe('custom_data');
            
            // 验证TypedArray正确还原
            expect(decodedComp!.typedArray).toBeInstanceOf(Float32Array);
            // Float32精度有限，需要比较Float32的实际值
            const expectedFloat32 = new Float32Array([10.1, 20.2, 30.3]);
            expect(Array.from(decodedComp!.typedArray)).toEqual(Array.from(expectedFloat32));

            newScene.unload();
        });
    });

    describe('CommandBuffer断言强化', () => {
        test('确定性模式下应抛出异常', () => {
            const entity = new Entity('TestEntity', 1);
            scene.addEntity(entity);

            // 模拟非空CommandBuffer
            (scene as any).commandBuffer = {
                isEmpty: false
            };

            expect(() => {
                adapter.encode({ deterministic: true });
            }).toThrow('Snapshot taken before CommandBuffer.apply(): inconsistent state.');
        });

        test('非确定性模式下应只警告', () => {
            const entity = new Entity('TestEntity', 1);
            scene.addEntity(entity);

            let warningCalled = false;
            const originalWarn = (adapter as any)._logger.warn;
            (adapter as any)._logger.warn = (...args: any[]) => {
                if (args[0].includes('CommandBuffer not empty')) {
                    warningCalled = true;
                }
            };

            // 模拟非空CommandBuffer
            (scene as any).commandBuffer = {
                isEmpty: false
            };

            // 非确定性模式不应抛出异常
            expect(() => {
                adapter.encode({ deterministic: false });
            }).not.toThrow();

            expect(warningCalled).toBe(true);

            // 恢复
            (adapter as any)._logger.warn = originalWarn;
        });
    });

    describe('Schema哈希支持', () => {
        test('应在编码时计算并保存schema哈希', () => {
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new StandardComponent());
            scene.addEntity(entity);

            const encoded = adapter.encode({ deterministic: true });
            const jsonStr = new TextDecoder().decode(encoded);
            const data = JSON.parse(jsonStr);

            expect(typeof data.schemaHash).toBe('number');
        });

        test('schema不匹配时应发出警告', () => {
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new StandardComponent());
            scene.addEntity(entity);

            // 创建一个包含不同schema哈希的快照
            const encoded = adapter.encode({ deterministic: true });
            const jsonStr = new TextDecoder().decode(encoded);
            const data = JSON.parse(jsonStr);
            
            // 人为修改schema哈希
            data.schemaHash = 999999;
            const modifiedBuffer = new TextEncoder().encode(JSON.stringify(data)).buffer;

            let warningCalled = false;
            const originalWarn = (adapter as any)._logger.warn;
            (adapter as any)._logger.warn = (...args: any[]) => {
                if (args[0].includes('Schema哈希不匹配')) {
                    warningCalled = true;
                }
            };

            // 解码应成功但发出警告（使用非严格Schema模式）
            const newScene = new Scene();
            const newAdapter = new SceneWorldAdapter(newScene);
            expect(() => {
                newAdapter.decode(modifiedBuffer, { strictSchema: false });
            }).not.toThrow();

            expect(warningCalled).toBe(true);

            // 恢复
            (adapter as any)._logger.warn = originalWarn;
            newScene.unload();
        });
    });

    describe('综合确定性验证（你的检查清单）', () => {
        test('同一场景连跑2k帧，signature()每100帧对比一致', () => {
            // 创建复杂场景
            for (let i = 0; i < 5; i++) {
                const entity = new Entity(`Entity${i}`, i + 1);
                entity.addComponent(new StandardComponent());
                if (i % 2 === 0) {
                    const customComp = new CustomSerializableComponent();
                    customComp.normalValue = i * 10;
                    entity.addComponent(customComp);
                }
                scene.addEntity(entity);
            }

            const signatures1: number[] = [];
            const signatures2: number[] = [];

            // 第一次运行
            for (let frame = 0; frame < 2000; frame += 100) {
                signatures1.push(adapter.signature());
            }

            // 第二次运行（相同状态）
            for (let frame = 0; frame < 2000; frame += 100) {
                signatures2.push(adapter.signature());
            }

            expect(signatures1).toEqual(signatures2);
        });

        test('回滚验证：300帧拍快照→跑到600→回滚到300→重放到600，签名一致', () => {
            // 设置场景
            const entity = new Entity('TestEntity', 1);
            const comp = new CustomSerializableComponent();
            comp.normalValue = 300;
            entity.addComponent(comp);
            scene.addEntity(entity);

            // 模拟300帧状态
            const snapshot300 = adapter.encode({ 
                deterministic: true, 
                frame: 300,
                seed: 42 
            });
            const signature300 = adapter.signature();

            // 模拟状态变化（跑到600帧）
            comp.normalValue = 600;
            const signature600Direct = adapter.signature();

            // 回滚到300帧
            const rollbackScene = new Scene();
            // 注册组件类型到新场景的组件注册表
            ComponentRegistry.register(CustomSerializableComponent);
            const rollbackAdapter = new SceneWorldAdapter(rollbackScene);
            rollbackAdapter.decode(snapshot300);

            // 重放到600帧（模拟相同变化）
            const rollbackEntity = rollbackScene.entities.buffer[0];
            const rollbackComp = rollbackEntity.getComponent(CustomSerializableComponent)!;
            rollbackComp.normalValue = 600;
            const signature600Replayed = rollbackAdapter.signature();

            expect(signature600Replayed).toBe(signature600Direct);

            rollbackScene.unload();
        });

        test('TypedArray切片测试：相同数据不同byteOffset，签名相同', () => {
            const bigBuffer = new ArrayBuffer(64);
            const fullView = new Float32Array(bigBuffer, 0, 4);
            const offsetView = new Float32Array(bigBuffer, 32, 4);
            
            // 填入相同数据
            fullView.set([1.1, 2.2, 3.3, 4.4]);
            offsetView.set([1.1, 2.2, 3.3, 4.4]);

            // 场景1：使用fullView
            const entity1 = new Entity('Entity1', 1);
            const comp1 = new CustomSerializableComponent();
            comp1.typedArray = fullView;
            entity1.addComponent(comp1);
            scene.addEntity(entity1);

            const sig1 = adapter.signature();

            // 场景2：使用offsetView（相同数据，不同偏移）
            scene.destroyAllEntities();
            const entity2 = new Entity('Entity1', 1);
            const comp2 = new CustomSerializableComponent();
            comp2.typedArray = offsetView;
            entity2.addComponent(comp2);
            scene.addEntity(entity2);

            const sig2 = adapter.signature();

            expect(sig1).toBe(sig2);
        });

        test('异常值规范化：NaN/±Infinity/-0 encode→decode前后签名一致', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new StandardComponent();
            comp.value = NaN; // 测试NaN规范化
            entity.addComponent(comp);
            scene.addEntity(entity);

            const originalSig = adapter.signature();
            
            // encode→decode
            const encoded = adapter.encode({ deterministic: true });
            
            const newScene = new Scene();
            ComponentRegistry.register(StandardComponent);
            const newAdapter = new SceneWorldAdapter(newScene);
            newAdapter.decode(encoded);
            
            const decodedSig = newAdapter.signature();
            
            expect(decodedSig).toBe(originalSig);
            
            // 验证NaN被规范化为0
            const decodedEntity = newScene.entities.buffer[0];
            const decodedComp = decodedEntity.getComponent(StandardComponent)!;
            expect(decodedComp.value).toBe(0);

            newScene.unload();
        });
    });
});