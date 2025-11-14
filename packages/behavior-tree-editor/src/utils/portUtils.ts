import { RefObject } from 'react';
import { Node as BehaviorTreeNode } from '../domain/models/Node';

export function getPortPosition(
    canvasRef: RefObject<HTMLDivElement>,
    canvasOffset: { x: number; y: number },
    canvasScale: number,
    nodes: BehaviorTreeNode[],
    nodeId: string,
    propertyName?: string,
    portType: 'input' | 'output' = 'output',
    draggingNodeId?: string | null,
    dragDelta?: { dx: number; dy: number },
    selectedNodeIds?: string[]
): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
    if (!node) return null;

    const nodeElement = canvas.querySelector(`[data-node-id="${nodeId}"].bt-node`) as HTMLElement;
    if (!nodeElement) return null;

    const nodeWidth = nodeElement.offsetWidth;
    const nodeHeight = nodeElement.offsetHeight;

    // 如果节点正在被拖拽（包括多选拖拽的情况），需要加上拖拽偏移量
    const isBeingDragged = draggingNodeId && selectedNodeIds?.includes(nodeId);
    const nodeCenterX = node.position.x + (isBeingDragged && dragDelta ? dragDelta.dx : 0);
    const nodeCenterY = node.position.y + (isBeingDragged && dragDelta ? dragDelta.dy : 0);

    if (propertyName) {
        const propertyElement = canvas.querySelector(
            `[data-node-id="${nodeId}"][data-property="${propertyName}"]`
        ) as HTMLElement;
        if (!propertyElement) return null;

        const nodeRect = nodeElement.getBoundingClientRect();
        const propRect = propertyElement.getBoundingClientRect();

        const relativeY = (propRect.top + propRect.height / 2 - nodeRect.top) / canvasScale;
        const nodeBodyPadding = 12;

        return {
            x: nodeCenterX - nodeWidth / 2 + nodeBodyPadding,
            y: nodeCenterY - nodeHeight / 2 + relativeY
        };
    }

    if (node.data.nodeType === 'blackboard-variable') {
        return {
            x: nodeCenterX + nodeWidth / 2,
            y: nodeCenterY
        };
    }

    if (portType === 'input') {
        return {
            x: nodeCenterX,
            y: nodeCenterY - nodeHeight / 2
        };
    } else {
        return {
            x: nodeCenterX,
            y: nodeCenterY + nodeHeight / 2
        };
    }
}