import { Entity } from '../../ECS/Entity';
import { Component } from '../../ECS/Component';
import { ISnapshotable, SceneSnapshot, EntitySnapshot, ComponentSnapshot, SnapshotConfig } from './ISnapshotable';

/**
 * 快照管理器
 * 
 * 负责创建和管理ECS系统的快照，支持完整快照和增量快照
 */
export class SnapshotManager {
    /** 默认快照配置 */
    private static readonly DEFAULT_CONFIG: SnapshotConfig = {
        includeInSnapshot: true,
        compressionLevel: 0,
        syncPriority: 5,
        enableIncremental: true
    };

    /** 框架版本 */
    private readonly version: string = '1.0.0';
    
    /** 最后快照时间戳 */
    private lastSnapshotTime: number = 0;
    
    /** 快照缓存 */
    private snapshotCache = new Map<string, SceneSnapshot>();
    
    /** 最大缓存数量 */
    private maxCacheSize: number = 10;
    


    /**
     * 创建场景快照
     * 
     * @param entities - 实体列表
     * @param type - 快照类型
     * @returns 场景快照
     */
    public createSceneSnapshot(entities: Entity[], type: 'full' | 'incremental' = 'full'): SceneSnapshot {
        const entitySnapshots: EntitySnapshot[] = [];
        
        const sortedEntities = entities.sort((a, b) => a.id - b.id);
        
        for (const entity of sortedEntities) {
            if (entity.isDestroyed) continue;
            
            const entitySnapshot = this.createEntitySnapshot(entity);
            if (entitySnapshot) {
                entitySnapshots.push(entitySnapshot);
            }
        }
        
        const snapshot: SceneSnapshot = {
            entities: entitySnapshots,
            timestamp: Date.now(),
            version: this.version,
            type: type
        };
        
        this.lastSnapshotTime = snapshot.timestamp;
        
        return snapshot;
    }

    /**
     * 从快照恢复场景
     * 
     * @param snapshot - 场景快照
     * @param targetEntities - 目标实体列表（用于增量恢复）
     * @param createMissingEntities - 是否创建缺失的实体
     */
    public restoreFromSnapshot(snapshot: SceneSnapshot, targetEntities?: Entity[], createMissingEntities: boolean = false): Entity[] {
        if (snapshot.type === 'incremental' && targetEntities) {
            return this.restoreIncrementalSnapshot(snapshot, targetEntities);
        } else {
            return this.restoreFullSnapshot(snapshot, targetEntities, createMissingEntities);
        }
    }

    /**
     * 从快照恢复实体列表
     * 
     * @param snapshot - 场景快照
     * @param targetEntities - 目标实体列表
     * @param createMissingEntities - 是否创建缺失的实体
     */
    public restoreEntitiesFromSnapshot(snapshot: SceneSnapshot, targetEntities: Entity[], createMissingEntities: boolean = false): Entity[] {
        const restoredEntities: Entity[] = [];
        const targetEntityMap = new Map<number, Entity>();
        
        for (const entity of targetEntities) {
            targetEntityMap.set(entity.id, entity);
        }
        
        for (const entitySnapshot of snapshot.entities) {
            let targetEntity = targetEntityMap.get(entitySnapshot.id);
            
            if (!targetEntity && createMissingEntities) {
                // 创建缺失的实体
                const newEntity = this.createEntityFromSnapshot(entitySnapshot);
                if (newEntity) {
                    restoredEntities.push(newEntity);
                }
            } else if (targetEntity) {
                // 恢复现有实体
                this.restoreEntityFromSnapshot(targetEntity, entitySnapshot);
                restoredEntities.push(targetEntity);
            }
        }
        
        return restoredEntities;
    }

