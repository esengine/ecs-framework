import type { NodeTemplate } from '@esengine/behavior-tree';
import { Position, NodeType } from '../value-objects';
import { ValidationError } from '../errors';

/**
 * 行为树节点领域实体
 * 封装节点的业务逻辑和验证规则
 */
export class Node {
    private readonly _id: string;
    private readonly _template: NodeTemplate;
    private _data: Record<string, unknown>;
    private _position: Position;
    private _children: string[];
    private readonly _nodeType: NodeType;

    constructor(
        id: string,
        template: NodeTemplate,
        data: Record<string, unknown>,
        position: Position,
        children: string[] = []
    ) {
        this._id = id;
        this._template = template;
        this._data = { ...data };
        this._position = position;
        this._children = [...children];
        this._nodeType = NodeType.fromString(template.type);
    }

    get id(): string {
        return this._id;
    }

    get template(): NodeTemplate {
        return this._template;
    }

    get data(): Record<string, unknown> {
        return { ...this._data };
    }

    get position(): Position {
        return this._position;
    }

    get children(): ReadonlyArray<string> {
        return this._children;
    }

    get nodeType(): NodeType {
        return this._nodeType;
    }

    /**
     * 更新节点位置
     */
    moveToPosition(newPosition: Position): Node {
        return new Node(
            this._id,
            this._template,
            this._data,
            newPosition,
            this._children
        );
    }

    /**
     * 更新节点数据
     */
    updateData(data: Record<string, unknown>): Node {
        return new Node(
            this._id,
            this._template,
            { ...this._data, ...data },
            this._position,
            this._children
        );
    }

    /**
     * 添加子节点
     * @throws ValidationError 如果违反业务规则
     */
    addChild(childId: string): Node {
        // 使用模板定义的约束，undefined 表示无限制
        const maxChildren = (this._template.maxChildren ?? Infinity) as number;

        if (maxChildren === 0) {
            throw ValidationError.leafNodeNoChildren();
        }

        if (this._children.length >= maxChildren) {
            if (this._nodeType.isRoot()) {
                throw ValidationError.rootNodeMaxChildren();
            }
            if (this._nodeType.isDecorator()) {
                throw ValidationError.decoratorNodeMaxChildren();
            }
            throw new ValidationError(`节点 ${this._id} 已达到最大子节点数 ${maxChildren}`);
        }

        if (this._children.includes(childId)) {
            throw new ValidationError(`子节点 ${childId} 已存在`);
        }

        return new Node(
            this._id,
            this._template,
            this._data,
            this._position,
            [...this._children, childId]
        );
    }

    /**
     * 移除子节点
     */
    removeChild(childId: string): Node {
        return new Node(
            this._id,
            this._template,
            this._data,
            this._position,
            this._children.filter((id) => id !== childId)
        );
    }

    /**
     * 检查是否可以添加子节点
     */
    canAddChild(): boolean {
        // 使用模板定义的最大子节点数，undefined 表示无限制
        const maxChildren = (this._template.maxChildren ?? Infinity) as number;
        return this._children.length < maxChildren;
    }

    /**
     * 检查是否有子节点
     */
    hasChildren(): boolean {
        return this._children.length > 0;
    }

    /**
     * 检查是否为根节点
     */
    isRoot(): boolean {
        return this._nodeType.isRoot();
    }

    /**
     * 转换为普通对象（用于序列化）
     */
    toObject(): {
        id: string;
        template: NodeTemplate;
        data: Record<string, unknown>;
        position: { x: number; y: number };
        children: string[];
        } {
        return {
            id: this._id,
            template: this._template,
            data: this._data,
            position: this._position.toObject(),
            children: [...this._children]
        };
    }

    /**
     * 从普通对象创建节点
     */
    static fromObject(obj: {
        id: string;
        template: NodeTemplate;
        data: Record<string, unknown>;
        position: { x: number; y: number };
        children: string[];
    }): Node {
        return new Node(
            obj.id,
            obj.template,
            obj.data,
            Position.fromObject(obj.position),
            obj.children
        );
    }
}
