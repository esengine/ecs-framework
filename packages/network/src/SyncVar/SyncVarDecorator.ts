import 'reflect-metadata';

/**
 * SyncVar配置选项
 */
export interface SyncVarOptions {
    /**
     * 值变化时的回调函数名
     * 
     * 回调函数签名: (oldValue: T, newValue: T) => void
     */
    hook?: string;
    
    /**
     * 是否只有拥有权限的客户端才能修改
     * 
     * 默认为false，任何客户端都可以修改
     */
    authorityOnly?: boolean;
    
    /**
     * 自定义序列化函数
     * 
     * 如果不提供，将使用默认的类型序列化
     */
    serializer?: (value: any) => Uint8Array;
    
    /**
     * 自定义反序列化函数
     */
    deserializer?: (data: Uint8Array) => any;
    
    /**
     * 同步频率限制（毫秒）
     * 
     * 防止过于频繁的网络同步，默认为0（不限制）
     */
    throttleMs?: number;
}

/**
 * SyncVar元数据信息
 */
export interface SyncVarMetadata {
    /**
     * 属性名称
     */
    propertyKey: string;
    
    /**
     * 字段编号（用于protobuf序列化）
     */
    fieldNumber: number;
    
    /**
     * 配置选项
     */
    options: SyncVarOptions;
    
    /**
     * 属性类型
     */
    type: Function;
    
    /**
     * 最后同步时间（用于频率限制）
     */
    lastSyncTime: number;
}

/**
 * SyncVar元数据存储
 */
const SYNCVAR_METADATA_KEY = Symbol('syncvar:metadata');
const SYNCVAR_FIELD_COUNTER = Symbol('syncvar:field_counter');

/**
 * 获取类的SyncVar元数据
 * 
 * @param target - 目标类
 * @returns SyncVar元数据数组
 */
export function getSyncVarMetadata(target: any): SyncVarMetadata[] {
    return Reflect.getMetadata(SYNCVAR_METADATA_KEY, target) || [];
}

/**
 * 设置类的SyncVar元数据
 * 
 * @param target - 目标类
 * @param metadata - 元数据数组
 */
export function setSyncVarMetadata(target: any, metadata: SyncVarMetadata[]): void {
    Reflect.defineMetadata(SYNCVAR_METADATA_KEY, metadata, target);
}

/**
 * 获取下一个可用的字段编号
 * 
 * @param target - 目标类
 * @returns 字段编号
 */
function getNextFieldNumber(target: any): number {
    let counter = Reflect.getMetadata(SYNCVAR_FIELD_COUNTER, target) || 1;
    const nextNumber = counter;
    Reflect.defineMetadata(SYNCVAR_FIELD_COUNTER, counter + 1, target);
    return nextNumber;
}

/**
 * 检查属性是否为SyncVar
 * 
 * @param target - 目标对象
 * @param propertyKey - 属性名
 * @returns 是否为SyncVar
 */
export function isSyncVar(target: any, propertyKey: string): boolean {
    const metadata = getSyncVarMetadata(target.constructor);
    return metadata.some(m => m.propertyKey === propertyKey);
}

/**
 * 获取指定属性的SyncVar元数据
 * 
 * @param target - 目标对象
 * @param propertyKey - 属性名
 * @returns SyncVar元数据
 */
export function getSyncVarMetadataForProperty(target: any, propertyKey: string): SyncVarMetadata | undefined {
    const metadata = getSyncVarMetadata(target.constructor);
    return metadata.find(m => m.propertyKey === propertyKey);
}

/**
 * SyncVar装饰器
 * 
 * 标记字段为自动同步变量，当值改变时会自动发送给其他客户端
 * 
 * @param options - 配置选项
 * 
 * @example
 * ```typescript
 * class PlayerComponent extends NetworkComponent {
 *     @SyncVar()
 *     public health: number = 100;
 *     
 *     @SyncVar({ hook: 'onNameChanged' })
 *     public playerName: string = 'Player';
 *     
 *     @SyncVar({ authorityOnly: true })
 *     public isReady: boolean = false;
 *     
 *     onNameChanged(oldName: string, newName: string) {
 *         console.log(`Name changed: ${oldName} -> ${newName}`);
 *     }
 * }
 * ```
 */
