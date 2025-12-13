/**
 * ECS序列化系统
 *
 * 提供完整的场景、实体和组件序列化支持
 */

// 装饰器
export {
    Serializable,
    Serialize,
    SerializeAsMap,
    SerializeAsSet,
    IgnoreSerialization,
    getSerializationMetadata,
    isSerializable,
    SERIALIZABLE_METADATA,
    SERIALIZE_FIELD,
    SERIALIZE_OPTIONS
} from './SerializationDecorators';

export type {
    SerializableOptions,
    FieldSerializeOptions,
    SerializationMetadata
} from './SerializationDecorators';

// 组件序列化器
export { ComponentSerializer } from './ComponentSerializer';
export type { SerializedComponent } from './ComponentSerializer';

// 实体序列化器
export { EntitySerializer } from './EntitySerializer';
export type { SerializedEntity } from './EntitySerializer';

// 场景序列化器
export { SceneSerializer } from './SceneSerializer';
export type {
    SerializedScene,
    SerializationFormat,
    DeserializationStrategy,
    MigrationFunction,
    SceneSerializationOptions,
    SceneDeserializationOptions
} from './SceneSerializer';

// 版本迁移
export { VersionMigrationManager, MigrationBuilder } from './VersionMigration';
export type {
    ComponentMigrationFunction,
    SceneMigrationFunction
} from './VersionMigration';

// 增量序列化
export { IncrementalSerializer, ChangeOperation } from './IncrementalSerializer';
export type {
    IncrementalSnapshot,
    IncrementalSerializationOptions,
    IncrementalSerializationFormat,
    EntityChange,
    ComponentChange,
    SceneDataChange
} from './IncrementalSerializer';

// 预制体序列化
export { PrefabSerializer, PREFAB_FORMAT_VERSION } from './PrefabSerializer';
export type {
    SerializedPrefabEntity,
    PrefabMetadata,
    PrefabComponentTypeEntry,
    PrefabData,
    PrefabCreateOptions,
    PrefabInstantiateOptions
} from './PrefabSerializer';

// 序列化上下文
export { SerializationContext } from './SerializationContext';
export type { SerializedEntityRef } from './SerializationContext';
