/**
 * 预制体服务
 * Prefab service
 *
 * 提供预制体实例管理功能：应用修改到源预制体、还原实例、断开链接等。
 * Provides prefab instance management: apply to source, revert instance, break link, etc.
 */

import { Injectable, IService, Entity, Core, createLogger } from '@esengine/ecs-framework';
import { PrefabInstanceComponent, PrefabSerializer, PrefabData, ComponentRegistry, ComponentType, HierarchySystem } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';

const logger = createLogger('PrefabService');

/**
 * 预制体属性覆盖信息
 * Prefab property override info
 */
export interface PrefabPropertyOverride {
    /** 组件类型名称 | Component type name */
    componentType: string;
    /** 属性路径 | Property path */
    propertyPath: string;
    /** 当前值 | Current value */
    currentValue: unknown;
    /** 原始值（来自源预制体）| Original value (from source prefab) */
    originalValue?: unknown;
}

/**
 * 文件 API 接口（用于依赖注入）
 * File API interface (for dependency injection)
 */
export interface IPrefabFileAPI {
    readFileContent(path: string): Promise<string>;
    writeFileContent(path: string, content: string): Promise<void>;
    pathExists(path: string): Promise<boolean>;
}

/**
 * 预制体服务
 * Prefab service
 *
 * 提供预制体实例的管理功能。
 * Provides prefab instance management functionality.
 */
@Injectable()
export class PrefabService implements IService {
    private fileAPI: IPrefabFileAPI | null = null;

    constructor(private messageHub: MessageHub) {}

    /**
     * 设置文件 API
     * Set file API
     *
     * @param fileAPI - 文件 API 实例 | File API instance
     */
    public setFileAPI(fileAPI: IPrefabFileAPI): void {
        this.fileAPI = fileAPI;
    }

    public dispose(): void {
        this.fileAPI = null;
    }

    /**
     * 检查实体是否为预制体实例
     * Check if entity is a prefab instance
     *
     * @param entity - 要检查的实体 | Entity to check
     * @returns 是否为预制体实例 | Whether it's a prefab instance
     */
    public isPrefabInstance(entity: Entity): boolean {
        return PrefabSerializer.isPrefabInstance(entity);
    }

    /**
     * 检查实体是否为预制体实例的根节点
     * Check if entity is the root of a prefab instance
     *
     * @param entity - 要检查的实体 | Entity to check
     * @returns 是否为根节点 | Whether it's the root
     */
    public isPrefabInstanceRoot(entity: Entity): boolean {
        const comp = entity.getComponent(PrefabInstanceComponent);
        return comp?.isRoot ?? false;
    }

    /**
     * 获取预制体实例组件
     * Get prefab instance component
     *
     * @param entity - 实体 | Entity
     * @returns 预制体实例组件，如果不是实例则返回 null | Component or null if not an instance
     */
    public getPrefabInstanceComponent(entity: Entity): PrefabInstanceComponent | null {
        return entity.getComponent(PrefabInstanceComponent) ?? null;
    }

    /**
     * 获取预制体实例的根实体
     * Get root entity of prefab instance
     *
     * @param entity - 预制体实例中的任意实体 | Any entity in the prefab instance
     * @returns 根实体，如果不是实例则返回 null | Root entity or null
     */
    public getPrefabInstanceRoot(entity: Entity): Entity | null {
        return PrefabSerializer.getPrefabInstanceRoot(entity);
    }

    /**
     * 获取实例相对于源预制体的所有属性覆盖
     * Get all property overrides of instance relative to source prefab
     *
     * @param entity - 预制体实例 | Prefab instance
     * @returns 属性覆盖列表 | List of property overrides
     */
    public getOverrides(entity: Entity): PrefabPropertyOverride[] {
        const comp = entity.getComponent(PrefabInstanceComponent);
        if (!comp) return [];

        const overrides: PrefabPropertyOverride[] = [];
        for (const key of comp.modifiedProperties) {
            const [componentType, ...pathParts] = key.split('.');
            const propertyPath = pathParts.join('.');

            // 获取当前值 | Get current value
            let currentValue: unknown = undefined;
            for (const compInstance of entity.components) {
                const typeName = (compInstance.constructor as any).__componentTypeName || compInstance.constructor.name;
                if (typeName === componentType) {
                    currentValue = this.getNestedValue(compInstance, propertyPath);
                    break;
                }
            }

            // 获取原始值 | Get original value
            const originalValue = comp.getOriginalValue?.(key);

            overrides.push({
                componentType,
                propertyPath,
                currentValue,
                originalValue
            });
        }

        return overrides;
    }

