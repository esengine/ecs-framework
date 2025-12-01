import type { NodeTemplate } from '@esengine/behavior-tree';
import { Node } from '../models/Node';
import { Position } from '../value-objects';

/**
 * 节点工厂接口
 * 负责创建不同类型的节点
 */
export interface INodeFactory {
    /**
     * 创建节点
     */
    createNode(
        template: NodeTemplate,
        position: Position,
        data?: Record<string, unknown>
    ): Node;

    /**
     * 根据模板类型创建节点
     */
    createNodeByType(
        nodeType: string,
        position: Position,
        data?: Record<string, unknown>
    ): Node;

    /**
     * 克隆节点
     */
    cloneNode(node: Node, newPosition?: Position): Node;
}
