/**
 * Blueprint Editor Panel - Main panel for blueprint editing
 * 蓝图编辑器面板 - 蓝图编辑的主面板
 */

import React, { useEffect } from 'react';
import { Core } from '@esengine/ecs-framework';
import { IFileSystemService, type IFileSystem } from '@esengine/editor-core';
import { BlueprintCanvas } from './BlueprintCanvas';
import { useBlueprintEditorStore } from '../stores/blueprintEditorStore';
import type { BlueprintAsset } from '@esengine/blueprint';

// Import blueprint package to register nodes
// 导入蓝图包以注册节点
import '@esengine/blueprint';

/**
 * Panel container styles
 * 面板容器样式
 */
const panelStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    overflow: 'hidden'
};

/**
 * Blueprint Editor Panel Component
 * 蓝图编辑器面板组件
 */
export const BlueprintEditorPanel: React.FC = () => {
    const {
        blueprint,
        pendingFilePath,
        createNewBlueprint,
        loadBlueprint,
        setPendingFilePath
    } = useBlueprintEditorStore();

    // Load blueprint from pending file path
    // 从待加载的文件路径加载蓝图
    useEffect(() => {
        if (!pendingFilePath) return;

        const loadBlueprintFile = async () => {
            try {
                const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
                if (!fileSystem) {
                    console.error('[BlueprintEditorPanel] FileSystem service not available');
                    setPendingFilePath(null);
                    createNewBlueprint('New Blueprint');
                    return;
                }

                const content = await fileSystem.readFile(pendingFilePath);
                const asset = JSON.parse(content) as BlueprintAsset;

                loadBlueprint(asset, pendingFilePath);
                setPendingFilePath(null);

                console.log('[BlueprintEditorPanel] Loaded blueprint from file:', pendingFilePath);
            } catch (error) {
                console.error('[BlueprintEditorPanel] Failed to load blueprint file:', error);
                setPendingFilePath(null);
                // 加载失败时创建新蓝图
                createNewBlueprint('New Blueprint');
            }
        };

        loadBlueprintFile();
    }, [pendingFilePath, loadBlueprint, setPendingFilePath, createNewBlueprint]);

    // Create a default blueprint if none exists and no pending file
    // 如果不存在蓝图且没有待加载文件，则创建默认蓝图
    useEffect(() => {
        if (!blueprint && !pendingFilePath) {
            createNewBlueprint('New Blueprint');
        }
    }, [blueprint, pendingFilePath, createNewBlueprint]);

    return (
        <div style={panelStyles}>
            <BlueprintCanvas />
        </div>
    );
};
