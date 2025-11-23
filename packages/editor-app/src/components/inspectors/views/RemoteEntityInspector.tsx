import {
    Settings,
    RefreshCw,
    Activity,
    Tag,
    Layers,
    ArrowUpDown,
    GitBranch
} from 'lucide-react';
import { RemoteEntity, EntityDetails } from '../types';
import { getProfilerService } from '../utils';
import { PropertyRendererRegistry, PropertyContext } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import '../../../styles/EntityInspector.css';

interface RemoteEntityInspectorProps {
    entity: RemoteEntity;
    details?: EntityDetails;
    autoRefresh: boolean;
    onAutoRefreshChange: (value: boolean) => void;
    decimalPlaces: number;
}

export function RemoteEntityInspector({
    entity,
    details,
    autoRefresh,
    onAutoRefreshChange,
    decimalPlaces
}: RemoteEntityInspectorProps) {
    const handleManualRefresh = () => {
        const profilerService = getProfilerService();
        if (profilerService && entity?.id !== undefined) {
            profilerService.requestEntityDetails(entity.id);
        }
    };

    const renderRemoteProperty = (key: string, value: any) => {
        const registry = Core.services.resolve(PropertyRendererRegistry);
        const context: PropertyContext = {
            name: key,
            decimalPlaces,
            readonly: true,
            depth: 0
        };

        const rendered = registry.render(value, context);
        if (rendered) {
            return <div key={key}>{rendered}</div>;
        }

        return null;
    };

    return (
        <div className="entity-inspector">
            <div className="inspector-header">
                <Settings size={16} />
                <span className="entity-name">运行时实体 #{entity.id}</span>
                {entity.destroyed && (
                    <span
                        style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600
                        }}
                    >
                        已销毁
                    </span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={handleManualRefresh}
                        title="刷新"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#4ade80')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
                    >
                        <RefreshCw size={14} className={autoRefresh ? 'spin-slow' : ''} />
                    </button>
                    <button
                        onClick={() => onAutoRefreshChange(!autoRefresh)}
                        title={autoRefresh ? '关闭自动刷新' : '开启自动刷新'}
                        style={{
                            background: autoRefresh ? '#2d4a3e' : 'transparent',
                            border: 'none',
                            color: autoRefresh ? '#4ade80' : '#888',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 500
                        }}
                    >
                        {autoRefresh ? '自动' : '手动'}
                    </button>
                </div>
            </div>

            <div className="inspector-content">
                <div className="inspector-section">
                    <div className="section-title">基本信息</div>
                    <div className="property-field">
                        <label className="property-label">Entity ID</label>
                        <span className="property-value-text">{entity.id}</span>
                    </div>
                    {entity.name && (
                        <div className="property-field">
                            <label className="property-label">Name</label>
                            <span className="property-value-text">{entity.name}</span>
                        </div>
                    )}
                    <div className="property-field">
                        <label className="property-label">
                            <Activity size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            Enabled
                        </label>
                        <span
                            className="property-value-text"
                            style={{
                                color: entity.enabled ? '#4ade80' : '#f87171'
                            }}
                        >
                            {entity.enabled ? 'true' : 'false'}
                        </span>
                    </div>
                    {entity.tag !== undefined && entity.tag !== 0 && (
                        <div className="property-field">
                            <label className="property-label">
                                <Tag size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Tag
                            </label>
                            <span
                                className="property-value-text"
                                style={{
                                    fontFamily: 'monospace',
                                    color: '#fbbf24'
                                }}
                            >
                                {entity.tag}
                            </span>
                        </div>
                    )}
                </div>

                {(entity.depth !== undefined ||
                    entity.updateOrder !== undefined ||
                    entity.parentId !== undefined ||
                    entity.childCount !== undefined) && (
                    <div className="inspector-section">
                        <div className="section-title">层级信息</div>
                        {entity.depth !== undefined && (
                            <div className="property-field">
                                <label className="property-label">
                                    <Layers size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    深度
                                </label>
                                <span className="property-value-text">{entity.depth}</span>
                            </div>
                        )}
                        {entity.updateOrder !== undefined && (
                            <div className="property-field">
                                <label className="property-label">
                                    <ArrowUpDown size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    更新顺序
                                </label>
                                <span className="property-value-text">{entity.updateOrder}</span>
                            </div>
                        )}
                        {entity.parentId !== undefined && (
                            <div className="property-field">
                                <label className="property-label">
                                    <GitBranch size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    父实体 ID
                                </label>
                                <span
                                    className="property-value-text"
                                    style={{
                                        color: entity.parentId === null ? '#666' : '#90caf9'
                                    }}
                                >
                                    {entity.parentId === null ? '无' : entity.parentId}
                                </span>
                            </div>
                        )}
                        {entity.childCount !== undefined && (
                            <div className="property-field">
                                <label className="property-label">子实体数量</label>
                                <span className="property-value-text">{entity.childCount}</span>
                            </div>
                        )}
                        {entity.activeInHierarchy !== undefined && (
                            <div className="property-field">
                                <label className="property-label">层级中激活</label>
                                <span
                                    className="property-value-text"
                                    style={{
                                        color: entity.activeInHierarchy ? '#4ade80' : '#f87171'
                                    }}
                                >
                                    {entity.activeInHierarchy ? 'true' : 'false'}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {entity.componentMask !== undefined && (
                    <div className="inspector-section">
                        <div className="section-title">调试信息</div>
                        <div className="property-field">
                            <label className="property-label">Component Mask</label>
                            <span
                                className="property-value-text"
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    color: '#a78bfa',
                                    wordBreak: 'break-all'
                                }}
                            >
                                {entity.componentMask}
                            </span>
                        </div>
                    </div>
                )}

                {details &&
                    details.components &&
                    Array.isArray(details.components) &&
                    details.components.length > 0 && (
                    <div className="inspector-section">
                        <div className="section-title">组件 ({details.components.length})</div>
                        {details.components.map((comp, index) => {
                            const registry = Core.services.resolve(PropertyRendererRegistry);
                            const context: PropertyContext = {
                                name: comp.typeName || `Component ${index}`,
                                decimalPlaces,
                                readonly: true,
                                expandByDefault: true,
                                depth: 0
                            };
                            const rendered = registry.render(comp, context);
                            return rendered ? <div key={index}>{rendered}</div> : null;
                        })}
                    </div>
                )}

                {details &&
                    Object.entries(details).filter(([key]) => key !== 'components' && key !== 'componentTypes')
                        .length > 0 && (
                    <div className="inspector-section">
                        <div className="section-title">其他信息</div>
                        {Object.entries(details)
                            .filter(([key]) => key !== 'components' && key !== 'componentTypes')
                            .map(([key, value]) => renderRemoteProperty(key, value))}
                    </div>
                )}
            </div>
        </div>
    );
}
