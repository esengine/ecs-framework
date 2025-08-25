import { Scene } from '../../Scene';
import { Component } from '../../Component';
import { Entity } from '../../Entity';
import { World } from '../../World';
import { getComponentInstanceTypeName } from '../../Decorators';
import { ComponentRegistry, ComponentType } from '../ComponentStorage/ComponentRegistry';
import { WorldAdapter, EncodeOptions, DecodeOptions, SignatureScope, AfterDecodeCallback, MissingComponentStrategy } from './WorldAdapter';
import { createLogger } from '../../../Utils/Logger';
import { murmur3_32, concatBytes, numberToBytes, stringToUtf8Bytes } from '../../../Utils/Hash32';
import { ColumnarSerializer, ColumnarSerializationContext } from '../Serialization/ColumnarSerializer';
import { getClassSerializationMeta, validateSerializableComponent } from '../../Decorators/SerializationDecorators';
import { SerializerRegistry } from '../Serialization/SerializerRegistry';

/**
 * 序列化模式
 */
type SerializationMode = 'columnar' | 'legacy';

/**
 * 扩展编码选项
 */
interface ExtendedEncodeOptions extends EncodeOptions {
    /** 序列化模式 */
    mode?: SerializationMode;
    /** 列式序列化上下文 */
    columnarContext?: ColumnarSerializationContext;
}

/**
 * 扩展解码选项
 */
interface ExtendedDecodeOptions extends DecodeOptions {
    /** 序列化模式 */
    mode?: SerializationMode;
    /** 列式序列化上下文 */
    columnarContext?: ColumnarSerializationContext;
}

/**
 * 世界状态数据结构
 */
interface WorldStateData {
    /** 实体数据 */
    entities: EntityData[];
    /** 实体ID池状态 */
    identifierPool: {
        nextAvailableIndex: number;
        freeIndices: number[];
        generations: [number, number][];
        pendingRecycle: Array<{
            index: number;
            generation: number;
            timestamp: number;
        }>;
        stats: {
            totalAllocated: number;
            totalRecycled: number;
            currentActive: number;
            memoryExpansions: number;
        };
    };
    /** 组件存储状态 */
    componentStorage: ComponentStorageData[];
    /** 版本信息 */
    version: string;
    /** 时间戳 */
    timestamp: number;
    /** 帧号（用于回放对齐校验） */
    frame: number;
    /** 随机种子（用于可复现PRNG） */
    seed?: number;
    /** Schema哈希（用于快速兼容性判定） */
    schemaHash?: number;
}

/**
 * 实体数据结构
 */
interface EntityData {
    id: number;
    name: string;
    tag: number;
    enabled: boolean;
    components: ComponentData[];
}

/**
 * 组件数据结构
 */
interface ComponentData {
    type: string;
    data: Record<string, unknown>;
}

/**
 * 组件存储数据结构
 */
interface ComponentStorageData {
    type: string;
    entities: number[];
    components: Record<string, unknown>[];
}

export class SceneWorldAdapter implements WorldAdapter {
    private _logger = createLogger('SceneWorldAdapter');
    private _scene: Scene;

    private _afterDecodeCallback?: AfterDecodeCallback;

    constructor(scene: Scene, afterDecodeCallback?: AfterDecodeCallback) {
        this._scene = scene;
        this._afterDecodeCallback = afterDecodeCallback;
    }

    /**
     * 设置解码后回调
     */
    public onAfterDecode(callback: AfterDecodeCallback): void {
        this._afterDecodeCallback = callback;
    }

    /**
     * 编码世界状态
     */
    public encode(options: ExtendedEncodeOptions = {}): ArrayBuffer {
        try {
            const deterministic = options.deterministic ?? true;
            
            // 检查捕获点约束：只在指定阶段允许快照
            if (deterministic) {
                const phase = this._scene.phase;
                if (phase !== 'Idle' && phase !== 'Post') {
                    throw new Error(`encode()只允许在apply()之后调用，当前阶段=${phase}`);
                }
            }
            
            // 检查命令缓冲状态，避免捕捉未提交的结构命令
            const assertCleanCB = options.assertCleanCB ?? true;
            if (assertCleanCB && this._scene.commandBuffer && !this._scene.commandBuffer.isEmpty) {
                if (deterministic) {
                    throw new Error('Snapshot taken before CommandBuffer.apply(): inconsistent state.');
                } else {
                    this._logger.warn('encode() called while CommandBuffer not empty; snapshot may be inconsistent.');
                }
            }
            const startTime = performance.now();
            const mode = options.mode ?? 'legacy';
            
            if (mode === 'columnar') {
                return this._encodeColumnar(options);
            } else {
                return this._encodeLegacy(options, deterministic, startTime);
            }
        } catch (e) {
            this._logger.error('编码世界状态失败:', e);
            throw e;
        }
    }
    
