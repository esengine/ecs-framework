import { useState, React } from '@esengine/editor-runtime';
import { BehaviorTreeNode, ROOT_NODE_ID } from '../stores';

interface ContextMenuState {
    visible: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
}

export function useContextMenu() {
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        position: { x: 0, y: 0 },
        nodeId: null
    });

    const handleNodeContextMenu = (e: React.MouseEvent, node: BehaviorTreeNode) => {
        e.preventDefault();
        e.stopPropagation();

        // 不允许对Root节点右键
        if (node.id === ROOT_NODE_ID) {
            return;
        }

        setContextMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY },
            nodeId: node.id
        });
    };

    const handleCanvasContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setContextMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY },
            nodeId: null
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ ...contextMenu, visible: false });
    };

    return {
        contextMenu,
        setContextMenu,
        handleNodeContextMenu,
        handleCanvasContextMenu,
        closeContextMenu
    };
}
