import { makeAutoObservable, action, computed, reaction, runInAction } from 'mobx';
import { NodeTemplate } from '@esengine/behavior-tree';
import { BehaviorTree } from '../domain/models/BehaviorTree';
import { Node } from '../domain/models/Node';
import { Connection } from '../domain/models/Connection';
import { Blackboard, BlackboardValue } from '../domain/models/Blackboard';
import { Position } from '../domain/value-objects/Position';
import { createRootNode, createRootNodeTemplate, ROOT_NODE_ID } from '../domain/constants/RootNode';
import { NodeFactory } from '../infrastructure/factories/NodeFactory';
import { TreeValidator } from '../domain/services/TreeValidator';
import { CommandManager } from '@esengine/editor-core';
import { TreeStateAdapter } from '../application/state/BehaviorTreeDataStore';
import { CreateNodeUseCase } from '../application/use-cases/CreateNodeUseCase';
import { DeleteNodeUseCase } from '../application/use-cases/DeleteNodeUseCase';
import { MoveNodeUseCase } from '../application/use-cases/MoveNodeUseCase';
import { UpdateNodeDataUseCase } from '../application/use-cases/UpdateNodeDataUseCase';
import { AddConnectionUseCase } from '../application/use-cases/AddConnectionUseCase';
import { RemoveConnectionUseCase } from '../application/use-cases/RemoveConnectionUseCase';
import { ConnectionType } from '../domain/models/Connection';
import { ExecutionController, ExecutionMode } from '../application/services/ExecutionController';
import { ExecutionLog } from '../utils/BehaviorTreeExecutor';
import { BehaviorTreeNode, Connection as StoreConnection } from '../stores';
import type { Breakpoint } from '../types/Breakpoint';

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';

const createInitialTree = (): BehaviorTree => {
    const rootNode = createRootNode();
    return new BehaviorTree([rootNode], [], Blackboard.empty(), ROOT_NODE_ID);
};

export class BehaviorTreeEditorViewModel {
    tree: BehaviorTree = createInitialTree();
    isOpen = false;
    blackboardVariables: Record<string, BlackboardValue> = {};
    initialBlackboardVariables: Record<string, BlackboardValue> = {};
    initialNodesData = new Map<string, Record<string, unknown>>();
    isExecuting = false;
    nodeExecutionStatuses = new Map<string, NodeExecutionStatus>();
    nodeExecutionOrders = new Map<string, number>();

    executionMode: ExecutionMode = 'idle';
    executionLogs: ExecutionLog[] = [];
    tickCount = 0;
    executionSpeed = 1.0;
    breakpoints = new Map<string, Breakpoint>();
    projectPath: string | null = null;

    canvasOffset = { x: 0, y: 0 };
    canvasScale = 1;

    selectedNodeIds: string[] = [];
    selectedConnection: { from: string; to: string } | null = null;
    draggingNodeId: string | null = null;
    dragStartPositions = new Map<string, { x: number; y: number }>();
    isDraggingNode = false;
    dragDelta = { dx: 0, dy: 0 };
    tempCanvasOffset: { x: number; y: number } | null = null;
    isPanning = false;
    panStart = { x: 0, y: 0 };
    connectingFrom: string | null = null;
    connectingFromProperty: string | null = null;
    connectingToPos: { x: number; y: number } | null = null;
    isBoxSelecting = false;
    boxSelectStart: { x: number; y: number } | null = null;
    boxSelectEnd: { x: number; y: number } | null = null;

    blackboardCollapsed = false;

    canvasElement: HTMLDivElement | null = null;

    private nodeFactory: NodeFactory;
    private validator: TreeValidator;
    private commandManager: CommandManager;
    private treeState: TreeStateAdapter;
    private executionController: ExecutionController | null = null;

    private createNodeUseCase: CreateNodeUseCase;
    private deleteNodeUseCase: DeleteNodeUseCase;
    private moveNodeUseCase: MoveNodeUseCase;
    private updateNodeDataUseCase: UpdateNodeDataUseCase;
    private addConnectionUseCase: AddConnectionUseCase;
    private removeConnectionUseCase: RemoveConnectionUseCase;

