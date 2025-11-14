import { Node } from './Node';
import { Connection } from './Connection';
import { Blackboard } from './Blackboard';
import { ValidationError, NodeNotFoundError } from '../errors';

/**
 * 行为树聚合根
 * 管理整个行为树的节点、连接和黑板
 */
export class BehaviorTree {
    private readonly _nodes: Map<string, Node>;
    private readonly _connections: Connection[];
    private readonly _blackboard: Blackboard;
    private readonly _rootNodeId: string | null;

    constructor(
        nodes: Node[] = [],
        connections: Connection[] = [],
        blackboard: Blackboard = Blackboard.empty(),
        rootNodeId: string | null = null
    ) {
        this._nodes = new Map(nodes.map((node) => [node.id, node]));
        this._connections = [...connections];
        this._blackboard = blackboard;
        this._rootNodeId = rootNodeId;

        this.validateTree();
    }

    get nodes(): ReadonlyArray<Node> {
        return Array.from(this._nodes.values());
    }

    get connections(): ReadonlyArray<Connection> {
        return this._connections;
    }

    get blackboard(): Blackboard {
        return this._blackboard;
    }

    get rootNodeId(): string | null {
        return this._rootNodeId;
    }

    /**
     * 获取指定节点
     */
    getNode(nodeId: string): Node {
        const node = this._nodes.get(nodeId);
        if (!node) {
            throw new NodeNotFoundError(nodeId);
        }
        return node;
    }

    /**
     * 检查节点是否存在
     */
    hasNode(nodeId: string): boolean {
        return this._nodes.has(nodeId);
    }

    /**
     * 添加节点
     */
    addNode(node: Node): BehaviorTree {
        if (this._nodes.has(node.id)) {
            throw new ValidationError(`节点 ${node.id} 已存在`);
        }

        if (node.isRoot()) {
            if (this._rootNodeId) {
                throw new ValidationError('行为树只能有一个根节点');
            }
            return new BehaviorTree(
                [...this.nodes, node],
                this._connections,
                this._blackboard,
                node.id
            );
        }

        return new BehaviorTree(
            [...this.nodes, node],
            this._connections,
            this._blackboard,
            this._rootNodeId
        );
    }

    /**
     * 移除节点
     * 会同时移除相关的连接
     */
    removeNode(nodeId: string): BehaviorTree {
        if (!this._nodes.has(nodeId)) {
            throw new NodeNotFoundError(nodeId);
        }

        const node = this.getNode(nodeId);
        const newNodes = Array.from(this.nodes.filter((n) => n.id !== nodeId));
        const newConnections = this._connections.filter(
            (conn) => conn.from !== nodeId && conn.to !== nodeId
        );

        const newRootNodeId = node.isRoot() ? null : this._rootNodeId;

        return new BehaviorTree(
            newNodes,
            newConnections,
            this._blackboard,
            newRootNodeId
        );
    }

    /**
     * 更新节点
     */
    updateNode(nodeId: string, updater: (node: Node) => Node): BehaviorTree {
        const node = this.getNode(nodeId);
        const updatedNode = updater(node);

        const newNodes = Array.from(this.nodes.map((n) => n.id === nodeId ? updatedNode : n));

        return new BehaviorTree(
            newNodes,
            this._connections,
            this._blackboard,
            this._rootNodeId
        );
    }

    /**
     * 添加连接
     * 会验证连接的合法性
     */
    addConnection(connection: Connection): BehaviorTree {
        const fromNode = this.getNode(connection.from);
        const toNode = this.getNode(connection.to);

        if (this.hasConnection(connection.from, connection.to)) {
            throw new ValidationError(`连接已存在：${connection.from} -> ${connection.to}`);
        }

        if (this.wouldCreateCycle(connection.from, connection.to)) {
            throw ValidationError.circularReference(connection.to);
        }

        if (connection.isNodeConnection()) {
            if (!fromNode.canAddChild()) {
                if (fromNode.isRoot()) {
                    throw ValidationError.rootNodeMaxChildren();
                }
                if (fromNode.nodeType.isDecorator()) {
                    throw ValidationError.decoratorNodeMaxChildren();
                }
                throw new ValidationError(`节点 ${connection.from} 无法添加更多子节点`);
            }

            if (toNode.nodeType.getMaxChildren() === 0 && toNode.nodeType.isLeaf()) {
            }

            const updatedFromNode = fromNode.addChild(connection.to);
            const newNodes = Array.from(this.nodes.map((n) =>
                n.id === connection.from ? updatedFromNode : n
            ));

            return new BehaviorTree(
                newNodes,
                [...this._connections, connection],
                this._blackboard,
                this._rootNodeId
            );
        }

        return new BehaviorTree(
            Array.from(this.nodes),
            [...this._connections, connection],
            this._blackboard,
            this._rootNodeId
        );
    }

