/**
 * 检查器面板组件
 * Inspector panel component
 *
 * 使用 InspectorStore 管理状态，减少 useEffect 数量
 * Uses InspectorStore for state management to reduce useEffect count
 */

import { useEffect, useRef } from 'react';
import { useInspectorStore } from '../../stores';
import { InspectorProps } from './types';
import { getProfilerService } from './utils';
import {
    EmptyInspector,
    ExtensionInspector,
    AssetFileInspector,
    RemoteEntityInspector,
    EntityInspector,
    PrefabInspector
} from './views';

export function Inspector({ entityStore: _entityStore, messageHub, inspectorRegistry, projectPath, commandManager }: InspectorProps) {
    // ===== 从 InspectorStore 获取状态 | Get state from InspectorStore =====
    const {
        target,
        componentVersion,
        autoRefresh,
        setAutoRefresh,
        isLocked,
        setIsLocked,
        decimalPlaces,
    } = useInspectorStore();

    // Ref 用于 profiler 回调访问最新状态 | Ref for profiler callback to access latest state
    const targetRef = useRef(target);
    targetRef.current = target;

    // 自动刷新远程实体详情 | Auto-refresh remote entity details
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

    // ===== 渲染 | Render =====
    if (!target) {
        return <EmptyInspector />;
    }

    if (target.type === 'extension') {
        return <ExtensionInspector data={target.data} inspectorRegistry={inspectorRegistry} projectPath={projectPath} />;
    }

    if (target.type === 'asset-file') {
        // 预制体文件使用专用检查器 | Prefab files use dedicated inspector
        if (target.data.extension?.toLowerCase() === 'prefab') {
            return <PrefabInspector fileInfo={target.data} messageHub={messageHub} commandManager={commandManager} />;
        }

        // 检查插件是否提供自定义检查器 | Check if a plugin provides a custom inspector
        const customInspector = inspectorRegistry.render(target, { target, projectPath });
        if (customInspector) {
            return customInspector;
        }
        // 回退到默认资产文件检查器 | Fall back to default asset file inspector
        return <AssetFileInspector fileInfo={target.data} content={target.content} isImage={target.isImage} />;
    }

    if (target.type === 'remote-entity') {
        const entity = target.data;
        const details = target.details;

        return (
            <RemoteEntityInspector
                entity={entity}
                details={details}
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
                decimalPlaces={decimalPlaces}
            />
        );
    }

    if (target.type === 'entity') {
        return (
            <EntityInspector
                entity={target.data}
                messageHub={messageHub}
                commandManager={commandManager}
                componentVersion={componentVersion}
                isLocked={isLocked}
                onLockChange={setIsLocked}
            />
        );
    }

    return null;
}
