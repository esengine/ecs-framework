import { SyncBatch } from '../sync/SyncVarManager';
import { MessageType, INetworkMessage } from '../types/NetworkTypes';

/**
 * 序列化配置
 */
export interface SyncVarSerializerConfig {
    /** 是否启用压缩 */
    enableCompression: boolean;
    /** 是否启用差量同步 */
    enableDeltaSync: boolean;
    /** 是否启用类型检查 */
    enableTypeChecking: boolean;
    /** 最大消息大小(字节) */
    maxMessageSize: number;
    /** 是否启用批量优化 */
    enableBatching: boolean;
    /** 批量超时时间(毫秒) */
    batchTimeout: number;
}

/**
 * 序列化结果
 */
export interface SerializationResult {
    /** 是否成功 */
    success: boolean;
    /** 序列化的数据 */
    data?: ArrayBuffer | string;
    /** 错误信息 */
    error?: string;
    /** 原始大小 */
    originalSize: number;
    /** 压缩后大小 */
    compressedSize: number;
    /** 压缩比 */
    compressionRatio: number;
}

/**
 * 反序列化结果
 */
export interface DeserializationResult<T = any> {
    /** 是否成功 */
    success: boolean;
    /** 反序列化的数据 */
    data?: T;
    /** 错误信息 */
    errors?: string[];
    /** 是否通过类型检查 */
    isValidType: boolean;
}

/**
 * 字段变化映射
 */
export interface FieldChanges {
    [key: string]: any;
}

/**
 * 序列化差量数据
 */
export interface SerializerDeltaData {
    /** 基础版本 */
    baseVersion: number;
    /** 当前版本 */
    currentVersion: number;
    /** 变化的字段 */
    changes: FieldChanges;
    /** 删除的字段 */
    deletions: string[];
}

/**
 * 压缩元数据
 */
export interface CompressionMetadata {
    /** 压缩算法 */
    algorithm: string;
    /** 原始大小 */
    originalSize: number;
    /** 压缩大小 */
    compressedSize: number;
    /** 压缩时间戳 */
    timestamp: number;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
    deltaHistorySize: number;
    compressionCacheSize: number;
}

/**
 * 压缩结果
 */
export interface CompressionResult {
    success: boolean;
    data?: ArrayBuffer;
}

/**
 * 解压结果
 */
export interface DecompressionResult {
    success: boolean;
    data?: string;
}

/**
 * SyncBatch类型验证结果
 */
export interface SyncBatchValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * SyncVar专用序列化器
 * 针对SyncVar数据进行优化的序列化系统
 */
export class SyncVarSerializer {
    private config: SyncVarSerializerConfig;
    private deltaHistory = new Map<string, { version: number; data: any }>();
    private versionCounter = 0;
    private compressionCache = new Map<string, ArrayBuffer>();

    constructor(config: Partial<SyncVarSerializerConfig> = {}) {
        this.config = {
            enableCompression: true,
            enableDeltaSync: true,
            enableTypeChecking: true,
            maxMessageSize: 64 * 1024, // 64KB
            enableBatching: true,
            batchTimeout: 16, // 16ms (60fps)
            ...config
        };
    }

