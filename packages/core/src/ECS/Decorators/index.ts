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
