import { useState, useEffect } from 'react';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
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
}

export function AssetBrowser({ projectPath, locale }: AssetBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: 'Assets',
      noProject: 'No project loaded',
      loading: 'Loading...',
      empty: 'No assets found',
      name: 'Name',
      type: 'Type',
      file: 'File',
      folder: 'Folder',
      backToParent: 'Back to parent folder'
    },
    zh: {
      title: '资产',
      noProject: '没有加载项目',
      loading: '加载中...',
      empty: '没有找到资产',
      name: '名称',
      type: '类型',
      file: '文件',
      folder: '文件夹',
      backToParent: '返回上一级'
    }
  };

  const t = translations[locale as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (projectPath) {
      setCurrentPath(projectPath);
      loadAssets(projectPath);
    } else {
      setAssets([]);
      setCurrentPath('');
    }
  }, [projectPath]);

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

  const handleAssetClick = (asset: AssetItem) => {
    setSelectedAsset(asset.path);
    if (asset.type === 'folder') {
      setCurrentPath(asset.path);
      loadAssets(asset.path);
    }
  };

  const handleAssetDoubleClick = (asset: AssetItem) => {
    console.log('Open asset:', asset);
  };

  const handleBackToParent = () => {
    if (!currentPath || !projectPath) return;
    if (currentPath === projectPath) return;

    const parentPath = currentPath.split(/[\\/]/).slice(0, -1).join(currentPath.includes('\\') ? '\\' : '/');
    setCurrentPath(parentPath);
    loadAssets(parentPath);
  };

  const canGoBack = currentPath && projectPath && currentPath !== projectPath;

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

  const getFolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="asset-icon folder">
      <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" strokeWidth="2"/>
    </svg>
  );

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

  return (
    <div className="asset-browser">
      <div className="asset-browser-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h3 style={{ margin: 0 }}>{t.title}</h3>
          {canGoBack && (
            <button
              onClick={handleBackToParent}
              className="back-button"
              title={t.backToParent}
              style={{
                padding: '4px 8px',
                background: '#0e639c',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              ↑
            </button>
          )}
        </div>
        <div className="asset-path">{currentPath}</div>
      </div>

      {loading ? (
        <div className="asset-browser-loading">
          <p>{t.loading}</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="asset-browser-empty">
          <p>{t.empty}</p>
        </div>
      ) : (
        <div className="asset-browser-content">
          <div className="asset-list">
            {assets.map((asset, index) => (
              <div
                key={index}
                className={`asset-item ${selectedAsset === asset.path ? 'selected' : ''}`}
                onClick={() => handleAssetClick(asset)}
                onDoubleClick={() => handleAssetDoubleClick(asset)}
              >
                {asset.type === 'folder' ? getFolderIcon() : getFileIcon(asset.extension)}
                <div className="asset-name" title={asset.name}>
                  {asset.name}
                </div>
                <div className="asset-type">
                  {asset.type === 'folder' ? t.folder : asset.extension || t.file}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