    /**
     * 序列化SyncVar批次数据
     */
    public serializeSyncBatch(batch: SyncBatch): SerializationResult {
        try {
            const startTime = performance.now();
            
            // 准备序列化数据
            let dataToSerialize: any = batch;
            
            // 应用差量同步
            if (this.config.enableDeltaSync) {
                dataToSerialize = this.applyDeltaCompression(batch);
            }
            
            // 基础JSON序列化
            const jsonString = JSON.stringify(dataToSerialize, this.replacer.bind(this));
            const originalSize = new TextEncoder().encode(jsonString).length;
            
            // 检查消息大小限制
            if (originalSize > this.config.maxMessageSize) {
                return {
                    success: false,
                    error: `消息大小超出限制: ${originalSize} > ${this.config.maxMessageSize}`,
                    originalSize,
                    compressedSize: 0,
                    compressionRatio: 0
                };
            }
            
            let finalData: ArrayBuffer | string = jsonString;
            let compressedSize = originalSize;
            
            // 应用压缩
            if (this.config.enableCompression && originalSize > 256) {
                const compressionResult = this.compress(jsonString);
                if (compressionResult.success && compressionResult.data) {
                    finalData = compressionResult.data;
                    compressedSize = compressionResult.data.byteLength;
                }
            }
            
            const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;
            
            return {
                success: true,
                data: finalData,
                originalSize,
                compressedSize,
                compressionRatio
            };
            
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '序列化失败',
                originalSize: 0,
                compressedSize: 0,
                compressionRatio: 1
            };
        }
    }

    /**
     * 反序列化SyncVar批次数据
     */
    public deserializeSyncBatch(data: ArrayBuffer | string): DeserializationResult<SyncBatch> {
        try {
            let jsonString: string;
            
            // 解压缩
            if (data instanceof ArrayBuffer) {
                const decompressResult = this.decompress(data);
                if (!decompressResult.success || !decompressResult.data) {
                    return {
                        success: false,
                        errors: ['解压缩失败'],
                        isValidType: false
                    };
                }
                jsonString = decompressResult.data;
            } else {
                jsonString = data;
            }
            
            // JSON反序列化
            const parsedData = JSON.parse(jsonString, this.reviver.bind(this));
            
            // 类型检查
            if (this.config.enableTypeChecking) {
                const typeCheckResult = this.validateSyncBatchType(parsedData);
                if (!typeCheckResult.isValid) {
                    return {
                        success: false,
                        errors: typeCheckResult.errors,
                        isValidType: false
                    };
                }
            }
            
            // 应用差量还原
            let finalData = parsedData;
            if (this.config.enableDeltaSync && this.isDeltaData(parsedData)) {
                finalData = this.applyDeltaRestore(parsedData);
            }
            
            return {
                success: true,
                data: finalData as SyncBatch,
                isValidType: true
            };
            
        } catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : '反序列化失败'],
                isValidType: false
            };
        }
    }

    /**
     * 创建网络消息
     */
    public createSyncMessage(batch: SyncBatch, senderId: string): INetworkMessage {
        const serializedData = this.serializeSyncBatch(batch);
        
        return {
            type: MessageType.SYNC_BATCH,
            messageId: this.generateMessageId(),
            timestamp: Date.now(),
            senderId,
            data: serializedData.data,
            reliable: true,
            priority: this.calculateMessagePriority(batch)
        };
    }

    /**
     * 解析网络消息
     */
    public parseSyncMessage(message: INetworkMessage): DeserializationResult<SyncBatch> {
        if (message.type !== MessageType.SYNC_BATCH) {
            return {
                success: false,
                errors: ['消息类型不匹配'],
                isValidType: false
            };
        }
        
        return this.deserializeSyncBatch(message.data);
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<SyncVarSerializerConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * 获取配置
     */
    public getConfig(): SyncVarSerializerConfig {
        return { ...this.config };
    }

    /**
     * 清理缓存
     */
    public clearCache(): void {
        this.deltaHistory.clear();
        this.compressionCache.clear();
        this.versionCounter = 0;
    }

    /**
     * 获取缓存统计
     */
    public getCacheStats(): CacheStats {
        return {
            deltaHistorySize: this.deltaHistory.size,
            compressionCacheSize: this.compressionCache.size
        };
    }

    /**
     * 应用差量压缩
     */
    private applyDeltaCompression(batch: SyncBatch): SerializerDeltaData | SyncBatch {
        const key = batch.instanceId;
        const lastRecord = this.deltaHistory.get(key);
        
        if (!lastRecord) {
            // 第一次同步，存储完整数据
            this.deltaHistory.set(key, {
                version: ++this.versionCounter,
                data: { ...batch }
            });
            return batch;
        }
        
        // 计算差量
        const changes: { [key: string]: any } = {};
        const deletions: string[] = [];
        
        // 检查变化的属性
        for (const [prop, value] of Object.entries(batch.changes)) {
            if (!lastRecord.data.changes || lastRecord.data.changes[prop] !== value) {
                changes[prop] = value;
            }
        }
        
        // 检查删除的属性
        if (lastRecord.data.changes) {
            for (const prop of Object.keys(lastRecord.data.changes)) {
                if (!(prop in batch.changes)) {
                    deletions.push(prop);
                }
            }
        }
        
        // 如果没有变化，返回空的差量数据
        if (Object.keys(changes).length === 0 && deletions.length === 0) {
            return {
                baseVersion: lastRecord.version,
                currentVersion: lastRecord.version,
                changes: {},
                deletions: []
            };
        }
        
        // 更新历史记录
        const currentVersion = ++this.versionCounter;
        this.deltaHistory.set(key, {
            version: currentVersion,
            data: { ...batch }
        });
        
        return {
            baseVersion: lastRecord.version,
            currentVersion,
            changes,
            deletions
        };
    }

    /**
     * 应用差量还原
     */
    private applyDeltaRestore(deltaData: SerializerDeltaData): SyncBatch {
        // 这里应该根据baseVersion找到对应的基础数据
        // 简化实现，返回一个基本的SyncBatch
        return {
            instanceId: 'unknown',
            instanceType: 'unknown',
            changes: deltaData.changes,
            timestamp: Date.now(),
            syncModes: {},
            authorities: {},
            scopes: {},
            priorities: {}
        };
    }

    /**
     * 检查是否为差量数据
     */
    private isDeltaData(data: any): data is SerializerDeltaData {
        return data && 
               typeof data.baseVersion === 'number' &&
               typeof data.currentVersion === 'number' &&
               typeof data.changes === 'object' &&
               Array.isArray(data.deletions);
    }

    /**
     * 压缩数据
     */
    private compress(data: string): CompressionResult {
        try {
            // 使用LZ字符串压缩算法
            const compressed = this.lzCompress(data);
            const encoder = new TextEncoder();
            const bytes = encoder.encode(compressed);
            
            return {
                success: true,
                data: bytes.buffer
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * 解压缩数据
     */
    private decompress(data: ArrayBuffer): DecompressionResult {
        try {
            const decoder = new TextDecoder();
            const compressedString = decoder.decode(data);
            const decompressed = this.lzDecompress(compressedString);
            
            return {
                success: true,
                data: decompressed
            };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * JSON序列化替换函数
     */
    private replacer(key: string, value: any): any {
        // 处理特殊类型的序列化
        if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
        }
        
        if (value instanceof Map) {
            return { __type: 'Map', value: Array.from(value.entries()) };
        }
        
        if (value instanceof Set) {
            return { __type: 'Set', value: Array.from(value) };
        }
        
        // 处理BigInt
        if (typeof value === 'bigint') {
            return { __type: 'BigInt', value: value.toString() };
        }
        
        return value;
    }

    /**
     * JSON反序列化恢复函数
     */
    private reviver(key: string, value: any): any {
        if (value && typeof value === 'object' && value.__type) {
            switch (value.__type) {
                case 'Date':
                    return new Date(value.value);
                case 'Map':
                    return new Map(value.value);
                case 'Set':
                    return new Set(value.value);
                case 'BigInt':
                    return BigInt(value.value);
            }
        }
        
        return value;
    }

    /**
     * 验证SyncBatch类型
     */
    private validateSyncBatchType(data: any): SyncBatchValidationResult {
        const errors: string[] = [];
        
        if (!data || typeof data !== 'object') {
            errors.push('数据不是对象');
            return { isValid: false, errors };
        }
        
        if (typeof data.instanceId !== 'string') {
            errors.push('instanceId必须是字符串');
        }
        
        if (typeof data.instanceType !== 'string') {
            errors.push('instanceType必须是字符串');
        }
        
        if (!data.changes || typeof data.changes !== 'object') {
            errors.push('changes必须是对象');
        }
        
        if (typeof data.timestamp !== 'number') {
            errors.push('timestamp必须是数字');
        }
        
        return { isValid: errors.length === 0, errors };
    }

    /**
     * 生成消息ID
     */
    private generateMessageId(): string {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 计算消息优先级
     */
    private calculateMessagePriority(batch: SyncBatch): number {
        // 根据批次中属性的优先级计算整体优先级
        const priorities = Object.values(batch.priorities);
        if (priorities.length === 0) {
            return 5; // 默认优先级
        }
        
        // 使用最高优先级
        return Math.max(...priorities);
    }

    /**
     * LZ字符串压缩算法
     */
    private lzCompress(input: string): string {
        if (!input) return '';
        
        const dictionary: { [key: string]: number } = {};
        let dictSize = 256;
        
        // 初始化字典
        for (let i = 0; i < 256; i++) {
            dictionary[String.fromCharCode(i)] = i;
        }
        
        let w = '';
        const result: number[] = [];
        
        for (let i = 0; i < input.length; i++) {
            const c = input.charAt(i);
            const wc = w + c;
            
            if (dictionary[wc] !== undefined) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                dictionary[wc] = dictSize++;
                w = c;
            }
        }
        
        if (w) {
            result.push(dictionary[w]);
        }
        
        // 将结果编码为Base64以确保字符串安全
        return this.arrayToBase64(result);
    }

    /**
     * LZ字符串解压缩算法
     */
    private lzDecompress(compressed: string): string {
        if (!compressed) return '';
        
        const data = this.base64ToArray(compressed);
        if (data.length === 0) return '';
        
        const dictionary: { [key: number]: string } = {};
        let dictSize = 256;
        
        // 初始化字典
        for (let i = 0; i < 256; i++) {
            dictionary[i] = String.fromCharCode(i);
        }
        
        let w = String.fromCharCode(data[0]);
        const result = [w];
        
        for (let i = 1; i < data.length; i++) {
            const k = data[i];
            let entry: string;
            
            if (dictionary[k] !== undefined) {
                entry = dictionary[k];
            } else if (k === dictSize) {
                entry = w + w.charAt(0);
            } else {
                throw new Error('解压缩错误：无效的压缩数据');
            }
            
            result.push(entry);
            dictionary[dictSize++] = w + entry.charAt(0);
            w = entry;
        }
        
        return result.join('');
    }

    /**
     * 数组转Base64
     */
    private arrayToBase64(array: number[]): string {
        // 将数字数组转换为字节数组
        const bytes: number[] = [];
        for (const num of array) {
            if (num < 256) {
                bytes.push(num);
            } else {
                // 大于255的数字用两个字节表示
                bytes.push(255, num - 255);
            }
        }
        
        // 转换为字符串然后编码为Base64
        const binaryString = String.fromCharCode(...bytes);
        return btoa(binaryString);
    }

    /**
     * Base64转数组
     */
    private base64ToArray(base64: string): number[] {
        try {
            const binaryString = atob(base64);
            const bytes: number[] = [];
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes.push(binaryString.charCodeAt(i));
            }
            
            // 还原原始数字数组
            const result: number[] = [];
            for (let i = 0; i < bytes.length; i++) {
                if (bytes[i] === 255 && i + 1 < bytes.length) {
                    result.push(255 + bytes[i + 1]);
                    i++; // 跳过下一个字节
                } else {
                    result.push(bytes[i]);
                }
            }
            
            return result;
        } catch (error) {
            throw new Error('Base64解码失败');
        }
    }
}