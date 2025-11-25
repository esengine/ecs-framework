import { useCallback, React, ask } from '@esengine/editor-runtime';
import { BehaviorTreeNode } from '../stores';

interface UseEditorHandlersParams {
    isDraggingNode: boolean;
    selectedNodeIds: string[];
    setSelectedNodeIds: (ids: string[]) => void;
    resetView: () => void;
    resetTree: () => void;
    triggerForceUpdate: () => void;
    onNodeSelect?: (node: BehaviorTreeNode) => void;
}

export function useEditorHandlers(params: UseEditorHandlersParams) {
    const {
        isDraggingNode,
        selectedNodeIds,
        setSelectedNodeIds,
        resetView,
        resetTree,
        triggerForceUpdate,
        onNodeSelect
    } = params;

    const handleNodeClick = useCallback((e: React.MouseEvent, node: BehaviorTreeNode) => {
        // 阻止事件冒泡，避免触发画布的点击事件
        e.stopPropagation();

        if (isDraggingNode) {
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
    }, [isDraggingNode, selectedNodeIds, setSelectedNodeIds, onNodeSelect]);

    const handleResetView = useCallback(() => {
        resetView();
        requestAnimationFrame(() => {
            triggerForceUpdate();
        });
    }, [resetView, triggerForceUpdate]);

    const handleClearCanvas = useCallback(async () => {
        const confirmed = await ask('确定要清空画布吗？此操作不可撤销。', {
            title: '清空画布',
            kind: 'warning'
        });

        if (confirmed) {
            resetTree();
            setSelectedNodeIds([]);
        }
    }, [resetTree, setSelectedNodeIds]);

    return {
        handleNodeClick,
        handleResetView,
        handleClearCanvas
    };
}
