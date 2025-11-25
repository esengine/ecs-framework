import { useRef, useCallback, type RefObject, React } from '@esengine/editor-runtime';
import { BehaviorTreeNode, ROOT_NODE_ID } from '../stores';
import { Position } from '../domain/value-objects/Position';
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

/**
 * 拖拽上下文，存储拖拽过程中需要保持稳定的值
 */
interface DragContext {
    // 鼠标按下时的客户端坐标
    startClientX: number;
    startClientY: number;
    // 拖拽开始时的画布状态（缩放和偏移）
    startCanvasScale: number;
    startCanvasOffset: { x: number; y: number };
    // 被拖拽节点的初始画布坐标
    nodeStartPositions: Map<string, { x: number; y: number }>;
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

    // 使用 ref 存储拖拽上下文，避免闭包问题
    const dragContextRef = useRef<DragContext | null>(null);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        if (e.button !== 0) return;
        if (nodeId === ROOT_NODE_ID) return;

        const target = e.target as HTMLElement;
        const isPort = target.closest('[data-port="true"]');
        if (isPort) {
            return;
        }

        e.stopPropagation();

        setIsBoxSelecting(false);
        setBoxSelectStart(null);
        setBoxSelectEnd(null);

        const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
        if (!node) return;

        // 确定要拖拽的节点列表
        let nodesToDrag: string[];
        if (selectedNodeIds.includes(nodeId)) {
            nodesToDrag = selectedNodeIds;
        } else {
            nodesToDrag = [nodeId];
            setSelectedNodeIds([nodeId]);
        }

        // 记录所有要拖拽节点的初始位置
        const startPositions = new Map<string, { x: number; y: number }>();
        nodesToDrag.forEach((id: string) => {
            const n = nodes.find((node: BehaviorTreeNode) => node.id === id);
            if (n) {
                startPositions.set(id, { x: n.position.x, y: n.position.y });
            }
        });

        // 创建拖拽上下文，保存拖拽开始时的所有关键状态
        dragContextRef.current = {
            startClientX: e.clientX,
            startClientY: e.clientY,
            startCanvasScale: canvasScale,
            startCanvasOffset: { ...canvasOffset },
            nodeStartPositions: startPositions
        };

        startDragging(nodeId, startPositions);
    }, [nodes, selectedNodeIds, canvasScale, canvasOffset, setSelectedNodeIds, setIsBoxSelecting, setBoxSelectStart, setBoxSelectEnd, startDragging]);

    const handleNodeMouseMove = useCallback((e: React.MouseEvent) => {
        if (!draggingNodeId || !dragContextRef.current) return;

        if (!isDraggingNode) {
            setIsDraggingNode(true);
        }

        const context = dragContextRef.current;

        // 计算鼠标在客户端坐标系中的移动距离（像素）
        const clientDeltaX = e.clientX - context.startClientX;
        const clientDeltaY = e.clientY - context.startClientY;

        // 转换为画布坐标系中的移动距离
        // 注意：这里使用拖拽开始时的缩放比例，确保计算一致性
        const canvasDeltaX = clientDeltaX / context.startCanvasScale;
        const canvasDeltaY = clientDeltaY / context.startCanvasScale;

        setDragDelta({ dx: canvasDeltaX, dy: canvasDeltaY });
    }, [draggingNodeId, isDraggingNode, setIsDraggingNode, setDragDelta]);

    const handleNodeMouseUp = useCallback(() => {
        if (!draggingNodeId || !dragContextRef.current) return;

        const context = dragContextRef.current;

        if (dragDelta.dx !== 0 || dragDelta.dy !== 0) {
            // 根据拖拽增量计算所有节点的新位置
            const moves: Array<{ nodeId: string; position: Position }> = [];
            context.nodeStartPositions.forEach((startPos, nodeId) => {
                moves.push({
                    nodeId,
                    position: new Position(
                        startPos.x + dragDelta.dx,
                        startPos.y + dragDelta.dy
                    )
                });
            });

            // 先重置拖拽状态，避免 moveNodes 触发重新渲染时位置计算错误
            setDragDelta({ dx: 0, dy: 0 });
            setIsDraggingNode(false);

            // 然后更新节点位置
            nodeOperations.moveNodes(moves);

            setTimeout(() => {
                sortChildrenByPosition();
            }, 0);
        } else {
            // 没有实际移动，直接重置状态
            setDragDelta({ dx: 0, dy: 0 });
            setIsDraggingNode(false);
        }

        // 清理拖拽上下文
        dragContextRef.current = null;
        stopDragging();
    }, [draggingNodeId, dragDelta, nodeOperations, sortChildrenByPosition, setDragDelta, stopDragging, setIsDraggingNode]);

    return {
        handleNodeMouseDown,
        handleNodeMouseMove,
        handleNodeMouseUp
    };
}
