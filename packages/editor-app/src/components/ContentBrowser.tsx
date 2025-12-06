/**
 * Content Browser - 内容浏览器
 * 用于浏览和管理项目资产
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    Plus,
    Download,
    Save,
    ChevronRight,
    ChevronDown,
    Search,
    SlidersHorizontal,
    LayoutGrid,
    List,
    FolderClosed,
    FolderOpen,
    Folder,
    File,
    FileCode,
    FileJson,
    FileImage,
    FileText,
    Copy,
    Trash2,
    Edit3,
    ExternalLink,
    PanelRightClose,
    Tag,
    Link,
    FileSearch,
    Globe,
    Package,
    Clipboard,
    RefreshCw,
    Settings
} from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, FileActionRegistry, AssetRegistryService, type FileCreationTemplate } from '@esengine/editor-core';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import { SettingsService } from '../services/SettingsService';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { PromptDialog } from './PromptDialog';
import '../styles/ContentBrowser.css';

interface AssetItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
    extension?: string;
    size?: number;
    modified?: number;
}

interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
    isExpanded: boolean;
}

interface ContentBrowserProps {
    projectPath: string | null;
    locale?: string;
    onOpenScene?: (scenePath: string) => void;
    isDrawer?: boolean;
    onDockInLayout?: () => void;
    revealPath?: string | null;
}

/**
 * 根据图标名获取 Lucide 图标组件
 */
function getIconComponent(iconName: string | undefined, size: number = 16): React.ReactNode {
    if (!iconName) return <File size={size} />;

    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
    const IconComponent = icons[iconName];
    if (IconComponent) {
        return <IconComponent size={size} />;
    }

    return <File size={size} />;
}

// 获取资产类型显示名称
function getAssetTypeName(asset: AssetItem): string {
    if (asset.type === 'folder') return 'Folder';

    // Check for compound extensions first
    const name = asset.name.toLowerCase();
    if (name.endsWith('.tilemap.json') || name.endsWith('.tilemap')) return 'Tilemap';
    if (name.endsWith('.tileset.json') || name.endsWith('.tileset')) return 'Tileset';

    const ext = asset.extension?.toLowerCase();
    switch (ext) {
        case 'ecs': return 'Scene';
        case 'btree': return 'Behavior Tree';
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'webp': return 'Texture';
        case 'ts':
        case 'tsx': return 'TypeScript';
        case 'js':
        case 'jsx': return 'JavaScript';
        case 'json': return 'JSON';
        case 'prefab': return 'Prefab';
        case 'mat': return 'Material';
        case 'anim': return 'Animation';
        default: return ext?.toUpperCase() || 'File';
    }
}

