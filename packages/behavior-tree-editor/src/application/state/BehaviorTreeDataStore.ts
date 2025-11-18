import { create } from 'zustand';
import { NodeTemplates, NodeTemplate } from '@esengine/behavior-tree';
import { BehaviorTree } from '../../domain/models/BehaviorTree';
import { Node } from '../../domain/models/Node';
import { Connection, ConnectionType } from '../../domain/models/Connection';
import { Blackboard, BlackboardValue } from '../../domain/models/Blackboard';
import { ITreeState } from '../commands/ITreeState';
import { createRootNode, createRootNodeTemplate, ROOT_NODE_ID } from '../../domain/constants/RootNode';
import { Position } from '../../domain/value-objects/Position';
import { DEFAULT_EDITOR_CONFIG } from '../../config/editorConstants';

const createInitialTree = (): BehaviorTree => {
    const rootNode = createRootNode();
    return new BehaviorTree([rootNode], [], Blackboard.empty(), ROOT_NODE_ID);
};

/**
 * 节点执行状态
 */
export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';

/**
 * 行为树数据状态
 * 唯一的业务数据源
 */
interface BehaviorTreeDataState {
    /**
     * 当前行为树（领域对象）
     */
    tree: BehaviorTree;

    /**
     * 缓存的节点数组（避免每次创建新数组）
     */
    cachedNodes: Node[];

    /**
     * 缓存的连接数组（避免每次创建新数组）
     */
    cachedConnections: Connection[];

    /**
     * 文件是否已打开
     */
    isOpen: boolean;

    /**
     * 当前文件路径
     */
    currentFilePath: string | null;

    /**
     * 当前文件名
     */
    currentFileName: string;

    /**
     * 黑板变量（运行时）
     */
    blackboardVariables: Record<string, BlackboardValue>;

    /**
     * 初始黑板变量
     */
    initialBlackboardVariables: Record<string, BlackboardValue>;

    /**
     * 节点初始数据快照（用于执行重置）
     */
    initialNodesData: Map<string, Record<string, unknown>>;

    /**
     * 是否正在执行
     */
    isExecuting: boolean;

    /**
     * 节点执行状态
     */
    nodeExecutionStatuses: Map<string, NodeExecutionStatus>;

    /**
     * 节点执行顺序
     */
    nodeExecutionOrders: Map<string, number>;

    /**
     * 画布状态（持久化）
     */
    canvasOffset: { x: number; y: number };
    canvasScale: number;

    /**
     * 强制更新计数器
     */
    forceUpdateCounter: number;

    /**
     * 设置行为树
     */
    setTree: (tree: BehaviorTree) => void;

    /**
     * 重置为空树
     */
    reset: () => void;

    /**
     * 设置文件打开状态
     */
    setIsOpen: (isOpen: boolean) => void;

    /**
     * 设置当前文件信息
     */
    setCurrentFile: (filePath: string | null, fileName: string) => void;

    /**
     * 从 JSON 导入
     */
    importFromJSON: (json: string) => void;

    /**
     * 导出为 JSON
     */
    exportToJSON: (metadata: { name: string; description: string }) => string;

    /**
     * 黑板相关
     */
    setBlackboardVariables: (variables: Record<string, BlackboardValue>) => void;
    setInitialBlackboardVariables: (variables: Record<string, BlackboardValue>) => void;
    updateBlackboardVariable: (name: string, value: BlackboardValue) => void;

    /**
     * 执行相关
     */
    setIsExecuting: (isExecuting: boolean) => void;
    saveNodesDataSnapshot: () => void;
    restoreNodesData: () => void;
    setNodeExecutionStatus: (nodeId: string, status: NodeExecutionStatus) => void;
    updateNodeExecutionStatuses: (statuses: Map<string, NodeExecutionStatus>, orders?: Map<string, number>) => void;
    clearNodeExecutionStatuses: () => void;

