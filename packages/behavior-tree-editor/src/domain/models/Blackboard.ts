/**
 * 黑板值类型
 */
export type BlackboardValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

/**
 * 黑板领域实体
 * 管理行为树的全局变量
 */
export class Blackboard {
    private _variables: Map<string, BlackboardValue>;

    constructor(variables: Record<string, BlackboardValue> = {}) {
        this._variables = new Map(Object.entries(variables));
    }

    /**
     * 获取变量值
     */
    get(key: string): BlackboardValue {
        return this._variables.get(key);
    }

    /**
     * 设置变量值
     */
    set(key: string, value: BlackboardValue): Blackboard {
        const newVariables = new Map(this._variables);
        newVariables.set(key, value);
        return new Blackboard(Object.fromEntries(newVariables));
    }

    /**
     * 设置变量值（别名方法）
     */
    setValue(key: string, value: BlackboardValue): void {
        this._variables.set(key, value);
    }

    /**
     * 删除变量
     */
    delete(key: string): Blackboard {
        const newVariables = new Map(this._variables);
        newVariables.delete(key);
        return new Blackboard(Object.fromEntries(newVariables));
    }

    /**
     * 检查变量是否存在
     */
    has(key: string): boolean {
        return this._variables.has(key);
    }

    /**
     * 获取所有变量名
     */
    keys(): string[] {
        return Array.from(this._variables.keys());
    }

    /**
     * 获取所有变量
     */
    getAll(): Record<string, BlackboardValue> {
        return Object.fromEntries(this._variables);
    }

    /**
     * 批量设置变量
     */
    setAll(variables: Record<string, BlackboardValue>): Blackboard {
        const newVariables = new Map(this._variables);
        Object.entries(variables).forEach(([key, value]) => {
            newVariables.set(key, value);
        });
        return new Blackboard(Object.fromEntries(newVariables));
    }

    /**
     * 清空所有变量
     */
    clear(): Blackboard {
        return new Blackboard();
    }

    /**
     * 获取变量数量
     */
    size(): number {
        return this._variables.size;
    }

    /**
     * 克隆黑板
     */
    clone(): Blackboard {
        return new Blackboard(this.getAll());
    }

    /**
     * 转换为普通对象
     */
    toObject(): Record<string, BlackboardValue> {
        return this.getAll();
    }

    /**
     * 从普通对象创建黑板
     */
    static fromObject(obj: Record<string, unknown>): Blackboard {
        return new Blackboard(obj as Record<string, BlackboardValue>);
    }

    /**
     * 创建空黑板
     */
    static empty(): Blackboard {
        return new Blackboard();
    }
}
