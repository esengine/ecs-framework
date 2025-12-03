import { create } from 'zustand';
import { BlendMode, type MaterialDefinition } from '@esengine/material-system';

export interface MaterialEditorState {
    currentFilePath: string | null;
    pendingFilePath: string | null;
    materialData: MaterialDefinition | null;
    isDirty: boolean;
    isLoading: boolean;

    setPendingFilePath: (path: string | null) => void;
    setCurrentFilePath: (path: string | null) => void;
    setMaterialData: (data: MaterialDefinition | null) => void;
    setDirty: (dirty: boolean) => void;
    setLoading: (loading: boolean) => void;
    updateMaterialProperty: <K extends keyof MaterialDefinition>(key: K, value: MaterialDefinition[K]) => void;
    reset: () => void;
}

const initialState = {
    currentFilePath: null,
    pendingFilePath: null,
    materialData: null,
    isDirty: false,
    isLoading: false,
};

export const useMaterialEditorStore = create<MaterialEditorState>((set) => ({
    ...initialState,

    setPendingFilePath: (path) => set({ pendingFilePath: path }),
    setCurrentFilePath: (path) => set({ currentFilePath: path }),
    setMaterialData: (data) => set({ materialData: data, isDirty: false }),
    setDirty: (dirty) => set({ isDirty: dirty }),
    setLoading: (loading) => set({ isLoading: loading }),

    updateMaterialProperty: (key, value) => set((state) => {
        if (!state.materialData) return state;
        return {
            materialData: { ...state.materialData, [key]: value },
            isDirty: true,
        };
    }),

    reset: () => set(initialState),
}));

export function createDefaultMaterialData(name: string = 'New Material'): MaterialDefinition {
    return {
        name,
        shader: 0,
        blendMode: BlendMode.Alpha,
        uniforms: {},
    };
}
