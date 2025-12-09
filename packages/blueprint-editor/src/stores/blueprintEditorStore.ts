/**
 * Blueprint Editor Store - State management for blueprint editor
 * 蓝图编辑器状态管理
 */

import { create } from 'zustand';
import { createEmptyBlueprint } from '@esengine/blueprint';
import type { BlueprintAsset, BlueprintNode, BlueprintConnection } from '@esengine/blueprint';

/**
 * Blueprint editor state interface
 * 蓝图编辑器状态接口
 */
interface BlueprintEditorState {
    /** Current blueprint being edited (当前编辑的蓝图) */
    blueprint: BlueprintAsset | null;

    /** Selected node IDs (选中的节点ID) */
    selectedNodeIds: string[];

    /** Currently dragging node (当前拖拽的节点) */
    draggingNodeId: string | null;

    /** Canvas pan offset (画布平移偏移) */
    panOffset: { x: number; y: number };

    /** Canvas zoom level (画布缩放级别) */
    zoom: number;

    /** Whether the blueprint has unsaved changes (是否有未保存的更改) */
    isDirty: boolean;

    /** Pending file path to load when panel opens (面板打开时待加载的文件路径) */
    pendingFilePath: string | null;

    /** Current file path if saved (当前文件路径) */
    filePath: string | null;

    // Actions (操作)
    /** Create new blueprint (创建新蓝图) */
    createNewBlueprint: (name: string) => void;

    /** Load blueprint from asset (从资产加载蓝图) */
    loadBlueprint: (asset: BlueprintAsset, filePath?: string) => void;

    /** Add a node (添加节点) */
    addNode: (node: BlueprintNode) => void;

    /** Remove a node (移除节点) */
    removeNode: (nodeId: string) => void;

    /** Update node position (更新节点位置) */
    updateNodePosition: (nodeId: string, x: number, y: number) => void;

    /** Update node data (更新节点数据) */
    updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;

    /** Add connection (添加连接) */
    addConnection: (connection: BlueprintConnection) => void;

    /** Remove connection (移除连接) */
    removeConnection: (connectionId: string) => void;

    /** Select nodes (选择节点) */
    selectNodes: (nodeIds: string[]) => void;

    /** Clear selection (清除选择) */
    clearSelection: () => void;

    /** Set pan offset (设置平移偏移) */
    setPanOffset: (x: number, y: number) => void;

    /** Set zoom level (设置缩放级别) */
    setZoom: (zoom: number) => void;

    /** Mark as dirty (标记为已修改) */
    markDirty: () => void;

    /** Mark as clean (标记为未修改) */
    markClean: () => void;

    /** Set pending file path (设置待加载的文件路径) */
    setPendingFilePath: (path: string | null) => void;
}

/**
 * Generate unique ID for nodes and connections
 * 为节点和连接生成唯一ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 更新 metadata 的修改时间
 * Update metadata modification time
 */
function getUpdatedMetadata(blueprint: BlueprintAsset): BlueprintAsset['metadata'] {
    return { ...blueprint.metadata, modifiedAt: Date.now() };
}

/**
 * Blueprint editor store
 * 蓝图编辑器状态存储
 */
export const useBlueprintEditorStore = create<BlueprintEditorState>((set, get) => ({
    blueprint: null,
    selectedNodeIds: [],
    draggingNodeId: null,
    panOffset: { x: 0, y: 0 },
    zoom: 1,
    isDirty: false,
    pendingFilePath: null,
    filePath: null,

    createNewBlueprint: (name: string) => {
        const blueprint = createEmptyBlueprint(name);
        set({
            blueprint,
            selectedNodeIds: [],
            panOffset: { x: 0, y: 0 },
            zoom: 1,
            isDirty: false,
            filePath: null
        });
    },

    loadBlueprint: (asset: BlueprintAsset, filePath?: string) => {
        set({
            blueprint: asset,
            selectedNodeIds: [],
            panOffset: { x: 0, y: 0 },
            zoom: 1,
            isDirty: false,
            filePath: filePath ?? null
        });
    },

    addNode: (node: BlueprintNode) => {
        const { blueprint } = get();
        if (!blueprint) return;

        const newNode = { ...node, id: node.id || generateId() };
        set({
            blueprint: {
                ...blueprint,
                nodes: [...blueprint.nodes, newNode],
                metadata: getUpdatedMetadata(blueprint)
            },
            isDirty: true
        });
    },

    removeNode: (nodeId: string) => {
        const { blueprint } = get();
        if (!blueprint) return;

        set({
            blueprint: {
                ...blueprint,
                nodes: blueprint.nodes.filter(n => n.id !== nodeId),
                connections: blueprint.connections.filter(
                    c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
                ),
                metadata: getUpdatedMetadata(blueprint)
            },
            selectedNodeIds: get().selectedNodeIds.filter(id => id !== nodeId),
            isDirty: true
        });
    },

    updateNodePosition: (nodeId: string, x: number, y: number) => {
        const { blueprint } = get();
        if (!blueprint) return;

        set({
            blueprint: {
                ...blueprint,
                nodes: blueprint.nodes.map(n =>
                    n.id === nodeId ? { ...n, position: { x, y } } : n
                ),
                metadata: getUpdatedMetadata(blueprint)
            },
            isDirty: true
        });
    },

    updateNodeData: (nodeId: string, data: Record<string, unknown>) => {
        const { blueprint } = get();
        if (!blueprint) return;

        set({
            blueprint: {
                ...blueprint,
                nodes: blueprint.nodes.map(n =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
                ),
                metadata: getUpdatedMetadata(blueprint)
            },
            isDirty: true
        });
    },

    addConnection: (connection: BlueprintConnection) => {
        const { blueprint } = get();
        if (!blueprint) return;

        const newConnection = { ...connection, id: connection.id || generateId() };

        // Check for existing connection to the same input pin
        // 检查是否已存在到同一输入引脚的连接
        const existingIndex = blueprint.connections.findIndex(
            c => c.toNodeId === connection.toNodeId && c.toPin === connection.toPin
        );

        const newConnections = [...blueprint.connections];
        if (existingIndex >= 0) {
            // Replace existing connection (替换现有连接)
            newConnections[existingIndex] = newConnection;
        } else {
            newConnections.push(newConnection);
        }

        set({
            blueprint: {
                ...blueprint,
                connections: newConnections,
                metadata: getUpdatedMetadata(blueprint)
            },
            isDirty: true
        });
    },

    removeConnection: (connectionId: string) => {
        const { blueprint } = get();
        if (!blueprint) return;

        set({
            blueprint: {
                ...blueprint,
                connections: blueprint.connections.filter(c => c.id !== connectionId),
                metadata: getUpdatedMetadata(blueprint)
            },
            isDirty: true
        });
    },

    selectNodes: (nodeIds: string[]) => {
        set({ selectedNodeIds: nodeIds });
    },

    clearSelection: () => {
        set({ selectedNodeIds: [] });
    },

    setPanOffset: (x: number, y: number) => {
        set({ panOffset: { x, y } });
    },

    setZoom: (zoom: number) => {
        set({ zoom: Math.max(0.1, Math.min(2, zoom)) });
    },

    markDirty: () => {
        set({ isDirty: true });
    },

    markClean: () => {
        set({ isDirty: false });
    },

    setPendingFilePath: (path: string | null) => {
        set({ pendingFilePath: path });
    }
}));
