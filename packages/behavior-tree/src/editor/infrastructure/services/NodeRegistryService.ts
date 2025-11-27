import { NodeTemplate, NodeMetadataRegistry, NodeMetadata, NodeType } from '../../..';

/**
 * 简化的节点注册配置
 */
export interface NodeRegistrationConfig {
    type: 'composite' | 'decorator' | 'action' | 'condition';
    implementationType: string;
    displayName: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    properties?: NodePropertyConfig[];
    minChildren?: number;
    maxChildren?: number;
}

/**
 * 节点属性配置
 */
export interface NodePropertyConfig {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'blackboard' | 'code';
    label: string;
    description?: string;
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
    min?: number;
    max?: number;
    required?: boolean;
}

/**
 * 节点注册服务
 * 提供编辑器级别的节点注册和管理功能
 */
export class NodeRegistryService {
    private static instance: NodeRegistryService;
    private customTemplates: Map<string, NodeTemplate> = new Map();
    private registrationCallbacks: Array<(template: NodeTemplate) => void> = [];

    private constructor() {}

    static getInstance(): NodeRegistryService {
        if (!this.instance) {
            this.instance = new NodeRegistryService();
        }
        return this.instance;
    }

    /**
     * 注册自定义节点类型
     */
    registerNode(config: NodeRegistrationConfig): void {
        const nodeType = this.mapStringToNodeType(config.type);

        const metadata: NodeMetadata = {
            implementationType: config.implementationType,
            nodeType: nodeType,
            displayName: config.displayName,
            description: config.description || '',
            category: config.category || this.getDefaultCategory(config.type),
            configSchema: this.convertPropertiesToSchema(config.properties || []),
            childrenConstraints: this.getChildrenConstraints(config)
        };

        class DummyExecutor {}
        NodeMetadataRegistry.register(DummyExecutor, metadata);

        const template = this.createTemplate(config, metadata);
        this.customTemplates.set(config.implementationType, template);

        this.registrationCallbacks.forEach((cb) => cb(template));
    }

    /**
     * 注销节点类型
     */
    unregisterNode(implementationType: string): boolean {
        return this.customTemplates.delete(implementationType);
    }

    /**
     * 获取所有自定义模板
     */
    getCustomTemplates(): NodeTemplate[] {
        return Array.from(this.customTemplates.values());
    }

    /**
     * 检查节点类型是否已注册
     */
    hasNode(implementationType: string): boolean {
        return this.customTemplates.has(implementationType) ||
               NodeMetadataRegistry.getMetadata(implementationType) !== undefined;
    }

    /**
     * 监听节点注册事件
     */
    onNodeRegistered(callback: (template: NodeTemplate) => void): () => void {
        this.registrationCallbacks.push(callback);
        return () => {
            const index = this.registrationCallbacks.indexOf(callback);
            if (index > -1) {
                this.registrationCallbacks.splice(index, 1);
            }
        };
    }

    private mapStringToNodeType(type: string): NodeType {
        switch (type) {
            case 'composite': return NodeType.Composite;
            case 'decorator': return NodeType.Decorator;
            case 'action': return NodeType.Action;
            case 'condition': return NodeType.Condition;
            default: return NodeType.Action;
        }
    }

    private getDefaultCategory(type: string): string {
        switch (type) {
            case 'composite': return '组合';
            case 'decorator': return '装饰器';
            case 'action': return '动作';
            case 'condition': return '条件';
            default: return '其他';
        }
    }

    private convertPropertiesToSchema(properties: NodePropertyConfig[]): Record<string, any> {
        const schema: Record<string, any> = {};

        for (const prop of properties) {
            schema[prop.name] = {
                type: this.mapPropertyType(prop.type),
                default: prop.defaultValue,
                description: prop.description,
                min: prop.min,
                max: prop.max,
                options: prop.options?.map((o) => o.value)
            };
        }

        return schema;
    }

    private mapPropertyType(type: string): string {
        switch (type) {
            case 'string':
            case 'code':
            case 'blackboard':
            case 'select':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            default:
                return 'string';
        }
    }

    private getChildrenConstraints(config: NodeRegistrationConfig): { min?: number; max?: number } | undefined {
        if (config.minChildren !== undefined || config.maxChildren !== undefined) {
            return {
                min: config.minChildren,
                max: config.maxChildren
            };
        }

        switch (config.type) {
            case 'composite':
                return { min: 1 };
            case 'decorator':
                return { min: 1, max: 1 };
            case 'action':
            case 'condition':
                return { max: 0 };
            default:
                return undefined;
        }
    }

    private createTemplate(config: NodeRegistrationConfig, metadata: NodeMetadata): NodeTemplate {
        const defaultConfig: any = {
            nodeType: config.type
        };

        switch (config.type) {
            case 'composite':
                defaultConfig.compositeType = config.implementationType;
                break;
            case 'decorator':
                defaultConfig.decoratorType = config.implementationType;
                break;
            case 'action':
                defaultConfig.actionType = config.implementationType;
                break;
            case 'condition':
                defaultConfig.conditionType = config.implementationType;
                break;
        }

        for (const prop of config.properties || []) {
            if (prop.defaultValue !== undefined) {
                defaultConfig[prop.name] = prop.defaultValue;
            }
        }

        const template: NodeTemplate = {
            type: metadata.nodeType,
            displayName: config.displayName,
            category: config.category || this.getDefaultCategory(config.type),
            description: config.description || '',
            icon: config.icon || this.getDefaultIcon(config.type),
            color: config.color || this.getDefaultColor(config.type),
            className: config.implementationType,
            defaultConfig,
            properties: (config.properties || []).map((p) => ({
                name: p.name,
                type: p.type,
                label: p.label,
                description: p.description,
                defaultValue: p.defaultValue,
                options: p.options,
                min: p.min,
                max: p.max,
                required: p.required
            }))
        };

        if (config.minChildren !== undefined) {
            template.minChildren = config.minChildren;
            template.requiresChildren = config.minChildren > 0;
        }
        if (config.maxChildren !== undefined) {
            template.maxChildren = config.maxChildren;
        }

        return template;
    }

    private getDefaultIcon(type: string): string {
        switch (type) {
            case 'composite': return 'GitBranch';
            case 'decorator': return 'Settings';
            case 'action': return 'Play';
            case 'condition': return 'HelpCircle';
            default: return 'Circle';
        }
    }

    private getDefaultColor(type: string): string {
        switch (type) {
            case 'composite': return '#1976d2';
            case 'decorator': return '#fb8c00';
            case 'action': return '#388e3c';
            case 'condition': return '#d32f2f';
            default: return '#757575';
        }
    }
}