    /**
     * 画布状态
     */
    setCanvasOffset: (offset: { x: number; y: number }) => void;
    setCanvasScale: (scale: number) => void;
    resetView: () => void;

    /**
     * 强制更新
     */
    triggerForceUpdate: () => void;

    /**
     * 子节点排序
     */
    sortChildrenByPosition: () => void;

    /**
     * 获取所有节点（数组形式）
     */
    getNodes: () => Node[];

    /**
     * 获取指定节点
     */
    getNode: (nodeId: string) => Node | undefined;

    /**
     * 检查节点是否存在
     */
    hasNode: (nodeId: string) => boolean;

    /**
     * 获取所有连接
     */
    getConnections: () => Connection[];

    /**
     * 获取黑板
     */
    getBlackboard: () => Blackboard;

    /**
     * 获取根节点 ID
     */
    getRootNodeId: () => string | null;
}

/**
 * 行为树数据 Store
 * 实现 ITreeState 接口，供命令使用
 */
export const useBehaviorTreeDataStore = create<BehaviorTreeDataState>((set, get) => {
    const initialTree = createInitialTree();
    return {
        tree: initialTree,
        cachedNodes: Array.from(initialTree.nodes),
        cachedConnections: Array.from(initialTree.connections),
        isOpen: false,
        currentFilePath: null,
        currentFileName: 'Untitled',
        blackboardVariables: {},
        initialBlackboardVariables: {},
        initialNodesData: new Map(),
        isExecuting: false,
        nodeExecutionStatuses: new Map(),
        nodeExecutionOrders: new Map(),
        canvasOffset: { x: 0, y: 0 },
        canvasScale: 1,
        forceUpdateCounter: 0,

        setTree: (tree: BehaviorTree) => {
            set({
                tree,
                cachedNodes: Array.from(tree.nodes),
                cachedConnections: Array.from(tree.connections)
            });
        },

        reset: () => {
            const newTree = createInitialTree();
            set({
                tree: newTree,
                cachedNodes: Array.from(newTree.nodes),
                cachedConnections: Array.from(newTree.connections),
                isOpen: false,
                currentFilePath: null,
                currentFileName: 'Untitled',
                blackboardVariables: {},
                initialBlackboardVariables: {},
                initialNodesData: new Map(),
                isExecuting: false,
                nodeExecutionStatuses: new Map(),
                nodeExecutionOrders: new Map(),
                canvasOffset: { x: 0, y: 0 },
                canvasScale: 1,
                forceUpdateCounter: 0
            });
        },

        setIsOpen: (isOpen: boolean) => set({ isOpen }),

        setCurrentFile: (filePath: string | null, fileName: string) => set({
            currentFilePath: filePath,
            currentFileName: fileName
        }),

        importFromJSON: (json: string) => {
            const data = JSON.parse(json) as {
                nodes?: Array<{
                    id: string;
                    template?: { className?: string };
                    data: Record<string, unknown>;
                    position: { x: number; y: number };
                    children?: string[];
                }>;
                connections?: Array<{
                    from: string;
                    to: string;
                    connectionType?: string;
                    fromProperty?: string;
                    toProperty?: string;
                }>;
                blackboard?: Record<string, BlackboardValue>;
                canvasState?: { offset?: { x: number; y: number }; scale?: number };
            };
            const blackboardData = data.blackboard || {};

            // 导入节点
            const loadedNodes: Node[] = (data.nodes || []).map((nodeObj) => {
                // 根节点也需要保留文件中的 children 数据
                if (nodeObj.id === ROOT_NODE_ID) {
                    const position = new Position(
                        nodeObj.position.x || DEFAULT_EDITOR_CONFIG.defaultRootNodePosition.x,
                        nodeObj.position.y || DEFAULT_EDITOR_CONFIG.defaultRootNodePosition.y
                    );
                    return new Node(
                        ROOT_NODE_ID,
                        createRootNodeTemplate(),
                        { nodeType: 'root' },
                        position,
                        nodeObj.children || []
                    );
                }

                const className = nodeObj.template?.className;
                let template = nodeObj.template;

                if (className) {
                    const allTemplates = NodeTemplates.getAllTemplates();
                    const latestTemplate = allTemplates.find((t) => t.className === className);
                    if (latestTemplate) {
                        template = latestTemplate;
                    }
                }

                const position = new Position(nodeObj.position.x, nodeObj.position.y);
                return new Node(nodeObj.id, template as NodeTemplate, nodeObj.data, position, nodeObj.children || []);
            });

            const loadedConnections: Connection[] = (data.connections || []).map((connObj) => {
                return new Connection(
                    connObj.from,
                    connObj.to,
                    (connObj.connectionType || 'node') as ConnectionType,
                    connObj.fromProperty,
                    connObj.toProperty
                );
            });

            const loadedBlackboard = Blackboard.fromObject(blackboardData);

            // 创建新的行为树
            const tree = new BehaviorTree(
                loadedNodes,
                loadedConnections,
                loadedBlackboard,
                ROOT_NODE_ID
            );

            set({
                tree,
                cachedNodes: Array.from(tree.nodes),
                cachedConnections: Array.from(tree.connections),
                isOpen: true,
                blackboardVariables: blackboardData,
                initialBlackboardVariables: blackboardData,
                canvasOffset: data.canvasState?.offset || { x: 0, y: 0 },
                canvasScale: data.canvasState?.scale || 1
            });
        },

        exportToJSON: (metadata: { name: string; description: string }) => {
            const state = get();
            const now = new Date().toISOString();
            const data = {
                version: '1.0.0',
                metadata: {
                    name: metadata.name,
                    description: metadata.description,
                    createdAt: now,
                    modifiedAt: now
                },
                nodes: state.getNodes().map((n) => n.toObject()),
                connections: state.getConnections().map((c) => c.toObject()),
                blackboard: state.getBlackboard().toObject(),
                canvasState: {
                    offset: state.canvasOffset,
                    scale: state.canvasScale
                }
            };
            return JSON.stringify(data, null, 2);
        },

        setBlackboardVariables: (variables: Record<string, BlackboardValue>) => {
            const newBlackboard = Blackboard.fromObject(variables);
            const currentTree = get().tree;
            const newTree = new BehaviorTree(
                currentTree.nodes as Node[],
                currentTree.connections as Connection[],
                newBlackboard,
                currentTree.rootNodeId
            );
            set({
                tree: newTree,
                cachedNodes: Array.from(newTree.nodes),
                cachedConnections: Array.from(newTree.connections),
                blackboardVariables: variables
            });
        },

        setInitialBlackboardVariables: (variables: Record<string, BlackboardValue>) =>
            set({ initialBlackboardVariables: variables }),

        updateBlackboardVariable: (name: string, value: BlackboardValue) => {
            const state = get();
            const newBlackboard = Blackboard.fromObject(state.blackboardVariables);
            newBlackboard.setValue(name, value);
            const variables = newBlackboard.toObject();

            const currentTree = state.tree;
            const newTree = new BehaviorTree(
                currentTree.nodes as Node[],
                currentTree.connections as Connection[],
                newBlackboard,
                currentTree.rootNodeId
            );

            set({
                tree: newTree,
                cachedNodes: Array.from(newTree.nodes),
                cachedConnections: Array.from(newTree.connections),
                blackboardVariables: variables
            });
        },

        setIsExecuting: (isExecuting: boolean) => set({ isExecuting }),

        saveNodesDataSnapshot: () => {
            const snapshot = new Map<string, Record<string, unknown>>();
            get().getNodes().forEach((node) => {
                snapshot.set(node.id, { ...node.data });
            });
            set({ initialNodesData: snapshot });
        },

        restoreNodesData: () => {
            const state = get();
            const snapshot = state.initialNodesData;
            if (snapshot.size === 0) return;

            const updatedNodes = state.getNodes().map((node) => {
                const savedData = snapshot.get(node.id);
                if (savedData) {
                    return new Node(node.id, node.template, savedData, node.position, Array.from(node.children));
                }
                return node;
            });

            const newTree = new BehaviorTree(
                updatedNodes,
                state.getConnections(),
                state.getBlackboard(),
                state.getRootNodeId()
            );

            set({
                tree: newTree,
                cachedNodes: Array.from(newTree.nodes),
                cachedConnections: Array.from(newTree.connections),
                initialNodesData: new Map()
            });
        },

        setNodeExecutionStatus: (nodeId: string, status: NodeExecutionStatus) => {
            const newStatuses = new Map(get().nodeExecutionStatuses);
            newStatuses.set(nodeId, status);
            set({ nodeExecutionStatuses: newStatuses });
        },

        updateNodeExecutionStatuses: (statuses: Map<string, NodeExecutionStatus>, orders?: Map<string, number>) => {
            set({
                nodeExecutionStatuses: new Map(statuses),
                nodeExecutionOrders: orders ? new Map(orders) : new Map()
            });
        },

        clearNodeExecutionStatuses: () => {
            set({
                nodeExecutionStatuses: new Map(),
                nodeExecutionOrders: new Map()
            });
        },

        setCanvasOffset: (offset: { x: number; y: number }) => set({ canvasOffset: offset }),

        setCanvasScale: (scale: number) => set({ canvasScale: scale }),

        resetView: () => set({ canvasOffset: { x: 0, y: 0 }, canvasScale: 1 }),

        triggerForceUpdate: () => set((state) => ({ forceUpdateCounter: state.forceUpdateCounter + 1 })),

        sortChildrenByPosition: () => {
            const state = get();
            const nodes = state.getNodes();
            const nodeMap = new Map<string, Node>();
            nodes.forEach((node) => nodeMap.set(node.id, node));

            const sortedNodes = nodes.map((node) => {
                if (node.children.length <= 1) {
                    return node;
                }

                const sortedChildren = Array.from(node.children).sort((a, b) => {
                    const nodeA = nodeMap.get(a);
                    const nodeB = nodeMap.get(b);
                    if (!nodeA || !nodeB) return 0;
                    return nodeA.position.x - nodeB.position.x;
                });

                return new Node(node.id, node.template, node.data, node.position, sortedChildren);
            });

            const newTree = new BehaviorTree(
                sortedNodes,
                state.getConnections(),
                state.getBlackboard(),
                state.getRootNodeId()
            );

            set({
                tree: newTree,
                cachedNodes: Array.from(newTree.nodes),
                cachedConnections: Array.from(newTree.connections)
            });
        },

        getNodes: () => {
            return get().cachedNodes;
        },

        getNode: (nodeId: string) => {
            try {
                return get().tree.getNode(nodeId);
            } catch {
                return undefined;
            }
        },

        hasNode: (nodeId: string) => {
            return get().tree.hasNode(nodeId);
        },

        getConnections: () => {
            return get().cachedConnections;
        },

        getBlackboard: () => {
            return get().tree.blackboard;
        },

        getRootNodeId: () => {
            return get().tree.rootNodeId;
        }
    };
});

/**
 * TreeState 适配器
 * 将 Zustand Store 适配为 ITreeState 接口
 */
export class TreeStateAdapter implements ITreeState {
    private static instance: TreeStateAdapter | null = null;

    private constructor() {}

    static getInstance(): TreeStateAdapter {
        if (!TreeStateAdapter.instance) {
            TreeStateAdapter.instance = new TreeStateAdapter();
        }
        return TreeStateAdapter.instance;
    }

    getTree(): BehaviorTree {
        return useBehaviorTreeDataStore.getState().tree;
    }

    setTree(tree: BehaviorTree): void {
        useBehaviorTreeDataStore.getState().setTree(tree);
    }
}
