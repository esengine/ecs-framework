export {
    ECSComponent,
    ECSSystem,
    getComponentTypeName,
    getSystemTypeName,
    getComponentInstanceTypeName,
    getSystemInstanceTypeName,
    getSystemMetadata,
    COMPONENT_TYPE_NAME,
    SYSTEM_TYPE_NAME
} from './TypeDecorators';

export type { SystemMetadata } from './TypeDecorators';

export {
    EntityRef,
    getEntityRefMetadata,
    hasEntityRef,
    ENTITY_REF_METADATA
} from './EntityRefDecorator';

export type { EntityRefMetadata } from './EntityRefDecorator';

export {
    Property,
    getPropertyMetadata,
    hasPropertyMetadata,
    PROPERTY_METADATA
} from './PropertyDecorator';

export type { PropertyOptions, PropertyType } from './PropertyDecorator';
