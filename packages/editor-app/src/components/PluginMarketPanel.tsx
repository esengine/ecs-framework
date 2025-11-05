import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    Package,
    Search,
    Download,
    CheckCircle,
    ExternalLink,
    Github,
    Star,
    AlertCircle,
    RefreshCw,
    Filter
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import type { PluginMarketService, PluginMarketMetadata } from '../services/PluginMarketService';
import '../styles/PluginMarketPanel.css';

interface PluginMarketPanelProps {
    marketService: PluginMarketService;
    locale: string;
}

export function PluginMarketPanel({ marketService, locale }: PluginMarketPanelProps) {
    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: '插件市场',
                searchPlaceholder: '搜索插件...',
                loading: '加载中...',
                loadError: '加载失败',
                retry: '重试',
                noPlugins: '没有找到插件',
                install: '安装',
                installed: '已安装',
                update: '更新',
                uninstall: '卸载',
                viewSource: '查看源码',
                official: '官方',
                verified: '认证',
                community: '社区',
                filterAll: '全部',
                filterOfficial: '官方插件',
                filterCommunity: '社区插件',
                categoryAll: '全部分类',
                installing: '安装中...',
                uninstalling: '卸载中...'
            },
            en: {
                title: 'Plugin Marketplace',
                searchPlaceholder: 'Search plugins...',
                loading: 'Loading...',
                loadError: 'Load failed',
                retry: 'Retry',
                noPlugins: 'No plugins found',
                install: 'Install',
                installed: 'Installed',
                update: 'Update',
                uninstall: 'Uninstall',
                viewSource: 'View Source',
                official: 'Official',
                verified: 'Verified',
                community: 'Community',
                filterAll: 'All',
                filterOfficial: 'Official',
                filterCommunity: 'Community',
                categoryAll: 'All Categories',
                installing: 'Installing...',
                uninstalling: 'Uninstalling...'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const [plugins, setPlugins] = useState<PluginMarketMetadata[]>([]);
    const [filteredPlugins, setFilteredPlugins] = useState<PluginMarketMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'official' | 'community'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [installingPlugins, setInstallingPlugins] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadPlugins();
    }, []);

    useEffect(() => {
        filterPlugins();
    }, [plugins, searchQuery, typeFilter, categoryFilter]);

    const loadPlugins = async () => {
        setLoading(true);
        setError(null);

        try {
            const pluginList = await marketService.fetchPluginList();
            setPlugins(pluginList);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const filterPlugins = () => {
        let filtered = plugins;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query) ||
                    p.tags?.some((tag) => tag.toLowerCase().includes(query))
            );
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter((p) => p.category_type === typeFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter((p) => p.category === categoryFilter);
        }

        setFilteredPlugins(filtered);
    };

    const handleInstall = async (plugin: PluginMarketMetadata) => {
        setInstallingPlugins((prev) => new Set(prev).add(plugin.id));

        try {
            await marketService.installPlugin(plugin);
            setPlugins([...plugins]);
        } catch (error) {
            console.error('Failed to install plugin:', error);
            alert(`Failed to install ${plugin.name}: ${error}`);
        } finally {
            setInstallingPlugins((prev) => {
                const next = new Set(prev);
                next.delete(plugin.id);
                return next;
            });
        }
    };

    const handleUninstall = async (plugin: PluginMarketMetadata) => {
        if (!confirm(`Are you sure you want to uninstall ${plugin.name}?`)) {
            return;
        }

        setInstallingPlugins((prev) => new Set(prev).add(plugin.id));

        try {
            await marketService.uninstallPlugin(plugin.id);
            setPlugins([...plugins]);
        } catch (error) {
            console.error('Failed to uninstall plugin:', error);
            alert(`Failed to uninstall ${plugin.name}: ${error}`);
        } finally {
            setInstallingPlugins((prev) => {
                const next = new Set(prev);
                next.delete(plugin.id);
                return next;
            });
        }
    };

    const categories = ['all', ...Array.from(new Set(plugins.map((p) => p.category)))];

    if (loading) {
        return (
            <div className="plugin-market-loading">
                <RefreshCw size={32} className="spinning" />
                <p>{t('loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="plugin-market-error">
                <AlertCircle size={48} />
                <p>{t('loadError')}: {error}</p>
                <button onClick={loadPlugins}>{t('retry')}</button>
            </div>
        );
    }

    return (
        <div className="plugin-market-panel">
            <div className="plugin-market-toolbar">
                <div className="plugin-market-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="plugin-market-filters">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="plugin-market-filter-select"
                    >
                        <option value="all">{t('filterAll')}</option>
                        <option value="official">{t('filterOfficial')}</option>
                        <option value="community">{t('filterCommunity')}</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="plugin-market-filter-select"
                    >
                        <option value="all">{t('categoryAll')}</option>
                        {categories
                            .filter((c) => c !== 'all')
                            .map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                    </select>

                    <button className="plugin-market-refresh" onClick={loadPlugins} title={t('retry')}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <div className="plugin-market-content">
                {filteredPlugins.length === 0 ? (
                    <div className="plugin-market-empty">
                        <Package size={48} />
                        <p>{t('noPlugins')}</p>
                    </div>
                ) : (
                    <div className="plugin-market-grid">
                        {filteredPlugins.map((plugin) => (
                            <PluginMarketCard
                                key={plugin.id}
                                plugin={plugin}
                                isInstalled={marketService.isInstalled(plugin.id)}
                                hasUpdate={marketService.hasUpdate(plugin)}
                                isInstalling={installingPlugins.has(plugin.id)}
                                onInstall={() => handleInstall(plugin)}
                                onUninstall={() => handleUninstall(plugin)}
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface PluginMarketCardProps {
    plugin: PluginMarketMetadata;
    isInstalled: boolean;
    hasUpdate: boolean;
    isInstalling: boolean;
    onInstall: () => void;
    onUninstall: () => void;
    t: (key: string) => string;
}

function PluginMarketCard({
    plugin,
    isInstalled,
    hasUpdate,
    isInstalling,
    onInstall,
    onUninstall,
    t
}: PluginMarketCardProps) {
    const IconComponent = plugin.icon ? (LucideIcons as any)[plugin.icon] : Package;

    return (
        <div className="plugin-market-card">
            <div className="plugin-market-card-header">
                <div className="plugin-market-card-icon">
                    <IconComponent size={32} />
                </div>
                <div className="plugin-market-card-info">
                    <div className="plugin-market-card-title">
                        <span>{plugin.name}</span>
                        {plugin.verified && (
                            <span className="plugin-market-badge official" title={t('official')}>
                                <CheckCircle size={14} />
                            </span>
                        )}
                    </div>
                    <div className="plugin-market-card-meta">
                        <span className="plugin-market-card-author">
                            <Github size={12} />
                            {plugin.author.name}
                        </span>
                        <span className="plugin-market-card-version">v{plugin.version}</span>
                    </div>
                </div>
            </div>

            <div className="plugin-market-card-description">{plugin.description}</div>

            {plugin.tags && plugin.tags.length > 0 && (
                <div className="plugin-market-card-tags">
                    {plugin.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="plugin-market-tag">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="plugin-market-card-footer">
                <button
                    className="plugin-market-card-link"
                    onClick={async (e) => {
                        e.stopPropagation();
                        try {
                            await open(plugin.repository.url);
                        } catch (error) {
                            console.error('Failed to open URL:', error);
                        }
                    }}
                >
                    <ExternalLink size={14} />
                    {t('viewSource')}
                </button>

                <div className="plugin-market-card-actions">
                    {isInstalling ? (
                        <button className="plugin-market-btn installing" disabled>
                            <RefreshCw size={14} className="spinning" />
                            {isInstalled ? t('uninstalling') : t('installing')}
                        </button>
                    ) : isInstalled ? (
                        <>
                            {hasUpdate && (
                                <button className="plugin-market-btn update" onClick={onInstall}>
                                    <Download size={14} />
                                    {t('update')}
                                </button>
                            )}
                            <button className="plugin-market-btn installed" onClick={onUninstall}>
                                <CheckCircle size={14} />
                                {t('uninstall')}
                            </button>
                        </>
                    ) : (
                        <button className="plugin-market-btn install" onClick={onInstall}>
                            <Download size={14} />
                            {t('install')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
