/**
 * Content Browser - 内容浏览器
 * 用于浏览和管理项目资产
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
    PanelRightClose
} from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, FileActionRegistry, type FileCreationTemplate } from '@esengine/editor-core';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
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
    const [favorites, setFavorites] = useState<string[]>([]);

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
            newFolder: 'New Folder'
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
            newFolder: '新建文件夹'
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
        newFolder: 'New Folder'
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }, [loadAssets, onOpenScene, fileActionRegistry]);

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

            await TauriAPI.renameFileOrFolder(asset.path, newPath);

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
            if (asset.type === 'folder') {
                await TauriAPI.deleteFolder(asset.path);
            } else {
                await TauriAPI.deleteFile(asset.path);
            }

            if (currentPath) {
                await loadAssets(currentPath);
            }

            setDeleteConfirmDialog(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }, [currentPath, loadAssets]);

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
            // Background context menu
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

            if (fileActionRegistry) {
                const templates = fileActionRegistry.getCreationTemplates();
                if (templates.length > 0) {
                    items.push({ label: '', separator: true, onClick: () => {} });
                    for (const template of templates) {
                        items.push({
                            label: `New ${template.label}`,
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
            }

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
        }

        items.push({
            label: locale === 'zh' ? '在文件管理器中显示' : 'Show in Explorer',
            icon: <ExternalLink size={16} />,
            onClick: async () => {
                try {
                    await TauriAPI.showInFolder(asset.path);
                } catch (error) {
                    console.error('Failed to show in folder:', error);
                }
            }
        });

        items.push({
            label: locale === 'zh' ? '复制路径' : 'Copy Path',
            icon: <Copy size={16} />,
            onClick: () => navigator.clipboard.writeText(asset.path)
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        items.push({
            label: locale === 'zh' ? '重命名' : 'Rename',
            icon: <Edit3 size={16} />,
            onClick: () => {
                setRenameDialog({ asset, newName: asset.name });
                setContextMenu(null);
            }
        });

        items.push({
            label: locale === 'zh' ? '删除' : 'Delete',
            icon: <Trash2 size={16} />,
            onClick: () => {
                setDeleteConfirmDialog(asset);
                setContextMenu(null);
            }
        });

        return items;
    }, [currentPath, fileActionRegistry, handleAssetDoubleClick, loadAssets, locale, t.newFolder]);

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
        <div className={`content-browser ${isDrawer ? 'is-drawer' : ''}`}>
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
                                onContextMenu={(e) => handleContextMenu(e, asset)}
                                draggable={asset.type === 'file'}
                                onDragStart={(e) => {
                                    if (asset.type === 'file') {
                                        e.dataTransfer.setData('asset-path', asset.path);
                                        e.dataTransfer.setData('text/plain', asset.path);
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
            {createFileDialog && (
                <PromptDialog
                    title={`New ${createFileDialog.template.label}`}
                    message={`Enter file name (.${createFileDialog.template.extension} will be added):`}
                    placeholder="filename"
                    confirmText={locale === 'zh' ? '创建' : 'Create'}
                    cancelText={locale === 'zh' ? '取消' : 'Cancel'}
                    onConfirm={async (value) => {
                        const { parentPath, template } = createFileDialog;
                        setCreateFileDialog(null);

                        let fileName = value;
                        if (!fileName.endsWith(`.${template.extension}`)) {
                            fileName = `${fileName}.${template.extension}`;
                        }
                        const filePath = `${parentPath}/${fileName}`;

                        try {
                            const content = await template.getContent(fileName);
                            await TauriAPI.writeFileContent(filePath, content);
                            if (currentPath) {
                                await loadAssets(currentPath);
                            }
                        } catch (error) {
                            console.error('Failed to create file:', error);
                        }
                    }}
                    onCancel={() => setCreateFileDialog(null)}
                />
            )}
        </div>
    );
}
