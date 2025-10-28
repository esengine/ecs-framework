import { NodeType } from '../Types/TaskStatus';
import { getRegisteredNodeTemplates } from '../Decorators/BehaviorNodeDecorator';

/**
 * 节点数据JSON格式
 */
export interface NodeDataJSON {
    nodeType: string;
    compositeType?: string;
    decoratorType?: string;
    [key: string]: any;
}

/**
 * 内置属性类型常量
 */
export const PropertyType = {
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
 * 属性类型（支持自定义扩展）
 *
 * @example
 * ```typescript
 * // 使用内置类型
 * type: PropertyType.String
 *
 * // 使用自定义类型
 * type: 'color-picker'
 * type: 'curve-editor'
 * ```
 */
export type PropertyType = typeof PropertyType[keyof typeof PropertyType] | string;

/**
 * 属性定义（用于编辑器）
 */
export interface PropertyDefinition {
    name: string;
    type: PropertyType;
    label: string;
    description?: string;
    defaultValue?: any;
    options?: Array<{ label: string; value: any }>;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;

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
        validator?: string;  // 函数字符串，编辑器会解析
        /** 最小长度（字符串） */
        minLength?: number;
        /** 最大长度（字符串） */
        maxLength?: number;
    };
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
