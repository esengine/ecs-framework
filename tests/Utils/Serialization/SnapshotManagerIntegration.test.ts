/**
 * SnapshotManager与Protobuf序列化集成测试
 */

import { Entity } from '../../../src/ECS/Entity';
import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { SnapshotManager } from '../../../src/Utils/Snapshot/SnapshotManager';
import { 
    ProtoSerializable, 
    ProtoFloat,
    ProtoInt32,
    ProtoString,
    ProtoBool
} from '../../../src/Utils/Serialization/ProtobufDecorators';

// 测试组件
@ProtoSerializable('TestPosition')
class TestPositionComponent extends Component {
    @ProtoFloat(1)
    public x: number = 0;
    
    @ProtoFloat(2)
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ProtoSerializable('TestVelocity')
class TestVelocityComponent extends Component {
    @ProtoFloat(1)
    public vx: number = 0;
    
    @ProtoFloat(2)
    public vy: number = 0;
    
    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

@ProtoSerializable('TestHealth')
class TestHealthComponent extends Component {
    @ProtoInt32(1)
    public maxHealth: number = 100;
    
    @ProtoInt32(2)
    public currentHealth: number = 100;
    
    @ProtoBool(3)
    public isDead: boolean = false;
    
    constructor(maxHealth: number = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
    }
}

// 传统JSON序列化组件
class TraditionalComponent extends Component {
    public customData = {
        name: 'traditional',
        values: [1, 2, 3],
        settings: { enabled: true }
    };
    
    serialize(): any {
        return {
            customData: this.customData
        };
    }
    