    /**
     * 检查实例是否有修改
     * Check if instance has modifications
     *
     * @param entity - 预制体实例 | Prefab instance
     * @returns 是否有修改 | Whether it has modifications
     */
    public hasModifications(entity: Entity): boolean {
        const comp = entity.getComponent(PrefabInstanceComponent);
        return comp ? comp.modifiedProperties.length > 0 : false;
    }

    /**
     * 获取实例的修改数量
     * Get modification count of instance
     *
     * @param entity - 预制体实例 | Prefab instance
     * @returns 修改数量 | Number of modifications
     */
    public getModificationCount(entity: Entity): number {
        const comp = entity.getComponent(PrefabInstanceComponent);
        return comp?.modifiedProperties.length ?? 0;
    }

    /**
     * 将实例的修改应用到源预制体
     * Apply instance modifications to source prefab
     *
     * @param entity - 预制体实例（必须是根节点）| Prefab instance (must be root)
     * @returns 是否成功应用 | Whether application was successful
     */
    public async applyToPrefab(entity: Entity): Promise<boolean> {
        if (!this.fileAPI) {
            logger.error('File API not set, cannot apply to prefab');
            return false;
        }

        const comp = entity.getComponent(PrefabInstanceComponent);
        if (!comp) {
            logger.warn('Entity is not a prefab instance');
            return false;
        }

        if (!comp.isRoot) {
            logger.warn('Can only apply from root prefab instance');
            return false;
        }

        const prefabPath = comp.sourcePrefabPath;
        if (!prefabPath) {
            logger.warn('Source prefab path not found');
            return false;
        }

        try {
            // 检查源文件是否存在 | Check if source file exists
            const exists = await this.fileAPI.pathExists(prefabPath);
            if (!exists) {
                logger.error(`Source prefab file not found: ${prefabPath}`);
                return false;
            }

            // 读取原始预制体以获取 GUID | Read original prefab to get GUID
            const originalContent = await this.fileAPI.readFileContent(prefabPath);
            const originalPrefabData = PrefabSerializer.deserialize(originalContent);
            const originalGuid = originalPrefabData.metadata.guid;

            // 获取层级系统 | Get hierarchy system
            const scene = Core.scene;
            const hierarchySystem = scene?.getSystem(HierarchySystem) ?? undefined;

            // 从当前实例创建新的预制体数据 | Create new prefab data from current instance
            const newPrefabData = PrefabSerializer.createPrefab(
                entity,
                {
                    name: originalPrefabData.metadata.name,
                    description: originalPrefabData.metadata.description,
                    tags: originalPrefabData.metadata.tags,
                    includeChildren: true
                },
                hierarchySystem
            );

            // 保留原有 GUID 并更新修改时间 | Preserve original GUID and update modified time
            newPrefabData.metadata.guid = originalGuid;
            newPrefabData.metadata.createdAt = originalPrefabData.metadata.createdAt;
            newPrefabData.metadata.modifiedAt = Date.now();

            // 序列化并保存 | Serialize and save
            const json = PrefabSerializer.serialize(newPrefabData, true);
            await this.fileAPI.writeFileContent(prefabPath, json);

            // 清除修改记录 | Clear modification records
            comp.clearAllModifications();

            logger.info(`Applied changes to prefab: ${prefabPath}`);

            // 发布事件 | Publish event
            await this.messageHub.publish('prefab:applied', {
                entityId: entity.id,
                prefabPath,
                prefabGuid: originalGuid
            });

            return true;
        } catch (error) {
            logger.error('Failed to apply to prefab:', error);
            return false;
        }
    }

    /**
     * 将实例还原为源预制体的状态
     * Revert instance to source prefab state
     *
     * @param entity - 预制体实例（必须是根节点）| Prefab instance (must be root)
     * @returns 是否成功还原 | Whether revert was successful
     */
    public async revertInstance(entity: Entity): Promise<boolean> {
        if (!this.fileAPI) {
            logger.error('File API not set, cannot revert instance');
            return false;
        }

        const comp = entity.getComponent(PrefabInstanceComponent);
        if (!comp) {
            logger.warn('Entity is not a prefab instance');
            return false;
        }

        if (!comp.isRoot) {
            logger.warn('Can only revert root prefab instance');
            return false;
        }

        const prefabPath = comp.sourcePrefabPath;
        if (!prefabPath) {
            logger.warn('Source prefab path not found');
            return false;
        }

        try {
            // 读取源预制体 | Read source prefab
            const content = await this.fileAPI.readFileContent(prefabPath);
            const prefabData = PrefabSerializer.deserialize(content);

            // 还原所有修改的属性 | Revert all modified properties
            for (const key of [...comp.modifiedProperties]) {
                const [componentType, ...pathParts] = key.split('.');
                const propertyPath = pathParts.join('.');

                // 从 originalValues 获取原始值 | Get original value from originalValues
                const originalValue = comp.getOriginalValue?.(key);
                if (originalValue !== undefined) {
                    // 应用原始值到组件 | Apply original value to component
                    for (const compInstance of entity.components) {
                        const typeName = (compInstance.constructor as any).__componentTypeName || compInstance.constructor.name;
                        if (typeName === componentType) {
                            this.setNestedValue(compInstance, propertyPath, originalValue);
                            break;
                        }
                    }
                }
            }

            // 清除修改记录 | Clear modification records
            comp.clearAllModifications();

            logger.info(`Reverted prefab instance: ${entity.name}`);

            // 发布事件 | Publish event
            await this.messageHub.publish('prefab:reverted', {
                entityId: entity.id,
                prefabPath,
                prefabGuid: comp.sourcePrefabGuid
            });

            // 发布组件变更事件以刷新 UI | Publish component change event to refresh UI
            await this.messageHub.publish('component:property:changed', {
                entityId: entity.id
            });

            return true;
        } catch (error) {
            logger.error('Failed to revert instance:', error);
            return false;
        }
    }

