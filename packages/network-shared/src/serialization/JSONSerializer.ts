/**
 * JSON序列化器
 * 提供高性能的消息序列化和反序列化功能，包括类型安全检查
 */
import { createLogger } from '@esengine/ecs-framework';
import { INetworkMessage, MessageType } from '../types/NetworkTypes';

/**
 * 序列化器配置
 */
export interface SerializerConfig {
    enableTypeChecking: boolean;
    enableCompression: boolean;
    maxMessageSize: number;
    enableProfiling: boolean;
    customSerializers?: Map<string, ICustomSerializer>;
}

/**
 * 自定义序列化器接口
 */
export interface ICustomSerializer {
    serialize(data: any): any;
    deserialize(data: any): any;
    canHandle(data: any): boolean;
}

/**
 * 序列化结果
 */
export interface SerializationResult {
    data: string | Buffer;
    size: number;
    compressionRatio?: number;
    serializationTime: number;
}

/**
 * 反序列化结果
 */
export interface DeserializationResult<T = any> {
    data: T;
    deserializationTime: number;
    isValid: boolean;
    errors?: string[];
}

/**
 * 序列化统计信息
 */
export interface SerializationStats {
    totalSerialized: number;
    totalDeserialized: number;
    totalBytes: number;
    averageSerializationTime: number;
    averageDeserializationTime: number;
    averageMessageSize: number;
    errorCount: number;
    compressionSavings: number;
}

/**
 * JSON序列化器
 */
export class JSONSerializer {
    private logger = createLogger('JSONSerializer');
    private config: SerializerConfig;
    private stats: SerializationStats;

    // 性能分析
    private serializationTimes: number[] = [];
    private deserializationTimes: number[] = [];
    private messageSizes: number[] = [];

    /**
     * 构造函数
     */
    constructor(config: Partial<SerializerConfig> = {}) {
        this.config = {
            enableTypeChecking: true,
            enableCompression: false,
            maxMessageSize: 1024 * 1024, // 1MB
            enableProfiling: false,
            ...config
        };

        this.stats = {
            totalSerialized: 0,
            totalDeserialized: 0,
            totalBytes: 0,
            averageSerializationTime: 0,
            averageDeserializationTime: 0,
            averageMessageSize: 0,
            errorCount: 0,
            compressionSavings: 0
        };
    }

    /**
     * 序列化消息
     */
    serialize<T extends INetworkMessage>(message: T): SerializationResult {
        const startTime = performance.now();

        try {
            // 类型检查
            if (this.config.enableTypeChecking) {
                this.validateMessage(message);
            }

            // 预处理消息
            const processedMessage = this.preprocessMessage(message);

            // 序列化
            let serializedData: string;

            // 使用自定义序列化器
            const customSerializer = this.findCustomSerializer(processedMessage);
            if (customSerializer) {
                serializedData = JSON.stringify(customSerializer.serialize(processedMessage));
            } else {
                serializedData = JSON.stringify(processedMessage, this.createReplacer());
            }

            // 检查大小限制
            if (serializedData.length > this.config.maxMessageSize) {
                throw new Error(`消息大小超过限制: ${serializedData.length} > ${this.config.maxMessageSize}`);
            }

            const endTime = performance.now();
            const serializationTime = endTime - startTime;

            // 更新统计
            this.updateSerializationStats(serializedData.length, serializationTime);

            return {
                data: serializedData,
                size: serializedData.length,
                serializationTime
            };

        } catch (error) {
            this.stats.errorCount++;
            this.logger.error('序列化失败:', error);
            throw error;
        }
    }

    /**
     * 反序列化消息
     */
    deserialize<T extends INetworkMessage>(data: string | ArrayBuffer): DeserializationResult<T> {
        const startTime = performance.now();

        try {
            // 转换数据格式
            const jsonString = data instanceof ArrayBuffer ? new TextDecoder().decode(data) :
                typeof data === 'string' ? data : String(data);

            // 解析JSON
            const parsedData = JSON.parse(jsonString, this.createReviver());

            // 类型检查
            const validationResult = this.config.enableTypeChecking ?
                this.validateParsedMessage(parsedData) : { isValid: true, errors: [] };

            // 后处理消息
            const processedMessage = this.postprocessMessage(parsedData);

            const endTime = performance.now();
            const deserializationTime = endTime - startTime;

            // 更新统计
            this.updateDeserializationStats(deserializationTime);

            return {
                data: processedMessage as T,
                deserializationTime,
                isValid: validationResult.isValid,
                errors: validationResult.errors
            };

        } catch (error) {
            this.stats.errorCount++;
            this.logger.error('反序列化失败:', error);

            return {
                data: {} as T,
                deserializationTime: performance.now() - startTime,
                isValid: false,
                errors: [error instanceof Error ? error.message : '未知错误']
            };
        }
    }

