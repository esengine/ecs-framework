import { useState, RefObject } from 'react';
import { BehaviorTreeNode, ROOT_NODE_ID } from '../../stores/behaviorTreeStore';
import { Position } from '../../domain/value-objects/Position';
import { useNodeOperations } from './useNodeOperations';

interface UseNodeDragParams {
    canvasRef: RefObject<HTMLDivElement>;
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    nodes: BehaviorTreeNode[];
    selectedNodeIds: string[];
    draggingNodeId: string | null;
    dragStartPositions: Map<string, { x: number; y: number }>;
    isDraggingNode: boolean;
    dragDelta: { dx: number; dy: number };
    nodeOperations: ReturnType<typeof useNodeOperations>;
    setSelectedNodeIds: (ids: string[]) => void;
    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => void;
    stopDragging: () => void;
    setIsDraggingNode: (isDragging: boolean) => void;
    setDragDelta: (delta: { dx: number; dy: number }) => void;
    setIsBoxSelecting: (isSelecting: boolean) => void;
    setBoxSelectStart: (pos: { x: number; y: number } | null) => void;
    setBoxSelectEnd: (pos: { x: number; y: number } | null) => void;
    sortChildrenByPosition: () => void;
}

export function useNodeDrag(params: UseNodeDragParams) {
    const {
        canvasRef,
        canvasOffset,
        canvasScale,
        nodes,
        selectedNodeIds,
        draggingNodeId,
        dragStartPositions,
        isDraggingNode,
        dragDelta,
        nodeOperations,
        setSelectedNodeIds,
        startDragging,
        stopDragging,
        setIsDraggingNode,
        setDragDelta,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        sortChildrenByPosition
    } = params;

    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        if (e.button !== 0) return;

        if (nodeId === ROOT_NODE_ID) return;

        const target = e.target as HTMLElement;
        if (target.getAttribute('data-port')) {
            return;
        }

        e.stopPropagation();

        setIsBoxSelecting(false);
        setBoxSelectStart(null);
        setBoxSelectEnd(null);
        const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
        if (!node) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

        let nodesToDrag: string[];
        if (selectedNodeIds.includes(nodeId)) {
            nodesToDrag = selectedNodeIds;
        } else {
            nodesToDrag = [nodeId];
            setSelectedNodeIds([nodeId]);
        }

        const startPositions = new Map<string, { x: number; y: number }>();
        nodesToDrag.forEach((id: string) => {
            const n = nodes.find((node: BehaviorTreeNode) => node.id === id);
            if (n) {
                startPositions.set(id, { x: n.position.x, y: n.position.y });
            }
        });

        startDragging(nodeId, startPositions);
        setDragOffset({
            x: canvasX - node.position.x,
            y: canvasY - node.position.y
        });
    };

    const handleNodeMouseMove = (e: React.MouseEvent) => {
        if (!draggingNodeId) return;

        if (!isDraggingNode) {
            setIsDraggingNode(true);
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;

        const draggedNodeStartPos = dragStartPositions.get(draggingNodeId);
        if (!draggedNodeStartPos) return;

        const deltaX = newX - draggedNodeStartPos.x;
        const deltaY = newY - draggedNodeStartPos.y;

        setDragDelta({ dx: deltaX, dy: deltaY });
    };

    const handleNodeMouseUp = () => {
        if (!draggingNodeId) return;

        if (dragDelta.dx !== 0 || dragDelta.dy !== 0) {
            const moves: Array<{ nodeId: string; position: Position }> = [];
            dragStartPositions.forEach((startPos: { x: number; y: number }, nodeId: string) => {
                moves.push({
                    nodeId,
                    position: new Position(
                        startPos.x + dragDelta.dx,
                        startPos.y + dragDelta.dy
                    )
                });
            });
            nodeOperations.moveNodes(moves);

            setTimeout(() => {
                sortChildrenByPosition();
            }, 0);
        }

        setDragDelta({ dx: 0, dy: 0 });

        stopDragging();

        setTimeout(() => {
            setIsDraggingNode(false);
        }, 10);
    };

    return {
        handleNodeMouseDown,
        handleNodeMouseMove,
        handleNodeMouseUp,
        dragOffset
    };
}