    /**
     * 使用列式序列化编码
     */
    private _encodeColumnar(options: ExtendedEncodeOptions): ArrayBuffer {
        const context = options.columnarContext ?? this._getDefaultColumnarContext();
        
        // 验证所有组件都使用了装饰器
        this._validateAllComponentsSerializable();
        
        // 使用列式序列化引擎
        const world = this._createWorldFromScene();
        const result = ColumnarSerializer.serialize(world, context);
        
        this._logger.debug(`列式编码完成: ${result.metadata.entityCount} 实体, ${result.metadata.totalSize} 字节, ${result.stats.serializationTime.toFixed(2)}ms`);
        
        return result.buffer;
    }
    
    /**
     * 使用传统方式编码（向后兼容）
     */
    private _encodeLegacy(options: ExtendedEncodeOptions, deterministic: boolean, startTime: number): ArrayBuffer {
        const entities = this._encodeEntitiesStable();
        const idPool = this._encodeIdentifierPoolStable(deterministic);
        const compStore = this._encodeComponentStorageStable();

        const worldState: WorldStateData = {
            entities,
            identifierPool: idPool,
            componentStorage: compStore,
            version: '1.0.0',
            timestamp: deterministic ? 0 : Date.now(),
            frame: options.frame ?? 0,
            seed: options.seed,
            schemaHash: this._calculateSchemaHash(),
        };

        const jsonString = this._stableStringify(worldState);
        const buffer = new TextEncoder().encode(jsonString);

        this._logger.debug(`传统编码完成: ${buffer.length} 字节, 耗时: ${(performance.now()-startTime).toFixed(2)}ms`);
        return buffer.buffer;
    }

    /**
     * 解码世界状态
     */
    public decode(buf: ArrayBuffer, options: ExtendedDecodeOptions = {}): void {
        const start = performance.now();
        const mode = options.mode ?? this._detectSerializationMode(buf);
        
        if (mode === 'columnar') {
            this._decodeColumnar(buf, options, start);
        } else {
            this._decodeLegacy(buf, options, start);
        }
    }
    
    /**
     * 使用列式序列化解码
     */
    private _decodeColumnar(buf: ArrayBuffer, options: ExtendedDecodeOptions, start: number): void {
        const context = options.columnarContext ?? this._getDefaultColumnarContext();
        
        const prev = this._scene.suspendEffects;
        this._scene.suspendEffects = true;
        
        try {
            if (options.clearExisting !== false) this._clearScene();
            
            // 使用列式序列化引擎解码
            const world = this._createWorldFromScene();
            ColumnarSerializer.deserialize(buf, world, context);
            
            // 将World的数据同步回场景
            this._syncWorldToScene(world);
            
        } finally {
            this._scene.suspendEffects = prev;
        }
        
        this._logger.debug(`列式解码完成: ${(performance.now() - start).toFixed(2)}ms`);
    }
    
    /**
     * 使用传统方式解码（向后兼容）
     */
    private _decodeLegacy(buf: ArrayBuffer, options: ExtendedDecodeOptions, start: number): void {
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(buf);
        const worldState: WorldStateData = JSON.parse(jsonString);

        // 版本校验
        if (!worldState.version?.startsWith('1.')) {
            throw new Error(`快照版本不兼容: ${worldState.version}`);
        }

        // Schema哈希校验（快速兼容性判定）
        if (typeof worldState.schemaHash === 'number') {
            const currentSchemaHash = this._calculateSchemaHash();
            if (worldState.schemaHash !== currentSchemaHash) {
                const msg = `Schema哈希不匹配: 快照=${worldState.schemaHash}, 当前=${currentSchemaHash}, 可能存在组件结构变化`;
                const strictSchema = options.strictSchema ?? (options.deterministic ?? true);
                if (strictSchema) {
                    throw new Error(msg);
                } else {
                    this._logger.warn(msg);
                }
            }
        }

        const prev = this._scene.suspendEffects;
        this._scene.suspendEffects = true;
        try {
            if (options.clearExisting !== false) this._clearScene();
            this._decodeIdentifierPool(worldState.identifierPool);
            
            const strategy = options.onMissingComponent ?? (options.deterministic ? 'skip' : 'throw');
            this._decodeEntities(worldState.entities, strategy);
            this._decodeComponentStorage(worldState.componentStorage);
        } finally {
            this._scene.suspendEffects = prev;
        }

        this._alignFrameAndSeed(worldState);

        this._logger.debug(`传统解码完成: ${(performance.now() - start).toFixed(2)}ms`);
    }

