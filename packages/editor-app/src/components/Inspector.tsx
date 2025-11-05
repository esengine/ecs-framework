import { useState, useEffect } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, InspectorRegistry, InspectorContext } from '@esengine/editor-core';
import { PropertyInspector } from './PropertyInspector';
import { FileSearch, ChevronDown, ChevronRight, X, Settings, File as FileIcon, Folder, Clock, HardDrive } from 'lucide-react';
import { TauriAPI } from '../api/tauri';
import { useToast } from './Toast';
import '../styles/EntityInspector.css';

interface InspectorProps {
    entityStore: EntityStoreService;
    messageHub: MessageHub;
    inspectorRegistry: InspectorRegistry;
    projectPath?: string | null;
}

interface AssetFileInfo {
    name: string;
    path: string;
    extension?: string;
    size?: number;
    modified?: number;
    isDirectory: boolean;
}

type InspectorTarget =
    | { type: 'entity'; data: Entity }
    | { type: 'remote-entity'; data: any; details?: any }
    | { type: 'asset-file'; data: AssetFileInfo; content?: string }
    | { type: 'extension'; data: unknown }
    | null;

export function Inspector({ entityStore: _entityStore, messageHub, inspectorRegistry, projectPath }: InspectorProps) {
    const [target, setTarget] = useState<InspectorTarget>(null);
    const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());
    const [componentVersion, setComponentVersion] = useState(0);
    const { showToast } = useToast();

    useEffect(() => {
        const handleEntitySelection = (data: { entity: Entity | null }) => {
            if (data.entity) {
                setTarget({ type: 'entity', data: data.entity });
            } else {
                setTarget(null);
            }
            setComponentVersion(0);
        };

        const handleRemoteEntitySelection = (data: { entity: any }) => {
            setTarget({ type: 'remote-entity', data: data.entity });
        };

        const handleEntityDetails = (event: Event) => {
            const customEvent = event as CustomEvent;
            const details = customEvent.detail;
            if (target?.type === 'remote-entity') {
                setTarget({ ...target, details });
            }
        };

        const handleExtensionSelection = (data: { data: unknown }) => {
            setTarget({ type: 'extension', data: data.data });
        };

        const handleAssetFileSelection = async (data: { fileInfo: AssetFileInfo }) => {
            const fileInfo = data.fileInfo;

            if (fileInfo.isDirectory) {
                setTarget({ type: 'asset-file', data: fileInfo });
                return;
            }

            const textExtensions = ['txt', 'json', 'md', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'log', 'btree', 'ecs'];
            const isTextFile = fileInfo.extension && textExtensions.includes(fileInfo.extension.toLowerCase());

            if (isTextFile) {
                try {
                    const content = await TauriAPI.readFileContent(fileInfo.path);
                    setTarget({ type: 'asset-file', data: fileInfo, content });
                } catch (error) {
                    console.error('Failed to read file content:', error);
                    setTarget({ type: 'asset-file', data: fileInfo });
                }
            } else {
                setTarget({ type: 'asset-file', data: fileInfo });
            }
        };

        const handleComponentChange = () => {
            setComponentVersion((prev) => prev + 1);
        };

        const unsubEntitySelect = messageHub.subscribe('entity:selected', handleEntitySelection);
        const unsubRemoteSelect = messageHub.subscribe('remote-entity:selected', handleRemoteEntitySelection);
        const unsubNodeSelect = messageHub.subscribe('behavior-tree:node-selected', handleExtensionSelection);
        const unsubAssetFileSelect = messageHub.subscribe('asset-file:selected', handleAssetFileSelection);
        const unsubComponentAdded = messageHub.subscribe('component:added', handleComponentChange);
        const unsubComponentRemoved = messageHub.subscribe('component:removed', handleComponentChange);

        window.addEventListener('profiler:entity-details', handleEntityDetails);

        return () => {
            unsubEntitySelect();
            unsubRemoteSelect();
            unsubNodeSelect();
            unsubAssetFileSelect();
            unsubComponentAdded();
            unsubComponentRemoved();
            window.removeEventListener('profiler:entity-details', handleEntityDetails);
        };
    }, [messageHub, target]);

    const handleRemoveComponent = (index: number) => {
        if (target?.type !== 'entity') return;
        const entity = target.data;
        const component = entity.components[index];
        if (component) {
            entity.removeComponent(component);
            messageHub.publish('component:removed', { entity, component });
        }
    };

    const toggleComponentExpanded = (index: number) => {
        setExpandedComponents((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handlePropertyChange = (component: any, propertyName: string, value: any) => {
        if (target?.type !== 'entity') return;
        const entity = target.data;
        messageHub.publish('component:property:changed', {
            entity,
            component,
            propertyName,
            value
        });
    };

    const renderRemoteProperty = (key: string, value: any) => {
        if (value === null || value === undefined) {
            return (
                <div key={key} className="property-field">
                    <label className="property-label">{key}</label>
                    <span className="property-value-text">null</span>
                </div>
            );
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            return (
                <div key={key} className="property-field">
                    <label className="property-label">{key}</label>
                    <div className="property-value-object">
                        {Object.entries(value).map(([subKey, subValue]) => (
                            <div key={subKey} className="property-subfield">
                                <span className="property-sublabel">{subKey}:</span>
                                <span className="property-value-text">{String(subValue)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div key={key} className="property-field">
                <label className="property-label">{key}</label>
                <span className="property-value-text">{String(value)}</span>
            </div>
        );
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatDate = (timestamp?: number): string => {
        if (!timestamp) return '未知';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderAssetFile = (fileInfo: AssetFileInfo, content?: string) => {
        const IconComponent = fileInfo.isDirectory ? Folder : FileIcon;
        const iconColor = fileInfo.isDirectory ? '#dcb67a' : '#90caf9';

        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <IconComponent size={16} style={{ color: iconColor }} />
                    <span className="entity-name">{fileInfo.name}</span>
                </div>

                <div className="inspector-content">
                    <div className="inspector-section">
                        <div className="section-title">文件信息</div>
                        <div className="property-field">
                            <label className="property-label">类型</label>
                            <span className="property-value-text">
                                {fileInfo.isDirectory ? '文件夹' : fileInfo.extension ? `.${fileInfo.extension}` : '文件'}
                            </span>
                        </div>
                        {fileInfo.size !== undefined && !fileInfo.isDirectory && (
                            <div className="property-field">
                                <label className="property-label"><HardDrive size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />大小</label>
                                <span className="property-value-text">{formatFileSize(fileInfo.size)}</span>
                            </div>
                        )}
                        {fileInfo.modified !== undefined && (
                            <div className="property-field">
                                <label className="property-label"><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />修改时间</label>
                                <span className="property-value-text">{formatDate(fileInfo.modified)}</span>
                            </div>
                        )}
                        <div className="property-field">
                            <label className="property-label">路径</label>
                            <span className="property-value-text" style={{
                                fontFamily: 'Consolas, Monaco, monospace',
                                fontSize: '11px',
                                color: '#666',
                                wordBreak: 'break-all'
                            }}>
                                {fileInfo.path}
                            </span>
                        </div>
                    </div>

                    {content && (
                        <div className="inspector-section">
                            <div className="section-title">文件预览</div>
                            <div className="file-preview-content">
                                {content}
                            </div>
                        </div>
                    )}

                    {!content && !fileInfo.isDirectory && (
                        <div className="inspector-section">
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '13px'
                            }}>
                                此文件类型不支持预览
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!target) {
        return (
            <div className="entity-inspector">
                <div className="empty-inspector">
                    <FileSearch size={48} style={{ color: '#555', marginBottom: '16px' }} />
                    <div style={{ color: '#999', fontSize: '14px' }}>未选择对象</div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                        选择实体或节点以查看详细信息
                    </div>
                </div>
            </div>
        );
    }

    if (target.type === 'extension') {
        const context: InspectorContext = {
            target: target.data,
            projectPath,
            readonly: false
        };

        const extensionContent = inspectorRegistry.render(target.data, context);
        if (extensionContent) {
            return extensionContent;
        }

        return (
            <div className="entity-inspector">
                <div className="empty-inspector">
                    <FileSearch size={48} style={{ color: '#555', marginBottom: '16px' }} />
                    <div style={{ color: '#999', fontSize: '14px' }}>未找到合适的检视器</div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                        此对象类型未注册检视器扩展
                    </div>
                </div>
            </div>
        );
    }

    if (target.type === 'asset-file') {
        return renderAssetFile(target.data, target.content);
    }

    if (target.type === 'remote-entity') {
        const entity = target.data;
        const details = (target as any).details;

        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <Settings size={16} />
                    <span className="entity-name">运行时实体 #{entity.id}</span>
                </div>

                <div className="inspector-content">
                    <div className="inspector-section">
                        <div className="section-title">基本信息</div>
                        <div className="property-field">
                            <label className="property-label">Entity ID</label>
                            <span className="property-value-text">{entity.id}</span>
                        </div>
                        <div className="property-field">
                            <label className="property-label">Enabled</label>
                            <span className="property-value-text">{entity.enabled ? 'true' : 'false'}</span>
                        </div>
                        {entity.name && (
                            <div className="property-field">
                                <label className="property-label">Name</label>
                                <span className="property-value-text">{entity.name}</span>
                            </div>
                        )}
                    </div>

                    {details && (
                        <div className="inspector-section">
                            <div className="section-title">组件详情</div>
                            {Object.entries(details).map(([key, value]) => renderRemoteProperty(key, value))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (target.type === 'entity') {
        const entity = target.data;

        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <Settings size={16} />
                    <span className="entity-name">{entity.name || `Entity #${entity.id}`}</span>
                </div>

                <div className="inspector-content">
                    <div className="inspector-section">
                        <div className="section-title">基本信息</div>
                        <div className="property-field">
                            <label className="property-label">Entity ID</label>
                            <span className="property-value-text">{entity.id}</span>
                        </div>
                        <div className="property-field">
                            <label className="property-label">Enabled</label>
                            <span className="property-value-text">{entity.enabled ? 'true' : 'false'}</span>
                        </div>
                    </div>

                    {entity.components.length > 0 && (
                        <div className="inspector-section">
                            <div className="section-title">组件</div>
                            {entity.components.map((component: any, index: number) => {
                                const isExpanded = expandedComponents.has(index);
                                const componentName = component.constructor?.name || 'Component';

                                return (
                                    <div key={`${componentName}-${index}-${componentVersion}`} className="component-item">
                                        <div className="component-header" onClick={() => toggleComponentExpanded(index)}>
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            <span className="component-name">{componentName}</span>
                                            <button
                                                className="component-remove-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveComponent(index);
                                                }}
                                                title="移除组件"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="component-properties">
                                                <PropertyInspector
                                                    component={component}
                                                    onChange={(propName: string, value: any) => handlePropertyChange(component, propName, value)}
                                                />
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

    return null;
}
