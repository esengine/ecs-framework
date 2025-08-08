/**
 * Protobuf序列化器边界情况测试
 */

import { Component, BigIntFactory } from '@esengine/ecs-framework';
import { ProtobufSerializer } from '../../src/Serialization/ProtobufSerializer';
import { 
    ProtoSerializable, 
    ProtoFloat,
    ProtoInt32,
    ProtoString,
    ProtoBool,
    ProtoBytes,
    ProtoTimestamp,
    ProtoDouble,
    ProtoInt64,
    ProtoStruct
} from '../../src/Serialization/ProtobufDecorators';

// 边界测试组件
@ProtoSerializable('EdgeCaseComponent')
class EdgeCaseComponent extends Component {
    @ProtoFloat(1)
    public floatValue: number = 0;
    
    @ProtoDouble(2)
    public doubleValue: number = 0;
    
    @ProtoInt32(3)
    public intValue: number = 0;
    
    @ProtoInt64(4)
    public bigIntValue: any = BigIntFactory.zero();
    
    @ProtoString(5)
    public stringValue: string = '';
    
    @ProtoBool(6)
    public boolValue: boolean = false;
    
    @ProtoBytes(7)
    public bytesValue: Uint8Array = new Uint8Array();
    
    @ProtoTimestamp(8)
    public timestampValue: Date = new Date();
    
    @ProtoStruct(9)
    public structValue: any = {};
    
    @ProtoFloat(10, { repeated: true })
    public arrayValue: number[] = [];
    
    constructor() {
        super();
    }
}

// 不完整的组件（缺少字段）
@ProtoSerializable('IncompleteComponent')
class IncompleteComponent extends Component {
    @ProtoString(1)
    public name: string = '';
    
    // 故意添加没有装饰器的字段
    public undecoratedField: number = 42;
    
    constructor(name: string = '') {
        super();
        this.name = name;
    }
}

// 有循环引用的组件
@ProtoSerializable('CircularComponent')
class CircularComponent extends Component {
    @ProtoString(1)
    public name: string = '';
    
    @ProtoStruct(2)
    public circular: any = null;
    
    constructor(name: string = '') {
        super();
        this.name = name;
        // 创建循环引用
        this.circular = this;
    }
}

// 没有protobuf装饰器的组件
class NonSerializableComponent extends Component {
    public data: string = 'test';
    
    serialize(): any {
        return { data: this.data };
    }
    
    deserialize(data: any): void {
        this.data = data.data || this.data;
    }
}

// Mock protobuf.js
const mockProtobuf = {
    Root: jest.fn(),
    Type: jest.fn(),
    Field: jest.fn(),
    parse: jest.fn().mockReturnValue({
        root: {
            lookupType: jest.fn().mockImplementation((typeName: string) => {
                return {
                    verify: jest.fn().mockReturnValue(null),
                    create: jest.fn().mockImplementation((data) => data),
                    encode: jest.fn().mockReturnValue({
                        finish: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
                    }),
                    decode: jest.fn().mockImplementation(() => ({
                        floatValue: 3.14, 
                        doubleValue: 2.718, 
                        intValue: 42, 
                        bigIntValue: BigIntFactory.create(999),
                        stringValue: 'test', 
                        boolValue: true,
                        bytesValue: new Uint8Array([65, 66, 67]),
                        timestampValue: { seconds: 1609459200, nanos: 0 },
                        structValue: { fields: { key: { stringValue: 'value' } } },
                        arrayValue: [1.1, 2.2, 3.3],
                        name: 'TestComponent'
                    })),
                    toObject: jest.fn().mockImplementation((message) => message),
                    fromObject: jest.fn().mockImplementation((obj) => obj)
                };
            }),
            lookupTypeOrEnum: jest.fn().mockImplementation((typeName: string) => {
                if (typeName === 'google.protobuf.Timestamp') {
                    return {
                        verify: jest.fn().mockReturnValue(null),
                        create: jest.fn().mockImplementation((data) => data),
                        encode: jest.fn().mockReturnValue({
                            finish: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
                        }),
                        decode: jest.fn().mockImplementation(() => ({
                            seconds: 1609459200,
                            nanos: 0
                        })),
                        toObject: jest.fn().mockImplementation((message) => message),
                        fromObject: jest.fn().mockImplementation((obj) => obj)
                    };
                }
                return null;
            })
        }
    })
};

