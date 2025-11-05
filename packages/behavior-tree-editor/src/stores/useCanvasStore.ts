import { create } from 'zustand';

interface CanvasState {
    offset: { x: number; y: number };
    scale: number;
    isPanning: boolean;
    panStart: { x: number; y: number };

    setOffset: (offset: { x: number; y: number }) => void;
    setScale: (scale: number) => void;
    setIsPanning: (isPanning: boolean) => void;
    setPanStart: (panStart: { x: number; y: number }) => void;
    resetView: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
    offset: { x: 0, y: 0 },
    scale: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },

    setOffset: (offset) => set({ offset }),
    setScale: (scale) => set({ scale }),
    setIsPanning: (isPanning) => set({ isPanning }),
    setPanStart: (panStart) => set({ panStart }),
    resetView: () => set({ offset: { x: 0, y: 0 }, scale: 1 })
}));
