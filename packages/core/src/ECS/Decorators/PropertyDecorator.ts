import 'reflect-metadata';

export type PropertyType = 'number' | 'integer' | 'string' | 'boolean' | 'color' | 'vector2' | 'vector3' | 'enum' | 'asset' | 'animationClips';

/**
 * Action button configuration for property fields
 * 属性字段的操作按钮配置
 */
export interface PropertyAction {
    /** Action identifier | 操作标识符 */
    id: string;
    /** Button label | 按钮标签 */
    label: string;
    /** Button tooltip | 按钮提示 */
    tooltip?: string;
    /** Icon name from Lucide | Lucide图标名称 */
    icon?: string;
}

/**
 * 控制关系声明
 * Control relationship declaration
 */
export interface PropertyControl {
    /** 被控制的组件名称 | Target component name */
    component: string;
    /** 被控制的属性名称 | Target property name */
    property: string;
}

export interface PropertyOptions {
    /** 属性类型 */
    type: PropertyType;
    /** 显示标签 */
    label?: string;
    /** 最小值 (number/integer) */
    min?: number;
    /** 最大值 (number/integer) */
    max?: number;
    /** 步进值 (number/integer) */
    step?: number;
    /** 枚举选项 (enum) */
    options?: Array<{ label: string; value: any }>;
    /** 是否只读 */
    readOnly?: boolean;
    /** 资源文件扩展名 (asset) */
    fileExtension?: string;
    /** Action buttons for this property | 属性的操作按钮 */
    actions?: PropertyAction[];
    /** 此属性控制的其他组件属性 | Properties this field controls */
    controls?: PropertyControl[];
}

export const PROPERTY_METADATA = Symbol('property:metadata');

/**
 * 属性装饰器 - 声明组件属性的编辑器元数据
 *
 * @example
 * ```typescript
 * @ECSComponent('Transform')
 * export class TransformComponent extends Component {
 *     @Property({ type: 'vector3', label: 'Position' })
 *     public position: Vector3 = { x: 0, y: 0, z: 0 };
 *
 *     @Property({ type: 'number', label: 'Speed', min: 0, max: 100 })
 *     public speed: number = 10;
 * }
 * ```
 */
export function Property(options: PropertyOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        const constructor = target.constructor;
        const existingMetadata = Reflect.getMetadata(PROPERTY_METADATA, constructor) || {};

        existingMetadata[propertyKey as string] = options;

        Reflect.defineMetadata(PROPERTY_METADATA, existingMetadata, constructor);
    };
}

/**
 * 获取组件类的所有属性元数据
 */
export function getPropertyMetadata(target: Function): Record<string, PropertyOptions> | undefined {
    return Reflect.getMetadata(PROPERTY_METADATA, target);
}

/**
 * 检查组件类是否有属性元数据
 */
export function hasPropertyMetadata(target: Function): boolean {
    return Reflect.hasMetadata(PROPERTY_METADATA, target);
}
