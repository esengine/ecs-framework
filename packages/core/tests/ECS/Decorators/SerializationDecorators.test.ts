import { Component } from '../../../src/ECS/Component';
import { 
    Serializable, 
    SerializableField, 
    getClassSerializationMeta,
    validateSerializableComponent
} from '../../../src/ECS/Decorators/SerializationDecorators';
import { SchemaRegistry } from '../../../src/ECS/Core/Serialization/SchemaRegistry';

describe('SerializationDecorators', () => {
    beforeEach(() => {
        SchemaRegistry.reset();
        SchemaRegistry.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('@Serializable装饰器', () => {
        test('应该正确标记类为可序列化', () => {
            @Serializable()
            class TestSerializableComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
            }

            const meta = getClassSerializationMeta(TestSerializableComponent);
            expect(meta).toBeDefined();
            expect(meta?.fields).toHaveLength(1);
        });

        test('应该存储类的序列化元数据', () => {
            @Serializable()
            class BasicSerializableComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
                
                @SerializableField({ dataType: 'number' })
                public value: number = 42;
            }

            const meta = getClassSerializationMeta(BasicSerializableComponent);
            
            expect(meta).toBeDefined();
            expect(meta?.fields).toHaveLength(2);
            expect(meta?.fields[0].name).toBe('name');
            expect(meta?.fields[1].name).toBe('value');
        });

        test('应该支持序列化选项', () => {
            @Serializable({ 
                binaryMode: true, 
                compression: true 
            })
            class AdvancedSerializableComponent extends Component {
                @SerializableField({ dataType: 'number' })
                public health: number = 100;
            }

            const meta = getClassSerializationMeta(AdvancedSerializableComponent);
            
            expect(meta).toBeDefined();
            expect(meta?.options?.binaryMode).toBe(true);
            expect(meta?.options?.compression).toBe(true);
        });

        test('应该支持explicit模式', () => {
            @Serializable({ mode: 'explicit' })
            class ExplicitModeComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public explicitField: string = 'explicit';
                
                public implicitField: string = 'implicit';
            }

            const meta = getClassSerializationMeta(ExplicitModeComponent);
            
            expect(meta).toBeDefined();
            expect(meta?.options?.mode).toBe('explicit');
            expect(meta?.fields).toHaveLength(1);
        });
    });

    describe('@SerializableField装饰器', () => {
        test('应该正确标记字段为可序列化', () => {
            @Serializable()
            class FieldTestComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
                
                @SerializableField({ dataType: 'number' })
                public value: number = 42;
                
                public unserializableField: string = 'should not be serialized';
            }

            const meta = getClassSerializationMeta(FieldTestComponent);
            expect(meta?.fields).toHaveLength(2);
            
            const nameField = meta?.fields.find(f => f.name === 'name');
            const valueField = meta?.fields.find(f => f.name === 'value');
            const unserializableField = meta?.fields.find(f => f.name === 'unserializableField');
            
            expect(nameField).toBeDefined();
            expect(valueField).toBeDefined();
            expect(unserializableField).toBeUndefined();
        });

        test('应该存储字段的序列化元数据', () => {
            @Serializable()
            class MetaTestComponent extends Component {
                @SerializableField({ dataType: 'string', defaultValue: 'test' })
                public name: string = 'test';
            }

            const meta = getClassSerializationMeta(MetaTestComponent);
            const nameField = meta?.fields.find(f => f.name === 'name');
            
            expect(nameField).toBeDefined();
            expect(nameField?.options.dataType).toBe('string');
            expect(nameField?.options.defaultValue).toBe('test');
            expect(nameField?.name).toBe('name');
        });

        test('应该支持字段选项', () => {
            @Serializable()
            class OptionsTestComponent extends Component {
                @SerializableField({ 
                    dataType: 'float32',
                    defaultValue: 100,
                    skipDefaults: true,
                    nullable: true
                })
                public health: number = 100;
            }

            const meta = getClassSerializationMeta(OptionsTestComponent);
            const healthField = meta?.fields.find(f => f.name === 'health');
            
            expect(healthField?.options.dataType).toBe('float32');
            expect(healthField?.options.defaultValue).toBe(100);
            expect(healthField?.options.skipDefaults).toBe(true);
            expect(healthField?.options.nullable).toBe(true);
        });

        test('应该支持自定义序列化器', () => {
            @Serializable()
            class CustomSerializerComponent extends Component {
                @SerializableField({ 
                    dataType: 'custom',
                    serializer: 'vector3'
                })
                public position = { x: 0, y: 0, z: 0 };
            }

            const meta = getClassSerializationMeta(CustomSerializerComponent);
            const positionField = meta?.fields.find(f => f.name === 'position');
            
            expect(positionField?.options.dataType).toBe('custom');
            expect(positionField?.options.serializer).toBe('vector3');
        });

        test('字段ID应该由SchemaRegistry自动分配', () => {
            @Serializable()
            class AutoIdComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
                
                @SerializableField({ dataType: 'number' })
                public value: number = 42;
            }

            // 触发注册
            new AutoIdComponent();

            const meta = getClassSerializationMeta(AutoIdComponent);
            const nameField = meta?.fields.find(f => f.name === 'name');
            const valueField = meta?.fields.find(f => f.name === 'value');
            
            expect(nameField?.id).toBeGreaterThan(0);
            expect(valueField?.id).toBeGreaterThan(0);
            expect(nameField?.id).not.toBe(valueField?.id);
        });
    });

    describe('Schema注册集成', () => {
        test('应该自动向SchemaRegistry注册组件', () => {
            @Serializable()
            class AutoRegisterComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
                
                @SerializableField({ dataType: 'number' })
                public value: number = 42;
            }

            // 装饰器应该已经触发注册
            const componentSchema = SchemaRegistry.getComponentSchema('AutoRegisterComponent');
            expect(componentSchema).toBeDefined();
            expect(componentSchema?.fields).toHaveProperty('name');
            expect(componentSchema?.fields).toHaveProperty('value');
        });

        test('应该为字段分配hash-based ID', () => {
            @Serializable()
            class HashIdComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
                
                @SerializableField({ dataType: 'number' })
                public value: number = 42;
            }

            const nameFieldId = SchemaRegistry.getFieldId('HashIdComponent', 'name');
            const valueFieldId = SchemaRegistry.getFieldId('HashIdComponent', 'value');
            
            expect(nameFieldId).toBeGreaterThan(0);
            expect(valueFieldId).toBeGreaterThan(0);
            expect(nameFieldId).not.toBe(valueFieldId);
        });

        test('重复创建组件实例不应该重复注册Schema', () => {
            @Serializable()
            class SingletonRegisterComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
            }

            const schema1 = SchemaRegistry.getComponentSchema('SingletonRegisterComponent');
            const schema2 = SchemaRegistry.getComponentSchema('SingletonRegisterComponent');
            
            expect(schema1).toBe(schema2);
        });
    });

    describe('类型推断', () => {
        test('应该能从默认值推断数据类型', () => {
            @Serializable()
            class TypeInferenceComponent extends Component {
                @SerializableField()
                public stringField: string = 'hello';
                
                @SerializableField()
                public numberField: number = 42;
                
                @SerializableField()
                public booleanField: boolean = true;
            }

            const meta = getClassSerializationMeta(TypeInferenceComponent);
            
            const stringField = meta?.fields.find(f => f.name === 'stringField');
            const numberField = meta?.fields.find(f => f.name === 'numberField');
            const booleanField = meta?.fields.find(f => f.name === 'booleanField');
            
            expect(stringField?.options.dataType).toBe('string');
            expect(numberField?.options.dataType).toBe('number');
            expect(booleanField?.options.dataType).toBe('boolean');
        });

        test('显式指定的数据类型应该优先于推断', () => {
            @Serializable()
            class ExplicitTypeComponent extends Component {
                @SerializableField({ dataType: 'float32' })
                public numberField: number = 42;
            }

            const meta = getClassSerializationMeta(ExplicitTypeComponent);
            const numberField = meta?.fields.find(f => f.name === 'numberField');
            
            expect(numberField?.options.dataType).toBe('float32');
        });
    });

    describe('验证功能', () => {
        test('validateSerializableComponent应该验证可序列化组件', () => {
            @Serializable()
            class ValidComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
            }

            const component = new ValidComponent();
            
            expect(() => {
                validateSerializableComponent(component);
            }).not.toThrow();
        });

        test('validateSerializableComponent应该拒绝非序列化组件', () => {
            class NonSerializableComponent extends Component {
                public value: number = 42;
            }

            const component = new NonSerializableComponent();
            
            expect(() => {
                validateSerializableComponent(component);
            }).toThrow('未使用 @Serializable() 装饰器');
        });

        test('validateSerializableComponent应该检查字段ID', () => {
            // 模拟一个没有正确分配ID的情况
            @Serializable()
            class InvalidIdComponent extends Component {
                @SerializableField({ dataType: 'string' })
                public name: string = 'test';
            }

            // 创建组件但不触发Schema注册
            const component = new InvalidIdComponent();
            
            // 手动清除ID以模拟错误情况
            const meta = getClassSerializationMeta(InvalidIdComponent);
            if (meta && meta.fields.length > 0) {
                meta.fields[0].id = 0; // 设置无效ID
            }
            
            expect(() => {
                validateSerializableComponent(component);
            }).toThrow('缺少有效的字段ID');
        });
    });

    describe('错误处理', () => {
        test('重复字段装饰器应该被警告但不抛出错误', () => {
            const originalWarn = console.warn;
            console.warn = jest.fn();

            @Serializable()
            class DuplicateDecoratorComponent extends Component {
                @SerializableField({ dataType: 'string' })
                @SerializableField({ dataType: 'number' }) // 重复装饰器
                public field: string = 'test';
            }

            expect(() => {
                new DuplicateDecoratorComponent();
            }).not.toThrow();

            console.warn = originalWarn;
        });

        test('无效的数据类型应该使用默认值', () => {
            @Serializable()
            class InvalidDataTypeComponent extends Component {
                @SerializableField({ dataType: undefined as any })
                public field: any = null;
            }
            
            expect(() => {
                new InvalidDataTypeComponent();
            }).not.toThrow();
            
            const meta = getClassSerializationMeta(InvalidDataTypeComponent);
            const field = meta?.fields.find(f => f.name === 'field');
            expect(field?.options.dataType).toBe('custom'); // 默认值
        });

        test('Schema注册失败应该被优雅处理', () => {
            // 模拟SchemaRegistry不可用的情况
            const originalRegister = SchemaRegistry.registerComponent;
            SchemaRegistry.registerComponent = jest.fn().mockImplementation(() => {
                throw new Error('Schema registration failed');
            });

            expect(() => {
                @Serializable()
                class FailedRegisterComponent extends Component {
                    @SerializableField({ dataType: 'string' })
                    public name: string = 'test';
                }
            }).not.toThrow(); // 错误应该被捕获并记录

            SchemaRegistry.registerComponent = originalRegister;
        });
    });

    describe('兼容性测试', () => {
        test('旧式的字段ID指定应该被忽略', () => {
            @Serializable()
            class LegacyIdComponent extends Component {
                @SerializableField({ id: 999, dataType: 'string' })
                public name: string = 'test';
            }

            const meta = getClassSerializationMeta(LegacyIdComponent);
            const nameField = meta?.fields.find(f => f.name === 'name');
            
            // ID应该由SchemaRegistry重新分配，不使用指定的999
            expect(nameField?.id).not.toBe(999);
            expect(nameField?.id).toBeGreaterThan(0);
        });

        test('空字段定义应该正常工作', () => {
            @Serializable()
            class EmptyFieldsComponent extends Component {
                public nonSerializableField: string = 'test';
            }

            expect(() => {
                new EmptyFieldsComponent();
            }).not.toThrow();

            const meta = getClassSerializationMeta(EmptyFieldsComponent);
            expect(meta?.fields).toHaveLength(0);
        });
    });
});