    /**
     * 批量序列化
     */
    serializeBatch<T extends INetworkMessage>(messages: T[]): SerializationResult {
        const startTime = performance.now();

        try {
            const batchData = {
                type: 'batch',
                messages: messages.map((msg) => {
                    if (this.config.enableTypeChecking) {
                        this.validateMessage(msg);
                    }
                    return this.preprocessMessage(msg);
                }),
                timestamp: Date.now()
            };

            const serializedData = JSON.stringify(batchData, this.createReplacer());

            if (serializedData.length > this.config.maxMessageSize) {
                throw new Error(`批量消息大小超过限制: ${serializedData.length} > ${this.config.maxMessageSize}`);
            }

            const endTime = performance.now();
            const serializationTime = endTime - startTime;

            this.updateSerializationStats(serializedData.length, serializationTime);

            return {
                data: serializedData,
                size: serializedData.length,
                serializationTime
            };

        } catch (error) {
            this.stats.errorCount++;
            this.logger.error('批量序列化失败:', error);
            throw error;
        }
    }

    /**
     * 批量反序列化
     */
    deserializeBatch<T extends INetworkMessage>(data: string | ArrayBuffer): DeserializationResult<T[]> {
        const result = this.deserialize<any>(data);

        if (!result.isValid || !result.data.messages) {
            return {
                data: [],
                deserializationTime: result.deserializationTime,
                isValid: false,
                errors: ['无效的批量消息格式']
            };
        }

        const messages = result.data.messages.map((msg: any) => this.postprocessMessage(msg));

        return {
            data: messages as T[],
            deserializationTime: result.deserializationTime,
            isValid: true
        };
    }