    /**
     * 对齐frame和seed
     */
    private _alignFrameAndSeed(worldState: WorldStateData): void {
        if (this._afterDecodeCallback) {
            this._afterDecodeCallback({
                frame: worldState.frame,
                seed: worldState.seed
            });
        }
    }

    /**
     * 计算世界状态签名
     * @param scope 签名计算范围
     */
    public signature(scope: SignatureScope = 'simOnly'): number {
        try {
            const bytes = scope === 'simOnly' 
                ? this._collectSignatureBytesStable() 
                : this._collectFullSignatureBytes();
            return murmur3_32(bytes);
        } catch (e) {
            this._logger.error('计算世界签名失败:', e);
            return 0;
        }
    }

    /**
     * 编码实体数据
     */
    private _encodeEntitiesStable(): EntityData[] {
        const list = this._scene.entities.buffer.slice().sort((a, b) => a.id - b.id);
        const out: EntityData[] = [];
        for (const entity of list) {
            const comps = entity.components
                .map(comp => ({
                    type: getComponentInstanceTypeName(comp),
                    data: this._serializeComponentStable(comp),
                }))
                .sort((a, b) => a.type.localeCompare(b.type));
            out.push({
                id: entity.id,
                name: entity.name,
                tag: entity.tag,
                enabled: entity.enabled,
                components: comps,
            });
        }
        return out;
    }

    /**
     * 编码标识符池
     */
    private _encodeIdentifierPoolStable(deterministic: boolean) {
        const s = this._scene.identifierPool.getSerializableState();
        return {
            nextAvailableIndex: s.nextAvailableIndex,
            freeIndices: s.freeIndices.slice().sort((a,b)=>a-b),
            generations: s.generations.slice().sort((a,b)=>a[0]-b[0]),
            pendingRecycle: deterministic ? [] : s.pendingRecycle,
            stats: deterministic ? { totalAllocated: 0, totalRecycled: 0, currentActive: 0, memoryExpansions: 0 } : s.stats,
        };
    }

