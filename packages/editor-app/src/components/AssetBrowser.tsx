import { useState, useEffect } from 'react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import { FileTree } from './FileTree';
import { ResizablePanel } from './ResizablePanel';
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

  const handleAssetDoubleClick = (asset: AssetItem) => {
    if (asset.type === 'folder') {
      setCurrentPath(asset.path);
      loadAssets(asset.path);
    } else if (asset.type === 'file') {
      if (asset.extension === 'ecs' && onOpenScene) {
        onOpenScene(asset.path);
      } else if (asset.extension === 'btree' && onOpenBehaviorTree) {
        onOpenBehaviorTree(asset.path);
      }
    }
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
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon" style={{ color: '#ffa726' }}>
          <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H12L10 5H5C3.89543 5 3 5.89543 3 7Z" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      );
    }

    const ext = asset.extension?.toLowerCase();
    switch (ext) {
      case 'ecs':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon" style={{ color: '#66bb6a' }}>
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeWidth="2"/>
            <path d="M14 2V8H20" strokeWidth="2"/>
            <circle cx="12" cy="14" r="3" strokeWidth="2"/>
          </svg>
        );
      case 'btree':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon" style={{ color: '#ab47bc' }}>
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeWidth="2"/>
            <path d="M14 2V8H20" strokeWidth="2"/>
            <path d="M12 10V14M10 12H14M12 14L10 16M12 14L14 16" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon" style={{ color: '#42a5f5' }}>
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeWidth="2"/>
            <path d="M14 2V8H20" strokeWidth="2"/>
            <path d="M12 18L12 14M12 10L12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'json':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon" style={{ color: '#ffa726' }}>
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeWidth="2"/>
            <path d="M14 2V8H20" strokeWidth="2"/>
          </svg>
        );
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon" style={{ color: '#ec407a' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15L16 10L5 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeWidth="2"/>
            <path d="M14 2V8H20" strokeWidth="2"/>
          </svg>
        );
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
    </div>
  );
}
