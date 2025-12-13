import { NodeType } from '../Types/TaskStatus';
import { NodeMetadataRegistry, ConfigFieldDefinition, NodeMetadata } from '../execution/NodeMetadata';

/**
 * 节点数据JSON格式
 */
export interface NodeDataJSON {
    nodeType: string;
    compositeType?: string;
    decoratorType?: string;
    actionType?: string;
    conditionType?: string;
    [key: string]: any;
}

/**
 * 行为树节点属性类型常量
 * Behavior tree node property type constants
 */
export const NodePropertyType = {
    /** 字符串 */
    String: 'string',
    /** 数值 */
    Number: 'number',
    /** 布尔值 */
    Boolean: 'boolean',
    /** 选择框 */
    Select: 'select',
    /** 黑板变量引用 */
    Blackboard: 'blackboard',
    /** 代码编辑器 */
    Code: 'code',
    /** 变量引用 */
    Variable: 'variable',
    /** 资产引用 */
    Asset: 'asset'
} as const;

/**
 * 节点属性类型（支持自定义扩展）
 * Node property type (supports custom extensions)
 *
 * @example
 * ```typescript
 * // 使用内置类型
 * type: NodePropertyType.String
 *
 * // 使用自定义类型
 * type: 'color-picker'
 * type: 'curve-editor'
 * ```
 */
export type NodePropertyType = (typeof NodePropertyType)[keyof typeof NodePropertyType] | string;

/**
 * 属性定义（用于编辑器）
 */
export interface PropertyDefinition {
    name: string;
    type: NodePropertyType;
    label: string;
    description?: string;
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;

    /**
     * 字段编辑器配置
     *
     * 指定使用哪个字段编辑器以及相关选项
     *
     * @example
     * ```typescript
     * fieldEditor: {
     *   type: 'asset',
     *   options: { fileExtension: '.btree' }
     * }
     * ```
     */
    fieldEditor?: {
        type: string;
        options?: Record<string, any>;
    };

    /**
     * 自定义渲染配置
     *
     * 用于指定编辑器如何渲染此属性
     *
     * @example
     * ```typescript
     * renderConfig: {
     *   component: 'ColorPicker',  // 渲染器组件名称
     *   props: {                   // 传递给组件的属性
     *     showAlpha: true,
     *     presets: ['#FF0000', '#00FF00']
     *   }
     * }
     * ```
     */
    renderConfig?: {
        /** 渲染器组件名称或路径 */
        component?: string;
        /** 传递给渲染器的属性配置 */
        props?: Record<string, any>;
        /** 渲染器的样式类名 */
        className?: string;
        /** 渲染器的内联样式 */
        style?: Record<string, any>;
        /** 其他自定义配置 */
        [key: string]: any;
    };

    /**
     * 验证规则
     *
     * 用于在编辑器中验证输入
     *
     * @example
     * ```typescript
     * validation: {
     *   pattern: /^\d+$/,
     *   message: '只能输入数字',
     *   validator: (value) => value > 0
     * }
     * ```
     */
    validation?: {
        /** 正则表达式验证 */
        pattern?: RegExp | string;
        /** 验证失败的提示信息 */
        message?: string;
        /** 自定义验证函数 */
        validator?: string; // 函数字符串，编辑器会解析
        /** 最小长度（字符串） */
        minLength?: number;
        /** 最大长度（字符串） */
        maxLength?: number;
    };

    /**
     * 是否允许多个连接
     * 默认 false，只允许一个黑板变量连接
     */
    allowMultipleConnections?: boolean;
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
    className?: string;
    componentClass?: Function;
    requiresChildren?: boolean;
    minChildren?: number;
    maxChildren?: number;
    defaultConfig: Partial<NodeDataJSON>;
    properties: PropertyDefinition[];
}

/**
 * 节点模板库
 */
export class NodeTemplates {
    /**
     * 获取所有节点模板
     */
    static getAllTemplates(): NodeTemplate[] {
        const allMetadata = NodeMetadataRegistry.getAllMetadata();
        return allMetadata.map((metadata) => this.convertMetadataToTemplate(metadata));
    }

