import { Scene } from '../../../../src/ECS/Scene';
import { Component } from '../../../../src/ECS/Component';
import { ColumnarSerializer } from '../../../../src/ECS/Core/Serialization/ColumnarSerializer';
import { CompressionRegistry, initializeCompressionSystem } from '../../../../src/ECS/Core/Compression';
import { Serializable, SerializableField } from '../../../../src/ECS/Decorators/SerializationDecorators';
import { SchemaRegistry } from '../../../../src/ECS/Core/Serialization/SchemaRegistry';
import { ComponentRegistry } from '../../../../src/ECS/Core/ComponentStorage/ComponentRegistry';
import { World } from '../../../../src/ECS/World';

// 初始化压缩系统
initializeCompressionSystem();

// 测试组件
@Serializable()
class TestDataComponent extends Component {
    @SerializableField({ dataType: 'string' })
    public name: string = 'TestEntity';
    
    @SerializableField({ dataType: 'number' })
    public value: number = 42;
    
    @SerializableField({ dataType: 'boolean' })
    public isActive: boolean = true;
    
    @SerializableField({ dataType: 'number[]' })
    public numbers: number[] = [1, 2, 3, 4, 5];
}

@Serializable()
class LargeDataComponent extends Component {
    @SerializableField({ dataType: 'string' })
    public largeText: string = 'A'.repeat(1000); // 1KB的重复数据
    
    @SerializableField({ dataType: 'number[]' })
    public largeArray: number[] = new Array(100).fill(0).map((_, i) => i % 10); // 有模式的数据
}