    deserialize(data: any): void {
        if (data.customData) {
            this.customData = data.customData;
        }
    }
}

// 简单组件（使用默认序列化）
class SimpleComponent extends Component {
    public value: number = 42;
    public text: string = 'simple';
    public flag: boolean = true;
}

// Mock protobuf.js
const mockProtobuf = {
    parse: jest.fn().mockReturnValue({
        root: {
            lookupType: jest.fn().mockImplementation((typeName: string) => {
                const mockData = {
                    'ecs.TestPosition': { x: 10, y: 20 },
                    'ecs.TestVelocity': { vx: 5, vy: 3 },
                    'ecs.TestHealth': { maxHealth: 100, currentHealth: 80, isDead: false }
                };
                
                return {
                    verify: jest.fn().mockReturnValue(null),
                    create: jest.fn().mockImplementation((data) => data),
                    encode: jest.fn().mockReturnValue({
                        finish: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
                    }),
                    decode: jest.fn().mockReturnValue(mockData[typeName] || {}),
                    toObject: jest.fn().mockImplementation((message) => message)
                };
            })
        }
    })
};

describe('SnapshotManager Protobuf集成', () => {
    let snapshotManager: SnapshotManager;
    let scene: Scene;
    
    beforeEach(() => {
        snapshotManager = new SnapshotManager();
        snapshotManager.initializeProtobuf(mockProtobuf);
        scene = new Scene();
        jest.clearAllMocks();
    });
    
    describe('混合序列化快照', () => {
        it('应该正确创建包含protobuf和JSON组件的快照', () => {
            // 创建实体
            const player = scene.createEntity('Player');
            player.addComponent(new TestPositionComponent(100, 200));
            player.addComponent(new TestVelocityComponent(5, 3));
            player.addComponent(new TestHealthComponent(120));
            player.addComponent(new TraditionalComponent());
            player.addComponent(new SimpleComponent());
            
            // 创建快照
            const snapshot = snapshotManager.createSceneSnapshot([player]);
            
            expect(snapshot).toBeDefined();
            expect(snapshot.entities).toHaveLength(1);
            expect(snapshot.entities[0].components).toHaveLength(5);
            
            // 验证快照包含所有组件
            const componentTypes = snapshot.entities[0].components.map(c => c.type);
            expect(componentTypes).toContain('TestPositionComponent');
            expect(componentTypes).toContain('TestVelocityComponent');
            expect(componentTypes).toContain('TestHealthComponent');
            expect(componentTypes).toContain('TraditionalComponent');
            expect(componentTypes).toContain('SimpleComponent');
        });
        
        it('应该根据组件类型使用相应的序列化方式', () => {
            const entity = scene.createEntity('TestEntity');
            const position = new TestPositionComponent(50, 75);
            const traditional = new TraditionalComponent();
            
            entity.addComponent(position);
            entity.addComponent(traditional);
            
            const snapshot = snapshotManager.createSceneSnapshot([entity]);
            const components = snapshot.entities[0].components;
            
            // 检查序列化数据格式
            const positionSnapshot = components.find(c => c.type === 'TestPositionComponent');
            const traditionalSnapshot = components.find(c => c.type === 'TraditionalComponent');
            
            expect(positionSnapshot).toBeDefined();
            expect(traditionalSnapshot).toBeDefined();
            
            // Protobuf组件应该有SerializedData格式
            expect(positionSnapshot!.data).toHaveProperty('type');
            expect(positionSnapshot!.data).toHaveProperty('componentType');
            expect(positionSnapshot!.data).toHaveProperty('data');
            expect(positionSnapshot!.data).toHaveProperty('size');
        });
    });
    
    describe('快照恢复', () => {
        it('应该正确恢复protobuf序列化的组件', () => {
            // 创建原始实体
            const originalEntity = scene.createEntity('Original');
            const originalPosition = new TestPositionComponent(100, 200);
            const originalHealth = new TestHealthComponent(150);
            originalHealth.currentHealth = 120;
            
            originalEntity.addComponent(originalPosition);
            originalEntity.addComponent(originalHealth);
            
            // 创建快照
            const snapshot = snapshotManager.createSceneSnapshot([originalEntity]);
            
            // 创建新实体进行恢复
            const newEntity = scene.createEntity('New');
            newEntity.addComponent(new TestPositionComponent());
            newEntity.addComponent(new TestHealthComponent());
            
            // 恢复快照
            snapshotManager.restoreFromSnapshot(snapshot, [newEntity]);
            
            // 验证数据被正确恢复（注意：由于使用mock，实际值来自mock数据）
            const restoredPosition = newEntity.getComponent(TestPositionComponent);
            const restoredHealth = newEntity.getComponent(TestHealthComponent);
            
            expect(restoredPosition).toBeDefined();
            expect(restoredHealth).toBeDefined();
            
            // 验证protobuf的decode方法被调用
            expect(mockProtobuf.parse().root.lookupType).toHaveBeenCalled();
        });
        
        it('应该正确恢复传统JSON序列化的组件', () => {
            const originalEntity = scene.createEntity('Original');
            const originalTraditional = new TraditionalComponent();
            originalTraditional.customData.name = 'modified';
            originalTraditional.customData.values = [4, 5, 6];
            
            originalEntity.addComponent(originalTraditional);
            
            const snapshot = snapshotManager.createSceneSnapshot([originalEntity]);
            
            const newEntity = scene.createEntity('New');
            const newTraditional = new TraditionalComponent();
            newEntity.addComponent(newTraditional);
            
            snapshotManager.restoreFromSnapshot(snapshot, [newEntity]);
            
            // 验证JSON数据被正确恢复
            expect(newTraditional.customData.name).toBe('modified');
            expect(newTraditional.customData.values).toEqual([4, 5, 6]);
        });
        
        it('应该处理混合序列化的实体恢复', () => {
            const originalEntity = scene.createEntity('Mixed');
            const position = new TestPositionComponent(30, 40);
            const traditional = new TraditionalComponent();
            const simple = new SimpleComponent();
            
            traditional.customData.name = 'mixed_test';
            simple.value = 99;
            simple.text = 'updated';
            
            originalEntity.addComponent(position);
            originalEntity.addComponent(traditional);
            originalEntity.addComponent(simple);
            
            const snapshot = snapshotManager.createSceneSnapshot([originalEntity]);
            
            const newEntity = scene.createEntity('NewMixed');
            newEntity.addComponent(new TestPositionComponent());
            newEntity.addComponent(new TraditionalComponent());
            newEntity.addComponent(new SimpleComponent());
            
            snapshotManager.restoreFromSnapshot(snapshot, [newEntity]);
            
            // 验证所有组件都被正确恢复
            const restoredTraditional = newEntity.getComponent(TraditionalComponent);
            const restoredSimple = newEntity.getComponent(SimpleComponent);
            
            expect(restoredTraditional!.customData.name).toBe('mixed_test');
            expect(restoredSimple!.value).toBe(99);
            expect(restoredSimple!.text).toBe('updated');
        });
    });
    
    describe('向后兼容性', () => {
        it('应该能够处理旧格式的快照数据', () => {
            // 模拟旧格式的快照数据
            const legacySnapshot = {
                entities: [{
                    id: 1,
                    name: 'LegacyEntity',
                    enabled: true,
                    active: true,
                    tag: 0,
                    updateOrder: 0,
                    components: [{
                        type: 'SimpleComponent',
                        id: 1,
                        data: { value: 123, text: 'legacy', flag: false }, // 直接的JSON数据
                        enabled: true,
                        config: { includeInSnapshot: true, compressionLevel: 0, syncPriority: 5, enableIncremental: true }
                    }],
                    children: [],
                    timestamp: Date.now()
                }],
                timestamp: Date.now(),
                version: '1.0.0',
                type: 'full' as const
            };
            
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new SimpleComponent());
            
            snapshotManager.restoreFromSnapshot(legacySnapshot, [entity]);
            
            const component = entity.getComponent(SimpleComponent);
            expect(component!.value).toBe(123);
            expect(component!.text).toBe('legacy');
            expect(component!.flag).toBe(false);
        });
    });
    
    describe('错误处理', () => {
        it('应该优雅地处理protobuf序列化失败', () => {
            // 模拟protobuf验证失败
            const mockType = mockProtobuf.parse().root.lookupType;
            mockType.mockImplementation(() => ({
                verify: jest.fn().mockReturnValue('验证失败'),
                create: jest.fn(),
                encode: jest.fn(),
                decode: jest.fn(),
                toObject: jest.fn()
            }));
            
            const entity = scene.createEntity('ErrorTest');
            entity.addComponent(new TestPositionComponent(10, 20));
            
            // 应该不抛出异常，而是回退到JSON序列化
            expect(() => {
                snapshotManager.createSceneSnapshot([entity]);
            }).not.toThrow();
        });
        
        it('应该优雅地处理protobuf反序列化失败', () => {
            const entity = scene.createEntity('Test');
            const position = new TestPositionComponent(10, 20);
            entity.addComponent(position);
            
            const snapshot = snapshotManager.createSceneSnapshot([entity]);
            
            // 模拟反序列化失败
            const mockType = mockProtobuf.parse().root.lookupType;
            mockType.mockImplementation(() => ({
                verify: jest.fn().mockReturnValue(null),
                create: jest.fn(),
                encode: jest.fn().mockReturnValue({
                    finish: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
                }),
                decode: jest.fn().mockImplementation(() => {
                    throw new Error('解码失败');
                }),
                toObject: jest.fn()
            }));
            
            const newEntity = scene.createEntity('NewTest');
            newEntity.addComponent(new TestPositionComponent());
            
            // 应该不抛出异常
            expect(() => {
                snapshotManager.restoreFromSnapshot(snapshot, [newEntity]);
            }).not.toThrow();
        });
    });
    
    describe('统计信息', () => {
        it('应该包含protobuf统计信息', () => {
            const stats = snapshotManager.getCacheStats();
            
            expect(stats).toHaveProperty('snapshotCacheSize');
            expect(stats).toHaveProperty('protobufStats');
            expect(stats.protobufStats).toHaveProperty('registeredComponents');
            expect(stats.protobufStats).toHaveProperty('protobufAvailable');
            expect(stats.protobufStats!.protobufAvailable).toBe(true);
        });
    });
});