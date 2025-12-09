import { useState, useEffect } from 'react';
import { X, Folder, Search, ArrowLeft, Grid, List, FileCode } from 'lucide-react';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import { useLocale } from '../hooks/useLocale';
import '../styles/AssetPickerDialog.css';

interface AssetPickerDialogProps {
    projectPath: string;
    fileExtension: string;
    onSelect: (assetId: string) => void;
    onClose: () => void;
    locale: string;
    /** 资产基础路径（相对于项目根目录），用于计算 assetId */
    assetBasePath?: string;
}

interface AssetItem {
    name: string;
    path: string;
    isDir: boolean;
    extension?: string;
    size?: number;
    modified?: number;
}

type ViewMode = 'list' | 'grid';

export function AssetPickerDialog({ projectPath, fileExtension, onSelect, onClose, locale, assetBasePath }: AssetPickerDialogProps) {
    const { t, locale: currentLocale } = useLocale();

    // 计算实际的资产目录路径
    const actualAssetPath = assetBasePath
        ? `${projectPath}/${assetBasePath}`.replace(/\\/g, '/').replace(/\/+/g, '/')
        : projectPath;

    const [currentPath, setCurrentPath] = useState(actualAssetPath);
    const [assets, setAssets] = useState<AssetItem[]>([]);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    useEffect(() => {
        loadAssets(currentPath);
    }, [currentPath]);

    const loadAssets = async (path: string) => {
        setLoading(true);
        try {
            const entries = await TauriAPI.listDirectory(path);
            const assetItems: AssetItem[] = entries
                .map((entry: DirectoryEntry) => {
                    const extension = entry.is_dir ? undefined :
                        (entry.name.includes('.') ? entry.name.split('.').pop() : undefined);

                    return {
                        name: entry.name,
                        path: entry.path,
                        isDir: entry.is_dir,
                        extension,
                        size: entry.size,
                        modified: entry.modified
                    };
                })
                .filter((item) => item.isDir || item.extension === fileExtension)
                .sort((a, b) => {
                    if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
                    return a.isDir ? -1 : 1;
                });

            setAssets(assetItems);
        } catch (error) {
            console.error('Failed to load assets:', error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    // 过滤搜索结果
    const filteredAssets = assets.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 格式化文件大小
    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // 格式化修改时间
    const formatDate = (timestamp?: number): string => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const localeMap: Record<string, string> = { zh: 'zh-CN', en: 'en-US', es: 'es-ES' };
        return date.toLocaleDateString(localeMap[currentLocale] || 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // 返回上级目录
    const handleGoBack = () => {
        const parentPath = currentPath.split(/[/\\]/).slice(0, -1).join('/');
        const minPath = actualAssetPath.replace(/[/\\]$/, '');
        if (parentPath && parentPath !== minPath) {
            setCurrentPath(parentPath);
        } else if (currentPath !== actualAssetPath) {
            setCurrentPath(actualAssetPath);
        }
    };

    // 只能返回到资产基础目录，不能再往上
    const canGoBack = currentPath !== actualAssetPath;

    const handleItemClick = (item: AssetItem) => {
        if (item.isDir) {
            setCurrentPath(item.path);
        } else {
            setSelectedPath(item.path);
        }
    };

    const handleItemDoubleClick = (item: AssetItem) => {
        if (!item.isDir) {
            const assetId = calculateAssetId(item.path);
            onSelect(assetId);
        }
    };

    const handleSelect = () => {
        if (selectedPath) {
            const assetId = calculateAssetId(selectedPath);
            onSelect(assetId);
        }
    };

    /**
     * 计算资产ID
     * 将绝对路径转换为相对于资产基础目录的assetId（不含扩展名）
     */
    const calculateAssetId = (absolutePath: string): string => {
        const normalized = absolutePath.replace(/\\/g, '/');
        const baseNormalized = actualAssetPath.replace(/\\/g, '/');

        // 获取相对于资产基础目录的路径
        let relativePath = normalized;
        if (normalized.startsWith(baseNormalized)) {
            relativePath = normalized.substring(baseNormalized.length);
        }

        // 移除开头的斜杠
        relativePath = relativePath.replace(/^\/+/, '');

        // 移除文件扩展名
        const assetId = relativePath.replace(new RegExp(`\\.${fileExtension}$`), '');

        return assetId;
    };

    const getBreadcrumbs = () => {
        const basePathNormalized = actualAssetPath.replace(/\\/g, '/');
        const currentPathNormalized = currentPath.replace(/\\/g, '/');

        const relative = currentPathNormalized.replace(basePathNormalized, '');
        const parts = relative.split('/').filter((p) => p);

        // 根路径名称（显示"行为树"或"Assets"）
        const rootName = assetBasePath
            ? assetBasePath.split('/').pop() || 'Assets'
            : 'Content';

        const crumbs = [{ name: rootName, path: actualAssetPath }];
        let accPath = actualAssetPath;

        for (const part of parts) {
            accPath = `${accPath}/${part}`;
            crumbs.push({ name: part, path: accPath });
        }

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="asset-picker-overlay" onClick={onClose}>
            <div className="asset-picker-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="asset-picker-header">
                    <h3>{t('assetPicker.title')}</h3>
                    <button className="asset-picker-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="asset-picker-toolbar">
                    <button
                        className="toolbar-button"
                        onClick={handleGoBack}
                        disabled={!canGoBack}
                        title={t('assetPicker.back')}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div className="asset-picker-breadcrumb">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={crumb.path}>
                                <span
                                    className="breadcrumb-item"
                                    onClick={() => setCurrentPath(crumb.path)}
                                >
                                    {crumb.name}
                                </span>
                                {index < breadcrumbs.length - 1 && <span className="breadcrumb-separator"> / </span>}
                            </span>
                        ))}
                    </div>

                    <div className="view-mode-buttons">
                        <button
                            className={`toolbar-button ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title={t('assetPicker.listView')}
                        >
                            <List size={16} />
                        </button>
                        <button
                            className={`toolbar-button ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title={t('assetPicker.gridView')}
                        >
                            <Grid size={16} />
                        </button>
                    </div>
                </div>

                <div className="asset-picker-search">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder={t('assetPicker.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="asset-picker-content">
                    {loading ? (
                        <div className="asset-picker-loading">{t('assetPicker.loading')}</div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="asset-picker-empty">{t('assetPicker.empty')}</div>
                    ) : (
                        <div className={`asset-picker-list ${viewMode}`}>
                            {filteredAssets.map((item, index) => (
                                <div
                                    key={index}
                                    className={`asset-picker-item ${selectedPath === item.path ? 'selected' : ''}`}
                                    onClick={() => handleItemClick(item)}
                                    onDoubleClick={() => handleItemDoubleClick(item)}
                                >
                                    <div className="asset-icon">
                                        {item.isDir ? (
                                            <Folder size={viewMode === 'grid' ? 32 : 18} style={{ color: '#ffa726' }} />
                                        ) : (
                                            <FileCode size={viewMode === 'grid' ? 32 : 18} style={{ color: '#66bb6a' }} />
                                        )}
                                    </div>
                                    <div className="asset-info">
                                        <span className="asset-name">{item.name}</span>
                                        {viewMode === 'list' && !item.isDir && (
                                            <div className="asset-meta">
                                                {item.size && <span className="asset-size">{formatFileSize(item.size)}</span>}
                                                {item.modified && <span className="asset-date">{formatDate(item.modified)}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="asset-picker-footer">
                    <div className="footer-info">
                        {t('assetPicker.itemCount', { count: filteredAssets.length })}
                    </div>
                    <div className="footer-buttons">
                        <button className="asset-picker-cancel" onClick={onClose}>
                            {t('assetPicker.cancel')}
                        </button>
                        <button
                            className="asset-picker-select"
                            onClick={handleSelect}
                            disabled={!selectedPath}
                        >
                            {t('assetPicker.select')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