    /**
     * 编码组件存储
     */
    private _encodeComponentStorageStable(): ComponentStorageData[] {
        const stats = this._scene.componentStorageManager.getAllStats();
        const sorted = Array.from(stats.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
        const out: ComponentStorageData[] = [];
        for (const [typeName, stat] of sorted) {
            if (stat.count > 0) {
                out.push({ type: typeName, entities: [], components: [] });
            }
        }
        return out;
    }

    /**
     * 解码实体数据
     */
    private _decodeEntities(entitiesData: EntityData[], strategy: MissingComponentStrategy = 'skip'): void {
        let skippedComponents = 0;
        
        for (const entityData of entitiesData) {
            const entity = new Entity(entityData.name, entityData.id);
            entity.tag = entityData.tag;
            entity.enabled = entityData.enabled;

            this._scene.addEntity(entity);

            for (const componentData of entityData.components) {
                const component = this._deserializeComponent(componentData, strategy);
                if (component) {
                    entity.addComponent(component);
                } else {
                    skippedComponents++;
                }
            }
        }
        
        if (skippedComponents > 0) {
            this._logger.warn(`跳过了 ${skippedComponents} 个未注册的组件`);
        }
    }

    /**
     * 解码标识符池
     */
    private _decodeIdentifierPool(poolData: {
        nextAvailableIndex: number;
        freeIndices: number[];
        generations: [number, number][];
        pendingRecycle: Array<{
            index: number;
            generation: number;
            timestamp: number;
        }>;
        stats: {
            totalAllocated: number;
            totalRecycled: number;
            currentActive: number;
            memoryExpansions: number;
        };
    }): void {
        // 确保确定性：清除非必要字段
        const cleanData = {
            nextAvailableIndex: poolData.nextAvailableIndex,
            freeIndices: poolData.freeIndices,
            generations: poolData.generations,
            pendingRecycle: [],
            stats: { totalAllocated: 0, totalRecycled: 0, currentActive: 0, memoryExpansions: 0 }
        };
        this._scene.identifierPool.restoreFromSerializableState(cleanData);
    }

    /**
     * 解码组件存储
     */
    private _decodeComponentStorage(storageData: ComponentStorageData[]): void {
        for (const data of storageData) {
            try {
                // 通过ComponentRegistry获取组件类型
                const componentTypeFunc = ComponentRegistry.getComponentType(data.type);
                if (!componentTypeFunc) {
                    this._logger.warn(`未找到组件类型: ${data.type}`);
                    continue;
                }
                
                const componentType = componentTypeFunc as ComponentType<Component>;

                // 获取或创建组件存储
                const storage = this._scene.componentStorageManager.getStorage(componentType);
                if (!storage) {
                    this._logger.warn(`无法创建组件存储: ${data.type}`);
                    continue;
                }

                // 恢复每个实体的组件数据
                for (let i = 0; i < data.entities.length && i < data.components.length; i++) {
                    const entityId = data.entities[i];
                    const componentData = data.components[i];

                    try {
                        // 创建组件实例
                        const component = new componentType();
                        
                        // 恢复组件数据
                        Object.assign(component, componentData);
                        
                        // 添加到存储
                        storage.addComponent(entityId, component);
                        
                    } catch (componentError) {
                        this._logger.warn(`恢复组件失败 ${data.type}[${entityId}]:`, componentError);
                    }
                }
                
                this._logger.debug(`恢复组件存储: ${data.type}, ${data.entities.length} 个实体`);
                
            } catch (error) {
                this._logger.error(`解码组件存储失败: ${data.type}`, error);
            }
        }
    }

    /**
     * 清空场景状态
     */
    private _clearScene(): void {
        this._scene.destroyAllEntities();
        this._scene.componentStorageManager.clear();
    }

    /**
     * 检测序列化模式
     */
    private _detectSerializationMode(buf: ArrayBuffer): SerializationMode {
        try {
            // 检查是否为列式序列化格式（魔术头部）
            const view = new DataView(buf);
            if (buf.byteLength >= 4) {
                const magic = view.getUint32(0, true); // 小端序
                if (magic === 0x45435343) { // "ECSC"
                    return 'columnar';
                }
            }
            
            // 尝试解析为JSON来检测传统格式
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(buf);
            JSON.parse(jsonString);
            return 'legacy';
        } catch {
            // 默认使用列式模式
            return 'columnar';
        }
    }
    
    /**
     * 验证所有组件都使用了序列化装饰器
     */
    private _validateAllComponentsSerializable(): void {
        const invalidComponents: string[] = [];
        
        for (const entity of this._scene.entities.buffer) {
            for (const component of entity.components) {
                try {
                    validateSerializableComponent(component);
                } catch (error) {
                    const typeName = getComponentInstanceTypeName(component);
                    if (!invalidComponents.includes(typeName)) {
                        invalidComponents.push(typeName);
                    }
                }
            }
        }
        
        if (invalidComponents.length > 0) {
            throw new Error(
                `发现未使用序列化装饰器的组件: ${invalidComponents.join(', ')}。` +
                `请为这些组件添加 @Serializable() 装饰器和 @SerializableField() 字段装饰器。`
            );
        }
    }
    
    /**
     * 从场景创建World对象
     */
    private _createWorldFromScene(): World {
        // 创建一个新的World实例，并添加当前场景
        const world = new World({ name: `Scene_${this._scene.name || 'Unknown'}` });
        world.addScene('main', this._scene);
        world.setSceneActive('main', true);
        return world;
    }
    
    /**
     * 将World数据同步回场景
     */
    private _syncWorldToScene(world: World): void {
        try {
            // 先深度复制所有实体数据，避免清空场景时丢失数据
            const entityDataList: Array<{
                name: string;
                id: number;
                tag: number;
                enabled: boolean;
                components: Component[];
            }> = [];
            
            // 获取World中所有场景的实体
            const allScenes = world.getAllScenes();
            let totalEntities = 0;
            
            // 先收集所有实体数据（深拷贝）
            for (const sourceScene of allScenes) {
                if (!sourceScene?.entities?.buffer) {
                    continue;
                }
                
                for (const sourceEntity of sourceScene.entities.buffer) {
                    if (!sourceEntity || sourceEntity.isDestroyed) {
                        continue;
                    }
                    
                    // 深度复制组件数据
                    const componentCopies: Component[] = [];
                    for (const component of sourceEntity.components) {
                        try {
                            const componentCopy = Object.create(Object.getPrototypeOf(component));
                            Object.assign(componentCopy, component);
                            componentCopies.push(componentCopy);
                        } catch (error) {
                            this._logger.warn(`复制组件失败 ${component.constructor.name}:`, error);
                        }
                    }
                    
                    // 保存实体数据
                    entityDataList.push({
                        name: sourceEntity.name,
                        id: sourceEntity.id,
                        tag: sourceEntity.tag,
                        enabled: sourceEntity.enabled,
                        components: componentCopies
                    });
                }
            }
            
            // 现在可以安全地清空原始场景
            this._scene.destroyAllEntities();
            this._scene.componentStorageManager.clear();
            
            // 从复制的数据重建实体
            for (const entityData of entityDataList) {
                try {
                    // 创建新实体
                    const newEntity = new Entity(entityData.name, entityData.id);
                    newEntity.tag = entityData.tag;
                    newEntity.enabled = entityData.enabled;
                    
                    // 将实体添加到场景
                    this._scene.addEntity(newEntity, true); // 延迟缓存清理
                    
                    // 添加组件
                    for (const component of entityData.components) {
                        try {
                            newEntity.addComponent(component);
                        } catch (componentError) {
                            this._logger.warn(`添加组件失败 ${component.constructor.name}:`, componentError);
                        }
                    }
                    
                    totalEntities++;
                    
                } catch (entityError) {
                    this._logger.warn(`重建实体失败 ${entityData.name}[${entityData.id}]:`, entityError);
                }
            }
            
            // 清理查询系统缓存
            this._scene.querySystem.clearCache();
            
            this._logger.info(`World数据同步完成: ${totalEntities} 个实体`);
            
        } catch (error) {
            this._logger.error('World数据同步失败:', error);
            throw new Error(`World数据同步失败: ${error}`);
        }
    }
    
    /**
     * 获取默认列式序列化上下文
     */
    private _getDefaultColumnarContext(): ColumnarSerializationContext {
        return {
            compression: true,
            skipDefaults: true,
            strict: true,
            maxEntities: 1000000, // 100万实体
            maxComponents: 10000   // 1万组件类型
        };
    }

    /**
     * 序列化组件（传统方式）
     */
    private _serializeComponentStable(component: Component): Record<string, unknown> {
        // 检查组件是否使用了新的装饰器系统
        const meta = getClassSerializationMeta(component.constructor);
        if (meta) {
            // 使用新的装饰器系统序列化
            return this._serializeComponentWithDecorators(component, meta);
        }
        
        // 传统序列化接口
        const isSerializableComponent = (comp: Component): comp is Component & { serialize?(): Record<string, unknown> } => {
            return typeof (comp as any).serialize === 'function';
        };
        
        if (isSerializableComponent(component) && component.serialize) {
            const raw = component.serialize();
            // 标准化键序，确保与默认序列化路径一致
            const sorted: Record<string, unknown> = {};
            for (const k of Object.keys(raw).sort()) {
                sorted[k] = raw[k];
            }
            return sorted;
        }

        // 默认序列化逻辑
        const result: Record<string, unknown> = {};
        const keys = Object.keys(component).filter(k => !k.startsWith('_') && k !== 'entity' && k !== 'id').sort();
        for (const key of keys) {
            const value = component[key];
            if (value == null) { result[key] = value; continue; }
            if (typeof value === 'string') {
                result[key] = value;
            } else if (typeof value === 'number') {
                result[key] = this._normalizeNumber(value);
            } else if (typeof value === 'boolean') {
                result[key] = value;
            } else if (Array.isArray(value)) {
                // 对数组中的数字元素也进行规范化，保持与签名算法一致
                if (value.every(x => typeof x === 'number')) {
                    result[key] = value.map(n => this._normalizeNumber(n));
                } else if (value.every(x => typeof x === 'boolean')) {
                    result[key] = value.slice();
                } else if (value.every(x => typeof x === 'string')) {
                    result[key] = value.slice();
                } else {
                    // 混合类型数组，跳过以保持确定性
                    result[key] = [];
                }
            } else if (ArrayBuffer.isView(value)) {
                // 处理TypedArray
                if (value instanceof Float32Array || value instanceof Float64Array || 
                    value instanceof Int8Array || value instanceof Int16Array || 
                    value instanceof Int32Array || value instanceof Uint8Array || 
                    value instanceof Uint16Array || value instanceof Uint32Array) {
                    const arr = Array.from(value);
                    result[key] = arr.map(n => this._normalizeNumber(n));
                } else if (value instanceof DataView) {
                    // DataView不能直接转为数组，跳过以保持确定性
                    result[key] = null;
                } else {
                    // 其他ArrayBufferView类型，为了确定性统一跳过
                    result[key] = null;
                }
            }
        }
        return result;
    }
    
    /**
     * 使用装饰器系统序列化组件
     */
    private _serializeComponentWithDecorators(component: Component, meta: any): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        
        for (const fieldMeta of meta.fields) {
            const fieldValue = component[fieldMeta.name as keyof Component];
            
            // 检查是否应该序列化此字段
            if (!this._shouldSerializeField(fieldMeta, fieldValue)) {
                continue;
            }
            
            // 使用自定义序列化器
            if (fieldMeta.options.serializer) {
                if (typeof fieldMeta.options.serializer === 'string') {
                    try {
                        result[fieldMeta.name] = SerializerRegistry.serialize(fieldMeta.options.serializer, fieldValue);
                    } catch (error) {
                        this._logger.warn(`序列化字段失败 ${fieldMeta.name}:`, error);
                        result[fieldMeta.name] = null;
                    }
                } else {
                    try {
                        result[fieldMeta.name] = fieldMeta.options.serializer(fieldValue);
                    } catch (error) {
                        this._logger.warn(`序列化字段失败 ${fieldMeta.name}:`, error);
                        result[fieldMeta.name] = null;
                    }
                }
            } else {
                // 标准序列化
                result[fieldMeta.name] = this._serializeFieldValue(fieldValue);
            }
        }
        
        return result;
    }
    
