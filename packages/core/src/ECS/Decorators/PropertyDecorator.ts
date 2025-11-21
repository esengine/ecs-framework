import 'reflect-metadata';

export type PropertyType = 'number' | 'integer' | 'string' | 'boolean' | 'color' | 'vector2' | 'vector3' | 'enum' | 'asset';

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