    constructor() {
        makeAutoObservable(this, {
            canvasElement: false,
            executionController: false
        } as any);

        this.nodeFactory = new NodeFactory();
        this.validator = new TreeValidator();
        this.commandManager = new CommandManager();
        this.treeState = this.createTreeStateAdapter();

        this.createNodeUseCase = new CreateNodeUseCase(this.nodeFactory, this.commandManager, this.treeState);
        this.deleteNodeUseCase = new DeleteNodeUseCase(this.commandManager, this.treeState);
        this.moveNodeUseCase = new MoveNodeUseCase(this.commandManager, this.treeState);
        this.updateNodeDataUseCase = new UpdateNodeDataUseCase(this.commandManager, this.treeState);
        this.addConnectionUseCase = new AddConnectionUseCase(this.commandManager, this.treeState, this.validator);
        this.removeConnectionUseCase = new RemoveConnectionUseCase(this.commandManager, this.treeState);

        this.initializeExecutionController();
        this.setupReactions();
    }

    private initializeExecutionController(): void {
        this.executionController = new ExecutionController({
            rootNodeId: ROOT_NODE_ID,
            projectPath: this.projectPath,
            onLogsUpdate: action((logs: ExecutionLog[]) => {
                this.executionLogs = logs;
            }),
            onBlackboardUpdate: action((variables: Record<string, BlackboardValue>) => {
                this.blackboardVariables = variables;
            }),
            onTickCountUpdate: action((count: number) => {
                this.tickCount = count;
            }),
            onExecutionStatusUpdate: action((statuses: Map<string, NodeExecutionStatus>, orders: Map<string, number>) => {
                this.nodeExecutionStatuses = new Map(statuses);
                this.nodeExecutionOrders = new Map(orders);
            }),
            onBreakpointHit: action((nodeId: string, nodeName: string) => {
                console.log(`Breakpoint hit: ${nodeName} (${nodeId})`);
                this.executionMode = 'paused';
            })
        });

        this.executionController.setBreakpointCallback((nodeId: string, nodeName: string) => {
            runInAction(() => {
                console.log(`Breakpoint triggered: ${nodeName}`);
            });
        });
    }

    private createTreeStateAdapter(): TreeStateAdapter {
        const self = this;
        return {
            getTree: () => self.tree,
            setTree: action((tree: BehaviorTree) => {
                self.tree = tree;
            })
        } as TreeStateAdapter;
    }

    private setupReactions(): void {
        reaction(
            () => this.isBoxSelecting,
            (isSelecting) => {
                if (!isSelecting) {
                }
            }
        );

        reaction(
            () => this.isExecuting,
            (executing) => {
                if (!executing) {
                    this.clearNodeExecutionStatuses();
                }
            }
        );
    }

    @computed
    get nodes(): readonly Node[] {
        return this.tree.nodes;
    }

    @computed
    get connections(): readonly Connection[] {
        return this.tree.connections;
    }

    @computed
    get canUndo(): boolean {
        return this.commandManager.canUndo();
    }

    @computed
    get canRedo(): boolean {
        return this.commandManager.canRedo();
    }

    @computed
    get selectedNodes(): readonly Node[] {
        return this.nodes.filter(n => this.selectedNodeIds.includes(n.id));
    }

    @computed
    get hasSelection(): boolean {
        return this.selectedNodeIds.length > 0;
    }

    @computed
    get isConnecting(): boolean {
        return this.connectingFrom !== null;
    }

    @action
    undo(): void {
        if (this.canUndo) {
            this.commandManager.undo();
        }
    }

    @action
    redo(): void {
        if (this.canRedo) {
            this.commandManager.redo();
        }
    }

    @action
    createNode(template: NodeTemplate, position: Position, data?: Record<string, unknown>): Node {
        return this.createNodeUseCase.execute(template, position, data);
    }

    @action
    deleteNode(nodeId: string): void {
        this.deleteNodeUseCase.execute(nodeId);
        this.selectedNodeIds = this.selectedNodeIds.filter(id => id !== nodeId);
    }

    @action
    deleteSelectedNodes(): void {
        if (this.selectedNodeIds.length > 0) {
            this.deleteNodeUseCase.executeBatch([...this.selectedNodeIds]);
            this.selectedNodeIds = [];
        }
    }

    @action
    moveNode(nodeId: string, position: Position): void {
        this.moveNodeUseCase.execute(nodeId, position);
    }

    @action
    moveNodes(moves: Array<{ nodeId: string; position: Position }>): void {
        this.moveNodeUseCase.executeBatch(moves);
    }

