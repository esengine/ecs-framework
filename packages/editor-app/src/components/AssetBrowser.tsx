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
}

type ViewMode = 'tree-split' | 'tree-only';

export function AssetBrowser({ projectPath, locale, onOpenScene }: AssetBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree-split');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: 'Assets',
      noProject: 'No project loaded',
      loading: 'Loading...',
      empty: 'No assets found',
      search: 'Search...',
      viewTreeSplit: 'Tree + List',
      viewTreeOnly: 'Tree Only',
      name: 'Name',
      type: 'Type',
      file: 'File',
      folder: 'Folder'
    },
    zh: {
      title: '资产',
      noProject: '没有加载项目',
      loading: '加载中...',
      empty: '没有找到资产',
      search: '搜索...',
      viewTreeSplit: '树形+列表',
      viewTreeOnly: '纯树形',
      name: '名称',
      type: '类型',
      file: '文件',
      folder: '文件夹'
    }
  };

  const t = translations[locale as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (projectPath) {
      if (viewMode === 'tree-split') {
        loadAssets(projectPath);
      }
    } else {
      setAssets([]);
      setSelectedPath(null);
    }
  }, [projectPath, viewMode]);

  // Listen for asset reveal requests
  useEffect(() => {
    const messageHub = Core.services.resolve(MessageHub);
    if (!messageHub) return;

    const unsubscribe = messageHub.subscribe('asset:reveal', (data: any) => {
      const filePath = data.path;
      if (filePath) {
        setSelectedPath(filePath);

        if (viewMode === 'tree-split') {
          const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
          const dirPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : null;
          if (dirPath) {
            loadAssets(dirPath);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [viewMode]);

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

      setAssets(assetItems);
    } catch (error) {
      console.error('Failed to load assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTreeSelect = (path: string) => {
    setSelectedPath(path);
    if (viewMode === 'tree-split') {
      loadAssets(path);
    }
  };

  const handleAssetClick = (asset: AssetItem) => {
    setSelectedPath(asset.path);
  };

  const handleAssetDoubleClick = (asset: AssetItem) => {
    if (asset.type === 'file' && asset.extension === 'ecs') {
      if (onOpenScene) {
        onOpenScene(asset.path);
      }
    }
  };

  const filteredAssets = searchQuery
    ? assets.filter(asset =>
        asset.type === 'file' && asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assets.filter(asset => asset.type === 'file');

  const getFileIcon = (extension?: string) => {
    switch (extension?.toLowerCase()) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeWidth="2"/>
            <path d="M14 2V8H20" strokeWidth="2"/>
            <path d="M12 18L12 14M12 10L12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'json':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" strokeWidth="2"/>
            <path d="M14 2V8H20" strokeWidth="2"/>
          </svg>
        );
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon">
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

  const renderListView = () => (
    <div className="asset-browser-list">
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
              {getFileIcon(asset.extension)}
              <div className="asset-name" title={asset.name}>
                {asset.name}
              </div>
              <div className="asset-type">
                {asset.extension || t.file}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="asset-browser">
      <div className="asset-browser-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0 }}>{t.title}</h3>
          <div className="view-mode-buttons">
            <button
              className={`view-mode-btn ${viewMode === 'tree-split' ? 'active' : ''}`}
              onClick={() => setViewMode('tree-split')}
              title={t.viewTreeSplit}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="18"/>
                <rect x="14" y="3" width="7" height="18"/>
              </svg>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'tree-only' ? 'active' : ''}`}
              onClick={() => setViewMode('tree-only')}
              title={t.viewTreeOnly}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="asset-browser-content">
        {viewMode === 'tree-only' ? (
          <div className="asset-browser-tree-only">
            <div className="asset-browser-toolbar">
              <input
                type="text"
                className="asset-search"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <FileTree
              rootPath={projectPath}
              onSelectFile={handleTreeSelect}
              selectedPath={selectedPath}
            />
          </div>
        ) : (
          <ResizablePanel
            direction="horizontal"
            defaultSize={200}
            minSize={150}
            maxSize={400}
            leftOrTop={
              <div className="asset-browser-tree">
                <FileTree
                  rootPath={projectPath}
                  onSelectFile={handleTreeSelect}
                  selectedPath={selectedPath}
                />
              </div>
            }
            rightOrBottom={renderListView()}
          />
        )}
      </div>
    </div>
  );
}
