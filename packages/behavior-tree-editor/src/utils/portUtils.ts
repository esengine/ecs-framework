import { RefObject } from 'react';
import { Node as BehaviorTreeNode } from '../domain/models/Node';

/**
 * 获取端口在画布逻辑坐标系中的位置
 * 画布逻辑坐标：与 node.position 一致的坐标系，未经过 transform 的逻辑坐标
 *
 * @returns 端口中心点的画布逻辑坐标，如果端口不存在则返回 null
 */
export function getPortPosition(
    canvasRef: RefObject<HTMLDivElement>,
    canvasOffset: { x: number; y: number },
    canvasScale: number,
    nodes: BehaviorTreeNode[],
    nodeId: string,
    propertyName?: string,
    portType: 'input' | 'output' = 'output'
): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    let selector: string;
    if (propertyName) {
        // 检查是否是黑板变量的 __value__ 端口
        if (propertyName === '__value__') {
            selector = `[data-node-id="${nodeId}"][data-port-type="variable-output"]`;
        } else {
            // 普通属性端口
            selector = `[data-node-id="${nodeId}"][data-property="${propertyName}"]`;
        }
    } else {
        const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
        if (!node) return null;

        if (node.data.nodeType === 'blackboard-variable') {
            selector = `[data-node-id="${nodeId}"][data-port-type="variable-output"]`;
        } else {
            if (portType === 'input') {
                selector = `[data-node-id="${nodeId}"][data-port-type="node-input"]`;
            } else {
                selector = `[data-node-id="${nodeId}"][data-port-type="node-output"]`;
            }
        }
    }

    const portElement = canvas.querySelector(selector) as HTMLElement;
    if (!portElement) return null;

    const rect = portElement.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // 步骤1：计算相对于画布容器的坐标（屏幕坐标 -> 容器坐标）
    const containerX = rect.left + rect.width / 2 - canvasRect.left;
    const containerY = rect.top + rect.height / 2 - canvasRect.top;

    // 步骤2：撤销 transform 得到画布逻辑坐标（容器坐标 -> 逻辑坐标）
    // transform: translate(offset.x, offset.y) scale(scale)
    // 逆变换：先减去平移，再除以缩放
    const logicX = (containerX - canvasOffset.x) / canvasScale;
    const logicY = (containerY - canvasOffset.y) / canvasScale;

    return { x: logicX, y: logicY };
}
