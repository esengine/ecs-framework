import { MutableRefObject } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { Node } from '../domain/models/Node';
import { Position } from '../domain/value-objects/Position';
import { NodeTemplate } from '@esengine/behavior-tree';

type BehaviorTreeNode = Node;

interface UseEditorHandlersParams {
    isDraggingNode: boolean;
    selectedNodeIds: string[];
    setSelectedNodeIds: (ids: string[]) => void;
    setNodes: (nodes: Node[]) => void;
    setConnections: (connections: any[]) => void;
    resetView: () => void;
    triggerForceUpdate: () => void;
    onNodeSelect?: (node: BehaviorTreeNode) => void;
    rootNodeId: string;
    rootNodeTemplate: NodeTemplate;
    justFinishedDragRef: MutableRefObject<boolean>;
}

export function useEditorHandlers(params: UseEditorHandlersParams) {
    const {
        isDraggingNode,
        selectedNodeIds,
        setSelectedNodeIds,
        setNodes,
        setConnections,
        resetView,
        triggerForceUpdate,
        onNodeSelect,
        rootNodeId,
        rootNodeTemplate,
        justFinishedDragRef
    } = params;

    const handleNodeClick = (e: React.MouseEvent, node: BehaviorTreeNode) => {
        if (isDraggingNode) {
            return;
        }

        if (justFinishedDragRef.current) {
            justFinishedDragRef.current = false;
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            if (selectedNodeIds.includes(node.id)) {
                setSelectedNodeIds(selectedNodeIds.filter((id: string) => id !== node.id));
            } else {
                setSelectedNodeIds([...selectedNodeIds, node.id]);
            }
        } else {
            setSelectedNodeIds([node.id]);
        }
        onNodeSelect?.(node);
    };

    const handleResetView = () => {
        resetView();
        requestAnimationFrame(() => {
            triggerForceUpdate();
        });
    };

    const handleClearCanvas = async () => {
        const confirmed = await ask('确定要清空画布吗？此操作不可撤销。', {
            title: '清空画布',
            kind: 'warning'
        });

        if (confirmed) {
            setNodes([
                new Node(
                    rootNodeId,
                    rootNodeTemplate,
                    { nodeType: 'root' },
                    new Position(400, 100),
                    []
                )
            ]);
            setConnections([]);
            setSelectedNodeIds([]);
        }
    };

    return {
        handleNodeClick,
        handleResetView,
        handleClearCanvas
    };
}
