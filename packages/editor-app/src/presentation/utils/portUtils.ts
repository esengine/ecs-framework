import { RefObject } from 'react';
import { BehaviorTreeNode } from '../../stores/behaviorTreeStore';

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
        selector = `[data-node-id="${nodeId}"][data-property="${propertyName}"]`;
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

    const x = (rect.left + rect.width / 2 - canvasRect.left - canvasOffset.x) / canvasScale;
    const y = (rect.top + rect.height / 2 - canvasRect.top - canvasOffset.y) / canvasScale;

    return { x, y };
}
