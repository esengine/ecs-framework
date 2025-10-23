import { NodeTemplate, PropertyDefinition } from '../Serialization/NodeTemplates';
import { NodeType } from '../Types/TaskStatus';

/**
 * 行为树节点元数据
 */
export interface BehaviorNodeMetadata {
    displayName: string;
    category: string;
    type: NodeType;
    icon?: string;
    description: string;
    color?: string;
    className?: string;
}

/**
 * 节点类注册表
 */
class NodeClassRegistry {
    private static nodeClasses = new Map<string, {
        metadata: BehaviorNodeMetadata;
        constructor: any;
    }>();

    static registerNodeClass(constructor: any, metadata: BehaviorNodeMetadata): void {
        const key = `${metadata.category}:${metadata.displayName}`;
        this.nodeClasses.set(key, { metadata, constructor });
    }

    static getAllNodeClasses(): Array<{ metadata: BehaviorNodeMetadata; constructor: any }> {
        return Array.from(this.nodeClasses.values());
    }

    static getNodeClass(category: string, displayName: string): any {
        const key = `${category}:${displayName}`;
        return this.nodeClasses.get(key)?.constructor;
    }

    static clear(): void {
        this.nodeClasses.clear();
    }
}

/**
 * 行为树节点装饰器
 *
 * 用于标注一个类是可在编辑器中使用的行为树节点
 *
 * @example
 * ```typescript
 * @BehaviorNode({
 *   displayName: '等待',
 *   category: '动作',
 *   type: NodeType.Action,
 *   icon: 'Clock',
 *   description: '等待指定时间',
 *   color: '#9E9E9E'
 * })
 * class WaitNode extends Component {
 *   @BehaviorProperty({
 *     label: '持续时间',
 *     type: 'number',
 *     min: 0,
 *     step: 0.1,
 *     description: '等待时间（秒）'
 *   })
 *   duration: number = 1.0;
 * }
 * ```
 */
export function BehaviorNode(metadata: BehaviorNodeMetadata) {
    return function <T extends { new (...args: any[]): any }>(constructor: T) {
        const metadataWithClassName = {
            ...metadata,
            className: constructor.name
        };
        NodeClassRegistry.registerNodeClass(constructor, metadataWithClassName);
        return constructor;
    };
}

/**
 * 行为树属性装饰器
 *
 * 用于标注节点的可配置属性，这些属性会在编辑器中显示
 *
 * @example
 * ```typescript
 * @BehaviorNode({ ... })
 * class MyNode {
 *   @BehaviorProperty({
 *     label: '速度',
 *     type: 'number',
 *     min: 0,
 *     max: 100,
 *     description: '移动速度'
 *   })
 *   speed: number = 10;
 * }
 * ```
 */
export function BehaviorProperty(config: Omit<PropertyDefinition, 'name' | 'defaultValue'>) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor.__nodeProperties) {
            target.constructor.__nodeProperties = [];
        }
        target.constructor.__nodeProperties.push({
            name: propertyKey,
            ...config
        });
    };
}

/**
 * @deprecated 使用 BehaviorProperty 代替
 */
export const NodeProperty = BehaviorProperty;

/**
 * 获取所有注册的节点模板
 */
export function getRegisteredNodeTemplates(): NodeTemplate[] {
    return NodeClassRegistry.getAllNodeClasses().map(({ metadata, constructor }) => {
        // 从类的 __nodeProperties 收集属性定义
        const propertyDefs = constructor.__nodeProperties || [];

        const defaultConfig: any = {
            nodeType: metadata.type.toLowerCase()
        };

        // 从类的默认值中提取配置，并补充 defaultValue
        const instance = new constructor();
        const properties: PropertyDefinition[] = propertyDefs.map((prop: PropertyDefinition) => {
            const defaultValue = instance[prop.name];
            if (defaultValue !== undefined) {
                defaultConfig[prop.name] = defaultValue;
            }
            return {
                ...prop,
                defaultValue: defaultValue !== undefined ? defaultValue : prop.defaultValue
            };
        });

        // 添加子类型字段
        switch (metadata.type) {
            case NodeType.Composite:
                defaultConfig.compositeType = metadata.displayName;
                break;
            case NodeType.Decorator:
                defaultConfig.decoratorType = metadata.displayName;
                break;
            case NodeType.Action:
                defaultConfig.actionType = metadata.displayName;
                break;
            case NodeType.Condition:
                defaultConfig.conditionType = metadata.displayName;
                break;
        }

        return {
            type: metadata.type,
            displayName: metadata.displayName,
            category: metadata.category,
            icon: metadata.icon,
            description: metadata.description,
            color: metadata.color,
            className: metadata.className,
            defaultConfig,
            properties
        };
    });
}

/**
 * 清空所有注册的节点类
 */
export function clearRegisteredNodes(): void {
    NodeClassRegistry.clear();
}

export { NodeClassRegistry };
