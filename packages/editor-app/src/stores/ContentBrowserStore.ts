/**
 * ContentBrowser Store - 内容浏览器状态管理
 * Content Browser State Management
 *
 * 使用 Zustand 替代 ContentBrowser 中的大量 useEffect 和 useState
 * Using Zustand to replace numerous useEffect and useState in ContentBrowser
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { TauriAPI, DirectoryEntry } from '../api/tauri';

// ============= Types =============

export interface AssetItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
    extension?: string;
    size?: number;
    modified?: number;
}

export interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
    isExpanded: boolean;
}

interface ContentBrowserState {
    // 浏览状态 | Browsing state
    currentPath: string | null;
    assets: AssetItem[];
    loading: boolean;
    folderTree: FolderNode | null;
    expandedFolders: Set<string>;

    // 选择状态 | Selection state
    selectedPaths: Set<string>;
    lastSelectedPath: string | null;

    // 视图状态 | View state
    viewMode: 'grid' | 'list';
    sortBy: 'name' | 'type' | 'size' | 'modified';
    sortOrder: 'asc' | 'desc';
    searchQuery: string;

    // 刷新版本号（用于强制刷新）| Refresh version (for forcing refresh)
    refreshVersion: number;
}

interface ContentBrowserActions {
    // 初始化 | Initialization
    initialize: (projectPath: string) => Promise<void>;
    cleanup: () => void;

    // 导航操作 | Navigation actions
    setCurrentPath: (path: string) => void;
    navigateToFolder: (path: string) => Promise<void>;

    // 资产操作 | Asset actions
    loadAssets: (path: string) => Promise<void>;
    refreshCurrentFolder: () => Promise<void>;
    buildFolderTree: (rootPath: string) => Promise<void>;

    // 文件夹展开 | Folder expansion
    toggleFolderExpand: (path: string) => void;
    setExpandedFolders: (folders: Set<string> | ((prev: Set<string>) => Set<string>)) => void;

    // 选择操作 | Selection actions
    setSelectedPaths: (paths: Set<string>) => void;
    selectPath: (path: string, multiSelect?: boolean, rangeSelect?: boolean) => void;
    clearSelection: () => void;
    setLastSelectedPath: (path: string | null) => void;

    // 视图操作 | View actions
    setViewMode: (mode: 'grid' | 'list') => void;
    setSortBy: (by: 'name' | 'type' | 'size' | 'modified') => void;
    toggleSortOrder: () => void;
    setSearchQuery: (query: string) => void;

    // 强制刷新 | Force refresh
    triggerRefresh: () => void;
}

export type ContentBrowserStore = ContentBrowserState & ContentBrowserActions;

// ============= Initial State =============

const initialState: ContentBrowserState = {
    currentPath: null,
    assets: [],
    loading: false,
    folderTree: null,
    expandedFolders: new Set(),
    selectedPaths: new Set(),
    lastSelectedPath: null,
    viewMode: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    searchQuery: '',
    refreshVersion: 0,
};

// ============= Store =============

/** 消息订阅取消函数 | Message subscription unsubscribe functions */
let _unsubscribeAssetChanged: (() => void) | null = null;
let _unsubscribeAssetRefresh: (() => void) | null = null;
let _currentProjectPath: string | null = null;

/**
 * ContentBrowser Store
 * 内容浏览器全局状态
 */