    /**
     * 还原单个属性到源预制体的值
     * Revert single property to source prefab value
     *
     * @param entity - 预制体实例 | Prefab instance
     * @param componentType - 组件类型名称 | Component type name
     * @param propertyPath - 属性路径 | Property path
     * @returns 是否成功还原 | Whether revert was successful
     */
    public async revertProperty(entity: Entity, componentType: string, propertyPath: string): Promise<boolean> {
        const comp = entity.getComponent(PrefabInstanceComponent);
        if (!comp) {
            logger.warn('Entity is not a prefab instance');
            return false;
        }

        const key = `${componentType}.${propertyPath}`;

        // 从 originalValues 获取原始值 | Get original value from originalValues
        const originalValue = comp.getOriginalValue?.(key);
        if (originalValue === undefined) {
            logger.warn(`No original value found for ${key}`);
            return false;
        }

        // 应用原始值到组件 | Apply original value to component
        for (const compInstance of entity.components) {
            const typeName = (compInstance.constructor as any).__componentTypeName || compInstance.constructor.name;
            if (typeName === componentType) {
                this.setNestedValue(compInstance, propertyPath, originalValue);

                // 清除该属性的修改标记 | Clear modification mark for this property
                comp.clearPropertyModified(componentType, propertyPath);

                logger.debug(`Reverted property ${key} to original value`);

                // 发布事件 | Publish event
                await this.messageHub.publish('prefab:property:reverted', {
                    entityId: entity.id,
                    componentType,
                    propertyPath
                });

                // 发布组件变更事件以刷新 UI | Publish component change event to refresh UI
                await this.messageHub.publish('component:property:changed', {
                    entityId: entity.id,
                    componentType,
                    propertyPath
                });

                return true;
            }
        }

        logger.warn(`Component ${componentType} not found on entity`);
        return false;
    }

    /**
     * 断开预制体链接
     * Break prefab link
     *
     * 移除实体的预制体实例组件，使其成为普通实体。
     * Removes the prefab instance component, making it a regular entity.
     *
     * @param entity - 预制体实例 | Prefab instance
     */
    public breakPrefabLink(entity: Entity): void {
        const comp = entity.getComponent(PrefabInstanceComponent);
        if (!comp) {
            logger.warn('Entity is not a prefab instance');
            return;
        }

        const wasRoot = comp.isRoot;
        const prefabGuid = comp.sourcePrefabGuid;
        const prefabPath = comp.sourcePrefabPath;

        // 移除预制体实例组件 | Remove prefab instance component
        entity.removeComponentByType(PrefabInstanceComponent);

        // 如果是根节点，也要移除所有子实体的预制体实例组件
        // If it's root, also remove prefab instance components from all children
        if (wasRoot) {
            const scene = Core.scene;
            if (scene) {
                scene.entities.forEach((e) => {
                    const childComp = e.getComponent(PrefabInstanceComponent);
                    if (childComp && childComp.rootInstanceEntityId === entity.id) {
                        e.removeComponentByType(PrefabInstanceComponent);
                    }
                });
            }
        }

        logger.info(`Broke prefab link for entity: ${entity.name}`);

        // 发布事件 | Publish event
        this.messageHub.publish('prefab:link:broken', {
            entityId: entity.id,
            wasRoot,
            prefabGuid,
            prefabPath
        });
    }

    /**
     * 获取嵌套属性值
     * Get nested property value
     */
    private getNestedValue(obj: any, path: string): unknown {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }
        return current;
    }

    /**
     * 设置嵌套属性值
     * Set nested property value
     */
    private setNestedValue(obj: any, path: string, value: unknown): void {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] === null || current[parts[i]] === undefined) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
    }
}
