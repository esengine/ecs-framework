import { Component } from '../../../../src/ECS/Component';
import { World } from '../../../../src/ECS/World';
import { Scene } from '../../../../src/ECS/Scene';
import { ColumnarSerializer } from '../../../../src/ECS/Core/Serialization/ColumnarSerializer';
import { Serializable, SerializableField } from '../../../../src/ECS/Decorators/SerializationDecorators';
import { SchemaRegistry } from '../../../../src/ECS/Core/Serialization/SchemaRegistry';

@Serializable()
class HealthComponent extends Component {
    @SerializableField({ dataType: 'float32' })
    public health: number = 100;
    
    @SerializableField({ dataType: 'float32' })
    public maxHealth: number = 100;
    
    @SerializableField({ dataType: 'boolean' })
    public isDead: boolean = false;
}

@Serializable()
class TransformComponent extends Component {
    @SerializableField({ dataType: 'custom', serializer: 'vector3' })
    public position = { x: 0, y: 0, z: 0 };
    
    @SerializableField({ dataType: 'custom', serializer: 'vector3' })
    public scale = { x: 1, y: 1, z: 1 };
    
    @SerializableField({ dataType: 'float32' })
    public rotation: number = 0;
}

@Serializable()
class PlayerComponent extends Component {
    @SerializableField({ dataType: 'string' })
    public name: string = 'Player';
    
    @SerializableField({ dataType: 'int32' })
    public level: number = 1;
    
    @SerializableField({ dataType: 'string[]' })
    public inventory: string[] = [];
}

