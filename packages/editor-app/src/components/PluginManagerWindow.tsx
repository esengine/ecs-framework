import { useState, useEffect, useMemo } from 'react';
import { EditorPluginManager, IEditorPluginMetadata, EditorPluginCategory } from '@esengine/editor-core';
import * as LucideIcons from 'lucide-react';
import {
    Package,
    CheckCircle,
    XCircle,
    Search,
    Grid,
    List,
    ChevronDown,
    ChevronRight,
    X,
    RefreshCw,
    ShoppingCart
} from 'lucide-react';
import { PluginMarketPanel } from './PluginMarketPanel';
import { PluginMarketService } from '../services/PluginMarketService';
import '../styles/PluginManagerWindow.css';

interface PluginManagerWindowProps {
    pluginManager: EditorPluginManager;
    onClose: () => void;
    onRefresh?: () => Promise<void>;
    onOpen?: () => void;
    locale: string;
}

const categoryIcons: Record<EditorPluginCategory, string> = {
    [EditorPluginCategory.Tool]: 'Wrench',
    [EditorPluginCategory.Window]: 'LayoutGrid',
    [EditorPluginCategory.Inspector]: 'Search',
    [EditorPluginCategory.System]: 'Settings',
    [EditorPluginCategory.ImportExport]: 'Package'
};

