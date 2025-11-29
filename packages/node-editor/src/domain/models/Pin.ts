import { PinType, PinDirection, PinCategory, PinShape } from '../value-objects/PinType';

/**
 * Pin definition for node templates
 * 节点模板的引脚定义
 */
export interface PinDefinition {
    /** Unique identifier within the node (节点内的唯一标识符) */
    name: string;

    /** Display name shown in UI (UI中显示的名称) */
    displayName: string;

    /** Pin direction (引脚方向) */
    direction: PinDirection;

    /** Pin data type category (引脚数据类型分类) */
    category: PinCategory;

    /** Subtype for struct/enum (结构体/枚举的子类型) */
    subType?: string;

    /** Whether this pin accepts array type (是否接受数组类型) */
    isArray?: boolean;

    /** Default value when not connected (未连接时的默认值) */
    defaultValue?: unknown;

    /** Whether multiple connections are allowed (是否允许多个连接) */
    allowMultiple?: boolean;

    /** Whether this pin is hidden by default (是否默认隐藏) */
    hidden?: boolean;

    /** Custom color override (自定义颜色覆盖) */
    color?: string;
}

/**
 * Pin - Represents a connection point on a node
 * 引脚 - 表示节点上的连接点
 */
export class Pin {
    private readonly _id: string;
    private readonly _nodeId: string;
    private readonly _name: string;
    private readonly _displayName: string;
    private readonly _direction: PinDirection;
    private readonly _type: PinType;
    private readonly _defaultValue: unknown;
    private readonly _allowMultiple: boolean;
    private readonly _hidden: boolean;
    private readonly _color?: string;

    constructor(
        id: string,
        nodeId: string,
        definition: PinDefinition
    ) {
        this._id = id;
        this._nodeId = nodeId;
        this._name = definition.name;
        this._displayName = definition.displayName;
        this._direction = definition.direction;
        this._type = new PinType(
            definition.category,
            definition.subType,
            definition.isArray ?? false
        );
        this._defaultValue = definition.defaultValue;
        this._allowMultiple = definition.allowMultiple ?? (definition.category === 'exec' && definition.direction === 'output');
        this._hidden = definition.hidden ?? false;
        this._color = definition.color;
    }

    get id(): string {
        return this._id;
    }

    get nodeId(): string {
        return this._nodeId;
    }

    get name(): string {
        return this._name;
    }

    get displayName(): string {
        return this._displayName;
    }

    get direction(): PinDirection {
        return this._direction;
    }

    get type(): PinType {
        return this._type;
    }

    get category(): PinCategory {
        return this._type.category;
    }

    get shape(): PinShape {
        return this._type.shape;
    }

    get defaultValue(): unknown {
        return this._defaultValue;
    }

    /**
     * Whether multiple connections are allowed
     * 是否允许多个连接
     */
    get allowMultiple(): boolean {
        return this._allowMultiple;
    }

    get hidden(): boolean {
        return this._hidden;
    }

    get color(): string | undefined {
        return this._color;
    }

    /**
     * Whether this is an execution flow pin
     * 是否是执行流引脚
     */
    get isExec(): boolean {
        return this._type.category === 'exec';
    }

    /**
     * Whether this is an input pin
     * 是否是输入引脚
     */
    get isInput(): boolean {
        return this._direction === 'input';
    }

    /**
     * Whether this is an output pin
     * 是否是输出引脚
     */
    get isOutput(): boolean {
        return this._direction === 'output';
    }

    /**
     * Checks if this pin can connect to another pin
     * 检查此引脚是否可以连接到另一个引脚
     */
    canConnectTo(other: Pin): boolean {
        // Cannot connect to self (不能连接到自己)
        if (this._nodeId === other._nodeId) {
            return false;
        }

        // Must be opposite directions (必须是相反方向)
        if (this._direction === other._direction) {
            return false;
        }

        // Check type compatibility (检查类型兼容性)
        return this._type.canConnectTo(other._type);
    }

    toJSON(): PinDefinition & { id: string; nodeId: string } {
        return {
            id: this._id,
            nodeId: this._nodeId,
            name: this._name,
            displayName: this._displayName,
            direction: this._direction,
            category: this._type.category,
            subType: this._type.subType,
            isArray: this._type.isArray,
            defaultValue: this._defaultValue,
            allowMultiple: this._allowMultiple,
            hidden: this._hidden,
            color: this._color
        };
    }
}
