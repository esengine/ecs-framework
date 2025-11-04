import { useState, useEffect, useMemo } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { PropertyInspector } from './PropertyInspector';
import { BehaviorTreeNodeProperties } from './BehaviorTreeNodeProperties';
import { FileSearch, ChevronDown, ChevronRight, X, Settings, Box, AlertTriangle, Copy, File as FileIcon, Folder, Clock, HardDrive } from 'lucide-react';
import { BehaviorTreeNode, useBehaviorTreeStore } from '../stores/behaviorTreeStore';
import { ICON_MAP } from '../presentation/config/editorConstants';
import { useNodeOperations } from '../presentation/hooks/useNodeOperations';
import { useCommandHistory } from '../presentation/hooks/useCommandHistory';
import { NodeFactory } from '../infrastructure/factories/NodeFactory';
import { BehaviorTreeValidator } from '../infrastructure/validation/BehaviorTreeValidator';
import { TauriAPI } from '../api/tauri';
import '../styles/EntityInspector.css';

interface InspectorProps {
    entityStore: EntityStoreService;
    messageHub: MessageHub;
    projectPath?: string | null;
    isExecuting?: boolean;
    executionMode?: 'idle' | 'running' | 'paused' | 'step';
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
    | { type: 'behavior-tree-node'; data: BehaviorTreeNode }
    | { type: 'asset-file'; data: AssetFileInfo; content?: string }
    | null;

export function Inspector({ entityStore: _entityStore, messageHub, projectPath, isExecuting, executionMode }: InspectorProps) {
    const [target, setTarget] = useState<InspectorTarget>(null);
    const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());
    const [componentVersion, setComponentVersion] = useState(0);

    // 行为树节点操作相关
    const nodeFactory = useMemo(() => new NodeFactory(), []);
    const validator = useMemo(() => new BehaviorTreeValidator(), []);
    const { commandManager } = useCommandHistory();
    const nodeOperations = useNodeOperations(nodeFactory, validator, commandManager);
    const { nodes, connections, isExecuting: storeIsExecuting } = useBehaviorTreeStore();

    // 优先使用传入的 isExecuting，否则使用 store 中的
    const isRunning = isExecuting ?? storeIsExecuting;

    // 当节点数据更新时，同步更新 target 中的节点
    useEffect(() => {
        if (target?.type === 'behavior-tree-node') {
            const updatedNode = nodes.find(n => n.id === target.data.id);
            if (updatedNode) {
                const currentDataStr = JSON.stringify(target.data.data);
                const updatedDataStr = JSON.stringify(updatedNode.data);
                if (currentDataStr !== updatedDataStr) {
                    setTarget({ type: 'behavior-tree-node', data: updatedNode });
                }
            }
        }
    }, [nodes]);

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

