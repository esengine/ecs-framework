/**
 * Blueprint Editor Panel - Main panel for blueprint editing
 * 蓝图编辑器面板 - 蓝图编辑的主面板
 */

import React, { useEffect } from 'react';
import { BlueprintCanvas } from './BlueprintCanvas';
import { useBlueprintEditorStore } from '../stores/blueprintEditorStore';

// Import nodes to register them
// 导入节点以注册它们
import '../../nodes';

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
    const { blueprint, createNewBlueprint } = useBlueprintEditorStore();

    // Create a default blueprint if none exists
    // 如果不存在则创建默认蓝图
    useEffect(() => {
        if (!blueprint) {
            createNewBlueprint('New Blueprint');
        }
    }, [blueprint, createNewBlueprint]);

    return (
        <div style={panelStyles}>
            <BlueprintCanvas />
        </div>
    );
};
