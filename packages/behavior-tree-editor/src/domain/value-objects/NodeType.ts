/**
 * 节点类型值对象
 * 封装节点类型的业务逻辑
 */
export class NodeType {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    get value(): string {
        return this._value;
    }

    /**
     * 是否为根节点
     */
    isRoot(): boolean {
        return this._value === 'root';
    }

    /**
     * 是否为组合节点（可以有多个子节点）
     */
    isComposite(): boolean {
        return this._value === 'composite' ||
               ['sequence', 'selector', 'parallel'].includes(this._value);
    }

    /**
     * 是否为装饰节点（只能有一个子节点）
     */
    isDecorator(): boolean {
        return this._value === 'decorator' ||
               ['repeater', 'inverter', 'succeeder', 'failer', 'until-fail', 'until-success'].includes(this._value);
    }

    /**
     * 是否为叶子节点（不能有子节点）
     */
    isLeaf(): boolean {
        return this._value === 'action' || this._value === 'condition' ||
               this._value.includes('action-') || this._value.includes('condition-');
    }

    /**
     * 获取允许的最大子节点数
     * @returns 0 表示叶子节点，1 表示装饰节点，Infinity 表示组合节点
     */
    getMaxChildren(): number {
        if (this.isLeaf()) {
            return 0;
        }
        if (this.isRoot() || this.isDecorator()) {
            return 1;
        }
        if (this.isComposite()) {
            return Infinity;
        }
        return 0;
    }

    /**
     * 值对象相等性比较
     */
    equals(other: NodeType): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }

    /**
     * 预定义的节点类型
     */
    static readonly ROOT = new NodeType('root');
    static readonly SEQUENCE = new NodeType('sequence');
    static readonly SELECTOR = new NodeType('selector');
    static readonly PARALLEL = new NodeType('parallel');
    static readonly REPEATER = new NodeType('repeater');
    static readonly INVERTER = new NodeType('inverter');
    static readonly SUCCEEDER = new NodeType('succeeder');
    static readonly FAILER = new NodeType('failer');
    static readonly UNTIL_FAIL = new NodeType('until-fail');
    static readonly UNTIL_SUCCESS = new NodeType('until-success');

    /**
     * 从字符串创建节点类型
     */
    static fromString(value: string): NodeType {
        switch (value) {
            case 'root': return NodeType.ROOT;
            case 'sequence': return NodeType.SEQUENCE;
            case 'selector': return NodeType.SELECTOR;
            case 'parallel': return NodeType.PARALLEL;
            case 'repeater': return NodeType.REPEATER;
            case 'inverter': return NodeType.INVERTER;
            case 'succeeder': return NodeType.SUCCEEDER;
            case 'failer': return NodeType.FAILER;
            case 'until-fail': return NodeType.UNTIL_FAIL;
            case 'until-success': return NodeType.UNTIL_SUCCESS;
            default: return new NodeType(value);
        }
    }
}
