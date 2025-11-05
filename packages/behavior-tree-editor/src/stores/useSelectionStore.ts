import { create } from 'zustand';

interface SelectionState {
    selectedNodeIds: string[];
    isBoxSelecting: boolean;
    boxSelectStart: { x: number; y: number } | null;
    boxSelectEnd: { x: number; y: number } | null;

    setSelectedNodeIds: (nodeIds: string[]) => void;
    toggleNodeSelection: (nodeId: string) => void;
    clearSelection: () => void;

    setIsBoxSelecting: (isSelecting: boolean) => void;
    setBoxSelectStart: (pos: { x: number; y: number } | null) => void;
    setBoxSelectEnd: (pos: { x: number; y: number } | null) => void;
    clearBoxSelect: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
    selectedNodeIds: [],
    isBoxSelecting: false,
    boxSelectStart: null,
    boxSelectEnd: null,

    setSelectedNodeIds: (nodeIds) => set({ selectedNodeIds: nodeIds }),

    toggleNodeSelection: (nodeId) => set((state) => {
        const isSelected = state.selectedNodeIds.includes(nodeId);
        return {
            selectedNodeIds: isSelected
                ? state.selectedNodeIds.filter(id => id !== nodeId)
                : [...state.selectedNodeIds, nodeId]
        };
    }),

    clearSelection: () => set({ selectedNodeIds: [] }),

    setIsBoxSelecting: (isSelecting) => set({ isBoxSelecting: isSelecting }),
    setBoxSelectStart: (pos) => set({ boxSelectStart: pos }),
    setBoxSelectEnd: (pos) => set({ boxSelectEnd: pos }),
    clearBoxSelect: () => set({
        isBoxSelecting: false,
        boxSelectStart: null,
        boxSelectEnd: null
    })
}));