describe('压缩和加密集成测试', () => {
    let world: World;
    let scene: Scene;
    
    beforeEach(() => {
        // 重置注册表
        SchemaRegistry.reset();
        SchemaRegistry.init();
        
        // 注册组件
        ComponentRegistry.register(TestDataComponent);
        ComponentRegistry.register(LargeDataComponent);
        
        // 注册Schema
        SchemaRegistry.registerComponent('TestDataComponent', {
            name: { dataType: 'string' },
            value: { dataType: 'number' },
            isActive: { dataType: 'boolean' },
            numbers: { dataType: 'number[]' }
        });
        
        SchemaRegistry.registerComponent('LargeDataComponent', {
            largeText: { dataType: 'string' },
            largeArray: { dataType: 'number[]' }
        });
        
        // 创建测试World和Scene
        world = new World({ name: 'TestWorld' });
        scene = world.addScene('main', new Scene());
    });
    
    afterEach(() => {
        // 清理测试环境
    });
    
    describe('基础压缩功能', () => {
        test('应该支持无压缩', () => {
            // 创建测试数据
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestDataComponent());
            
            // 序列化（无压缩）
            const result = ColumnarSerializer.serialize(world, {
                compression: false,
                skipDefaults: false,
                strict: true
            });
            
            expect(result.buffer).toBeInstanceOf(ArrayBuffer);
            expect(result.metadata.compression).toBeUndefined();
            expect(result.stats.compressionRatio).toBe(1.0);
        });
        
        test('应该支持RLE压缩', () => {
            // 创建大量重复数据
            for (let i = 0; i < 10; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                entity.addComponent(new LargeDataComponent());
            }
            
            // 序列化（RLE压缩）
            const result = ColumnarSerializer.serialize(world, {
                compression: true,
                compressor: 'rle',
                skipDefaults: false,
                strict: true
            });
            
            expect(result.metadata.compression?.compressor).toBe('rle');
            expect(result.stats.compressionRatio).toBeLessThan(1.0);
            expect(result.metadata.compression?.originalSize).toBeGreaterThan(result.buffer.byteLength);
        });
        
        test('应该支持ECS专用压缩', () => {
            // 创建各种类型的ECS数据
            for (let i = 0; i < 20; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                const testComp = new TestDataComponent();
                testComp.name = `Entity${i}`;
                testComp.value = i;
                testComp.isActive = i % 2 === 0;
                entity.addComponent(testComp);
                
                if (i % 3 === 0) {
                    entity.addComponent(new LargeDataComponent());
                }
            }
            
            // 序列化（ECS压缩）
            const result = ColumnarSerializer.serialize(world, {
                compression: true,
                compressor: 'ecs-lz',
                compressionOptions: { level: 6 },
                skipDefaults: false,
                strict: true
            });
            
            expect(result.metadata.compression?.compressor).toBe('ecs-lz');
            expect(result.stats.compressionRatio).toBeLessThan(0.8); // 期望有较好的压缩效果
        });
        
        test('应该支持流式压缩', () => {
            // 创建大量数据
            for (let i = 0; i < 100; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                const largeComp = new LargeDataComponent();
                largeComp.largeText = 'StreamingTest'.repeat(100);
                entity.addComponent(largeComp);
            }
            
            // 序列化（流式压缩）
            const result = ColumnarSerializer.serialize(world, {
                compression: true,
                compressor: 'streaming',
                compressionOptions: { 
                    level: 5,
                    blockSize: 32 * 1024 // 32KB块大小
                },
                skipDefaults: false,
                strict: true
            });
            
            expect(result.metadata.compression?.compressor).toBe('streaming');
            expect(result.buffer.byteLength).toBeGreaterThan(0);
        });
    });
    
    describe('加密功能', () => {
        test('应该支持XOR加密', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestDataComponent());
            
            const encryptor = CompressionRegistry.getEncryptor('xor');
            const key = encryptor!.generateKey();
            
            // 序列化（XOR加密）
            const result = ColumnarSerializer.serialize(world, {
                compression: false,
                encryption: true,
                encryptor: 'xor',
                encryptionKey: key,
                skipDefaults: false,
                strict: true
            });
            
            expect(result.metadata.encrypted).toBe(true);
            expect(result.buffer.byteLength).toBeGreaterThan(0);
        });
        
        test('应该支持ChaCha20加密', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestDataComponent());
            
            const encryptor = CompressionRegistry.getEncryptor('chacha20');
            const key = encryptor!.generateKey();
            
            // 序列化（ChaCha20加密）
            const result = ColumnarSerializer.serialize(world, {
                compression: false,
                encryption: true,
                encryptor: 'chacha20',
                encryptionKey: key,
                skipDefaults: false,
                strict: true
            });
            
            expect(result.metadata.encrypted).toBe(true);
            expect(result.buffer.byteLength).toBeGreaterThan(0);
        });
    });
    
    describe('压缩+加密组合', () => {
        test('应该支持压缩后加密', () => {
            // 创建测试数据
            for (let i = 0; i < 10; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                entity.addComponent(new LargeDataComponent());
            }
            
            const encryptor = CompressionRegistry.getEncryptor('chacha20');
            const key = encryptor!.generateKey();
            
            // 序列化（压缩+加密）
            const result = ColumnarSerializer.serialize(world, {
                compression: true,
                compressor: 'ecs-lz',
                compressionOptions: { level: 7 },
                encryption: true,
                encryptor: 'chacha20',
                encryptionKey: key,
                skipDefaults: false,
                strict: true
            });
            
            expect(result.metadata.compression?.compressor).toBe('ecs-lz');
            expect(result.metadata.encrypted).toBe(true);
            expect(result.stats.compressionRatio).toBeLessThan(1.0);
        });
    });
    
    describe('智能压缩器选择', () => {
        test('应该根据数据大小自动选择压缩器', () => {
            // 小数据
            const smallDataResult = CompressionRegistry.selectBestCompressor(500, 'speed');
            expect(smallDataResult).toBe('none');
            
            // 中等数据
            const mediumDataResult = CompressionRegistry.selectBestCompressor(10 * 1024, 'balanced');
            expect(mediumDataResult).toBe('ecs-lz');
            
            // 大数据
            const largeDataResult = CompressionRegistry.selectBestCompressor(100 * 1024, 'ratio');
            expect(largeDataResult).toBe('ecs-lz');
        });
        
        test('应该提供压缩器信息', () => {
            const info = CompressionRegistry.getCompressorInfo('ecs-lz');
            expect(info).toBeDefined();
            expect(info?.name).toBe('ecs-lz');
            expect(info?.supportedLevels).toEqual([1, 9]);
            expect(info?.supportsDictionary).toBe(true);
        });
        
        test('应该提供加密器信息', () => {
            const info = CompressionRegistry.getEncryptorInfo('chacha20');
            expect(info).toBeDefined();
            expect(info?.name).toBe('chacha20');
            expect(info?.keyLength).toBe(32);
            expect(info?.ivLength).toBe(12);
        });
    });
    
    describe('错误处理', () => {
        test('应该处理未知压缩器', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestDataComponent());
            
            // 序列化（未知压缩器）
            const result = ColumnarSerializer.serialize(world, {
                compression: true,
                compressor: 'unknown-compressor',
                skipDefaults: false,
                strict: true
            });
            
            // 应该回退到无压缩
            expect(result.metadata.compression?.compressor).toBe('none');
        });
        
        test('应该处理加密配置错误', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestDataComponent());
            
            // 序列化（缺少加密密钥）
            const result = ColumnarSerializer.serialize(world, {
                compression: false,
                encryption: true,
                encryptor: 'chacha20',
                // encryptionKey 缺失
                skipDefaults: false,
                strict: true
            });
            
            // 应该跳过加密
            expect(result.metadata.encrypted).toBeFalsy();
        });
    });
    
    describe('性能统计', () => {
        test('应该提供压缩统计信息', () => {
            // 创建可压缩的数据
            for (let i = 0; i < 50; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                entity.addComponent(new LargeDataComponent());
            }
            
            const result = ColumnarSerializer.serialize(world, {
                compression: true,
                compressor: 'rle',
                skipDefaults: false,
                strict: true
            });
            
            expect(result.stats.serializationTime).toBeGreaterThan(0);
            expect(result.stats.compressionRatio).toBeLessThan(1.0);
            expect(result.metadata.compression?.originalSize).toBeDefined();
            expect(result.metadata.compression?.timestamp).toBeDefined();
        });
    });
});