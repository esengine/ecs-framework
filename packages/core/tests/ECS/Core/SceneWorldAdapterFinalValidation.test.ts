import { Scene } from '../../../src/ECS/Scene';
import { SceneWorldAdapter } from '../../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';
import { Serializable, SerializableField } from '../../../src/ECS/Decorators/SerializationDecorators';
import { SchemaRegistry } from '../../../src/ECS/Core/Serialization/SchemaRegistry';

@Serializable()
class EdgeCaseComponent extends Component {
    @SerializableField({ dataType: 'float32' })
    public normalValue: number = 42;
    @SerializableField({ dataType: 'float32' })
    public nanValue: number = NaN;
    @SerializableField({ dataType: 'float32' })
    public infinityValue: number = Infinity;
    @SerializableField({ dataType: 'float32' })
    public negativeInfinity: number = -Infinity;
    @SerializableField({ dataType: 'float32' })
    public negativeZero: number = -0;
    @SerializableField({ dataType: 'float32' })
    public positivZero: number = 0;
    @SerializableField({ dataType: 'number[]' })
    public numberArray: number[] = [1, NaN, Infinity, -Infinity, -0, 0];
    @SerializableField({ dataType: 'string[]' })
    public stringArray: string[] = ['a', 'b', 'c'];
    @SerializableField({ dataType: 'boolean[]' })
    public booleanArray: boolean[] = [true, false, true];
    @SerializableField({ dataType: 'float32[]' })
    public typedArray: number[] = [1.1, 2.2, 3.3];
}

@Serializable()
class SimpleComponent extends Component {
    @SerializableField({ dataType: 'float32' })
    public value: number = 100;
    @SerializableField({ dataType: 'string' })
    public text: string = 'test';
}

