import { NodeTemplates, type NodeTemplate } from '@esengine/behavior-tree';
import { Node } from '../../domain/models/Node';
import { Position } from '../../domain/value-objects/Position';
import { INodeFactory } from '../../domain/interfaces/INodeFactory';
import { NodeRegistryService } from '../services/NodeRegistryService';

/**
 * 生成唯一ID
 */
function generateUniqueId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 节点工厂实现
 */
export class NodeFactory implements INodeFactory {
    /**
     * 创建节点
     */
    createNode(
        template: NodeTemplate,
        position: Position,
        data?: Record<string, unknown>
    ): Node {
        const nodeId = generateUniqueId();
        const nodeData = {
            ...template.defaultConfig,
            ...data
        };

        return new Node(nodeId, template, nodeData, position, []);
    }

    /**
     * 根据模板类型创建节点
     */
    createNodeByType(
        nodeType: string,
        position: Position,
        data?: Record<string, unknown>
    ): Node {
        const template = this.getTemplateByType(nodeType);
        if (!template) {
            throw new Error(`未找到节点模板: ${nodeType}`);
        }

        return this.createNode(template, position, data);
    }

    /**
     * 克隆节点
     */
    cloneNode(node: Node, newPosition?: Position): Node {
        const position = newPosition || node.position;
        const clonedId = generateUniqueId();

        return new Node(
            clonedId,
            node.template,
            node.data,
            position,
            []
        );
    }

    /**
     * 获取所有可用的节点模板
     */
    getAllTemplates(): NodeTemplate[] {
        const coreTemplates = NodeTemplates.getAllTemplates();
        const customTemplates = NodeRegistryService.getInstance().getCustomTemplates();
        return [...coreTemplates, ...customTemplates];
    }

    /**
     * 根据类型获取模板
     */
    private getTemplateByType(nodeType: string): NodeTemplate | null {
        const allTemplates = this.getAllTemplates();

        const template = allTemplates.find((t: NodeTemplate) => {
            const defaultNodeType = t.defaultConfig.nodeType;
            return defaultNodeType === nodeType;
        });

        return template || null;
    }

    /**
     * 根据实现类型获取模板
     */
    getTemplateByImplementationType(implementationType: string): NodeTemplate | null {
        const allTemplates = this.getAllTemplates();
        return allTemplates.find((t) => t.className === implementationType) || null;
    }
}
