/**
 * 粒子编辑器状态管理
 * Particle editor state management
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { IParticleAsset } from '@esengine/particle';
import { createDefaultParticleAsset } from '@esengine/particle';

/** Tab 类型 | Tab type */
export type ParticleEditorTab = 'basic' | 'emission' | 'particle' | 'color' | 'modules' | 'burst';

/**
 * 粒子编辑器状态
 * Particle editor state
 */
export interface ParticleEditorState {
    // ===== 文件状态 | File State =====
    /** 当前编辑的文件路径 | Current file path being edited */
    filePath: string | null;
    /** 待打开的文件路径 | Pending file path to open */
    pendingFilePath: string | null;
    /** 当前粒子数据 | Current particle data */
    particleData: IParticleAsset | null;
    /** 是否已修改 | Is modified */
    isDirty: boolean;
    /** 是否正在加载 | Is loading */
    isLoading: boolean;

    // ===== UI 状态 | UI State =====
    /** 当前激活的 Tab | Current active tab */
    activeTab: ParticleEditorTab;
    /** 是否全屏 | Is fullscreen */
    isFullscreen: boolean;
    /** 选中的预设名称 | Selected preset name */
    selectedPreset: string | null;

    // ===== 预览状态 | Preview State =====
    /** 是否正在预览 | Is previewing */
    isPlaying: boolean;
    /** 是否跟随鼠标 | Is following mouse */
    followMouse: boolean;
    /** 爆发触发计数器 | Burst trigger counter */
    burstTrigger: number;

    // ===== Actions =====
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

    // ===== UI Actions =====
    /** 设置激活的 Tab | Set active tab */
    setActiveTab: (tab: ParticleEditorTab) => void;
    /** 切换全屏 | Toggle fullscreen */
    toggleFullscreen: () => void;
    /** 切换跟随鼠标 | Toggle follow mouse */
    toggleFollowMouse: () => void;
    /** 触发爆发 | Trigger burst */
    triggerBurst: () => void;

    // ===== 文件操作 | File Operations =====
    /** 加载文件 | Load file */
    loadFile: (path: string, fileSystem: { readFile: (path: string) => Promise<string> }) => Promise<void>;
    /** 保存文件 | Save file */
    saveFile: (fileSystem: { writeFile: (path: string, content: string) => Promise<void> }, dialogService?: { saveDialog: (options: any) => Promise<string | null> }) => Promise<boolean>;
}

/**
 * 粒子编辑器 Store
 * Particle editor store
 */
export const useParticleEditorStore = create<ParticleEditorState>()(
    subscribeWithSelector((set, get) => ({
        // ===== 初始状态 | Initial State =====
        filePath: null,
        pendingFilePath: null,
        particleData: null,
        isDirty: false,
        isLoading: false,
        activeTab: 'basic' as ParticleEditorTab,
        isFullscreen: false,
        selectedPreset: null,
        isPlaying: false,
        followMouse: false,
        burstTrigger: 0,

        // ===== 基础 Actions | Basic Actions =====
        setFilePath: (path) => set({ filePath: path }),

        setPendingFilePath: (path) => set({ pendingFilePath: path }),

        setParticleData: (data) => set((state) => ({
            particleData: data,
            // 加载时不标记 dirty | Don't mark dirty when loading
            isDirty: state.isLoading ? false : (state.filePath !== null || state.particleData !== null),
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
            isLoading: false,
            activeTab: 'basic',
            isFullscreen: false,
            selectedPreset: null,
            isPlaying: false,
            followMouse: false,
            burstTrigger: 0,
        }),

        createNew: (name = 'New Particle') => set({
            particleData: createDefaultParticleAsset(name),
            filePath: null,
            isDirty: true,
            isPlaying: true,  // 自动播放 | Auto play
            selectedPreset: null,
            isLoading: false,
        }),

        // ===== UI Actions =====
        setActiveTab: (tab) => set({ activeTab: tab }),

        toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

        toggleFollowMouse: () => set((state) => ({ followMouse: !state.followMouse })),

        triggerBurst: () => set((state) => ({ burstTrigger: state.burstTrigger + 1 })),

        // ===== 文件操作 | File Operations =====
        loadFile: async (path, fileSystem) => {
            set({ isLoading: true });
            try {
                const content = await fileSystem.readFile(path);
                const data = JSON.parse(content) as IParticleAsset;
                const defaults = createDefaultParticleAsset();
                set({
                    particleData: { ...defaults, ...data },
                    filePath: path,
                    isDirty: false,
                    isLoading: false,
                    pendingFilePath: null,
                });
            } catch (error) {
                console.error('[ParticleEditorStore] Failed to load file:', error);
                set({ isLoading: false });
            }
        },

        saveFile: async (fileSystem, dialogService) => {
            const state = get();
            if (!state.particleData) return false;

            let savePath = state.filePath;

            // 如果没有路径，弹出保存对话框 | If no path, show save dialog
            if (!savePath && dialogService) {
                savePath = await dialogService.saveDialog({
                    title: 'Save Particle Effect',
                    filters: [{ name: 'Particle Effect', extensions: ['particle'] }],
                    defaultPath: `${state.particleData.name || 'new-particle'}.particle`,
                });
                if (!savePath) return false;
            }

            if (!savePath) return false;

            try {
                await fileSystem.writeFile(savePath, JSON.stringify(state.particleData, null, 2));
                set({ filePath: savePath, isDirty: false });
                return true;
            } catch (error) {
                console.error('[ParticleEditorStore] Failed to save:', error);
                return false;
            }
        },
    }))
);