    @action
    updateNodeData(nodeId: string, data: Record<string, unknown>): void {
        this.updateNodeDataUseCase.execute(nodeId, data);
    }

    @action
    addConnection(from: string, to: string, connectionType: ConnectionType = 'node', fromProperty?: string, toProperty?: string): Connection {
        return this.addConnectionUseCase.execute(from, to, connectionType, fromProperty, toProperty);
    }

    @action
    removeConnection(from: string, to: string, fromProperty?: string, toProperty?: string): void {
        this.removeConnectionUseCase.execute(from, to, fromProperty, toProperty);
    }

    // 选择操作
    @action
    selectNode(nodeId: string, addToSelection = false): void {
        if (addToSelection) {
            if (!this.selectedNodeIds.includes(nodeId)) {
                this.selectedNodeIds.push(nodeId);
            }
        } else {
            this.selectedNodeIds = [nodeId];
        }
        this.selectedConnection = null;
    }

    @action
    selectNodes(nodeIds: string[]): void {
        this.selectedNodeIds = [...nodeIds];
        this.selectedConnection = null;
    }

    @action
    toggleNodeSelection(nodeId: string): void {
        const index = this.selectedNodeIds.indexOf(nodeId);
        if (index >= 0) {
            this.selectedNodeIds.splice(index, 1);
        } else {
            this.selectedNodeIds.push(nodeId);
        }
    }

    @action
    clearSelection(): void {
        this.selectedNodeIds = [];
        this.selectedConnection = null;
    }

    @action
    selectConnection(from: string, to: string): void {
        this.selectedConnection = { from, to };
        this.selectedNodeIds = [];
    }

    // 拖拽操作
    @action
    startDragging(nodeId: string, startPositions: Map<string, { x: number; y: number }>): void {
        this.draggingNodeId = nodeId;
        this.dragStartPositions = startPositions;
        this.isDraggingNode = true;
    }

    @action
    updateDragDelta(dx: number, dy: number): void {
        this.dragDelta = { dx, dy };
    }

    @action
    stopDragging(): void {
        this.draggingNodeId = null;
        this.dragStartPositions.clear();
        this.isDraggingNode = false;
        this.dragDelta = { dx: 0, dy: 0 };
    }

    // 画布操作
    @action
    setCanvasOffset(offset: { x: number; y: number }): void {
        this.canvasOffset = offset;
    }

    @action
    setCanvasScale(scale: number): void {
        this.canvasScale = Math.max(0.1, Math.min(3, scale));
    }

    @action
    startPanning(x: number, y: number): void {
        this.isPanning = true;
        this.panStart = { x, y };
        this.tempCanvasOffset = { ...this.canvasOffset };
    }

    @action
    updatePanning(x: number, y: number): void {
        if (this.isPanning && this.tempCanvasOffset) {
            const dx = x - this.panStart.x;
            const dy = y - this.panStart.y;
            this.canvasOffset = {
                x: this.tempCanvasOffset.x + dx,
                y: this.tempCanvasOffset.y + dy
            };
        }
    }

    @action
    stopPanning(): void {
        this.isPanning = false;
        this.tempCanvasOffset = null;
    }

    @action
    resetView(): void {
        this.canvasOffset = { x: 0, y: 0 };
        this.canvasScale = 1;
    }

    // 连接操作
    @action
    startConnecting(nodeId: string, propertyName?: string): void {
        this.connectingFrom = nodeId;
        this.connectingFromProperty = propertyName || null;
    }

    @action
    updateConnectingPosition(x: number, y: number): void {
        this.connectingToPos = { x, y };
    }

    @action
    clearConnecting(): void {
        this.connectingFrom = null;
        this.connectingFromProperty = null;
        this.connectingToPos = null;
    }

    // 框选操作
    @action
    startBoxSelect(x: number, y: number): void {
        this.isBoxSelecting = true;
        this.boxSelectStart = { x, y };
        this.boxSelectEnd = { x, y };
    }

    @action
    updateBoxSelect(x: number, y: number): void {
        this.boxSelectEnd = { x, y };
    }

    @action
    endBoxSelect(): void {
        this.isBoxSelecting = false;
        this.boxSelectStart = null;
        this.boxSelectEnd = null;
    }

    // 黑板操作
    @action
    setBlackboardVariables(variables: Record<string, BlackboardValue>): void {
        this.blackboardVariables = variables;
    }

