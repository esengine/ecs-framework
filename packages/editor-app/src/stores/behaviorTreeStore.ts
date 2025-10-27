import { create } from 'zustand';
import { NodeTemplate, NodeTemplates, EditorFormatConverter, BehaviorTreeAssetSerializer, NodeType } from '@esengine/behavior-tree';

interface BehaviorTreeNode {
    id: string;
    template: NodeTemplate;
    data: Record<string, any>;
    position: { x: number; y: number };
    children: string[];
}

interface Connection {
    from: string;
    to: string;
    fromProperty?: string;
    toProperty?: string;
    connectionType: 'node' | 'property';
}

interface BehaviorTreeState {
    nodes: BehaviorTreeNode[];
    connections: Connection[];
    selectedNodeIds: string[];
    draggingNodeId: string | null;
    dragStartPositions: Map<string, { x: number; y: number }>;
    isDraggingNode: boolean;

    // 黑板变量
    blackboardVariables: Record<string, any>;
    // 初始黑板变量（设计时的值，用于保存）
    initialBlackboardVariables: Record<string, any>;
    // 是否正在运行行为树
    isExecuting: boolean;

    // 画布变换
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    isPanning: boolean;
    panStart: { x: number; y: number };

    // 连接状态
    connectingFrom: string | null;
    connectingFromProperty: string | null;
    connectingToPos: { x: number; y: number } | null;

    // 框选状态
    isBoxSelecting: boolean;
    boxSelectStart: { x: number; y: number } | null;
    boxSelectEnd: { x: number; y: number } | null;

    // 拖动偏移
    dragDelta: { dx: number; dy: number };

    // 强制更新计数器
    forceUpdateCounter: number;

    // Actions
    setNodes: (nodes: BehaviorTreeNode[]) => void;
    updateNodes: (updater: (nodes: BehaviorTreeNode[]) => BehaviorTreeNode[]) => void;
    addNode: (node: BehaviorTreeNode) => void;
    removeNodes: (nodeIds: string[]) => void;
    updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
    updateNodesPosition: (updates: Map<string, { x: number; y: number }>) => void;

    setConnections: (connections: Connection[]) => void;
    addConnection: (connection: Connection) => void;
    removeConnections: (filter: (conn: Connection) => boolean) => void;

    setSelectedNodeIds: (nodeIds: string[]) => void;
    toggleNodeSelection: (nodeId: string) => void;
    clearSelection: () => void;

    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => void;
    stopDragging: () => void;
    setIsDraggingNode: (isDragging: boolean) => void;

    // 画布变换 Actions
    setCanvasOffset: (offset: { x: number; y: number }) => void;
    setCanvasScale: (scale: number) => void;
    setIsPanning: (isPanning: boolean) => void;
    setPanStart: (panStart: { x: number; y: number }) => void;
    resetView: () => void;

    // 连接 Actions
    setConnectingFrom: (nodeId: string | null) => void;
    setConnectingFromProperty: (propertyName: string | null) => void;
    setConnectingToPos: (pos: { x: number; y: number } | null) => void;
    clearConnecting: () => void;

    // 框选 Actions
    setIsBoxSelecting: (isSelecting: boolean) => void;
    setBoxSelectStart: (pos: { x: number; y: number } | null) => void;
    setBoxSelectEnd: (pos: { x: number; y: number } | null) => void;
    clearBoxSelect: () => void;

    // 拖动偏移 Actions
    setDragDelta: (delta: { dx: number; dy: number }) => void;

    // 强制更新
    triggerForceUpdate: () => void;

    // 黑板变量 Actions
    setBlackboardVariables: (variables: Record<string, any>) => void;
    updateBlackboardVariable: (name: string, value: any) => void;
    setInitialBlackboardVariables: (variables: Record<string, any>) => void;
    setIsExecuting: (isExecuting: boolean) => void;

    // 自动排序子节点
    sortChildrenByPosition: () => void;

    // 数据导出/导入
    exportToJSON: (metadata: { name: string; description: string }, blackboard: Record<string, any>) => string;
    importFromJSON: (json: string) => { blackboard: Record<string, any> };

    // 运行时资产导出
    exportToRuntimeAsset: (
        metadata: { name: string; description: string },
        blackboard: Record<string, any>,
        format: 'json' | 'binary'
    ) => string | Uint8Array;

    // 重置所有状态
    reset: () => void;
}

const ROOT_NODE_ID = 'root-node';

// 创建根节点模板
const createRootNodeTemplate = (): NodeTemplate => ({
    type: NodeType.Composite,
    displayName: '根节点',
    category: '根节点',
    icon: 'TreePine',
    description: '行为树根节点',
    color: '#FFD700',
    defaultConfig: {
        nodeType: 'root'
    },
    properties: []
});

