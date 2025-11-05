import { create } from 'zustand';

interface InteractionState {
    draggingNodeId: string | null;
    dragStartPositions: Map<string, { x: number; y: number }>;
    isDraggingNode: boolean;
    dragDelta: { dx: number; dy: number };

    connectingFrom: string | null;
    connectingFromProperty: string | null;
    connectingToPos: { x: number; y: number } | null;

    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => void;
    stopDragging: () => void;
    setIsDraggingNode: (isDragging: boolean) => void;
    setDragDelta: (delta: { dx: number; dy: number }) => void;

    setConnectingFrom: (nodeId: string | null) => void;
    setConnectingFromProperty: (propertyName: string | null) => void;
    setConnectingToPos: (pos: { x: number; y: number } | null) => void;
    clearConnecting: () => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
    draggingNodeId: null,
    dragStartPositions: new Map(),
    isDraggingNode: false,
    dragDelta: { dx: 0, dy: 0 },

    connectingFrom: null,
    connectingFromProperty: null,
    connectingToPos: null,

    startDragging: (nodeId, startPositions) => set({
        draggingNodeId: nodeId,
        dragStartPositions: new Map(startPositions),
        isDraggingNode: true
    }),

    stopDragging: () => set({
        draggingNodeId: null,
        dragStartPositions: new Map(),
        isDraggingNode: false,
        dragDelta: { dx: 0, dy: 0 }
    }),

    setIsDraggingNode: (isDragging) => set({ isDraggingNode: isDragging }),
    setDragDelta: (delta) => set({ dragDelta: delta }),

    setConnectingFrom: (nodeId) => set({ connectingFrom: nodeId }),
    setConnectingFromProperty: (propertyName) => set({ connectingFromProperty: propertyName }),
    setConnectingToPos: (pos) => set({ connectingToPos: pos }),
    clearConnecting: () => set({
        connectingFrom: null,
        connectingFromProperty: null,
        connectingToPos: null
    })
}));
