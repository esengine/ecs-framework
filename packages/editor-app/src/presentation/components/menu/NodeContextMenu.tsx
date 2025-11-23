import React from 'react';
import { Trash2, Replace, Plus } from 'lucide-react';

interface NodeContextMenuProps {
    visible: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
    onReplaceNode?: () => void;
    onDeleteNode?: () => void;
    onCreateNode?: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    visible,
    position,
    nodeId,
    onReplaceNode,
    onDeleteNode,
    onCreateNode
}) => {
    if (!visible) return null;

    const menuItemStyle = {
        padding: '8px 16px',
        cursor: 'pointer',
        color: '#cccccc',
        fontSize: '13px',
        transition: 'background-color 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

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
            {nodeId ? (
                <>
                    {onReplaceNode && (
                        <div
                            onClick={onReplaceNode}
                            style={menuItemStyle}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#094771'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Replace size={14} />
                            替换节点
                        </div>
                    )}
                    {onDeleteNode && (
                        <div
                            onClick={onDeleteNode}
                            style={{ ...menuItemStyle, color: '#f48771' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a1a1a'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Trash2 size={14} />
                            删除节点
                        </div>
                    )}
                </>
            ) : (
                <>
                    {onCreateNode && (
                        <div
                            onClick={onCreateNode}
                            style={menuItemStyle}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#094771'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Plus size={14} />
                            新建节点
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
