/**
 * Protobuf序列化器测试
 */

import { Component } from '../../../src/ECS/Component';
import { ProtobufSerializer, SerializedData } from '../../../src/Utils/Serialization/ProtobufSerializer';
import { 
    ProtoSerializable, 
    ProtoFloat,
    ProtoInt32,
    ProtoString,
    ProtoBool,
    ProtobufRegistry
} from '../../../src/Utils/Serialization/ProtobufDecorators';

// 测试组件
@ProtoSerializable('Position')
class PositionComponent extends Component {
    @ProtoFloat(1)
    public x: number = 0;
    
    @ProtoFloat(2)
    public y: number = 0;
    
    @ProtoFloat(3)
    public z: number = 0;
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

@ProtoSerializable('Health')
class HealthComponent extends Component {
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
    
    takeDamage(damage: number): void {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        this.isDead = this.currentHealth <= 0;
    }
}

@ProtoSerializable('Player')
class PlayerComponent extends Component {
    @ProtoString(1)
    public playerName: string = '';
    
    @ProtoInt32(2)
    public playerId: number = 0;
    
    @ProtoInt32(3)
    public level: number = 1;
    
    constructor(playerId: number = 0, playerName: string = '') {
        super();
        this.playerId = playerId;
        this.playerName = playerName;
    }
}

// 没有protobuf装饰器的组件
class CustomComponent extends Component {
    public customData = {
        settings: { volume: 0.8 },
        achievements: ['first_kill', 'level_up'],
        inventory: new Map([['sword', 1], ['potion', 3]])
    };
    
    // 自定义序列化方法
    serialize(): any {
        return {
            customData: {
                settings: this.customData.settings,
                achievements: this.customData.achievements,
                inventory: Array.from(this.customData.inventory.entries())
            }
        };
    }
    
    deserialize(data: any): void {
        if (data.customData) {
            this.customData.settings = data.customData.settings || this.customData.settings;
            this.customData.achievements = data.customData.achievements || this.customData.achievements;
            if (data.customData.inventory) {
                this.customData.inventory = new Map(data.customData.inventory);
            }
        }
    }
}

// Mock protobuf.js
const mockProtobuf = {
    parse: jest.fn().mockReturnValue({
        root: {
            lookupType: jest.fn().mockImplementation((typeName: string) => {
                // 模拟protobuf消息类型
                return {
                    verify: jest.fn().mockReturnValue(null), // 验证通过
                    create: jest.fn().mockImplementation((data) => data),
                    encode: jest.fn().mockReturnValue({
                        finish: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])) // 模拟编码结果
                    }),
                    decode: jest.fn().mockImplementation(() => ({
                        x: 10, y: 20, z: 30,
                        maxHealth: 100, currentHealth: 80, isDead: false,
                        playerName: 'TestPlayer', playerId: 1001, level: 5
                    })),
                    toObject: jest.fn().mockImplementation((message) => message)
                };
            })
        }
    })
};

