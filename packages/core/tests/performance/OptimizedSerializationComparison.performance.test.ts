import { Component } from '../../src/ECS/Component';
import { Entity } from '../../src/ECS/Entity';
import { Scene } from '../../src/ECS/Scene';
import { SceneWorldAdapter } from '../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { SchemaRegistry } from '../../src/ECS/Core/Serialization/SchemaRegistry';
import { ColumnarSerializer } from '../../src/ECS/Core/Serialization/ColumnarSerializer';
import { Serializable, SerializableField } from '../../src/ECS/Decorators/SerializationDecorators';
import { ComponentRegistry } from '../../src/ECS/Core/ComponentStorage/ComponentRegistry';

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

describe('优化后的列式序列化性能测试', () => {
    let scene: Scene;
    let adapter: SceneWorldAdapter;
    
    beforeEach(() => {
        // 清理缓存确保每次测试的公平性
        ColumnarSerializer.clearCache();
        
        SchemaRegistry.reset();
        SchemaRegistry.init();
        
        ComponentRegistry.register(HealthComponent);
        ComponentRegistry.register(TransformComponent);
        ComponentRegistry.register(PlayerComponent);
        ComponentRegistry.register(InventoryComponent);
        
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
        
        scene = new Scene();
        adapter = new SceneWorldAdapter(scene);
    });
    
    describe('优化效果验证', () => {
        test('1000实体应在10ms内完成序列化', () => {
            const entityCount = 1000;
            createComplexScene(scene, entityCount);
            
            const startTime = performance.now();
            const buffer = adapter.encode({ mode: 'columnar', deterministic: true });
            const endTime = performance.now();
            
            const serializationTime = endTime - startTime;
            
            console.log(`优化后1000实体序列化时间: ${serializationTime.toFixed(2)}ms`);
            console.log(`数据大小: ${buffer.byteLength} 字节`);
            console.log(`平均每实体: ${(serializationTime / entityCount * 1000).toFixed(3)}μs`);
            
            // 目标：1000实体在10ms内完成
            expect(serializationTime).toBeLessThan(10);
        });
        
        test('不同规模的性能线性度测试', () => {
            const testSizes = [100, 200, 500, 1000];
            const results: Array<{ size: number; time: number; throughput: number }> = [];
            
            for (const size of testSizes) {
                scene.destroyAllEntities();
                ColumnarSerializer.clearCache(); // 清理缓存确保公平测试
                createComplexScene(scene, size);
                
                const startTime = performance.now();
                const buffer = adapter.encode({ mode: 'columnar' });
                const endTime = performance.now();
                
                const time = endTime - startTime;
                const throughput = size / time; // 实体/ms
                
                results.push({ size, time, throughput });
                
                console.log(`${size} 实体: ${time.toFixed(2)}ms, 吞吐量: ${throughput.toFixed(2)} 实体/ms`);
            }
            
            // 验证性能线性度：大规模处理的吞吐量不应显著下降
            const smallScale = results[0]; // 100实体
            const largeScale = results[results.length - 1]; // 1000实体
            
            const throughputRatio = largeScale.throughput / smallScale.throughput;
            
            console.log(`吞吐量比值 (1000实体/100实体): ${throughputRatio.toFixed(2)}`);
            
            // 吞吐量下降不应超过50%（即比值应大于0.5）
            expect(throughputRatio).toBeGreaterThan(0.5);
            
            // 1000实体处理时间应在可接受范围内
            expect(largeScale.time).toBeLessThan(15);
        });
        
        test('缓存效果验证', () => {
            const entityCount = 1000;
            createComplexScene(scene, entityCount);
            
            // 第一次序列化（冷启动）
            const coldStart = performance.now();
            const buffer1 = adapter.encode({ mode: 'columnar' });
            const coldTime = performance.now() - coldStart;
            
            // 第二次序列化（缓存预热）
            scene.destroyAllEntities();
            createComplexScene(scene, entityCount);
            
            const warmStart = performance.now();
            const buffer2 = adapter.encode({ mode: 'columnar' });
            const warmTime = performance.now() - warmStart;
            
            console.log(`冷启动时间: ${coldTime.toFixed(2)}ms`);
            console.log(`预热后时间: ${warmTime.toFixed(2)}ms`);
            console.log(`性能提升: ${((coldTime - warmTime) / coldTime * 100).toFixed(1)}%`);
            
            // 缓存应该显著提升性能
            expect(warmTime).toBeLessThan(coldTime * 0.8); // 至少20%的性能提升
            
            // 数据一致性验证
            expect(buffer1.byteLength).toBe(buffer2.byteLength);
        });
        
        test('内存使用效率测试', () => {
            const entityCount = 1000;
            createComplexScene(scene, entityCount);
            
            // 记录序列化前内存使用
            const memBefore = process.memoryUsage();
            
            // 执行多次序列化测试GC表现
            const iterations = 10;
            const times: number[] = [];
            
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                adapter.encode({ mode: 'columnar' });
                times.push(performance.now() - start);
            }
            
            // 强制垃圾回收
            if (global.gc) {
                global.gc();
            }
            
            const memAfter = process.memoryUsage();
            const memDiff = memAfter.heapUsed - memBefore.heapUsed;
            
            const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
            const timeStdDev = Math.sqrt(times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length);
            
            console.log(`平均序列化时间: ${avgTime.toFixed(2)}ms`);
            console.log(`时间标准差: ${timeStdDev.toFixed(2)}ms`);
            console.log(`内存增长: ${(memDiff / 1024 / 1024).toFixed(2)}MB`);
            
            // 性能稳定性验证
            expect(timeStdDev).toBeLessThan(avgTime * 0.3); // 标准差不超过平均值的30%
            
            // 内存泄漏检查
            expect(memDiff).toBeLessThan(50 * 1024 * 1024); // 内存增长不超过50MB
        });
        
        test('极限压力测试 - 5000实体', () => {
            const entityCount = 5000;
            createComplexScene(scene, entityCount);
            
            const startTime = performance.now();
            const buffer = adapter.encode({ mode: 'columnar' });
            const endTime = performance.now();
            
            const serializationTime = endTime - startTime;
            const throughput = entityCount / serializationTime;
            
            console.log(`5000实体序列化时间: ${serializationTime.toFixed(2)}ms`);
            console.log(`吞吐量: ${throughput.toFixed(2)} 实体/ms`);
            console.log(`数据大小: ${(buffer.byteLength / 1024).toFixed(2)}KB`);
            
            // 极限测试要求
            expect(serializationTime).toBeLessThan(100); // 5000实体在100ms内
            expect(throughput).toBeGreaterThan(50); // 至少50实体/ms的吞吐量
        });
    });
});

/**
 * 创建复杂场景用于测试
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
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                z: Math.random() * 2 - 1,
                w: Math.random() * 2 - 1
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