    /**
     * 从快照创建实体
     */
    private createEntityFromSnapshot(entitySnapshot: EntitySnapshot): Entity | null {
        try {
            const entity = new Entity(entitySnapshot.name, entitySnapshot.id);
            
            // 设置基本属性
            entity.enabled = entitySnapshot.enabled;
            entity.active = entitySnapshot.active;
            entity.tag = entitySnapshot.tag;
            entity.updateOrder = entitySnapshot.updateOrder;
            
            // 创建组件
            for (const componentSnapshot of entitySnapshot.components) {
                this.createComponentFromSnapshot(entity, componentSnapshot);
            }
            
            return entity;
        } catch (error) {
            console.error(`[SnapshotManager] 创建实体失败: ${entitySnapshot.name}`, error);
            return null;
        }
    }

    /**
     * 从快照创建组件
     */
    private createComponentFromSnapshot(entity: Entity, componentSnapshot: ComponentSnapshot): void {
        try {
            // 尝试获取组件构造函数
            const componentType = this.getComponentType(componentSnapshot.type);
            if (!componentType) {
                console.warn(`[SnapshotManager] 未知组件类型: ${componentSnapshot.type}`);
                return;
            }
            
            // 创建组件实例
            const component = entity.createComponent(componentType);
            
            // 恢复组件启用状态
            component.enabled = componentSnapshot.enabled;
            
            // 恢复组件数据
            if (this.hasSerializeMethod(component)) {
                try {
                    (component as any).deserialize(componentSnapshot.data);
                } catch (error) {
                    console.warn(`[SnapshotManager] 组件 ${componentSnapshot.type} 反序列化失败:`, error);
                }
            } else {
                this.defaultDeserializeComponent(component, componentSnapshot.data);
            }
        } catch (error) {
            console.error(`[SnapshotManager] 创建组件失败: ${componentSnapshot.type}`, error);
        }
    }

    /**
     * 获取组件类型
     */
    private getComponentType(typeName: string): any {
        // 这里需要与组件注册系统集成
        // 暂时返回null，实际实现需要组件类型管理器
        return null;
    }

    /**
     * 创建快速快照（跳过变化检测）
     * 
     * @param entities - 实体列表
     * @returns 场景快照
     */
    public createQuickSnapshot(entities: Entity[]): SceneSnapshot {
        return this.createSceneSnapshot(entities, 'full');
    }

    /**
     * 创建增量快照
     * 
     * @param entities - 实体列表
     * @param baseSnapshot - 基础快照
     * @param enableChangeDetection - 是否启用变化检测
     * @returns 增量快照
     */
    public createIncrementalSnapshot(entities: Entity[], baseSnapshot: SceneSnapshot, enableChangeDetection: boolean = true): SceneSnapshot {
        const incrementalEntities: EntitySnapshot[] = [];
        
        const baseEntityMap = new Map<number, EntitySnapshot>();
        for (const entity of baseSnapshot.entities) {
            baseEntityMap.set(entity.id, entity);
        }
        
        for (const entity of entities) {
            if (entity.isDestroyed) continue;
            
            const baseEntity = baseEntityMap.get(entity.id);
            if (!baseEntity) {
                const entitySnapshot = this.createEntitySnapshot(entity);
                if (entitySnapshot) {
                    incrementalEntities.push(entitySnapshot);
                }
            } else if (enableChangeDetection) {
                const changedComponents = this.getChangedComponents(entity, baseEntity);
                if (this.hasEntityStructureChanged(entity, baseEntity) || changedComponents.length > 0) {
                    const incrementalEntitySnapshot = this.createIncrementalEntitySnapshot(entity, baseEntity, changedComponents);
                    if (incrementalEntitySnapshot) {
                        incrementalEntities.push(incrementalEntitySnapshot);
                    }
                }
            }
        }
        
        return {
            entities: incrementalEntities,
            timestamp: Date.now(),
            version: this.version,
            type: 'incremental',
            baseSnapshotId: this.generateSnapshotId(baseSnapshot)
        };
    }