    /**
     * 检查字段是否应该序列化
     */
    private _shouldSerializeField(fieldMeta: any, value: any): boolean {
        // 跳过默认值
        if (fieldMeta.options.skipDefaults && fieldMeta.options.defaultValue !== undefined) {
            return value !== fieldMeta.options.defaultValue;
        }
        
        // 处理nullable字段
        if (!fieldMeta.options.nullable && (value === null || value === undefined)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 序列化字段值
     */
    private _serializeFieldValue(value: any): any {
        if (value == null) return value;
        
        if (typeof value === 'string' || typeof value === 'boolean') {
            return value;
        } else if (typeof value === 'number') {
            return this._normalizeNumber(value);
        } else if (Array.isArray(value)) {
            if (value.every(x => typeof x === 'number')) {
                return value.map(n => this._normalizeNumber(n));
            } else if (value.every(x => typeof x === 'boolean' || typeof x === 'string')) {
                return value.slice();
            } else {
                // 混合类型数组，跳过以保持确定性
                return [];
            }
        } else if (ArrayBuffer.isView(value)) {
            // 处理TypedArray
            if (value instanceof Float32Array || value instanceof Float64Array || 
                value instanceof Int8Array || value instanceof Int16Array || 
                value instanceof Int32Array || value instanceof Uint8Array || 
                value instanceof Uint16Array || value instanceof Uint32Array) {
                const arr = Array.from(value);
                return arr.map(n => this._normalizeNumber(n));
            } else {
                return null;
            }
        } else if (typeof value === 'object') {
            // 复杂对象，尝试JSON序列化
            try {
                return JSON.parse(JSON.stringify(value));
            } catch {
                return null;
            }
        }
        
        return value;
    }

    /**
     * JSON序列化
     */
    private _stableStringify(obj: any): string {
        return JSON.stringify(obj, (_, value) => {
            // TypedArray和ArrayBuffer保持原样，不参与键排序
            if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
                return value;
            }
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                const sorted: any = {};
                for (const k of Object.keys(value).sort()) {
                    sorted[k] = value[k];
                }
                return sorted;
            }
            return value;
        });
    }

