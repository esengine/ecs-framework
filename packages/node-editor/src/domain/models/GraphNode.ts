import { Position } from '../value-objects/Position';
import { Pin, PinDefinition } from './Pin';

/**
 * Node category determines the visual style of the node header
 * 节点类别决定节点头部的视觉样式
 */
export type NodeCategory =
    | 'event'        // Event node - triggers execution (事件节点 - 触发执行)
    | 'function'     // Function call node (函数调用节点)
    | 'pure'         // Pure function - no execution pins (纯函数 - 无执行引脚)
    | 'flow'         // Flow control - branch, loop, etc. (流程控制 - 分支、循环等)
    | 'variable'     // Variable get/set (变量读写)
    | 'literal'      // Literal value input (字面量输入)
    | 'comment'      // Comment node (注释节点)
    | 'custom';      // Custom category with user-defined color (自定义类别)

/**
 * Node template definition for creating nodes
 * 用于创建节点的节点模板定义
 */
export interface NodeTemplate {
    /** Unique template identifier (唯一模板标识符) */
    id: string;

    /** Display title (显示标题) */
    title: string;

    /** Optional subtitle (可选副标题) */
    subtitle?: string;

    /** Node category for styling (节点类别用于样式) */
    category: NodeCategory;

    /** Custom header color override (自定义头部颜色覆盖) */
    headerColor?: string;

    /** Icon name from icon library (图标库中的图标名称) */
    icon?: string;

    /** Input pin definitions (输入引脚定义) */
    inputPins: Omit<PinDefinition, 'direction'>[];

    /** Output pin definitions (输出引脚定义) */
    outputPins: Omit<PinDefinition, 'direction'>[];

    /** Whether the node can be collapsed (节点是否可折叠) */
    collapsible?: boolean;

    /** Whether to show the title bar (是否显示标题栏) */
    showHeader?: boolean;

    /** Minimum width in pixels (最小宽度，像素) */
    minWidth?: number;

    /** Category path for node palette (节点面板的分类路径) */
    path?: string[];

    /** Search keywords (搜索关键词) */
    keywords?: string[];

    /** Description for documentation (文档描述) */
    description?: string;
}

/**
 * GraphNode - Represents a node instance in the graph
 * 图节点 - 表示图中的节点实例
 */
export class GraphNode {
    private readonly _id: string;
    private readonly _templateId: string;
    private _position: Position;
    private readonly _category: NodeCategory;
    private readonly _title: string;
    private readonly _subtitle?: string;
    private readonly _icon?: string;
    private readonly _headerColor?: string;
    private readonly _inputPins: Pin[];
    private readonly _outputPins: Pin[];
    private _isCollapsed: boolean;
    private _comment?: string;
    private _data: Record<string, unknown>;

    constructor(
        id: string,
        template: NodeTemplate,
        position: Position,
        data: Record<string, unknown> = {}
    ) {
        this._id = id;
        this._templateId = template.id;
        this._position = position;
        this._category = template.category;
        this._title = template.title;
        this._subtitle = template.subtitle;
        this._icon = template.icon;
        this._headerColor = template.headerColor;
        this._isCollapsed = false;
        this._data = { ...data };

        // Create input pins (创建输入引脚)
        this._inputPins = template.inputPins.map((def, index) =>
            new Pin(
                `${id}_in_${index}`,
                id,
                { ...def, direction: 'input' }
            )
        );

        // Create output pins (创建输出引脚)
        this._outputPins = template.outputPins.map((def, index) =>
            new Pin(
                `${id}_out_${index}`,
                id,
                { ...def, direction: 'output' }
            )
        );
    }

    get id(): string {
        return this._id;
    }

    get templateId(): string {
        return this._templateId;
    }

    get position(): Position {
        return this._position;
    }

    get category(): NodeCategory {
        return this._category;
    }

    get title(): string {
        return this._title;
    }

    get subtitle(): string | undefined {
        return this._subtitle;
    }

    get icon(): string | undefined {
        return this._icon;
    }

    get headerColor(): string | undefined {
        return this._headerColor;
    }

    get inputPins(): readonly Pin[] {
        return this._inputPins;
    }

    get outputPins(): readonly Pin[] {
        return this._outputPins;
    }

    get allPins(): readonly Pin[] {
        return [...this._inputPins, ...this._outputPins];
    }

    get isCollapsed(): boolean {
        return this._isCollapsed;
    }

    get comment(): string | undefined {
        return this._comment;
    }

    get data(): Record<string, unknown> {
        return { ...this._data };
    }

    /**
     * Gets a pin by its ID
     * 通过ID获取引脚
     */
    getPin(pinId: string): Pin | undefined {
        return this.allPins.find(p => p.id === pinId);
    }

    /**
     * Gets a pin by its name
     * 通过名称获取引脚
     */
    getPinByName(name: string, direction: 'input' | 'output'): Pin | undefined {
        const pins = direction === 'input' ? this._inputPins : this._outputPins;
        return pins.find(p => p.name === name);
    }

    /**
     * Gets the execution input pin if exists
     * 获取执行输入引脚（如果存在）
     */
    getExecInput(): Pin | undefined {
        return this._inputPins.find(p => p.isExec);
    }

    /**
     * Gets all execution output pins
     * 获取所有执行输出引脚
     */
    getExecOutputs(): Pin[] {
        return this._outputPins.filter(p => p.isExec);
    }

    /**
     * Creates a new node with updated position (immutable)
     * 创建具有更新位置的新节点（不可变）
     */
    moveTo(newPosition: Position): GraphNode {
        const node = this.clone();
        node._position = newPosition;
        return node;
    }

    /**
     * Creates a new node with collapse state toggled (immutable)
     * 创建切换折叠状态的新节点（不可变）
     */
    toggleCollapse(): GraphNode {
        const node = this.clone();
        node._isCollapsed = !node._isCollapsed;
        return node;
    }

    /**
     * Creates a new node with updated comment (immutable)
     * 创建具有更新注释的新节点（不可变）
     */
    setComment(comment: string | undefined): GraphNode {
        const node = this.clone();
        node._comment = comment;
        return node;
    }

    /**
     * Creates a new node with updated data (immutable)
     * 创建具有更新数据的新节点（不可变）
     */
    updateData(data: Record<string, unknown>): GraphNode {
        const node = this.clone();
        node._data = { ...node._data, ...data };
        return node;
    }

    private clone(): GraphNode {
        const cloned = Object.create(GraphNode.prototype) as GraphNode;
        Object.assign(cloned, this);
        cloned._data = { ...this._data };
        return cloned;
    }

    toJSON(): Record<string, unknown> {
        return {
            id: this._id,
            templateId: this._templateId,
            position: this._position.toJSON(),
            isCollapsed: this._isCollapsed,
            comment: this._comment,
            data: this._data
        };
    }
}
