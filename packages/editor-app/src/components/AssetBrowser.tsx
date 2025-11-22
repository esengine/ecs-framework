import { useState, useEffect, useRef } from 'react';
import { Folder, File, FileCode, FileJson, FileImage, FileText, FolderOpen, Copy, Trash2, Edit3, LayoutGrid, List, ChevronsUp, RefreshCw } from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, FileActionRegistry } from '@esengine/editor-core';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import { FileTree, FileTreeHandle } from './FileTree';
import { ResizablePanel } from './ResizablePanel';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import '../styles/AssetBrowser.css';

interface AssetItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  size?: number;
  modified?: number;
}

interface AssetBrowserProps {
  projectPath: string | null;
  locale: string;
  onOpenScene?: (scenePath: string) => void;
}

export function AssetBrowser({ projectPath, locale, onOpenScene }: AssetBrowserProps) {
    const messageHub = Core.services.resolve(MessageHub);
    const fileActionRegistry = Core.services.resolve(FileActionRegistry);
    const detailViewFileTreeRef = useRef<FileTreeHandle>(null);
    const treeOnlyViewFileTreeRef = useRef<FileTreeHandle>(null);
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [lastSelectedPath, setLastSelectedPath] = useState<string | null>(null);
    const [assets, setAssets] = useState<AssetItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AssetItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDetailView, setShowDetailView] = useState(() => {
        const saved = localStorage.getItem('asset-browser-detail-view');
        return saved !== null ? saved === 'true' : false;
    });
    const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    asset: AssetItem;
  } | null>(null);
    const [renameDialog, setRenameDialog] = useState<{
    asset: AssetItem;
    newName: string;
  } | null>(null);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<AssetItem | null>(null);

    const translations = {
        en: {
            title: 'Content Browser',
            noProject: 'No project loaded',
            loading: 'Loading...',
            empty: 'No assets found',
            search: 'Search...',
            name: 'Name',
            type: 'Type',
            file: 'File',
            folder: 'Folder'
        },
        zh: {
            title: '内容浏览器',
            noProject: '没有加载项目',
            loading: '加载中...',
            empty: '没有找到资产',
            search: '搜索...',
            name: '名称',
            type: '类型',
            file: '文件',
            folder: '文件夹'
        }
    };

    const t = translations[locale as keyof typeof translations] || translations.en;

    useEffect(() => {
        if (projectPath) {
            setCurrentPath(projectPath);
            loadAssets(projectPath);
        } else {
            setAssets([]);
            setCurrentPath(null);
            setSelectedPaths(new Set());
        }
    }, [projectPath]);

    // Listen for asset reveal requests
    useEffect(() => {
        const messageHub = Core.services.resolve(MessageHub);
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('asset:reveal', async (data: any) => {
            const filePath = data.path;
            if (filePath) {
                const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
                const dirPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : null;
                if (dirPath) {
                    setCurrentPath(dirPath);
                    // Load assets first, then set selection after list is populated
                    await loadAssets(dirPath);
                    setSelectedPaths(new Set([filePath]));

                    // Expand tree to reveal the file
                    if (showDetailView) {
                        detailViewFileTreeRef.current?.revealPath(filePath);
                    } else {
                        treeOnlyViewFileTreeRef.current?.revealPath(filePath);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [showDetailView]);

    const loadAssets = async (path: string) => {
        setLoading(true);
        try {
            const entries = await TauriAPI.listDirectory(path);

            const assetItems: AssetItem[] = entries.map((entry: DirectoryEntry) => {
                const extension = entry.is_dir ? undefined :
                    (entry.name.includes('.') ? entry.name.split('.').pop() : undefined);

                return {
                    name: entry.name,
                    path: entry.path,
                    type: entry.is_dir ? 'folder' as const : 'file' as const,
                    extension,
                    size: entry.size,
                    modified: entry.modified
                };
            });

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
    };

    const searchProjectRecursively = async (rootPath: string, query: string): Promise<AssetItem[]> => {
        const results: AssetItem[] = [];
        const lowerQuery = query.toLowerCase();

        const searchDirectory = async (dirPath: string) => {
            try {
                const entries = await TauriAPI.listDirectory(dirPath);

                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue;

                    if (entry.name.toLowerCase().includes(lowerQuery)) {
                        const extension = entry.is_dir ? undefined :
                            (entry.name.includes('.') ? entry.name.split('.').pop() : undefined);

                        results.push({
                            name: entry.name,
                            path: entry.path,
                            type: entry.is_dir ? 'folder' as const : 'file' as const,
                            extension,
                            size: entry.size,
                            modified: entry.modified
                        });
                    }

                    if (entry.is_dir) {
                        await searchDirectory(entry.path);
                    }
                }
            } catch (error) {
                console.error(`Failed to search directory ${dirPath}:`, error);
            }
        };

        await searchDirectory(rootPath);
        return results.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
    };

    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            if (!projectPath) return;

            setIsSearching(true);
            try {
                const results = await searchProjectRecursively(projectPath, searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, projectPath]);

    const handleFolderSelect = (path: string) => {
        setCurrentPath(path);
        loadAssets(path);
    };

    const handleTreeMultiSelect = (paths: string[], modifiers: { ctrlKey: boolean; shiftKey: boolean }) => {
        if (paths.length === 0) return;
        const path = paths[0];
        if (!path) return;

        if (modifiers.shiftKey && paths.length > 1) {
            // Range select - paths already contains the range from FileTree
            setSelectedPaths(new Set(paths));
        } else if (modifiers.ctrlKey) {
            const newSelected = new Set(selectedPaths);
            if (newSelected.has(path)) {
                newSelected.delete(path);
            } else {
                newSelected.add(path);
            }
            setSelectedPaths(newSelected);
            setLastSelectedPath(path);
        } else {
            setSelectedPaths(new Set([path]));
            setLastSelectedPath(path);
        }
    };

    const handleAssetClick = (asset: AssetItem, e: React.MouseEvent) => {
        const filteredAssets = searchQuery.trim() ? searchResults : assets;

        if (e.shiftKey && lastSelectedPath) {
            // Range select with Shift
            const lastIndex = filteredAssets.findIndex(a => a.path === lastSelectedPath);
            const currentIndex = filteredAssets.findIndex(a => a.path === asset.path);
            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangePaths = filteredAssets.slice(start, end + 1).map(a => a.path);
                setSelectedPaths(new Set(rangePaths));
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Multi-select with Ctrl/Cmd
            const newSelected = new Set(selectedPaths);
            if (newSelected.has(asset.path)) {
                newSelected.delete(asset.path);
            } else {
                newSelected.add(asset.path);
            }
            setSelectedPaths(newSelected);
            setLastSelectedPath(asset.path);
        } else {
            // Single select
            setSelectedPaths(new Set([asset.path]));
            setLastSelectedPath(asset.path);
        }

        messageHub?.publish('asset-file:selected', {
            fileInfo: {
                name: asset.name,
                path: asset.path,
                extension: asset.extension,
                size: asset.size,
                modified: asset.modified,
                isDirectory: asset.type === 'folder'
            }
        });
    };

    const handleAssetDoubleClick = async (asset: AssetItem) => {
        if (asset.type === 'folder') {
            setCurrentPath(asset.path);
            loadAssets(asset.path);
        } else if (asset.type === 'file') {
            if (asset.extension === 'ecs' && onOpenScene) {
                onOpenScene(asset.path);
                return;
            }

            if (fileActionRegistry) {
                console.log('[AssetBrowser] Handling double click for:', asset.path);
                console.log('[AssetBrowser] Extension:', asset.extension);
                const handled = await fileActionRegistry.handleDoubleClick(asset.path);
                console.log('[AssetBrowser] Handled by plugin:', handled);
                if (handled) {
                    return;
                }
            } else {
                console.log('[AssetBrowser] FileActionRegistry not available');
            }

            try {
                await TauriAPI.openFileWithSystemApp(asset.path);
            } catch (error) {
                console.error('Failed to open file:', error);
            }
        }
    };

    const handleRename = async (asset: AssetItem, newName: string) => {
        if (!newName.trim() || newName === asset.name) {
            setRenameDialog(null);
            return;
        }

        try {
            const lastSlash = Math.max(asset.path.lastIndexOf('/'), asset.path.lastIndexOf('\\'));
            const parentPath = asset.path.substring(0, lastSlash);
            const newPath = `${parentPath}/${newName}`;

            await TauriAPI.renameFileOrFolder(asset.path, newPath);

            // 刷新当前目录
            if (currentPath) {
                await loadAssets(currentPath);
            }

            // 更新选中路径
            if (selectedPaths.has(asset.path)) {
                const newSelected = new Set(selectedPaths);
                newSelected.delete(asset.path);
                newSelected.add(newPath);
                setSelectedPaths(newSelected);
            }

            setRenameDialog(null);
        } catch (error) {
            console.error('Failed to rename:', error);
            alert(`重命名失败: ${error}`);
        }
    };

    const handleDelete = async (asset: AssetItem) => {
        try {
            if (asset.type === 'folder') {
                await TauriAPI.deleteFolder(asset.path);
            } else {
                await TauriAPI.deleteFile(asset.path);
            }

            // 刷新当前目录
            if (currentPath) {
                await loadAssets(currentPath);
            }

            // 清除选中状态
            if (selectedPaths.has(asset.path)) {
                const newSelected = new Set(selectedPaths);
                newSelected.delete(asset.path);
                setSelectedPaths(newSelected);
            }

            setDeleteConfirmDialog(null);
        } catch (error) {
            console.error('Failed to delete:', error);
            alert(`删除失败: ${error}`);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, asset: AssetItem) => {
        e.preventDefault();
        setContextMenu({
            position: { x: e.clientX, y: e.clientY },
            asset
        });
    };

    const getContextMenuItems = (asset: AssetItem): ContextMenuItem[] => {
        const items: ContextMenuItem[] = [];

        if (asset.type === 'file') {
            items.push({
                label: locale === 'zh' ? '打开' : 'Open',
                icon: <File size={16} />,
                onClick: () => handleAssetDoubleClick(asset)
            });

            if (fileActionRegistry) {
                const handlers = fileActionRegistry.getHandlersForFile(asset.path);
                for (const handler of handlers) {
                    if (handler.getContextMenuItems) {
                        const parentPath = asset.path.substring(0, asset.path.lastIndexOf('/'));
                        const pluginItems = handler.getContextMenuItems(asset.path, parentPath);
                        for (const pluginItem of pluginItems) {
                            items.push({
                                label: pluginItem.label,
                                icon: pluginItem.icon,
                                onClick: () => pluginItem.onClick(asset.path, parentPath),
                                disabled: pluginItem.disabled,
                                separator: pluginItem.separator
                            });
                        }
                    }
                }
            }

            items.push({ label: '', separator: true, onClick: () => {} });
        }

        if (asset.type === 'folder' && fileActionRegistry) {
            const templates = fileActionRegistry.getCreationTemplates();
            if (templates.length > 0) {
                items.push({ label: '', separator: true, onClick: () => {} });
                for (const template of templates) {
                    items.push({
                        label: `${locale === 'zh' ? '新建' : 'New'} ${template.label}`,
                        icon: template.icon,
                        onClick: async () => {
                            const fileName = `${template.defaultFileName}.${template.extension}`;
                            const filePath = `${asset.path}/${fileName}`;
                            const content = await template.createContent(fileName);
                            await TauriAPI.writeFileContent(filePath, content);
                            if (currentPath) {
                                await loadAssets(currentPath);
                            }
                        }
                    });
                }
            }
        }

        // 在文件管理器中显示
        items.push({
            label: locale === 'zh' ? '在文件管理器中显示' : 'Show in Explorer',
            icon: <FolderOpen size={16} />,
            onClick: async () => {
                try {
                    await TauriAPI.showInFolder(asset.path);
                } catch (error) {
                    console.error('Failed to show in folder:', error);
                }
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 复制路径
        items.push({
            label: locale === 'zh' ? '复制路径' : 'Copy Path',
            icon: <Copy size={16} />,
            onClick: () => {
                navigator.clipboard.writeText(asset.path);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 重命名
        items.push({
            label: locale === 'zh' ? '重命名' : 'Rename',
            icon: <Edit3 size={16} />,
            onClick: () => {
                setRenameDialog({
                    asset,
                    newName: asset.name
                });
                setContextMenu(null);
            },
            disabled: false
        });

        // 删除
        items.push({
            label: locale === 'zh' ? '删除' : 'Delete',
            icon: <Trash2 size={16} />,
            onClick: () => {
                setDeleteConfirmDialog(asset);
                setContextMenu(null);
            },
            disabled: false
        });

        return items;
    };

    const getBreadcrumbs = () => {
        if (!currentPath || !projectPath) return [];

        const relative = currentPath.replace(projectPath, '');
        const parts = relative.split(/[/\\]/).filter((p) => p);

        const crumbs = [{ name: 'Content', path: projectPath }];
        let accPath = projectPath;

        for (const part of parts) {
            accPath = `${accPath}${accPath.endsWith('\\') || accPath.endsWith('/') ? '' : '/'}${part}`;
            crumbs.push({ name: part, path: accPath });
        }

        return crumbs;
    };

    const filteredAssets = searchQuery.trim() ? searchResults : assets;

    const getRelativePath = (fullPath: string): string => {
        if (!projectPath) return fullPath;
        const relativePath = fullPath.replace(projectPath, '').replace(/^[/\\]/, '');
        const parts = relativePath.split(/[/\\]/);
        return parts.slice(0, -1).join('/');
    };

    const getFileIcon = (asset: AssetItem) => {
        if (asset.type === 'folder') {
            // 检查是否为框架专用文件夹
            const folderName = asset.name.toLowerCase();
            if (folderName === 'plugins' || folderName === '.ecs') {
                return <Folder className="asset-icon system-folder" style={{ color: '#42a5f5' }} size={20} />;
            }
            return <Folder className="asset-icon" style={{ color: '#ffa726' }} size={20} />;
        }

        const ext = asset.extension?.toLowerCase();
        switch (ext) {
            case 'ecs':
                return <File className="asset-icon" style={{ color: '#66bb6a' }} size={20} />;
            case 'btree':
                return <FileText className="asset-icon" style={{ color: '#ab47bc' }} size={20} />;
            case 'ts':
            case 'tsx':
            case 'js':
            case 'jsx':
                return <FileCode className="asset-icon" style={{ color: '#42a5f5' }} size={20} />;
            case 'json':
                return <FileJson className="asset-icon" style={{ color: '#ffa726' }} size={20} />;
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
                return <FileImage className="asset-icon" style={{ color: '#ec407a' }} size={20} />;
            default:
                return <File className="asset-icon" size={20} />;
        }
    };

    if (!projectPath) {
        return (
            <div className="asset-browser">
                <div className="asset-browser-header">
                    <h3>{t.title}</h3>
                </div>
                <div className="asset-browser-empty">
                    <p>{t.noProject}</p>
                </div>
            </div>
        );
    }

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="asset-browser">
            <div className="asset-browser-content">
                <div style={{
                    padding: '8px',
                    borderBottom: '1px solid #3e3e3e',
                    display: 'flex',
                    gap: '8px',
                    background: '#252526',
                    alignItems: 'center'
                }}>
                    <div className="view-mode-buttons">
                        <button
                            className={`view-mode-btn ${showDetailView ? 'active' : ''}`}
                            onClick={() => {
                                setShowDetailView(true);
                                localStorage.setItem('asset-browser-detail-view', 'true');
                            }}
                            title="显示详细视图（树形图 + 资产列表）"
                        >
                            <LayoutGrid size={14} />
                            <span className="view-mode-text">详细视图</span>
                        </button>
                        <button
                            className={`view-mode-btn ${!showDetailView ? 'active' : ''}`}
                            onClick={() => {
                                setShowDetailView(false);
                                localStorage.setItem('asset-browser-detail-view', 'false');
                            }}
                            title="仅显示树形图（查看完整路径）"
                        >
                            <List size={14} />
                            <span className="view-mode-text">树形图</span>
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            if (showDetailView) {
                                detailViewFileTreeRef.current?.collapseAll();
                            } else {
                                treeOnlyViewFileTreeRef.current?.collapseAll();
                            }
                        }}
                        style={{
                            padding: '6px 8px',
                            background: 'transparent',
                            border: '1px solid #3e3e3e',
                            color: '#cccccc',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '3px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2a2d2e';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                        title="收起所有文件夹"
                    >
                        <ChevronsUp size={14} />
                    </button>
                    <button
                        onClick={() => {
                            if (currentPath) {
                                loadAssets(currentPath);
                            }
                            if (showDetailView) {
                                detailViewFileTreeRef.current?.refresh();
                            } else {
                                treeOnlyViewFileTreeRef.current?.refresh();
                            }
                        }}
                        style={{
                            padding: '6px 8px',
                            background: 'transparent',
                            border: '1px solid #3e3e3e',
                            color: '#cccccc',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '3px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2a2d2e';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                        title="刷新资产列表"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <input
                        type="text"
                        className="asset-search"
                        placeholder={t.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '6px 10px',
                            background: '#3c3c3c',
                            border: '1px solid #3e3e3e',
                            borderRadius: '3px',
                            color: '#cccccc',
                            fontSize: '12px',
                            outline: 'none'
                        }}
                    />
                </div>
                {showDetailView ? (
                    <ResizablePanel
                        direction="horizontal"
                        defaultSize={200}
                        minSize={150}
                        maxSize={400}
                        leftOrTop={
                            <div className="asset-browser-tree">
                                <FileTree
                                    ref={detailViewFileTreeRef}
                                    rootPath={projectPath}
                                    onSelectFile={handleFolderSelect}
                                    selectedPath={currentPath}
                                    messageHub={messageHub}
                                    searchQuery={searchQuery}
                                    showFiles={false}
                                />
                            </div>
                        }
                        rightOrBottom={
                        <div className="asset-browser-list">
                            <div className="asset-browser-breadcrumb">
                                {breadcrumbs.map((crumb, index) => (
                                    <span key={crumb.path}>
                                        <span
                                            className="breadcrumb-item"
                                            onClick={() => {
                                                setCurrentPath(crumb.path);
                                                loadAssets(crumb.path);
                                            }}
                                        >
                                            {crumb.name}
                                        </span>
                                        {index < breadcrumbs.length - 1 && <span className="breadcrumb-separator"> / </span>}
                                    </span>
                                ))}
                            </div>
                            {(loading || isSearching) ? (
                                <div className="asset-browser-loading">
                                    <p>{isSearching ? '搜索中...' : t.loading}</p>
                                </div>
                            ) : filteredAssets.length === 0 ? (
                                <div className="asset-browser-empty">
                                    <p>{searchQuery.trim() ? '未找到匹配的资产' : t.empty}</p>
                                </div>
                            ) : (
                                <div className="asset-list">
                                    {filteredAssets.map((asset, index) => {
                                        const relativePath = getRelativePath(asset.path);
                                        const showPath = searchQuery.trim() && relativePath;
                                        return (
                                            <div
                                                key={index}
                                                className={`asset-item ${selectedPaths.has(asset.path) ? 'selected' : ''}`}
                                                onClick={(e) => handleAssetClick(asset, e)}
                                                onDoubleClick={() => handleAssetDoubleClick(asset)}
                                                onContextMenu={(e) => handleContextMenu(e, asset)}
                                                draggable={asset.type === 'file'}
                                                onDragStart={(e) => {
                                                    if (asset.type === 'file') {
                                                        e.dataTransfer.effectAllowed = 'copy';

                                                        // Get all selected file assets
                                                        const selectedFiles = selectedPaths.has(asset.path) && selectedPaths.size > 1
                                                            ? Array.from(selectedPaths)
                                                                .filter(p => {
                                                                    const a = assets?.find(item => item.path === p);
                                                                    return a && a.type === 'file';
                                                                })
                                                                .map(p => {
                                                                    const a = assets?.find(item => item.path === p);
                                                                    return { type: 'file', path: p, name: a?.name, extension: a?.extension };
                                                                })
                                                            : [{ type: 'file', path: asset.path, name: asset.name, extension: asset.extension }];

                                                        // Set drag data as JSON array for multi-file support
                                                        e.dataTransfer.setData('application/json', JSON.stringify(selectedFiles));
                                                        e.dataTransfer.setData('asset-path', asset.path);
                                                        e.dataTransfer.setData('asset-name', asset.name);
                                                        e.dataTransfer.setData('asset-extension', asset.extension || '');
                                                        e.dataTransfer.setData('text/plain', asset.path);

                                                        // 设置拖拽时的视觉效果
                                                        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                                                        dragImage.style.position = 'absolute';
                                                        dragImage.style.top = '-9999px';
                                                        dragImage.style.opacity = '0.8';
                                                        if (selectedFiles.length > 1) {
                                                            dragImage.textContent = `${selectedFiles.length} files`;
                                                        }
                                                        document.body.appendChild(dragImage);
                                                        e.dataTransfer.setDragImage(dragImage, 0, 0);
                                                        setTimeout(() => document.body.removeChild(dragImage), 0);
                                                    }
                                                }}
                                                style={{
                                                    cursor: asset.type === 'file' ? 'grab' : 'pointer'
                                                }}
                                            >
                                                {getFileIcon(asset)}
                                                <div className="asset-info">
                                                    <div className="asset-name" title={asset.path}>
                                                        {asset.name}
                                                    </div>
                                                    {showPath && (
                                                        <div className="asset-path" style={{
                                                            fontSize: '11px',
                                                            color: '#666',
                                                            marginTop: '2px'
                                                        }}>
                                                            {relativePath}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="asset-type">
                                                    {asset.type === 'folder' ? t.folder : (asset.extension || t.file)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    }
                />
                ) : (
                    <div className="asset-browser-tree-only">
                        <FileTree
                            ref={treeOnlyViewFileTreeRef}
                            rootPath={projectPath}
                            onSelectFile={handleFolderSelect}
                            onSelectFiles={handleTreeMultiSelect}
                            selectedPath={Array.from(selectedPaths)[0] || currentPath}
                            selectedPaths={selectedPaths}
                            messageHub={messageHub}
                            searchQuery={searchQuery}
                            showFiles={true}
                        />
                    </div>
                )}
            </div>
            {contextMenu && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.asset)}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* 重命名对话框 */}
            {renameDialog && (
                <div className="dialog-overlay" onClick={() => setRenameDialog(null)}>
                    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h3>{locale === 'zh' ? '重命名' : 'Rename'}</h3>
                        </div>
                        <div className="dialog-body">
                            <input
                                type="text"
                                value={renameDialog.newName}
                                onChange={(e) => setRenameDialog({ ...renameDialog, newName: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleRename(renameDialog.asset, renameDialog.newName);
                                    } else if (e.key === 'Escape') {
                                        setRenameDialog(null);
                                    }
                                }}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#2d2d2d',
                                    border: '1px solid #3e3e3e',
                                    borderRadius: '4px',
                                    color: '#cccccc',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                        <div className="dialog-footer">
                            <button
                                onClick={() => setRenameDialog(null)}
                                style={{
                                    padding: '6px 16px',
                                    backgroundColor: '#3e3e3e',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#cccccc',
                                    cursor: 'pointer',
                                    marginRight: '8px'
                                }}
                            >
                                {locale === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                                onClick={() => handleRename(renameDialog.asset, renameDialog.newName)}
                                style={{
                                    padding: '6px 16px',
                                    backgroundColor: '#0e639c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                }}
                            >
                                {locale === 'zh' ? '确定' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 删除确认对话框 */}
            {deleteConfirmDialog && (
                <div className="dialog-overlay" onClick={() => setDeleteConfirmDialog(null)}>
                    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h3>{locale === 'zh' ? '确认删除' : 'Confirm Delete'}</h3>
                        </div>
                        <div className="dialog-body">
                            <p style={{ margin: 0, color: '#cccccc' }}>
                                {locale === 'zh'
                                    ? `确定要删除 "${deleteConfirmDialog.name}" 吗？此操作不可撤销。`
                                    : `Are you sure you want to delete "${deleteConfirmDialog.name}"? This action cannot be undone.`}
                            </p>
                        </div>
                        <div className="dialog-footer">
                            <button
                                onClick={() => setDeleteConfirmDialog(null)}
                                style={{
                                    padding: '6px 16px',
                                    backgroundColor: '#3e3e3e',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#cccccc',
                                    cursor: 'pointer',
                                    marginRight: '8px'
                                }}
                            >
                                {locale === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmDialog)}
                                style={{
                                    padding: '6px 16px',
                                    backgroundColor: '#c53030',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                }}
                            >
                                {locale === 'zh' ? '删除' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
