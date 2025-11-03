import { create } from 'zustand';

/**
 * UI 状态
 * 管理UI相关的状态（选中、拖拽、画布）
 */
interface UIState {
    /**
     * 选中的节点ID列表
     */
    selectedNodeIds: string[];

    /**
     * 正在拖拽的节点ID
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
     * 拖拽偏移量
     */
    dragDelta: { dx: number; dy: number };

    /**
     * 画布偏移
     */
    canvasOffset: { x: number; y: number };

    /**
     * 画布缩放
     */
    canvasScale: number;

    /**
     * 是否正在平移画布
     */
    isPanning: boolean;

    /**
     * 平移起始位置
     */
    panStart: { x: number; y: number };

    // Actions
    setSelectedNodeIds: (nodeIds: string[]) => void;
    toggleNodeSelection: (nodeId: string) => void;
    clearSelection: () => void;

    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => void;
    stopDragging: () => void;
    setIsDraggingNode: (isDragging: boolean) => void;
    setDragDelta: (delta: { dx: number; dy: number }) => void;

    setCanvasOffset: (offset: { x: number; y: number }) => void;
    setCanvasScale: (scale: number) => void;
    setIsPanning: (isPanning: boolean) => void;
    setPanStart: (panStart: { x: number; y: number }) => void;
    resetView: () => void;
}

/**
 * UI Store
 */
export const useUIStore = create<UIState>((set, get) => ({
    selectedNodeIds: [],
    draggingNodeId: null,
    dragStartPositions: new Map(),
    isDraggingNode: false,
    dragDelta: { dx: 0, dy: 0 },

    canvasOffset: { x: 0, y: 0 },
    canvasScale: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },

    setSelectedNodeIds: (nodeIds: string[]) => set({ selectedNodeIds: nodeIds }),

    toggleNodeSelection: (nodeId: string) => {
        const { selectedNodeIds } = get();
        if (selectedNodeIds.includes(nodeId)) {
            set({ selectedNodeIds: selectedNodeIds.filter(id => id !== nodeId) });
        } else {
            set({ selectedNodeIds: [...selectedNodeIds, nodeId] });
        }
    },

    clearSelection: () => set({ selectedNodeIds: [] }),

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

    setCanvasOffset: (offset: { x: number; y: number }) => set({ canvasOffset: offset }),

    setCanvasScale: (scale: number) => set({ canvasScale: scale }),

    setIsPanning: (isPanning: boolean) => set({ isPanning }),

    setPanStart: (panStart: { x: number; y: number }) => set({ panStart }),

    resetView: () =>
        set({
            canvasOffset: { x: 0, y: 0 },
            canvasScale: 1,
            isPanning: false
        })
}));
