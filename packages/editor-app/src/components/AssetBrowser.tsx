import { useState, useEffect } from 'react';
import { Folder, File, FileCode, FileJson, FileImage, FileText, FolderOpen, Copy, Trash2, Edit3 } from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import { FileTree } from './FileTree';
import { ResizablePanel } from './ResizablePanel';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import '../styles/AssetBrowser.css';

interface AssetItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
}

interface AssetBrowserProps {
  projectPath: string | null;
  locale: string;
  onOpenScene?: (scenePath: string) => void;
  onOpenBehaviorTree?: (btreePath: string) => void;
}

export function AssetBrowser({ projectPath, locale, onOpenScene, onOpenBehaviorTree }: AssetBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
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
          extension
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

  const handleFolderSelect = (path: string) => {
    setCurrentPath(path);
    loadAssets(path);
  };

  const handleAssetClick = (asset: AssetItem) => {
    setSelectedPath(asset.path);
  };

  const handleAssetDoubleClick = async (asset: AssetItem) => {
    if (asset.type === 'folder') {
      setCurrentPath(asset.path);
      loadAssets(asset.path);
    } else if (asset.type === 'file') {
      if (asset.extension === 'ecs' && onOpenScene) {
        onOpenScene(asset.path);
      } else if (asset.extension === 'btree' && onOpenBehaviorTree) {
        onOpenBehaviorTree(asset.path);
      } else {
        // 其他文件使用系统默认程序打开
        try {
          await TauriAPI.openFileWithSystemApp(asset.path);
        } catch (error) {
          console.error('Failed to open file:', error);
        }
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

    // 打开
    if (asset.type === 'file') {
      items.push({
        label: locale === 'zh' ? '打开' : 'Open',
        icon: <File size={16} />,
        onClick: () => handleAssetDoubleClick(asset)
      });
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
    const parts = relative.split(/[/\\]/).filter(p => p);

    const crumbs = [{ name: 'Content', path: projectPath }];
    let accPath = projectPath;

    for (const part of parts) {
      accPath = `${accPath}${accPath.endsWith('\\') || accPath.endsWith('/') ? '' : '/'}${part}`;
      crumbs.push({ name: part, path: accPath });
    }

    return crumbs;
  };

  const filteredAssets = searchQuery
    ? assets.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assets;

  const getFileIcon = (asset: AssetItem) => {
    if (asset.type === 'folder') {
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
      <div className="asset-browser-header">
        <h3>{t.title}</h3>
      </div>

      <div className="asset-browser-content">
        <ResizablePanel
          direction="horizontal"
          defaultSize={200}
          minSize={150}
          maxSize={400}
          leftOrTop={
            <div className="asset-browser-tree">
              <FileTree
                rootPath={projectPath}
                onSelectFile={handleFolderSelect}
                selectedPath={currentPath}
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
              <div className="asset-browser-toolbar">
                <input
                  type="text"
                  className="asset-search"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {loading ? (
                <div className="asset-browser-loading">
                  <p>{t.loading}</p>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="asset-browser-empty">
                  <p>{t.empty}</p>
                </div>
              ) : (
                <div className="asset-list">
                  {filteredAssets.map((asset, index) => (
                    <div
                      key={index}
                      className={`asset-item ${selectedPath === asset.path ? 'selected' : ''}`}
                      onClick={() => handleAssetClick(asset)}
                      onDoubleClick={() => handleAssetDoubleClick(asset)}
                      onContextMenu={(e) => handleContextMenu(e, asset)}
                    >
                      {getFileIcon(asset)}
                      <div className="asset-name" title={asset.name}>
                        {asset.name}
                      </div>
                      <div className="asset-type">
                        {asset.type === 'folder' ? t.folder : (asset.extension || t.file)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        />
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