    /**
     * 缓存快照
     * 
     * @param id - 快照ID
     * @param snapshot - 快照数据
     */
    public cacheSnapshot(id: string, snapshot: SceneSnapshot): void {
        // 清理过期缓存
        if (this.snapshotCache.size >= this.maxCacheSize) {
            const oldestKey = this.snapshotCache.keys().next().value;
            if (oldestKey) {
                this.snapshotCache.delete(oldestKey);
            }
        }
        
        this.snapshotCache.set(id, snapshot);
    }

    /**
     * 获取缓存的快照
     * 
     * @param id - 快照ID
     * @returns 快照数据或undefined
     */
    public getCachedSnapshot(id: string): SceneSnapshot | undefined {
        return this.snapshotCache.get(id);
    }

    /**
     * 清空快照缓存
     */
    public clearCache(): void {
        this.snapshotCache.clear();
    }

    /**
     * 清空所有缓存
     */
    public clearAllCaches(): void {
        this.snapshotCache.clear();
    }

    /**
     * 获取缓存统计信息
     */
    public getCacheStats(): {
        snapshotCacheSize: number;
    } {
        return {
            snapshotCacheSize: this.snapshotCache.size
        };
    }

    /**
     * 创建实体快照
     */
    private createEntitySnapshot(entity: Entity): EntitySnapshot | null {
        const componentSnapshots: ComponentSnapshot[] = [];
        
        if (entity.componentTypes && entity.scene?.componentStorageManager) {
            for (const componentType of entity.componentTypes) {
                const component = entity.scene.componentStorageManager.getComponent(entity.id, componentType);
                if (component) {
                    const componentSnapshot = this.createComponentSnapshot(component);
                    if (componentSnapshot) {
                        componentSnapshots.push(componentSnapshot);
                    }
                }
            }
        }
        
        return {
            id: entity.id,
            name: entity.name,
            enabled: entity.enabled,
            active: entity.active,
            tag: entity.tag,
            updateOrder: entity.updateOrder,
            components: componentSnapshots,
            children: entity.children.map(child => child.id),
            parent: entity.parent?.id || undefined,
            timestamp: Date.now()
        };
    }

    /**
     * 创建组件快照
     */
    private createComponentSnapshot(component: Component): ComponentSnapshot | null {
        if (!this.isComponentSnapshotable(component)) {
            return null;
        }
        
        let data: any;
        
        if (this.hasSerializeMethod(component)) {
            try {
                data = (component as any).serialize();
            } catch (error) {
                console.warn(`[SnapshotManager] 组件序列化失败: ${component.constructor.name}`, error);
                return null;
            }
        } else {
            data = this.defaultSerializeComponent(component);
        }
        
        return {
            type: component.constructor.name,
            id: component.id,
            data: data,
            enabled: component.enabled,
            config: this.getComponentSnapshotConfig(component)
        };
    }

    /**
     * 默认组件序列化
     */
    private defaultSerializeComponent(component: Component): any {
        const data: any = {};
        
        // 只序列化公共属性
        for (const key in component) {
            if (component.hasOwnProperty(key) && 
                typeof (component as any)[key] !== 'function' && 
                key !== 'id' && 
                key !== 'entity' &&
                key !== '_enabled' &&
                key !== '_updateOrder') {
                
                const value = (component as any)[key];
                if (this.isSerializableValue(value)) {
                    data[key] = value;
                }
            }
        }
        
        return data;
    }