export function SyncVar(options: SyncVarOptions = {}): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol) {
        if (typeof propertyKey !== 'string') {
            throw new Error('SyncVar装饰器只能用于字符串属性名');
        }
        
        // 获取属性类型
        const type = Reflect.getMetadata('design:type', target, propertyKey);
        if (!type) {
            console.warn(`[SyncVar] 无法获取属性 ${propertyKey} 的类型信息`);
        }
        
        // 获取现有元数据
        const existingMetadata = getSyncVarMetadata(target.constructor);
        
        // 检查是否已经存在
        const existingIndex = existingMetadata.findIndex(m => m.propertyKey === propertyKey);
        if (existingIndex !== -1) {
            console.warn(`[SyncVar] 属性 ${propertyKey} 已经被标记为SyncVar，将覆盖配置`);
            existingMetadata[existingIndex].options = options;
            existingMetadata[existingIndex].type = type;
        } else {
            // 添加新的元数据
            const fieldNumber = getNextFieldNumber(target.constructor);
            const metadata: SyncVarMetadata = {
                propertyKey,
                fieldNumber,
                options,
                type,
                lastSyncTime: 0
            };
            
            existingMetadata.push(metadata);
        }
        
        // 保存元数据
        setSyncVarMetadata(target.constructor, existingMetadata);
        
        console.log(`[SyncVar] 注册同步变量: ${target.constructor.name}.${propertyKey}, 字段编号: ${existingMetadata.find(m => m.propertyKey === propertyKey)?.fieldNumber}`);
    };
}

/**
 * 验证SyncVar配置的有效性
 * 
 * @param target - 目标类实例
 * @param metadata - SyncVar元数据
 * @returns 验证结果
 */
export function validateSyncVarMetadata(target: any, metadata: SyncVarMetadata): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    
    // 检查属性是否存在
    if (!(metadata.propertyKey in target)) {
        errors.push(`属性 ${metadata.propertyKey} 不存在于类 ${target.constructor.name} 中`);
    }
    
    // 检查hook函数是否存在
    if (metadata.options.hook) {
        if (typeof target[metadata.options.hook] !== 'function') {
            errors.push(`Hook函数 ${metadata.options.hook} 不存在或不是函数`);
        }
    }
    
    // 检查自定义序列化函数
    if (metadata.options.serializer && typeof metadata.options.serializer !== 'function') {
        errors.push(`自定义序列化函数必须是function类型`);
    }
    
    if (metadata.options.deserializer && typeof metadata.options.deserializer !== 'function') {
        errors.push(`自定义反序列化函数必须是function类型`);
    }
    
    // 检查频率限制
    if (metadata.options.throttleMs !== undefined && 
        (typeof metadata.options.throttleMs !== 'number' || metadata.options.throttleMs < 0)) {
        errors.push(`throttleMs必须是非负数`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * 获取类的所有SyncVar统计信息
 * 
 * @param target - 目标类
 * @returns 统计信息
 */
export function getSyncVarStats(target: any): {
    totalCount: number;
    withHooks: number;
    authorityOnly: number;
    customSerialized: number;
    throttled: number;
    fieldNumbers: number[];
} {
    const metadata = getSyncVarMetadata(target);
    
    return {
        totalCount: metadata.length,
        withHooks: metadata.filter(m => m.options.hook).length,
        authorityOnly: metadata.filter(m => m.options.authorityOnly).length,
        customSerialized: metadata.filter(m => m.options.serializer || m.options.deserializer).length,
        throttled: metadata.filter(m => m.options.throttleMs !== undefined && m.options.throttleMs > 0).length,
        fieldNumbers: metadata.map(m => m.fieldNumber).sort((a, b) => a - b)
    };
}