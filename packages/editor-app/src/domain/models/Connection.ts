import { ValidationError } from '../errors';

/**
 * 连接类型
 */
export type ConnectionType = 'node' | 'property';

/**
 * 连接领域实体
 * 表示两个节点之间的连接关系
 */
export class Connection {
    private readonly _from: string;
    private readonly _to: string;
    private readonly _fromProperty?: string;
    private readonly _toProperty?: string;
    private readonly _connectionType: ConnectionType;

    constructor(
        from: string,
        to: string,
        connectionType: ConnectionType = 'node',
        fromProperty?: string,
        toProperty?: string
    ) {
        if (from === to) {
            throw ValidationError.circularReference(from);
        }

        if (connectionType === 'property' && (!fromProperty || !toProperty)) {
            throw new ValidationError('属性连接必须指定源属性和目标属性');
        }

        this._from = from;
        this._to = to;
        this._connectionType = connectionType;
        this._fromProperty = fromProperty;
        this._toProperty = toProperty;
    }

    get from(): string {
        return this._from;
    }

    get to(): string {
        return this._to;
    }

    get fromProperty(): string | undefined {
        return this._fromProperty;
    }

    get toProperty(): string | undefined {
        return this._toProperty;
    }

    get connectionType(): ConnectionType {
        return this._connectionType;
    }

    /**
     * 检查是否为节点连接
     */
    isNodeConnection(): boolean {
        return this._connectionType === 'node';
    }

    /**
     * 检查是否为属性连接
     */
    isPropertyConnection(): boolean {
        return this._connectionType === 'property';
    }

    /**
     * 检查连接是否匹配指定的条件
     */
    matches(from: string, to: string, fromProperty?: string, toProperty?: string): boolean {
        if (this._from !== from || this._to !== to) {
            return false;
        }

        if (this._connectionType === 'property') {
            return this._fromProperty === fromProperty && this._toProperty === toProperty;
        }

        return true;
    }

    /**
     * 相等性比较
     */
    equals(other: Connection): boolean {
        return (
            this._from === other._from &&
            this._to === other._to &&
            this._connectionType === other._connectionType &&
            this._fromProperty === other._fromProperty &&
            this._toProperty === other._toProperty
        );
    }

    /**
     * 转换为普通对象
     */
    toObject(): {
        from: string;
        to: string;
        fromProperty?: string;
        toProperty?: string;
        connectionType: ConnectionType;
        } {
        return {
            from: this._from,
            to: this._to,
            connectionType: this._connectionType,
            ...(this._fromProperty && { fromProperty: this._fromProperty }),
            ...(this._toProperty && { toProperty: this._toProperty })
        };
    }

    /**
     * 从普通对象创建连接
     */
    static fromObject(obj: {
        from: string;
        to: string;
        fromProperty?: string;
        toProperty?: string;
        connectionType: ConnectionType;
    }): Connection {
        return new Connection(
            obj.from,
            obj.to,
            obj.connectionType,
            obj.fromProperty,
            obj.toProperty
        );
    }
}
