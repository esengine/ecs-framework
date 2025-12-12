/**
 * 编辑器全局状态管理
 * Editor global state management
 *
 * 使用 Zustand 替代 App.tsx 中的大量 useState，解决：
 * Using Zustand to replace numerous useState in App.tsx, solving:
 * 1. 状态变化导致全局重渲染 | State changes causing global re-renders
 * 2. useEffect 依赖过多导致面板频繁重建 | Too many useEffect deps causing panel rebuilds
 * 3. 服务状态与 UI 状态混杂 | Service state mixed with UI state
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { FlexDockPanel } from '../components/FlexLayoutDockContainer';

// ============= Types =============

/**
 * 项目状态
 * Project state
 */
export interface ProjectState {
    /** 是否已加载项目 | Is project loaded */
    projectLoaded: boolean;
    /** 当前项目路径 | Current project path */
    currentProjectPath: string | null;
    /** 可用场景列表 | Available scenes list */
    availableScenes: string[];
    /** 是否正在加载 | Is loading */
    isLoading: boolean;
    /** 加载消息 | Loading message */
    loadingMessage: string;
}

/**
 * 面板状态
 * Panel state
 */
export interface PanelState {
    /** 面板列表 | Panel list */
    panels: FlexDockPanel[];
    /** 活动的动态面板 ID 列表 | Active dynamic panel IDs */
    activeDynamicPanels: string[];
    /** 动态面板标题映射 | Dynamic panel title map */
    dynamicPanelTitles: Map<string, string>;
    /** 当前活动面板 ID | Current active panel ID */
    activePanelId: string | undefined;
    /** 插件更新触发器 | Plugin update trigger */
    pluginUpdateTrigger: number;
}

/**
 * UI 状态
 * UI state
 */
export interface UIState {
    /** 是否连接到远程设备 | Is connected to remote device */
    isRemoteConnected: boolean;
    /** ContentBrowser 是否停靠 | Is ContentBrowser docked */
    isContentBrowserDocked: boolean;
    /** 编辑器是否全屏 | Is editor fullscreen */
    isEditorFullscreen: boolean;
    /** 状态栏文本 | Status bar text */
    status: string;
    /** 是否显示项目向导 | Show project wizard */
    showProjectWizard: boolean;
    /** 设置窗口初始分类 | Settings window initial category */
    settingsInitialCategory: string | undefined;
}

/**
 * 编译器对话框状态
 * Compiler dialog state
 */
export interface CompilerDialogState {
    isOpen: boolean;
    compilerId: string;
    currentFileName?: string;
}

// ============= Actions =============

export interface EditorActions {
    // 项目操作 | Project actions
    setProjectLoaded: (loaded: boolean) => void;
    setCurrentProjectPath: (path: string | null) => void;
    setAvailableScenes: (scenes: string[]) => void;
    setIsLoading: (loading: boolean, message?: string) => void;
    resetProject: () => void;

    // 面板操作 | Panel actions
    setPanels: (panels: FlexDockPanel[] | ((prev: FlexDockPanel[]) => FlexDockPanel[])) => void;
    addDynamicPanel: (panelId: string, title?: string) => void;
    removeDynamicPanel: (panelId: string) => void;
    clearDynamicPanels: () => void;
    setDynamicPanelTitle: (panelId: string, title: string) => void;
    setActivePanelId: (id: string | undefined) => void;
    triggerPluginUpdate: () => void;

    // UI 操作 | UI actions
    setIsRemoteConnected: (connected: boolean | ((prev: boolean) => boolean)) => void;
    setIsContentBrowserDocked: (docked: boolean) => void;
    setIsEditorFullscreen: (fullscreen: boolean) => void;
    setStatus: (status: string) => void;
    setShowProjectWizard: (show: boolean) => void;
    setSettingsInitialCategory: (category: string | undefined) => void;

    // 编译器对话框 | Compiler dialog
    openCompilerDialog: (compilerId: string, currentFileName?: string) => void;
    closeCompilerDialog: () => void;
}

// ============= Store Type =============

export type EditorState = ProjectState & PanelState & UIState & {
    compilerDialog: CompilerDialogState;
} & EditorActions;

// ============= Initial State =============

const initialProjectState: ProjectState = {
    projectLoaded: false,
    currentProjectPath: null,
    availableScenes: [],
    isLoading: false,
    loadingMessage: '',
};

const initialPanelState: PanelState = {
    panels: [],
    activeDynamicPanels: [],
    dynamicPanelTitles: new Map(),
    activePanelId: undefined,
    pluginUpdateTrigger: 0,
};

const initialUIState: UIState = {
    isRemoteConnected: false,
    isContentBrowserDocked: false,
    isEditorFullscreen: false,
    status: '',
    showProjectWizard: false,
    settingsInitialCategory: undefined,
};

