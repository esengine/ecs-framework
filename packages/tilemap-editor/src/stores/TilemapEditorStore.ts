/**
 * Tilemap Editor State Store
 */

import { create } from 'zustand';

export type TilemapToolType = 'brush' | 'eraser' | 'fill' | 'rectangle' | 'select';

export interface TileSelection {
    x: number;
    y: number;
    width: number;
    height: number;
    tiles: number[];
}

export interface LayerState {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    color: string;
    hiddenInGame: boolean;
}

export interface TilemapEditorState {
    // Current editing target
    entityId: string | null;

    // Pending file to open (for file-based editing)
    pendingFilePath: string | null;
    // Current file being edited (for file-based editing)
    currentFilePath: string | null;

    // Tileset
    tilesetImageUrl: string | null;
    tilesetColumns: number;
    tilesetRows: number;
    tileWidth: number;
    tileHeight: number;

    // Selection
    selectedTiles: TileSelection | null;

    // Tools
    currentTool: TilemapToolType;
    brushSize: number;

    // View
    zoom: number;
    panX: number;
    panY: number;
    showGrid: boolean;
    showCollision: boolean;

    // Layers
    currentLayer: number;
    layers: LayerState[];
    editingCollision: boolean;

    // History
    undoStack: Uint32Array[];
    redoStack: Uint32Array[];

    // Actions
    setEntityId: (id: string | null) => void;
    setPendingFilePath: (path: string | null) => void;
    setCurrentFilePath: (path: string | null) => void;
    clearPendingFile: () => void;
    setTileset: (url: string | null, columns: number, rows: number, tileWidth: number, tileHeight: number) => void;
    setSelectedTiles: (selection: TileSelection | null) => void;
    setCurrentTool: (tool: TilemapToolType) => void;
    setBrushSize: (size: number) => void;
    setZoom: (zoom: number) => void;
    setPan: (x: number, y: number) => void;
    setShowGrid: (show: boolean) => void;
    setShowCollision: (show: boolean) => void;
    setCurrentLayer: (layer: number) => void;
    setEditingCollision: (editing: boolean) => void;
    pushUndo: (data: Uint32Array) => void;
    undo: () => Uint32Array | null;
    redo: () => Uint32Array | null;
    reset: () => void;

    // Layer management
    setLayers: (layers: LayerState[]) => void;
    toggleLayerVisibility: (index: number) => void;
    toggleLayerLocked: (index: number) => void;
    setLayerOpacity: (index: number, opacity: number) => void;
    setLayerColor: (index: number, color: string) => void;
    setLayerHiddenInGame: (index: number, hidden: boolean) => void;
    renameLayer: (index: number, name: string) => void;
}

const initialState = {
    entityId: null,
    pendingFilePath: null,
    currentFilePath: null,
    tilesetImageUrl: null,
    tilesetColumns: 0,
    tilesetRows: 0,
    tileWidth: 32,
    tileHeight: 32,
    selectedTiles: null,
    currentTool: 'brush' as TilemapToolType,
    brushSize: 1,
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    showCollision: false,
    currentLayer: 0,
    layers: [] as LayerState[],
    editingCollision: false,
    undoStack: [] as Uint32Array[],
    redoStack: [] as Uint32Array[],
};

export const useTilemapEditorStore = create<TilemapEditorState>((set, get) => ({
    ...initialState,

    setEntityId: (id) => set({ entityId: id }),

    setPendingFilePath: (path) => set({ pendingFilePath: path }),

    setCurrentFilePath: (path) => set({ currentFilePath: path }),

    clearPendingFile: () => set({ pendingFilePath: null }),

    setTileset: (url, columns, rows, tileWidth, tileHeight) => set({
        tilesetImageUrl: url,
        tilesetColumns: columns,
        tilesetRows: rows,
        tileWidth,
        tileHeight,
        selectedTiles: null,
    }),

    setSelectedTiles: (selection) => set({ selectedTiles: selection }),

    setCurrentTool: (tool) => set({ currentTool: tool }),

    setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(10, size)) }),

    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),

    setPan: (x, y) => set({ panX: x, panY: y }),

    setShowGrid: (show) => set({ showGrid: show }),

    setShowCollision: (show) => set({ showCollision: show }),

    setCurrentLayer: (layer) => set({ currentLayer: layer }),

    setEditingCollision: (editing) => set({ editingCollision: editing }),

    pushUndo: (data) => {
        const { undoStack } = get();
        set({
            undoStack: [...undoStack.slice(-49), data],
            redoStack: [],
        });
    },

    undo: () => {
        const { undoStack, redoStack } = get();
        if (undoStack.length === 0) return null;

        const data = undoStack[undoStack.length - 1]!;
        set({
            undoStack: undoStack.slice(0, -1),
            redoStack: [...redoStack, data],
        });
        return undoStack.length > 1 ? undoStack[undoStack.length - 2]! : null;
    },

    redo: () => {
        const { redoStack, undoStack } = get();
        if (redoStack.length === 0) return null;

        const data = redoStack[redoStack.length - 1]!;
        set({
            redoStack: redoStack.slice(0, -1),
            undoStack: [...undoStack, data],
        });
        return data;
    },

    reset: () => set(initialState),

    // Layer management
    setLayers: (layers) => set({ layers }),

    toggleLayerVisibility: (index) => {
        const { layers } = get();
        const layer = layers[index];
        if (!layer) return;
        const newLayers = [...layers];
        newLayers[index] = { ...layer, visible: !layer.visible };
        set({ layers: newLayers });
    },

    toggleLayerLocked: (index) => {
        const { layers } = get();
        const layer = layers[index];
        if (!layer) return;
        const newLayers = [...layers];
        newLayers[index] = { ...layer, locked: !layer.locked };
        set({ layers: newLayers });
    },

    setLayerOpacity: (index, opacity) => {
        const { layers } = get();
        const layer = layers[index];
        if (!layer) return;
        const newLayers = [...layers];
        newLayers[index] = { ...layer, opacity: Math.max(0, Math.min(1, opacity)) };
        set({ layers: newLayers });
    },

    setLayerColor: (index, color) => {
        const { layers } = get();
        const layer = layers[index];
        if (!layer) return;
        const newLayers = [...layers];
        newLayers[index] = { ...layer, color };
        set({ layers: newLayers });
    },

    setLayerHiddenInGame: (index, hidden) => {
        const { layers } = get();
        const layer = layers[index];
        if (!layer) return;
        const newLayers = [...layers];
        newLayers[index] = { ...layer, hiddenInGame: hidden };
        set({ layers: newLayers });
    },

    renameLayer: (index, name) => {
        const { layers } = get();
        const layer = layers[index];
        if (!layer) return;
        const newLayers = [...layers];
        newLayers[index] = { ...layer, name };
        set({ layers: newLayers });
    },
}));