    /**
     * 根据类型和子类型获取模板
     */
    static getTemplate(type: NodeType, subType: string): NodeTemplate | undefined {
        return this.getAllTemplates().find((t) => {
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

    /**
     * 将NodeMetadata转换为NodeTemplate
     */
    private static convertMetadataToTemplate(metadata: NodeMetadata): NodeTemplate {
        const properties = this.convertConfigSchemaToProperties(metadata.configSchema || {});

        const defaultConfig: Partial<NodeDataJSON> = {
            nodeType: this.nodeTypeToString(metadata.nodeType)
        };

        switch (metadata.nodeType) {
            case NodeType.Composite:
                defaultConfig.compositeType = metadata.implementationType;
                break;
            case NodeType.Decorator:
                defaultConfig.decoratorType = metadata.implementationType;
                break;
            case NodeType.Action:
                defaultConfig.actionType = metadata.implementationType;
                break;
            case NodeType.Condition:
                defaultConfig.conditionType = metadata.implementationType;
                break;
        }

        if (metadata.configSchema) {
            for (const [key, field] of Object.entries(metadata.configSchema)) {
                const fieldDef = field as ConfigFieldDefinition;
                if (fieldDef.default !== undefined) {
                    defaultConfig[key] = fieldDef.default;
                }
            }
        }

        // 根据节点类型生成默认颜色和图标
        const { icon, color } = this.getIconAndColorByType(metadata.nodeType, metadata.category || '');

        // 应用子节点约束
        const constraints = metadata.childrenConstraints || this.getDefaultConstraintsByNodeType(metadata.nodeType);

        const template: NodeTemplate = {
            type: metadata.nodeType,
            displayName: metadata.displayName,
            category: metadata.category || this.getCategoryByNodeType(metadata.nodeType),
            description: metadata.description || '',
            className: metadata.implementationType,
            icon,
            color,
            defaultConfig,
            properties
        };

        if (constraints) {
            if (constraints.min !== undefined) {
                template.minChildren = constraints.min;
                template.requiresChildren = constraints.min > 0;
            }
            if (constraints.max !== undefined) {
                template.maxChildren = constraints.max;
            }
        }

        return template;
    }

    /**
     * 获取节点类型的默认约束
     */
    private static getDefaultConstraintsByNodeType(nodeType: NodeType): { min?: number; max?: number } | undefined {
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

    /**
     * 将ConfigSchema转换为PropertyDefinition数组
     */
    private static convertConfigSchemaToProperties(
        configSchema: Record<string, ConfigFieldDefinition>
    ): PropertyDefinition[] {
        const properties: PropertyDefinition[] = [];

        for (const [name, field] of Object.entries(configSchema)) {
            const property: PropertyDefinition = {
                name,
                type: this.mapFieldTypeToPropertyType(field),
                label: name
            };

            if (field.description !== undefined) {
                property.description = field.description;
            }

            if (field.default !== undefined) {
                property.defaultValue = field.default;
            }

            if (field.min !== undefined) {
                property.min = field.min;
            }

            if (field.max !== undefined) {
                property.max = field.max;
            }

            if (field.allowMultipleConnections !== undefined) {
                property.allowMultipleConnections = field.allowMultipleConnections;
            }

            if (field.options) {
                property.options = field.options.map((opt) => ({
                    label: opt,
                    value: opt
                }));
            }

            if (field.supportBinding) {
                property.renderConfig = {
                    component: 'BindableInput',
                    props: {
                        supportBinding: true
                    }
                };
            }

            properties.push(property);
        }

        return properties;
    }

    /**
     * 映射字段类型到属性类型
     */
    private static mapFieldTypeToPropertyType(field: ConfigFieldDefinition): NodePropertyType {
        if (field.options && field.options.length > 0) {
            return NodePropertyType.Select;
        }

        switch (field.type) {
            case 'string':
                return NodePropertyType.String;
            case 'number':
                return NodePropertyType.Number;
            case 'boolean':
                return NodePropertyType.Boolean;
            case 'array':
            case 'object':
            default:
                return NodePropertyType.String;
        }
    }

    /**
     * NodeType转字符串
     */
    private static nodeTypeToString(nodeType: NodeType): string {
        switch (nodeType) {
            case NodeType.Composite:
                return 'composite';
            case NodeType.Decorator:
                return 'decorator';
            case NodeType.Action:
                return 'action';
            case NodeType.Condition:
                return 'condition';
            default:
                return 'unknown';
        }
    }

    /**
     * 根据NodeType获取默认分类
     */
    private static getCategoryByNodeType(nodeType: NodeType): string {
        switch (nodeType) {
            case NodeType.Composite:
                return '组合';
            case NodeType.Decorator:
                return '装饰器';
            case NodeType.Action:
                return '动作';
            case NodeType.Condition:
                return '条件';
            default:
                return '其他';
        }
    }

    /**
     * 根据节点类型获取默认图标和颜色
     */
    private static getIconAndColorByType(nodeType: NodeType, _category: string): { icon: string; color: string } {
        // 根据节点类型设置默认值
        switch (nodeType) {
            case NodeType.Composite:
                return { icon: 'GitBranch', color: '#1976d2' }; // 蓝色
            case NodeType.Decorator:
                return { icon: 'Settings', color: '#fb8c00' }; // 橙色
            case NodeType.Action:
                return { icon: 'Play', color: '#388e3c' }; // 绿色
            case NodeType.Condition:
                return { icon: 'HelpCircle', color: '#d32f2f' }; // 红色
            default:
                return { icon: 'Circle', color: '#757575' }; // 灰色
        }
    }
}