    /**
     * 反序列化组件（传统方式）
     */
    private _deserializeComponent(componentData: ComponentData, strategy: MissingComponentStrategy = 'skip'): Component | null {
        try {
            // 使用框架的组件注册机制
            const ComponentClass = ComponentRegistry.getComponentType(componentData.type) as new () => Component;
            if (!ComponentClass) {
                const msg = `组件类型未注册: ${componentData.type}`;
                if (strategy === 'throw') {
                    throw new Error(msg);
                } else {
                    this._logger.warn(msg + ' (已跳过)');
                    return null;
                }
            }

            const component = new ComponentClass();
            
            // 检查是否使用了新的装饰器系统
            const meta = getClassSerializationMeta(component.constructor);
            if (meta) {
                // 使用新的装饰器系统反序列化
                this._deserializeComponentWithDecorators(component, componentData.data, meta);
            } else {
                // 传统反序列化接口
                const isSerializableComponent = (comp: Component): comp is Component & { deserialize?(data: Record<string, unknown>): void } => {
                    return typeof (comp as any).deserialize === 'function';
                };
                
                if (isSerializableComponent(component) && component.deserialize) {
                    component.deserialize(componentData.data);
                } else {
                    Object.assign(component, componentData.data);
                }
            }
            
            return component;
        } catch (error) {
            const msg = `反序列化组件失败: ${componentData.type}`;
            if (strategy === 'throw') {
                throw new Error(msg + `: ${error}`);
            } else {
                this._logger.error(msg, error);
                return null;
            }
        }
    }
    