    /**
     * 获取统计信息
     */
    getStats(): SerializationStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            totalSerialized: 0,
            totalDeserialized: 0,
            totalBytes: 0,
            averageSerializationTime: 0,
            averageDeserializationTime: 0,
            averageMessageSize: 0,
            errorCount: 0,
            compressionSavings: 0
        };

        this.serializationTimes.length = 0;
        this.deserializationTimes.length = 0;
        this.messageSizes.length = 0;
    }

    /**
     * 添加自定义序列化器
     */
    addCustomSerializer(name: string, serializer: ICustomSerializer): void {
        if (!this.config.customSerializers) {
            this.config.customSerializers = new Map();
        }
        this.config.customSerializers.set(name, serializer);
    }

    /**
     * 移除自定义序列化器
     */
    removeCustomSerializer(name: string): boolean {
        return this.config.customSerializers?.delete(name) || false;
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<SerializerConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('序列化器配置已更新:', newConfig);
    }

    /**
     * 验证消息格式
     */
    private validateMessage(message: INetworkMessage): void {
        if (!message.type || !message.messageId || !message.timestamp) {
            throw new Error('消息格式无效：缺少必需字段');
        }

        if (!Object.values(MessageType).includes(message.type)) {
            throw new Error(`无效的消息类型: ${message.type}`);
        }

        if (typeof message.timestamp !== 'number' || message.timestamp <= 0) {
            throw new Error('无效的时间戳');
        }
    }

    /**
     * 验证解析后的消息
     */
    private validateParsedMessage(data: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data || typeof data !== 'object') {
            errors.push('消息必须是对象');
        } else {
            if (!data.type) errors.push('缺少消息类型');
            if (!data.messageId) errors.push('缺少消息ID');
            if (!data.timestamp) errors.push('缺少时间戳');
            if (!data.senderId) errors.push('缺少发送者ID');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 预处理消息（序列化前）
     */
    private preprocessMessage(message: INetworkMessage): any {
        // 克隆消息以避免修改原始对象
        const processed = { ...message };

        // 处理特殊数据类型
        if (processed.data) {
            processed.data = this.serializeSpecialTypes(processed.data);
        }

        return processed;
    }

    /**
     * 后处理消息（反序列化后）
     */
    private postprocessMessage(data: any): any {
        if (data.data) {
            data.data = this.deserializeSpecialTypes(data.data);
        }

        return data;
    }

    /**
     * 序列化特殊类型
     */
    private serializeSpecialTypes(data: any): any {
        if (data instanceof Date) {
            return { __type: 'Date', value: data.toISOString() };
        } else if (data instanceof Map) {
            return { __type: 'Map', value: Array.from(data.entries()) };
        } else if (data instanceof Set) {
            return { __type: 'Set', value: Array.from(data) };
        } else if (ArrayBuffer.isView(data)) {
            return { __type: 'TypedArray', value: Array.from(data as any), constructor: data.constructor.name };
        } else if (data && typeof data === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(data)) {
                result[key] = this.serializeSpecialTypes(value);
            }
            return result;
        }

        return data;
    }

    /**
     * 反序列化特殊类型
     */
    private deserializeSpecialTypes(data: any): any {
        if (data && typeof data === 'object' && data.__type) {
            switch (data.__type) {
                case 'Date':
                    return new Date(data.value);
                case 'Map':
                    return new Map(data.value);
                case 'Set':
                    return new Set(data.value);
                case 'TypedArray':
                    const constructor = (globalThis as any)[data.constructor];
                    return constructor ? new constructor(data.value) : data.value;
            }
        } else if (data && typeof data === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(data)) {
                result[key] = this.deserializeSpecialTypes(value);
            }
            return result;
        }

        return data;
    }

    /**
     * 创建JSON.stringify替换函数
     */
    private createReplacer() {
        return (key: string, value: any) => {
            // 处理循环引用
            if (value && typeof value === 'object') {
                if (value.__serializing) {
                    return '[Circular Reference]';
                }
                value.__serializing = true;
            }
            return value;
        };
    }

    /**
     * 创建JSON.parse恢复函数
     */
    private createReviver() {
        return (key: string, value: any) => {
            // 清理序列化标记
            if (value && typeof value === 'object') {
                delete value.__serializing;
            }
            return value;
        };
    }

    /**
     * 查找自定义序列化器
     */
    private findCustomSerializer(data: any): ICustomSerializer | undefined {
        if (!this.config.customSerializers) {
            return undefined;
        }

        for (const serializer of this.config.customSerializers.values()) {
            if (serializer.canHandle(data)) {
                return serializer;
            }
        }

        return undefined;
    }

    /**
     * 更新序列化统计
     */
    private updateSerializationStats(size: number, time: number): void {
        this.stats.totalSerialized++;
        this.stats.totalBytes += size;

        this.serializationTimes.push(time);
        this.messageSizes.push(size);

        // 保持最近1000个样本
        if (this.serializationTimes.length > 1000) {
            this.serializationTimes.shift();
        }
        if (this.messageSizes.length > 1000) {
            this.messageSizes.shift();
        }

        // 计算平均值
        this.stats.averageSerializationTime =
            this.serializationTimes.reduce((sum, t) => sum + t, 0) / this.serializationTimes.length;
        this.stats.averageMessageSize =
            this.messageSizes.reduce((sum, s) => sum + s, 0) / this.messageSizes.length;
    }

    /**
     * 更新反序列化统计
     */
    private updateDeserializationStats(time: number): void {
        this.stats.totalDeserialized++;

        this.deserializationTimes.push(time);

        // 保持最近1000个样本
        if (this.deserializationTimes.length > 1000) {
            this.deserializationTimes.shift();
        }

        // 计算平均值
        this.stats.averageDeserializationTime =
            this.deserializationTimes.reduce((sum, t) => sum + t, 0) / this.deserializationTimes.length;
    }

    /**
     * 获取性能分析报告
     */
    getPerformanceReport() {
        return {
            stats: this.getStats(),
            serializationTimes: [...this.serializationTimes],
            deserializationTimes: [...this.deserializationTimes],
            messageSizes: [...this.messageSizes],
            percentiles: {
                serialization: this.calculatePercentiles(this.serializationTimes),
                deserialization: this.calculatePercentiles(this.deserializationTimes),
                messageSize: this.calculatePercentiles(this.messageSizes)
            }
        };
    }

    /**
     * 计算百分位数
     */
    private calculatePercentiles(values: number[]) {
        if (values.length === 0) return {};

        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;

        return {
            p50: sorted[Math.floor(n * 0.5)],
            p90: sorted[Math.floor(n * 0.9)],
            p95: sorted[Math.floor(n * 0.95)],
            p99: sorted[Math.floor(n * 0.99)]
        };
    }
}
