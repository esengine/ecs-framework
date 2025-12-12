/**
 * 场景层级状态管理
 * Scene hierarchy state management
 *
 * 管理场景层级面板的状态，减少 useEffect 数量
 * Manages scene hierarchy panel state to reduce useEffect count
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Entity } from '@esengine/ecs-framework';
import type { RemoteEntity } from '../services/tokens';

// ============= Types =============

/**
 * 场景状态
 * Scene state
 */
export interface SceneInfo {
    /** 场景名称 | Scene name */
    sceneName: string;
    /** 场景文件路径 | Scene file path */
    sceneFilePath: string | null;
    /** 是否已修改 | Is modified */
    isModified: boolean;
}

/**
 * 预制体编辑模式状态
 * Prefab edit mode state
 */
export interface PrefabEditModeState {
    isActive: boolean;
    prefabName: string;
    prefabPath: string;
}

/**
 * 层级 Store 状态
 * Hierarchy store state
 */
export interface HierarchyState {
    // ===== 场景状态 | Scene State =====
    /** 场景信息 | Scene info */
    sceneInfo: SceneInfo;
    /** 预制体编辑模式 | Prefab edit mode */
    prefabEditMode: PrefabEditModeState | null;

    // ===== 实体状态 | Entity State =====
    /** 根实体列表 | Root entities */
    entities: Entity[];
    /** 选中的实体 ID 集合 | Selected entity IDs */
    selectedIds: Set<number>;
    /** 展开的实体 ID 集合 | Expanded entity IDs */
    expandedIds: Set<number>;

    // ===== 远程状态 | Remote State =====
    /** 是否连接到远程 | Is connected to remote */
    isRemoteConnected: boolean;
    /** 远程实体列表 | Remote entities */
    remoteEntities: RemoteEntity[];
    /** 远程场景名称 | Remote scene name */
    remoteSceneName: string | null;
}

/**
 * 层级 Store Actions
 * Hierarchy store actions
 */
export interface HierarchyActions {
    // ===== 场景操作 | Scene Actions =====
    setSceneInfo: (info: Partial<SceneInfo>) => void;
    setPrefabEditMode: (mode: PrefabEditModeState | null) => void;

    // ===== 实体操作 | Entity Actions =====
    setEntities: (entities: Entity[]) => void;
    setSelectedIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
    selectEntity: (entityId: number) => void;
    deselectEntity: (entityId: number) => void;
    clearSelection: () => void;
    toggleExpanded: (entityId: number) => void;
    setExpandedIds: (ids: Set<number> | ((prev: Set<number>) => Set<number>)) => void;

    // ===== 远程操作 | Remote Actions =====
    setIsRemoteConnected: (connected: boolean) => void;
    setRemoteEntities: (entities: RemoteEntity[] | ((prev: RemoteEntity[]) => RemoteEntity[])) => void;
    setRemoteSceneName: (name: string | null) => void;

    // ===== 重置 | Reset =====
    reset: () => void;
}

export type HierarchyStore = HierarchyState & HierarchyActions;

// ============= Initial State =============

const initialSceneInfo: SceneInfo = {
    sceneName: 'Untitled',
    sceneFilePath: null,
    isModified: false,
};

const initialState: HierarchyState = {
    sceneInfo: initialSceneInfo,
    prefabEditMode: null,
    entities: [],
    selectedIds: new Set(),
    expandedIds: new Set([-1]), // -1 is scene root, expanded by default
    isRemoteConnected: false,
    remoteEntities: [],
    remoteSceneName: null,
};

// ============= Store =============

/**
 * 层级状态 Store
 * Hierarchy state store
 */
export const useHierarchyStore = create<HierarchyStore>()(
    subscribeWithSelector((set) => ({
        ...initialState,

        // ===== 场景操作 | Scene Actions =====
        setSceneInfo: (info) => set((state) => ({
            sceneInfo: { ...state.sceneInfo, ...info }
        })),

        setPrefabEditMode: (mode) => set({ prefabEditMode: mode }),

        // ===== 实体操作 | Entity Actions =====
        setEntities: (entities) => set({ entities }),

        setSelectedIds: (idsOrUpdater) => set((state) => ({
            selectedIds: typeof idsOrUpdater === 'function'
                ? idsOrUpdater(state.selectedIds)
                : idsOrUpdater
        })),

        selectEntity: (entityId) => set((state) => {
            const next = new Set(state.selectedIds);
            next.add(entityId);
            return { selectedIds: next };
        }),

        deselectEntity: (entityId) => set((state) => {
            const next = new Set(state.selectedIds);
            next.delete(entityId);
            return { selectedIds: next };
        }),

        clearSelection: () => set({ selectedIds: new Set() }),

        toggleExpanded: (entityId) => set((state) => {
            const next = new Set(state.expandedIds);
            if (next.has(entityId)) {
                next.delete(entityId);
            } else {
                next.add(entityId);
            }
            return { expandedIds: next };
        }),

        setExpandedIds: (idsOrUpdater) => set((state) => ({
            expandedIds: typeof idsOrUpdater === 'function'
                ? idsOrUpdater(state.expandedIds)
                : idsOrUpdater
        })),

        // ===== 远程操作 | Remote Actions =====
        setIsRemoteConnected: (connected) => set({ isRemoteConnected: connected }),

        setRemoteEntities: (entitiesOrUpdater) => set((state) => ({
            remoteEntities: typeof entitiesOrUpdater === 'function'
                ? entitiesOrUpdater(state.remoteEntities)
                : entitiesOrUpdater
        })),

        setRemoteSceneName: (name) => set({ remoteSceneName: name }),

        // ===== 重置 | Reset =====
        reset: () => set(initialState),
    }))
);

// ============= Selectors =============

/** 选择场景信息 | Select scene info */
export const selectSceneInfo = (state: HierarchyStore) => state.sceneInfo;

/** 选择预制体编辑模式 | Select prefab edit mode */
export const selectPrefabEditMode = (state: HierarchyStore) => state.prefabEditMode;

/** 选择选中的实体 ID | Select selected entity IDs */
export const selectSelectedIds = (state: HierarchyStore) => state.selectedIds;

/** 选择第一个选中的 ID | Select first selected ID */
export const selectFirstSelectedId = (state: HierarchyStore) =>
    state.selectedIds.size > 0 ? Array.from(state.selectedIds)[0] : null;

/** 选择展开的实体 ID | Select expanded entity IDs */
export const selectExpandedIds = (state: HierarchyStore) => state.expandedIds;

/** 选择远程连接状态 | Select remote connection state */
export const selectIsRemoteConnected = (state: HierarchyStore) => state.isRemoteConnected;

/** 选择远程实体 | Select remote entities */
export const selectRemoteEntities = (state: HierarchyStore) => state.remoteEntities;