export const useContentBrowserStore = create<ContentBrowserStore>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        // ===== 初始化 | Initialization =====
        initialize: async (projectPath: string) => {
            _currentProjectPath = projectPath;

            // 设置初始路径和展开状态
            // Set initial path and expanded state
            set({
                currentPath: projectPath,
                expandedFolders: new Set([projectPath]),
            });

            // 加载资产和文件夹树
            // Load assets and folder tree
            await get().loadAssets(projectPath);
            await get().buildFolderTree(projectPath);

            // 订阅消息事件（替代 useEffect）
            // Subscribe to message events (replacing useEffect)
            const messageHub = Core.services.tryResolve(MessageHub);
            if (messageHub) {
                // 资产变化事件
                // Asset changed event
                _unsubscribeAssetChanged = messageHub.subscribe(
                    'assets:changed',
                    (data: { type: string; path: string; relativePath: string; guid: string }) => {
                        const { currentPath } = get();
                        if (!currentPath || !data.path) return;

                        const normalizedPath = data.path.replace(/\\/g, '/');
                        const normalizedCurrentPath = currentPath.replace(/\\/g, '/');
                        const parentDir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));

                        if (parentDir === normalizedCurrentPath) {
                            // 刷新当前目录 | Refresh current directory
                            get().loadAssets(currentPath);
                        }
                    }
                );

                // 通用刷新事件
                // Generic refresh event
                _unsubscribeAssetRefresh = messageHub.subscribe(
                    'assets:refresh',
                    () => {
                        const { currentPath } = get();
                        if (currentPath) {
                            get().loadAssets(currentPath);
                        }
                    }
                );
            }
        },

        cleanup: () => {
            // 清理订阅 | Cleanup subscriptions
            if (_unsubscribeAssetChanged) {
                _unsubscribeAssetChanged();
                _unsubscribeAssetChanged = null;
            }
            if (_unsubscribeAssetRefresh) {
                _unsubscribeAssetRefresh();
                _unsubscribeAssetRefresh = null;
            }
            _currentProjectPath = null;

            // 重置状态 | Reset state
            set(initialState);
        },

        // ===== 导航操作 | Navigation actions =====
        setCurrentPath: (path: string) => {
            set({ currentPath: path });
        },

        navigateToFolder: async (path: string) => {
            set({ currentPath: path });
            await get().loadAssets(path);
        },

        // ===== 资产操作 | Asset actions =====
        loadAssets: async (path: string) => {
            set({ loading: true });
            try {
                const entries = await TauriAPI.listDirectory(path);
                const assetItems: AssetItem[] = entries.map((entry: DirectoryEntry) => ({
                    name: entry.name,
                    path: entry.path,
                    type: entry.is_dir ? 'folder' as const : 'file' as const,
                    extension: entry.is_dir ? undefined : entry.name.split('.').pop(),
                    size: entry.size,
                    modified: entry.modified
                }));

                // 排序：文件夹优先，然后按名称
                // Sort: folders first, then by name
                const sorted = assetItems.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'folder' ? -1 : 1;
                });

                set({ assets: sorted, loading: false });
            } catch (error) {
                console.error('Failed to load assets:', error);
                set({ assets: [], loading: false });
            }
        },

        refreshCurrentFolder: async () => {
            const { currentPath } = get();
            if (currentPath) {
                await get().loadAssets(currentPath);
            }
        },

        buildFolderTree: async (rootPath: string) => {
            const { expandedFolders } = get();

            const buildNode = async (path: string, name: string): Promise<FolderNode> => {
                const node: FolderNode = {
                    name,
                    path,
                    children: [],
                    isExpanded: expandedFolders.has(path)
                };

                try {
                    const entries = await TauriAPI.listDirectory(path);
                    const folders = entries
                        .filter((e: DirectoryEntry) => e.is_dir && !e.name.startsWith('.'))
                        .sort((a: DirectoryEntry, b: DirectoryEntry) => a.name.localeCompare(b.name));

                    for (const folder of folders) {
                        if (expandedFolders.has(path)) {
                            node.children.push(await buildNode(folder.path, folder.name));
                        } else {
                            node.children.push({
                                name: folder.name,
                                path: folder.path,
                                children: [],
                                isExpanded: false
                            });
                        }
                    }
                } catch (error) {
                    console.error('Failed to build folder tree:', error);
                }

                return node;
            };

            const tree = await buildNode(rootPath, 'All');
            set({ folderTree: tree });
        },

        // ===== 文件夹展开 | Folder expansion =====
        toggleFolderExpand: (path: string) => {
            set((state) => {
                const next = new Set(state.expandedFolders);
                if (next.has(path)) {
                    next.delete(path);
                } else {
                    next.add(path);
                }
                return { expandedFolders: next };
            });

            // 重建文件夹树
            // Rebuild folder tree
            if (_currentProjectPath) {
                get().buildFolderTree(_currentProjectPath);
            }
        },

        setExpandedFolders: (foldersOrUpdater) => {
            set((state) => ({
                expandedFolders: typeof foldersOrUpdater === 'function'
                    ? foldersOrUpdater(state.expandedFolders)
                    : foldersOrUpdater
            }));
        },

        // ===== 选择操作 | Selection actions =====
        setSelectedPaths: (paths: Set<string>) => {
            set({ selectedPaths: paths });
        },

        selectPath: (path: string, multiSelect = false, rangeSelect = false) => {
            const { selectedPaths, lastSelectedPath, assets } = get();

            if (rangeSelect && lastSelectedPath) {
                // 范围选择 | Range selection
                const startIndex = assets.findIndex(a => a.path === lastSelectedPath);
                const endIndex = assets.findIndex(a => a.path === path);
                if (startIndex >= 0 && endIndex >= 0) {
                    const [from, to] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
                    const rangePaths = new Set(assets.slice(from, to + 1).map(a => a.path));
                    set({
                        selectedPaths: rangePaths,
                        lastSelectedPath: path
                    });
                    return;
                }
            }

            if (multiSelect) {
                // 多选切换 | Multi-select toggle
                const next = new Set(selectedPaths);
                if (next.has(path)) {
                    next.delete(path);
                } else {
                    next.add(path);
                }
                set({
                    selectedPaths: next,
                    lastSelectedPath: path
                });
            } else {
                // 单选 | Single select
                set({
                    selectedPaths: new Set([path]),
                    lastSelectedPath: path
                });
            }
        },

        clearSelection: () => {
            set({
                selectedPaths: new Set(),
                lastSelectedPath: null
            });
        },

        setLastSelectedPath: (path: string | null) => {
            set({ lastSelectedPath: path });
        },

        // ===== 视图操作 | View actions =====
        setViewMode: (mode: 'grid' | 'list') => {
            set({ viewMode: mode });
        },

        setSortBy: (by: 'name' | 'type' | 'size' | 'modified') => {
            set({ sortBy: by });
        },

        toggleSortOrder: () => {
            set((state) => ({
                sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc'
            }));
        },

        setSearchQuery: (query: string) => {
            set({ searchQuery: query });
        },

        // ===== 强制刷新 | Force refresh =====
        triggerRefresh: () => {
            set((state) => ({ refreshVersion: state.refreshVersion + 1 }));
            get().refreshCurrentFolder();
        },
    }))
);

// ============= Selectors =============

/** 获取当前过滤后的资产列表 | Get current filtered assets */
export const selectFilteredAssets = (state: ContentBrowserStore): AssetItem[] => {
    const { assets, searchQuery } = state;
    if (!searchQuery.trim()) return assets;
    return assets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
};

/** 获取选中的资产 | Get selected assets */
export const selectSelectedAssets = (state: ContentBrowserStore): AssetItem[] => {
    const { assets, selectedPaths } = state;
    return assets.filter(a => selectedPaths.has(a.path));
};
