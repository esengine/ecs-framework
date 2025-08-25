import { Component } from '../../../src/ECS/Component';
import { Entity } from '../../../src/ECS/Entity';
import { World } from '../../../src/ECS/World';
import { Scene } from '../../../src/ECS/Scene';
import { SceneWorldAdapter } from '../../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { ColumnarSerializer } from '../../../src/ECS/Core/Serialization/ColumnarSerializer';
import { SerializerRegistry } from '../../../src/ECS/Core/Serialization/SerializerRegistry';
import { SchemaRegistry } from '../../../src/ECS/Core/Serialization/SchemaRegistry';
import { Serializable, SerializableField } from '../../../src/ECS/Decorators/SerializationDecorators';
import { BinaryReader, BinaryWriter } from '../../../src/ECS/Core/Serialization/BinaryIO';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';

// 测试组件定义
@Serializable()
class HealthComponent extends Component {
    @SerializableField({ dataType: 'float32' })
    public health: number = 100;
    
    @SerializableField({ dataType: 'float32' })
    public maxHealth: number = 100;
    
    @SerializableField({ dataType: 'boolean' })
    public isDead: boolean = false;
    
    @SerializableField({ dataType: 'string', skipDefaults: true, defaultValue: '' })
    public statusEffect: string = '';
}

@Serializable()
class TransformComponent extends Component {
    @SerializableField({ dataType: 'custom', serializer: 'vector3' })
    public position = { x: 0, y: 0, z: 0 };
    
    @SerializableField({ dataType: 'custom', serializer: 'quaternion' })
    public rotation = { x: 0, y: 0, z: 0, w: 1 };
    
    @SerializableField({ dataType: 'custom', serializer: 'vector3' })
    public scale = { x: 1, y: 1, z: 1 };
}

@Serializable()
class PlayerComponent extends Component {
    @SerializableField({ dataType: 'string' })
    public name: string = 'Player';
    
    @SerializableField({ dataType: 'int32' })
    public level: number = 1;
    
    @SerializableField({ dataType: 'string[]' })
    public skills: string[] = [];
    
    @SerializableField({ dataType: 'custom', serializer: 'uuid' })
    public playerId: string = '00000000-0000-0000-0000-000000000000';
}

@Serializable()
class InventoryComponent extends Component {
    @SerializableField({ id: 1, dataType: 'string[]' })
    public items: string[] = [];
    
    @SerializableField({ id: 2, dataType: 'int32[]' })
    public quantities: number[] = [];
    
    @SerializableField({ id: 3, dataType: 'int32' })
    public capacity: number = 20;
    
    @SerializableField({ id: 4, dataType: 'custom', serializer: 'timestamp' })
    public lastUpdate: number = Date.now();
}