// 创建初始根节点
const createInitialRootNode = (): BehaviorTreeNode => ({
    id: ROOT_NODE_ID,
    template: createRootNodeTemplate(),
    data: { nodeType: 'root' },
    position: { x: 400, y: 100 },
    children: []
});

export const useBehaviorTreeStore = create<BehaviorTreeState>((set, get) => ({
    nodes: [createInitialRootNode()],
    connections: [],
    selectedNodeIds: [],
    draggingNodeId: null,
    dragStartPositions: new Map(),
    isDraggingNode: false,

    // 黑板变量初始值
    blackboardVariables: {},
    initialBlackboardVariables: {},
    isExecuting: false,

    // 画布变换初始值
    canvasOffset: { x: 0, y: 0 },
    canvasScale: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },

    // 连接状态初始值
    connectingFrom: null,
    connectingFromProperty: null,
    connectingToPos: null,

    // 框选状态初始值
    isBoxSelecting: false,
    boxSelectStart: null,
    boxSelectEnd: null,

    // 拖动偏移初始值
    dragDelta: { dx: 0, dy: 0 },

    // 强制更新计数器初始值
    forceUpdateCounter: 0,

    setNodes: (nodes: BehaviorTreeNode[]) => set({ nodes }),

    updateNodes: (updater: (nodes: BehaviorTreeNode[]) => BehaviorTreeNode[]) => set((state: BehaviorTreeState) => ({ nodes: updater(state.nodes) })),

    addNode: (node: BehaviorTreeNode) => set((state: BehaviorTreeState) => ({ nodes: [...state.nodes, node] })),

    removeNodes: (nodeIds: string[]) => set((state: BehaviorTreeState) => {
        // 只删除指定的节点，不删除子节点
        const nodesToDelete = new Set<string>(nodeIds);

        // 过滤掉删除的节点，并清理所有节点的 children 引用
        const remainingNodes = state.nodes
            .filter((n: BehaviorTreeNode) => !nodesToDelete.has(n.id))
            .map((n: BehaviorTreeNode) => ({
                ...n,
                children: n.children.filter((childId: string) => !nodesToDelete.has(childId))
            }));

        return { nodes: remainingNodes };
    }),

    updateNodePosition: (nodeId: string, position: { x: number; y: number }) => set((state: BehaviorTreeState) => ({
        nodes: state.nodes.map((n: BehaviorTreeNode) =>
            n.id === nodeId ? { ...n, position } : n
        ),
    })),

    updateNodesPosition: (updates: Map<string, { x: number; y: number }>) => set((state: BehaviorTreeState) => ({
        nodes: state.nodes.map((node: BehaviorTreeNode) => {
            const newPos = updates.get(node.id);
            return newPos ? { ...node, position: newPos } : node;
        }),
    })),

    setConnections: (connections: Connection[]) => set({ connections }),

    addConnection: (connection: Connection) => set((state: BehaviorTreeState) => ({
        connections: [...state.connections, connection],
    })),

    removeConnections: (filter: (conn: Connection) => boolean) => set((state: BehaviorTreeState) => ({
        connections: state.connections.filter(filter),
    })),

    setSelectedNodeIds: (nodeIds: string[]) => set({ selectedNodeIds: nodeIds }),

    toggleNodeSelection: (nodeId: string) => set((state: BehaviorTreeState) => ({
        selectedNodeIds: state.selectedNodeIds.includes(nodeId)
            ? state.selectedNodeIds.filter((id: string) => id !== nodeId)
            : [...state.selectedNodeIds, nodeId],
    })),

    clearSelection: () => set({ selectedNodeIds: [] }),

    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => set({
        draggingNodeId: nodeId,
        dragStartPositions: startPositions,
    }),

    stopDragging: () => set({ draggingNodeId: null }),

    setIsDraggingNode: (isDragging: boolean) => set({ isDraggingNode: isDragging }),

    // 画布变换 Actions
    setCanvasOffset: (offset: { x: number; y: number }) => set({ canvasOffset: offset }),

    setCanvasScale: (scale: number) => set({ canvasScale: scale }),

    setIsPanning: (isPanning: boolean) => set({ isPanning }),

    setPanStart: (panStart: { x: number; y: number }) => set({ panStart }),

    resetView: () => set({ canvasOffset: { x: 0, y: 0 }, canvasScale: 1 }),

    // 连接 Actions
    setConnectingFrom: (nodeId: string | null) => set({ connectingFrom: nodeId }),

    setConnectingFromProperty: (propertyName: string | null) => set({ connectingFromProperty: propertyName }),

    setConnectingToPos: (pos: { x: number; y: number } | null) => set({ connectingToPos: pos }),

    clearConnecting: () => set({
        connectingFrom: null,
        connectingFromProperty: null,
        connectingToPos: null,
    }),

    // 框选 Actions
    setIsBoxSelecting: (isSelecting: boolean) => set({ isBoxSelecting: isSelecting }),

    setBoxSelectStart: (pos: { x: number; y: number } | null) => set({ boxSelectStart: pos }),

    setBoxSelectEnd: (pos: { x: number; y: number } | null) => set({ boxSelectEnd: pos }),

    clearBoxSelect: () => set({
        isBoxSelecting: false,
        boxSelectStart: null,
        boxSelectEnd: null,
    }),

    // 拖动偏移 Actions
    setDragDelta: (delta: { dx: number; dy: number }) => set({ dragDelta: delta }),

    // 强制更新
    triggerForceUpdate: () => set((state: BehaviorTreeState) => ({ forceUpdateCounter: state.forceUpdateCounter + 1 })),

    // 黑板变量 Actions
    setBlackboardVariables: (variables: Record<string, any>) => set({ blackboardVariables: variables }),

    updateBlackboardVariable: (name: string, value: any) => set((state: BehaviorTreeState) => ({
        blackboardVariables: {
            ...state.blackboardVariables,
            [name]: value
        }
    })),

    setInitialBlackboardVariables: (variables: Record<string, any>) => set({ initialBlackboardVariables: variables }),

    setIsExecuting: (isExecuting: boolean) => set({ isExecuting }),

    // 自动排序子节点（按X坐标从左到右）
    sortChildrenByPosition: () => set((state: BehaviorTreeState) => {
        const nodeMap = new Map<string, BehaviorTreeNode>();
        state.nodes.forEach(node => nodeMap.set(node.id, node));

        const sortedNodes = state.nodes.map(node => {
            if (node.children.length <= 1) {
                return node;
            }

            const sortedChildren = [...node.children].sort((a, b) => {
                const nodeA = nodeMap.get(a);
                const nodeB = nodeMap.get(b);
                if (!nodeA || !nodeB) return 0;
                return nodeA.position.x - nodeB.position.x;
            });

            return { ...node, children: sortedChildren };
        });

        return { nodes: sortedNodes };
    }),

    exportToJSON: (metadata: { name: string; description: string }, blackboard: Record<string, any>) => {
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
            nodes: state.nodes,
            connections: state.connections,
            blackboard: blackboard,
            canvasState: {
                offset: state.canvasOffset,
                scale: state.canvasScale
            }
        };
        return JSON.stringify(data, null, 2);
    },

    importFromJSON: (json: string) => {
        const data = JSON.parse(json);
        const blackboard = data.blackboard || {};

        // 重新关联最新模板：根据 className 从模板库查找
        const loadedNodes: BehaviorTreeNode[] = (data.nodes || []).map((node: any) => {
            // 如果是根节点，使用根节点模板
            if (node.id === ROOT_NODE_ID) {
                return {
                    ...node,
                    template: createRootNodeTemplate()
                };
            }

            // 查找最新模板
            const className = node.template?.className;
            if (className) {
                const allTemplates = NodeTemplates.getAllTemplates();
                const latestTemplate = allTemplates.find(t => t.className === className);

                if (latestTemplate) {
                    return {
                        ...node,
                        template: latestTemplate  // 使用最新模板
                    };
                }
            }

            // 如果找不到，保留旧模板（兼容性）
            return node;
        });

        set({
            nodes: loadedNodes,
            connections: data.connections || [],
            blackboardVariables: blackboard,
            canvasOffset: data.canvasState?.offset || { x: 0, y: 0 },
            canvasScale: data.canvasState?.scale || 1
        });
        return { blackboard };
    },

    exportToRuntimeAsset: (
        metadata: { name: string; description: string },
        blackboard: Record<string, any>,
        format: 'json' | 'binary'
    ) => {
        const state = get();

        // 构建编辑器格式数据
        const editorFormat = {
            version: '1.0.0',
            metadata: {
                name: metadata.name,
                description: metadata.description,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            },
            nodes: state.nodes,
            connections: state.connections,
            blackboard: blackboard
        };

        // 转换为资产格式
        const asset = EditorFormatConverter.toAsset(editorFormat, metadata);

        // 序列化为指定格式
        return BehaviorTreeAssetSerializer.serialize(asset, {
            format,
            pretty: format === 'json',
            validate: true
        });
    },

    reset: () => set({
        nodes: [createInitialRootNode()],
        connections: [],
        selectedNodeIds: [],
        draggingNodeId: null,
        dragStartPositions: new Map(),
        isDraggingNode: false,
        blackboardVariables: {},
        initialBlackboardVariables: {},
        isExecuting: false,
        canvasOffset: { x: 0, y: 0 },
        canvasScale: 1,
        isPanning: false,
        panStart: { x: 0, y: 0 },
        connectingFrom: null,
        connectingFromProperty: null,
        connectingToPos: null,
        isBoxSelecting: false,
        boxSelectStart: null,
        boxSelectEnd: null,
        dragDelta: { dx: 0, dy: 0 },
        forceUpdateCounter: 0
    })
}));

export type { BehaviorTreeNode, Connection };
export { ROOT_NODE_ID };
