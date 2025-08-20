/**
 * 高级序列化系统
 * 提供完整场景序列化、版本控制、增量更新等功能
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * 序列化版本信息
 */
export interface SerializationVersion {
    major: number;
    minor: number;
    patch: number;
}

/**
 * 类型注册信息
 */
export interface TypeRegistry {
    typeName: string;
    typeId: number;
    version: SerializationVersion;
    serializer: CustomTypeSerializer<any>;
    dependencies?: string[];
}

/**
 * 自定义类型序列化器接口
 */
export interface CustomTypeSerializer<T> {
    /**
     * 序列化对象
     */
    serialize(obj: T, context: SerializationContext): SerializedData;
    
    /**
     * 反序列化对象
     */
    deserialize(data: SerializedData, context: DeserializationContext): T;
    
    /**
     * 获取版本信息
     */
    getVersion(): SerializationVersion;
    
    /**
     * 获取依赖类型
     */
    getDependencies?(): string[];
    
    /**
     * 验证数据完整性
     */
    validate?(data: SerializedData): boolean;
}

/**
 * 序列化上下文
 */
export interface SerializationContext {
    version: SerializationVersion;
    includeMetadata: boolean;
    enableCompression: boolean;
    referenceMap: Map<any, string>; // 对象引用映射
    circularRefs: Set<any>;         // 循环引用检测
    customSerializers: Map<string, CustomTypeSerializer<any>>;
    options: SerializationOptions;
}

/**
 * 反序列化上下文
 */
export interface DeserializationContext {
    version: SerializationVersion;
    referenceMap: Map<string, any>; // 引用映射（反向）
    customSerializers: Map<string, CustomTypeSerializer<any>>;
    typeRegistry: Map<string, TypeRegistry>;
    options: DeserializationOptions;
}

/**
 * 序列化选项
 */
export interface SerializationOptions {
    includePrivateFields: boolean;
    includeGetters: boolean;
    excludeFields?: string[];
    includeOnlyFields?: string[];
    maxDepth: number;
    enableTypeInference: boolean;
    preserveInstanceTypes: boolean;
}

/**
 * 反序列化选项
 */
export interface DeserializationOptions {
    strictTypeChecking: boolean;
    allowVersionMismatch: boolean;
    createMissingTypes: boolean;
    validateReferences: boolean;
    repairCircularRefs: boolean;
}

/**
 * 序列化数据结构
 */
export interface SerializedData {
    __type: string;
    __version: SerializationVersion;
    __id?: string;
    data: Record<string, any>;
    metadata?: {
        serializedAt: number;
        serializer: string;
        size: number;
        compressed: boolean;
        checksum?: string;
    };
}

/**
 * 增量更新数据
 */
export interface IncrementalUpdate {
    updateId: string;
    timestamp: number;
    baseVersion?: string;
    changes: Change[];
    metadata: {
        changeCount: number;
        affectedObjects: string[];
        size: number;
    };
}

/**
 * 变更操作
 */
export interface Change {
    type: 'add' | 'remove' | 'modify' | 'move';
    path: string;           // JSON路径
    oldValue?: any;
    newValue?: any;
    objectId?: string;      // 对象引用ID
}

/**
 * 高级序列化器事件
 */
export interface AdvancedSerializerEvents {
    'serialization:start': (context: SerializationContext) => void;
    'serialization:complete': (result: SerializationResult) => void;
    'serialization:error': (error: string, context: any) => void;
    'deserialization:start': (context: DeserializationContext) => void;
    'deserialization:complete': (result: DeserializationResult) => void;
    'deserialization:error': (error: string, context: any) => void;
    'type:registered': (registry: TypeRegistry) => void;
    'circular:reference:detected': (path: string, object: any) => void;
}

/**
 * 序列化结果
 */
export interface SerializationResult {
    success: boolean;
    data?: SerializedData;
    error?: string;
    metadata: {
        originalSize: number;
        serializedSize: number;
        compressionRatio: number;
        serializationTime: number;
        objectCount: number;
        typeCount: number;
    };
}

/**
 * 反序列化结果
 */
export interface DeserializationResult {
    success: boolean;
    data?: any;
    errors?: string[];
    warnings?: string[];
    metadata: {
        deserializationTime: number;
        objectCount: number;
        referencesResolved: number;
        circularRefsRepaired: number;
    };
}