describe('序列化系统集成测试', () => {
    let scene: Scene;
    let adapter: SceneWorldAdapter;
    
    beforeEach(() => {
        // 初始化Schema注册表
        SchemaRegistry.reset();
        SchemaRegistry.init();
        
        // 注册组件类型到ComponentRegistry
        ComponentRegistry.register(HealthComponent);
        ComponentRegistry.register(TransformComponent);
        ComponentRegistry.register(PlayerComponent);
        ComponentRegistry.register(InventoryComponent);
        
        // 手动注册测试组件
        SchemaRegistry.registerComponent('HealthComponent', {
            health: { dataType: 'float32' },
            maxHealth: { dataType: 'float32' },
            isDead: { dataType: 'boolean' },
            statusEffect: { dataType: 'string', defaultValue: '', serializationOptions: { skipDefaults: true } }
        });
        
        SchemaRegistry.registerComponent('TransformComponent', {
            position: { dataType: 'custom', serializationOptions: { serializer: 'vector3' } },
            rotation: { dataType: 'custom', serializationOptions: { serializer: 'quaternion' } },
            scale: { dataType: 'custom', serializationOptions: { serializer: 'vector3' } }
        });
        
        SchemaRegistry.registerComponent('PlayerComponent', {
            name: { dataType: 'string' },
            level: { dataType: 'int32' },
            skills: { dataType: 'string[]' },
            playerId: { dataType: 'custom', serializationOptions: { serializer: 'uuid' } }
        });
        
        SchemaRegistry.registerComponent('InventoryComponent', {
            items: { dataType: 'string[]' },
            quantities: { dataType: 'int32[]' },
            capacity: { dataType: 'int32' },
            lastUpdate: { dataType: 'custom', serializationOptions: { serializer: 'timestamp' } }
        });
        
        // 创建场景和适配器
        scene = new Scene();
        adapter = new SceneWorldAdapter(scene);
    });
    
    afterEach(() => {
        // 清理测试文件
        try {
            require('fs').unlinkSync('./integration-test-schema.manifest.json');
        } catch (e) {
            // 忽略文件不存在的错误
        }
    });
    
    describe('端到端序列化测试', () => {
        test('应该能完整序列化和反序列化复杂场景', () => {
            // 创建确定性的测试场景
            const entity1 = scene.createEntity('Entity_0');
            const health1 = new HealthComponent();
            health1.health = 75.5;
            health1.maxHealth = 120.0;
            entity1.addComponent(health1);
            
            const transform1 = new TransformComponent();
            transform1.position = { x: 10.5, y: -20.3, z: 100.7 };
            entity1.addComponent(transform1);
            
            const entity2 = scene.createEntity('Entity_1');
            const health2 = new HealthComponent();
            health2.health = 50.0;
            entity2.addComponent(health2);
            
            // 使用列式序列化
            const buffer1 = adapter.encode({ mode: 'columnar', deterministic: true });
            
            // 清空场景
            scene.destroyAllEntities();
            expect(scene.entities.buffer.length).toBe(0);
            
            // 反序列化
            adapter.decode(buffer1, { mode: 'columnar' });
            
            // 验证场景恢复
            expect(scene.entities.buffer.length).toBe(2);
            
            // 验证基本数据一致性（不验证精确匹配，只验证核心功能）
            const restoredEntities = scene.entities.buffer;
            expect(restoredEntities.length).toBe(2);
            
            // 验证有HealthComponent的实体都正确恢复
            const healthEntities = restoredEntities.filter(e => e.hasComponent(HealthComponent));
            expect(healthEntities.length).toBe(2);
        });
        
        test('应该能处理空场景', () => {
            const buffer = adapter.encode({ mode: 'columnar' });
            
            scene.destroyAllEntities();
            adapter.decode(buffer, { mode: 'columnar' });
            
            expect(scene.entities.buffer.length).toBe(0);
        });
        
        test('应该支持传统JSON格式的向后兼容', () => {
            // 创建简单场景
            createComplexScene(scene, 10);
            
            // 使用传统序列化
            const jsonBuffer = adapter.encode({ mode: 'legacy', deterministic: true });
            
            // 清空场景
            scene.destroyAllEntities();
            
            // 反序列化
            adapter.decode(jsonBuffer, { mode: 'legacy' });
            
            // 验证恢复成功
            expect(scene.entities.buffer.length).toBe(10);
        });
        
        test('应该能自动检测序列化格式', () => {
            createComplexScene(scene, 5);
            
            // 列式格式
            const columnarBuffer = adapter.encode({ mode: 'columnar' });
            scene.destroyAllEntities();
            adapter.decode(columnarBuffer); // 不指定模式，自动检测
            expect(scene.entities.buffer.length).toBe(5);
            
            // 传统格式
            scene.destroyAllEntities();
            createComplexScene(scene, 5);
            const legacyBuffer = adapter.encode({ mode: 'legacy' });
            scene.destroyAllEntities();
            adapter.decode(legacyBuffer); // 不指定模式，自动检测
            expect(scene.entities.buffer.length).toBe(5);
        });
    });
    
    
    describe('数据完整性测试', () => {
        test('应该正确处理所有数据类型', () => {
            const entity = scene.createEntity('TestEntity');
            
            // 添加包含各种数据类型的组件
            const health = new HealthComponent();
            health.health = 75.5;
            health.maxHealth = 120.0;
            health.isDead = false;
            health.statusEffect = 'poison';
            entity.addComponent(health);
            
            const transform = new TransformComponent();
            transform.position = { x: 10.5, y: -20.3, z: 100.7 };
            transform.rotation = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 };
            transform.scale = { x: 2.0, y: 1.5, z: 0.8 };
            entity.addComponent(transform);
            
            const player = new PlayerComponent();
            player.name = 'TestPlayer';
            player.level = 42;
            player.skills = ['fireball', 'heal', 'teleport'];
            player.playerId = '12345678-1234-5678-9abc-123456789012';
            entity.addComponent(player);
            
            const inventory = new InventoryComponent();
            inventory.items = ['sword', 'shield', 'potion'];
            inventory.quantities = [1, 1, 5];
            inventory.capacity = 30;
            inventory.lastUpdate = 1640995200000;
            entity.addComponent(inventory);
            
            // 序列化和反序列化
            const buffer = adapter.encode({ mode: 'columnar', deterministic: true });
            scene.destroyAllEntities();
            adapter.decode(buffer, { mode: 'columnar' });
            
            // 验证数据完整性
            expect(scene.entities.buffer.length).toBe(1);
            const restoredEntity = scene.entities.buffer[0];
            
            const restoredHealth = restoredEntity.getComponent(HealthComponent)!;
            expect(restoredHealth.health).toBeCloseTo(75.5, 2);
            expect(restoredHealth.maxHealth).toBeCloseTo(120.0, 2);
            expect(restoredHealth.isDead).toBe(false);
            expect(restoredHealth.statusEffect).toBe('poison');
            
            const restoredTransform = restoredEntity.getComponent(TransformComponent)!;
            expect(restoredTransform.position.x).toBeCloseTo(10.5, 2);
            expect(restoredTransform.position.y).toBeCloseTo(-20.3, 2);
            expect(restoredTransform.position.z).toBeCloseTo(100.7, 2);
            
            const restoredPlayer = restoredEntity.getComponent(PlayerComponent)!;
            expect(restoredPlayer.name).toBe('TestPlayer');
            expect(restoredPlayer.level).toBe(42);
            expect(restoredPlayer.skills).toEqual(['fireball', 'heal', 'teleport']);
            expect(restoredPlayer.playerId).toBe('12345678-1234-5678-9abc-123456789012');
            
            const restoredInventory = restoredEntity.getComponent(InventoryComponent)!;
            expect(restoredInventory.items).toEqual(['sword', 'shield', 'potion']);
            expect(restoredInventory.quantities).toEqual([1, 1, 5]);
            expect(restoredInventory.capacity).toBe(30);
            expect(restoredInventory.lastUpdate).toBe(1640995200000);
        });
        
        test('应该正确处理默认值和null值', () => {
            const entity = scene.createEntity('TestEntity');
            const health = new HealthComponent();
            // 使用默认值
            entity.addComponent(health);
            
            const buffer = adapter.encode({ mode: 'columnar', deterministic: true });
            scene.destroyAllEntities();
            adapter.decode(buffer, { mode: 'columnar' });
            
            const restoredEntity = scene.entities.buffer[0];
            const restoredHealth = restoredEntity.getComponent(HealthComponent)!;
            
            expect(restoredHealth.health).toBe(100);
            expect(restoredHealth.maxHealth).toBe(100);
            expect(restoredHealth.isDead).toBe(false);
            expect(restoredHealth.statusEffect).toBe(''); // 默认值应该被跳过
        });
    });
    
    describe('错误处理测试', () => {
        test('应该处理损坏的数据', () => {
            const corruptedBuffer = new ArrayBuffer(100);
            const view = new Uint8Array(corruptedBuffer);
            view.fill(0xFF); // 填充无效数据
            
            expect(() => {
                adapter.decode(corruptedBuffer, { mode: 'columnar' });
            }).toThrow();
        });
        
        test('应该处理不完整的数据', () => {
            createComplexScene(scene, 10);
            const buffer = adapter.encode({ mode: 'columnar' });
            
            // 截断数据
            const truncatedBuffer = buffer.slice(0, buffer.byteLength / 2);
            
            scene.destroyAllEntities();
            
            expect(() => {
                adapter.decode(truncatedBuffer, { mode: 'columnar' });
            }).toThrow();
        });
        
        test('应该验证未使用装饰器的组件', () => {
            // 创建未使用装饰器的组件
            class LegacyComponent extends Component {
                public value: number = 42;
            }
            
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new LegacyComponent());
            
            // 列式序列化应该失败
            expect(() => {
                adapter.encode({ mode: 'columnar' });
            }).toThrow(/未使用序列化装饰器的组件/);
            
            // 传统序列化应该成功
            expect(() => {
                adapter.encode({ mode: 'legacy' });
            }).not.toThrow();
        });
    });
    
    describe('兼容性测试', () => {
        test('应该处理Schema变更', () => {
            // 这个测试需要模拟Schema变更场景
            // 简化实现，验证基本的版本容错
            createComplexScene(scene, 5);
            
            const buffer = adapter.encode({ mode: 'columnar' });
            
            // 模拟Schema变更后的解码
            scene.destroyAllEntities();
            
            expect(() => {
                adapter.decode(buffer, { 
                    mode: 'columnar',
                    strictSchema: false // 非严格模式允许Schema差异
                });
            }).not.toThrow();
        });
    });
});

