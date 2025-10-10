import type { Entity } from '../Entity';
import type { Component } from '../Component';
import { getSceneByEntityId } from '../Core/ReferenceTracker';
import { createLogger } from '../../Utils/Logger';

const logger = createLogger('EntityRefDecorator');

/**
 * EntityRef元数据的Symbol键
 */
export const ENTITY_REF_METADATA = Symbol('EntityRefMetadata');

/**
 * EntityRef值存储的Symbol键
 */
const ENTITY_REF_VALUES = Symbol('EntityRefValues');

/**
 * EntityRef元数据
 */
export interface EntityRefMetadata {
    properties: Set<string>;
}

/**
 * 获取或创建组件的EntityRef值存储Map
 */
function getValueMap(component: Component): Map<string, Entity | null> {
    let map = (component as any)[ENTITY_REF_VALUES];
    if (!map) {
        map = new Map<string, Entity | null>();
        (component as any)[ENTITY_REF_VALUES] = map;
    }
    return map;
}

/**
 * Entity引用装饰器
 *
 * 标记Component属性为Entity引用，自动追踪引用关系。
 * 当被引用的Entity销毁时，该属性会自动设为null。
 *
 * @example
 * ```typescript
 * class ParentComponent extends Component {
 *     @EntityRef() parent: Entity | null = null;
 * }
 *
 * const parent = scene.createEntity('Parent');
 * const child = scene.createEntity('Child');
 * const comp = child.addComponent(new ParentComponent());
 *
 * comp.parent = parent;
 * parent.destroy(); // comp.parent 自动变为 null
 * ```
 */
export function EntityRef(): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol) {
        const constructor = target.constructor;

        let metadata: EntityRefMetadata = constructor[ENTITY_REF_METADATA];
        if (!metadata) {
            metadata = {
                properties: new Set()
            };
            constructor[ENTITY_REF_METADATA] = metadata;
        }

        const propKeyString = typeof propertyKey === 'symbol' ? propertyKey.toString() : propertyKey;
        metadata.properties.add(propKeyString);

        Object.defineProperty(target, propertyKey, {
            get: function (this: Component) {
                const valueMap = getValueMap(this);
                return valueMap.get(propKeyString) || null;
            },
            set: function (this: Component, newValue: Entity | null) {
                const valueMap = getValueMap(this);
                const oldValue = valueMap.get(propKeyString) || null;

                if (oldValue === newValue) {
                    return;
                }

                const scene = this.entityId !== null ? getSceneByEntityId(this.entityId) : null;

                if (!scene || !scene.referenceTracker) {
                    valueMap.set(propKeyString, newValue);
                    return;
                }

                const tracker = scene.referenceTracker;

                if (oldValue) {
                    tracker.unregisterReference(oldValue, this, propKeyString);
                }

                if (newValue) {
                    if (newValue.scene !== scene) {
                        logger.error(`Cannot reference Entity from different Scene. Entity: ${newValue.name}, Scene: ${newValue.scene?.name || 'null'}`);
                        return;
                    }

                    if (newValue.isDestroyed) {
                        logger.warn(`Cannot reference destroyed Entity: ${newValue.name}`);
                        valueMap.set(propKeyString, null);
                        return;
                    }

                    tracker.registerReference(newValue, this, propKeyString);
                }

                valueMap.set(propKeyString, newValue);
            },
            enumerable: true,
            configurable: true
        });
    };
}

/**
 * 获取Component的EntityRef元数据
 *
 * @param component Component实例或Component类
 * @returns EntityRef元数据，如果不存在则返回null
 */
export function getEntityRefMetadata(component: any): EntityRefMetadata | null {
    if (!component) {
        return null;
    }

    const constructor = typeof component === 'function'
        ? component
        : component.constructor;

    return constructor[ENTITY_REF_METADATA] || null;
}

/**
 * 检查Component是否有EntityRef属性
 *
 * @param component Component实例或Component类
 * @returns 如果有EntityRef属性返回true
 */
export function hasEntityRef(component: any): boolean {
    return getEntityRefMetadata(component) !== null;
}