    /**
     * 使用装饰器系统反序列化组件
     */
    private _deserializeComponentWithDecorators(component: Component, data: Record<string, unknown>, meta: any): void {
        for (const fieldMeta of meta.fields) {
            const fieldName = fieldMeta.name;
            
            if (!(fieldName in data)) {
                // 字段在数据中不存在，使用默认值或跳过
                if (fieldMeta.options.defaultValue !== undefined) {
                    (component as any)[fieldName] = fieldMeta.options.defaultValue;
                }
                continue;
            }
            
            const fieldValue = data[fieldName];
            
            // 使用自定义反序列化器
            if (fieldMeta.options.deserializer) {
                if (typeof fieldMeta.options.deserializer === 'string') {
                    try {
                        (component as any)[fieldName] = SerializerRegistry.deserialize(fieldMeta.options.deserializer, fieldValue);
                    } catch (error) {
                        this._logger.warn(`反序列化字段失败 ${fieldName}:`, error);
                    }
                } else {
                    try {
                        (component as any)[fieldName] = fieldMeta.options.deserializer(fieldValue);
                    } catch (error) {
                        this._logger.warn(`反序列化字段失败 ${fieldName}:`, error);
                    }
                }
            } else if (fieldMeta.options.serializer && typeof fieldMeta.options.serializer === 'string') {
                // 使用序列化器的反序列化功能
                try {
                    (component as any)[fieldName] = SerializerRegistry.deserialize(fieldMeta.options.serializer, fieldValue);
                } catch (error) {
                    this._logger.warn(`反序列化字段失败 ${fieldName}:`, error);
                    (component as any)[fieldName] = fieldValue;
                }
            } else {
                // 直接赋值
                (component as any)[fieldName] = fieldValue;
            }
        }
    }

    /**
     * 数字规范化
     */
    private _pushNumber32(chunks: Uint8Array[], x: number): void {
        const v = this._normalizeNumber(x);
        const f32 = new Float32Array([v]);
        chunks.push(new Uint8Array(f32.buffer));
    }

    /**
     * 处理TypedArray签名
     */
    private _pushTypedArray(chunks: Uint8Array[], view: ArrayBufferView): void {
        // 创建干净的副本，去除byteOffset影响
        const cleanData = new Uint8Array(view.byteLength);
        cleanData.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
        chunks.push(numberToBytes(cleanData.byteLength));
        chunks.push(cleanData);
    }

    /**
     * 按元素类型处理数组
     */
    private _pushArray(chunks: Uint8Array[], arr: any[]): void {
        if (arr.every(x => typeof x === 'number')) {
            chunks.push(numberToBytes(0x14));
            chunks.push(numberToBytes(arr.length));
            for (const n of arr) this._pushNumber32(chunks, n as number);
        } else if (arr.every(x => typeof x === 'boolean')) {
            chunks.push(numberToBytes(0x15));
            chunks.push(numberToBytes(arr.length));
            for (const b of arr) chunks.push(numberToBytes(b ? 1 : 0));
        } else if (arr.every(x => typeof x === 'string')) {
            chunks.push(numberToBytes(0x16));
            chunks.push(numberToBytes(arr.length));
            for (const s of arr) { 
                const b = stringToUtf8Bytes(s); 
                chunks.push(numberToBytes(b.length)); 
                chunks.push(b); 
            }
        } else {
            chunks.push(numberToBytes(0x10));
        }
    }

    /**
     * 数字规范化
     */
    private _normalizeNumber(x: number): number {
        if (!Number.isFinite(x)) return 0;
        return x === 0 ? 0 : x; // 抹掉 -0
    }

