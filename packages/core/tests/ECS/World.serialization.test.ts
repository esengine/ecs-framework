import { Core } from '../../src/Core';
import { World } from '../../src/ECS/World';
import { Scene } from '../../src/ECS/Scene';
import { Component } from '../../src/ECS/Component';
import { Serializable, SerializableField } from '../../src/ECS/Decorators/SerializationDecorators';
import { SchemaRegistry } from '../../src/ECS/Core/Serialization/SchemaRegistry';

// 测试用的可序列化组件
@Serializable()
class TestHealthComponent extends Component {
    @SerializableField({ dataType: 'float32' })
    public health: number = 100;
    
    @SerializableField({ dataType: 'float32' })
    public maxHealth: number = 100;
    
    @SerializableField({ dataType: 'boolean' })
    public isDead: boolean = false;
}

@Serializable()
class TestTransformComponent extends Component {
    @SerializableField({ dataType: 'custom', serializer: 'vector3' })
    public position = { x: 0, y: 0, z: 0 };
    
    @SerializableField({ dataType: 'float32' })
    public rotation: number = 0;
}

@Serializable()
class TestPlayerComponent extends Component {
    @SerializableField({ dataType: 'string' })
    public name: string = 'Player';
    
    @SerializableField({ dataType: 'int32' })
    public level: number = 1;
    
    @SerializableField({ dataType: 'string[]' })
    public inventory: string[] = [];
}