describe('ProtobufSerializer', () => {
    let serializer: ProtobufSerializer;
    
    beforeEach(() => {
        serializer = ProtobufSerializer.getInstance();
        // 重置mock
        jest.clearAllMocks();
    });
    
    describe('初始化', () => {
        it('应该正确初始化protobuf支持', () => {
            serializer.initialize(mockProtobuf);
            
            expect(mockProtobuf.parse).toHaveBeenCalled();
            expect(serializer.canSerialize(new PositionComponent())).toBe(true);
        });
        
        it('没有初始化时应该无法序列化protobuf组件', () => {
            const newSerializer = new (ProtobufSerializer as any)();
            expect(newSerializer.canSerialize(new PositionComponent())).toBe(false);
        });
    });
    
    describe('序列化', () => {
        beforeEach(() => {
            serializer.initialize(mockProtobuf);
        });
        
        it('应该正确序列化protobuf组件', () => {
            const position = new PositionComponent(10, 20, 30);
            const result = serializer.serialize(position);
            
            expect(result.type).toBe('protobuf');
            expect(result.componentType).toBe('PositionComponent');
            expect(result.data).toBeInstanceOf(Uint8Array);
            expect(result.size).toBeGreaterThan(0);
        });
        
        it('应该正确序列化复杂protobuf组件', () => {
            const health = new HealthComponent(150);
            health.takeDamage(50);
            
            const result = serializer.serialize(health);
            
            expect(result.type).toBe('protobuf');
            expect(result.componentType).toBe('HealthComponent');
            expect(result.data).toBeInstanceOf(Uint8Array);
        });
        
        it('应该回退到JSON序列化非protobuf组件', () => {
            const custom = new CustomComponent();
            const result = serializer.serialize(custom);
            
            expect(result.type).toBe('json');
            expect(result.componentType).toBe('CustomComponent');
            expect(result.data).toEqual(custom.serialize());
        });
        
        it('protobuf序列化失败时应该回退到JSON', () => {
            // 模拟protobuf验证失败
            const mockType = mockProtobuf.parse().root.lookupType('ecs.Position');
            mockType.verify.mockReturnValue('验证失败');
            
            const position = new PositionComponent(10, 20, 30);
            const result = serializer.serialize(position);
            
            expect(result.type).toBe('json');
        });
    });
    
    describe('反序列化', () => {
        beforeEach(() => {
            serializer.initialize(mockProtobuf);
        });
        
        it('应该正确反序列化protobuf数据', () => {
            const position = new PositionComponent();
            const serializedData: SerializedData = {
                type: 'protobuf',
                componentType: 'PositionComponent',
                data: new Uint8Array([1, 2, 3, 4]),
                size: 4
            };
            
            serializer.deserialize(position, serializedData);
            
            // 验证decode和toObject被调用
            const mockType = mockProtobuf.parse().root.lookupType('ecs.Position');
            expect(mockType.decode).toHaveBeenCalled();
            expect(mockType.toObject).toHaveBeenCalled();
        });
        
        it('应该正确反序列化JSON数据', () => {
            const custom = new CustomComponent();
            const originalData = custom.serialize();
            
            const serializedData: SerializedData = {
                type: 'json',
                componentType: 'CustomComponent',
                data: originalData,
                size: 100
            };
            
            // 修改组件数据
            custom.customData.settings.volume = 0.5;
            
            // 反序列化
            serializer.deserialize(custom, serializedData);
            
            // 验证数据被恢复
            expect(custom.customData.settings.volume).toBe(0.8);
        });
        
        it('应该处理反序列化错误', () => {
            const position = new PositionComponent();
            const invalidData: SerializedData = {
                type: 'protobuf',
                componentType: 'PositionComponent',
                data: new Uint8Array([255, 255, 255, 255]), // 无效数据
                size: 4
            };
            
            // 模拟解码失败
            const mockType = mockProtobuf.parse().root.lookupType('ecs.Position');
            mockType.decode.mockImplementation(() => {
                throw new Error('解码失败');
            });
            
            // 应该不抛出异常
            expect(() => {
                serializer.deserialize(position, invalidData);
            }).not.toThrow();
        });
    });
    
    describe('统计信息', () => {
        it('应该返回正确的统计信息', () => {
            serializer.initialize(mockProtobuf);
            const stats = serializer.getStats();
            
            expect(stats.protobufAvailable).toBe(true);
            expect(stats.registeredComponents).toBeGreaterThan(0);
        });
        
        it('未初始化时应该返回正确的状态', () => {
            const newSerializer = new (ProtobufSerializer as any)();
            const stats = newSerializer.getStats();
            
            expect(stats.protobufAvailable).toBe(false);
        });
    });
    
    describe('边界情况', () => {
        beforeEach(() => {
            serializer.initialize(mockProtobuf);
        });
        
        it('应该处理空值和undefined', () => {
            const position = new PositionComponent();
            // 设置一些undefined值
            (position as any).undefinedProp = undefined;
            (position as any).nullProp = null;
            
            const result = serializer.serialize(position);
            expect(result).toBeDefined();
        });
        
        it('应该处理循环引用', () => {
            const custom = new CustomComponent();
            // 创建循环引用
            (custom as any).circular = custom;
            
            const result = serializer.serialize(custom);
            expect(result.type).toBe('json');
        });
        
        it('应该处理非常大的数值', () => {
            const position = new PositionComponent(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0);
            
            const result = serializer.serialize(position);
            expect(result).toBeDefined();
        });
    });
});