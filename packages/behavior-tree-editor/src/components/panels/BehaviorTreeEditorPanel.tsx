import React from 'react';
import { useTreeStore } from '../../stores';

interface BehaviorTreeEditorPanelProps {
    projectPath?: string | null;
}

export const BehaviorTreeEditorPanel: React.FC<BehaviorTreeEditorPanelProps> = ({ projectPath }) => {
    const { isOpen, pendingFilePath, nodes, connections } = useTreeStore();

    if (!isOpen) {
        return (
            <div style={{ padding: '20px', background: '#1e1e1e', color: '#666', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>No behavior tree file opened. Double-click a .btree file to edit.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', background: '#1e1e1e', color: '#fff', height: '100%' }}>
            <h2>Behavior Tree Editor</h2>
            <div>
                <p><strong>File:</strong> {pendingFilePath || 'None'}</p>
                <p><strong>Nodes:</strong> {nodes.length}</p>
                <p><strong>Connections:</strong> {connections.length}</p>
                <p><strong>Project:</strong> {projectPath || 'None'}</p>
            </div>
            <div style={{ marginTop: '20px', padding: '10px', background: '#2d2d30', borderRadius: '4px' }}>
                <p>Panel is working!</p>
                <p>Data loaded from: {pendingFilePath}</p>
            </div>
        </div>
    );
};