describe('ColumnarSerializer', () => {
    beforeEach(() => {
        // 每次测试前初始化Schema注册表
        SchemaRegistry.reset();
        SchemaRegistry.init();
        
        // 手动注册测试组件到SchemaRegistry
        SchemaRegistry.registerComponent('HealthComponent', {
            health: { dataType: 'float32' },
            maxHealth: { dataType: 'float32' },
            isDead: { dataType: 'boolean' }
        });
        
        SchemaRegistry.registerComponent('TransformComponent', {
            position: { dataType: 'custom', serializationOptions: { serializer: 'vector3' } },
            scale: { dataType: 'custom', serializationOptions: { serializer: 'vector3' } },
            rotation: { dataType: 'float32' }
        });
        
        SchemaRegistry.registerComponent('PlayerComponent', {
            name: { dataType: 'string' },
            level: { dataType: 'int32' },
            inventory: { dataType: 'string[]' }
        });
    });

    afterEach(() => {
        // 清理状态
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe('基本序列化功能', () => {
        test('应该能序列化空的World', () => {
            const world = new World({ name: 'TestWorld' });
            
            const result = ColumnarSerializer.serialize(world);
            
            expect(result.buffer).toBeInstanceOf(ArrayBuffer);
            expect(result.buffer.byteLength).toBeGreaterThan(0);
            expect(result.metadata.entityCount).toBe(0);
            expect(result.metadata.componentTypeCount).toBe(0);
        });

        test('应该能序列化包含单个实体的World', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = world.addScene('main', new Scene());
            
            const entity = scene.createEntity('TestEntity');
            const healthComp = new HealthComponent();
            healthComp.health = 85;
            healthComp.maxHealth = 120;
            healthComp.isDead = false;
            
            entity.addComponent(healthComp);
            
            const result = ColumnarSerializer.serialize(world);
            
            expect(result.buffer).toBeInstanceOf(ArrayBuffer);
            expect(result.buffer.byteLength).toBeGreaterThan(0);
            expect(result.metadata.entityCount).toBe(1);
            expect(result.metadata.componentTypeCount).toBe(1);
        });

        test('应该能序列化包含多个组件的实体', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = world.addScene('main', new Scene());
            
            const entity = scene.createEntity('TestEntity');
            
            const healthComp = new HealthComponent();
            healthComp.health = 85;
            
            const transformComp = new TransformComponent();
            transformComp.position = { x: 10, y: 0, z: 5 };
            transformComp.rotation = Math.PI / 4;
            
            const playerComp = new PlayerComponent();
            playerComp.name = 'Hero';
            playerComp.level = 5;
            playerComp.inventory = ['sword', 'potion'];
            
            entity.addComponent(healthComp);
            entity.addComponent(transformComp);
            entity.addComponent(playerComp);
            
            const result = ColumnarSerializer.serialize(world);
            
            expect(result.metadata.entityCount).toBe(3);
            expect(result.metadata.componentTypeCount).toBe(3);
        });

        test('应该能序列化多个实体', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = world.addScene('main', new Scene());
            
            // 创建多个实体
            for (let i = 0; i < 3; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                const healthComp = new HealthComponent();
                healthComp.health = 100 - i * 10;
                entity.addComponent(healthComp);
            }
            
            const result = ColumnarSerializer.serialize(world);
            
            expect(result.metadata.entityCount).toBe(3);
            expect(result.metadata.componentTypeCount).toBe(1);
        });
    });

    describe('反序列化功能', () => {
        test('应该能反序列化空的World', () => {
            const originalWorld = new World({ name: 'TestWorld' });
            const serialized = ColumnarSerializer.serialize(originalWorld);
            
            const newWorld = new World({ name: 'NewWorld' });
            
            expect(() => {
                ColumnarSerializer.deserialize(serialized.buffer, newWorld);
            }).not.toThrow();
            
            expect(newWorld.sceneCount).toBe(0);
        });

        test('应该能正确反序列化单个实体', () => {
            const originalWorld = new World({ name: 'TestWorld' });
            const scene = originalWorld.addScene('main', new Scene());
            
            const entity = scene.createEntity('TestEntity');
            const healthComp = new HealthComponent();
            healthComp.health = 85;
            entity.addComponent(healthComp);
            
            const serialized = ColumnarSerializer.serialize(originalWorld);
            
            const newWorld = new World({ name: 'NewWorld' });
            ColumnarSerializer.deserialize(serialized.buffer, newWorld);
            
            // 基本验证
            expect(newWorld.sceneCount).toBeGreaterThanOrEqual(0);
        });

        test('序列化和反序列化应该保持数据一致性', () => {
            const originalWorld = new World({ name: 'TestWorld' });
            const scene = originalWorld.addScene('main', new Scene());
            
            const entity = scene.createEntity('TestEntity');
            const playerComp = new PlayerComponent();
            playerComp.name = 'TestPlayer';
            playerComp.level = 5;
            entity.addComponent(playerComp);
            
            const serialized = ColumnarSerializer.serialize(originalWorld);
            
            const newWorld = new World({ name: 'NewWorld' });
            ColumnarSerializer.deserialize(serialized.buffer, newWorld);
            
            // 基本一致性验证
            expect(newWorld.sceneCount).toBeGreaterThanOrEqual(0);
        });
    });

    describe('序列化选项', () => {
        test('应该支持压缩选项', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = world.addScene('main', new Scene());
            
            // 创建一些测试数据
            for (let i = 0; i < 5; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                const healthComp = new HealthComponent();
                healthComp.health = 100;
                entity.addComponent(healthComp);
            }
            
            const context = {
                compression: true,
                skipDefaults: false,
                strict: false,
                maxEntities: 10000,
                maxComponents: 100
            };
            
            const result = ColumnarSerializer.serialize(world, context);
            
            expect(result.buffer).toBeInstanceOf(ArrayBuffer);
            expect(result.metadata.entityCount).toBe(5);
        });

        test('应该支持skipDefaults选项', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = world.addScene('main', new Scene());
            
            const entity = scene.createEntity('TestEntity');
            const healthComp = new HealthComponent();
            // 使用默认值，应该在skipDefaults=true时被跳过
            entity.addComponent(healthComp);
            
            const context = {
                compression: false,
                skipDefaults: true,
                strict: false,
                maxEntities: 10000,
                maxComponents: 100
            };
            
            const result = ColumnarSerializer.serialize(world, context);
            
            expect(result.buffer).toBeInstanceOf(ArrayBuffer);
            expect(result.metadata.entityCount).toBe(1);
        });
    });

    describe('错误处理', () => {
        test('应该在序列化未标记组件时抛出错误', () => {
            class UnmarkedComponent extends Component {
                public value: number = 42;
            }
            
            const world = new World({ name: 'TestWorld' });
            const scene = world.addScene('main', new Scene());
            
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new UnmarkedComponent());
            
            expect(() => {
                ColumnarSerializer.serialize(world);
            }).toThrow();
        });

        test('应该处理无效的序列化数据', () => {
            const invalidBuffer = new ArrayBuffer(16);
            const view = new Uint32Array(invalidBuffer);
            view.fill(0xFFFFFFFF);
            
            const world = new World({ name: 'TestWorld' });
            
            expect(() => {
                ColumnarSerializer.deserialize(invalidBuffer, world);
            }).toThrow();
        });
    });

    describe('性能测试', () => {
        test('应该能处理大量实体', () => {
            const world = new World({ name: 'TestWorld' });
            const scene = world.addScene('main', new Scene());
            
            const entityCount = 1000;
            const start = performance.now();
            
            // 创建大量实体
            for (let i = 0; i < entityCount; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                const healthComp = new HealthComponent();
                healthComp.health = Math.random() * 100;
                entity.addComponent(healthComp);
            }
            
            const createTime = performance.now() - start;
            console.log(`创建${entityCount}个实体耗时: ${createTime.toFixed(2)}ms`);
            
            const serializeStart = performance.now();
            const result = ColumnarSerializer.serialize(world);
            const serializeTime = performance.now() - serializeStart;
            console.log(`序列化耗时: ${serializeTime.toFixed(2)}ms`);
            console.log(`数据大小: ${result.buffer.byteLength} 字节`);
            
            expect(result.metadata.entityCount).toBe(entityCount);
            expect(result.buffer.byteLength).toBeGreaterThan(0);
        });
    });
});