// ============================================================================
// Component Type Utilities (from ComponentTypeUtils - no circular deps)
// 组件类型工具（来自 ComponentTypeUtils - 无循环依赖）
// ============================================================================
export {
    COMPONENT_TYPE_NAME,
    COMPONENT_DEPENDENCIES,
    COMPONENT_EDITOR_OPTIONS,
    getComponentTypeName,
    getComponentInstanceTypeName,
    getComponentDependencies,
    getComponentEditorOptions,
    getComponentInstanceEditorOptions,
    isComponentHiddenInInspector,
    isComponentInstanceHiddenInInspector,
    hasECSComponentDecorator
} from '../Core/ComponentStorage/ComponentTypeUtils';

export type { ComponentType, ComponentEditorOptions } from '../Core/ComponentStorage/ComponentTypeUtils';

// ============================================================================
// Type Decorators (ECSComponent, ECSSystem)
// 类型装饰器
// ============================================================================
export {
    ECSComponent,
    ECSSystem,
    getSystemTypeName,
    getSystemInstanceTypeName,
    getSystemMetadata,
    SYSTEM_TYPE_NAME
} from './TypeDecorators';

export type { SystemMetadata, ComponentOptions } from './TypeDecorators';

// ============================================================================
// Entity Reference Decorator
// 实体引用装饰器
// ============================================================================
export {
    EntityRef,
    getEntityRefMetadata,
    hasEntityRef,
    isEntityRefProperty,
    getEntityRefProperties,
    ENTITY_REF_METADATA
} from './EntityRefDecorator';

export type { EntityRefMetadata } from './EntityRefDecorator';

// ============================================================================
// Property Decorator
// 属性装饰器
// ============================================================================
export {
    Property,
    getPropertyMetadata,
    hasPropertyMetadata,
    PROPERTY_METADATA
} from './PropertyDecorator';

export type {
    PropertyOptions,
    PropertyType,
    PropertyControl,
    PropertyAction,
    PropertyAssetType,
    EnumOption
} from './PropertyDecorator';
