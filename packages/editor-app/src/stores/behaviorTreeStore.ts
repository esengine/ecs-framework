import { create } from 'zustand';
import { NodeTemplate } from '@esengine/behavior-tree';

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
}

const ROOT_NODE_ID = 'root-node';

export const useBehaviorTreeStore = create<BehaviorTreeState>((set, get) => ({
    nodes: [],
    connections: [],
    selectedNodeIds: [],
    draggingNodeId: null,
    dragStartPositions: new Map(),
    isDraggingNode: false,

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

    setNodes: (nodes) => set({ nodes }),

    updateNodes: (updater) => set((state) => ({ nodes: updater(state.nodes) })),

    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

    removeNodes: (nodeIds) => set((state) => ({
        nodes: state.nodes.filter(n => !nodeIds.includes(n.id)),
    })),

    updateNodePosition: (nodeId, position) => set((state) => ({
        nodes: state.nodes.map(n =>
            n.id === nodeId ? { ...n, position } : n
        ),
    })),

    updateNodesPosition: (updates) => set((state) => ({
        nodes: state.nodes.map(node => {
            const newPos = updates.get(node.id);
            return newPos ? { ...node, position: newPos } : node;
        }),
    })),

    setConnections: (connections) => set({ connections }),

    addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection],
    })),

    removeConnections: (filter) => set((state) => ({
        connections: state.connections.filter(filter),
    })),

    setSelectedNodeIds: (nodeIds) => set({ selectedNodeIds: nodeIds }),

    toggleNodeSelection: (nodeId) => set((state) => ({
        selectedNodeIds: state.selectedNodeIds.includes(nodeId)
            ? state.selectedNodeIds.filter(id => id !== nodeId)
            : [...state.selectedNodeIds, nodeId],
    })),

    clearSelection: () => set({ selectedNodeIds: [] }),

    startDragging: (nodeId, startPositions) => set({
        draggingNodeId: nodeId,
        dragStartPositions: startPositions,
    }),

    stopDragging: () => set({ draggingNodeId: null }),

    setIsDraggingNode: (isDragging) => set({ isDraggingNode: isDragging }),

    // 画布变换 Actions
    setCanvasOffset: (offset) => set({ canvasOffset: offset }),

    setCanvasScale: (scale) => set({ canvasScale: scale }),

    setIsPanning: (isPanning) => set({ isPanning }),

    setPanStart: (panStart) => set({ panStart }),

    resetView: () => set({ canvasOffset: { x: 0, y: 0 }, canvasScale: 1 }),

    // 连接 Actions
    setConnectingFrom: (nodeId) => set({ connectingFrom: nodeId }),

    setConnectingFromProperty: (propertyName) => set({ connectingFromProperty: propertyName }),

    setConnectingToPos: (pos) => set({ connectingToPos: pos }),

    clearConnecting: () => set({
        connectingFrom: null,
        connectingFromProperty: null,
        connectingToPos: null,
    }),

    // 框选 Actions
    setIsBoxSelecting: (isSelecting) => set({ isBoxSelecting: isSelecting }),

    setBoxSelectStart: (pos) => set({ boxSelectStart: pos }),

    setBoxSelectEnd: (pos) => set({ boxSelectEnd: pos }),

    clearBoxSelect: () => set({
        isBoxSelecting: false,
        boxSelectStart: null,
        boxSelectEnd: null,
    }),

    // 拖动偏移 Actions
    setDragDelta: (delta) => set({ dragDelta: delta }),

    // 强制更新
    triggerForceUpdate: () => set((state) => ({ forceUpdateCounter: state.forceUpdateCounter + 1 })),
}));

export type { BehaviorTreeNode, Connection };
export { ROOT_NODE_ID };