/**
 * 高级序列化器
 */
export class AdvancedSerializer extends EventEmitter<AdvancedSerializerEvents> {
    private logger = createLogger('AdvancedSerializer');
    private typeRegistry: Map<string, TypeRegistry> = new Map();
    private nextTypeId: number = 1000;
    private version: SerializationVersion = { major: 1, minor: 0, patch: 0 };

    // 内置类型序列化器
    private builtinSerializers: Map<string, CustomTypeSerializer<any>> = new Map();

    constructor() {
        super();
        this.initializeBuiltinSerializers();
    }

    /**
     * 注册自定义类型序列化器
     */
    registerTypeSerializer<T>(
        typeName: string,
        serializer: CustomTypeSerializer<T>,
        dependencies?: string[]
    ): void {
        const registry: TypeRegistry = {
            typeName,
            typeId: this.nextTypeId++,
            version: serializer.getVersion(),
            serializer,
            dependencies
        };

        this.typeRegistry.set(typeName, registry);
        this.emit('type:registered', registry);
        
        this.logger.info(`注册类型序列化器: ${typeName} (ID: ${registry.typeId})`);
    }

    /**
     * 序列化对象
     */
    serialize(
        obj: any,
        options: Partial<SerializationOptions> = {}
    ): SerializationResult {
        const startTime = Date.now();
        
        const context: SerializationContext = {
            version: this.version,
            includeMetadata: true,
            enableCompression: false,
            referenceMap: new Map(),
            circularRefs: new Set(),
            customSerializers: new Map(Array.from(this.typeRegistry.entries()).map(([name, registry]) => [name, registry.serializer])),
            options: {
                includePrivateFields: false,
                includeGetters: false,
                maxDepth: 10,
                enableTypeInference: true,
                preserveInstanceTypes: true,
                ...options
            }
        };

        this.emit('serialization:start', context);

        try {
            const serializedData = this.serializeObject(obj, context, '');
            const serializationTime = Date.now() - startTime;

            // 计算大小信息
            const dataString = JSON.stringify(serializedData);
            const originalSize = JSON.stringify(obj).length;
            const serializedSize = dataString.length;

            const result: SerializationResult = {
                success: true,
                data: serializedData,
                metadata: {
                    originalSize,
                    serializedSize,
                    compressionRatio: originalSize > 0 ? serializedSize / originalSize : 1,
                    serializationTime,
                    objectCount: context.referenceMap.size,
                    typeCount: new Set(Array.from(context.referenceMap.keys()).map(ref => 
                        typeof ref === 'object' && ref !== null && ref.constructor ? ref.constructor.name : typeof ref
                    )).size
                }
            };

            this.emit('serialization:complete', result);
            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown serialization error';
            this.emit('serialization:error', errorMessage, context);
            
            return {
                success: false,
                error: errorMessage,
                metadata: {
                    originalSize: 0,
                    serializedSize: 0,
                    compressionRatio: 0,
                    serializationTime: Date.now() - startTime,
                    objectCount: 0,
                    typeCount: 0
                }
            };
        }
    }

    /**
     * 反序列化对象
     */
    deserialize(
        data: SerializedData,
        options: Partial<DeserializationOptions> = {}
    ): DeserializationResult {
        const startTime = Date.now();
        
        const context: DeserializationContext = {
            version: this.version,
            referenceMap: new Map(),
            customSerializers: new Map(Array.from(this.typeRegistry.entries()).map(([name, registry]) => [name, registry.serializer])),
            typeRegistry: this.typeRegistry,
            options: {
                strictTypeChecking: true,
                allowVersionMismatch: false,
                createMissingTypes: false,
                validateReferences: true,
                repairCircularRefs: true,
                ...options
            }
        };

        this.emit('deserialization:start', context);

        try {
            const deserializedObj = this.deserializeObject(data, context);
            const deserializationTime = Date.now() - startTime;

            const result: DeserializationResult = {
                success: true,
                data: deserializedObj,
                metadata: {
                    deserializationTime,
                    objectCount: context.referenceMap.size,
                    referencesResolved: context.referenceMap.size,
                    circularRefsRepaired: 0 // TODO: 实现循环引用修复计数
                }
            };

            this.emit('deserialization:complete', result);
            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown deserialization error';
            this.emit('deserialization:error', errorMessage, context);
            
            return {
                success: false,
                errors: [errorMessage],
                metadata: {
                    deserializationTime: Date.now() - startTime,
                    objectCount: 0,
                    referencesResolved: 0,
                    circularRefsRepaired: 0
                }
            };
        }
    }

