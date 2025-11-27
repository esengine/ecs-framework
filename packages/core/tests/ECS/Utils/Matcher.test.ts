import { Component } from '../../../src/ECS/Component';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { ComponentType } from '../../../src/ECS/Core/ComponentStorage';

class Position extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [x = 0, y = 0] = args as [number?, number?];
        this.x = x;
        this.y = y;
    }
}

class Velocity extends Component {
    public vx: number = 0;
    public vy: number = 0;
    
    constructor(...args: unknown[]) {
        super();
        const [vx = 0, vy = 0] = args as [number?, number?];
        this.vx = vx;
        this.vy = vy;
    }
}

class Health extends Component {
    public hp: number = 100;
    
    constructor(...args: unknown[]) {
        super();
        const [hp = 100] = args as [number?];
        this.hp = hp;
    }
}

class Shield extends Component {
    public value: number = 50;
    
    constructor(...args: unknown[]) {
        super();
        const [value = 50] = args as [number?];
        this.value = value;
    }
}

class Dead extends Component {}

class Weapon extends Component {
    public damage: number = 10;
    
    constructor(...args: unknown[]) {
        super();
        const [damage = 10] = args as [number?];
        this.damage = damage;
    }
}

describe('Matcher', () => {
    describe('静态工厂方法', () => {
        test('all() 应该创建包含所有指定组件的条件', () => {
            const matcher = Matcher.all(Position, Velocity);
            const condition = matcher.getCondition();
            
            expect(condition.all).toHaveLength(2);
            expect(condition.all).toContain(Position);
            expect(condition.all).toContain(Velocity);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
        });
        
        test('any() 应该创建包含任一指定组件的条件', () => {
            const matcher = Matcher.any(Health, Shield);
            const condition = matcher.getCondition();
            
            expect(condition.any).toHaveLength(2);
            expect(condition.any).toContain(Health);
            expect(condition.any).toContain(Shield);
            expect(condition.all).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
        });
        
        test('none() 应该创建排除指定组件的条件', () => {
            const matcher = Matcher.none(Dead, Weapon);
            const condition = matcher.getCondition();
            
            expect(condition.none).toHaveLength(2);
            expect(condition.none).toContain(Dead);
            expect(condition.none).toContain(Weapon);
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
        });
        
        test('byTag() 应该创建标签查询条件', () => {
            const matcher = Matcher.byTag(123);
            const condition = matcher.getCondition();
            
            expect(condition.tag).toBe(123);
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
        });
        
        test('byName() 应该创建名称查询条件', () => {
            const matcher = Matcher.byName('TestEntity');
            const condition = matcher.getCondition();
            
            expect(condition.name).toBe('TestEntity');
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
        });
        
        test('byComponent() 应该创建单组件查询条件', () => {
            const matcher = Matcher.byComponent(Position);
            const condition = matcher.getCondition();
            
            expect(condition.component).toBe(Position);
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
        });
        
        test('complex() 应该创建空的复杂查询构建器', () => {
            const matcher = Matcher.complex();
            const condition = matcher.getCondition();
            
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
            expect(condition.tag).toBeUndefined();
            expect(condition.name).toBeUndefined();
            expect(condition.component).toBeUndefined();
        });
        
        test('empty() 应该创建空匹配器', () => {
            const matcher = Matcher.empty();
            const condition = matcher.getCondition();
            
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
            expect(condition.tag).toBeUndefined();
            expect(condition.name).toBeUndefined();
            expect(condition.component).toBeUndefined();
        });
    });
    
    describe('实例方法', () => {
        test('all() 应该添加到 all 条件数组', () => {
            const matcher = Matcher.empty();
            matcher.all(Position, Velocity);
            const condition = matcher.getCondition();
            
            expect(condition.all).toHaveLength(2);
            expect(condition.all).toContain(Position);
            expect(condition.all).toContain(Velocity);
        });
        
        test('any() 应该添加到 any 条件数组', () => {
            const matcher = Matcher.empty();
            matcher.any(Health, Shield);
            const condition = matcher.getCondition();
            
            expect(condition.any).toHaveLength(2);
            expect(condition.any).toContain(Health);
            expect(condition.any).toContain(Shield);
        });
        
        test('none() 应该添加到 none 条件数组', () => {
            const matcher = Matcher.empty();
            matcher.none(Dead);
            const condition = matcher.getCondition();
            
            expect(condition.none).toHaveLength(1);
            expect(condition.none).toContain(Dead);
        });
        
        test('exclude() 应该是 none() 的别名', () => {
            const matcher = Matcher.empty();
            matcher.exclude(Dead, Weapon);
            const condition = matcher.getCondition();
            
            expect(condition.none).toHaveLength(2);
            expect(condition.none).toContain(Dead);
            expect(condition.none).toContain(Weapon);
        });
        
        test('one() 应该是 any() 的别名', () => {
            const matcher = Matcher.empty();
            matcher.one(Health, Shield);
            const condition = matcher.getCondition();
            
            expect(condition.any).toHaveLength(2);
            expect(condition.any).toContain(Health);
            expect(condition.any).toContain(Shield);
        });
    });
    
    describe('链式调用', () => {
        test('应该支持复杂的链式调用', () => {
            const matcher = Matcher.all(Position)
                .any(Health, Shield)
                .none(Dead)
                .withTag(100)
                .withName('Player');
            
            const condition = matcher.getCondition();
            
            expect(condition.all).toContain(Position);
            expect(condition.any).toContain(Health);
            expect(condition.any).toContain(Shield);
            expect(condition.none).toContain(Dead);
            expect(condition.tag).toBe(100);
            expect(condition.name).toBe('Player');
        });
        
        test('多次调用同一方法应该累积组件', () => {
            const matcher = Matcher.empty()
                .all(Position)
                .all(Velocity)
                .any(Health)
                .any(Shield)
                .none(Dead)
                .none(Weapon);
            
            const condition = matcher.getCondition();
            
            expect(condition.all).toHaveLength(2);
            expect(condition.any).toHaveLength(2);
            expect(condition.none).toHaveLength(2);
        });
    });
    
    describe('条件管理方法', () => {
        test('withTag() 应该设置标签条件', () => {
            const matcher = Matcher.empty().withTag(42);
            const condition = matcher.getCondition();
            
            expect(condition.tag).toBe(42);
        });
        
        test('withName() 应该设置名称条件', () => {
            const matcher = Matcher.empty().withName('Enemy');
            const condition = matcher.getCondition();
            
            expect(condition.name).toBe('Enemy');
        });
        
        test('withComponent() 应该设置单组件条件', () => {
            const matcher = Matcher.empty().withComponent(Position);
            const condition = matcher.getCondition();
            
            expect(condition.component).toBe(Position);
        });
        
        test('withoutTag() 应该移除标签条件', () => {
            const matcher = Matcher.byTag(123).withoutTag();
            const condition = matcher.getCondition();
            
            expect(condition.tag).toBeUndefined();
        });
        
        test('withoutName() 应该移除名称条件', () => {
            const matcher = Matcher.byName('Test').withoutName();
            const condition = matcher.getCondition();
            
            expect(condition.name).toBeUndefined();
        });
        
        test('withoutComponent() 应该移除单组件条件', () => {
            const matcher = Matcher.byComponent(Position).withoutComponent();
            const condition = matcher.getCondition();
            
            expect(condition.component).toBeUndefined();
        });
        
        test('覆盖条件应该替换之前的值', () => {
            const matcher = Matcher.byTag(100)
                .withTag(200)
                .withName('First')
                .withName('Second')
                .withComponent(Position)
                .withComponent(Velocity);
            
            const condition = matcher.getCondition();
            
            expect(condition.tag).toBe(200);
            expect(condition.name).toBe('Second');
            expect(condition.component).toBe(Velocity);
        });
    });
    
    describe('工具方法', () => {
        test('isEmpty() 应该正确判断空条件', () => {
            const emptyMatcher = Matcher.empty();
            expect(emptyMatcher.isEmpty()).toBe(true);
            
            const nonEmptyMatcher = Matcher.all(Position);
            expect(nonEmptyMatcher.isEmpty()).toBe(false);
        });
        
        test('isEmpty() 应该检查所有条件类型', () => {
            expect(Matcher.all(Position).isEmpty()).toBe(false);
            expect(Matcher.any(Health).isEmpty()).toBe(false);
            expect(Matcher.none(Dead).isEmpty()).toBe(false);
            expect(Matcher.byTag(1).isEmpty()).toBe(false);
            expect(Matcher.byName('test').isEmpty()).toBe(false);
            expect(Matcher.byComponent(Position).isEmpty()).toBe(false);
        });
        
        test('reset() 应该清空所有条件', () => {
            const matcher = Matcher.all(Position, Velocity)
                .any(Health, Shield)
                .none(Dead)
                .withTag(123)
                .withName('Test')
                .withComponent(Weapon);
            
            matcher.reset();
            const condition = matcher.getCondition();
            
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
            expect(condition.tag).toBeUndefined();
            expect(condition.name).toBeUndefined();
            expect(condition.component).toBeUndefined();
            expect(matcher.isEmpty()).toBe(true);
        });
        
        test('clone() 应该创建独立的副本', () => {
            const original = Matcher.all(Position, Velocity)
                .any(Health)
                .none(Dead)
                .withTag(100)
                .withName('Original')
                .withComponent(Weapon);
            
            const cloned = original.clone();
            const originalCondition = original.getCondition();
            const clonedCondition = cloned.getCondition();
            
            expect(clonedCondition.all).toEqual(originalCondition.all);
            expect(clonedCondition.any).toEqual(originalCondition.any);
            expect(clonedCondition.none).toEqual(originalCondition.none);
            expect(clonedCondition.tag).toBe(originalCondition.tag);
            expect(clonedCondition.name).toBe(originalCondition.name);
            expect(clonedCondition.component).toBe(originalCondition.component);
            
            // 修改克隆不应影响原对象
            cloned.all(Shield).withTag(200);
            
            expect(original.getCondition().all).not.toContain(Shield);
            expect(original.getCondition().tag).toBe(100);
        });
        
        test('toString() 应该生成可读的字符串表示', () => {
            const matcher = Matcher.all(Position, Velocity)
                .any(Health, Shield)
                .none(Dead)
                .withTag(123)
                .withName('TestEntity')
                .withComponent(Weapon);
            
            const str = matcher.toString();
            
            expect(str).toContain('all(Position, Velocity)');
            expect(str).toContain('any(Health, Shield)');
            expect(str).toContain('none(Dead)');
            expect(str).toContain('tag(123)');
            expect(str).toContain('name(TestEntity)');
            expect(str).toContain('component(Weapon)');
            expect(str).toContain('Matcher[');
            expect(str).toContain(' & ');
        });
        
        test('toString() 应该处理空条件', () => {
            const emptyMatcher = Matcher.empty();
            const str = emptyMatcher.toString();
            
            expect(str).toBe('Matcher[]');
        });
        
        test('toString() 应该处理部分条件', () => {
            const matcher = Matcher.all(Position).withTag(42);
            const str = matcher.toString();
            
            expect(str).toContain('all(Position)');
            expect(str).toContain('tag(42)');
            expect(str).not.toContain('any(');
            expect(str).not.toContain('none(');
        });
    });
    
    describe('getCondition() 返回值', () => {
        test('应该返回只读的条件副本', () => {
            const matcher = Matcher.all(Position, Velocity);
            const condition1 = matcher.getCondition();
            const condition2 = matcher.getCondition();
            
            // 应该是不同的对象实例
            expect(condition1).not.toBe(condition2);
            
            // 但内容应该相同
            expect(condition1.all).toEqual(condition2.all);
        });
        
        test('修改返回的条件不应影响原 Matcher', () => {
            const matcher = Matcher.all(Position);
            const condition = matcher.getCondition();
            
            // 尝试修改返回的条件
            condition.all.push(Velocity as ComponentType);
            
            // 原 Matcher 不应被影响
            const freshCondition = matcher.getCondition();
            expect(freshCondition.all).toHaveLength(1);
            expect(freshCondition.all).toContain(Position);
            expect(freshCondition.all).not.toContain(Velocity);
        });
    });
    
    describe('边界情况', () => {
        test('应该处理空参数调用', () => {
            const matcher = Matcher.empty();
            
            matcher.all();
            matcher.any();
            matcher.none();
            
            const condition = matcher.getCondition();
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
        });
        
        test('应该处理重复的组件类型', () => {
            const matcher = Matcher.all(Position, Position, Velocity);
            const condition = matcher.getCondition();
            
            expect(condition.all).toHaveLength(3);
            expect(condition.all.filter(t => t === Position)).toHaveLength(2);
        });
        
        test('应该处理标签值为0的情况', () => {
            const matcher = Matcher.byTag(0);
            const condition = matcher.getCondition();
            
            expect(condition.tag).toBe(0);
            expect(matcher.isEmpty()).toBe(false);
        });
        
        test('应该处理空字符串名称', () => {
            const matcher = Matcher.byName('');
            const condition = matcher.getCondition();
            
            expect(condition.name).toBe('');
            expect(matcher.isEmpty()).toBe(false);
        });
        
        test('reset() 应该返回自身以支持链式调用', () => {
            const matcher = Matcher.all(Position);
            const result = matcher.reset();
            
            expect(result).toBe(matcher);
        });
        
        test('所有实例方法都应该返回自身以支持链式调用', () => {
            const matcher = Matcher.empty();
            
            expect(matcher.all(Position)).toBe(matcher);
            expect(matcher.any(Health)).toBe(matcher);
            expect(matcher.none(Dead)).toBe(matcher);
            expect(matcher.exclude(Weapon)).toBe(matcher);
            expect(matcher.one(Shield)).toBe(matcher);
            expect(matcher.withTag(1)).toBe(matcher);
            expect(matcher.withName('test')).toBe(matcher);
            expect(matcher.withComponent(Position)).toBe(matcher);
            expect(matcher.withoutTag()).toBe(matcher);
            expect(matcher.withoutName()).toBe(matcher);
            expect(matcher.withoutComponent()).toBe(matcher);
        });
    });
    
    describe('nothing() 匹配器', () => {
        test('nothing() 应该创建不匹配任何实体的匹配器', () => {
            const matcher = Matcher.nothing();
            const condition = matcher.getCondition();

            expect(condition.matchNothing).toBe(true);
            expect(condition.all).toHaveLength(0);
            expect(condition.any).toHaveLength(0);
            expect(condition.none).toHaveLength(0);
        });

        test('isNothing() 应该正确判断 nothing 匹配器', () => {
            const nothingMatcher = Matcher.nothing();
            expect(nothingMatcher.isNothing()).toBe(true);

            const normalMatcher = Matcher.all(Position);
            expect(normalMatcher.isNothing()).toBe(false);

            const emptyMatcher = Matcher.empty();
            expect(emptyMatcher.isNothing()).toBe(false);
        });

        test('isEmpty() 不应该将 nothing 匹配器视为空', () => {
            const nothingMatcher = Matcher.nothing();
            // nothing 匹配器有明确的语义，不应该算作空
            expect(nothingMatcher.isEmpty()).toBe(false);
        });

        test('toString() 应该正确处理 nothing 匹配器', () => {
            const matcher = Matcher.nothing();
            const str = matcher.toString();

            expect(str).toBe('Matcher[nothing]');
        });

        test('clone() 应该正确复制 nothing 匹配器', () => {
            const original = Matcher.nothing();
            const cloned = original.clone();

            expect(cloned.isNothing()).toBe(true);
            expect(cloned.getCondition().matchNothing).toBe(true);
        });

        test('reset() 应该清除 matchNothing 标志', () => {
            const matcher = Matcher.nothing();
            expect(matcher.isNothing()).toBe(true);

            matcher.reset();
            expect(matcher.isNothing()).toBe(false);
            expect(matcher.isEmpty()).toBe(true);
        });
    });

    describe('类型安全性', () => {
        test('ComponentType 应该正确工作', () => {
            // 这个测试主要是确保类型编译正确
            const matcher = Matcher.all(Position as ComponentType<Position>);
            const condition = matcher.getCondition();
            
            expect(condition.all).toContain(Position);
        });
        
        test('应该支持泛型组件类型', () => {
            class GenericComponent<T> extends Component {
                public data: T;
                constructor(data: T, ...args: unknown[]) {
                    super();
                    this.data = data;
                }
            }
            
            class StringComponent extends GenericComponent<string> {
                constructor(...args: unknown[]) {
                    super(args[0] as string || 'default');
                }
            }
            
            class NumberComponent extends GenericComponent<number> {
                constructor(...args: unknown[]) {
                    super(args[0] as number || 0);
                }
            }
            
            const matcher = Matcher.all(StringComponent, NumberComponent);
            const condition = matcher.getCondition();
            
            expect(condition.all).toContain(StringComponent);
            expect(condition.all).toContain(NumberComponent);
        });
    });
});