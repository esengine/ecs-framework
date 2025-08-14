import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { 
    ECSComponent, 
    ECSSystem, 
    getComponentTypeName, 
    getSystemTypeName,
    getComponentInstanceTypeName,
    getSystemInstanceTypeName 
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
});