    /**
     * 创建增量更新
     */
    createIncrementalUpdate(
        oldData: SerializedData,
        newData: SerializedData
    ): IncrementalUpdate {
        const changes = this.calculateChanges(oldData, newData);
        
        return {
            updateId: this.generateId(),
            timestamp: Date.now(),
            baseVersion: oldData.__id,
            changes,
            metadata: {
                changeCount: changes.length,
                affectedObjects: [...new Set(changes.map(c => c.objectId).filter((id): id is string => Boolean(id)))],
                size: JSON.stringify(changes).length
            }
        };
    }

    /**
     * 应用增量更新
     */
    applyIncrementalUpdate(
        baseData: SerializedData,
        update: IncrementalUpdate
    ): SerializedData {
        const updatedData = JSON.parse(JSON.stringify(baseData)); // 深拷贝

        for (const change of update.changes) {
            this.applyChange(updatedData, change);
        }

        return updatedData;
    }

    /**
     * 序列化对象（内部方法）
     */
    private serializeObject(
        obj: any,
        context: SerializationContext,
        path: string,
        depth: number = 0
    ): SerializedData {
        // 检查深度限制
        if (depth >= context.options.maxDepth) {
            return {
                __type: 'MaxDepthExceeded',
                __version: context.version,
                data: { path }
            };
        }

        // 检查循环引用
        if (context.circularRefs.has(obj)) {
            this.emit('circular:reference:detected', path, obj);
            const refId = context.referenceMap.get(obj);
            return {
                __type: 'CircularReference',
                __version: context.version,
                data: { refId }
            };
        }

        // 处理基础类型
        if (obj === null || typeof obj !== 'object') {
            return {
                __type: typeof obj,
                __version: context.version,
                data: { value: obj }
            };
        }

        // 添加到循环引用检测
        context.circularRefs.add(obj);

        try {
            const typeName = obj.constructor.name;
            const objId = this.generateId();
            context.referenceMap.set(obj, objId);

            // 查找自定义序列化器
            const customSerializer = this.getCustomSerializer(typeName, context);
            if (customSerializer) {
                const serializedData = customSerializer.serialize(obj, context);
                serializedData.__id = objId;
                return serializedData;
            }

            // 默认对象序列化
            return this.serializeDefaultObject(obj, context, path, depth + 1, objId);

        } finally {
            // 移除循环引用检测
            context.circularRefs.delete(obj);
        }
    }

    /**
     * 反序列化对象（内部方法）
     */
    private deserializeObject(
        data: SerializedData,
        context: DeserializationContext
    ): any {
        // 检查版本兼容性
        if (!this.isVersionCompatible(data.__version, context.version)) {
            if (!context.options.allowVersionMismatch) {
                throw new Error(`Version mismatch: ${JSON.stringify(data.__version)} vs ${JSON.stringify(context.version)}`);
            }
        }

        // 处理特殊类型
        switch (data.__type) {
            case 'CircularReference':
                const refId = data.data.refId;
                return context.referenceMap.get(refId);
            
            case 'MaxDepthExceeded':
                throw new Error(`Max depth exceeded at path: ${data.data.path}`);
            
            case 'string':
            case 'number':
            case 'boolean':
            case 'undefined':
                return data.data.value;
                
            case 'null':
                return null;
        }

        // 查找自定义序列化器
        const customSerializer = context.customSerializers.get(data.__type);
        if (customSerializer) {
            const deserializedObj = customSerializer.deserialize(data, context);
            if (data.__id) {
                context.referenceMap.set(data.__id, deserializedObj);
            }
            return deserializedObj;
        }

        // 默认对象反序列化
        return this.deserializeDefaultObject(data, context);
    }

