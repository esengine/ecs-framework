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
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
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
            setSelectedPath(null);
        }
    }, [projectPath]);

    // Listen for asset reveal requests
    useEffect(() => {
        const messageHub = Core.services.resolve(MessageHub);
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('asset:reveal', (data: any) => {
            const filePath = data.path;
            if (filePath) {
                setSelectedPath(filePath);
                const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
                const dirPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : null;
                if (dirPath) {
                    setCurrentPath(dirPath);
                    loadAssets(dirPath);
                }
            }
        });

        return () => unsubscribe();
    }, []);

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

    const handleAssetClick = (asset: AssetItem) => {
        setSelectedPath(asset.path);

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
                // TODO: 实现重命名功能
                console.log('Rename:', asset.path);
            },
            disabled: true
        });

        // 删除
        items.push({
            label: locale === 'zh' ? '删除' : 'Delete',
            icon: <Trash2 size={16} />,
            onClick: () => {
                // TODO: 实现删除功能
                console.log('Delete:', asset.path);
            },
            disabled: true
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
                                                className={`asset-item ${selectedPath === asset.path ? 'selected' : ''}`}
                                                onClick={() => handleAssetClick(asset)}
                                                onDoubleClick={() => handleAssetDoubleClick(asset)}
                                                onContextMenu={(e) => handleContextMenu(e, asset)}
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
                            selectedPath={currentPath}
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
        </div>
    );
}
