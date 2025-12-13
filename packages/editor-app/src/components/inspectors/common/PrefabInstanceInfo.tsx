/**
 * 预制体实例信息组件
 * Prefab instance info component
 *
 * 显示预制体实例状态和操作按钮（Open, Select, Revert, Apply）。
 * Displays prefab instance status and action buttons.
 */

import { useState, useCallback } from 'react';
import { Entity, PrefabInstanceComponent } from '@esengine/ecs-framework';
import type { MessageHub, PrefabService, CommandManager } from '@esengine/editor-core';
import { ApplyPrefabCommand, RevertPrefabCommand, BreakPrefabLinkCommand } from '../../../application/commands/prefab';
import { useLocale } from '../../../hooks/useLocale';
import '../../../styles/PrefabInstanceInfo.css';

interface PrefabInstanceInfoProps {
    entity: Entity;
    prefabService: PrefabService;
    messageHub: MessageHub;
    commandManager?: CommandManager;
}

/**
 * 预制体实例信息组件
 * Prefab instance info component
 */
export function PrefabInstanceInfo({
    entity,
    prefabService,
    messageHub,
    commandManager
}: PrefabInstanceInfoProps) {
    const { t } = useLocale();
    const [isProcessing, setIsProcessing] = useState(false);

    // 获取预制体实例组件 | Get prefab instance component
    const prefabComp = entity.getComponent(PrefabInstanceComponent);
    if (!prefabComp) return null;

    // 只显示根实例的完整信息 | Only show full info for root instances
    if (!prefabComp.isRoot) return null;

    // 提取预制体名称 | Extract prefab name
    const prefabPath = prefabComp.sourcePrefabPath;
    const prefabName = prefabPath
        ? prefabPath.split(/[/\\]/).pop()?.replace('.prefab', '') || 'Prefab'
        : 'Unknown';

    // 修改数量 | Modification count
    const modificationCount = prefabComp.modifiedProperties.length;
    const hasModifications = modificationCount > 0;

    // 打开预制体编辑模式 | Open prefab edit mode
    const handleOpen = useCallback(() => {
        messageHub.publish('prefab:editMode:enter', {
            prefabPath: prefabComp.sourcePrefabPath
        });
    }, [messageHub, prefabComp.sourcePrefabPath]);

    // 在内容浏览器中选择 | Select in content browser
    const handleSelect = useCallback(() => {
        messageHub.publish('content-browser:select', {
            path: prefabComp.sourcePrefabPath
        });
    }, [messageHub, prefabComp.sourcePrefabPath]);

    // 还原所有修改 | Revert all modifications
    const handleRevert = useCallback(async () => {
        if (!hasModifications) return;

        const confirmed = window.confirm(t('inspector.prefab.revertConfirm'));
        if (!confirmed) return;

        setIsProcessing(true);
        try {
            if (commandManager) {
                const command = new RevertPrefabCommand(prefabService, messageHub, entity);
                await commandManager.execute(command);
            } else {
                await prefabService.revertInstance(entity);
            }
        } catch (error) {
            console.error('Revert failed:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [hasModifications, commandManager, prefabService, messageHub, entity, t]);

    // 应用修改到预制体 | Apply modifications to prefab
    const handleApply = useCallback(async () => {
        if (!hasModifications) return;

        const confirmed = window.confirm(t('inspector.prefab.applyConfirm', { name: prefabName }));
        if (!confirmed) return;

        setIsProcessing(true);
        try {
            if (commandManager) {
                const command = new ApplyPrefabCommand(prefabService, messageHub, entity);
                await commandManager.execute(command);
            } else {
                await prefabService.applyToPrefab(entity);
            }
        } catch (error) {
            console.error('Apply failed:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [hasModifications, commandManager, prefabService, messageHub, entity, prefabName, t]);

    // 解包预制体（断开链接）| Unpack prefab (break link)
    const handleUnpack = useCallback(() => {
        const confirmed = window.confirm(t('inspector.prefab.unpackConfirm'));
        if (!confirmed) return;

        if (commandManager) {
            const command = new BreakPrefabLinkCommand(prefabService, messageHub, entity);
            commandManager.execute(command);
        } else {
            prefabService.breakPrefabLink(entity);
        }
    }, [commandManager, prefabService, messageHub, entity, t]);

    return (
        <div className="prefab-instance-info">
            <div className="prefab-instance-header">
                <span className="prefab-icon">&#x1F4E6;</span>
                <span className="prefab-label">{t('inspector.prefab.source')}:</span>
                <span className="prefab-name" title={prefabPath}>{prefabName}</span>
                {hasModifications && (
                    <span className="prefab-modified-badge" title={t('inspector.prefab.modifications', { count: modificationCount })}>
                        {modificationCount}
                    </span>
                )}
            </div>
            <div className="prefab-instance-actions">
                <button
                    className="prefab-action-btn"
                    onClick={handleOpen}
                    title={t('inspector.prefab.open')}
                    disabled={isProcessing}
                >
                    {t('inspector.prefab.open')}
                </button>
                <button
                    className="prefab-action-btn"
                    onClick={handleSelect}
                    title={t('inspector.prefab.select')}
                    disabled={isProcessing}
                >
                    {t('inspector.prefab.select')}
                </button>
                <button
                    className="prefab-action-btn prefab-action-revert"
                    onClick={handleRevert}
                    title={t('inspector.prefab.revertAll')}
                    disabled={isProcessing || !hasModifications}
                >
                    {t('inspector.prefab.revert')}
                </button>
                <button
                    className="prefab-action-btn prefab-action-apply"
                    onClick={handleApply}
                    title={t('inspector.prefab.applyAll')}
                    disabled={isProcessing || !hasModifications}
                >
                    {t('inspector.prefab.apply')}
                </button>
                <button
                    className="prefab-action-btn prefab-action-unpack"
                    onClick={handleUnpack}
                    title={t('inspector.prefab.unpack')}
                    disabled={isProcessing}
                >
                    &#x26D3;
                </button>
            </div>
        </div>
    );
}
