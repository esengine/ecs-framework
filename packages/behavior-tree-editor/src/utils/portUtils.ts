import { type RefObject, createLogger } from '@esengine/editor-runtime';
import { Node as BehaviorTreeNode } from '../domain/models/Node';

const logger = createLogger('portUtils');

// 端口偏移常量（与 CSS 保持一致）
const NODE_PORT_OFFSET = 8;  // top: -8px / bottom: -8px

/**
 * 获取端口在画布世界坐标系中的位置
 *
 * 由于 SVG 和节点都在同一个 transform 容器内，直接使用节点的世界坐标计算。
 * 这种方式不受缩放影响，因为不依赖 getBoundingClientRect。
 */
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
    if (!canvas) {
        return null;
    }

    const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
    if (!node) {
        return null;
    }

    // 获取节点 DOM 元素来获取尺寸
    const nodeElement = canvas.querySelector(`[data-node-id="${nodeId}"].bt-node`) as HTMLElement;
    if (!nodeElement) {
        return null;
    }

    // 使用 offsetWidth/offsetHeight 获取未缩放的原始尺寸
    const nodeWidth = nodeElement.offsetWidth;
    const nodeHeight = nodeElement.offsetHeight;

    // 节点世界坐标（考虑拖拽偏移）
    let nodeX = node.position.x;
    let nodeY = node.position.y;

    if (draggingNodeId && dragDelta) {
        const isBeingDragged = draggingNodeId === nodeId ||
            (selectedNodeIds && selectedNodeIds.includes(nodeId) && selectedNodeIds.includes(draggingNodeId));
        if (isBeingDragged) {
            nodeX += dragDelta.dx;
            nodeY += dragDelta.dy;
        }
    }

    // 节点使用 transform: translate(-50%, -50%) 居中，所以 (nodeX, nodeY) 是视觉中心

    if (propertyName) {
        // 属性端口：需要找到端口在节点内的相对位置
        const portElement = nodeElement.querySelector(`[data-property="${propertyName}"]`) as HTMLElement;
        if (!portElement) {
            return null;
        }

        // 使用 offsetLeft/offsetTop 获取相对于 offsetParent 的位置
        // 需要累加到节点元素
        let offsetX = 0;
        let offsetY = 0;
        let el: HTMLElement | null = portElement;

        while (el && el !== nodeElement) {
            offsetX += el.offsetLeft;
            offsetY += el.offsetTop;
            el = el.offsetParent as HTMLElement | null;
        }

        // 端口中心相对于节点左上角的偏移
        const portCenterX = offsetX + portElement.offsetWidth / 2;
        const portCenterY = offsetY + portElement.offsetHeight / 2;

        // 节点左上角世界坐标
        const nodeLeft = nodeX - nodeWidth / 2;
        const nodeTop = nodeY - nodeHeight / 2;

        return {
            x: nodeLeft + portCenterX,
            y: nodeTop + portCenterY
        };
    } else {
        // 节点端口（输入/输出）
        if (portType === 'input') {
            // 输入端口在顶部中央
            return {
                x: nodeX,
                y: nodeY - nodeHeight / 2 - NODE_PORT_OFFSET
            };
        } else {
            // 输出端口在底部中央
            return {
                x: nodeX,
                y: nodeY + nodeHeight / 2 + NODE_PORT_OFFSET
            };
        }
    }
}
