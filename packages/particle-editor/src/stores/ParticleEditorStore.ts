/**
 * 粒子编辑器状态管理
 * Particle editor state management
 */

import { create } from 'zustand';
import type { IParticleAsset } from '@esengine/particle';
import { createDefaultParticleAsset } from '@esengine/particle';

/**
 * 粒子编辑器状态
 * Particle editor state
 */
export interface ParticleEditorState {
    /** 当前编辑的文件路径 | Current file path being edited */
    filePath: string | null;

    /** 待打开的文件路径 | Pending file path to open */
    pendingFilePath: string | null;

    /** 当前粒子数据 | Current particle data */
    particleData: IParticleAsset | null;

    /** 是否已修改 | Is modified */
    isDirty: boolean;

    /** 是否正在预览 | Is previewing */
    isPlaying: boolean;

    /** 选中的预设名称 | Selected preset name */
    selectedPreset: string | null;

    // Actions
    /** 设置文件路径 | Set file path */
    setFilePath: (path: string | null) => void;

    /** 设置待打开的文件路径 | Set pending file path */
    setPendingFilePath: (path: string | null) => void;

    /** 设置粒子数据 | Set particle data */
    setParticleData: (data: IParticleAsset | null) => void;

    /** 更新粒子属性 | Update particle property */
    updateProperty: <K extends keyof IParticleAsset>(key: K, value: IParticleAsset[K]) => void;

    /** 标记为已修改 | Mark as dirty */
    markDirty: () => void;

    /** 标记为已保存 | Mark as saved */
    markSaved: () => void;

    /** 设置播放状态 | Set playing state */
    setPlaying: (playing: boolean) => void;

    /** 设置选中预设 | Set selected preset */
    setSelectedPreset: (preset: string | null) => void;

    /** 重置编辑器 | Reset editor */
    reset: () => void;

    /** 创建新粒子效果 | Create new particle effect */
    createNew: (name?: string) => void;
}

/**
 * 粒子编辑器 Store
 * Particle editor store
 */
export const useParticleEditorStore = create<ParticleEditorState>((set) => ({
    filePath: null,
    pendingFilePath: null,
    particleData: null,
    isDirty: false,
    isPlaying: false,
    selectedPreset: null,

    setFilePath: (path) => set({ filePath: path }),

    setPendingFilePath: (path) => set({ pendingFilePath: path }),

    setParticleData: (data) => set((state) => ({
        particleData: data,
        // 如果有文件路径，修改数据时应该标记为 dirty
        // 如果没有文件路径且之前也没有数据，则是加载文件，不标记 dirty
        // If has file path, mark as dirty when data changes
        // If no file path and no previous data, it's loading, don't mark dirty
        isDirty: state.filePath !== null || state.particleData !== null,
    })),

    updateProperty: (key, value) => set((state) => {
        if (!state.particleData) return state;
        return {
            particleData: {
                ...state.particleData,
                [key]: value,
            },
            isDirty: true,
        };
    }),

    markDirty: () => set({ isDirty: true }),

    markSaved: () => set({ isDirty: false }),

    setPlaying: (playing) => set({ isPlaying: playing }),

    setSelectedPreset: (preset) => set({ selectedPreset: preset }),

    reset: () => set({
        filePath: null,
        pendingFilePath: null,
        particleData: null,
        isDirty: false,
        isPlaying: false,
        selectedPreset: null,
    }),

    createNew: (name = 'New Particle') => set({
        particleData: createDefaultParticleAsset(name),
        filePath: null,
        isDirty: true,
        isPlaying: true,  // 自动播放 | Auto play
        selectedPreset: null,
    }),
}));
