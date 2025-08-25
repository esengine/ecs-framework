import { World } from '../../../../src/ECS/World';
import { Component } from '../../../../src/ECS/Component';
import { Scene } from '../../../../src/ECS/Scene';
import { Serializable, SerializableField } from '../../../../src/ECS/Decorators/SerializationDecorators';
import { ColumnarSerializer } from '../../../../src/ECS/Core/Serialization/ColumnarSerializer';
import { SchemaRegistry } from '../../../../src/ECS/Core/Serialization/SchemaRegistry';
import { ComponentRegistry } from '../../../../src/ECS/Core/ComponentStorage/ComponentRegistry';
import { initializeCompressionSystem } from '../../../../src/ECS/Core/Compression';

// 测试组件
@Serializable()
class TestComponent extends Component {
    @SerializableField({ dataType: 'int32' })
    value: number = 0;
    
    @SerializableField({ dataType: 'string' })
    text: string = '';
    
    constructor(...args: unknown[]) {
        super();
        const [value = 0, text = ''] = args as [number?, string?];
        this.value = value;
        this.text = text;
    }
}

describe('ColumnarSerializer压缩解压缩修复测试', () => {
    beforeAll(() => {
        initializeCompressionSystem();
    });
    
    let world: World;
    let scene: Scene;
    
    beforeEach(() => {
        SchemaRegistry.reset();
        SchemaRegistry.init();
        ComponentRegistry.reset();
        
        // 注册组件类型和Schema
        ComponentRegistry.register(TestComponent);
        SchemaRegistry.registerComponent('TestComponent', {
            value: { dataType: 'int32' },
            text: { dataType: 'string' }
        });
        
        world = new World({ name: 'TestWorld' });
        scene = world.addScene('main', new Scene());
        
        // 创建一些测试实体
        for (let i = 0; i < 5; i++) {
            const entity = scene.createEntity(`TestEntity${i}`);
            entity.addComponent(new TestComponent(i, `Entity${i}`));
        }
    });
    
    test('基本序列化/反序列化应该工作', () => {
        // 调试：打印序列化前的原始数据
        console.log('=== 序列化前的原始数据 ===');
        const originalEntities = scene.entities.buffer;
        for (let i = 0; i < originalEntities.length; i++) {
            const entity = originalEntities[i];
            const comp = entity.getComponent(TestComponent);
            console.log(`Original Entity ${i}: value=${comp?.value}, text="${comp?.text}"`);
        }
        
        const result = ColumnarSerializer.serialize(world);
        expect(result.buffer.byteLength).toBeGreaterThan(0);
        
        console.log('=== 序列化结果 ===');
        console.log(`Buffer size: ${result.buffer.byteLength} bytes`);
        console.log(`Entity count: ${result.metadata.entityCount}`);
        console.log(`Component types: ${result.metadata.componentTypeCount}`);
        
        const newWorld = new World({ name: 'DeserializedWorld' });
        
        // 重新注册组件（反序列化需要）
        ComponentRegistry.register(TestComponent);
        SchemaRegistry.registerComponent('TestComponent', {
            value: { dataType: 'int32' },
            text: { dataType: 'string' }
        });
        
        ColumnarSerializer.deserialize(result.buffer, newWorld);
        
        const newScene = newWorld.getScene('default') || newWorld.getScene('main');
        expect(newScene).not.toBeNull();
        
        if (newScene) {
            const entities = newScene.entities.buffer;
            expect(entities.length).toBe(5);
            
            // 调试：打印实际数据
            console.log('=== 反序列化后的数据 ===');
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                const comp = entity.getComponent(TestComponent);
                console.log(`Deserialized Entity ${i}: value=${comp?.value}, text="${comp?.text}"`);
            }
            
            // 验证所有实体都有组件且数据完整
            let foundValues = new Set<number>();
            let foundTexts = new Set<string>();
            
            for (const entity of entities) {
                const comp = entity.getComponent(TestComponent);
                expect(comp).toBeDefined();
                if (comp) {
                    foundValues.add(comp.value);
                    foundTexts.add(comp.text);
                }
            }
            
            console.log('Found values:', Array.from(foundValues).sort((a, b) => a - b));
            console.log('Found texts:', Array.from(foundTexts).sort());
            
            // 验证所有期望的值都存在（不依赖顺序）
            expect(foundValues.size).toBe(5);
            expect(foundTexts.size).toBe(5);
            expect(foundValues.has(0) && foundValues.has(4)).toBe(true);
            expect(foundTexts.has('Entity0') && foundTexts.has('Entity4')).toBe(true);
        }
    });
    
    test('RLE压缩的序列化/反序列化应该工作', () => {
        const context = {
            compression: true,
            compressor: 'rle',
            compressionOptions: { level: 3 },
            skipDefaults: true,
            strict: false
        };
        
        const result = ColumnarSerializer.serialize(world, context);
        expect(result.buffer.byteLength).toBeGreaterThan(0);
        expect(result.metadata.compression).toBeDefined();
        expect(result.metadata.compression?.compressor).toBe('rle');
        
        const newWorld = new World({ name: 'DeserializedWorld' });
        
        // 重新注册组件（反序列化需要）
        ComponentRegistry.register(TestComponent);
        SchemaRegistry.registerComponent('TestComponent', {
            value: { dataType: 'int32' },
            text: { dataType: 'string' }
        });
        
        ColumnarSerializer.deserialize(result.buffer, newWorld, context);
        
        const newScene = newWorld.getScene('default') || newWorld.getScene('main');
        expect(newScene).not.toBeNull();
        
        if (newScene) {
            const entities = newScene.entities.buffer;
            expect(entities.length).toBe(5);
            
            // 验证压缩功能工作且数据完整
            let foundValues = new Set<number>();
            let foundTexts = new Set<string>();
            
            for (const entity of entities) {
                const comp = entity.getComponent(TestComponent);
                expect(comp).toBeDefined();
                if (comp) {
                    foundValues.add(comp.value);
                    foundTexts.add(comp.text);
                }
            }
            
            // 验证RLE压缩后数据完整性
            expect(foundValues.size).toBe(5);
            expect(foundTexts.size).toBe(5);
            for (let i = 0; i < 5; i++) {
                expect(foundValues.has(i)).toBe(true);
                expect(foundTexts.has(`Entity${i}`)).toBe(true);
            }
        }
    });
    
    test('加密的序列化/反序列化应该工作', () => {
        const encryptionKey = new Uint8Array(32).fill(0x42);
        const context = {
            compression: false,
            encryption: true,
            encryptor: 'chacha20',
            encryptionKey,
            skipDefaults: true,
            strict: false
        };
        
        const result = ColumnarSerializer.serialize(world, context);
        expect(result.buffer.byteLength).toBeGreaterThan(0);
        expect(result.metadata.encrypted).toBe(true);
        
        const newWorld = new World({ name: 'DeserializedWorld' });
        
        // 重新注册组件（反序列化需要）
        ComponentRegistry.register(TestComponent);
        SchemaRegistry.registerComponent('TestComponent', {
            value: { dataType: 'int32' },
            text: { dataType: 'string' }
        });
        
        ColumnarSerializer.deserialize(result.buffer, newWorld, context);
        
        const newScene = newWorld.getScene('default') || newWorld.getScene('main');
        expect(newScene).not.toBeNull();
        
        if (newScene) {
            const entities = newScene.entities.buffer;
            expect(entities.length).toBe(5);
            
            // 验证加密功能工作且数据完整
            let foundValues = new Set<number>();
            let foundTexts = new Set<string>();
            
            for (const entity of entities) {
                const comp = entity.getComponent(TestComponent);
                expect(comp).toBeDefined();
                if (comp) {
                    foundValues.add(comp.value);
                    foundTexts.add(comp.text);
                }
            }
            
            expect(foundValues.size).toBe(5);
            expect(foundTexts.size).toBe(5);
            expect(foundValues.has(0) && foundValues.has(4)).toBe(true);
            expect(foundTexts.has('Entity0') && foundTexts.has('Entity4')).toBe(true);
        }
    });
    
    test('压缩+加密的序列化/反序列化应该工作', () => {
        const encryptionKey = new Uint8Array(32).fill(0x42);
        const context = {
            compression: true,
            compressor: 'rle',
            compressionOptions: { level: 3 },
            encryption: true,
            encryptor: 'chacha20',
            encryptionKey,
            skipDefaults: true,
            strict: false
        };
        
        const result = ColumnarSerializer.serialize(world, context);
        expect(result.buffer.byteLength).toBeGreaterThan(0);
        expect(result.metadata.compression).toBeDefined();
        expect(result.metadata.encrypted).toBe(true);
        
        const newWorld = new World({ name: 'DeserializedWorld' });
        
        // 重新注册组件（反序列化需要）
        ComponentRegistry.register(TestComponent);
        SchemaRegistry.registerComponent('TestComponent', {
            value: { dataType: 'int32' },
            text: { dataType: 'string' }
        });
        
        ColumnarSerializer.deserialize(result.buffer, newWorld, context);
        
        const newScene = newWorld.getScene('default') || newWorld.getScene('main');
        expect(newScene).not.toBeNull();
        
        if (newScene) {
            const entities = newScene.entities.buffer;
            expect(entities.length).toBe(5);
            
            // 验证压缩+加密功能工作且数据完整
            let foundValues = new Set<number>();
            let foundTexts = new Set<string>();
            
            for (const entity of entities) {
                const comp = entity.getComponent(TestComponent);
                expect(comp).toBeDefined();
                if (comp) {
                    foundValues.add(comp.value);
                    foundTexts.add(comp.text);
                }
            }
            
            // 验证压缩+加密后数据完整性
            expect(foundValues.size).toBe(5);
            expect(foundTexts.size).toBe(5);
            for (let i = 0; i < 5; i++) {
                expect(foundValues.has(i)).toBe(true);
                expect(foundTexts.has(`Entity${i}`)).toBe(true);
            }
        }
    });
});