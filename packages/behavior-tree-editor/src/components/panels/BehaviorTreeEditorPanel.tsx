import React from 'react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { useBehaviorTreeDataStore } from '../../stores';
import { BehaviorTreeEditor } from '../BehaviorTreeEditor';
import { FolderOpen } from 'lucide-react';
import type { Node as BehaviorTreeNode } from '../../domain/models/Node';
import './BehaviorTreeEditorPanel.css';

interface BehaviorTreeEditorPanelProps {
    projectPath?: string | null;
}

export const BehaviorTreeEditorPanel: React.FC<BehaviorTreeEditorPanelProps> = ({ projectPath }) => {
    const isOpen = useBehaviorTreeDataStore(state => state.isOpen);
    const blackboardVariables = useBehaviorTreeDataStore(state => state.blackboardVariables);

    const handleNodeSelect = (node: BehaviorTreeNode) => {
        // 通过消息系统通知 Inspector 显示节点信息
        try {
            const messageHub = Core.services.resolve(MessageHub);
            messageHub.publish('behavior-tree:node-selected', { data: node });
        } catch (error) {
            console.error('Failed to publish node selection:', error);
        }
    };

    if (!isOpen) {
        return (
            <div className="behavior-tree-editor-empty">
                <div className="empty-state">
                    <FolderOpen size={48} />
                    <p>No behavior tree file opened</p>
                    <p className="hint">Double-click a .btree file to edit</p>
                </div>
            </div>
        );
    }

    return (
        <div className="behavior-tree-editor-panel">
            <BehaviorTreeEditor
                blackboardVariables={blackboardVariables}
                projectPath={projectPath}
                showToolbar={true}
                onNodeSelect={handleNodeSelect}
            />
        </div>
    );
};