    @action
    updateBlackboardVariable(name: string, value: BlackboardValue): void {
        this.blackboardVariables = {
            ...this.blackboardVariables,
            [name]: value
        };
    }

    @action
    setInitialBlackboardVariables(variables: Record<string, BlackboardValue>): void {
        this.initialBlackboardVariables = variables;
    }

    // 执行状态
    @action
    setIsExecuting(executing: boolean): void {
        this.isExecuting = executing;
    }

    @action
    updateNodeExecutionStatuses(statuses: Map<string, NodeExecutionStatus>, orders?: Map<string, number>): void {
        this.nodeExecutionStatuses = new Map(statuses);
        if (orders) {
            this.nodeExecutionOrders = new Map(orders);
        }
    }

    @action
    clearNodeExecutionStatuses(): void {
        this.nodeExecutionStatuses.clear();
        this.nodeExecutionOrders.clear();
    }

    @action
    async startExecution(): Promise<void> {
        if (!this.executionController || this.executionMode === 'running') {
            return;
        }

        this.saveNodesDataSnapshot();
        this.sortChildrenByPosition();

        const storeNodes = this.convertToStoreNodes();
        const storeConnections = this.convertToStoreConnections();

        this.isExecuting = true;
        this.executionMode = 'running';
        this.executionLogs = [];
        this.tickCount = 0;

        await this.executionController.play(
            storeNodes,
            { ...this.initialBlackboardVariables },
            storeConnections
        );
    }

    @action
    async pauseExecution(): Promise<void> {
        if (!this.executionController) return;

        await this.executionController.pause();
        this.executionMode = this.executionController.getMode();
    }

    @action
    async stopExecution(): Promise<void> {
        if (!this.executionController) return;

        await this.executionController.stop();
        this.isExecuting = false;
        this.executionMode = 'idle';
        this.executionLogs = [];
        this.tickCount = 0;
        this.clearNodeExecutionStatuses();
        this.restoreNodesData();
    }

    @action
    async resetExecution(): Promise<void> {
        if (!this.executionController) return;

        await this.executionController.reset();
        this.isExecuting = false;
        this.executionMode = 'idle';
        this.executionLogs = [];
        this.tickCount = 0;
        this.clearNodeExecutionStatuses();
    }

    @action
    setExecutionSpeed(speed: number): void {
        this.executionSpeed = speed;
        if (this.executionController) {
            this.executionController.setSpeed(speed);
        }
    }

    @action
    setProjectPath(path: string | null): void {
        this.projectPath = path;
    }

    @action
    addBreakpoint(nodeId: string): void {
        if (!this.breakpoints.has(nodeId)) {
            this.breakpoints.set(nodeId, {
                nodeId,
                enabled: true
            });
            this.syncBreakpointsToController();
        }
    }

    @action
    removeBreakpoint(nodeId: string): void {
        this.breakpoints.delete(nodeId);
        this.syncBreakpointsToController();
    }

    @action
    toggleBreakpoint(nodeId: string): void {
        const breakpoint = this.breakpoints.get(nodeId);
        if (breakpoint) {
            breakpoint.enabled = !breakpoint.enabled;
            this.syncBreakpointsToController();
        }
    }

    @action
    clearBreakpoints(): void {
        this.breakpoints.clear();
        this.syncBreakpointsToController();
    }

    @action
    clearExecutionLogs(): void {
        this.executionLogs = [];
    }

    private syncBreakpointsToController(): void {
        if (this.executionController) {
            this.executionController.setBreakpoints(this.breakpoints);
        }
    }

    private convertToStoreNodes(): BehaviorTreeNode[] {
        return [...this.nodes] as BehaviorTreeNode[];
    }

    private convertToStoreConnections(): StoreConnection[] {
        return [...this.connections] as StoreConnection[];
    }

    @action
    saveNodesDataSnapshot(): void {
        this.initialNodesData.clear();
        for (const node of this.nodes) {
            this.initialNodesData.set(node.id, { ...node.data });
        }
    }

    @action
    restoreNodesData(): void {
        for (const [nodeId, data] of this.initialNodesData) {
            const node = this.tree.getNode(nodeId);
            if (node) {
                this.tree = this.tree.updateNode(nodeId, n => n.updateData(data));
            }
        }
    }

