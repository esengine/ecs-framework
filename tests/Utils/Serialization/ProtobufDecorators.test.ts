/**
 * Protobuf装饰器测试
 */

import { Component } from '../../../src/ECS/Component';
import { 
    ProtoSerializable, 
    ProtoField, 
    ProtoFieldType,
    ProtoFloat,
    ProtoInt32,
    ProtoString,
    ProtoBool,
    ProtobufRegistry,
    isProtoSerializable,
    getProtoName
} from '../../../src/Utils/Serialization/ProtobufDecorators';

// 测试组件
@ProtoSerializable('TestPosition')
class TestPositionComponent extends Component {
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

@ProtoSerializable('TestPlayer')
class TestPlayerComponent extends Component {
    @ProtoString(1)
    public name: string = '';
    
    @ProtoInt32(2)
    public level: number = 1;
    
    @ProtoInt32(3)
    public health: number = 100;
    
    @ProtoBool(4)
    public isAlive: boolean = true;
    
    constructor(name: string = '', level: number = 1) {
        super();
        this.name = name;
        this.level = level;
    }
}

// 没有装饰器的组件
class PlainComponent extends Component {
    public data: string = 'test';
}

// 测试字段编号冲突的组件
const createConflictingComponent = () => {
    try {
        @ProtoSerializable('Conflict')
        class ConflictComponent extends Component {
            @ProtoFloat(1)
            public x: number = 0;
            
            @ProtoFloat(1) // 故意使用相同的字段编号
            public y: number = 0;
        }
        return ConflictComponent;
    } catch (error) {
        return error;
    }
};

describe('ProtobufDecorators', () => {
    let registry: ProtobufRegistry;
    
    beforeEach(() => {
        // 获取注册表实例
        registry = ProtobufRegistry.getInstance();
    });
    
    describe('@ProtoSerializable装饰器', () => {
        it('应该正确标记组件为可序列化', () => {
            const component = new TestPositionComponent(10, 20, 30);
            
            expect(isProtoSerializable(component)).toBe(true);
            expect(getProtoName(component)).toBe('TestPosition');
        });
        
        it('应该在注册表中注册组件定义', () => {
            expect(registry.hasProtoDefinition('TestPosition')).toBe(true);
            expect(registry.hasProtoDefinition('TestPlayer')).toBe(true);
        });
        
        it('应该正确处理没有装饰器的组件', () => {
            const component = new PlainComponent();
            
            expect(isProtoSerializable(component)).toBe(false);
            expect(getProtoName(component)).toBeUndefined();
        });
    });
    
    describe('@ProtoField装饰器', () => {
        it('应该正确定义字段', () => {
            const definition = registry.getComponentDefinition('TestPosition');
            
            expect(definition).toBeDefined();
            expect(definition!.fields.size).toBe(3);
            
            const xField = definition!.fields.get('x');
            expect(xField).toEqual({
                fieldNumber: 1,
                type: ProtoFieldType.FLOAT,
                repeated: false,
                optional: false,
                name: 'x'
            });
            
            const yField = definition!.fields.get('y');
            expect(yField).toEqual({
                fieldNumber: 2,
                type: ProtoFieldType.FLOAT,
                repeated: false,
                optional: false,
                name: 'y'
            });
        });
        
        it('应该支持不同的字段类型', () => {
            const definition = registry.getComponentDefinition('TestPlayer');
            
            expect(definition).toBeDefined();
            expect(definition!.fields.size).toBe(4);
            
            const nameField = definition!.fields.get('name');
            expect(nameField!.type).toBe(ProtoFieldType.STRING);
            
            const levelField = definition!.fields.get('level');
            expect(levelField!.type).toBe(ProtoFieldType.INT32);
            
            const healthField = definition!.fields.get('health');
            expect(healthField!.type).toBe(ProtoFieldType.INT32);
            
            const isAliveField = definition!.fields.get('isAlive');
            expect(isAliveField!.type).toBe(ProtoFieldType.BOOL);
        });
        
        it('应该检测字段编号冲突', () => {
            const result = createConflictingComponent();
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toContain('字段编号 1 已被字段');
        });
        
        it('应该验证字段编号有效性', () => {
            expect(() => {
                class InvalidFieldComponent extends Component {
                    @ProtoField(0) // 无效的字段编号
                    public invalid: number = 0;
                }
            }).toThrow('字段编号必须大于0');
            
            expect(() => {
                class InvalidFieldComponent extends Component {
                    @ProtoField(-1) // 无效的字段编号
                    public invalid: number = 0;
                }
            }).toThrow('字段编号必须大于0');
        });
    });
    
    describe('便捷装饰器', () => {
        it('ProtoFloat应该设置正确的字段类型', () => {
            @ProtoSerializable('FloatTest')
            class FloatTestComponent extends Component {
                @ProtoFloat(1)
                public value: number = 0;
            }
            
            const definition = registry.getComponentDefinition('FloatTest');
            const field = definition!.fields.get('value');
            expect(field!.type).toBe(ProtoFieldType.FLOAT);
        });
        
        it('ProtoInt32应该设置正确的字段类型', () => {
            @ProtoSerializable('Int32Test')
            class Int32TestComponent extends Component {
                @ProtoInt32(1)
                public value: number = 0;
            }
            
            const definition = registry.getComponentDefinition('Int32Test');
            const field = definition!.fields.get('value');
            expect(field!.type).toBe(ProtoFieldType.INT32);
        });
        
        it('ProtoString应该设置正确的字段类型', () => {
            @ProtoSerializable('StringTest')
            class StringTestComponent extends Component {
                @ProtoString(1)
                public value: string = '';
            }
            
            const definition = registry.getComponentDefinition('StringTest');
            const field = definition!.fields.get('value');
            expect(field!.type).toBe(ProtoFieldType.STRING);
        });
        
        it('ProtoBool应该设置正确的字段类型', () => {
            @ProtoSerializable('BoolTest')
            class BoolTestComponent extends Component {
                @ProtoBool(1)
                public value: boolean = false;
            }
            
            const definition = registry.getComponentDefinition('BoolTest');
            const field = definition!.fields.get('value');
            expect(field!.type).toBe(ProtoFieldType.BOOL);
        });
    });
    
    describe('ProtobufRegistry', () => {
        it('应该正确生成proto定义', () => {
            const protoDefinition = registry.generateProtoDefinition();
            
            expect(protoDefinition).toContain('syntax = "proto3";');
            expect(protoDefinition).toContain('package ecs;');
            expect(protoDefinition).toContain('message TestPosition');
            expect(protoDefinition).toContain('message TestPlayer');
            expect(protoDefinition).toContain('float x = 1;');
            expect(protoDefinition).toContain('float y = 2;');
            expect(protoDefinition).toContain('string name = 1;');
            expect(protoDefinition).toContain('int32 level = 2;');
            expect(protoDefinition).toContain('bool isAlive = 4;');
        });
        
        it('应该正确管理组件注册', () => {
            const allComponents = registry.getAllComponents();
            
            expect(allComponents.size).toBeGreaterThanOrEqual(2);
            expect(allComponents.has('TestPosition')).toBe(true);
            expect(allComponents.has('TestPlayer')).toBe(true);
        });
    });
    
    describe('字段选项', () => {
        it('应该支持repeated字段', () => {
            @ProtoSerializable('RepeatedTest')
            class RepeatedTestComponent extends Component {
                @ProtoField(1, ProtoFieldType.INT32, { repeated: true })
                public values: number[] = [];
            }
            
            const definition = registry.getComponentDefinition('RepeatedTest');
            const field = definition!.fields.get('values');
            expect(field!.repeated).toBe(true);
        });
        
        it('应该支持optional字段', () => {
            @ProtoSerializable('OptionalTest')
            class OptionalTestComponent extends Component {
                @ProtoField(1, ProtoFieldType.STRING, { optional: true })
                public optionalValue?: string;
            }
            
            const definition = registry.getComponentDefinition('OptionalTest');
            const field = definition!.fields.get('optionalValue');
            expect(field!.optional).toBe(true);
        });
    });
});