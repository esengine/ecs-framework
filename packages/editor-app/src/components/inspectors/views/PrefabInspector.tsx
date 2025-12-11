/**
 * 预制体检查器
 * Prefab Inspector
 *
 * 显示预制体文件的信息、实体层级预览和实例化功能。
 * Displays prefab file information, entity hierarchy preview, and instantiation features.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    PackageOpen, Box, Layers, Clock, HardDrive, Tag, Play, ChevronRight, ChevronDown
} from 'lucide-react';
import { Core, PrefabSerializer } from '@esengine/ecs-framework';
import type { PrefabData, SerializedPrefabEntity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, CommandManager } from '@esengine/editor-core';
import { TauriAPI } from '../../../api/tauri';
import { InstantiatePrefabCommand } from '../../../application/commands/prefab/InstantiatePrefabCommand';
import { AssetFileInfo } from '../types';
import '../../../styles/EntityInspector.css';

interface PrefabInspectorProps {
    fileInfo: AssetFileInfo;
    messageHub?: MessageHub;
    commandManager?: CommandManager;
}

function formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatDate(timestamp?: number): string {
    if (!timestamp) return '未知';
    // 如果是毫秒级时间戳，不需要转换 | If millisecond timestamp, no conversion needed
    const ts = timestamp > 1e12 ? timestamp : timestamp * 1000;
    const date = new Date(ts);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 实体层级节点组件
 * Entity hierarchy node component
 */