    @action
    sortChildrenByPosition(): void {
        const nodeMap = new Map<string, Node>();
        this.nodes.forEach((node) => nodeMap.set(node.id, node));

        const sortedNodes = this.nodes.map((node) => {
            if (node.children.length <= 1) {
                return node;
            }

            const sortedChildren = [...node.children].sort((a, b) => {
                const nodeA = nodeMap.get(a);
                const nodeB = nodeMap.get(b);
                if (!nodeA || !nodeB) return 0;
                return nodeA.position.x - nodeB.position.x;
            });

            return new Node(node.id, node.template, node.data, node.position, sortedChildren);
        });

        this.tree = new BehaviorTree(
            sortedNodes,
            [...this.connections],
            this.tree.blackboard,
            this.tree.rootNodeId
        );
    }

    @action
    reset(): void {
        if (this.executionController) {
            this.executionController.destroy();
        }

        this.tree = createInitialTree();
        this.isOpen = false;
        this.blackboardVariables = {};
        this.initialBlackboardVariables = {};
        this.initialNodesData.clear();
        this.isExecuting = false;
        this.nodeExecutionStatuses.clear();
        this.nodeExecutionOrders.clear();
        this.executionMode = 'idle';
        this.executionLogs = [];
        this.tickCount = 0;
        this.breakpoints.clear();
        this.canvasOffset = { x: 0, y: 0 };
        this.canvasScale = 1;
        this.clearSelection();
        this.commandManager.clear();

        this.initializeExecutionController();
    }

    @action
    setIsOpen(isOpen: boolean): void {
        this.isOpen = isOpen;
    }

    @action
    importFromJSON(json: string): void {
        try {
            const data = JSON.parse(json);
            const blackboardData = data.blackboard || {};

            const nodes: Node[] = (data.nodes || []).map((nodeObj: any) => {
                if (nodeObj.id === ROOT_NODE_ID) {
                    const position = new Position(nodeObj.position.x || 400, nodeObj.position.y || 100);
                    return new Node(
                        ROOT_NODE_ID,
                        createRootNodeTemplate(),
                        nodeObj.data || { nodeType: 'root' },
                        position,
                        nodeObj.children || []
                    );
                }
                return new Node(
                    nodeObj.id,
                    nodeObj.template,
                    nodeObj.data || {},
                    new Position(nodeObj.position.x, nodeObj.position.y),
                    nodeObj.children || []
                );
            });

            const connections: Connection[] = (data.connections || []).map((connObj: any) => {
                return new Connection(
                    connObj.from,
                    connObj.to,
                    connObj.connectionType || 'node',
                    connObj.fromProperty,
                    connObj.toProperty
                );
            });

            const blackboard = Blackboard.fromObject(blackboardData);
            const rootNodeId = data.rootNodeId || ROOT_NODE_ID;

            this.tree = new BehaviorTree(nodes, connections, blackboard, rootNodeId);
            this.blackboardVariables = blackboardData;
            this.initialBlackboardVariables = blackboardData;
            this.canvasOffset = data.canvasState?.offset || { x: 0, y: 0 };
            this.canvasScale = data.canvasState?.scale || 1;
            this.isOpen = true;
            this.commandManager.clear();
        } catch (error) {
            console.error('Failed to import JSON:', error);
            throw error;
        }
    }

    exportToJSON(metadata: { name: string; description: string }): string {
        const now = new Date().toISOString();
        const data = {
            version: '1.0.0',
            metadata: {
                name: metadata.name,
                description: metadata.description,
                createdAt: now,
                modifiedAt: now
            },
            nodes: this.nodes.map((n) => n.toObject()),
            connections: this.connections.map((c) => c.toObject()),
            blackboard: this.tree.blackboard.toObject(),
            canvasState: {
                offset: this.canvasOffset,
                scale: this.canvasScale
            }
        };

        return JSON.stringify(data, null, 2);
    }

    @action
    toggleBlackboardCollapsed(): void {
        this.blackboardCollapsed = !this.blackboardCollapsed;
    }

    dispose(): void {
        if (this.executionController) {
            this.executionController.destroy();
            this.executionController = null;
        }
        this.reset();
    }
}

// 单例实例
let instance: BehaviorTreeEditorViewModel | null = null;

export function getBehaviorTreeEditorViewModel(): BehaviorTreeEditorViewModel {
    if (!instance) {
        instance = new BehaviorTreeEditorViewModel();
    }
    return instance;
}

export function resetBehaviorTreeEditorViewModel(): void {
    if (instance) {
        instance.dispose();
    }
    instance = null;
}
