import { NodeType } from '../Types/TaskStatus';
import { getRegisteredNodeTemplates } from '../Decorators/BehaviorNodeDecorator';

/**
 * 节点数据JSON格式（用于编辑器）
 */
export interface NodeDataJSON {
    nodeType: string;
    compositeType?: string;
    decoratorType?: string;
    [key: string]: any;
}

/**
 * 属性定义（用于编辑器）
 */
export interface PropertyDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'blackboard' | 'code' | 'variable';
    label: string;
    description?: string;
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
}

/**
 * 节点模板（用于编辑器）
 */
export interface NodeTemplate {
    type: NodeType;
    displayName: string;
    category: string;
    icon?: string;
    description: string;
    color?: string;
    defaultConfig: Partial<NodeDataJSON>;
    properties: PropertyDefinition[];
}

/**
 * 编辑器节点模板库
 *
 * 使用装饰器系统管理所有节点
 */
export class NodeTemplates {
    /**
     * 获取所有节点模板（通过装饰器注册）
     */
    static getAllTemplates(): NodeTemplate[] {
        return getRegisteredNodeTemplates();
    }

    /**
     * 根据类型和子类型获取模板
     */
    static getTemplate(type: NodeType, subType: string): NodeTemplate | undefined {
        return this.getAllTemplates().find(t => {
            if (t.type !== type) return false;
            const config: any = t.defaultConfig;

            switch (type) {
                case NodeType.Composite:
                    return config.compositeType === subType;
                case NodeType.Decorator:
                    return config.decoratorType === subType;
                case NodeType.Action:
                    return config.actionType === subType;
                case NodeType.Condition:
                    return config.conditionType === subType;
                default:
                    return false;
            }
        });
    }
}
