import { Entity, Component, ComponentType, createLogger } from '@esengine/ecs-framework';
import { ISnapshotable, SceneSnapshot, EntitySnapshot, ComponentSnapshot, SnapshotConfig } from './ISnapshotable';
import { TsrpcSerializer } from '../Serialization/TsrpcSerializer';
import { SerializedData } from '../Serialization/SerializationTypes';
import { isTsrpcSerializable } from '../Serialization/TsrpcDecorators';
import { 
    NetworkComponentType, 
    IComponentFactory,
    SerializationTarget,
    TypeGuards,
    INetworkSyncable
} from '../types/NetworkTypes';

/**
 * 组件类型注册表
 */
class ComponentTypeRegistry implements IComponentFactory {
    private static _instance: ComponentTypeRegistry | null = null;
    private _componentTypes: Map<string, NetworkComponentType> = new Map();
    
    public static get Instance(): ComponentTypeRegistry {
        if (!ComponentTypeRegistry._instance) {
            ComponentTypeRegistry._instance = new ComponentTypeRegistry();
        }
        return ComponentTypeRegistry._instance;
    }
    
    /**
     * 注册组件类型
     */
    public register<T extends Component & INetworkSyncable>(name: string, constructor: NetworkComponentType<T>): void {
        this._componentTypes.set(name, constructor);
    }
    
    /**
     * 获取组件构造函数
     */
    public get(name: string): NetworkComponentType | undefined {
        return this._componentTypes.get(name);
    }
    
    /**
     * 自动注册组件类型（通过构造函数名）
     */
    public autoRegister<T extends Component & INetworkSyncable>(constructor: NetworkComponentType<T>): void {
        this.register(constructor.name, constructor);
    }
    
    /**
     * 获取所有已注册的组件类型
     */
    public getAllTypes(): string[] {
        return Array.from(this._componentTypes.keys());
    }
    
    /**
     * 检查组件类型是否已注册（按名称）
     */
    public isRegisteredByName(name: string): boolean {
        return this._componentTypes.has(name);
    }
    
    /**
     * 清除所有注册
     */
    public clear(): void {
        this._componentTypes.clear();
    }
    
    /**
     * 创建组件实例
     */
    public create<T extends Component & INetworkSyncable>(
        componentType: NetworkComponentType<T>,
        ...args: unknown[]
    ): T {
        return new componentType(...args);
    }
    
    /**
     * 检查组件类型是否已注册
     */
    public isRegistered<T extends Component & INetworkSyncable>(
        componentType: NetworkComponentType<T>
    ): boolean {
        return this._componentTypes.has(componentType.name);
    }
    
    /**
     * 获取组件类型名称
     */
    public getTypeName<T extends Component & INetworkSyncable>(
        componentType: NetworkComponentType<T>
    ): string {
        return componentType.name;
    }
}

/**
 * 快照管理器
 * 
 * 负责创建和管理ECS系统的快照，支持完整快照和增量快照
 * 使用protobuf序列化
 */
export class SnapshotManager {
    private static readonly logger = createLogger('SnapshotManager');
    
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
    
    /** TSRPC序列化器 */
    private tsrpcSerializer: TsrpcSerializer;
    
    /** 组件类型注册表 */
    private componentRegistry: ComponentTypeRegistry;
    