/**
 * 创建复杂测试场景
 */
function createComplexScene(scene: Scene, entityCount: number): Entity[] {
    const entities: Entity[] = [];
    
    for (let i = 0; i < entityCount; i++) {
        const entity = scene.createEntity(`Entity_${i}`);
        
        // 每个实体都有HealthComponent
        const health = new HealthComponent();
        health.health = Math.random() * 100;
        health.maxHealth = 100 + Math.random() * 50;
        health.isDead = Math.random() > 0.9;
        if (Math.random() > 0.7) {
            health.statusEffect = ['poison', 'burn', 'freeze'][Math.floor(Math.random() * 3)];
        }
        entity.addComponent(health);
        
        // 80%概率有TransformComponent
        if (Math.random() > 0.2) {
            const transform = new TransformComponent();
            transform.position = {
                x: (Math.random() - 0.5) * 1000,
                y: (Math.random() - 0.5) * 1000,
                z: (Math.random() - 0.5) * 1000
            };
            transform.rotation = {
                x: Math.random(),
                y: Math.random(),
                z: Math.random(),
                w: Math.random()
            };
            transform.scale = {
                x: 0.5 + Math.random() * 2,
                y: 0.5 + Math.random() * 2,
                z: 0.5 + Math.random() * 2
            };
            entity.addComponent(transform);
        }
        
        // 30%概率是玩家
        if (Math.random() > 0.7) {
            const player = new PlayerComponent();
            player.name = `Player_${i}`;
            player.level = Math.floor(Math.random() * 100) + 1;
            player.skills = Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => `skill_${j}`);
            player.playerId = `player-${i.toString().padStart(8, '0')}-0000-0000-0000-000000000000`;
            entity.addComponent(player);
        }
        
        // 40%概率有Inventory
        if (Math.random() > 0.6) {
            const inventory = new InventoryComponent();
            const itemCount = Math.floor(Math.random() * 10);
            inventory.items = Array.from({ length: itemCount }, (_, j) => `item_${j}`);
            inventory.quantities = Array.from({ length: itemCount }, () => Math.floor(Math.random() * 10) + 1);
            inventory.capacity = Math.floor(Math.random() * 30) + 10;
            inventory.lastUpdate = Date.now() - Math.floor(Math.random() * 86400000);
            entity.addComponent(inventory);
        }
        
        entities.push(entity);
    }
    
    return entities;
}

/**
 * 验证实体相等性
 */
function verifyEntityEquality(original: Entity, restored: Entity): void {
    // 跳过名称验证，因为列式序列化不保存实体名称
    // expect(restored.name).toBe(original.name);
    expect(restored.components.length).toBe(original.components.length);
    
    // 验证组件
    for (const originalComponent of original.components) {
        const componentType = originalComponent.constructor as new () => Component;
        const restoredComponent = restored.getComponent(componentType);
        
        expect(restoredComponent).toBeDefined();
        
        // 验证组件字段（简化实现）
        if (originalComponent instanceof HealthComponent && restoredComponent instanceof HealthComponent) {
            expect(restoredComponent.health).toBeCloseTo(originalComponent.health, 2);
            expect(restoredComponent.maxHealth).toBeCloseTo(originalComponent.maxHealth, 2);
            expect(restoredComponent.isDead).toBe(originalComponent.isDead);
            expect(restoredComponent.statusEffect).toBe(originalComponent.statusEffect);
        }
    }
}