describe('ProtobufSerializer边界情况测试', () => {
    let serializer: ProtobufSerializer;
    
    beforeEach(() => {
        serializer = ProtobufSerializer.getInstance();
        serializer.initialize(mockProtobuf.parse().root as any);
        jest.clearAllMocks();
    });
    
    describe('极值测试', () => {
        it('应该处理极大值', () => {
            const component = new EdgeCaseComponent();
            component.floatValue = Number.MAX_VALUE;
            component.doubleValue = Number.MAX_VALUE;
            component.intValue = Number.MAX_SAFE_INTEGER;
            component.bigIntValue = BigIntFactory.create(Number.MAX_SAFE_INTEGER);
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
            expect(result.size).toBeGreaterThan(0);
        });
        
        it('应该处理极小值', () => {
            const component = new EdgeCaseComponent();
            component.floatValue = Number.MIN_VALUE;
            component.doubleValue = Number.MIN_VALUE;
            component.intValue = Number.MIN_SAFE_INTEGER;
            component.bigIntValue = BigIntFactory.create(Number.MIN_SAFE_INTEGER);
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
        
        it('应该处理特殊数值', () => {
            const component = new EdgeCaseComponent();
            component.floatValue = NaN;
            component.doubleValue = Infinity;
            component.intValue = 0;
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
    });
    
    describe('空值和undefined测试', () => {
        it('应该处理null值', () => {
            const component = new EdgeCaseComponent();
            (component as any).stringValue = null;
            (component as any).structValue = null;
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
        
        it('应该处理undefined值', () => {
            const component = new EdgeCaseComponent();
            (component as any).stringValue = undefined;
            (component as any).floatValue = undefined;
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
        
        it('应该处理空数组', () => {
            const component = new EdgeCaseComponent();
            component.arrayValue = [];
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
    });
    
    describe('复杂数据类型测试', () => {
        it('应该处理复杂对象结构', () => {
            const component = new EdgeCaseComponent();
            component.structValue = {
                nested: {
                    array: [1, 2, 3],
                    object: { key: 'value' },
                    date: new Date(),
                    null: null,
                    undefined: undefined
                }
            };
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
        
        it('应该处理Date对象', () => {
            const component = new EdgeCaseComponent();
            component.timestampValue = new Date('2021-01-01T00:00:00Z');
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
        
        it('应该处理Uint8Array', () => {
            const component = new EdgeCaseComponent();
            component.bytesValue = new Uint8Array([0, 255, 128, 64]);
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
    });
    
    describe('循环引用测试', () => {
        it('应该处理循环引用对象', () => {
            const component = new CircularComponent('circular');
            
            // 循环引用应该被妥善处理
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
            expect(result.componentType).toBe('CircularComponent');
        });
    });
    
    describe('不完整组件测试', () => {
        it('应该处理缺少装饰器的字段', () => {
            const component = new IncompleteComponent('test');
            
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
            expect(result.componentType).toBe('IncompleteComponent');
        });
    });
    
    describe('非序列化组件测试', () => {
        it('应该拒绝非protobuf组件并抛出错误', () => {
            const component = new NonSerializableComponent();
            
            // 没有protobuf装饰器的组件应该抛出错误，不再回退到JSON序列化
            expect(() => {
                serializer.serialize(component);
            }).toThrow();
        });
    });
    
    describe('批量序列化边界测试', () => {
        it('应该处理空数组', () => {
            const results = serializer.serializeBatch([]);
            expect(results).toEqual([]);
        });
        
        it('应该处理混合组件类型', () => {
            const components = [
                new EdgeCaseComponent(),
                new NonSerializableComponent(),
                new IncompleteComponent('mixed'),
            ];
            
            // continueOnError: true 时，只有可序列化的组件能成功，其他会被跳过
            const results = serializer.serializeBatch(components, { continueOnError: true });
            expect(results.length).toBeGreaterThanOrEqual(1);
            expect(results.every(r => r.type === 'protobuf')).toBe(true);
            
            // continueOnError: false 时应该抛出错误
            expect(() => {
                serializer.serializeBatch(components, { continueOnError: false });
            }).toThrow();
        });
        
        it('应该处理批量数据', () => {
            const components = Array.from({ length: 50 }, () => new EdgeCaseComponent());
            
            const results = serializer.serializeBatch(components);
            expect(results).toHaveLength(50);
            expect(results.every(r => r.type === 'protobuf')).toBe(true);
        });
        
        it('应该处理序列化错误', () => {
            // 创建会导致序列化失败的组件
            const components = [new NonSerializableComponent()];
            
            // continueOnError = false 应该抛出异常
            expect(() => {
                serializer.serializeBatch(components, { continueOnError: false });
            }).toThrow();
            
            // continueOnError = true 应该返回空数组（跳过失败的组件）
            const results = serializer.serializeBatch(components, { continueOnError: true });
            expect(results).toHaveLength(0);
        });
    });
    
    describe('反序列化边界测试', () => {
        it('应该拒绝JSON类型的反序列化并抛出错误', () => {
            const component = new NonSerializableComponent();
            const serializedData = {
                type: 'json' as const,
                componentType: 'NonSerializableComponent',
                data: { data: 'deserialized' },
                size: 100
            };
            
            // JSON类型的数据应该被拒绝，抛出错误
            expect(() => {
                serializer.deserialize(component, serializedData);
            }).toThrow();
        });
        
        it('应该优雅处理反序列化错误', () => {
            const component = new EdgeCaseComponent();
            const invalidData = {
                type: 'protobuf' as const,
                componentType: 'EdgeCaseComponent',
                data: new Uint8Array([255, 255, 255, 255]),
                size: 4
            };
            
            // 模拟解码失败
            const mockType = mockProtobuf.parse().root.lookupType('ecs.EdgeCaseComponent');
            mockType.decode.mockImplementation(() => {
                throw new Error('Decode failed');
            });
            
            // 不应该抛出异常
            expect(() => {
                serializer.deserialize(component, invalidData);
            }).not.toThrow();
        });
        
        it('应该处理缺失的proto定义', () => {
            const component = new EdgeCaseComponent();
            // 清除proto名称以模拟缺失情况
            (component as any)._protoName = undefined;
            
            const serializedData = {
                type: 'protobuf' as const,
                componentType: 'EdgeCaseComponent',
                data: new Uint8Array([1, 2, 3, 4]),
                size: 4
            };
            
            // 应该抛出未设置protobuf名称的错误
            expect(() => {
                serializer.deserialize(component, serializedData);
            }).toThrow('组件 EdgeCaseComponent 未设置protobuf名称');
        });
    });
    
    describe('缓存测试', () => {
        it('应该能清空所有缓存', () => {
            serializer.clearAllCaches();
            const stats = serializer.getStats();
            expect(stats.messageTypeCacheSize).toBe(0);
            expect(stats.componentDataCacheSize).toBe(0);
        });
    });
    
    describe('性能选项测试', () => {
        it('应该能禁用数据验证', () => {
            serializer.setPerformanceOptions({ enableValidation: false });
            
            const component = new EdgeCaseComponent();
            const result = serializer.serialize(component);
            expect(result.type).toBe('protobuf');
        });
        
        it('应该能禁用组件数据缓存', () => {
            serializer.setPerformanceOptions({ enableComponentDataCache: false });
            
            const component = new EdgeCaseComponent();
            serializer.serialize(component);
            
            const stats = serializer.getStats();
            expect(stats.componentDataCacheSize).toBe(0);
        });
    });
    
    describe('统计信息测试', () => {
        it('应该返回正确的统计信息', () => {
            const stats = serializer.getStats();
            
            expect(typeof stats.registeredComponents).toBe('number');
            expect(typeof stats.protobufAvailable).toBe('boolean');
            expect(typeof stats.messageTypeCacheSize).toBe('number');
            expect(typeof stats.componentDataCacheSize).toBe('number');
            expect(typeof stats.enableComponentDataCache).toBe('boolean');
            expect(typeof stats.maxCacheSize).toBe('number');
        });
    });
});