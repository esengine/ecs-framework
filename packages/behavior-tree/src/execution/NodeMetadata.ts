import { NodeType } from '../Types/TaskStatus';

/**
 * 配置参数定义
 */
export interface ConfigFieldDefinition {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    default?: any;
    description?: string;
    min?: number;
    max?: number;
    options?: string[];
    supportBinding?: boolean;
    allowMultipleConnections?: boolean;
}

/**
 * 子节点约束配置
 */
export interface ChildrenConstraints {
    min?: number;
    max?: number;
    required?: boolean;
}

/**
 * 节点元数据
 */
export interface NodeMetadata {
    implementationType: string;
    nodeType: NodeType;
    displayName: string;
    description?: string;
    category?: string;
    configSchema?: Record<string, ConfigFieldDefinition>;
    childrenConstraints?: ChildrenConstraints;
}

/**
 * 节点元数据默认值
 */
export class NodeMetadataDefaults {
    static getDefaultConstraints(nodeType: NodeType): ChildrenConstraints | undefined {
        switch (nodeType) {
            case NodeType.Composite:
                return { min: 1 };
            case NodeType.Decorator:
                return { min: 1, max: 1 };
            case NodeType.Action:
            case NodeType.Condition:
                return { max: 0 };
            default:
                return undefined;
        }
    }
}

/**
 * 节点元数据注册表
 */
export class NodeMetadataRegistry {
    private static metadataMap: Map<string, NodeMetadata> = new Map();
    private static executorClassMap: Map<Function, string> = new Map();
    private static executorConstructors: Map<string, new () => any> = new Map();

    static register(target: Function, metadata: NodeMetadata): void {
        this.metadataMap.set(metadata.implementationType, metadata);
        this.executorClassMap.set(target, metadata.implementationType);
        this.executorConstructors.set(metadata.implementationType, target as new () => any);
    }

    static getMetadata(implementationType: string): NodeMetadata | undefined {
        return this.metadataMap.get(implementationType);
    }

    static getAllMetadata(): NodeMetadata[] {
        return Array.from(this.metadataMap.values());
    }

    static getByCategory(category: string): NodeMetadata[] {
        return this.getAllMetadata().filter((m) => m.category === category);
    }

    static getByNodeType(nodeType: NodeType): NodeMetadata[] {
        return this.getAllMetadata().filter((m) => m.nodeType === nodeType);
    }

    static getImplementationType(executorClass: Function): string | undefined {
        return this.executorClassMap.get(executorClass);
    }

    static getExecutorConstructor(implementationType: string): (new () => any) | undefined {
        return this.executorConstructors.get(implementationType);
    }

    static getAllExecutorConstructors(): Map<string, new () => any> {
        return new Map(this.executorConstructors);
    }
}

/**
 * 节点执行器元数据装饰器
 */
export function NodeExecutorMetadata(metadata: NodeMetadata) {
    return function (target: Function) {
        NodeMetadataRegistry.register(target, metadata);
    };
}