function EntityNode({ entity, depth = 0 }: { entity: SerializedPrefabEntity; depth?: number }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const hasChildren = entity.children && entity.children.length > 0;
    const componentCount = entity.components?.length || 0;

    return (
        <div className="prefab-entity-node">
            <div
                className="prefab-entity-row"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => hasChildren && setExpanded(!expanded)}
            >
                <span className="prefab-entity-expand">
                    {hasChildren ? (
                        expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    ) : (
                        <span style={{ width: 12 }} />
                    )}
                </span>
                <Box size={14} className="prefab-entity-icon" />
                <span className="prefab-entity-name">{entity.name}</span>
                <span className="prefab-entity-components">
                    ({componentCount} 组件)
                </span>
            </div>
            {expanded && hasChildren && (
                <div className="prefab-entity-children">
                    {entity.children.map((child, index) => (
                        <EntityNode
                            key={child.id || index}
                            entity={child as SerializedPrefabEntity}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function PrefabInspector({ fileInfo, messageHub, commandManager }: PrefabInspectorProps) {
    const [prefabData, setPrefabData] = useState<PrefabData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [instantiating, setInstantiating] = useState(false);

    // 加载预制体数据 | Load prefab data
    useEffect(() => {
        let cancelled = false;

        async function loadPrefab() {
            setLoading(true);
            setError(null);

            try {
                const content = await TauriAPI.readFileContent(fileInfo.path);
                const data = PrefabSerializer.deserialize(content);

                // 验证预制体数据 | Validate prefab data
                const validation = PrefabSerializer.validate(data);
                if (!validation.valid) {
                    throw new Error(`无效的预制体: ${validation.errors?.join(', ')}`);
                }

                if (!cancelled) {
                    setPrefabData(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : '加载预制体失败');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadPrefab();

        return () => {
            cancelled = true;
        };
    }, [fileInfo.path]);

    // 实例化预制体 | Instantiate prefab
    const handleInstantiate = useCallback(async () => {
        if (!prefabData || instantiating) return;

        setInstantiating(true);
        try {
            // 从 Core.services 获取服务，使用 tryResolve 避免类型问题
            // Get services from Core.services, use tryResolve to avoid type issues
            const entityStore = Core.services.tryResolve(EntityStoreService) as EntityStoreService | null;
            const hub = messageHub || Core.services.tryResolve(MessageHub) as MessageHub | null;
            const cmdManager = commandManager;

            if (!entityStore || !hub || !cmdManager) {
                throw new Error('必要的服务未初始化 | Required services not initialized');
            }

            const command = new InstantiatePrefabCommand(
                entityStore,
                hub,
                prefabData,
                { trackInstance: true }
            );
            cmdManager.execute(command);

            console.log(`[PrefabInspector] Prefab instantiated: ${prefabData.metadata.name}`);
        } catch (err) {
            console.error('[PrefabInspector] Failed to instantiate prefab:', err);
        } finally {
            setInstantiating(false);
        }
    }, [prefabData, instantiating, messageHub, commandManager]);

    // 统计实体和组件数量 | Count entities and components
    const countEntities = useCallback((entity: SerializedPrefabEntity): { entities: number; components: number } => {
        let entities = 1;
        let components = entity.components?.length || 0;

        if (entity.children) {
            for (const child of entity.children) {
                const childCounts = countEntities(child as SerializedPrefabEntity);
                entities += childCounts.entities;
                components += childCounts.components;
            }
        }

        return { entities, components };
    }, []);

    const counts = prefabData ? countEntities(prefabData.root) : { entities: 0, components: 0 };

    if (loading) {
        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <PackageOpen size={16} style={{ color: '#4ade80' }} />
                    <span className="entity-name">{fileInfo.name}</span>
                </div>
                <div className="inspector-content">
                    <div className="inspector-section">
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            加载中...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <PackageOpen size={16} style={{ color: '#f87171' }} />
                    <span className="entity-name">{fileInfo.name}</span>
                </div>
                <div className="inspector-content">
                    <div className="inspector-section">
                        <div style={{ padding: '20px', textAlign: 'center', color: '#f87171' }}>
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="entity-inspector prefab-inspector">
            <div className="inspector-header">
                <PackageOpen size={16} style={{ color: '#4ade80' }} />
                <span className="entity-name">{prefabData?.metadata.name || fileInfo.name}</span>
            </div>

            <div className="inspector-content">
                {/* 预制体信息 | Prefab Information */}
                <div className="inspector-section">
                    <div className="section-title">预制体信息</div>

                    <div className="property-field">
                        <label className="property-label">版本</label>
                        <span className="property-value-text">v{prefabData?.version}</span>
                    </div>

                    <div className="property-field">
                        <label className="property-label">
                            <Layers size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            实体数量
                        </label>
                        <span className="property-value-text">{counts.entities}</span>
                    </div>

                    <div className="property-field">
                        <label className="property-label">
                            <Box size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            组件总数
                        </label>
                        <span className="property-value-text">{counts.components}</span>
                    </div>

                    {prefabData?.metadata.description && (
                        <div className="property-field">
                            <label className="property-label">描述</label>
                            <span className="property-value-text">{prefabData.metadata.description}</span>
                        </div>
                    )}

                    {prefabData?.metadata.tags && prefabData.metadata.tags.length > 0 && (
                        <div className="property-field">
                            <label className="property-label">
                                <Tag size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                标签
                            </label>
                            <span className="property-value-text">
                                {prefabData.metadata.tags.join(', ')}
                            </span>
                        </div>
                    )}
                </div>

                {/* 文件信息 | File Information */}
                <div className="inspector-section">
                    <div className="section-title">文件信息</div>

                    {fileInfo.size !== undefined && (
                        <div className="property-field">
                            <label className="property-label">
                                <HardDrive size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                大小
                            </label>
                            <span className="property-value-text">{formatFileSize(fileInfo.size)}</span>
                        </div>
                    )}

                    {prefabData?.metadata.createdAt && (
                        <div className="property-field">
                            <label className="property-label">
                                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                创建时间
                            </label>
                            <span className="property-value-text">
                                {formatDate(prefabData.metadata.createdAt)}
                            </span>
                        </div>
                    )}

                    {prefabData?.metadata.modifiedAt && (
                        <div className="property-field">
                            <label className="property-label">
                                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                修改时间
                            </label>
                            <span className="property-value-text">
                                {formatDate(prefabData.metadata.modifiedAt)}
                            </span>
                        </div>
                    )}
                </div>

                {/* 组件类型 | Component Types */}
                {prefabData?.metadata.componentTypes && prefabData.metadata.componentTypes.length > 0 && (
                    <div className="inspector-section">
                        <div className="section-title">组件类型</div>
                        <div className="prefab-component-types">
                            {prefabData.metadata.componentTypes.map((type) => (
                                <span key={type} className="prefab-component-type-tag">
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 实体层级 | Entity Hierarchy */}
                {prefabData?.root && (
                    <div className="inspector-section">
                        <div className="section-title">实体层级</div>
                        <div className="prefab-hierarchy">
                            <EntityNode entity={prefabData.root} />
                        </div>
                    </div>
                )}

                {/* 操作按钮 | Action Buttons */}
                <div className="inspector-section">
                    <button
                        className="prefab-instantiate-btn"
                        onClick={handleInstantiate}
                        disabled={instantiating}
                        style={{
                            width: '100%',
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            backgroundColor: '#4ade80',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: instantiating ? 'wait' : 'pointer',
                            opacity: instantiating ? 0.7 : 1
                        }}
                    >
                        <Play size={14} />
                        {instantiating ? '实例化中...' : '实例化到场景'}
                    </button>
                </div>
            </div>
        </div>
    );
}