    /**
     * 移除连接
     */
    removeConnection(from: string, to: string, fromProperty?: string, toProperty?: string): BehaviorTree {
        const connection = this._connections.find((c) => c.matches(from, to, fromProperty, toProperty));

        if (!connection) {
            throw new ValidationError(`连接不存在：${from} -> ${to}`);
        }

        const newConnections = this._connections.filter((c) => !c.matches(from, to, fromProperty, toProperty));

        if (connection.isNodeConnection()) {
            const fromNode = this.getNode(from);
            const updatedFromNode = fromNode.removeChild(to);
            const newNodes = Array.from(this.nodes.map((n) =>
                n.id === from ? updatedFromNode : n
            ));

            return new BehaviorTree(
                newNodes,
                newConnections,
                this._blackboard,
                this._rootNodeId
            );
        }

        return new BehaviorTree(
            Array.from(this.nodes),
            newConnections,
            this._blackboard,
            this._rootNodeId
        );
    }

    /**
     * 检查是否存在连接
     */
    hasConnection(from: string, to: string): boolean {
        return this._connections.some((c) => c.from === from && c.to === to);
    }

    /**
     * 检查是否会创建循环引用
     */
    private wouldCreateCycle(from: string, to: string): boolean {
        const visited = new Set<string>();
        const queue: string[] = [to];

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current === from) {
                return true;
            }

            if (visited.has(current)) {
                continue;
            }

            visited.add(current);

            const childConnections = this._connections.filter((c) => c.from === current && c.isNodeConnection());
            childConnections.forEach((conn) => queue.push(conn.to));
        }

        return false;
    }

    /**
     * 更新黑板
     */
    updateBlackboard(updater: (blackboard: Blackboard) => Blackboard): BehaviorTree {
        return new BehaviorTree(
            Array.from(this.nodes),
            this._connections,
            updater(this._blackboard),
            this._rootNodeId
        );
    }

    /**
     * 获取节点的子节点
     */
    getChildren(nodeId: string): Node[] {
        const node = this.getNode(nodeId);
        return node.children.map((childId) => this.getNode(childId));
    }

    /**
     * 获取节点的父节点
     */
    getParent(nodeId: string): Node | null {
        const parentConnection = this._connections.find(
            (c) => c.to === nodeId && c.isNodeConnection()
        );

        if (!parentConnection) {
            return null;
        }

        return this.getNode(parentConnection.from);
    }

    /**
     * 验证树的完整性
     */
    private validateTree(): void {
        const rootNodes = this.nodes.filter((n) => n.isRoot());

        if (rootNodes.length > 1) {
            throw new ValidationError('行为树只能有一个根节点');
        }

        if (rootNodes.length === 1 && rootNodes[0] && this._rootNodeId !== rootNodes[0].id) {
            throw new ValidationError('根节点ID不匹配');
        }

        this._connections.forEach((conn) => {
            if (!this._nodes.has(conn.from)) {
                throw new NodeNotFoundError(conn.from);
            }
            if (!this._nodes.has(conn.to)) {
                throw new NodeNotFoundError(conn.to);
            }
        });
    }

    /**
     * 转换为普通对象
     */
    toObject(): {
        nodes: ReturnType<Node['toObject']>[];
        connections: ReturnType<Connection['toObject']>[];
        blackboard: Record<string, unknown>;
        rootNodeId: string | null;
        } {
        return {
            nodes: this.nodes.map((n) => n.toObject()),
            connections: this._connections.map((c) => c.toObject()),
            blackboard: this._blackboard.toObject(),
            rootNodeId: this._rootNodeId
        };
    }

    /**
     * 从普通对象创建行为树
     */
    static fromObject(obj: {
        nodes: Parameters<typeof Node.fromObject>[0][];
        connections: Parameters<typeof Connection.fromObject>[0][];
        blackboard: Record<string, unknown>;
        rootNodeId: string | null;
    }): BehaviorTree {
        return new BehaviorTree(
            obj.nodes.map((n) => Node.fromObject(n)),
            obj.connections.map((c) => Connection.fromObject(c)),
            Blackboard.fromObject(obj.blackboard),
            obj.rootNodeId
        );
    }

    /**
     * 创建空行为树
     */
    static empty(): BehaviorTree {
        return new BehaviorTree();
    }
}
