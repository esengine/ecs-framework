import React from 'react';
import { useTreeStore } from '../../stores';
import { BehaviorTreeEditor } from '../BehaviorTreeEditor';
import { FolderOpen } from 'lucide-react';
import './BehaviorTreeEditorPanel.css';

interface BehaviorTreeEditorPanelProps {
    projectPath?: string | null;
}

export const BehaviorTreeEditorPanel: React.FC<BehaviorTreeEditorPanelProps> = ({ projectPath }) => {
    const { isOpen, blackboardVariables } = useTreeStore();

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
            />
        </div>
    );
};