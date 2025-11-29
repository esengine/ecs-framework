import { GraphNode } from './GraphNode';
import { Connection } from './Connection';
import { Pin } from './Pin';
import { Position } from '../value-objects/Position';

/**
 * Graph - Aggregate root for the node graph
 * 图 - 节点图的聚合根
 *
 * This class is immutable - all modification methods return new instances.
 * 此类是不可变的 - 所有修改方法返回新实例
 */
export class Graph {
    private readonly _id: string;
    private readonly _name: string;
    private readonly _nodes: Map<string, GraphNode>;
    private readonly _connections: Connection[];
    private readonly _metadata: Record<string, unknown>;

    constructor(
        id: string,
        name: string,
        nodes: GraphNode[] = [],
        connections: Connection[] = [],
        metadata: Record<string, unknown> = {}
    ) {
        this._id = id;
        this._name = name;
        this._nodes = new Map(nodes.map(n => [n.id, n]));
        this._connections = [...connections];
        this._metadata = { ...metadata };
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get nodes(): GraphNode[] {
        return Array.from(this._nodes.values());
    }

    get connections(): Connection[] {
        return [...this._connections];
    }

    get metadata(): Record<string, unknown> {
        return { ...this._metadata };
    }

    get nodeCount(): number {
        return this._nodes.size;
    }

    get connectionCount(): number {
        return this._connections.length;
    }

    /**
     * Gets a node by ID
     * 通过ID获取节点
     */
    getNode(nodeId: string): GraphNode | undefined {
        return this._nodes.get(nodeId);
    }

    /**
     * Gets a pin by its full ID
     * 通过完整ID获取引脚
     */
    getPin(pinId: string): Pin | undefined {
        for (const node of this._nodes.values()) {
            const pin = node.getPin(pinId);
            if (pin) return pin;
        }
        return undefined;
    }

    /**
     * Gets all connections involving a node
     * 获取涉及某节点的所有连接
     */
    getNodeConnections(nodeId: string): Connection[] {
        return this._connections.filter(c => c.involvesNode(nodeId));
    }

    /**
     * Gets all connections to/from a specific pin
     * 获取特定引脚的所有连接
     */
    getPinConnections(pinId: string): Connection[] {
        return this._connections.filter(c => c.involvesPin(pinId));
    }

    /**
     * Checks if a pin is connected
     * 检查引脚是否已连接
     */
    isPinConnected(pinId: string): boolean {
        return this._connections.some(c => c.involvesPin(pinId));
    }

    /**
     * Adds a new node to the graph (immutable)
     * 向图中添加新节点（不可变）
     */
    addNode(node: GraphNode): Graph {
        if (this._nodes.has(node.id)) {
            throw new Error(`Node with ID "${node.id}" already exists`);
        }
        const newNodes = [...this.nodes, node];
        return new Graph(this._id, this._name, newNodes, this._connections, this._metadata);
    }

    /**
     * Removes a node and its connections (immutable)
     * 移除节点及其连接（不可变）
     */
    removeNode(nodeId: string): Graph {
        if (!this._nodes.has(nodeId)) {
            return this;
        }
        const newNodes = this.nodes.filter(n => n.id !== nodeId);
        const newConnections = this._connections.filter(c => !c.involvesNode(nodeId));
        return new Graph(this._id, this._name, newNodes, newConnections, this._metadata);
    }

    /**
     * Updates a node (immutable)
     * 更新节点（不可变）
     */
    updateNode(nodeId: string, updater: (node: GraphNode) => GraphNode): Graph {
        const node = this._nodes.get(nodeId);
        if (!node) return this;

        const updatedNode = updater(node);
        const newNodes = this.nodes.map(n => n.id === nodeId ? updatedNode : n);
        return new Graph(this._id, this._name, newNodes, this._connections, this._metadata);
    }

    /**
     * Moves a node to a new position (immutable)
     * 移动节点到新位置（不可变）
     */
    moveNode(nodeId: string, newPosition: Position): Graph {
        return this.updateNode(nodeId, node => node.moveTo(newPosition));
    }

    /**
     * Adds a connection between two pins (immutable)
     * 在两个引脚之间添加连接（不可变）
     */
    addConnection(connection: Connection): Graph {
        // Validate connection
        // 验证连接
        const fromPin = this.getPin(connection.fromPinId);
        const toPin = this.getPin(connection.toPinId);

        if (!fromPin || !toPin) {
            throw new Error('Invalid connection: pin not found');
        }

        if (!fromPin.canConnectTo(toPin)) {
            throw new Error('Invalid connection: incompatible pin types');
        }

        // Check for duplicate connections
        // 检查重复连接
        const exists = this._connections.some(c =>
            c.matches(connection.fromPinId, connection.toPinId)
        );
        if (exists) {
            return this;
        }

        // Remove existing connection to input pin if it doesn't allow multiple
        // 如果输入引脚不允许多连接，移除现有连接
        let newConnections = [...this._connections];
        if (!toPin.allowMultiple) {
            newConnections = newConnections.filter(c => c.toPinId !== connection.toPinId);
        }

        newConnections.push(connection);
        return new Graph(this._id, this._name, this.nodes, newConnections, this._metadata);
    }

    /**
     * Removes a connection (immutable)
     * 移除连接（不可变）
     */
    removeConnection(connectionId: string): Graph {
        const newConnections = this._connections.filter(c => c.id !== connectionId);
        if (newConnections.length === this._connections.length) {
            return this;
        }
        return new Graph(this._id, this._name, this.nodes, newConnections, this._metadata);
    }

    /**
     * Removes all connections to/from a pin (immutable)
     * 移除引脚的所有连接（不可变）
     */
    disconnectPin(pinId: string): Graph {
        const newConnections = this._connections.filter(c => !c.involvesPin(pinId));
        if (newConnections.length === this._connections.length) {
            return this;
        }
        return new Graph(this._id, this._name, this.nodes, newConnections, this._metadata);
    }

    /**
     * Updates graph metadata (immutable)
     * 更新图元数据（不可变）
     */
    setMetadata(metadata: Record<string, unknown>): Graph {
        return new Graph(this._id, this._name, this.nodes, this._connections, {
            ...this._metadata,
            ...metadata
        });
    }

    /**
     * Creates a new graph with updated name (immutable)
     * 创建具有更新名称的新图（不可变）
     */
    rename(newName: string): Graph {
        return new Graph(this._id, newName, this.nodes, this._connections, this._metadata);
    }

    /**
     * Validates the graph structure
     * 验证图结构
     */
    validate(): string[] {
        const errors: string[] = [];

        // Check for orphan connections
        // 检查孤立连接
        for (const conn of this._connections) {
            if (!this.getPin(conn.fromPinId)) {
                errors.push(`Connection "${conn.id}" references non-existent source pin`);
            }
            if (!this.getPin(conn.toPinId)) {
                errors.push(`Connection "${conn.id}" references non-existent target pin`);
            }
        }

        return errors;
    }

    toJSON(): Record<string, unknown> {
        return {
            id: this._id,
            name: this._name,
            nodes: this.nodes.map(n => n.toJSON()),
            connections: this._connections.map(c => c.toJSON()),
            metadata: this._metadata
        };
    }

    /**
     * Creates an empty graph
     * 创建空图
     */
    static empty(id: string, name: string): Graph {
        return new Graph(id, name, [], [], {});
    }
}