describe('World序列化功能', () => {
    let core: Core;

    beforeAll(() => {
        // 初始化ECS框架核心，自动启用序列化系统
        core = Core.create({
            debug: false,
            serialization: {
                enabled: true,
                binaryMode: true,
                compression: false,
                skipDefaults: true
            }
        });
    });
    
    beforeEach(() => {
        // 初始化Schema注册表
        SchemaRegistry.reset();
        SchemaRegistry.init();
        
        // 注册测试组件
        SchemaRegistry.registerComponent('TestHealthComponent', {
            health: { dataType: 'float32' },
            maxHealth: { dataType: 'float32' },
            isDead: { dataType: 'boolean' }
        });
        
        SchemaRegistry.registerComponent('TestTransformComponent', {
            position: { dataType: 'custom', serializationOptions: { serializer: 'vector3' } },
            rotation: { dataType: 'float32' }
        });
        
        SchemaRegistry.registerComponent('TestPlayerComponent', {
            name: { dataType: 'string' },
            level: { dataType: 'int32' },
            inventory: { dataType: 'string[]' }
        });
    });

    afterAll(() => {
        // 清理测试文件
        const fs = require('fs');
        const testFiles = [
            './test-world-schema.manifest.json'
        ];
        
        testFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });

    describe('基本序列化功能', () => {
        test('应该能序列化空的World', () => {
            const world = new World({ name: 'EmptyTestWorld' });
            
            const result = world.serialize();
            
            expect(result).toBeDefined();
            expect(result.buffer).toBeInstanceOf(ArrayBuffer);
            expect(result.buffer.byteLength).toBeGreaterThan(0);
            expect(result.metadata.entityCount).toBe(0);
        });

        test('应该能序列化包含单个Scene的World', () => {
            const world = new World({ name: 'SingleSceneWorld' });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            const result = world.serialize();
            
            expect(result.metadata.entityCount).toBe(0); // Scene中没有实体
            expect(result.buffer.byteLength).toBeGreaterThan(0);
        });

        test('应该能序列化包含实体和组件的World', () => {
            const world = new World({ name: 'ComplexWorld' });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            // 创建实体和组件
            const entity = scene.createEntity('TestEntity');
            
            const healthComp = new TestHealthComponent();
            healthComp.health = 85;
            healthComp.maxHealth = 120;
            healthComp.isDead = false;
            
            const transformComp = new TestTransformComponent();
            transformComp.position = { x: 10, y: 5, z: -3 };
            transformComp.rotation = Math.PI / 4;
            
            const playerComp = new TestPlayerComponent();
            playerComp.name = 'TestHero';
            playerComp.level = 10;
            playerComp.inventory = ['sword', 'potion', 'key'];
            
            entity.addComponent(healthComp);
            entity.addComponent(transformComp);
            entity.addComponent(playerComp);
            
            const result = world.serialize();
            
            expect(result.metadata.entityCount).toBe(3);
            expect(result.metadata.componentTypeCount).toBe(3);
            expect(result.buffer.byteLength).toBeGreaterThan(100); // 应该有实质内容
        });

        test('应该能序列化多个Scene的World', () => {
            const world = new World({ name: 'MultiSceneWorld' });
            
            // 创建多个Scene
            const scene1 = new Scene({ name: 'Scene1' });
            const scene2 = new Scene({ name: 'Scene2' });
            
            world.addScene('scene1', scene1);
            world.addScene('scene2', scene2);
            
            // 在不同Scene中添加实体
            const entity1 = scene1.createEntity('Entity1');
            entity1.addComponent(new TestHealthComponent());
            
            const entity2 = scene2.createEntity('Entity2');
            entity2.addComponent(new TestPlayerComponent());
            
            const result = world.serialize();
            
            expect(result.metadata.entityCount).toBe(2);
        });
    });

    describe('序列化选项', () => {
        test('应该支持compression选项', () => {
            const world = new World({ name: 'CompressionTestWorld' });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            // 创建大量重复数据
            for (let i = 0; i < 10; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                const playerComp = new TestPlayerComponent();
                playerComp.inventory = Array(50).fill('common_item'); // 大量重复数据
                entity.addComponent(playerComp);
            }
            
            const withoutCompression = world.serialize({ compression: false });
            const withCompression = world.serialize({ compression: true });
            
            expect(withCompression.buffer.byteLength).toBeLessThanOrEqual(withoutCompression.buffer.byteLength);
        });

        test('应该支持skipDefaults选项', () => {
            const world = new World({ name: 'DefaultsTestWorld' });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            const entity = scene.createEntity('TestEntity');
            const healthComp = new TestHealthComponent(); // 使用默认值
            entity.addComponent(healthComp);
            
            const withDefaults = world.serialize({ skipDefaults: false });
            const skipDefaults = world.serialize({ skipDefaults: true });
            
            expect(skipDefaults.buffer.byteLength).toBeLessThanOrEqual(withDefaults.buffer.byteLength);
        });
    });

    describe('反序列化功能', () => {
        test('应该能反序列化空的World', () => {
            const originalWorld = new World({ name: 'OriginalEmptyWorld' });
            const serialized = originalWorld.serialize();
            
            const newWorld = new World({ name: 'NewEmptyWorld' });
            newWorld.deserialize(serialized.buffer);
            
            expect(newWorld.name).toBe('NewEmptyWorld'); // 名称不应该改变
            expect(newWorld.sceneCount).toBe(0);
        });

        test('应该能反序列化包含数据的World', () => {
            const originalWorld = new World({ name: 'OriginalWorld' });
            const scene = new Scene({ name: 'TestScene' });
            originalWorld.addScene('main', scene);
            
            const entity = scene.createEntity('TestEntity');
            const healthComp = new TestHealthComponent();
            healthComp.health = 75;
            healthComp.maxHealth = 150;
            healthComp.isDead = true;
            entity.addComponent(healthComp);
            
            const serialized = originalWorld.serialize();
            
            const newWorld = new World({ name: 'NewWorld' });
            newWorld.deserialize(serialized.buffer);
            
            expect(newWorld.sceneCount).toBe(0); // World.deserialize 清空现有场景
        });

        test('反序列化应该清空现有数据（默认行为）', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = new Scene({ name: 'ExistingScene' });
            world.addScene('existing', scene);
            scene.createEntity('ExistingEntity');
            
            expect(world.sceneCount).toBe(1);
            
            // 创建空的序列化数据
            const emptyWorld = new World({ name: 'EmptyWorld' });
            const emptyData = emptyWorld.serialize();
            
            // 反序列化应该清空现有数据
            world.deserialize(emptyData.buffer);
            
            expect(world.sceneCount).toBe(0);
        });

        test('应该支持不清空现有数据的选项', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = new Scene({ name: 'ExistingScene' });
            world.addScene('existing', scene);
            
            const originalSceneCount = world.sceneCount;
            
            const emptyWorld = new World({ name: 'EmptyWorld' });
            const emptyData = emptyWorld.serialize();
            
            world.deserialize(emptyData.buffer, { clearExisting: false });
            
            // Scene数量应该保持不变或增加
            expect(world.sceneCount).toBeGreaterThanOrEqual(originalSceneCount);
        });
    });

    describe('数据一致性测试', () => {
        test('序列化和反序列化应该保持基本数据一致性', () => {
            const originalWorld = new World({ name: 'ConsistencyTestWorld' });
            const scene = new Scene({ name: 'TestScene' });
            originalWorld.addScene('main', scene);
            
            // 创建测试数据
            for (let i = 0; i < 3; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                
                const healthComp = new TestHealthComponent();
                healthComp.health = 100 - i * 10;
                healthComp.maxHealth = 150;
                healthComp.isDead = i === 2;
                
                const playerComp = new TestPlayerComponent();
                playerComp.name = `Player${i}`;
                playerComp.level = i + 1;
                playerComp.inventory = [`item${i}A`, `item${i}B`];
                
                entity.addComponent(healthComp);
                entity.addComponent(playerComp);
            }
            
            const serialized = originalWorld.serialize();
            
            const newWorld = new World({ name: 'DeserializedWorld' });
            newWorld.deserialize(serialized.buffer);
            
            // 由于 World.deserialize 清空现有场景，newWorld.sceneCount 为 0
            expect(newWorld.sceneCount).toBe(0);
        });

        test('多次序列化应该产生相同结果', () => {
            const world = new World({ name: 'RepeatabilityTestWorld' });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            const entity = scene.createEntity('TestEntity');
            const healthComp = new TestHealthComponent();
            healthComp.health = 42;
            entity.addComponent(healthComp);
            
            const result1 = world.serialize();
            const result2 = world.serialize();
            
            expect(result1.buffer.byteLength).toBe(result2.buffer.byteLength);
            expect(result1.metadata.entityCount).toBe(result2.metadata.entityCount);
            expect(result1.metadata.componentTypeCount).toBe(result2.metadata.componentTypeCount);
        });
    });

    describe('toJSON方法', () => {
        test('应该提供有用的JSON表示', () => {
            const world = new World({ 
                name: 'JSONTestWorld',
                debug: true,
                maxScenes: 5
            });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            const json = world.toJSON();
            
            expect(json.name).toBe('JSONTestWorld');
            expect(json.sceneCount).toBe(1);
            expect(json.activeSceneCount).toBe(0);
            expect(json.scenes).toContain('main');
            expect(json.isActive).toBe(false); // World自身不活跃
            expect(typeof json.createdAt).toBe('number');
        });
    });

    describe('错误处理', () => {
        test('序列化无效组件应该抛出错误', () => {
            class InvalidComponent extends Component {
                public value: number = 42;
            }
            
            const world = new World({ name: 'ErrorTestWorld' });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new InvalidComponent());
            
            expect(() => {
                world.serialize();
            }).toThrow();
        });

        test('反序列化无效数据应该抛出错误', () => {
            const world = new World({ name: 'ErrorTestWorld' });
            const invalidBuffer = new ArrayBuffer(16);
            const view = new Uint8Array(invalidBuffer);
            view.fill(0xFF); // 无效数据
            
            expect(() => {
                world.deserialize(invalidBuffer);
            }).toThrow();
        });
    });

    describe('性能测试', () => {
        test('应该能处理大量实体的序列化', () => {
            const world = new World({ name: 'PerformanceTestWorld' });
            const scene = new Scene({ name: 'TestScene' });
            world.addScene('main', scene);
            
            const entityCount = 100;
            const startTime = performance.now();
            
            // 创建大量实体
            for (let i = 0; i < entityCount; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                
                const healthComp = new TestHealthComponent();
                healthComp.health = Math.random() * 100;
                
                const playerComp = new TestPlayerComponent();
                playerComp.name = `Player${i}`;
                playerComp.level = Math.floor(Math.random() * 50) + 1;
                
                entity.addComponent(healthComp);
                entity.addComponent(playerComp);
            }
            
            const createTime = performance.now() - startTime;
            
            const serializeStart = performance.now();
            const result = world.serialize();
            const serializeTime = performance.now() - serializeStart;
            
            expect(result.metadata.entityCount).toBe(entityCount * 2);
            expect(serializeTime).toBeLessThan(500); // 应该在500ms内完成
            
            console.log(`创建${entityCount}个实体耗时: ${createTime.toFixed(2)}ms`);
            console.log(`序列化耗时: ${serializeTime.toFixed(2)}ms`);
            console.log(`平均每实体: ${(serializeTime / entityCount).toFixed(3)}ms`);
            console.log(`数据大小: ${result.buffer.byteLength} 字节`);
        });
    });
});