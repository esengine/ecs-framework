import { useState, useEffect, useRef } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, InspectorRegistry, InspectorContext } from '@esengine/editor-core';
import { PropertyInspector } from './PropertyInspector';
import { FileSearch, ChevronDown, ChevronRight, X, Settings, File as FileIcon, Folder, Clock, HardDrive, Tag, Layers, ArrowUpDown, GitBranch, Activity, AlertTriangle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { TauriAPI } from '../api/tauri';
import { useToast } from './Toast';
import { SettingsService } from '../services/SettingsService';
import { convertFileSrc } from '@tauri-apps/api/core';
import '../styles/EntityInspector.css';

interface InspectorProps {
    entityStore: EntityStoreService;
    messageHub: MessageHub;
    inspectorRegistry: InspectorRegistry;
    projectPath?: string | null;
}

function getProfilerService(): any {
    return (window as any).__PROFILER_SERVICE__;
}

function formatNumber(value: number, decimalPlaces: number): string {
    if (decimalPlaces < 0) {
        return String(value);
    }
    if (Number.isInteger(value)) {
        return String(value);
    }
    return value.toFixed(decimalPlaces);
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
    | { type: 'asset-file'; data: AssetFileInfo; content?: string; isImage?: boolean }
    | { type: 'extension'; data: unknown }
    | null;

export function Inspector({ entityStore: _entityStore, messageHub, inspectorRegistry, projectPath }: InspectorProps) {
    const [target, setTarget] = useState<InspectorTarget>(null);
    const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());
    const [componentVersion, setComponentVersion] = useState(0);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [decimalPlaces, setDecimalPlaces] = useState(() => {
        const settings = SettingsService.getInstance();
        return settings.get<number>('inspector.decimalPlaces', 4);
    });
    const { showToast } = useToast();
    const targetRef = useRef<InspectorTarget>(null);

    useEffect(() => {
        targetRef.current = target;
    }, [target]);

    useEffect(() => {
        const handleSettingsChanged = (event: Event) => {
            const customEvent = event as CustomEvent;
            const changedSettings = customEvent.detail;
            if ('inspector.decimalPlaces' in changedSettings) {
                setDecimalPlaces(changedSettings['inspector.decimalPlaces']);
            }
        };

        window.addEventListener('settings:changed', handleSettingsChanged);
        return () => {
            window.removeEventListener('settings:changed', handleSettingsChanged);
        };
    }, []);

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
            const profilerService = getProfilerService();
            if (profilerService && data.entity?.id !== undefined) {
                profilerService.requestEntityDetails(data.entity.id);
            }
        };

        const handleEntityDetails = (event: Event) => {
            const customEvent = event as CustomEvent;
            const details = customEvent.detail;
            const currentTarget = targetRef.current;
            if (currentTarget?.type === 'remote-entity' && details?.id === currentTarget.data.id) {
                setTarget({ ...currentTarget, details });
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
            const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
            const isTextFile = fileInfo.extension && textExtensions.includes(fileInfo.extension.toLowerCase());
            const isImageFile = fileInfo.extension && imageExtensions.includes(fileInfo.extension.toLowerCase());

            if (isTextFile) {
                try {
                    const content = await TauriAPI.readFileContent(fileInfo.path);
                    setTarget({ type: 'asset-file', data: fileInfo, content });
                } catch (error) {
                    console.error('Failed to read file content:', error);
                    setTarget({ type: 'asset-file', data: fileInfo });
                }
            } else if (isImageFile) {
                setTarget({ type: 'asset-file', data: fileInfo, isImage: true });
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
    }, [messageHub]);

    useEffect(() => {
        if (!autoRefresh || target?.type !== 'remote-entity') {
            return;
        }

        const profilerService = getProfilerService();
        if (!profilerService) {
            return;
        }

        const handleProfilerData = () => {
            const currentTarget = targetRef.current;
            if (currentTarget?.type === 'remote-entity' && currentTarget.data?.id !== undefined) {
                profilerService.requestEntityDetails(currentTarget.data.id);
            }
        };

        const unsubscribe = profilerService.subscribe(handleProfilerData);

        return () => {
            unsubscribe();
        };
    }, [autoRefresh, target?.type]);

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

        if (Array.isArray(value)) {
            const getItemDisplay = (item: any): string => {
                if (typeof item !== 'object' || item === null) {
                    return String(item);
                }
                if (item.typeName) return String(item.typeName);
                const constructorName = item.constructor?.name;
                if (constructorName && constructorName !== 'Object') {
                    return constructorName;
                }
                if (item.type) return String(item.type);
                if (item.name) return String(item.name);
                if (item.className) return String(item.className);
                if (item._type) return String(item._type);
                const keys = Object.keys(item);
                if (keys.length <= 3) {
                    return `{${keys.join(', ')}}`;
                }
                return `{${keys.slice(0, 3).join(', ')}...}`;
            };

            // 检查是否是组件数组（有typeName和properties）
            const isComponentArray = value.length > 0 && value[0]?.typeName && value[0]?.properties;

            if (isComponentArray) {
                return (
                    <div key={key}>
                        {value.map((item, index) => (
                            <ComponentItem key={index} component={item} decimalPlaces={decimalPlaces} />
                        ))}
                    </div>
                );
            }

            // 检查是否是字符串数组（如componentTypes）
            const isStringArray = value.length > 0 && value.every((item: any) => typeof item === 'string');

            if (isStringArray) {
                return (
                    <div key={key} className="property-field">
                        <label className="property-label">{key}</label>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginTop: '4px'
                        }}>
                            {value.map((item: string, index: number) => (
                                <span
                                    key={index}
                                    style={{
                                        padding: '2px 8px',
                                        backgroundColor: '#2d4a3e',
                                        color: '#8fbc8f',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            }

            return (
                <div key={key} className="property-field">
                    <label className="property-label">{key} ({value.length})</label>
                    <div className="property-value-object">
                        {value.length === 0 ? (
                            <span className="property-value-text" style={{ color: '#666' }}>Empty</span>
                        ) : (
                            value.map((item, index) => (
                                <div key={index} className="property-subfield">
                                    <span className="property-sublabel">[{index}]:</span>
                                    <span className="property-value-text">
                                        {getItemDisplay(item)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
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
                                <span className="property-value-text">
                                    {typeof subValue === 'object' && subValue !== null
                                        ? Array.isArray(subValue)
                                            ? `Array(${subValue.length})`
                                            : subValue.constructor?.name || JSON.stringify(subValue)
                                        : String(subValue)}
                                </span>
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

    const renderAssetFile = (fileInfo: AssetFileInfo, content?: string, isImage?: boolean) => {
        const IconComponent = fileInfo.isDirectory ? Folder : isImage ? ImageIcon : FileIcon;
        const iconColor = fileInfo.isDirectory ? '#dcb67a' : isImage ? '#a78bfa' : '#90caf9';

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

                    {isImage && (
                        <div className="inspector-section">
                            <div className="section-title">图片预览</div>
                            <ImagePreview src={convertFileSrc(fileInfo.path)} alt={fileInfo.name} />
                        </div>
                    )}

                    {content && (
                        <div className="inspector-section">
                            <div className="section-title">文件预览</div>
                            <div className="file-preview-content">
                                {content}
                            </div>
                        </div>
                    )}

                    {!content && !isImage && !fileInfo.isDirectory && (
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
        return renderAssetFile(target.data, target.content, target.isImage);
    }

    if (target.type === 'remote-entity') {
        const entity = target.data;
        const details = (target as any).details;

        const handleManualRefresh = () => {
            const profilerService = getProfilerService();
            if (profilerService && entity?.id !== undefined) {
                profilerService.requestEntityDetails(entity.id);
            }
        };

        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <Settings size={16} />
                    <span className="entity-name">运行时实体 #{entity.id}</span>
                    {entity.destroyed && (
                        <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600
                        }}>已销毁</span>
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
                            onMouseEnter={(e) => e.currentTarget.style.color = '#4ade80'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                        >
                            <RefreshCw size={14} className={autoRefresh ? 'spin-slow' : ''} />
                        </button>
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
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
                            <span className="property-value-text" style={{
                                color: entity.enabled ? '#4ade80' : '#f87171'
                            }}>
                                {entity.enabled ? 'true' : 'false'}
                            </span>
                        </div>
                        {entity.tag !== undefined && entity.tag !== 0 && (
                            <div className="property-field">
                                <label className="property-label">
                                    <Tag size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    Tag
                                </label>
                                <span className="property-value-text" style={{
                                    fontFamily: 'monospace',
                                    color: '#fbbf24'
                                }}>
                                    {entity.tag}
                                </span>
                            </div>
                        )}
                    </div>

                    {(entity.depth !== undefined || entity.updateOrder !== undefined || entity.parentId !== undefined || entity.childCount !== undefined) && (
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
                                    <span className="property-value-text" style={{
                                        color: entity.parentId === null ? '#666' : '#90caf9'
                                    }}>
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
                                    <span className="property-value-text" style={{
                                        color: entity.activeInHierarchy ? '#4ade80' : '#f87171'
                                    }}>
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
                                <span className="property-value-text" style={{
                                    fontFamily: 'monospace',
                                    fontSize: '10px',
                                    color: '#a78bfa',
                                    wordBreak: 'break-all'
                                }}>
                                    {entity.componentMask}
                                </span>
                            </div>
                        </div>
                    )}

                    {details && details.components && Array.isArray(details.components) && details.components.length > 0 && (
                        <div className="inspector-section">
                            <div className="section-title">组件 ({details.components.length})</div>
                            {details.components.map((comp: any, index: number) => (
                                <ComponentItem key={index} component={comp} decimalPlaces={decimalPlaces} />
                            ))}
                        </div>
                    )}

                    {details && Object.entries(details).filter(([key]) => key !== 'components' && key !== 'componentTypes').length > 0 && (
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
                                    <div
                                        key={`${componentName}-${index}-${componentVersion}`}
                                        style={{
                                            marginBottom: '2px',
                                            backgroundColor: '#2a2a2a',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div
                                            onClick={() => toggleComponentExpanded(index)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '6px 8px',
                                                backgroundColor: '#3a3a3a',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                borderBottom: isExpanded ? '1px solid #4a4a4a' : 'none'
                                            }}
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            <span style={{
                                                marginLeft: '6px',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                color: '#e0e0e0',
                                                flex: 1
                                            }}>
                                                {componentName}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveComponent(index);
                                                }}
                                                title="移除组件"
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
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '6px 8px' }}>
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

interface ComponentItemProps {
    component: {
        typeName: string;
        properties: Record<string, any>;
    };
    decimalPlaces?: number;
}

function ComponentItem({ component, decimalPlaces = 4 }: ComponentItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{
            marginBottom: '2px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            overflow: 'hidden'
        }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    backgroundColor: '#3a3a3a',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isExpanded ? '1px solid #4a4a4a' : 'none'
                }}
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span style={{
                    marginLeft: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#e0e0e0'
                }}>
                    {component.typeName}
                </span>
            </div>

            {isExpanded && (
                <div style={{ padding: '6px 8px' }}>
                    {Object.entries(component.properties).map(([propName, propValue]) => (
                        <PropertyValueRenderer key={propName} name={propName} value={propValue} depth={0} decimalPlaces={decimalPlaces} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface PropertyValueRendererProps {
    name: string;
    value: any;
    depth: number;
    decimalPlaces?: number;
}

function PropertyValueRenderer({ name, value, depth, decimalPlaces = 4 }: PropertyValueRendererProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const isExpandable = value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
    const isArray = Array.isArray(value);

    const renderSimpleValue = (val: any): string => {
        if (val === null || val === undefined) return 'null';
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'number') return formatNumber(val, decimalPlaces);
        if (typeof val === 'string') return val.length > 50 ? val.substring(0, 50) + '...' : val;
        if (Array.isArray(val)) return `Array(${val.length})`;
        if (typeof val === 'object') {
            const keys = Object.keys(val);
            if (keys.length === 0) return '{}';
            if (keys.length <= 2) {
                const preview = keys.map((k) => `${k}: ${typeof val[k] === 'object' ? '...' : (typeof val[k] === 'number' ? formatNumber(val[k], decimalPlaces) : val[k])}`).join(', ');
                return `{${preview}}`;
            }
            return `{${keys.slice(0, 2).join(', ')}...}`;
        }
        return String(val);
    };

    if (isExpandable) {
        return (
            <div style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 0',
                        fontSize: '11px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span style={{ color: '#9cdcfe', marginLeft: '4px' }}>{name}</span>
                    {!isExpanded && (
                        <span style={{
                            color: '#666',
                            fontFamily: 'monospace',
                            marginLeft: '8px',
                            fontSize: '10px'
                        }}>
                            {renderSimpleValue(value)}
                        </span>
                    )}
                </div>
                {isExpanded && (
                    <div style={{ marginLeft: '8px', borderLeft: '1px solid #444', paddingLeft: '8px' }}>
                        {Object.entries(value).map(([key, val]) => (
                            <PropertyValueRenderer key={key} name={key} value={val} depth={depth + 1} decimalPlaces={decimalPlaces} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (isArray && value.length > 0) {
        return (
            <div style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 0',
                        fontSize: '11px',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span style={{ color: '#9cdcfe', marginLeft: '4px' }}>{name}</span>
                    <span style={{
                        color: '#666',
                        fontFamily: 'monospace',
                        marginLeft: '8px',
                        fontSize: '10px'
                    }}>
                        Array({value.length})
                    </span>
                </div>
                {isExpanded && (
                    <div style={{ marginLeft: '8px', borderLeft: '1px solid #444', paddingLeft: '8px' }}>
                        {value.map((item: any, index: number) => (
                            <PropertyValueRenderer key={index} name={`[${index}]`} value={item} depth={depth + 1} decimalPlaces={decimalPlaces} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '3px 0',
                fontSize: '11px',
                borderBottom: '1px solid #333',
                marginLeft: depth > 0 ? '12px' : 0
            }}
        >
            <span style={{ color: '#9cdcfe' }}>{name}</span>
            <span style={{
                color: typeof value === 'boolean' ? (value ? '#4ade80' : '#f87171') :
                    typeof value === 'number' ? '#b5cea8' : '#ce9178',
                fontFamily: 'monospace',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {renderSimpleValue(value)}
            </span>
        </div>
    );
}

interface ImagePreviewProps {
    src: string;
    alt: string;
}

function ImagePreview({ src, alt }: ImagePreviewProps) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageError, setImageError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 10));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    if (imageError) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#f87171',
                fontSize: '12px'
            }}>
                图片加载失败
            </div>
        );
    }

    return (
        <div>
            <div
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    minHeight: '200px',
                    maxHeight: '400px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    backgroundImage: `
                        linear-gradient(45deg, #404040 25%, transparent 25%),
                        linear-gradient(-45deg, #404040 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #404040 75%),
                        linear-gradient(-45deg, transparent 75%, #404040 75%)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#2a2a2a'
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        userSelect: 'none'
                    }}
                    onError={() => setImageError(true)}
                />
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px',
                fontSize: '10px',
                color: '#888'
            }}>
                <span>缩放: {(scale * 100).toFixed(0)}%</span>
                <button
                    onClick={handleReset}
                    style={{
                        background: '#3a3a3a',
                        border: 'none',
                        color: '#ccc',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px'
                    }}
                >
                    重置
                </button>
            </div>
        </div>
    );
}
