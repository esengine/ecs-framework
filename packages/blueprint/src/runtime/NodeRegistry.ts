/**
 * Node Registry - Manages node templates and executors
 * 节点注册表 - 管理节点模板和执行器
 */

import { BlueprintNodeTemplate, BlueprintNode } from '../types/nodes';
import { ExecutionContext, ExecutionResult } from './ExecutionContext';

/**
 * Node executor interface - implements the logic for a node type
 * 节点执行器接口 - 实现节点类型的逻辑
 */
export interface INodeExecutor {
    /**
     * Execute the node
     * 执行节点
     *
     * @param node - Node instance (节点实例)
     * @param context - Execution context (执行上下文)
     * @returns Execution result (执行结果)
     */
    execute(node: BlueprintNode, context: ExecutionContext): ExecutionResult;
}

/**
 * Node definition combines template with executor
 * 节点定义组合模板和执行器
 */
export interface NodeDefinition {
    template: BlueprintNodeTemplate;
    executor: INodeExecutor;
}

/**
 * Node Registry - singleton that holds all registered node types
 * 节点注册表 - 持有所有注册节点类型的单例
 */
export class NodeRegistry {
    private static _instance: NodeRegistry;
    private _nodes: Map<string, NodeDefinition> = new Map();

    private constructor() {}

    static get instance(): NodeRegistry {
        if (!NodeRegistry._instance) {
            NodeRegistry._instance = new NodeRegistry();
        }
        return NodeRegistry._instance;
    }

    /**
     * Register a node type
     * 注册节点类型
     */
    register(template: BlueprintNodeTemplate, executor: INodeExecutor): void {
        if (this._nodes.has(template.type)) {
            console.warn(`Node type "${template.type}" is already registered, overwriting`);
        }
        this._nodes.set(template.type, { template, executor });
    }

    /**
     * Get a node definition by type
     * 通过类型获取节点定义
     */
    get(type: string): NodeDefinition | undefined {
        return this._nodes.get(type);
    }

    /**
     * Get node template by type
     * 通过类型获取节点模板
     */
    getTemplate(type: string): BlueprintNodeTemplate | undefined {
        return this._nodes.get(type)?.template;
    }

    /**
     * Get node executor by type
     * 通过类型获取节点执行器
     */
    getExecutor(type: string): INodeExecutor | undefined {
        return this._nodes.get(type)?.executor;
    }

    /**
     * Check if a node type is registered
     * 检查节点类型是否已注册
     */
    has(type: string): boolean {
        return this._nodes.has(type);
    }

    /**
     * Get all registered templates
     * 获取所有注册的模板
     */
    getAllTemplates(): BlueprintNodeTemplate[] {
        return Array.from(this._nodes.values()).map(d => d.template);
    }

    /**
     * Get templates by category
     * 按类别获取模板
     */
    getTemplatesByCategory(category: string): BlueprintNodeTemplate[] {
        return this.getAllTemplates().filter(t => t.category === category);
    }

    /**
     * Search templates by keyword
     * 按关键词搜索模板
     */
    searchTemplates(keyword: string): BlueprintNodeTemplate[] {
        const lower = keyword.toLowerCase();
        return this.getAllTemplates().filter(t =>
            t.title.toLowerCase().includes(lower) ||
            t.type.toLowerCase().includes(lower) ||
            t.keywords?.some(k => k.toLowerCase().includes(lower)) ||
            t.description?.toLowerCase().includes(lower)
        );
    }

    /**
     * Clear all registrations (for testing)
     * 清除所有注册（用于测试）
     */
    clear(): void {
        this._nodes.clear();
    }
}

/**
 * Decorator for registering node executors
 * 用于注册节点执行器的装饰器
 *
 * @example
 * ```typescript
 * @RegisterNode(EventTickTemplate)
 * class EventTickExecutor implements INodeExecutor {
 *     execute(node, context) { ... }
 * }
 * ```
 */
export function RegisterNode(template: BlueprintNodeTemplate) {
    return function<T extends new () => INodeExecutor>(constructor: T) {
        const executor = new constructor();
        NodeRegistry.instance.register(template, executor);
        return constructor;
    };
}
