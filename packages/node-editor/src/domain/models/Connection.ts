import { PinCategory } from '../value-objects/PinType';

/**
 * Connection - Represents a link between two pins
 * 连接 - 表示两个引脚之间的链接
 */
export class Connection {
    private readonly _id: string;
    private readonly _fromNodeId: string;
    private readonly _fromPinId: string;
    private readonly _toNodeId: string;
    private readonly _toPinId: string;
    private readonly _category: PinCategory;

    constructor(
        id: string,
        fromNodeId: string,
        fromPinId: string,
        toNodeId: string,
        toPinId: string,
        category: PinCategory
    ) {
        this._id = id;
        this._fromNodeId = fromNodeId;
        this._fromPinId = fromPinId;
        this._toNodeId = toNodeId;
        this._toPinId = toPinId;
        this._category = category;
    }

    get id(): string {
        return this._id;
    }

    /**
     * Source node ID (output side)
     * 源节点ID（输出端）
     */
    get fromNodeId(): string {
        return this._fromNodeId;
    }

    /**
     * Source pin ID (output side)
     * 源引脚ID（输出端）
     */
    get fromPinId(): string {
        return this._fromPinId;
    }

    /**
     * Target node ID (input side)
     * 目标节点ID（输入端）
     */
    get toNodeId(): string {
        return this._toNodeId;
    }

    /**
     * Target pin ID (input side)
     * 目标引脚ID（输入端）
     */
    get toPinId(): string {
        return this._toPinId;
    }

    /**
     * Connection category determines the wire color
     * 连接类别决定连线颜色
     */
    get category(): PinCategory {
        return this._category;
    }

    /**
     * Whether this is an execution flow connection
     * 是否是执行流连接
     */
    get isExec(): boolean {
        return this._category === 'exec';
    }

    /**
     * Checks if this connection involves a specific node
     * 检查此连接是否涉及特定节点
     */
    involvesNode(nodeId: string): boolean {
        return this._fromNodeId === nodeId || this._toNodeId === nodeId;
    }

    /**
     * Checks if this connection involves a specific pin
     * 检查此连接是否涉及特定引脚
     */
    involvesPin(pinId: string): boolean {
        return this._fromPinId === pinId || this._toPinId === pinId;
    }

    /**
     * Checks if this connection matches the given endpoints
     * 检查此连接是否匹配给定的端点
     */
    matches(fromPinId: string, toPinId: string): boolean {
        return this._fromPinId === fromPinId && this._toPinId === toPinId;
    }

    /**
     * Checks equality with another connection
     * 检查与另一个连接是否相等
     */
    equals(other: Connection): boolean {
        return (
            this._fromNodeId === other._fromNodeId &&
            this._fromPinId === other._fromPinId &&
            this._toNodeId === other._toNodeId &&
            this._toPinId === other._toPinId
        );
    }

    toJSON(): Record<string, unknown> {
        return {
            id: this._id,
            fromNodeId: this._fromNodeId,
            fromPinId: this._fromPinId,
            toNodeId: this._toNodeId,
            toPinId: this._toPinId,
            category: this._category
        };
    }

    static fromJSON(json: {
        id: string;
        fromNodeId: string;
        fromPinId: string;
        toNodeId: string;
        toPinId: string;
        category: PinCategory;
    }): Connection {
        return new Connection(
            json.id,
            json.fromNodeId,
            json.fromPinId,
            json.toNodeId,
            json.toPinId,
            json.category
        );
    }

    /**
     * Creates a connection ID from pin IDs
     * 从引脚ID创建连接ID
     */
    static createId(fromPinId: string, toPinId: string): string {
        return `${fromPinId}->${toPinId}`;
    }
}