describe('SceneWorldAdapter - 最终验证（修复确认）', () => {
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
        ComponentRegistry.register(EdgeCaseComponent);
        ComponentRegistry.register(SimpleComponent);
        
        // 注册Schema
        SchemaRegistry.registerComponent('EdgeCaseComponent', {
            normalValue: { dataType: 'float32' },
            nanValue: { dataType: 'float32' },
            infinityValue: { dataType: 'float32' },
            negativeInfinity: { dataType: 'float32' },
            negativeZero: { dataType: 'float32' },
            positivZero: { dataType: 'float32' },
            numberArray: { dataType: 'number[]' },
            stringArray: { dataType: 'string[]' },
            booleanArray: { dataType: 'boolean[]' },
            typedArray: { dataType: 'float32[]' }
        });
        
        SchemaRegistry.registerComponent('SimpleComponent', {
            value: { dataType: 'float32' },
            text: { dataType: 'string' }
        });
    });

    afterEach(() => {
        scene1.unload();
        scene2.unload();
    });

    describe('边界数值处理', () => {
        test('-0应被归一为0，与签名和序列化保持一致', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new EdgeCaseComponent();
            entity.addComponent(comp);
            scene1.addEntity(entity);

            // 编码解码
            const encoded = adapter1.encode({ deterministic: true });
            adapter2.decode(encoded);

            // 验证-0被归一为0
            const decodedEntity = scene2.entities.buffer[0];
            const decodedComp = decodedEntity.getComponent(EdgeCaseComponent)!;
            
            expect(Object.is(decodedComp.negativeZero, 0)).toBe(true);
            expect(Object.is(decodedComp.negativeZero, -0)).toBe(false);
            expect(Object.is(decodedComp.positivZero, 0)).toBe(true);
            
            // 验证数组中的-0也被处理
            expect(decodedComp.numberArray[4]).toBe(0); // 原来的-0
            expect(decodedComp.numberArray[5]).toBe(0); // 原来的0
            expect(Object.is(decodedComp.numberArray[4], 0)).toBe(true);
        });

        test('所有NaN/Infinity应被规范化为0', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new EdgeCaseComponent();
            entity.addComponent(comp);
            scene1.addEntity(entity);

            const encoded = adapter1.encode({ deterministic: true });
            adapter2.decode(encoded);

            const decodedComp = scene2.entities.buffer[0].getComponent(EdgeCaseComponent)!;
            
            expect(decodedComp.nanValue).toBe(0);
            expect(decodedComp.infinityValue).toBe(0);
            expect(decodedComp.negativeInfinity).toBe(0);
            
            // 数组中的特殊值也应被规范化
            expect(decodedComp.numberArray).toEqual([1, 0, 0, 0, 0, 0]);
        });
    });

    describe('TypedArray byteOffset/byteLength 处理', () => {
        test('不同byteOffset的相同数据应产生相同签名', () => {
            // 创建一个大buffer，然后创建不同偏移的视图
            const bigBuffer = new ArrayBuffer(32);
            const fullView = new Float32Array(bigBuffer, 0, 3);
            const offsetView = new Float32Array(bigBuffer, 16, 3);
            
            // 填入相同数据
            fullView.set([1.1, 2.2, 3.3]);
            offsetView.set([1.1, 2.2, 3.3]);
            
            // 创建两个场景，使用不同偏移的TypedArray
            const entity1 = new Entity('TestEntity', 1);
            const comp1 = new EdgeCaseComponent();
            comp1.typedArray = Array.from(fullView);
            entity1.addComponent(comp1);
            scene1.addEntity(entity1);
            
            const entity2 = new Entity('TestEntity', 1);
            const comp2 = new EdgeCaseComponent();
            comp2.typedArray = Array.from(offsetView);
            entity2.addComponent(comp2);
            scene2.addEntity(entity2);
            
            // 签名应该相同（因为实际数据相同）
            const sig1 = adapter1.signature();
            const sig2 = adapter2.signature();
            
            expect(sig1).toBe(sig2);
        });
    });

    describe('Frame和Seed支持', () => {
        test('应支持frame和seed字段', () => {
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new SimpleComponent());
            scene1.addEntity(entity);

            const encoded = adapter1.encode({ 
                deterministic: true, 
                frame: 300, 
                seed: 12345 
            });
            
            const jsonStr = new TextDecoder().decode(encoded);
            const data = JSON.parse(jsonStr);
            
            expect(data.frame).toBe(300);
            expect(data.seed).toBe(12345);
        });
    });

    describe('极限一致性验证', () => {
        test('复杂场景的往返一致性（包含各种边界情况）', () => {
            // 创建复杂场景
            for (let i = 0; i < 3; i++) {
                const entity = new Entity(`Entity${i}`, i + 1);
                
                if (i === 0) {
                    // 边界数值组件
                    const edgeComp = new EdgeCaseComponent();
                    edgeComp.normalValue = 0.1 + 0.2; // 浮点精度敏感
                    edgeComp.numberArray = [1, NaN, Infinity, -0, 0.3333333];
                    entity.addComponent(edgeComp);
                }
                
                // 普通组件
                const simpleComp = new SimpleComponent();
                simpleComp.value = i * 100;
                simpleComp.text = `test${i}`;
                entity.addComponent(simpleComp);
                
                scene1.addEntity(entity);
            }
            
            // 多次往返测试
            for (let round = 0; round < 3; round++) {
                const originalSig = adapter1.signature();
                
                const encoded = adapter1.encode({ 
                    deterministic: true,
                    frame: round * 100,
                    seed: 42 
                });
                
                // 解码到新场景
                const tempScene = new Scene();
                const tempAdapter = new SceneWorldAdapter(tempScene);
                tempAdapter.decode(encoded);
                
                const decodedSig = tempAdapter.signature();
                tempScene.unload();
                
                expect(decodedSig).toBe(originalSig);
            }
        });

        test('相同状态多次编码应产生完全相同字节序列', () => {
            const entity = new Entity('TestEntity', 1);
            const comp = new EdgeCaseComponent();
            comp.numberArray = [3.14159, -0, NaN, Infinity];
            comp.stringArray = ['c', 'a', 'b']; // 会按组件内字段排序
            entity.addComponent(comp);
            scene1.addEntity(entity);

            // 连续编码5次
            const encodings: Uint8Array[] = [];
            for (let i = 0; i < 5; i++) {
                const encoded = adapter1.encode({ 
                    deterministic: true,
                    frame: 100,
                    seed: 999
                });
                encodings.push(new Uint8Array(encoded));
            }

            // 所有编码应完全相同
            for (let i = 1; i < encodings.length; i++) {
                expect(encodings[i]).toEqual(encodings[0]);
            }
        });

        test('suspendEffects机制应正确抑制副作用', () => {
            let effectTriggered = false;
            
            // 模拟事件监听（在实际实现中，这些应该检查suspendEffects）
            const originalSuspendEffects = scene2.suspendEffects;
            
            const entity = new Entity('TestEntity', 1);
            entity.addComponent(new SimpleComponent());
            scene1.addEntity(entity);
            
            const encoded = adapter1.encode({ deterministic: true });
            
            // decode期间suspendEffects应为true
            let suspendEffectsDuringDecode: boolean | null = null;
            const originalDecode = (adapter2 as any)._decodeEntities;
            (adapter2 as any)._decodeEntities = function(entitiesData: any) {
                suspendEffectsDuringDecode = this._scene.suspendEffects;
                return originalDecode.call(this, entitiesData);
            };
            
            adapter2.decode(encoded);
            
            expect(suspendEffectsDuringDecode).toBe(true);
            expect(scene2.suspendEffects).toBe(originalSuspendEffects); // 应该恢复
        });
    });

    describe('CommandBuffer空检查', () => {
        test('开发模式下应检查CommandBuffer状态', () => {
            // 模拟非空CommandBuffer
            (scene1 as any).commandBuffer = {
                get isEmpty() { return false; }
            };
            
            const entity = new Entity('TestEntity', 1);
            scene1.addEntity(entity);
            
            // 确定性模式下应该抛出错误
            expect(() => {
                adapter1.encode({ deterministic: true });
            }).toThrow('Snapshot taken before CommandBuffer.apply(): inconsistent state.');
        });
    });
});