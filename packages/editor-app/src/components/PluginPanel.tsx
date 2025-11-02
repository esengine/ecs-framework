import { useState, useEffect } from 'react';
import { EditorPluginManager, IEditorPluginMetadata, EditorPluginCategory } from '@esengine/editor-core';
import * as LucideIcons from 'lucide-react';
import { Package, CheckCircle, XCircle, Search, Grid, List, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/PluginPanel.css';

interface PluginPanelProps {
    pluginManager: EditorPluginManager;
}

const categoryIcons: Record<EditorPluginCategory, string> = {
    [EditorPluginCategory.Tool]: 'Wrench',
    [EditorPluginCategory.Window]: 'LayoutGrid',
    [EditorPluginCategory.Inspector]: 'Search',
    [EditorPluginCategory.System]: 'Settings',
    [EditorPluginCategory.ImportExport]: 'Package'
};

const categoryNames: Record<EditorPluginCategory, string> = {
    [EditorPluginCategory.Tool]: 'Tools',
    [EditorPluginCategory.Window]: 'Windows',
    [EditorPluginCategory.Inspector]: 'Inspectors',
    [EditorPluginCategory.System]: 'System',
    [EditorPluginCategory.ImportExport]: 'Import/Export'
};

export function PluginPanel({ pluginManager }: PluginPanelProps) {
    const [plugins, setPlugins] = useState<IEditorPluginMetadata[]>([]);
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [expandedCategories, setExpandedCategories] = useState<Set<EditorPluginCategory>>(
        new Set(Object.values(EditorPluginCategory))
    );

    useEffect(() => {
        const updatePlugins = () => {
            const allPlugins = pluginManager.getAllPluginMetadata();
            setPlugins(allPlugins);
        };

        updatePlugins();
    }, [pluginManager]);

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

    const pluginsByCategory = filteredPlugins.reduce((acc, plugin) => {
        if (!acc[plugin.category]) {
            acc[plugin.category] = [];
        }
        acc[plugin.category].push(plugin);
        return acc;
    }, {} as Record<EditorPluginCategory, IEditorPluginMetadata[]>);

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
                        title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                    >
                        {plugin.enabled ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </button>
                </div>
                {plugin.description && (
                    <div className="plugin-card-description">{plugin.description}</div>
                )}
                <div className="plugin-card-footer">
                    <span className="plugin-card-category">
                        {(() => {
                            const CategoryIcon = (LucideIcons as any)[categoryIcons[plugin.category]];
                            return CategoryIcon ? <CategoryIcon size={14} style={{ marginRight: '4px' }} /> : null;
                        })()}
                        {categoryNames[plugin.category]}
                    </span>
                    {plugin.installedAt && (
                        <span className="plugin-card-installed">
                        Installed: {new Date(plugin.installedAt).toLocaleDateString()}
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
                    {plugin.description && (
                        <div className="plugin-list-description">{plugin.description}</div>
                    )}
                </div>
                <div className="plugin-list-status">
                    {plugin.enabled ? (
                        <span className="status-badge enabled">Enabled</span>
                    ) : (
                        <span className="status-badge disabled">Disabled</span>
                    )}
                </div>
                <button
                    className="plugin-list-toggle"
                    onClick={() => togglePlugin(plugin.name, plugin.enabled)}
                    title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                >
                    {plugin.enabled ? 'Disable' : 'Enable'}
                </button>
            </div>
        );
    };

    return (
        <div className="plugin-panel">
            <div className="plugin-toolbar">
                <div className="plugin-toolbar-left">
                    <div className="plugin-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Search plugins..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
                <div className="plugin-toolbar-right">
                    <div className="plugin-stats">
                        <span className="stat-item enabled">
                            <CheckCircle size={14} />
                            {enabledCount} enabled
                        </span>
                        <span className="stat-item disabled">
                            <XCircle size={14} />
                            {disabledCount} disabled
                        </span>
                    </div>
                    <div className="plugin-view-mode">
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <List size={14} />
                        </button>
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            <Grid size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="plugin-content">
                {plugins.length === 0 ? (
                    <div className="plugin-empty">
                        <Package size={48} />
                        <p>No plugins installed</p>
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
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                        <span className="plugin-category-icon">
                                            {(() => {
                                                const CategoryIcon = (LucideIcons as any)[categoryIcons[cat]];
                                                return CategoryIcon ? <CategoryIcon size={16} /> : null;
                                            })()}
                                        </span>
                                        <span className="plugin-category-name">{categoryNames[cat]}</span>
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
        </div>
    );
}
