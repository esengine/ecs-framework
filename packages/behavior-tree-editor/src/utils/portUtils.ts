import { RefObject } from 'react';
import { Node as BehaviorTreeNode } from '../domain/models/Node';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('portUtils');

/**
 * 获取端口在画布世界坐标系中的位置
 * 直接从 DOM 元素获取实际渲染位置，避免硬编码和手动计算
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
    if (!canvas) return null;

    const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
    if (!node) return null;

    // 构造端口选择器
    let portSelector: string;

    if (propertyName) {
        // 属性端口：使用 data-property 属性定位
        portSelector = `[data-node-id="${nodeId}"][data-property="${propertyName}"]`;
    } else {
        // 节点端口：使用 data-port-type 属性定位
        const portTypeAttr = portType === 'input' ? 'node-input' : 'node-output';
        portSelector = `[data-node-id="${nodeId}"][data-port-type="${portTypeAttr}"]`;
    }

    const portElement = canvas.querySelector(portSelector) as HTMLElement;
    if (!portElement) {
        logger.warn(`Port not found: ${portSelector}`);
        return null;
    }

    // 获取端口和画布的屏幕矩形
    const portRect = portElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // 计算端口中心相对于画布的屏幕坐标
    const screenX = portRect.left + portRect.width / 2 - canvasRect.left;
    const screenY = portRect.top + portRect.height / 2 - canvasRect.top;

    // 转换为世界坐标
    // 屏幕坐标到世界坐标的转换：world = (screen - offset) / scale
    const worldX = (screenX - canvasOffset.x) / canvasScale;
    const worldY = (screenY - canvasOffset.y) / canvasScale;

    return { x: worldX, y: worldY };
}
