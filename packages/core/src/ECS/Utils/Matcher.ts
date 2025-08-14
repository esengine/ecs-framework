import { ComponentType } from '../Core/ComponentStorage';
import { getComponentTypeName } from '../Decorators';

/**
 * 查询条件类型
 */
interface QueryCondition {
    all: ComponentType[];
    any: ComponentType[];
    none: ComponentType[];
    tag?: number;           // 按标签查询
    name?: string;          // 按名称查询
    component?: ComponentType; // 单组件查询
}

/**
 * 实体匹配条件描述符
 * 
 * 用于描述实体查询条件，不执行实际查询
 * 
 * @example
 * ```typescript
 * const matcher = Matcher.all(Position, Velocity)
 *   .any(Health, Shield)
 *   .none(Dead);
 * 
 * // 获取查询条件
 * const condition = matcher.getCondition();
 * ```
 */
export class Matcher {
    private readonly condition: QueryCondition = {
        all: [],
        any: [],
        none: []
    };

    private constructor() {
        // 私有构造函数，只能通过静态方法创建
    }

    /**
     * 创建匹配器，要求所有指定的组件
     * @param types 组件类型
     */
    public static all(...types: ComponentType[]): Matcher {
        const matcher = new Matcher();
        return matcher.all(...types);
    }

    /**
     * 创建匹配器，要求至少一个指定的组件
     * @param types 组件类型
     */
    public static any(...types: ComponentType[]): Matcher {
        const matcher = new Matcher();
        return matcher.any(...types);
    }

    /**
     * 创建匹配器，排除指定的组件
     * @param types 组件类型
     */
    public static none(...types: ComponentType[]): Matcher {
        const matcher = new Matcher();
        return matcher.none(...types);
    }

    /**
     * 创建按标签查询的匙配器
     * @param tag 标签值
     */
    public static byTag(tag: number): Matcher {
        const matcher = new Matcher();
        return matcher.withTag(tag);
    }

    /**
     * 创建按名称查询的匙配器
     * @param name 实体名称
     */
    public static byName(name: string): Matcher {
        const matcher = new Matcher();
        return matcher.withName(name);
    }

    /**
     * 创建单组件查询的匙配器
     * @param componentType 组件类型
     */
    public static byComponent(componentType: ComponentType): Matcher {
        const matcher = new Matcher();
        return matcher.withComponent(componentType);
    }

    /**
     * 创建复杂查询构建器
     */
    public static complex(): Matcher {
        return new Matcher();
    }

    /**
     * 创建空匙配器（向后兼容）
     */
    public static empty(): Matcher {
        return new Matcher();
    }

    /**
     * 必须包含所有指定组件
     * @param types 组件类型
     */
    public all(...types: ComponentType[]): Matcher {
        this.condition.all.push(...types);
        return this;
    }

    /**
     * 必须包含至少一个指定组件
     * @param types 组件类型
     */
    public any(...types: ComponentType[]): Matcher {
        this.condition.any.push(...types);
        return this;
    }

    /**
     * 不能包含任何指定组件
     * @param types 组件类型
     */
    public none(...types: ComponentType[]): Matcher {
        this.condition.none.push(...types);
        return this;
    }

    /**
     * 排除指定组件（别名方法）
     * @param types 组件类型
     */
    public exclude(...types: ComponentType[]): Matcher {
        return this.none(...types);
    }

    /**
     * 至少包含其中之一（别名方法）
     * @param types 组件类型
     */
    public one(...types: ComponentType[]): Matcher {
        return this.any(...types);
    }

    /**
     * 按标签查询
     * @param tag 标签值
     */
    public withTag(tag: number): Matcher {
        this.condition.tag = tag;
        return this;
    }

    /**
     * 按名称查询
     * @param name 实体名称
     */
    public withName(name: string): Matcher {
        this.condition.name = name;
        return this;
    }

    /**
     * 单组件查询
     * @param componentType 组件类型
     */
    public withComponent(componentType: ComponentType): Matcher {
        this.condition.component = componentType;
        return this;
    }

    /**
     * 移除标签条件
     */
    public withoutTag(): Matcher {
        delete this.condition.tag;
        return this;
    }

    /**
     * 移除名称条件
     */
    public withoutName(): Matcher {
        delete this.condition.name;
        return this;
    }

    /**
     * 移除单组件条件
     */
    public withoutComponent(): Matcher {
        delete this.condition.component;
        return this;
    }

    /**
     * 获取查询条件（只读）
     */
    public getCondition(): Readonly<QueryCondition> {
        return {
            all: [...this.condition.all],
            any: [...this.condition.any],
            none: [...this.condition.none],
            tag: this.condition.tag,
            name: this.condition.name,
            component: this.condition.component
        };
    }

    /**
     * 检查是否为空条件
     */
    public isEmpty(): boolean {
        return this.condition.all.length === 0 && 
               this.condition.any.length === 0 && 
               this.condition.none.length === 0 &&
               this.condition.tag === undefined &&
               this.condition.name === undefined &&
               this.condition.component === undefined;
    }

    /**
     * 重置所有条件
     */
    public reset(): Matcher {
        this.condition.all.length = 0;
        this.condition.any.length = 0;
        this.condition.none.length = 0;
        delete this.condition.tag;
        delete this.condition.name;
        delete this.condition.component;
        return this;
    }

    /**
     * 克隆匹配器
     */
    public clone(): Matcher {
        const cloned = new Matcher();
        cloned.condition.all.push(...this.condition.all);
        cloned.condition.any.push(...this.condition.any);
        cloned.condition.none.push(...this.condition.none);
        if (this.condition.tag !== undefined) {
            cloned.condition.tag = this.condition.tag;
        }
        if (this.condition.name !== undefined) {
            cloned.condition.name = this.condition.name;
        }
        if (this.condition.component !== undefined) {
            cloned.condition.component = this.condition.component;
        }
        return cloned;
    }

    /**
     * 字符串表示
     */
    public toString(): string {
        const parts: string[] = [];
        
        if (this.condition.all.length > 0) {
            parts.push(`all(${this.condition.all.map(t => getComponentTypeName(t)).join(', ')})`);
        }
        
        if (this.condition.any.length > 0) {
            parts.push(`any(${this.condition.any.map(t => getComponentTypeName(t)).join(', ')})`);
        }
        
        if (this.condition.none.length > 0) {
            parts.push(`none(${this.condition.none.map(t => getComponentTypeName(t)).join(', ')})`);
        }
        
        if (this.condition.tag !== undefined) {
            parts.push(`tag(${this.condition.tag})`);
        }
        
        if (this.condition.name !== undefined) {
            parts.push(`name(${this.condition.name})`);
        }
        
        if (this.condition.component !== undefined) {
            parts.push(`component(${getComponentTypeName(this.condition.component)})`);
        }
        
        return `Matcher[${parts.join(' & ')}]`;
    }

}