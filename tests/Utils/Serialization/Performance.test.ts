/**
 * Protobuf序列化性能测试
 */

import { Component } from '../../../src/ECS/Component';
import { Entity } from '../../../src/ECS/Entity';
import { Scene } from '../../../src/ECS/Scene';
import { SnapshotManager } from '../../../src/Utils/Snapshot/SnapshotManager';
import { ProtobufSerializer } from '../../../src/Utils/Serialization/ProtobufSerializer';
import { 
    ProtoSerializable, 
    ProtoFloat,
    ProtoInt32,
    ProtoString,
    ProtoBool
} from '../../../src/Utils/Serialization/ProtobufDecorators';

// 性能测试组件
@ProtoSerializable('PerfPosition')
class PerfPositionComponent extends Component {
    @ProtoFloat(1) public x: number = 0;
    @ProtoFloat(2) public y: number = 0;
    @ProtoFloat(3) public z: number = 0;
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

@ProtoSerializable('PerfVelocity')
class PerfVelocityComponent extends Component {
    @ProtoFloat(1) public vx: number = 0;
    @ProtoFloat(2) public vy: number = 0;
    @ProtoFloat(3) public vz: number = 0;
    
    constructor(vx: number = 0, vy: number = 0, vz: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
    }
}

@ProtoSerializable('PerfHealth')
class PerfHealthComponent extends Component {
    @ProtoInt32(1) public maxHealth: number = 100;
    @ProtoInt32(2) public currentHealth: number = 100;
    @ProtoBool(3) public isDead: boolean = false;
    @ProtoFloat(4) public regenerationRate: number = 0.5;
    
    constructor(maxHealth: number = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
}

@ProtoSerializable('PerfPlayer')
class PerfPlayerComponent extends Component {
    @ProtoString(1) public name: string = '';
    @ProtoInt32(2) public level: number = 1;
    @ProtoInt32(3) public experience: number = 0;
    @ProtoInt32(4) public score: number = 0;
    @ProtoBool(5) public isOnline: boolean = true;
    
    constructor(name: string = 'Player', level: number = 1) {
        super();
        this.name = name;
        this.level = level;
    }
}

// 传统JSON序列化组件（用于对比）
class JsonPositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class JsonPlayerComponent extends Component {
    public name: string = '';
    public level: number = 1;
    public experience: number = 0;
    public score: number = 0;
    public isOnline: boolean = true;
    
