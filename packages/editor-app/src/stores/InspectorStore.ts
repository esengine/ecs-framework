/**
 * 检查器状态管理
 * Inspector state management
 *
 * 管理检查器面板的状态，减少 useEffect 数量
 * Manages inspector panel state to reduce useEffect count
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Entity } from '@esengine/ecs-framework';
import type { InspectorTarget, AssetFileInfo, RemoteEntity, EntityDetails } from '../components/inspectors/types';

// ============= Types =============

/**
 * 检查器 Store 状态
 * Inspector store state
 */
export interface InspectorState {
    /** 当前检查目标 | Current inspection target */
    target: InspectorTarget;
    /** 组件版本（触发刷新）| Component version (triggers refresh) */
    componentVersion: number;
    /** 自动刷新 | Auto refresh */
    autoRefresh: boolean;
    /** 是否锁定 | Is locked */
    isLocked: boolean;
    /** 小数位数设置 | Decimal places setting */
    decimalPlaces: number;
}

/**
 * 检查器 Store Actions
 * Inspector store actions
 */
export interface InspectorActions {
    /** 设置目标 | Set target */
    setTarget: (target: InspectorTarget) => void;
    /** 设置实体目标 | Set entity target */
    setEntityTarget: (entity: Entity) => void;
    /** 设置远程实体目标 | Set remote entity target */
    setRemoteEntityTarget: (entity: RemoteEntity, details?: unknown) => void;
    /** 设置资产文件目标 | Set asset file target */
    setAssetFileTarget: (fileInfo: AssetFileInfo, content?: string, isImage?: boolean) => void;
    /** 设置扩展目标 | Set extension target */
    setExtensionTarget: (data: Record<string, unknown>) => void;
    /** 清除目标 | Clear target */
    clearTarget: () => void;
    /** 更新远程实体详情 | Update remote entity details */
    updateRemoteEntityDetails: (entityId: number, details: unknown) => void;
    /** 增加组件版本 | Increment component version */
    incrementComponentVersion: () => void;
    /** 设置自动刷新 | Set auto refresh */
    setAutoRefresh: (autoRefresh: boolean) => void;
    /** 设置锁定状态 | Set locked state */
    setIsLocked: (locked: boolean) => void;
    /** 设置小数位数 | Set decimal places */
    setDecimalPlaces: (places: number) => void;
    /** 重置 | Reset */
    reset: () => void;
}

export type InspectorStore = InspectorState & InspectorActions;

// ============= Initial State =============

const initialState: InspectorState = {
    target: null,
    componentVersion: 0,
    autoRefresh: true,
    isLocked: false,
    decimalPlaces: 4,
};

// ============= Store =============

/**
 * 检查器状态 Store
 * Inspector state store
 */
export const useInspectorStore = create<InspectorStore>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        setTarget: (target) => set({ target }),

        setEntityTarget: (entity) => {
            // 锁定时忽略 | Ignore when locked
            if (get().isLocked) return;
            set({
                target: { type: 'entity', data: entity },
                componentVersion: 0
            });
        },

        setRemoteEntityTarget: (entity, details) => {
            // 锁定时忽略 | Ignore when locked
            if (get().isLocked) return;
            set({
                target: { type: 'remote-entity', data: entity, details: details as EntityDetails | undefined }
            });
        },

        setAssetFileTarget: (fileInfo, content, isImage) => {
            // 锁定时忽略 | Ignore when locked
            if (get().isLocked) return;
            set({
                target: { type: 'asset-file', data: fileInfo, content, isImage }
            });
        },

        setExtensionTarget: (data) => {
            // 锁定时忽略 | Ignore when locked
            if (get().isLocked) return;
            set({
                target: { type: 'extension', data }
            });
        },

        clearTarget: () => {
            // 锁定时忽略 | Ignore when locked
            if (get().isLocked) return;
            set({ target: null, componentVersion: 0 });
        },

        updateRemoteEntityDetails: (entityId, details) => {
            const state = get();
            if (state.target?.type === 'remote-entity' && state.target.data.id === entityId) {
                set({
                    target: { ...state.target, details: details as EntityDetails | undefined }
                });
            }
        },

        incrementComponentVersion: () => set((state) => ({
            componentVersion: state.componentVersion + 1
        })),

        setAutoRefresh: (autoRefresh) => set({ autoRefresh }),

        setIsLocked: (locked) => set({ isLocked: locked }),

        setDecimalPlaces: (places) => set({ decimalPlaces: places }),

        reset: () => set(initialState),
    }))
);

// ============= Selectors =============

/** 选择目标 | Select target */
export const selectTarget = (state: InspectorStore) => state.target;

/** 选择目标类型 | Select target type */
export const selectTargetType = (state: InspectorStore) => state.target?.type ?? null;

/** 选择是否锁定 | Select is locked */
export const selectIsLocked = (state: InspectorStore) => state.isLocked;

/** 选择组件版本 | Select component version */
export const selectComponentVersion = (state: InspectorStore) => state.componentVersion;