    /**
     * 检查值是否可序列化
     */
    private isSerializableValue(value: any): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
        if (Array.isArray(value)) return value.every(v => this.isSerializableValue(v));
        if (typeof value === 'object') {
            // 简单对象检查，避免循环引用
            try {
                JSON.stringify(value);
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }

    /**
     * 检查组件是否支持快照
     */
    private isComponentSnapshotable(component: Component): boolean {
        // 检查是否有快照配置
        const config = this.getComponentSnapshotConfig(component);
        return config.includeInSnapshot;
    }

    /**
     * 获取组件快照配置
     */
    private getComponentSnapshotConfig(component: Component): SnapshotConfig {
        // 检查组件是否有自定义配置
        if ((component as any).snapshotConfig) {
            return { ...SnapshotManager.DEFAULT_CONFIG, ...(component as any).snapshotConfig };
        }
        
        return SnapshotManager.DEFAULT_CONFIG;
    }

    /**
     * 检查组件是否有序列化方法
     */
    private hasSerializeMethod(component: Component): boolean {
        return typeof (component as any).serialize === 'function';
    }

    /**
     * 恢复完整快照
     */
    private restoreFullSnapshot(snapshot: SceneSnapshot, targetEntities?: Entity[], createMissingEntities: boolean = false): Entity[] {
        if (targetEntities && createMissingEntities) {
            return this.restoreEntitiesFromSnapshot(snapshot, targetEntities, true);
        } else if (targetEntities) {
            return this.restoreEntitiesFromSnapshot(snapshot, targetEntities, false);
        } else {
            const restoredEntities: Entity[] = [];
            for (const entitySnapshot of snapshot.entities) {
                const entity = this.createEntityFromSnapshot(entitySnapshot);
                if (entity) {
                    restoredEntities.push(entity);
                }
            }
            return restoredEntities;
        }
    }

    /**
     * 恢复增量快照
     */
    private restoreIncrementalSnapshot(snapshot: SceneSnapshot, targetEntities: Entity[]): Entity[] {
        const restoredEntities: Entity[] = [];
        const targetEntityMap = new Map<number, Entity>();
        
        for (const entity of targetEntities) {
            targetEntityMap.set(entity.id, entity);
        }
        
        for (const entitySnapshot of snapshot.entities) {
            const targetEntity = targetEntityMap.get(entitySnapshot.id);
            if (targetEntity) {
                this.restoreEntityFromSnapshot(targetEntity, entitySnapshot);
                restoredEntities.push(targetEntity);
            }
        }
        
        return restoredEntities;
    }

    /**
     * 从快照恢复实体
     */
    private restoreEntityFromSnapshot(entity: Entity, entitySnapshot: EntitySnapshot): void {
        // 恢复实体基本属性
        entity.enabled = entitySnapshot.enabled;
        entity.active = entitySnapshot.active;
        entity.tag = entitySnapshot.tag;
        entity.updateOrder = entitySnapshot.updateOrder;
        
        // 恢复组件
        for (const componentSnapshot of entitySnapshot.components) {
            this.restoreComponentFromSnapshot(entity, componentSnapshot);
        }
    }

    /**
     * 从快照恢复组件
     */
    private restoreComponentFromSnapshot(entity: Entity, componentSnapshot: ComponentSnapshot): void {
        // 查找现有组件
        let component = entity.getComponent(componentSnapshot.type as any);
        
        if (!component) {
            // 组件不存在，需要创建
            console.warn(`[SnapshotManager] 组件 ${componentSnapshot.type} 不存在于实体 ${entity.name}，无法恢复`);
            return;
        }
        
        // 恢复组件启用状态
        component.enabled = componentSnapshot.enabled;
        
        // 恢复组件数据
        if (this.hasSerializeMethod(component)) {
            try {
                (component as any).deserialize(componentSnapshot.data);
            } catch (error) {
                console.warn(`[SnapshotManager] 组件 ${componentSnapshot.type} 反序列化失败:`, error);
            }
        } else {
            // 使用默认反序列化
            this.defaultDeserializeComponent(component, componentSnapshot.data);
        }
    }

    /**
     * 默认组件反序列化
     */
    private defaultDeserializeComponent(component: Component, data: any): void {
        for (const key in data) {
            if (component.hasOwnProperty(key) && 
                typeof (component as any)[key] !== 'function' && 
                key !== 'id' && 
                key !== 'entity' &&
                key !== '_enabled' &&
                key !== '_updateOrder') {
                
                (component as any)[key] = data[key];
            }
        }
    }

    /**
     * 检查实体结构是否发生变化（组件数量、类型等）
     */
    private hasEntityStructureChanged(entity: Entity, baseSnapshot: EntitySnapshot): boolean {
        // 检查基本属性变化
        if (entity.enabled !== baseSnapshot.enabled ||
            entity.active !== baseSnapshot.active ||
            entity.tag !== baseSnapshot.tag ||
            entity.updateOrder !== baseSnapshot.updateOrder) {
            return true;
        }
        
        // 检查组件数量变化
        if (entity.componentCount !== baseSnapshot.components.length) {
            return true;
        }

        // 检查组件类型变化
        const currentComponentTypes = new Set(Array.from(entity.componentTypes).map(type => type.name));
        const baseComponentTypes = new Set(baseSnapshot.components.map(c => c.type));
        
        if (currentComponentTypes.size !== baseComponentTypes.size) {
            return true;
        }
        
        for (const type of currentComponentTypes) {
            if (!baseComponentTypes.has(type)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 获取发生变化的组件列表
     */
    private getChangedComponents(entity: Entity, baseSnapshot: EntitySnapshot): ComponentSnapshot[] {
        const changedComponents: ComponentSnapshot[] = [];
        
        const baseComponentMap = new Map<string, ComponentSnapshot>();
        for (const comp of baseSnapshot.components) {
            baseComponentMap.set(comp.type, comp);
        }
        
        if (entity.componentTypes && entity.scene?.componentStorageManager) {
            for (const componentType of entity.componentTypes) {
                const component = entity.scene.componentStorageManager.getComponent(entity.id, componentType);
                if (!component) continue;

                const baseComponent = baseComponentMap.get(componentType.name);

                if (!baseComponent) {
                    const componentSnapshot = this.createComponentSnapshot(component);
                    if (componentSnapshot) {
                    changedComponents.push(componentSnapshot);
                }
            } else {
                if (this.hasComponentDataChanged(component, baseComponent)) {
                    const componentSnapshot = this.createComponentSnapshot(component);
                    if (componentSnapshot) {
                        changedComponents.push(componentSnapshot);
                    }
                }
            }
            }
        }

        return changedComponents;
    }

    /**
     * 检查组件数据是否发生变化
     */
    private hasComponentDataChanged(component: Component, baseComponent: ComponentSnapshot): boolean {
        if (component.enabled !== baseComponent.enabled) {
            return true;
        }
        
        if (this.hasChangeDetectionMethod(component)) {
            try {
                return (component as any).hasChanged(baseComponent.data);
            } catch {
                return true;
            }
        }
        
        return true;
    }

    /**
     * 检查组件是否有变化检测方法
     */
    private hasChangeDetectionMethod(component: Component): boolean {
        return typeof (component as any).hasChanged === 'function';
    }

    /**
     * 创建增量实体快照（只包含变化的组件）
     */
    private createIncrementalEntitySnapshot(entity: Entity, baseSnapshot: EntitySnapshot, changedComponents: ComponentSnapshot[]): EntitySnapshot | null {
        // 检查实体基本属性是否变化
        const hasBasicChanges = entity.enabled !== baseSnapshot.enabled ||
                               entity.active !== baseSnapshot.active ||
                               entity.tag !== baseSnapshot.tag ||
                               entity.updateOrder !== baseSnapshot.updateOrder;
        
        // 如果没有基本变化且没有组件变化，返回null
        if (!hasBasicChanges && changedComponents.length === 0) {
            return null;
        }
        
        return {
            id: entity.id,
            name: entity.name,
            enabled: entity.enabled,
            active: entity.active,
            tag: entity.tag,
            updateOrder: entity.updateOrder,
            components: changedComponents, // 只包含变化的组件
            children: entity.children.map(child => child.id),
            parent: entity.parent?.id || undefined,
            timestamp: Date.now()
        };
    }

    /**
     * 生成快照ID
     */
    private generateSnapshotId(snapshot: SceneSnapshot): string {
        return `${snapshot.timestamp}_${snapshot.entities.length}`;
    }
} 