const initialCompilerDialog: CompilerDialogState = {
    isOpen: false,
    compilerId: '',
    currentFileName: undefined,
};

// ============= Store =============

/**
 * 编辑器全局 Store
 * Editor global store
 */
export const useEditorStore = create<EditorState>()(
    subscribeWithSelector((set, get) => ({
        // 初始状态 | Initial state
        ...initialProjectState,
        ...initialPanelState,
        ...initialUIState,
        compilerDialog: initialCompilerDialog,

        // ===== 项目操作 | Project actions =====
        setProjectLoaded: (loaded) => set({ projectLoaded: loaded }),

        setCurrentProjectPath: (path) => set({ currentProjectPath: path }),

        setAvailableScenes: (scenes) => set({ availableScenes: scenes }),

        setIsLoading: (loading, message) => set({
            isLoading: loading,
            loadingMessage: message ?? (loading ? 'Loading...' : ''),
        }),

        resetProject: () => set({
            ...initialProjectState,
            ...initialPanelState,
        }),

        // ===== 面板操作 | Panel actions =====
        setPanels: (panelsOrUpdater) => set((state) => ({
            panels: typeof panelsOrUpdater === 'function'
                ? panelsOrUpdater(state.panels)
                : panelsOrUpdater
        })),

        addDynamicPanel: (panelId, title) => set((state) => {
            if (state.activeDynamicPanels.includes(panelId)) {
                return state;
            }
            const newTitles = new Map(state.dynamicPanelTitles);
            if (title) {
                newTitles.set(panelId, title);
            }
            return {
                activeDynamicPanels: [...state.activeDynamicPanels, panelId],
                dynamicPanelTitles: newTitles,
            };
        }),

        removeDynamicPanel: (panelId) => set((state) => {
            const newTitles = new Map(state.dynamicPanelTitles);
            newTitles.delete(panelId);
            return {
                activeDynamicPanels: state.activeDynamicPanels.filter(id => id !== panelId),
                dynamicPanelTitles: newTitles,
            };
        }),

        clearDynamicPanels: () => set({
            activeDynamicPanels: [],
            dynamicPanelTitles: new Map(),
        }),

        setDynamicPanelTitle: (panelId, title) => set((state) => {
            const newTitles = new Map(state.dynamicPanelTitles);
            newTitles.set(panelId, title);
            return { dynamicPanelTitles: newTitles };
        }),

        setActivePanelId: (id) => set({ activePanelId: id }),

        triggerPluginUpdate: () => set((state) => ({
            pluginUpdateTrigger: state.pluginUpdateTrigger + 1,
        })),

        // ===== UI 操作 | UI actions =====
        setIsRemoteConnected: (connectedOrUpdater) => set((state) => ({
            isRemoteConnected: typeof connectedOrUpdater === 'function'
                ? connectedOrUpdater(state.isRemoteConnected)
                : connectedOrUpdater
        })),

        setIsContentBrowserDocked: (docked) => set({ isContentBrowserDocked: docked }),

        setIsEditorFullscreen: (fullscreen) => set({ isEditorFullscreen: fullscreen }),

        setStatus: (status) => set({ status }),

        setShowProjectWizard: (show) => set({ showProjectWizard: show }),

        setSettingsInitialCategory: (category) => set({ settingsInitialCategory: category }),

        // ===== 编译器对话框 | Compiler dialog =====
        openCompilerDialog: (compilerId, currentFileName) => set({
            compilerDialog: { isOpen: true, compilerId, currentFileName },
        }),

        closeCompilerDialog: () => set({
            compilerDialog: initialCompilerDialog,
        }),
    }))
);

// ============= Selectors =============
// 使用 selector 避免不必要的重渲染 | Use selectors to avoid unnecessary re-renders

/** 选择项目状态 | Select project state */
export const selectProjectState = (state: EditorState): ProjectState => ({
    projectLoaded: state.projectLoaded,
    currentProjectPath: state.currentProjectPath,
    availableScenes: state.availableScenes,
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
});

/** 选择面板状态 | Select panel state */
export const selectPanelState = (state: EditorState): PanelState => ({
    panels: state.panels,
    activeDynamicPanels: state.activeDynamicPanels,
    dynamicPanelTitles: state.dynamicPanelTitles,
    activePanelId: state.activePanelId,
    pluginUpdateTrigger: state.pluginUpdateTrigger,
});

/** 选择 UI 状态 | Select UI state */
export const selectUIState = (state: EditorState): UIState => ({
    isRemoteConnected: state.isRemoteConnected,
    isContentBrowserDocked: state.isContentBrowserDocked,
    isEditorFullscreen: state.isEditorFullscreen,
    status: state.status,
    showProjectWizard: state.showProjectWizard,
    settingsInitialCategory: state.settingsInitialCategory,
});
