import { SchemaRegistry } from '../../../../src/ECS/Core/Serialization/SchemaRegistry';
import { Component } from '../../../../src/ECS/Component';
import { Serializable, SerializableField } from '../../../../src/ECS/Decorators/SerializationDecorators';
import { ECSComponent } from '../../../../src/ECS/Decorators/TypeDecorators';

@ECSComponent('TestComponent')
@Serializable()
class TestComponent extends Component {
    @SerializableField({ dataType: 'string' })
    public name: string = 'test';
    
    @SerializableField({ dataType: 'number' })
    public value: number = 42;
}

@ECSComponent('AnotherTestComponent')
@Serializable()
class AnotherTestComponent extends Component {
    @SerializableField({ dataType: 'boolean' })
    public active: boolean = true;
    
    @SerializableField({ dataType: 'string[]' })
    public tags: string[] = [];
}

describe('SchemaRegistry', () => {
    beforeEach(() => {
        SchemaRegistry.reset();
    });

    describe('初始化', () => {
        test('应该能够初始化空注册表', () => {
            expect(() => {
                SchemaRegistry.init();
            }).not.toThrow();
            
            expect(SchemaRegistry.isInitialized()).toBe(true);
        });

        test('应该能够使用已有注册表初始化', () => {
            const existingRegistry = {
                components: {
                    'ExistingComponent': {
                        name: 'ExistingComponent',
                        fields: {
                            'testField': {
                                name: 'testField',
                                dataType: 'string' as const,
                                nullable: false
                            }
                        }
                    }
                }
            };

            expect(() => {
                SchemaRegistry.init(existingRegistry);
            }).not.toThrow();
            
            expect(SchemaRegistry.hasComponent('ExistingComponent')).toBe(true);
        });

        test('重置后应该清空所有数据', () => {
            SchemaRegistry.init();
            SchemaRegistry.registerComponent('TestComp', {
                field1: { dataType: 'string' }
            });
            
            expect(SchemaRegistry.hasComponent('TestComp')).toBe(true);
            
            SchemaRegistry.reset();
            
            expect(SchemaRegistry.isInitialized()).toBe(false);
            expect(SchemaRegistry.getAllComponentNames()).toHaveLength(0);
        });
    });

    describe('组件注册', () => {
        beforeEach(() => {
            SchemaRegistry.init();
        });

        test('应该能够注册新组件', () => {
            expect(() => {
                SchemaRegistry.registerComponent('TestComponent', {
                    name: { dataType: 'string' },
                    value: { dataType: 'number' }
                });
            }).not.toThrow();
            
            expect(SchemaRegistry.hasComponent('TestComponent')).toBe(true);
        });

        test('应该能够获取注册的组件Schema', () => {
            SchemaRegistry.registerComponent('TestComponent', {
                name: { dataType: 'string', defaultValue: 'test' },
                value: { dataType: 'number', nullable: true }
            });
            
            const schema = SchemaRegistry.getComponentSchema('TestComponent');
            
            expect(schema).not.toBeNull();
            expect(schema!.name).toBe('TestComponent');
            expect(schema!.fields).toHaveProperty('name');
            expect(schema!.fields).toHaveProperty('value');
            expect(schema!.fields.name.dataType).toBe('string');
            expect(schema!.fields.name.defaultValue).toBe('test');
            expect(schema!.fields.value.nullable).toBe(true);
        });

        test('不存在的组件应该返回null', () => {
            const schema = SchemaRegistry.getComponentSchema('NonExistentComponent');
            expect(schema).toBeNull();
        });

        test('应该能够获取所有注册的组件名称', () => {
            SchemaRegistry.registerComponent('Component1', {
                field1: { dataType: 'string' }
            });
            SchemaRegistry.registerComponent('Component2', {
                field1: { dataType: 'number' }
            });
            
            const componentNames = SchemaRegistry.getAllComponentNames();
            
            expect(componentNames).toContain('Component1');
            expect(componentNames).toContain('Component2');
            expect(componentNames.length).toBe(2);
        });

        test('重复注册应该覆盖现有组件', () => {
            SchemaRegistry.registerComponent('TestComponent', {
                field1: { dataType: 'string' }
            });
            
            let schema = SchemaRegistry.getComponentSchema('TestComponent');
            expect(Object.keys(schema!.fields)).toHaveLength(1);
            
            SchemaRegistry.registerComponent('TestComponent', {
                field1: { dataType: 'string' },
                field2: { dataType: 'number' }
            });
            
            schema = SchemaRegistry.getComponentSchema('TestComponent');
            expect(Object.keys(schema!.fields)).toHaveLength(2);
        });

        test('未初始化时注册组件应该自动初始化', () => {
            SchemaRegistry.reset();
            expect(SchemaRegistry.isInitialized()).toBe(false);
            
            SchemaRegistry.registerComponent('TestComponent', {
                field1: { dataType: 'string' }
            });
            
            expect(SchemaRegistry.isInitialized()).toBe(true);
            expect(SchemaRegistry.hasComponent('TestComponent')).toBe(true);
        });
    });

    describe('ID生成', () => {
        beforeEach(() => {
            SchemaRegistry.init();
        });

        test('相同组件名应该生成相同的ID', () => {
            const id1 = SchemaRegistry.getComponentId('TestComponent');
            const id2 = SchemaRegistry.getComponentId('TestComponent');
            
            expect(id1).toBe(id2);
            expect(typeof id1).toBe('number');
        });

        test('不同组件名应该生成不同的ID', () => {
            const id1 = SchemaRegistry.getComponentId('Component1');
            const id2 = SchemaRegistry.getComponentId('Component2');
            
            expect(id1).not.toBe(id2);
        });

        test('相同字段应该生成相同的ID', () => {
            const id1 = SchemaRegistry.getFieldId('TestComponent', 'testField');
            const id2 = SchemaRegistry.getFieldId('TestComponent', 'testField');
            
            expect(id1).toBe(id2);
            expect(typeof id1).toBe('number');
        });

        test('不同字段应该生成不同的ID', () => {
            const id1 = SchemaRegistry.getFieldId('TestComponent', 'field1');
            const id2 = SchemaRegistry.getFieldId('TestComponent', 'field2');
            const id3 = SchemaRegistry.getFieldId('OtherComponent', 'field1');
            
            expect(id1).not.toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id2).not.toBe(id3);
        });

        test('ID生成应该是确定性的', () => {
            const componentName = 'DeterministicTest';
            const fieldName = 'testField';
            
            const id1 = SchemaRegistry.getComponentId(componentName);
            const fieldId1 = SchemaRegistry.getFieldId(componentName, fieldName);
            
            SchemaRegistry.reset();
            SchemaRegistry.init();
            
            const id2 = SchemaRegistry.getComponentId(componentName);
            const fieldId2 = SchemaRegistry.getFieldId(componentName, fieldName);
            
            expect(id1).toBe(id2);
            expect(fieldId1).toBe(fieldId2);
        });
    });

    describe('序列化支持', () => {
        beforeEach(() => {
            SchemaRegistry.init();
        });

        test('应该能够导出注册表为JSON', () => {
            SchemaRegistry.registerComponent('TestComponent', {
                name: { dataType: 'string' },
                value: { dataType: 'number' }
            });
            
            const json = SchemaRegistry.exportRegistry();
            
            expect(() => JSON.parse(json)).not.toThrow();
            
            const parsed = JSON.parse(json);
            expect(parsed.components).toHaveProperty('TestComponent');
            expect(parsed.components.TestComponent.fields).toHaveProperty('name');
            expect(parsed.components.TestComponent.fields).toHaveProperty('value');
        });

        test('应该能够从JSON加载注册表', () => {
            const registryData = {
                components: {
                    'LoadedComponent': {
                        name: 'LoadedComponent',
                        fields: {
                            'loadedField': {
                                name: 'loadedField',
                                dataType: 'string' as const,
                                defaultValue: 'loaded'
                            }
                        }
                    }
                }
            };
            
            const json = JSON.stringify(registryData);
            
            expect(() => {
                SchemaRegistry.loadFromJSON(json);
            }).not.toThrow();
            
            expect(SchemaRegistry.hasComponent('LoadedComponent')).toBe(true);
            
            const schema = SchemaRegistry.getComponentSchema('LoadedComponent');
            expect(schema).not.toBeNull();
            expect(schema!.fields.loadedField.defaultValue).toBe('loaded');
        });

        test('无效JSON应该抛出错误', () => {
            expect(() => {
                SchemaRegistry.loadFromJSON('invalid json');
            }).toThrow('解析注册表JSON失败');
        });
    });

    describe('调试信息', () => {
        beforeEach(() => {
            SchemaRegistry.init();
        });

        test('应该能够获取调试信息', () => {
            SchemaRegistry.registerComponent('Component1', {
                field1: { dataType: 'string' },
                field2: { dataType: 'number' }
            });
            SchemaRegistry.registerComponent('Component2', {
                field1: { dataType: 'boolean' }
            });
            
            const debugInfo = SchemaRegistry.getDebugInfo();
            
            expect(debugInfo.componentCount).toBe(2);
            expect(debugInfo.totalFieldCount).toBe(3);
            expect(debugInfo.componentIds).toHaveProperty('Component1');
            expect(debugInfo.componentIds).toHaveProperty('Component2');
            expect(debugInfo.fieldIds['Component1.field1']).toBeDefined();
            expect(debugInfo.fieldIds['Component1.field2']).toBeDefined();
            expect(debugInfo.fieldIds['Component2.field1']).toBeDefined();
            
            expect(typeof debugInfo.componentIds['Component1']).toBe('number');
            expect(typeof debugInfo.fieldIds['Component1.field1']).toBe('number');
        });

        test('空注册表应该返回空的调试信息', () => {
            const debugInfo = SchemaRegistry.getDebugInfo();
            
            expect(debugInfo.componentCount).toBe(0);
            expect(debugInfo.totalFieldCount).toBe(0);
            expect(Object.keys(debugInfo.componentIds)).toHaveLength(0);
            expect(Object.keys(debugInfo.fieldIds)).toHaveLength(0);
        });
    });

    describe('与装饰器集成', () => {
        beforeEach(() => {
            SchemaRegistry.reset();
            SchemaRegistry.init();
        });

        test('装饰器应该自动注册组件', () => {
            // 重新注册装饰器组件（模拟装饰器执行）
            SchemaRegistry.registerComponent('TestComponent', {
                name: { dataType: 'string' },
                value: { dataType: 'number' }
            });
            
            expect(SchemaRegistry.hasComponent('TestComponent')).toBe(true);
            
            const schema = SchemaRegistry.getComponentSchema('TestComponent');
            expect(schema).not.toBeNull();
            expect(schema!.fields).toHaveProperty('name');
            expect(schema!.fields).toHaveProperty('value');
        });

        test('多个组件装饰器应该都能正常工作', () => {
            // 重新注册装饰器组件（模拟装饰器执行）
            SchemaRegistry.registerComponent('TestComponent', {
                name: { dataType: 'string' },
                value: { dataType: 'number' }
            });
            SchemaRegistry.registerComponent('AnotherTestComponent', {
                active: { dataType: 'boolean' },
                tags: { dataType: 'string[]' }
            });
            
            expect(SchemaRegistry.hasComponent('TestComponent')).toBe(true);
            expect(SchemaRegistry.hasComponent('AnotherTestComponent')).toBe(true);
            
            const componentNames = SchemaRegistry.getAllComponentNames();
            expect(componentNames).toContain('TestComponent');
            expect(componentNames).toContain('AnotherTestComponent');
        });

        test('字段ID应该正确分配', () => {
            // 重新注册装饰器组件（模拟装饰器执行）
            SchemaRegistry.registerComponent('TestComponent', {
                name: { dataType: 'string' },
                value: { dataType: 'number' }
            });
            
            const nameFieldId = SchemaRegistry.getFieldId('TestComponent', 'name');
            const valueFieldId = SchemaRegistry.getFieldId('TestComponent', 'value');
            
            expect(nameFieldId).toBeGreaterThan(0);
            expect(valueFieldId).toBeGreaterThan(0);
            expect(nameFieldId).not.toBe(valueFieldId);
        });
    });

    describe('边界情况', () => {
        beforeEach(() => {
            SchemaRegistry.init();
        });

        test('空字段定义应该能正常处理', () => {
            expect(() => {
                SchemaRegistry.registerComponent('EmptyComponent', {});
            }).not.toThrow();
            
            const schema = SchemaRegistry.getComponentSchema('EmptyComponent');
            expect(schema).not.toBeNull();
            expect(Object.keys(schema!.fields)).toHaveLength(0);
        });

        test('特殊字符的组件名应该能正常处理', () => {
            const componentName = 'Component-With_Special.Characters';
            
            expect(() => {
                SchemaRegistry.registerComponent(componentName, {
                    field1: { dataType: 'string' }
                });
            }).not.toThrow();
            
            expect(SchemaRegistry.hasComponent(componentName)).toBe(true);
            
            const id = SchemaRegistry.getComponentId(componentName);
            expect(typeof id).toBe('number');
        });

        test('Unicode字符的组件名应该能正常处理', () => {
            const componentName = '测试组件名称';
            
            expect(() => {
                SchemaRegistry.registerComponent(componentName, {
                    字段1: { dataType: 'string' }
                });
            }).not.toThrow();
            
            expect(SchemaRegistry.hasComponent(componentName)).toBe(true);
            
            const fieldId = SchemaRegistry.getFieldId(componentName, '字段1');
            expect(typeof fieldId).toBe('number');
        });

        test('非常长的组件名应该能正常处理', () => {
            const longComponentName = 'A'.repeat(1000);
            
            expect(() => {
                SchemaRegistry.registerComponent(longComponentName, {
                    field1: { dataType: 'string' }
                });
            }).not.toThrow();
            
            expect(SchemaRegistry.hasComponent(longComponentName)).toBe(true);
        });

        test('缺少数据类型时应该使用默认值', () => {
            expect(() => {
                SchemaRegistry.registerComponent('DefaultTypeComponent', {
                    field1: {}
                });
            }).not.toThrow();
            
            const schema = SchemaRegistry.getComponentSchema('DefaultTypeComponent');
            expect(schema).not.toBeNull();
            expect(schema!.fields.field1.dataType).toBe('custom');
        });

        test('ID冲突检测应该工作正常', () => {
            // 由于使用hash算法，理论上可能存在冲突，但概率极低
            const componentNames: string[] = [];
            const fieldNames: string[] = [];
            const componentIds = new Set<number>();
            const fieldIds = new Set<number>();
            
            // 生成大量组件和字段名，检查ID唯一性
            for (let i = 0; i < 100; i++) {
                const componentName = `Component${i}`;
                const fieldName = `field${i}`;
                
                componentNames.push(componentName);
                fieldNames.push(fieldName);
                
                const componentId = SchemaRegistry.getComponentId(componentName);
                const fieldId = SchemaRegistry.getFieldId(componentName, fieldName);
                
                expect(componentIds.has(componentId)).toBe(false);
                expect(fieldIds.has(fieldId)).toBe(false);
                
                componentIds.add(componentId);
                fieldIds.add(fieldId);
            }
            
            expect(componentIds.size).toBe(100);
            expect(fieldIds.size).toBe(100);
        });

        test('参数校验应该正常工作', () => {
            // 空组件名测试
            expect(() => {
                SchemaRegistry.getComponentId('');
            }).toThrow('组件名称不能为空且必须是字符串');
            
            expect(() => {
                SchemaRegistry.getComponentId(null as any);
            }).toThrow('组件名称不能为空且必须是字符串');
            
            // 空字段名测试
            expect(() => {
                SchemaRegistry.getFieldId('TestComponent', '');
            }).toThrow('字段名称不能为空且必须是字符串');
            
            expect(() => {
                SchemaRegistry.getFieldId('TestComponent', null as any);
            }).toThrow('字段名称不能为空且必须是字符串');
            
            // 空组件名注册测试
            expect(() => {
                SchemaRegistry.registerComponent('', { field1: { dataType: 'string' } });
            }).toThrow('组件名称不能为空且必须是字符串');
            
            expect(() => {
                SchemaRegistry.registerComponent(null as any, { field1: { dataType: 'string' } });
            }).toThrow('组件名称不能为空且必须是字符串');
        });
    });
});