        const handleBehaviorTreeNodeSelection = (data: { node: BehaviorTreeNode }) => {
            setTarget({ type: 'behavior-tree-node', data: data.node });
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
        const unsubNodeSelect = messageHub.subscribe('behavior-tree:node-selected', handleBehaviorTreeNodeSelection);
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

    const handleNodePropertyChange = (propertyName: string, value: any) => {
        if (target?.type !== 'behavior-tree-node') return;
        const node = target.data;

        nodeOperations.updateNodeData(node.id, {
            ...node.data,
            [propertyName]: value
        });
    };

    const handleCopyNodeInfo = () => {
        if (target?.type !== 'behavior-tree-node') return;
        const node = target.data;

        const childrenInfo = node.children.map((childId, index) => {
            const childNode = nodes.find(n => n.id === childId);
            return `  ${index + 1}. ${childNode?.template.displayName || '未知'} (ID: ${childId})`;
        }).join('\n');

        const incomingConnections = connections.filter(conn => conn.to === node.id);
        const outgoingConnections = connections.filter(conn => conn.from === node.id);

        const connectionInfo = [
            incomingConnections.length > 0 ? `输入连接: ${incomingConnections.length}个` : '',
            ...incomingConnections.map(conn => {
                const fromNode = nodes.find(n => n.id === conn.from);
                return `  来自: ${fromNode?.template.displayName || '未知'} (${conn.from})`;
            }),
            outgoingConnections.length > 0 ? `输出连接: ${outgoingConnections.length}个` : '',
            ...outgoingConnections.map(conn => {
                const toNode = nodes.find(n => n.id === conn.to);
                return `  到: ${toNode?.template.displayName || '未知'} (${conn.to})`;
            })
        ].filter(Boolean).join('\n');

        const nodeInfo = `
节点信息
========
名称: ${node.template.displayName}
类型: ${node.template.type}
分类: ${node.template.category}
类名: ${node.template.className || '无'}
节点ID: ${node.id}

子节点 (${node.children.length}个):
${childrenInfo || '  无'}

连接信息:
${connectionInfo || '  无连接'}

属性数据:
${JSON.stringify(node.data, null, 2)}
        `.trim();

        navigator.clipboard.writeText(nodeInfo).then(() => {
            messageHub.publish('notification:show', {
                type: 'success',
                message: '节点信息已复制到剪贴板'
            });
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = nodeInfo;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            messageHub.publish('notification:show', {
                type: 'success',
                message: '节点信息已复制到剪贴板'
            });
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

    const renderBehaviorTreeNode = (node: BehaviorTreeNode) => {
        const IconComponent = node.template.icon ? (ICON_MAP as any)[node.template.icon] : Box;

        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    {IconComponent && <IconComponent size={16} style={{ color: node.template.color || '#999' }} />}
                    <span className="entity-name">{node.template.displayName || '未命名节点'}</span>
                    <button
                        onClick={handleCopyNodeInfo}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#999',
                            fontSize: '12px'
                        }}
                        title="复制节点信息"
                    >
                        <Copy size={14} />
                        <span>复制信息</span>
                    </button>
                </div>

                {isRunning && (
                    <div style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderLeft: '3px solid #ff9800',
                        margin: '12px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '12px',
                        color: '#ff9800',
                        lineHeight: '1.4'
                    }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                        <span>运行时模式：属性修改将在停止后还原</span>
                    </div>
                )}

                <div className="inspector-content">
                    <div className="inspector-section">
                        <div className="section-title">基本信息</div>
                        <div className="property-field">
                            <label className="property-label">节点类型</label>
                            <span className="property-value-text">{node.template.type}</span>
                        </div>
                        <div className="property-field">
                            <label className="property-label">分类</label>
                            <span className="property-value-text">{node.template.category}</span>
                        </div>
                        {node.template.description && (
                            <div className="property-field">
                                <label className="property-label">描述</label>
                                <span className="property-value-text" style={{ color: '#999' }}>{node.template.description}</span>
                            </div>
                        )}
                        {node.template.className && (
                            <div className="property-field">
                                <label className="property-label">类名</label>
                                <span className="property-value-text" style={{ fontFamily: 'Consolas, Monaco, monospace', color: '#0e639c' }}>
                                    {node.template.className}
                                </span>
                            </div>
                        )}
                    </div>

                    {node.template.properties && node.template.properties.length > 0 && (
                        <div className="inspector-section">
                            <div className="section-title">属性</div>
                            <BehaviorTreeNodeProperties
                                key={node.id}
                                selectedNode={node}
                                onPropertyChange={handleNodePropertyChange}
                                projectPath={projectPath}
                            />
                        </div>
                    )}

                    {node.children.length > 0 && (
                        <div className="inspector-section">
                            <div className="section-title">子节点 ({node.children.length})</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {node.children.map((childId, index) => {
                                    const childNode = nodes.find(n => n.id === childId);
                                    const ChildIcon = childNode?.template.icon ? (ICON_MAP as any)[childNode.template.icon] : Box;
                                    return (
                                        <div
                                            key={childId}
                                            className="child-node-item"
                                            style={{
                                                borderLeft: `3px solid ${childNode?.template.color || '#666'}`
                                            }}
                                        >
                                            <span className="child-node-index">{index + 1}.</span>
                                            {childNode && ChildIcon && (
                                                <ChildIcon size={14} style={{ color: childNode.template.color || '#999', flexShrink: 0 }} />
                                            )}
                                            <span className="child-node-name">
                                                {childNode?.template.displayName || childId}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="inspector-section">
                        <div className="section-title">调试信息</div>
                        <div className="property-field">
                            <label className="property-label">节点ID</label>
                            <span className="property-value-text" style={{ fontFamily: 'Consolas, Monaco, monospace', color: '#666', fontSize: '11px' }}>
                                {node.id}
                            </span>
                        </div>
                        <div className="property-field">
                            <label className="property-label">位置</label>
                            <span className="property-value-text" style={{ color: '#999' }}>
                                ({node.position.x.toFixed(0)}, {node.position.y.toFixed(0)})
                            </span>
                        </div>
                    </div>
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

    if (target.type === 'behavior-tree-node') {
        return renderBehaviorTreeNode(target.data);
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