    /**
     * 默认对象序列化
     */
    private serializeDefaultObject(
        obj: any,
        context: SerializationContext,
        path: string,
        depth: number,
        objId: string
    ): SerializedData {
        const data: Record<string, any> = {};
        const typeName = obj.constructor.name;

        // 序列化属性
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            
            // 应用字段过滤
            if (context.options.excludeFields?.includes(key)) continue;
            if (context.options.includeOnlyFields && !context.options.includeOnlyFields.includes(key)) continue;

            const value = obj[key];
            const fieldPath = path ? `${path}.${key}` : key;
            
            try {
                data[key] = this.serializeObject(value, context, fieldPath, depth);
            } catch (error) {
                this.logger.warn(`序列化字段失败: ${fieldPath}`, error);
                continue;
            }
        }

        return {
            __type: typeName,
            __version: context.version,
            __id: objId,
            data
        };
    }

    /**
     * 默认对象反序列化
     */
    private deserializeDefaultObject(
        data: SerializedData,
        context: DeserializationContext
    ): any {
        // 创建对象实例（简化实现）
        const obj: any = {};
        
        if (data.__id) {
            context.referenceMap.set(data.__id, obj);
        }

        // 反序列化属性
        for (const key in data.data) {
            try {
                obj[key] = this.deserializeObject(data.data[key], context);
            } catch (error) {
                this.logger.warn(`反序列化字段失败: ${key}`, error);
                continue;
            }
        }

        return obj;
    }

    /**
     * 获取自定义序列化器
     */
    private getCustomSerializer(
        typeName: string,
        context: SerializationContext
    ): CustomTypeSerializer<any> | undefined {
        const registry = this.typeRegistry.get(typeName);
        return registry?.serializer;
    }

    /**
     * 检查版本兼容性
     */
    private isVersionCompatible(
        dataVersion: SerializationVersion,
        contextVersion: SerializationVersion
    ): boolean {
        // 主版本号必须相同
        return dataVersion.major === contextVersion.major;
    }

    /**
     * 计算变更
     */
    private calculateChanges(
        oldData: SerializedData,
        newData: SerializedData
    ): Change[] {
        const changes: Change[] = [];
        
        // 简化实现：比较JSON字符串
        const oldJson = JSON.stringify(oldData);
        const newJson = JSON.stringify(newData);
        
        if (oldJson !== newJson) {
            changes.push({
                type: 'modify',
                path: '',
                oldValue: oldData,
                newValue: newData
            });
        }
        
        return changes;
    }

    /**
     * 应用变更
     */
    private applyChange(data: SerializedData, change: Change): void {
        // 简化实现
        switch (change.type) {
            case 'modify':
                if (change.path === '') {
                    Object.assign(data, change.newValue);
                }
                break;
            // TODO: 实现其他变更类型
        }
    }

    /**
     * 初始化内置序列化器
     */
    private initializeBuiltinSerializers(): void {
        // Array序列化器
        this.registerTypeSerializer('Array', {
            serialize: (arr: any[], context: SerializationContext) => ({
                __type: 'Array',
                __version: this.version,
                data: {
                    items: arr.map((item, index) => 
                        this.serializeObject(item, context, `[${index}]`, 0)
                    )
                }
            }),
            deserialize: (data: SerializedData, context: DeserializationContext) => {
                return data.data.items.map((item: SerializedData) => 
                    this.deserializeObject(item, context)
                );
            },
            getVersion: () => ({ major: 1, minor: 0, patch: 0 })
        });

        // Date序列化器
        this.registerTypeSerializer('Date', {
            serialize: (date: Date) => ({
                __type: 'Date',
                __version: this.version,
                data: { timestamp: date.getTime() }
            }),
            deserialize: (data: SerializedData) => new Date(data.data.timestamp),
            getVersion: () => ({ major: 1, minor: 0, patch: 0 })
        });

        // Map序列化器
        this.registerTypeSerializer('Map', {
            serialize: (map: Map<any, any>, context: SerializationContext) => ({
                __type: 'Map',
                __version: this.version,
                data: {
                    entries: Array.from(map.entries()).map(([key, value], index) => [
                        this.serializeObject(key, context, `[${index}].key`, 0),
                        this.serializeObject(value, context, `[${index}].value`, 0)
                    ])
                }
            }),
            deserialize: (data: SerializedData, context: DeserializationContext) => {
                const map = new Map();
                for (const [keyData, valueData] of data.data.entries) {
                    const key = this.deserializeObject(keyData, context);
                    const value = this.deserializeObject(valueData, context);
                    map.set(key, value);
                }
                return map;
            },
            getVersion: () => ({ major: 1, minor: 0, patch: 0 })
        });
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}