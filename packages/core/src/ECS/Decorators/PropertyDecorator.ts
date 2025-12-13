import 'reflect-metadata';

export type PropertyType = 'number' | 'integer' | 'string' | 'boolean' | 'color' | 'vector2' | 'vector3' | 'enum' | 'asset' | 'array' | 'animationClips' | 'collisionLayer' | 'collisionMask';

/**
 * 属性资源类型
 * Asset type for property decorators
 */
export type PropertyAssetType = 'texture' | 'audio' | 'scene' | 'prefab' | 'animation' | 'any';

/** @deprecated Use PropertyAssetType instead */
export type AssetType = PropertyAssetType;

/**
 * 枚举选项 - 支持简单字符串或带标签的对象
 * Enum option - supports simple string or labeled object
 */
export type EnumOption = string | { label: string; value: any };

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

/**
 * 属性基础选项
 * Base property options shared by all types
 */
interface PropertyOptionsBase {
    /** 显示标签 | Display label */
    label?: string;
    /** 是否只读 | Read-only flag */
    readOnly?: boolean;
    /** Action buttons | 操作按钮 */
    actions?: PropertyAction[];
    /** 此属性控制的其他组件属性 | Properties this field controls */
    controls?: PropertyControl[];
}

/**
 * 数值类型属性选项
 * Number property options
 */
interface NumberPropertyOptions extends PropertyOptionsBase {
    type: 'number' | 'integer';
    min?: number;
    max?: number;
    step?: number;
}

/**
 * 字符串类型属性选项
 * String property options
 */
interface StringPropertyOptions extends PropertyOptionsBase {
    type: 'string';
    /** 多行文本 | Multiline text */
    multiline?: boolean;
}

/**
 * 布尔类型属性选项
 * Boolean property options
 */
interface BooleanPropertyOptions extends PropertyOptionsBase {
    type: 'boolean';
}

/**
 * 颜色类型属性选项
 * Color property options
 */
interface ColorPropertyOptions extends PropertyOptionsBase {
    type: 'color';
    /** 是否包含透明度 | Include alpha channel */
    alpha?: boolean;
}

/**
 * 向量类型属性选项
 * Vector property options
 */
interface VectorPropertyOptions extends PropertyOptionsBase {
    type: 'vector2' | 'vector3';
}

/**
 * 枚举类型属性选项
 * Enum property options
 */
interface EnumPropertyOptions extends PropertyOptionsBase {
    type: 'enum';
    /** 枚举选项列表 | Enum options list */
    options: EnumOption[];
}

/**
 * 资源类型属性选项
 * Asset property options
 */
interface AssetPropertyOptions extends PropertyOptionsBase {
    type: 'asset';
    /** 资源类型 | Asset type */
    assetType?: PropertyAssetType;
    /** 文件扩展名过滤 | File extension filter */
    extensions?: string[];
}

/**
 * 数组元素类型选项
 * Array item type options
 */
export type ArrayItemType =
    | { type: 'string' }
    | { type: 'number'; min?: number; max?: number }
    | { type: 'integer'; min?: number; max?: number }
    | { type: 'boolean' }
    | { type: 'asset'; assetType?: PropertyAssetType; extensions?: string[] }
    | { type: 'vector2' }
    | { type: 'vector3' }
    | { type: 'color'; alpha?: boolean }
    | { type: 'enum'; options: EnumOption[] };

/**
 * 数组类型属性选项
 * Array property options
 *
 * @example
 * ```typescript
 * @Property({
 *     type: 'array',
 *     label: 'Particle Assets',
 *     itemType: { type: 'asset', extensions: ['.particle'] }
 * })
 * public particleAssets: string[] = [];
 * ```
 */
interface ArrayPropertyOptions extends PropertyOptionsBase {
    type: 'array';
    /** 数组元素类型 | Array item type */
    itemType: ArrayItemType;
    /** 最小数组长度 | Minimum array length */
    minLength?: number;
    /** 最大数组长度 | Maximum array length */
    maxLength?: number;
    /** 是否允许重排序 | Allow reordering */
    reorderable?: boolean;
}

/**
 * 动画剪辑类型属性选项
 * Animation clips property options
 */
interface AnimationClipsPropertyOptions extends PropertyOptionsBase {
    type: 'animationClips';
}

/**
 * 碰撞层属性选项
 * Collision layer property options
 */
interface CollisionLayerPropertyOptions extends PropertyOptionsBase {
    type: 'collisionLayer';
}

/**
 * 碰撞掩码属性选项
 * Collision mask property options
 */
interface CollisionMaskPropertyOptions extends PropertyOptionsBase {
    type: 'collisionMask';
}

/**
 * 属性选项联合类型
 * Property options union type
 */
export type PropertyOptions =
    | NumberPropertyOptions
    | StringPropertyOptions
    | BooleanPropertyOptions
    | ColorPropertyOptions
    | VectorPropertyOptions
    | EnumPropertyOptions
    | AssetPropertyOptions
    | ArrayPropertyOptions
    | AnimationClipsPropertyOptions
    | CollisionLayerPropertyOptions
    | CollisionMaskPropertyOptions;

// 使用 Symbol.for 创建全局 Symbol，确保跨包共享元数据
// Use Symbol.for to create a global Symbol to ensure metadata sharing across packages
export const PROPERTY_METADATA = Symbol.for('@esengine/property:metadata');

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
    return (target: object, propertyKey: string | symbol) => {
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