    /**
     * 构造函数
     */
    constructor() {
        this.tsrpcSerializer = TsrpcSerializer.getInstance();
        this.componentRegistry = ComponentTypeRegistry.Instance;
    }


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
            SnapshotManager.logger.error(`创建实体失败: ${entitySnapshot.name}`, error);
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
                SnapshotManager.logger.warn(`未知组件类型: ${componentSnapshot.type}`);
                return;
            }
            
            // 创建组件实例
            const component = entity.createComponent(componentType);
            
            // 恢复组件启用状态
            component.enabled = componentSnapshot.enabled;
            
            // 恢复组件数据
            const serializedData = componentSnapshot.data as SerializedData;
            
            if (!isTsrpcSerializable(component)) {
                throw new Error(`[SnapshotManager] 组件 ${component.constructor.name} 不支持TSRPC反序列化`);
            }
            
            this.tsrpcSerializer.deserialize(serializedData);
        } catch (error) {
            SnapshotManager.logger.error(`创建组件失败: ${componentSnapshot.type}`, error);
        }
    }

    /**
     * 获取组件类型
     */
    private getComponentType(typeName: string): NetworkComponentType | null {
        const componentType = this.componentRegistry.get(typeName);
        if (!componentType) {
            SnapshotManager.logger.warn(`组件类型 ${typeName} 未注册，请先调用 registerComponentType() 注册`);
            return null;
        }
        return componentType;
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
        tsrpcStats?: {
            registeredComponents: number;
            tsrpcAvailable: boolean;
        };
    } {
        const stats: any = {
            snapshotCacheSize: this.snapshotCache.size
        };
        
        if (this.tsrpcSerializer) {
            stats.tsrpcStats = this.tsrpcSerializer.getStats();
        }
        
        return stats;
    }
    
    
    /**
     * 注册组件类型
     * 
     * @param constructor - 组件构造函数
     */
    public registerComponentType<T extends Component & INetworkSyncable>(constructor: NetworkComponentType<T>): void {
        this.componentRegistry.autoRegister(constructor);
        SnapshotManager.logger.debug(`已注册组件类型: ${constructor.name}`);
    }
    
    /**
     * 批量注册组件类型
     * 
     * @param constructors - 组件构造函数数组
     */
    public registerComponentTypes(constructors: Array<NetworkComponentType>): void {
        for (const constructor of constructors) {
            this.registerComponentType(constructor as any);
        }
    }
    
    /**
     * 检查组件类型是否已注册
     * 
     * @param typeName - 组件类型名称
     */
    public isComponentTypeRegistered(typeName: string): boolean {
        return this.componentRegistry.isRegisteredByName(typeName);
    }
    
    /**
     * 获取所有已注册的组件类型
     */
    public getRegisteredComponentTypes(): string[] {
        return this.componentRegistry.getAllTypes();
    }

    /**
     * 创建实体快照
     */
    private createEntitySnapshot(entity: Entity): EntitySnapshot | null {
        const componentSnapshots: ComponentSnapshot[] = [];
        
        for (const component of entity.components) {
            const componentSnapshot = this.createComponentSnapshot(component);
            if (componentSnapshot) {
                componentSnapshots.push(componentSnapshot);
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
     * 
     * 优先使用TSRPC序列化，fallback到JSON序列化
     */
    private createComponentSnapshot(component: Component): ComponentSnapshot | null {
        if (!this.isComponentSnapshotable(component)) {
            return null;
        }
        
        let serializedData: SerializedData;
        
        // 优先使用TSRPC序列化
        if (isTsrpcSerializable(component)) {
            try {
                const tsrpcResult = this.tsrpcSerializer.serialize(component);
                if (tsrpcResult) {
                    serializedData = tsrpcResult;
                } else {
                    throw new Error('TSRPC序列化返回null');
                }
            } catch (error) {
                SnapshotManager.logger.warn(`[SnapshotManager] TSRPC序列化失败，fallback到JSON: ${error}`);
                serializedData = this.createJsonSerializedData(component);
            }
        } else {
            // fallback到JSON序列化
            serializedData = this.createJsonSerializedData(component);
        }
        
        return {
            type: component.constructor.name,
            id: component.id,
            data: serializedData,
            enabled: component.enabled,
            config: this.getComponentSnapshotConfig(component)
        };
    }
    
    /**
     * 创建JSON序列化数据
     */
    private createJsonSerializedData(component: Component): SerializedData {
        // 使用replacer排除循环引用和不需要的属性
        const jsonData = JSON.stringify(component, (key, value) => {
            // 排除entity引用以避免循环引用
            if (key === 'entity') {
                return undefined;
            }
            // 排除函数和symbol
            if (typeof value === 'function' || typeof value === 'symbol') {
                return undefined;
            }
            return value;
        });
        return {
            type: 'json',
            componentType: component.constructor.name,
            data: jsonData,
            size: jsonData.length
        };
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
        const componentWithConfig = component as Component & { snapshotConfig?: Partial<SnapshotConfig> };
        if (componentWithConfig.snapshotConfig) {
            return { ...SnapshotManager.DEFAULT_CONFIG, ...componentWithConfig.snapshotConfig };
        }
        
        return SnapshotManager.DEFAULT_CONFIG;
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
     * 
 * 使用TSRPC反序列化
     */
    private restoreComponentFromSnapshot(entity: Entity, componentSnapshot: ComponentSnapshot): void {
        // 查找现有组件
        const componentType = this.getComponentType(componentSnapshot.type);
        if (!componentType) {
            SnapshotManager.logger.warn(`组件类型 ${componentSnapshot.type} 未注册，无法恢复`);
            return;
        }
        
        let component = entity.getComponent(componentType);
        
        if (!component) {
            // 组件不存在，需要创建
            SnapshotManager.logger.warn(`组件 ${componentSnapshot.type} 不存在于实体 ${entity.name}，无法恢复`);
            return;
        }
        
        // 恢复组件启用状态
        component.enabled = componentSnapshot.enabled;
        
        // 恢复组件数据
        const serializedData = componentSnapshot.data as SerializedData;
        
        if (serializedData.type === 'tsrpc' && isTsrpcSerializable(component)) {
            // 使用TSRPC反序列化
            this.tsrpcSerializer.deserialize(serializedData);
        } else if (serializedData.type === 'json') {
            // 使用JSON反序列化
            this.deserializeFromJson(component, serializedData);
        } else {
            SnapshotManager.logger.warn(`[SnapshotManager] 组件 ${component.constructor.name} 序列化类型不匹配或不支持`);
        }
    }
    
    /**
     * 从JSON数据反序列化组件
     */
    private deserializeFromJson(component: Component, serializedData: SerializedData): void {
        try {
            const jsonData = JSON.parse(serializedData.data as string);
            Object.assign(component, jsonData);
        } catch (error) {
            SnapshotManager.logger.error(`[SnapshotManager] JSON反序列化失败: ${error}`);
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
        if (entity.components.length !== baseSnapshot.components.length) {
            return true;
        }
        
        // 检查组件类型变化
        const currentComponentTypes = new Set(entity.components.map(c => c.constructor.name));
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
        
        for (const component of entity.components) {
            const baseComponent = baseComponentMap.get(component.constructor.name);
            
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
                const componentWithMethod = component as Component & { hasChanged(data: unknown): boolean };
                return componentWithMethod.hasChanged(baseComponent.data);
            } catch {
                return true;
            }
        }
        
        return true;
    }

    /**
     * 检查组件是否有变化检测方法
     */
    private hasChangeDetectionMethod(component: Component): component is Component & { hasChanged(data: unknown): boolean } {
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