export function ContentBrowser({
    projectPath,
    locale = 'en',
    onOpenScene,
    isDrawer = false,
    onDockInLayout,
    revealPath
}: ContentBrowserProps) {
    const messageHub = Core.services.resolve(MessageHub);
    const fileActionRegistry = Core.services.resolve(FileActionRegistry);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [lastSelectedPath, setLastSelectedPath] = useState<string | null>(null);
    const [assets, setAssets] = useState<AssetItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Folder tree state
    const [folderTree, setFolderTree] = useState<FolderNode | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Sections collapse state
    const [favoritesExpanded, setFavoritesExpanded] = useState(true);
    const [collectionsExpanded, setCollectionsExpanded] = useState(true);

    // Favorites (stored paths)
    const [favorites] = useState<string[]>([]);

    // Dialog states
    const [contextMenu, setContextMenu] = useState<{
        position: { x: number; y: number };
        asset: AssetItem | null;
        isBackground?: boolean;
    } | null>(null);
    const [renameDialog, setRenameDialog] = useState<{
        asset: AssetItem;
        newName: string;
    } | null>(null);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<AssetItem | null>(null);
    const [createFileDialog, setCreateFileDialog] = useState<{
        parentPath: string;
        template: FileCreationTemplate;
    } | null>(null);

    // 文件创建模板列表（需要状态跟踪以便插件安装后刷新）
    // File creation templates list (need state tracking to refresh after plugin installation)
    const [fileCreationTemplates, setFileCreationTemplates] = useState<FileCreationTemplate[]>([]);

    // 初始化和监听插件安装事件以更新模板列表
    // Initialize and listen for plugin installation events to update template list
    useEffect(() => {
        const updateTemplates = () => {
            if (fileActionRegistry) {
                const templates = fileActionRegistry.getCreationTemplates();
                setFileCreationTemplates([...templates]);
            }
        };

        // 初始加载
        updateTemplates();

        // 监听插件安装/卸载事件
        if (messageHub) {
            const unsubInstall = messageHub.subscribe('plugin:installed', updateTemplates);
            const unsubUninstall = messageHub.subscribe('plugin:uninstalled', updateTemplates);
            return () => {
                unsubInstall();
                unsubUninstall();
            };
        }
    }, [fileActionRegistry, messageHub]);

    const t = {
        en: {
            favorites: 'Favorites',
            collections: 'Collections',
            add: 'Add',
            import: 'Import',
            saveAll: 'Save All',
            search: 'Search',
            items: 'items',
            dockInLayout: 'Dock in Layout',
            noProject: 'No project loaded',
            empty: 'This folder is empty',
            newFolder: 'New Folder',
            newPrefix: 'New'
        },
        zh: {
            favorites: '收藏夹',
            collections: '收藏集',
            add: '添加',
            import: '导入',
            saveAll: '全部保存',
            search: '搜索',
            items: '项',
            dockInLayout: '停靠到布局',
            noProject: '未加载项目',
            empty: '文件夹为空',
            newFolder: '新建文件夹',
            newPrefix: '新建'
        }
    }[locale] || {
        favorites: 'Favorites',
        collections: 'Collections',
        add: 'Add',
        import: 'Import',
        saveAll: 'Save All',
        search: 'Search',
        items: 'items',
        dockInLayout: 'Dock in Layout',
        noProject: 'No project loaded',
        empty: 'This folder is empty',
        newFolder: 'New Folder',
        newPrefix: 'New'
    };

    // 文件创建模板的 label 本地化映射
    const templateLabels: Record<string, { en: string; zh: string }> = {
        'Material': { en: 'Material', zh: '材质' },
        'Shader': { en: 'Shader', zh: '着色器' },
        'Tilemap': { en: 'Tilemap', zh: '瓦片地图' },
        'Tileset': { en: 'Tileset', zh: '瓦片集' },
        'Component': { en: 'Component', zh: '组件' },
        'System': { en: 'System', zh: '系统' },
        'TypeScript': { en: 'TypeScript', zh: 'TypeScript' },
    };

    // 注册内置的 TypeScript 文件创建模板
    // Register built-in TypeScript file creation templates
    useEffect(() => {
        if (!fileActionRegistry) return;

        const builtinTemplates: FileCreationTemplate[] = [
            {
                id: 'ts-component',
                label: 'Component',
                extension: '.ts',
                icon: 'FileCode',
                category: 'Script',
                getContent: (fileName: string) => {
                    const className = fileName.replace(/\.ts$/, '');
                    return `import { Component, ECSComponent, Property, Serialize, Serializable } from '@esengine/ecs-framework';

/**
 * ${className}
 */
@ECSComponent('${className}')
@Serializable({ version: 1, typeId: '${className}' })
export class ${className} extends Component {
    // 在这里添加组件属性
    // Add component properties here

    @Serialize()
    @Property({ type: 'number', label: 'Example Property' })
    public exampleProperty: number = 0;

    /**
     * 组件添加到实体时调用
     * Called when component is added to entity
     */
    onAddedToEntity(): void {
        console.log('${className} added to entity');
    }

    /**
     * 组件从实体移除时调用
     * Called when component is removed from entity
     */
    onRemovedFromEntity(): void {
        console.log('${className} removed from entity');
    }
}
`;
                }
            },
            {
                id: 'ts-system',
                label: 'System',
                extension: '.ts',
                icon: 'FileCode',
                category: 'Script',
                getContent: (fileName: string) => {
                    const className = fileName.replace(/\.ts$/, '');
                    return `import { EntitySystem, Matcher, ECSSystem, type Entity } from '@esengine/ecs-framework';

/**
 * ${className}
 */
@ECSSystem('${className}')
export class ${className} extends EntitySystem {
    constructor() {
        // 定义系统处理的组件类型 | Define component types this system processes
        // super(Matcher.all(SomeComponent));
        super(Matcher.empty());
    }

    protected updateEntity(entity: Entity, deltaTime: number): void {
        // 处理每个实体 | Process each entity
    }
}
`;
                }
            },
            {
                id: 'ts-script',
                label: 'TypeScript',
                extension: '.ts',
                icon: 'FileCode',
                category: 'Script',
                getContent: (fileName: string) => {
                    const name = fileName.replace(/\.ts$/, '');
                    return `/**
 * ${name}
 */

export function ${name.charAt(0).toLowerCase() + name.slice(1)}(): void {
    // 在这里编写代码
    // Write your code here
}
`;
                }
            },
            {
                id: 'ts-inspector',
                label: 'Inspector',
                extension: '.ts',
                icon: 'FileCode',
                category: 'Editor',
                getContent: (fileName: string) => {
                    const className = fileName.replace(/\.ts$/, '');
                    return `import React from 'react';
import type { Component } from '@esengine/ecs-framework';
import type { IComponentInspector, ComponentInspectorContext } from '@esengine/editor-core';

/**
 * ${className}
 *
 * 自定义组件检查器 | Custom component inspector
 * 放置在 scripts/editor/ 目录下 | Place in scripts/editor/ directory
 */
export class ${className} implements IComponentInspector {
    readonly id = '${className.toLowerCase()}';
    readonly name = '${className}';
    readonly priority = 10;
    // 目标组件类型名称 | Target component type names
    readonly targetComponents = ['YourComponent'];

    canHandle(component: Component): boolean {
        return this.targetComponents.includes(component.constructor.name);
    }

    render(context: ComponentInspectorContext): React.ReactElement {
        const { component } = context;

        return React.createElement('div', { className: 'custom-inspector' },
            React.createElement('h4', null, '${className}'),
            React.createElement('pre', null, JSON.stringify(component, null, 2))
        );
    }
}
`;
                }
            },
            {
                id: 'ts-gizmo',
                label: 'Gizmo',
                extension: '.ts',
                icon: 'FileCode',
                category: 'Editor',
                getContent: (fileName: string) => {
                    const className = fileName.replace(/\.ts$/, '');
                    return `import type { Component, Entity } from '@esengine/ecs-framework';
import type { IGizmoRenderData } from '@esengine/editor-core';

/**
 * ${className}
 *
 * 自定义 Gizmo 提供者 | Custom Gizmo provider
 * 放置在 scripts/editor/ 目录下 | Place in scripts/editor/ directory
 */
export class ${className} {
    // 目标组件类型 | Target component type
    // 需要替换为实际的组件类 | Replace with actual component class
    readonly targetComponent = null; // YourComponent

    draw(component: Component, entity: Entity, isSelected: boolean): IGizmoRenderData[] {
        // 返回要绘制的 Gizmo 数据 | Return gizmo data to draw
        return [
            {
                type: 'circle',
                x: 0,
                y: 0,
                radius: 10,
                strokeColor: isSelected ? '#00ff00' : '#ffffff',
                strokeWidth: 2
            }
        ];
    }
}
`;
                }
            }
        ];

        // 注册模板
        for (const template of builtinTemplates) {
            fileActionRegistry.registerCreationTemplate(template);
        }

        // 清理函数
        return () => {
            for (const template of builtinTemplates) {
                fileActionRegistry.unregisterCreationTemplate(template);
            }
        };
    }, [fileActionRegistry]);

    // 键盘快捷键处理 | Keyboard shortcuts handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 如果正在输入或有对话框打开，不处理快捷键
            // Skip shortcuts if typing or dialog is open
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                renameDialog ||
                deleteConfirmDialog ||
                createFileDialog
            ) {
                return;
            }

            // 只在内容浏览器区域处理快捷键
            // Only handle shortcuts when content browser has focus
            if (!containerRef.current?.contains(document.activeElement) &&
                document.activeElement !== containerRef.current) {
                return;
            }

            // F2 - 重命名 | Rename
            if (e.key === 'F2' && selectedPaths.size === 1) {
                e.preventDefault();
                const selectedPath = Array.from(selectedPaths)[0];
                const asset = assets.find(a => a.path === selectedPath);
                if (asset) {
                    setRenameDialog({ asset, newName: asset.name });
                }
            }

            // Delete - 删除 | Delete
            if (e.key === 'Delete' && selectedPaths.size === 1) {
                e.preventDefault();
                const selectedPath = Array.from(selectedPaths)[0];
                const asset = assets.find(a => a.path === selectedPath);
                if (asset) {
                    setDeleteConfirmDialog(asset);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedPaths, assets, renameDialog, deleteConfirmDialog, createFileDialog]);

    const getTemplateLabel = (label: string): string => {
        const mapping = templateLabels[label];
        if (mapping) {
            return locale === 'zh' ? mapping.zh : mapping.en;
        }
        return label;
    };

    // Build folder tree - use ref to avoid dependency cycle
    const expandedFoldersRef = useRef(expandedFolders);
    expandedFoldersRef.current = expandedFolders;

    const buildFolderTree = useCallback(async (rootPath: string): Promise<FolderNode> => {
        const currentExpanded = expandedFoldersRef.current;

        const buildNode = async (path: string, name: string): Promise<FolderNode> => {
            const node: FolderNode = {
                name,
                path,
                children: [],
                isExpanded: currentExpanded.has(path)
            };

            try {
                const entries = await TauriAPI.listDirectory(path);
                const folders = entries
                    .filter((e: DirectoryEntry) => e.is_dir && !e.name.startsWith('.'))
                    .sort((a: DirectoryEntry, b: DirectoryEntry) => a.name.localeCompare(b.name));

                for (const folder of folders) {
                    if (currentExpanded.has(path)) {
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

        return buildNode(rootPath, 'All');
    }, []);

    // Load assets
    const loadAssets = useCallback(async (path: string) => {
        setLoading(true);
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

            setAssets(assetItems.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            }));
        } catch (error) {
            console.error('Failed to load assets:', error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        if (projectPath) {
            setCurrentPath(projectPath);
            setExpandedFolders(new Set([projectPath]));
            loadAssets(projectPath);
            buildFolderTree(projectPath).then(setFolderTree);
        }
        // Only run on mount, not on every projectPath change
    }, []);

    // Handle projectPath change after initial mount
    const prevProjectPath = useRef(projectPath);
    useEffect(() => {
        if (projectPath && projectPath !== prevProjectPath.current) {
            prevProjectPath.current = projectPath;
            setCurrentPath(projectPath);
            setExpandedFolders(new Set([projectPath]));
            loadAssets(projectPath);
            buildFolderTree(projectPath).then(setFolderTree);
        }
    }, [projectPath, loadAssets, buildFolderTree]);

    // Rebuild tree when expanded folders change
    const expandedFoldersVersion = useRef(0);
    useEffect(() => {
        // Skip first render (handled by initialization)
        if (expandedFoldersVersion.current === 0) {
            expandedFoldersVersion.current = 1;
            return;
        }
        if (projectPath) {
            buildFolderTree(projectPath).then(setFolderTree);
        }
    }, [expandedFolders, projectPath, buildFolderTree]);

    // Handle reveal path - navigate to folder and select file
    const prevRevealPath = useRef<string | null>(null);
    useEffect(() => {
        if (revealPath && revealPath !== prevRevealPath.current && projectPath) {
            prevRevealPath.current = revealPath;

            // Remove timestamp query if present
            const cleanPath = revealPath.split('?')[0] || revealPath;

            // Get full path
            const fullPath = cleanPath.startsWith('/') || cleanPath.includes(':')
                ? cleanPath
                : `${projectPath}/${cleanPath}`;

            // Get parent directory
            const pathParts = fullPath.replace(/\\/g, '/').split('/');
            pathParts.pop(); // Remove filename
            const parentDir = pathParts.join('/');

            // Expand all parent folders
            const foldersToExpand = new Set<string>();
            let currentFolder = parentDir;
            while (currentFolder && currentFolder.length >= (projectPath?.length || 0)) {
                foldersToExpand.add(currentFolder);
                const parts = currentFolder.split('/');
                parts.pop();
                currentFolder = parts.join('/');
            }

            // Update expanded folders and navigate
            setExpandedFolders((prev) => {
                const next = new Set(prev);
                foldersToExpand.forEach((f) => next.add(f));
                return next;
            });

            // Navigate to parent folder and select the file
            setCurrentPath(parentDir);
            loadAssets(parentDir).then(() => {
                // Select the file after assets are loaded
                setSelectedPaths(new Set([fullPath]));
                setLastSelectedPath(fullPath);
            });
        }
    }, [revealPath, projectPath, loadAssets]);

    // Handle folder selection in tree
    const handleFolderSelect = useCallback((path: string) => {
        setCurrentPath(path);
        loadAssets(path);
    }, [loadAssets]);

    // Toggle folder expansion
    const toggleFolderExpand = useCallback((path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    // Handle asset click
    const handleAssetClick = useCallback((asset: AssetItem, e: React.MouseEvent) => {
        // 聚焦容器以启用键盘快捷键 | Focus container to enable keyboard shortcuts
        containerRef.current?.focus();

        if (e.shiftKey && lastSelectedPath) {
            const lastIndex = assets.findIndex(a => a.path === lastSelectedPath);
            const currentIndex = assets.findIndex(a => a.path === asset.path);
            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangePaths = assets.slice(start, end + 1).map(a => a.path);
                setSelectedPaths(new Set(rangePaths));
            }
        } else if (e.ctrlKey || e.metaKey) {
            const newSelected = new Set(selectedPaths);
            if (newSelected.has(asset.path)) {
                newSelected.delete(asset.path);
            } else {
                newSelected.add(asset.path);
            }
            setSelectedPaths(newSelected);
            setLastSelectedPath(asset.path);
        } else {
            setSelectedPaths(new Set([asset.path]));
            setLastSelectedPath(asset.path);
        }

        messageHub?.publish('asset-file:selected', {
            fileInfo: {
                name: asset.name,
                path: asset.path,
                extension: asset.extension,
                isDirectory: asset.type === 'folder'
            }
        });
    }, [assets, lastSelectedPath, selectedPaths, messageHub]);

    // Handle asset double click
    const handleAssetDoubleClick = useCallback(async (asset: AssetItem) => {
        if (asset.type === 'folder') {
            setCurrentPath(asset.path);
            loadAssets(asset.path);
            setExpandedFolders(prev => new Set([...prev, asset.path]));
        } else {
            const ext = asset.extension?.toLowerCase();
            if (ext === 'ecs' && onOpenScene) {
                onOpenScene(asset.path);
                return;
            }

            // 脚本文件使用配置的编辑器打开
            // Open script files with configured editor
            if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
                const settings = SettingsService.getInstance();
                const editorCommand = settings.getScriptEditorCommand();

                if (editorCommand) {
                    // 使用项目路径，如果没有则使用文件所在目录
                    // Use project path, or file's parent directory if not available
                    const workingDir = projectPath || asset.path.substring(0, asset.path.lastIndexOf('\\')) || asset.path.substring(0, asset.path.lastIndexOf('/'));
                    try {
                        await TauriAPI.openWithEditor(workingDir, editorCommand, asset.path);
                        return;
                    } catch (error) {
                        console.error('Failed to open with editor:', error);
                        // 如果失败，回退到系统默认应用
                        // Fall back to system default app if failed
                    }
                }
            }

            if (fileActionRegistry) {
                const handled = await fileActionRegistry.handleDoubleClick(asset.path);
                if (handled) return;
            }

            try {
                await TauriAPI.openFileWithSystemApp(asset.path);
            } catch (error) {
                console.error('Failed to open file:', error);
            }
        }
    }, [loadAssets, onOpenScene, fileActionRegistry, projectPath]);

    // Handle context menu
    const handleContextMenu = useCallback((e: React.MouseEvent, asset?: AssetItem) => {
        e.preventDefault();
        setContextMenu({
            position: { x: e.clientX, y: e.clientY },
            asset: asset || null,
            isBackground: !asset
        });
    }, []);

    // Handle rename
    const handleRename = useCallback(async (asset: AssetItem, newName: string) => {
        if (!newName.trim() || newName === asset.name) {
            setRenameDialog(null);
            return;
        }

        try {
            const lastSlash = Math.max(asset.path.lastIndexOf('/'), asset.path.lastIndexOf('\\'));
            const parentPath = asset.path.substring(0, lastSlash);
            const newPath = `${parentPath}/${newName}`;

            // Update AssetMetaManager to preserve GUID | 更新 AssetMetaManager 以保持 GUID 不变
            const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
            if (assetRegistry && asset.type !== 'folder') {
                await assetRegistry.metaManager.handleAssetRename(asset.path, newPath);
            }

            await TauriAPI.renameFileOrFolder(asset.path, newPath);

            // Refresh asset registry | 刷新资产注册表
            if (assetRegistry && asset.type !== 'folder') {
                await assetRegistry.refreshAsset(newPath);
            }

            if (currentPath) {
                await loadAssets(currentPath);
            }

            setRenameDialog(null);
        } catch (error) {
            console.error('Failed to rename:', error);
        }
    }, [currentPath, loadAssets]);

    // Handle delete
    const handleDelete = useCallback(async (asset: AssetItem) => {
        try {
            const deletedPath = asset.path;

            if (asset.type === 'folder') {
                await TauriAPI.deleteFolder(asset.path);
                // Also delete folder meta file if exists | 同时删除文件夹的 meta 文件
                try {
                    await TauriAPI.deleteFile(`${asset.path}.meta`);
                } catch {
                    // Meta file may not exist, ignore | meta 文件可能不存在，忽略
                }
            } else {
                await TauriAPI.deleteFile(asset.path);
                // Also delete corresponding meta file if exists | 同时删除对应的 meta 文件
                try {
                    await TauriAPI.deleteFile(`${asset.path}.meta`);
                } catch {
                    // Meta file may not exist, ignore | meta 文件可能不存在，忽略
                }
            }

            if (currentPath) {
                await loadAssets(currentPath);
            }

            // Notify that a file was deleted | 通知文件已删除
            messageHub?.publish('file:deleted', { path: deletedPath });

            setDeleteConfirmDialog(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }, [currentPath, loadAssets, messageHub]);

    // Get breadcrumbs
    const getBreadcrumbs = useCallback(() => {
        if (!currentPath || !projectPath) return [];

        const relative = currentPath.replace(projectPath, '');
        const parts = relative.split(/[/\\]/).filter(p => p);

        const crumbs = [{ name: 'All', path: projectPath }];
        crumbs.push({ name: 'Content', path: projectPath });

        let accPath = projectPath;
        for (const part of parts) {
            accPath = `${accPath}/${part}`;
            crumbs.push({ name: part, path: accPath });
        }

        return crumbs;
    }, [currentPath, projectPath]);

    // Get file icon
    const getFileIcon = useCallback((asset: AssetItem, size: number = 48) => {
        if (asset.type === 'folder') {
            return <Folder size={size} className="asset-thumbnail-icon folder" />;
        }

        const ext = asset.extension?.toLowerCase();
        switch (ext) {
            case 'ecs':
                return <File size={size} className="asset-thumbnail-icon scene" />;
            case 'btree':
                return <FileText size={size} className="asset-thumbnail-icon btree" />;
            case 'ts':
            case 'tsx':
            case 'js':
            case 'jsx':
                return <FileCode size={size} className="asset-thumbnail-icon code" />;
            case 'json':
                return <FileJson size={size} className="asset-thumbnail-icon json" />;
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                return <FileImage size={size} className="asset-thumbnail-icon image" />;
            default:
                return <File size={size} className="asset-thumbnail-icon" />;
        }
    }, []);

    // Get context menu items
    const getContextMenuItems = useCallback((asset: AssetItem | null): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [];

        if (!asset) {
            items.push({
                label: t.newFolder,
                icon: <FolderClosed size={16} />,
                onClick: async () => {
                    if (!currentPath) return;
                    const folderName = `New Folder`;
                    const folderPath = `${currentPath}/${folderName}`;
                    try {
                        await TauriAPI.createDirectory(folderPath);
                        await loadAssets(currentPath);
                    } catch (error) {
                        console.error('Failed to create folder:', error);
                    }
                }
            });

            if (fileCreationTemplates.length > 0) {
                items.push({ label: '', separator: true, onClick: () => {} });

                for (const template of fileCreationTemplates) {
                    const localizedLabel = getTemplateLabel(template.label);
                    items.push({
                        label: localizedLabel,
                        icon: getIconComponent(template.icon, 16),
                        onClick: () => {
                            setContextMenu(null);
                            if (currentPath) {
                                setCreateFileDialog({
                                    parentPath: currentPath,
                                    template
                                });
                            }
                        }
                    });
                }
            }

            items.push({ label: '', separator: true, onClick: () => {} });

            items.push({
                label: locale === 'zh' ? '在资源管理器中显示' : 'Show in Explorer',
                icon: <ExternalLink size={16} />,
                onClick: async () => {
                    if (currentPath) {
                        try {
                            await TauriAPI.showInFolder(currentPath);
                        } catch (error) {
                            console.error('Failed to show in folder:', error);
                        }
                    }
                    setContextMenu(null);
                }
            });

            items.push({
                label: locale === 'zh' ? '刷新' : 'Refresh',
                icon: <RefreshCw size={16} />,
                onClick: async () => {
                    if (currentPath) {
                        await loadAssets(currentPath);
                    }
                    setContextMenu(null);
                }
            });

            return items;
        }

        // Asset context menu
        if (asset.type === 'file') {
            items.push({
                label: locale === 'zh' ? '打开' : 'Open',
                icon: <File size={16} />,
                onClick: () => handleAssetDoubleClick(asset)
            });

            items.push({ label: '', separator: true, onClick: () => {} });

            // 保存
            items.push({
                label: locale === 'zh' ? '保存' : 'Save',
                icon: <Save size={16} />,
                shortcut: 'Ctrl+S',
                onClick: () => {
                    console.log('Save file:', asset.path);
                }
            });
        }

        // 重命名
        items.push({
            label: locale === 'zh' ? '重命名' : 'Rename',
            icon: <Edit3 size={16} />,
            shortcut: 'F2',
            onClick: () => {
                setRenameDialog({ asset, newName: asset.name });
                setContextMenu(null);
            }
        });

        // 批量重命名
        items.push({
            label: locale === 'zh' ? '批量重命名' : 'Batch Rename',
            icon: <Edit3 size={16} />,
            shortcut: 'Shift+F2',
            disabled: true,
            onClick: () => {
                console.log('Batch rename');
            }
        });

        // 复制
        items.push({
            label: locale === 'zh' ? '复制' : 'Duplicate',
            icon: <Clipboard size={16} />,
            shortcut: 'Ctrl+D',
            onClick: () => {
                console.log('Duplicate:', asset.path);
            }
        });

        // 删除
        items.push({
            label: locale === 'zh' ? '删除' : 'Delete',
            icon: <Trash2 size={16} />,
            shortcut: 'Delete',
            onClick: () => {
                setDeleteConfirmDialog(asset);
                setContextMenu(null);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 资产操作子菜单
        items.push({
            label: locale === 'zh' ? '资产操作' : 'Asset Actions',
            icon: <Settings size={16} />,
            onClick: () => {},
            children: [
                {
                    label: locale === 'zh' ? '重新导入' : 'Reimport',
                    icon: <RefreshCw size={16} />,
                    onClick: () => {
                        console.log('Reimport asset:', asset.path);
                    }
                },
                {
                    label: locale === 'zh' ? '导出...' : 'Export...',
                    icon: <Package size={16} />,
                    onClick: () => {
                        console.log('Export asset:', asset.path);
                    }
                },
                { label: '', separator: true, onClick: () => {} },
                {
                    label: locale === 'zh' ? '迁移资产' : 'Migrate Asset',
                    icon: <Folder size={16} />,
                    onClick: () => {
                        console.log('Migrate asset:', asset.path);
                    }
                }
            ]
        });

        // 资产本地化子菜单
        items.push({
            label: locale === 'zh' ? '资产本地化' : 'Asset Localization',
            icon: <Globe size={16} />,
            onClick: () => {},
            children: [
                {
                    label: locale === 'zh' ? '创建本地化资产' : 'Create Localized Asset',
                    onClick: () => {
                        console.log('Create localized asset:', asset.path);
                    }
                },
                {
                    label: locale === 'zh' ? '导入翻译' : 'Import Translation',
                    onClick: () => {
                        console.log('Import translation:', asset.path);
                    }
                },
                {
                    label: locale === 'zh' ? '导出翻译' : 'Export Translation',
                    onClick: () => {
                        console.log('Export translation:', asset.path);
                    }
                }
            ]
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 标签管理
        items.push({
            label: locale === 'zh' ? '管理标签' : 'Manage Tags',
            icon: <Tag size={16} />,
            shortcut: 'Ctrl+T',
            onClick: () => {
                console.log('Manage tags:', asset.path);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 路径复制选项
        items.push({
            label: locale === 'zh' ? '复制引用' : 'Copy Reference',
            icon: <Link size={16} />,
            shortcut: 'Ctrl+C',
            onClick: () => {
                navigator.clipboard.writeText(asset.path);
            }
        });

        items.push({
            label: locale === 'zh' ? '拷贝Object路径' : 'Copy Object Path',
            icon: <Copy size={16} />,
            shortcut: 'Ctrl+Shift+C',
            onClick: () => {
                const objectPath = asset.path.replace(/\\/g, '/');
                navigator.clipboard.writeText(objectPath);
            }
        });

        items.push({
            label: locale === 'zh' ? '拷贝包路径' : 'Copy Package Path',
            icon: <Package size={16} />,
            shortcut: 'Ctrl+Alt+C',
            onClick: () => {
                const packagePath = '/' + asset.path.replace(/\\/g, '/').split('/').slice(-2).join('/');
                navigator.clipboard.writeText(packagePath);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 引用查看器
        items.push({
            label: locale === 'zh' ? '引用查看器' : 'Reference Viewer',
            icon: <FileSearch size={16} />,
            shortcut: 'Alt+Shift+R',
            onClick: () => {
                console.log('Open reference viewer:', asset.path);
            }
        });

        items.push({
            label: locale === 'zh' ? '尺寸信息图' : 'Size Map',
            icon: <FileSearch size={16} />,
            shortcut: 'Alt+Shift+D',
            onClick: () => {
                console.log('Show size map:', asset.path);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 在文件管理器中显示
        items.push({
            label: locale === 'zh' ? '在文件管理器中显示' : 'Show in Explorer',
            icon: <ExternalLink size={16} />,
            onClick: async () => {
                try {
                    console.log('[ContentBrowser] showInFolder path:', asset.path);
                    await TauriAPI.showInFolder(asset.path);
                } catch (error) {
                    console.error('Failed to show in folder:', error, 'Path:', asset.path);
                }
            }
        });

        return items;
    }, [currentPath, fileCreationTemplates, handleAssetDoubleClick, loadAssets, locale, t.newFolder, t.newPrefix, setRenameDialog, setDeleteConfirmDialog, setContextMenu, setCreateFileDialog]);

    // Render folder tree node
    const renderFolderNode = useCallback((node: FolderNode, depth: number = 0) => {
        const isSelected = currentPath === node.path;
        const isExpanded = expandedFolders.has(node.path);
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.path}>
                <div
                    className={`folder-tree-item ${isSelected ? 'selected' : ''}`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => handleFolderSelect(node.path)}
                >
                    <span
                        className="folder-tree-expand"
                        onClick={(e) => toggleFolderExpand(node.path, e)}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : (
                            <span style={{ width: 14 }} />
                        )}
                    </span>
                    <span className="folder-tree-icon">
                        {isExpanded ? <FolderOpen size={14} /> : <FolderClosed size={14} />}
                    </span>
                    <span className="folder-tree-name">{node.name}</span>
                </div>
                {isExpanded && node.children.map(child => renderFolderNode(child, depth + 1))}
            </div>
        );
    }, [currentPath, expandedFolders, handleFolderSelect, toggleFolderExpand]);

    // Filter assets by search
    const filteredAssets = searchQuery.trim()
        ? assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : assets;

    const breadcrumbs = getBreadcrumbs();

    if (!projectPath) {
        return (
            <div className="content-browser">
                <div className="content-browser-empty">
                    <p>{t.noProject}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`content-browser ${isDrawer ? 'is-drawer' : ''}`}
            tabIndex={-1}
        >
            {/* Left Panel - Folder Tree */}
            <div className="content-browser-left">
                {/* Favorites Section */}
                <div className="cb-section">
                    <div
                        className="cb-section-header"
                        onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                    >
                        {favoritesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span>{t.favorites}</span>
                        <button className="cb-section-btn" onClick={(e) => e.stopPropagation()}>
                            <Search size={12} />
                        </button>
                    </div>
                    {favoritesExpanded && (
                        <div className="cb-section-content">
                            {favorites.length === 0 ? (
                                <div className="cb-section-empty">
                                    {/* Empty favorites */}
                                </div>
                            ) : (
                                favorites.map(fav => (
                                    <div key={fav} className="folder-tree-item">
                                        <FolderClosed size={14} />
                                        <span>{fav.split('/').pop()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Folder Tree */}
                <div className="cb-folder-tree">
                    {folderTree && renderFolderNode(folderTree)}
                </div>

                {/* Collections Section */}
                <div className="cb-section">
                    <div
                        className="cb-section-header"
                        onClick={() => setCollectionsExpanded(!collectionsExpanded)}
                    >
                        {collectionsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span>{t.collections}</span>
                        <div className="cb-section-actions">
                            <button className="cb-section-btn" onClick={(e) => e.stopPropagation()}>
                                <Plus size={12} />
                            </button>
                            <button className="cb-section-btn" onClick={(e) => e.stopPropagation()}>
                                <Search size={12} />
                            </button>
                        </div>
                    </div>
                    {collectionsExpanded && (
                        <div className="cb-section-content">
                            {/* Collections list */}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Content Area */}
            <div className="content-browser-right">
                {/* Top Toolbar */}
                <div className="cb-toolbar">
                    <div className="cb-toolbar-left">
                        <button className="cb-toolbar-btn primary">
                            <Plus size={14} />
                            <span>{t.add}</span>
                        </button>
                        <button className="cb-toolbar-btn">
                            <Download size={14} />
                            <span>{t.import}</span>
                        </button>
                        <button className="cb-toolbar-btn">
                            <Save size={14} />
                            <span>{t.saveAll}</span>
                        </button>
                    </div>

                    {/* Breadcrumb Navigation */}
                    <div className="cb-breadcrumb">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={crumb.path} className="cb-breadcrumb-item">
                                {index > 0 && <ChevronRight size={12} className="cb-breadcrumb-sep" />}
                                <span
                                    className="cb-breadcrumb-link"
                                    onClick={() => handleFolderSelect(crumb.path)}
                                >
                                    {crumb.name}
                                </span>
                            </span>
                        ))}
                    </div>

                    <div className="cb-toolbar-right">
                        {isDrawer && onDockInLayout && (
                            <button
                                className="cb-toolbar-btn dock-btn"
                                onClick={onDockInLayout}
                                title={t.dockInLayout}
                            >
                                <PanelRightClose size={14} />
                                <span>{t.dockInLayout}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="cb-search-bar">
                    <button className="cb-filter-btn">
                        <SlidersHorizontal size={14} />
                        <ChevronDown size={10} />
                    </button>
                    <div className="cb-search-input-wrapper">
                        <Search size={14} className="cb-search-icon" />
                        <input
                            type="text"
                            className="cb-search-input"
                            placeholder={`${t.search} ${breadcrumbs[breadcrumbs.length - 1]?.name || ''}`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="cb-view-options">
                        <button
                            className={`cb-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button
                            className={`cb-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={14} />
                        </button>
                    </div>
                </div>

                {/* Asset Grid */}
                <div
                    className={`cb-asset-grid ${viewMode}`}
                    onContextMenu={(e) => handleContextMenu(e)}
                >
                    {loading ? (
                        <div className="cb-loading">Loading...</div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="cb-empty">{t.empty}</div>
                    ) : (
                        filteredAssets.map(asset => (
                            <div
                                key={asset.path}
                                className={`cb-asset-item ${selectedPaths.has(asset.path) ? 'selected' : ''}`}
                                onClick={(e) => handleAssetClick(asset, e)}
                                onDoubleClick={() => handleAssetDoubleClick(asset)}
                                onContextMenu={(e) => {
                                    e.stopPropagation();
                                    handleContextMenu(e, asset);
                                }}
                                draggable={asset.type === 'file'}
                                onDragStart={(e) => {
                                    if (asset.type === 'file') {
                                        e.dataTransfer.setData('asset-path', asset.path);
                                        e.dataTransfer.setData('text/plain', asset.path);
                                        // Add GUID for new asset reference system
                                        const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
                                        if (assetRegistry) {
                                            // Convert absolute path to relative path for GUID lookup
                                            const relativePath = assetRegistry.absoluteToRelative(asset.path);
                                            if (relativePath) {
                                                const guid = assetRegistry.getGuidByPath(relativePath);
                                                if (guid) {
                                                    e.dataTransfer.setData('asset-guid', guid);
                                                }
                                            }
                                        }
                                    }
                                }}
                            >
                                <div className="cb-asset-thumbnail">
                                    {getFileIcon(asset)}
                                </div>
                                <div className="cb-asset-info">
                                    <div className="cb-asset-name" title={asset.name}>
                                        {asset.name}
                                    </div>
                                    <div className="cb-asset-type">
                                        {getAssetTypeName(asset)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Status Bar */}
                <div className="cb-status-bar">
                    <span>{filteredAssets.length} {t.items}</span>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.asset)}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* Rename Dialog */}
            {renameDialog && (
                <div className="cb-dialog-overlay" onClick={() => setRenameDialog(null)}>
                    <div className="cb-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="cb-dialog-header">
                            <h3>{locale === 'zh' ? '重命名' : 'Rename'}</h3>
                        </div>
                        <div className="cb-dialog-body">
                            <input
                                type="text"
                                value={renameDialog.newName}
                                onChange={(e) => setRenameDialog({ ...renameDialog, newName: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename(renameDialog.asset, renameDialog.newName);
                                    if (e.key === 'Escape') setRenameDialog(null);
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="cb-dialog-footer">
                            <button className="cb-btn" onClick={() => setRenameDialog(null)}>
                                {locale === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                                className="cb-btn primary"
                                onClick={() => handleRename(renameDialog.asset, renameDialog.newName)}
                            >
                                {locale === 'zh' ? '确定' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Dialog */}
            {deleteConfirmDialog && (
                <div className="cb-dialog-overlay" onClick={() => setDeleteConfirmDialog(null)}>
                    <div className="cb-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="cb-dialog-header">
                            <h3>{locale === 'zh' ? '确认删除' : 'Confirm Delete'}</h3>
                        </div>
                        <div className="cb-dialog-body">
                            <p>
                                {locale === 'zh'
                                    ? `确定要删除 "${deleteConfirmDialog.name}" 吗？`
                                    : `Delete "${deleteConfirmDialog.name}"?`}
                            </p>
                        </div>
                        <div className="cb-dialog-footer">
                            <button className="cb-btn" onClick={() => setDeleteConfirmDialog(null)}>
                                {locale === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                                className="cb-btn danger"
                                onClick={() => handleDelete(deleteConfirmDialog)}
                            >
                                {locale === 'zh' ? '删除' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create File Dialog */}
            {createFileDialog && (() => {
                // 规范化扩展名（确保有点号前缀）
                // Normalize extension (ensure dot prefix)
                const ext = createFileDialog.template.extension.startsWith('.')
                    ? createFileDialog.template.extension
                    : `.${createFileDialog.template.extension}`;
                return (
                <PromptDialog
                    title={locale === 'zh' ? `新建 ${getTemplateLabel(createFileDialog.template.label)}` : `New ${createFileDialog.template.label}`}
                    message={locale === 'zh' ? `输入文件名（将添加 ${ext}）:` : `Enter file name (${ext} will be added):`}
                    placeholder="filename"
                    confirmText={locale === 'zh' ? '创建' : 'Create'}
                    cancelText={locale === 'zh' ? '取消' : 'Cancel'}
                    onConfirm={async (value) => {
                        const { parentPath, template } = createFileDialog;
                        setCreateFileDialog(null);

                        let fileName = value;
                        if (!fileName.endsWith(ext)) {
                            fileName = `${fileName}${ext}`;
                        }
                        const filePath = `${parentPath}/${fileName}`;

                        try {
                            const content = await template.getContent(fileName);
                            await TauriAPI.writeFileContent(filePath, content);
                            if (currentPath) {
                                await loadAssets(currentPath);
                            }

                            // Notify that a file was created | 通知文件已创建
                            messageHub?.publish('file:created', { path: filePath });
                        } catch (error) {
                            console.error('Failed to create file:', error);
                        }
                    }}
                    onCancel={() => setCreateFileDialog(null)}
                />
                );
            })()}
        </div>
    );
}