    /**
     * 收集签名字节数据
     */
    private _collectSignatureBytesStable(): Uint8Array {
        const chunks: Uint8Array[] = [];

        // 实体（按 id）
        const entities = this._scene.entities.buffer.slice().sort((a,b)=>a.id-b.id);
        chunks.push(numberToBytes(entities.length));

        for (const entity of entities) {
            chunks.push(numberToBytes(entity.id));
            chunks.push(numberToBytes(entity.tag));
            chunks.push(numberToBytes(entity.enabled ? 1 : 0));

            // 组件（按 type）
            const comps = entity.components
                .map(c => ({ type: getComponentInstanceTypeName(c), c }))
                .sort((a,b)=>a.type.localeCompare(b.type));
            chunks.push(numberToBytes(comps.length));

            for (const { type, c } of comps) {
                chunks.push(stringToUtf8Bytes(type));
                // 组件字段（键按字典序，排除内部属性）
                const keys = Object.keys(c).filter(k=>!k.startsWith('_') && k!=='entity' && k!=='id').sort();
                chunks.push(numberToBytes(keys.length));
                for (const k of keys) {
                    chunks.push(stringToUtf8Bytes(k));
                    const v = c[k];
                    if (typeof v === 'number') {
                        chunks.push(numberToBytes(0x01));
                        this._pushNumber32(chunks, v);
                    } else if (typeof v === 'boolean') {
                        chunks.push(numberToBytes(0x02));
                        chunks.push(numberToBytes(v ? 1 : 0));
                    } else if (typeof v === 'string') {
                        chunks.push(numberToBytes(0x03));
                        chunks.push(stringToUtf8Bytes(v));
                    } else if (Array.isArray(v)) {
                        this._pushArray(chunks, v);
                    } else if (ArrayBuffer.isView(v)) {
                        chunks.push(numberToBytes(0x05));
                        this._pushTypedArray(chunks, v as ArrayBufferView);
                    } else {
                        chunks.push(numberToBytes(0x00));
                    }
                }
            }
        }

        // 简化签名：只关注实体数据，忽略系统级统计
        // 这样确保不同场景但相同实体数据时签名一致

        return concatBytes(...chunks);
    }

    /**
     * 收集完整签名数据
     */
    private _collectFullSignatureBytes(): Uint8Array {
        const chunks: Uint8Array[] = [];

        // 先收集核心模拟状态
        const simBytes = this._collectSignatureBytesStable();
        chunks.push(simBytes);

        // 添加系统级统计信息
        // 组件存储统计（按 type）
        const stats = this._scene.componentStorageManager.getAllStats();
        const sorted = Array.from(stats.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
        chunks.push(numberToBytes(sorted.length));
        for (const [typeName, s] of sorted) {
            chunks.push(stringToUtf8Bytes(typeName));
            chunks.push(numberToBytes(s.count));
        }

        // ID 池统计信息
        const st = this._scene.identifierPool.getStats();
        chunks.push(numberToBytes(st.totalAllocated));
        chunks.push(numberToBytes(st.currentActive));
        chunks.push(numberToBytes(st.maxUsedIndex));

        return concatBytes(...chunks);
    }

    /**
     * 计算Schema哈希
     */
    private _calculateSchemaHash(): number {
        try {
            // 收集已注册组件的名称和字段信息
            const componentInfos: string[] = [];
            // 获取所有已注册组件
            const registeredComponents = ComponentRegistry.getAllRegisteredComponents();
            
            // 获取所有已注册组件的名称并排序
            const componentNames = Array.from(
                typeof registeredComponents === 'object' && registeredComponents instanceof Map
                    ? registeredComponents.keys()
                    : Object.keys(registeredComponents)
            ).sort();
            
            for (const typeName of componentNames) {
                componentInfos.push(typeName);
                
                // 如果可能，获取组件的字段信息
                try {
                    const ComponentClass = ComponentRegistry.getComponentType(typeName) as new () => Component;
                    if (ComponentClass) {
                        const instance = new ComponentClass();
                        const fields = Object.keys(instance)
                            .filter(k => !k.startsWith('_') && k !== 'entity')
                            .sort();
                        componentInfos.push(...fields);
                    }
                } catch {
                    // 忽略无法实例化的组件
                }
            }
            
            // 对所有信息进行哈希
            if (componentInfos.length === 0) {
                return 0;
            }
            
            const schemaString = componentInfos.join('|');
            const bytes = stringToUtf8Bytes(schemaString);
            return murmur3_32(bytes);
        } catch (error) {
            this._logger.warn('计算Schema哈希失败，使用默认值0:', error);
            return 0;
        }
    }
}