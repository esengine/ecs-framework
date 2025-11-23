import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import {
    ECSComponent,
    ECSSystem,
    getComponentTypeName,
    getSystemTypeName,
    getComponentInstanceTypeName,
    getSystemInstanceTypeName,
    getComponentDependencies,
    Property,
    getPropertyMetadata,
    hasPropertyMetadata
} from '../../../src/ECS/Decorators';

describe('TypeDecorators', () => {
    describe('@ECSComponent', () => {
        test('应该为组件类设置类型名称', () => {
            @ECSComponent('TestComponent')
            class TestComponent extends Component {
                public value: number = 10;
            }

            const typeName = getComponentTypeName(TestComponent);
            expect(typeName).toBe('TestComponent');
        });

        test('应该从组件实例获取类型名称', () => {
            @ECSComponent('PlayerComponent')
            class PlayerComponent extends Component {
                public name: string = 'Player';
            }

            const instance = new PlayerComponent();
            const typeName = getComponentInstanceTypeName(instance);
            expect(typeName).toBe('PlayerComponent');
        });

        test('未装饰的组件应该使用constructor.name作为后备', () => {
            class UndecoredComponent extends Component {
                public data: string = 'test';
            }

            const typeName = getComponentTypeName(UndecoredComponent);
            expect(typeName).toBe('UndecoredComponent');
        });
    });

    describe('@ECSSystem', () => {
        test('应该为系统类设置类型名称', () => {
            @ECSSystem('TestSystem')
            class TestSystem extends EntitySystem {
                protected override process(_entities: any[]): void {
                    // 测试系统
                }
            }

            const typeName = getSystemTypeName(TestSystem);
            expect(typeName).toBe('TestSystem');
        });

        test('应该从系统实例获取类型名称', () => {
            @ECSSystem('MovementSystem')
            class MovementSystem extends EntitySystem {
                protected override process(_entities: any[]): void {
                    // 移动系统
                }
            }

            const instance = new MovementSystem();
            const typeName = getSystemInstanceTypeName(instance);
            expect(typeName).toBe('MovementSystem');
        });

        test('未装饰的系统应该使用constructor.name作为后备', () => {
            class UndecoredSystem extends EntitySystem {
                protected override process(_entities: any[]): void {
                    // 未装饰的系统
                }
            }

            const typeName = getSystemTypeName(UndecoredSystem);
            expect(typeName).toBe('UndecoredSystem');
        });
    });

    describe('混淆场景模拟', () => {
        test('装饰器名称在混淆后仍然有效', () => {
            // 模拟混淆后的类名
            @ECSComponent('OriginalComponent')
            class a extends Component {
                public prop: boolean = true;
            }

            @ECSSystem('OriginalSystem') 
            class b extends EntitySystem {
                protected override process(_entities: any[]): void {
                    // 原始系统
                }
            }

            // 即使类名被混淆为a和b，装饰器名称依然正确
            expect(getComponentTypeName(a)).toBe('OriginalComponent');
            expect(getSystemTypeName(b)).toBe('OriginalSystem');
            
            const componentInstance = new a();
            const systemInstance = new b();
            expect(getComponentInstanceTypeName(componentInstance)).toBe('OriginalComponent');
            expect(getSystemInstanceTypeName(systemInstance)).toBe('OriginalSystem');
        });
    });

    describe('错误处理', () => {
        test('装饰器应该验证类型名称参数', () => {
            expect(() => {
                @ECSComponent('')
                class EmptyNameComponent extends Component {}
            }).toThrow('ECSComponent装饰器必须提供有效的类型名称');

            expect(() => {
                @ECSSystem('')
                class EmptyNameSystem extends EntitySystem {
                    protected override process(_entities: any[]): void {}
                }
            }).toThrow('ECSSystem装饰器必须提供有效的类型名称');
        });
    });

    describe('组件依赖', () => {
        test('应该存储和获取组件依赖关系', () => {
            @ECSComponent('BaseComponent')
            class BaseComponent extends Component {}

            @ECSComponent('DependentComponent', { requires: ['BaseComponent'] })
            class DependentComponent extends Component {}

            const dependencies = getComponentDependencies(DependentComponent);
            expect(dependencies).toEqual(['BaseComponent']);
        });

        test('没有依赖的组件应该返回undefined', () => {
            @ECSComponent('IndependentComponent')
            class IndependentComponent extends Component {}

            const dependencies = getComponentDependencies(IndependentComponent);
            expect(dependencies).toBeUndefined();
        });

        test('应该支持多个依赖', () => {
            @ECSComponent('MultiDependentComponent', { requires: ['ComponentA', 'ComponentB', 'ComponentC'] })
            class MultiDependentComponent extends Component {}

            const dependencies = getComponentDependencies(MultiDependentComponent);
            expect(dependencies).toEqual(['ComponentA', 'ComponentB', 'ComponentC']);
        });
    });

    describe('@Property 装饰器', () => {
        test('应该为属性设置元数据', () => {
            @ECSComponent('PropertyTestComponent')
            class PropertyTestComponent extends Component {
                @Property({ type: 'number', label: 'Speed' })
                public speed: number = 10;
            }

            const metadata = getPropertyMetadata(PropertyTestComponent);
            expect(metadata).toBeDefined();
            expect(metadata!['speed']).toEqual({ type: 'number', label: 'Speed' });
        });

        test('应该支持多个属性装饰器', () => {
            @ECSComponent('MultiPropertyComponent')
            class MultiPropertyComponent extends Component {
                @Property({ type: 'number', label: 'X Position' })
                public x: number = 0;

                @Property({ type: 'number', label: 'Y Position' })
                public y: number = 0;

                @Property({ type: 'string', label: 'Name' })
                public name: string = '';
            }

            const metadata = getPropertyMetadata(MultiPropertyComponent);
            expect(metadata).toBeDefined();
            expect(metadata!['x']).toEqual({ type: 'number', label: 'X Position' });
            expect(metadata!['y']).toEqual({ type: 'number', label: 'Y Position' });
            expect(metadata!['name']).toEqual({ type: 'string', label: 'Name' });
        });

        test('hasPropertyMetadata 应该正确检测属性元数据', () => {
            @ECSComponent('HasMetadataComponent')
            class HasMetadataComponent extends Component {
                @Property({ type: 'boolean' })
                public active: boolean = true;
            }

            @ECSComponent('NoMetadataComponent')
            class NoMetadataComponent extends Component {
                public value: number = 0;
            }

            expect(hasPropertyMetadata(HasMetadataComponent)).toBe(true);
            expect(hasPropertyMetadata(NoMetadataComponent)).toBe(false);
        });

        test('应该支持完整的属性选项', () => {
            @ECSComponent('FullOptionsComponent')
            class FullOptionsComponent extends Component {
                @Property({
                    type: 'number',
                    label: 'Health',
                    min: 0,
                    max: 100,
                    step: 1
                })
                public health: number = 100;
            }

            const metadata = getPropertyMetadata(FullOptionsComponent);
            expect(metadata!['health']).toEqual({
                type: 'number',
                label: 'Health',
                min: 0,
                max: 100,
                step: 1
            });
        });
    });
});