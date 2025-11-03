import React from 'react';

interface NodeContextMenuProps {
    visible: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
    onReplaceNode: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    visible,
    position,
    onReplaceNode
}) => {
    if (!visible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                backgroundColor: '#2d2d30',
                border: '1px solid #454545',
                borderRadius: '4px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                zIndex: 10000,
                minWidth: '150px',
                padding: '4px 0'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                onClick={onReplaceNode}
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    color: '#cccccc',
                    fontSize: '13px',
                    transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#094771'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                替换节点
            </div>
        </div>
    );
};