export function PluginManagerWindow({ pluginManager, onClose, onRefresh, onOpen, locale }: PluginManagerWindowProps) {
    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: '插件管理器',
                searchPlaceholder: '搜索插件...',
                enabled: '已启用',
                disabled: '已禁用',
                enable: '启用',
                disable: '禁用',
                enablePlugin: '启用插件',
                disablePlugin: '禁用插件',
                refresh: '刷新',
                refreshPluginList: '刷新插件列表',
                close: '关闭',
                listView: '列表视图',
                gridView: '网格视图',
                noPlugins: '未安装插件',
                installed: '安装于',
                categoryTools: '工具',
                categoryWindows: '窗口',
                categoryInspectors: '检查器',
                categorySystem: '系统',
                categoryImportExport: '导入/导出',
                tabInstalled: '已安装',
                tabMarketplace: '插件市场'
            },
            en: {
                title: 'Plugin Manager',
                searchPlaceholder: 'Search plugins...',
                enabled: 'Enabled',
                disabled: 'Disabled',
                enable: 'Enable',
                disable: 'Disable',
                enablePlugin: 'Enable plugin',
                disablePlugin: 'Disable plugin',
                refresh: 'Refresh',
                refreshPluginList: 'Refresh plugin list',
                close: 'Close',
                listView: 'List view',
                gridView: 'Grid view',
                noPlugins: 'No plugins installed',
                installed: 'Installed',
                categoryTools: 'Tools',
                categoryWindows: 'Windows',
                categoryInspectors: 'Inspectors',
                categorySystem: 'System',
                categoryImportExport: 'Import/Export',
                tabInstalled: 'Installed',
                tabMarketplace: 'Marketplace'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const getCategoryName = (category: EditorPluginCategory): string => {
        const categoryKeys: Record<EditorPluginCategory, string> = {
            [EditorPluginCategory.Tool]: 'categoryTools',
            [EditorPluginCategory.Window]: 'categoryWindows',
            [EditorPluginCategory.Inspector]: 'categoryInspectors',
            [EditorPluginCategory.System]: 'categorySystem',
            [EditorPluginCategory.ImportExport]: 'categoryImportExport'
        };
        return t(categoryKeys[category]);
    };
    const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');
    const [plugins, setPlugins] = useState<IEditorPluginMetadata[]>([]);
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [expandedCategories, setExpandedCategories] = useState<Set<EditorPluginCategory>>(
        new Set(Object.values(EditorPluginCategory))
    );
    const [isRefreshing, setIsRefreshing] = useState(false);

    const marketService = useMemo(() => new PluginMarketService(pluginManager), [pluginManager]);

    const updatePluginList = () => {
        const allPlugins = pluginManager.getAllPluginMetadata();
        setPlugins(allPlugins);
    };

    useEffect(() => {
        if (onOpen) {
            onOpen();
        }
        updatePluginList();
    }, [pluginManager]);

    // 监听 locale 变化，重新获取插件列表（以刷新插件的 displayName 和 description）
    useEffect(() => {
        updatePluginList();
    }, [locale]);

    const handleRefresh = async () => {
        if (!onRefresh || isRefreshing) return;

        setIsRefreshing(true);
        try {
            await onRefresh();
            updatePluginList();
        } catch (error) {
            console.error('Failed to refresh plugins:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const togglePlugin = async (name: string, enabled: boolean) => {
        try {
            if (enabled) {
                await pluginManager.disablePlugin(name);
            } else {
                await pluginManager.enablePlugin(name);
            }
            const allPlugins = pluginManager.getAllPluginMetadata();
            setPlugins(allPlugins);
        } catch (error) {
            console.error(`Failed to toggle plugin ${name}:`, error);
        }
    };

    const toggleCategory = (category: EditorPluginCategory) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const filteredPlugins = plugins.filter((plugin) => {
        if (!filter) return true;
        const searchLower = filter.toLowerCase();
        return (
            plugin.name.toLowerCase().includes(searchLower) ||
            plugin.displayName.toLowerCase().includes(searchLower) ||
            plugin.description?.toLowerCase().includes(searchLower)
        );
    });

    const pluginsByCategory = filteredPlugins.reduce(
        (acc, plugin) => {
            if (!acc[plugin.category]) {
                acc[plugin.category] = [];
            }
            acc[plugin.category].push(plugin);
            return acc;
        },
        {} as Record<EditorPluginCategory, IEditorPluginMetadata[]>
    );

    const enabledCount = plugins.filter((p) => p.enabled).length;
    const disabledCount = plugins.filter((p) => !p.enabled).length;

    const renderPluginCard = (plugin: IEditorPluginMetadata) => {
        const IconComponent = plugin.icon ? (LucideIcons as any)[plugin.icon] : null;
        return (
            <div key={plugin.name} className={`plugin-card ${plugin.enabled ? 'enabled' : 'disabled'}`}>
                <div className="plugin-card-header">
                    <div className="plugin-card-icon">
                        {IconComponent ? <IconComponent size={24} /> : <Package size={24} />}
                    </div>
                    <div className="plugin-card-info">
                        <div className="plugin-card-title">{plugin.displayName}</div>
                        <div className="plugin-card-version">v{plugin.version}</div>
                    </div>
                    <button
                        className={`plugin-toggle ${plugin.enabled ? 'enabled' : 'disabled'}`}
                        onClick={() => togglePlugin(plugin.name, plugin.enabled)}
                        title={plugin.enabled ? t('disablePlugin') : t('enablePlugin')}
                    >
                        {plugin.enabled ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </button>
                </div>
                {plugin.description && <div className="plugin-card-description">{plugin.description}</div>}
                <div className="plugin-card-footer">
                    <span className="plugin-card-category">
                        {(() => {
                            const CategoryIcon = (LucideIcons as any)[categoryIcons[plugin.category]];
                            return CategoryIcon ? <CategoryIcon size={14} style={{ marginRight: '4px' }} /> : null;
                        })()}
                        {getCategoryName(plugin.category)}
                    </span>
                    {plugin.installedAt && (
                        <span className="plugin-card-installed">
                            {t('installed')}: {new Date(plugin.installedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const renderPluginList = (plugin: IEditorPluginMetadata) => {
        const IconComponent = plugin.icon ? (LucideIcons as any)[plugin.icon] : null;
        return (
            <div key={plugin.name} className={`plugin-list-item ${plugin.enabled ? 'enabled' : 'disabled'}`}>
                <div className="plugin-list-icon">
                    {IconComponent ? <IconComponent size={20} /> : <Package size={20} />}
                </div>
                <div className="plugin-list-info">
                    <div className="plugin-list-name">
                        {plugin.displayName}
                        <span className="plugin-list-version">v{plugin.version}</span>
                    </div>
                    {plugin.description && <div className="plugin-list-description">{plugin.description}</div>}
                </div>
                <div className="plugin-list-status">
                    {plugin.enabled ? (
                        <span className="status-badge enabled">{t('enabled')}</span>
                    ) : (
                        <span className="status-badge disabled">{t('disabled')}</span>
                    )}
                </div>
                <button
                    className="plugin-list-toggle"
                    onClick={() => togglePlugin(plugin.name, plugin.enabled)}
                    title={plugin.enabled ? t('disablePlugin') : t('enablePlugin')}
                >
                    {plugin.enabled ? t('disable') : t('enable')}
                </button>
            </div>
        );
    };

    return (
        <div className="plugin-manager-overlay" onClick={onClose}>
            <div className="plugin-manager-window" onClick={(e) => e.stopPropagation()}>
                <div className="plugin-manager-header">
                    <div className="plugin-manager-title">
                        <Package size={20} />
                        <h2>{t('title')}</h2>
                    </div>
                    <button className="plugin-manager-close" onClick={onClose} title={t('close')}>
                        <X size={20} />
                    </button>
                </div>

                <div className="plugin-manager-tabs">
                    <button
                        className={`plugin-manager-tab ${activeTab === 'installed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('installed')}
                    >
                        <Package size={16} />
                        {t('tabInstalled')}
                    </button>
                    <button
                        className={`plugin-manager-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
                        onClick={() => setActiveTab('marketplace')}
                    >
                        <ShoppingCart size={16} />
                        {t('tabMarketplace')}
                    </button>
                </div>

                {activeTab === 'installed' && (
                    <>
                        <div className="plugin-toolbar">
                            <div className="plugin-toolbar-left">
                                <div className="plugin-search">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder={t('searchPlaceholder')}
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="plugin-toolbar-right">
                                <div className="plugin-stats">
                                    <span className="stat-item enabled">
                                        <CheckCircle size={14} />
                                        {enabledCount} {t('enabled')}
                                    </span>
                                    <span className="stat-item disabled">
                                        <XCircle size={14} />
                                        {disabledCount} {t('disabled')}
                                    </span>
                                </div>
                                {onRefresh && (
                                    <button
                                        className="plugin-refresh-btn"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        title={t('refreshPluginList')}
                                        style={{
                                            padding: '6px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            backgroundColor: '#0e639c',
                                            border: 'none',
                                            borderRadius: '4px',
                                            color: '#fff',
                                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                            fontSize: '12px',
                                            opacity: isRefreshing ? 0.6 : 1
                                        }}
                                    >
                                        <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
                                        {t('refresh')}
                                    </button>
                                )}
                                <div className="plugin-view-mode">
                                    <button
                                        className={viewMode === 'list' ? 'active' : ''}
                                        onClick={() => setViewMode('list')}
                                        title={t('listView')}
                                    >
                                        <List size={14} />
                                    </button>
                                    <button
                                        className={viewMode === 'grid' ? 'active' : ''}
                                        onClick={() => setViewMode('grid')}
                                        title={t('gridView')}
                                    >
                                        <Grid size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div
                            className="plugin-content"
                            style={{ display: activeTab === 'installed' ? 'block' : 'none' }}
                        >
                            {plugins.length === 0 ? (
                                <div className="plugin-empty">
                                    <Package size={48} />
                                    <p>{t('noPlugins')}</p>
                                </div>
                            ) : (
                                <div className="plugin-categories">
                                    {Object.entries(pluginsByCategory).map(([category, categoryPlugins]) => {
                                        const cat = category as EditorPluginCategory;
                                        const isExpanded = expandedCategories.has(cat);

                                        return (
                                            <div key={category} className="plugin-category">
                                                <div
                                                    className="plugin-category-header"
                                                    onClick={() => toggleCategory(cat)}
                                                >
                                                    <button className="plugin-category-toggle">
                                                        {isExpanded ? (
                                                            <ChevronDown size={16} />
                                                        ) : (
                                                            <ChevronRight size={16} />
                                                        )}
                                                    </button>
                                                    <span className="plugin-category-icon">
                                                        {(() => {
                                                            const CategoryIcon = (LucideIcons as any)[
                                                                categoryIcons[cat]
                                                            ];
                                                            return CategoryIcon ? <CategoryIcon size={16} /> : null;
                                                        })()}
                                                    </span>
                                                    <span className="plugin-category-name">{getCategoryName(cat)}</span>
                                                    <span className="plugin-category-count">
                                                        {categoryPlugins.length}
                                                    </span>
                                                </div>

                                                {isExpanded && (
                                                    <div className={`plugin-category-content ${viewMode}`}>
                                                        {viewMode === 'grid'
                                                            ? categoryPlugins.map(renderPluginCard)
                                                            : categoryPlugins.map(renderPluginList)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'marketplace' && <PluginMarketPanel marketService={marketService} locale={locale} />}
            </div>
        </div>
    );
}
