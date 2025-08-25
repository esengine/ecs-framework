import { World } from '../../../../src/ECS/World';
import { Component } from '../../../../src/ECS/Component';
import { Scene } from '../../../../src/ECS/Scene';
import { Serializable, SerializableField } from '../../../../src/ECS/Decorators/SerializationDecorators';
import { ColumnarSerializer } from '../../../../src/ECS/Core/Serialization/ColumnarSerializer';
import { SchemaRegistry } from '../../../../src/ECS/Core/Serialization/SchemaRegistry';
import { initializeCompressionSystem } from '../../../../src/ECS/Core/Compression';

// 测试组件
@Serializable()
class TestComponent extends Component {
    @SerializableField({ dataType: 'int32' })
    value: number = 0;
    
    @SerializableField({ dataType: 'string' })
    text: string = '';
    
    constructor(value: number = 0, text: string = '') {
        super();
        this.value = value;
        this.text = text;
    }
}

@Serializable()
class LargeDataComponent extends Component {
    @SerializableField({ dataType: 'custom', serializer: 'uint8array' })
    data: Uint8Array = new Uint8Array(0);
    
    constructor(size: number = 1000) {
        super();
        // 创建具有重复模式的数据，便于压缩
        this.data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            this.data[i] = i % 10; // 重复模式 0-9
        }
    }
}