    constructor(name: string = 'Player', level: number = 1) {
        super();
        this.name = name;
        this.level = level;
    }
}

// Mock protobuf.js for performance testing
const createMockProtobuf = () => {
    const mockEncodedData = new Uint8Array(32); // 模拟32字节的编码数据
    mockEncodedData.fill(1);
    
    return {
        parse: jest.fn().mockReturnValue({
            root: {
                lookupType: jest.fn().mockImplementation((typeName: string) => ({
                    verify: jest.fn().mockReturnValue(null),
                    create: jest.fn().mockImplementation((data) => data),
                    encode: jest.fn().mockReturnValue({
                        finish: jest.fn().mockReturnValue(mockEncodedData)
                    }),
                    decode: jest.fn().mockReturnValue({
                        x: 10, y: 20, z: 30,
                        vx: 1, vy: 2, vz: 3,
                        maxHealth: 100, currentHealth: 80, isDead: false, regenerationRate: 0.5,
                        name: 'TestPlayer', level: 5, experience: 1000, score: 5000, isOnline: true
                    }),
                    toObject: jest.fn().mockImplementation((message) => message)
                }))
            }
        })
    };
};

describe('Protobuf序列化性能测试', () => {
    let protobufSerializer: ProtobufSerializer;
    let snapshotManager: SnapshotManager;
    let scene: Scene;
    
    beforeEach(() => {
        protobufSerializer = ProtobufSerializer.getInstance();
        protobufSerializer.initialize(createMockProtobuf());
        
        snapshotManager = new SnapshotManager();
        snapshotManager.initializeProtobuf(createMockProtobuf());
        
        scene = new Scene();
        jest.clearAllMocks();
    });
    
    describe('单组件序列化性能', () => {
        const iterations = 1000;
        
        it('应该比较protobuf和JSON序列化速度', () => {
            const protobufComponents: PerfPositionComponent[] = [];
            const jsonComponents: JsonPositionComponent[] = [];
            
            // 准备测试数据
            for (let i = 0; i < iterations; i++) {
                protobufComponents.push(new PerfPositionComponent(
                    Math.random() * 1000, 
                    Math.random() * 1000, 
                    Math.random() * 100
                ));
                
                jsonComponents.push(new JsonPositionComponent(
                    Math.random() * 1000, 
                    Math.random() * 1000, 
                    Math.random() * 100
                ));
            }
            
            // 测试Protobuf序列化
            const protobufStartTime = performance.now();
            let protobufTotalSize = 0;
            
            for (const component of protobufComponents) {
                const result = protobufSerializer.serialize(component);
                protobufTotalSize += result.size;
            }
            
            const protobufEndTime = performance.now();
            const protobufTime = protobufEndTime - protobufStartTime;
            
            // 测试JSON序列化
            const jsonStartTime = performance.now();
            let jsonTotalSize = 0;
            
            for (const component of jsonComponents) {
                const jsonString = JSON.stringify({
                    x: component.x,
                    y: component.y,
                    z: component.z
                });
                jsonTotalSize += new Blob([jsonString]).size;
            }
            
            const jsonEndTime = performance.now();
            const jsonTime = jsonEndTime - jsonStartTime;
            
            // 性能断言
            console.log(`\\n=== 单组件序列化性能对比 (${iterations} 次迭代) ===`);
            console.log(`Protobuf时间: ${protobufTime.toFixed(2)}ms`);
            console.log(`JSON时间: ${jsonTime.toFixed(2)}ms`);
            console.log(`Protobuf总大小: ${protobufTotalSize} bytes`);
            console.log(`JSON总大小: ${jsonTotalSize} bytes`);
            
            if (jsonTime > 0) {
                const speedImprovement = ((jsonTime - protobufTime) / jsonTime * 100);
                console.log(`速度提升: ${speedImprovement.toFixed(1)}%`);
            }
            
            if (jsonTotalSize > 0) {
                const sizeReduction = ((jsonTotalSize - protobufTotalSize) / jsonTotalSize * 100);
                console.log(`大小减少: ${sizeReduction.toFixed(1)}%`);
            }
            
            // 基本性能验证
            expect(protobufTime).toBeLessThan(1000); // 不应该超过1秒
            expect(jsonTime).toBeLessThan(1000);
            expect(protobufTotalSize).toBeGreaterThan(0);
            expect(jsonTotalSize).toBeGreaterThan(0);
        });
        
        it('应该测试复杂组件的序列化性能', () => {
            const protobufPlayers: PerfPlayerComponent[] = [];
            const jsonPlayers: JsonPlayerComponent[] = [];
            
            // 创建测试数据
            for (let i = 0; i < iterations; i++) {
                protobufPlayers.push(new PerfPlayerComponent(
                    `Player${i}`,
                    Math.floor(Math.random() * 100) + 1
                ));
                
                jsonPlayers.push(new JsonPlayerComponent(
                    `Player${i}`,
                    Math.floor(Math.random() * 100) + 1
                ));
            }
            
            // Protobuf序列化测试
            const protobufStart = performance.now();
            for (const player of protobufPlayers) {
                protobufSerializer.serialize(player);
            }
            const protobufTime = performance.now() - protobufStart;
            
            // JSON序列化测试
            const jsonStart = performance.now();
            for (const player of jsonPlayers) {
                JSON.stringify({
                    name: player.name,
                    level: player.level,
                    experience: player.experience,
                    score: player.score,
                    isOnline: player.isOnline
                });
            }
            const jsonTime = performance.now() - jsonStart;
            
            console.log(`\\n=== 复杂组件序列化性能 (${iterations} 次迭代) ===`);
            console.log(`Protobuf时间: ${protobufTime.toFixed(2)}ms`);
            console.log(`JSON时间: ${jsonTime.toFixed(2)}ms`);
            
            expect(protobufTime).toBeLessThan(1000);
            expect(jsonTime).toBeLessThan(1000);
        });
    });
    
    describe('批量实体序列化性能', () => {
        it('应该测试大量实体的快照创建性能', () => {
            const entityCount = 100;
            const entities: Entity[] = [];
            
            // 创建测试实体
            for (let i = 0; i < entityCount; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                entity.addComponent(new PerfPositionComponent(
                    Math.random() * 1000,
                    Math.random() * 1000,
                    Math.random() * 100
                ));
                entity.addComponent(new PerfVelocityComponent(
                    Math.random() * 10 - 5,
                    Math.random() * 10 - 5,
                    Math.random() * 2 - 1
                ));
                entity.addComponent(new PerfHealthComponent(100 + Math.floor(Math.random() * 50)));
                entity.addComponent(new PerfPlayerComponent(`Player${i}`, Math.floor(Math.random() * 50) + 1));
                
                entities.push(entity);
            }
            
            // 测试快照创建性能
            const snapshotStart = performance.now();
            const snapshot = snapshotManager.createSceneSnapshot(entities);
            const snapshotTime = performance.now() - snapshotStart;
            
            console.log(`\\n=== 批量实体序列化性能 ===`);
            console.log(`实体数量: ${entityCount}`);
            console.log(`每个实体组件数: 4`);
            console.log(`总组件数: ${entityCount * 4}`);
            console.log(`快照创建时间: ${snapshotTime.toFixed(2)}ms`);
            console.log(`平均每组件时间: ${(snapshotTime / (entityCount * 4)).toFixed(3)}ms`);
            
            expect(snapshot.entities).toHaveLength(entityCount);
            expect(snapshotTime).toBeLessThan(5000); // 不应该超过5秒
            
            // 计算快照大小
            let totalSnapshotSize = 0;
            for (const entitySnapshot of snapshot.entities) {
                for (const componentSnapshot of entitySnapshot.components) {
                    if (componentSnapshot.data && typeof componentSnapshot.data === 'object' && 'size' in componentSnapshot.data) {
                        totalSnapshotSize += (componentSnapshot.data as any).size;
                    }
                }
            }
            
            console.log(`快照总大小: ${totalSnapshotSize} bytes`);
            console.log(`平均每实体大小: ${(totalSnapshotSize / entityCount).toFixed(1)} bytes`);
            
            expect(totalSnapshotSize).toBeGreaterThan(0);
        });
    });
    
    describe('反序列化性能', () => {
        it('应该测试快照恢复性能', () => {
            const entityCount = 50;
            const originalEntities: Entity[] = [];
            
            // 创建原始实体
            for (let i = 0; i < entityCount; i++) {
                const entity = scene.createEntity(`Original${i}`);
                entity.addComponent(new PerfPositionComponent(i * 10, i * 20, i));
                entity.addComponent(new PerfHealthComponent(100 + i));
                originalEntities.push(entity);
            }
            
            // 创建快照
            const snapshotStart = performance.now();
            const snapshot = snapshotManager.createSceneSnapshot(originalEntities);
            const snapshotTime = performance.now() - snapshotStart;
            
            // 创建目标实体
            const targetEntities: Entity[] = [];
            for (let i = 0; i < entityCount; i++) {
                const entity = scene.createEntity(`Target${i}`);
                entity.addComponent(new PerfPositionComponent());
                entity.addComponent(new PerfHealthComponent());
                targetEntities.push(entity);
            }
            
            // 测试恢复性能
            const restoreStart = performance.now();
            snapshotManager.restoreFromSnapshot(snapshot, targetEntities);
            const restoreTime = performance.now() - restoreStart;
            
            console.log(`\\n=== 反序列化性能测试 ===`);
            console.log(`实体数量: ${entityCount}`);
            console.log(`序列化时间: ${snapshotTime.toFixed(2)}ms`);
            console.log(`反序列化时间: ${restoreTime.toFixed(2)}ms`);
            console.log(`总往返时间: ${(snapshotTime + restoreTime).toFixed(2)}ms`);
            console.log(`平均每实体往返时间: ${((snapshotTime + restoreTime) / entityCount).toFixed(3)}ms`);
            
            expect(restoreTime).toBeLessThan(2000); // 不应该超过2秒
            expect(snapshotTime + restoreTime).toBeLessThan(3000); // 总时间不超过3秒
        });
    });
    
    describe('内存使用', () => {
        it('应该监控序列化过程中的内存使用', () => {
            const entityCount = 200;
            const entities: Entity[] = [];
            
            // 创建大量实体
            for (let i = 0; i < entityCount; i++) {
                const entity = scene.createEntity(`MemoryTest${i}`);
                entity.addComponent(new PerfPositionComponent(
                    Math.random() * 1000,
                    Math.random() * 1000,
                    Math.random() * 100
                ));
                entity.addComponent(new PerfVelocityComponent(
                    Math.random() * 10,
                    Math.random() * 10,
                    Math.random() * 2
                ));
                entity.addComponent(new PerfHealthComponent(Math.floor(Math.random() * 200) + 50));
                entities.push(entity);
            }
            
            // 记录初始内存（如果可用）
            const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
            
            // 执行序列化
            const snapshot = snapshotManager.createSceneSnapshot(entities);
            
            // 记录序列化后内存
            const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
            const memoryIncrease = afterMemory - initialMemory;
            
            if (initialMemory > 0) {
                console.log(`\\n=== 内存使用测试 ===`);
                console.log(`实体数量: ${entityCount}`);
                console.log(`初始内存: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
                console.log(`序列化后内存: ${(afterMemory / 1024 / 1024).toFixed(2)} MB`);
                console.log(`内存增加: ${(memoryIncrease / 1024).toFixed(2)} KB`);
                console.log(`平均每实体内存: ${(memoryIncrease / entityCount).toFixed(1)} bytes`);
            }
            
            expect(snapshot.entities).toHaveLength(entityCount);
            
            // 清理
            entities.length = 0;
        });
    });
    
    describe('极端情况性能', () => {
        it('应该处理大量小组件的性能', () => {
            const componentCount = 5000;
            const components: PerfPositionComponent[] = [];
            
            // 创建大量小组件
            for (let i = 0; i < componentCount; i++) {
                components.push(new PerfPositionComponent(i, i * 2, i * 3));
            }
            
            const start = performance.now();
            for (const component of components) {
                protobufSerializer.serialize(component);
            }
            const time = performance.now() - start;
            
            console.log(`\\n=== 大量小组件性能测试 ===`);
            console.log(`组件数量: ${componentCount}`);
            console.log(`总时间: ${time.toFixed(2)}ms`);
            console.log(`平均每组件: ${(time / componentCount).toFixed(4)}ms`);
            console.log(`每秒处理: ${Math.floor(componentCount / (time / 1000))} 个组件`);
            
            expect(time).toBeLessThan(10000); // 不超过10秒
            expect(time / componentCount).toBeLessThan(2); // 每个组件不超过2ms
        });
    });
});