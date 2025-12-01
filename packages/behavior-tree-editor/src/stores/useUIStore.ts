import { createStore } from '@esengine/editor-runtime';

const create = createStore;

/**
 * UI 状态 Store
 * 只包含 UI 交互状态，不包含业务数据
 */
interface UIState {
    /**
     * 选中的节点 ID 列表
     */
    selectedNodeIds: string[];

    /**
     * 选中的连接
     */
    selectedConnection: { from: string; to: string } | null;

    /**
     * 正在拖拽的节点 ID
     */
    draggingNodeId: string | null;

    /**
     * 拖拽起始位置映射
     */
    dragStartPositions: Map<string, { x: number; y: number }>;

    /**
     * 是否正在拖拽节点
     */
    isDraggingNode: boolean;

    /**
     * 拖拽偏移量（临时状态）
     */
    dragDelta: { dx: number; dy: number };

    /**
     * 画布偏移（临时，用于平移操作中）
     */
    tempCanvasOffset: { x: number; y: number } | null;

    /**
     * 是否正在平移画布
     */
    isPanning: boolean;

    /**
     * 平移起始位置
     */
    panStart: { x: number; y: number };

    /**
     * 正在连接的起始节点 ID
     */
    connectingFrom: string | null;

    /**
     * 正在连接的起始属性名
     */
    connectingFromProperty: string | null;

    /**
     * 连接线的临时终点位置
     */
    connectingToPos: { x: number; y: number } | null;

    /**
     * 是否正在框选
     */
    isBoxSelecting: boolean;

    /**
     * 框选起始位置
     */
    boxSelectStart: { x: number; y: number } | null;

    /**
     * 框选结束位置
     */
    boxSelectEnd: { x: number; y: number } | null;

    /**
     * 选择操作
     */
    setSelectedNodeIds: (nodeIds: string[]) => void;
    toggleNodeSelection: (nodeId: string) => void;
    clearSelection: () => void;
    setSelectedConnection: (connection: { from: string; to: string } | null) => void;

    /**
     * 拖拽操作
     */
    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => void;
    stopDragging: () => void;
    setIsDraggingNode: (isDragging: boolean) => void;
    setDragDelta: (delta: { dx: number; dy: number }) => void;

    /**
     * 画布操作
     */
    setTempCanvasOffset: (offset: { x: number; y: number } | null) => void;
    setIsPanning: (isPanning: boolean) => void;
    setPanStart: (panStart: { x: number; y: number }) => void;

    /**
     * 连接操作
     */
    setConnectingFrom: (nodeId: string | null) => void;
    setConnectingFromProperty: (propertyName: string | null) => void;
    setConnectingToPos: (pos: { x: number; y: number } | null) => void;
    clearConnecting: () => void;

    /**
     * 框选操作
     */
    setIsBoxSelecting: (isSelecting: boolean) => void;
    setBoxSelectStart: (pos: { x: number; y: number } | null) => void;
    setBoxSelectEnd: (pos: { x: number; y: number } | null) => void;
    clearBoxSelect: () => void;
}

/**
 * UI Store
 */
export const useUIStore = create<UIState>((set, get) => ({
    selectedNodeIds: [],
    selectedConnection: null,
    draggingNodeId: null,
    dragStartPositions: new Map(),
    isDraggingNode: false,
    dragDelta: { dx: 0, dy: 0 },
    tempCanvasOffset: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    connectingFrom: null,
    connectingFromProperty: null,
    connectingToPos: null,
    isBoxSelecting: false,
    boxSelectStart: null,
    boxSelectEnd: null,

    setSelectedNodeIds: (nodeIds: string[]) => set({ selectedNodeIds: nodeIds }),

    toggleNodeSelection: (nodeId: string) => {
        const { selectedNodeIds } = get();
        if (selectedNodeIds.includes(nodeId)) {
            set({ selectedNodeIds: selectedNodeIds.filter((id) => id !== nodeId) });
        } else {
            set({ selectedNodeIds: [...selectedNodeIds, nodeId] });
        }
    },

    clearSelection: () => set({ selectedNodeIds: [], selectedConnection: null }),

    setSelectedConnection: (connection: { from: string; to: string } | null) =>
        set({ selectedConnection: connection }),

    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) =>
        set({
            draggingNodeId: nodeId,
            dragStartPositions: startPositions,
            isDraggingNode: true
        }),

    stopDragging: () =>
        set({
            draggingNodeId: null,
            dragStartPositions: new Map(),
            isDraggingNode: false,
            dragDelta: { dx: 0, dy: 0 }
        }),

    setIsDraggingNode: (isDragging: boolean) => set({ isDraggingNode: isDragging }),

    setDragDelta: (delta: { dx: number; dy: number }) => set({ dragDelta: delta }),

    setTempCanvasOffset: (offset: { x: number; y: number } | null) => set({ tempCanvasOffset: offset }),

    setIsPanning: (isPanning: boolean) => set({ isPanning }),

    setPanStart: (panStart: { x: number; y: number }) => set({ panStart }),

    setConnectingFrom: (nodeId: string | null) => set({ connectingFrom: nodeId }),

    setConnectingFromProperty: (propertyName: string | null) => set({ connectingFromProperty: propertyName }),

    setConnectingToPos: (pos: { x: number; y: number } | null) => set({ connectingToPos: pos }),

    clearConnecting: () =>
        set({
            connectingFrom: null,
            connectingFromProperty: null,
            connectingToPos: null
        }),

    setIsBoxSelecting: (isSelecting: boolean) => set({ isBoxSelecting: isSelecting }),

    setBoxSelectStart: (pos: { x: number; y: number } | null) => set({ boxSelectStart: pos }),

    setBoxSelectEnd: (pos: { x: number; y: number } | null) => set({ boxSelectEnd: pos }),

    clearBoxSelect: () =>
        set({
            isBoxSelecting: false,
            boxSelectStart: null,
            boxSelectEnd: null
        })
}));