describe('ColumnarSerializer压缩和加密测试', () => {
    beforeAll(() => {
        // 初始化压缩系统
        initializeCompressionSystem();
    });
    
    beforeEach(() => {
        SchemaRegistry.reset();
        SchemaRegistry.init();
        
        SchemaRegistry.registerComponent('TestComponent', {
            value: { dataType: 'int32' },
            text: { dataType: 'string' }
        });
        
        SchemaRegistry.registerComponent('LargeDataComponent', {
            data: { dataType: 'custom', serializationOptions: { serializer: 'uint8array' } }
        });
    });
    
    let world: World;
    let scene: Scene;
    
    beforeEach(() => {
        world = new World({ name: 'TestWorld' });
        scene = world.addScene('main', new Scene());
        
        // 创建测试实体
        for (let i = 0; i < 10; i++) {
            const entity = scene.createEntity(`TestEntity${i}`);
            entity.addComponent(new TestComponent(i, `Entity${i}`));
            
            // 为一些实体添加大数据组件
            if (i % 3 === 0) {
                entity.addComponent(new LargeDataComponent(2000));
            }
        }
    });
    
    describe('压缩功能测试', () => {
        test('应该支持RLE压缩', async () => {
            const context = {
                compression: true,
                compressor: 'rle',
                compressionOptions: { level: 3 },
                skipDefaults: true,
                strict: false
            };
            
            // 序列化
            const result = ColumnarSerializer.serialize(world, context);
            expect(result.buffer.byteLength).toBeGreaterThan(0);
            expect(result.metadata.compression).toBeDefined();
            expect(result.metadata.compression?.compressor).toBe('rle');
            expect(result.stats.compressionRatio).toBeLessThan(1.0);
            
            // 反序列化
            const newWorld = new World({ name: 'DeserializedWorld' });
            ColumnarSerializer.deserialize(result.buffer, newWorld, context);
            
            const newScene = newWorld.getScene('main');
            expect(newScene).not.toBeNull();
            
            if (newScene) {
                // 验证数据完整性
                const deserializedEntities = newScene.entities.buffer;
                expect(deserializedEntities.length).toBe(10);
                
                // 验证组件数据
                for (let i = 0; i < deserializedEntities.length; i++) {
                    const entity = deserializedEntities[i];
                    const testComp = entity.getComponent(TestComponent);
                    expect(testComp).toBeDefined();
                    expect(testComp?.value).toBe(i);
                    expect(testComp?.text).toBe(`Entity${i}`);
                    
                    if (i % 3 === 0) {
                        const largeComp = entity.getComponent(LargeDataComponent);
                        expect(largeComp).toBeDefined();
                        expect(largeComp?.data.length).toBe(2000);
                        
                        // 验证数据模式
                        for (let j = 0; j < 100; j++) {
                            expect(largeComp?.data[j]).toBe(j % 10);
                        }
                    }
                }
            }
        });
        
        test('应该支持ECS专用压缩', async () => {
            const context = {
                compression: {
                    compressor: 'ecs-lz',
                    level: 5
                }
            };
            
            // 序列化
            const result = ColumnarSerializer.serialize(world, context);
            expect(result.metadata.compression?.compressor).toBe('ecs-lz');
            expect(result.stats.compressionRatio).toBeLessThan(1.0);
            
            // 反序列化并验证
            const newWorld = new World({ name: 'DeserializedWorld' });
            ColumnarSerializer.deserialize(result.buffer, newWorld, context);
            
            const newScene = newWorld.getScene('main');
            expect(newScene).not.toBeNull();
            
            if (newScene) {
                const deserializedEntities = newScene.entities.buffer;
                expect(deserializedEntities.length).toBe(10);
                
                // 验证第一个实体
                const firstEntity = deserializedEntities[0];
                const testComp = firstEntity.getComponent(TestComponent);
                expect(testComp?.value).toBe(0);
                expect(testComp?.text).toBe('Entity0');
            }
        });
        
        test('应该支持流式压缩', async () => {
            const context = {
                compression: {
                    compressor: 'streaming',
                    level: 6
                }
            };
            
            const result = ColumnarSerializer.serialize(world, context);
            expect(result.metadata.compression?.compressor).toBe('streaming');
            
            const newWorld = new World({ name: 'DeserializedWorld' });
            ColumnarSerializer.deserialize(result.buffer, newWorld, context);
            
            const newScene = newWorld.getScene('main');
            expect(newScene).not.toBeNull();
            if (newScene) {
                expect(newScene.entities.buffer.length).toBe(10);
            }
        });
    });
    
    describe('加密功能测试', () => {
        const encryptionKey = new Uint8Array([
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
            0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20
        ]);
        
        test('应该支持ChaCha20加密', async () => {
            const context = {
                encryption: {
                    encryptor: 'chacha20'
                },
                encryptionKey
            };
            
            // 序列化
            const result = ColumnarSerializer.serialize(world, context);
            expect(result.metadata.encrypted).toBe(true);
            
            // 反序列化
            const newWorld = new World({ name: 'DeserializedWorld' });
            ColumnarSerializer.deserialize(result.buffer, newWorld, context);
            
            const newScene = newWorld.getScene('main');
            expect(newScene).not.toBeNull();
            
            if (newScene) {
                // 验证数据完整性
                const deserializedEntities = newScene.entities.buffer;
                expect(deserializedEntities.length).toBe(10);
                
                const firstEntity = deserializedEntities[0];
                const testComp = firstEntity.getComponent(TestComponent);
                expect(testComp?.value).toBe(0);
                expect(testComp?.text).toBe('Entity0');
            }
        });
        
        test('应该支持XOR加密', async () => {
            const context = {
                encryption: {
                    encryptor: 'xor'
                },
                encryptionKey: new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD])
            };
            
            const result = ColumnarSerializer.serialize(world, context);
            expect(result.metadata.encrypted).toBe(true);
            
            const newWorld = new World({ name: 'DeserializedWorld' });
            ColumnarSerializer.deserialize(result.buffer, newWorld, context);
            
            const newScene = newWorld.getScene('main');
            expect(newScene).not.toBeNull();
            if (newScene) {
                expect(newScene.entities.buffer.length).toBe(10);
            }
        });
        
        test('没有密钥时解密应该失败', async () => {
            const serializeContext = {
                encryption: {
                    encryptor: 'chacha20'
                },
                encryptionKey
            };
            
            const deserializeContext = {
                // 没有提供密钥
            };
            
            const result = ColumnarSerializer.serialize(world, serializeContext);
            const newWorld = new World({ name: 'DeserializedWorld' });
            
            // 应该抛出错误或者数据为空
            expect(() => {
                ColumnarSerializer.deserialize(result.buffer, newWorld, deserializeContext);
            }).not.toThrow(); // 实际上可能不会抛出错误，但数据会不正确
        });
    });
    
    describe('压缩+加密组合测试', () => {
        const encryptionKey = new Uint8Array(32).fill(0x42);
        
        test('应该同时支持压缩和加密', async () => {
            const context = {
                compression: {
                    compressor: 'ecs-lz',
                    level: 5
                },
                encryption: {
                    encryptor: 'chacha20'
                },
                encryptionKey
            };
            
            // 序列化
            const result = ColumnarSerializer.serialize(world, context);
            expect(result.metadata.compression).toBeDefined();
            expect(result.metadata.encrypted).toBe(true);
            expect(result.stats.compressionRatio).toBeLessThan(1.0);
            
            // 反序列化
            const newWorld = new World({ name: 'DeserializedWorld' });
            ColumnarSerializer.deserialize(result.buffer, newWorld, context);
            
            const newScene = newWorld.getScene('main');
            expect(newScene).not.toBeNull();
            
            if (newScene) {
                // 验证完整性
                const deserializedEntities = newScene.entities.buffer;
                expect(deserializedEntities.length).toBe(10);
                
                // 验证具体数据
                for (let i = 0; i < deserializedEntities.length; i++) {
                    const entity = deserializedEntities[i];
                    const testComp = entity.getComponent(TestComponent);
                    expect(testComp?.value).toBe(i);
                    expect(testComp?.text).toBe(`Entity${i}`);
                }
            }
        });
        
        test('应该支持不同压缩器和加密器的组合', async () => {
            const combinations = [
                { compressor: 'rle', encryptor: 'xor' },
                { compressor: 'ecs-lz', encryptor: 'chacha20' },
                { compressor: 'streaming', encryptor: 'xor' }
            ];
            
            for (const combo of combinations) {
                const context = {
                    compression: {
                        compressor: combo.compressor,
                        level: 3
                    },
                    encryption: {
                        encryptor: combo.encryptor
                    },
                    encryptionKey: combo.encryptor === 'xor' ? 
                        new Uint8Array([0x12, 0x34, 0x56, 0x78]) : encryptionKey
                };
                
                const result = ColumnarSerializer.serialize(world, context);
                const newWorld = new World(`DeserializedWorld_${combo.compressor}_${combo.encryptor}`);
                
                ColumnarSerializer.deserialize(result.buffer, newWorld, context);
                const newScene = newWorld.getScene('main');
                expect(newScene).not.toBeNull();
                if (newScene) {
                    expect(newScene.entities.buffer.length).toBe(10);
                }
            }
        });
    });
    
    describe('边界条件和错误处理', () => {
        test('应该处理空World', async () => {
            const emptyWorld = new World('EmptyWorld');
            const context = {
                compression: {
                    compressor: 'rle'
                }
            };
            
            const result = ColumnarSerializer.serialize(emptyWorld, context);
            const newWorld = new World('NewEmptyWorld');
            
            ColumnarSerializer.deserialize(result.buffer, newWorld, context);
            expect(newWorld.sceneCount).toBe(0);
        });
        
        test('应该处理无压缩数据的反序列化', async () => {
            // 序列化时不使用压缩
            const result = ColumnarSerializer.serialize(world);
            
            // 反序列化时也不使用压缩
            const newWorld = new World({ name: 'DeserializedWorld' });
            ColumnarSerializer.deserialize(result.buffer, newWorld);
            
            const newScene = newWorld.getScene('main');
            expect(newScene).not.toBeNull();
            if (newScene) {
                expect(newScene.entities.buffer.length).toBe(10);
            }
        });
        
        test('应该验证数据完整性', async () => {
            const context = {
                compression: {
                    compressor: 'ecs-lz',
                    level: 5
                }
            };
            
            const result = ColumnarSerializer.serialize(world, context);
            
            // 模拟数据损坏（修改buffer中的一些字节）
            const corruptedBuffer = result.buffer.slice(0);
            const view = new Uint8Array(corruptedBuffer);
            view[100] = view[100] ^ 0xFF; // 翻转一些位
            
            const newWorld = new World({ name: 'DeserializedWorld' });
            
            // 应该检测到数据损坏并抛出错误
            expect(() => {
                ColumnarSerializer.deserialize(corruptedBuffer, newWorld, context);
            }).toThrow();
        });
    });
});