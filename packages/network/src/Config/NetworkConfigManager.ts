/**
 * 网络配置管理器
 */

import { 
    NETWORK_CONFIG, 
    SYNCVAR_CONFIG, 
    MESSAGE_CONFIG, 
    SERIALIZATION_CONFIG,
    TSRPC_CONFIG,
    AUTHORITY_CONFIG,
    PERFORMANCE_CONFIG
} from '../constants/NetworkConstants';

/**
 * 网络配置接口
 */
export interface INetworkConfig {
    [key: string]: unknown;
    /** 连接配置 */
    connection: {
        timeout: number;
        maxReconnectAttempts: number;
        reconnectDelay: number;
    };
    
    /** 心跳配置 */
    heartbeat: {
        interval: number;
        timeout: number;
        maxConsecutiveLoss: number;
        packetSize: number;
        enableAdaptiveInterval: boolean;
        rttHistorySize: number;
    };
    
    /** SyncVar配置 */
    syncVar: {
        cacheTimeout: number;
        defaultThrottleMs: number;
        maxFieldNumber: number;
        minFieldNumber: number;
    };
    
    /** 消息配置 */
    message: {
        maxSequenceNumber: number;
        maxHeaderSize: number;
        maxPayloadSize: number;
        defaultTimeout: number;
        maxBatchSize: number;
    };
    
    /** 序列化配置 */
    serialization: {
        defaultCompressionLevel: number;
        minCompressionSize: number;
        initialBufferSize: number;
        maxBufferSize: number;
    };
    
    /** TSRPC配置 */
    tsrpc: {
        defaultServerUrl: string;
        defaultTimeout: number;
        heartbeatInterval: number;
        heartbeatTimeout: number;
        poolConfig: {
            minConnections: number;
            maxConnections: number;
            idleTimeout: number;
        };
    };
    
    /** 权限配置 */
    authority: {
        minPriority: number;
        maxPriority: number;
        defaultRulePriority: number;
    };
    
    /** 性能监控配置 */
    performance: {
        statsCollectionInterval: number;
        statsRetentionTime: number;
        warningThresholds: {
            rtt: number;
            packetLoss: number;
            jitter: number;
            cpuUsage: number;
            memoryUsage: number;
        };
    };
}

/**
 * 配置更新事件接口
 */
export interface IConfigUpdateEvent<T = unknown> {
    path: string;
    oldValue: T;
    newValue: T;
    timestamp: number;
}

/**
 * 配置管理器
 * 
 * 提供类型安全的配置管理，支持配置更新监听和验证
 */
export class NetworkConfigManager {
    private static _instance: NetworkConfigManager | null = null;
    private _config: INetworkConfig;
    private _updateListeners: Map<string, Array<(event: IConfigUpdateEvent) => void>> = new Map();
    
    private constructor() {
        this._config = this.createDefaultConfig();
    }
    
    public static get Instance(): NetworkConfigManager {
        if (!NetworkConfigManager._instance) {
            NetworkConfigManager._instance = new NetworkConfigManager();
        }
        return NetworkConfigManager._instance;
    }
    
    /**
     * 创建默认配置
     */
    private createDefaultConfig(): INetworkConfig {
        return {
            connection: {
                timeout: NETWORK_CONFIG.DEFAULT_CONNECTION_TIMEOUT,
                maxReconnectAttempts: NETWORK_CONFIG.DEFAULT_MAX_RECONNECT_ATTEMPTS,
                reconnectDelay: NETWORK_CONFIG.DEFAULT_RECONNECT_DELAY
            },
            heartbeat: {
                interval: NETWORK_CONFIG.DEFAULT_HEARTBEAT_INTERVAL,
                timeout: NETWORK_CONFIG.DEFAULT_HEARTBEAT_TIMEOUT,
                maxConsecutiveLoss: NETWORK_CONFIG.DEFAULT_MAX_CONSECUTIVE_LOSS,
                packetSize: NETWORK_CONFIG.DEFAULT_HEARTBEAT_PACKET_SIZE,
                enableAdaptiveInterval: true,
                rttHistorySize: NETWORK_CONFIG.DEFAULT_RTT_HISTORY_SIZE
            },
            syncVar: {
                cacheTimeout: SYNCVAR_CONFIG.DEFAULT_CACHE_TIMEOUT,
                defaultThrottleMs: SYNCVAR_CONFIG.DEFAULT_THROTTLE_MS,
                maxFieldNumber: SYNCVAR_CONFIG.MAX_FIELD_NUMBER,
                minFieldNumber: SYNCVAR_CONFIG.MIN_FIELD_NUMBER
            },
            message: {
                maxSequenceNumber: MESSAGE_CONFIG.MAX_SEQUENCE_NUMBER,
                maxHeaderSize: MESSAGE_CONFIG.MAX_HEADER_SIZE,
                maxPayloadSize: MESSAGE_CONFIG.MAX_PAYLOAD_SIZE,
                defaultTimeout: MESSAGE_CONFIG.DEFAULT_MESSAGE_TIMEOUT,
                maxBatchSize: MESSAGE_CONFIG.MAX_BATCH_SIZE
            },
            serialization: {
                defaultCompressionLevel: SERIALIZATION_CONFIG.DEFAULT_COMPRESSION_LEVEL,
                minCompressionSize: SERIALIZATION_CONFIG.MIN_COMPRESSION_SIZE,
                initialBufferSize: SERIALIZATION_CONFIG.INITIAL_BUFFER_SIZE,
                maxBufferSize: SERIALIZATION_CONFIG.MAX_BUFFER_SIZE
            },
            tsrpc: {
                defaultServerUrl: TSRPC_CONFIG.DEFAULT_SERVER_URL,
                defaultTimeout: TSRPC_CONFIG.DEFAULT_TIMEOUT,
                heartbeatInterval: TSRPC_CONFIG.DEFAULT_HEARTBEAT.interval,
                heartbeatTimeout: TSRPC_CONFIG.DEFAULT_HEARTBEAT.timeout,
                poolConfig: {
                    minConnections: TSRPC_CONFIG.DEFAULT_POOL_CONFIG.minConnections,
                    maxConnections: TSRPC_CONFIG.DEFAULT_POOL_CONFIG.maxConnections,
                    idleTimeout: TSRPC_CONFIG.DEFAULT_POOL_CONFIG.idleTimeout
                }
            },
            authority: {
                minPriority: AUTHORITY_CONFIG.MIN_PRIORITY,
                maxPriority: AUTHORITY_CONFIG.MAX_PRIORITY,
                defaultRulePriority: AUTHORITY_CONFIG.DEFAULT_RULE_PRIORITY
            },
            performance: {
                statsCollectionInterval: PERFORMANCE_CONFIG.STATS_COLLECTION_INTERVAL,
                statsRetentionTime: PERFORMANCE_CONFIG.STATS_RETENTION_TIME,
                warningThresholds: {
                    rtt: PERFORMANCE_CONFIG.WARNING_THRESHOLDS.RTT,
                    packetLoss: PERFORMANCE_CONFIG.WARNING_THRESHOLDS.PACKET_LOSS,
                    jitter: PERFORMANCE_CONFIG.WARNING_THRESHOLDS.JITTER,
                    cpuUsage: PERFORMANCE_CONFIG.WARNING_THRESHOLDS.CPU_USAGE,
                    memoryUsage: PERFORMANCE_CONFIG.WARNING_THRESHOLDS.MEMORY_USAGE
                }
            }
        };
    }
    
    /**
     * 获取配置
     */
    public getConfig(): Readonly<INetworkConfig> {
        return this._config;
    }
    
    /**
     * 获取指定路径的配置值
     * 
     * @param path - 配置路径，使用点号分隔
     * @returns 配置值
     */
    public get<T = unknown>(path: string): T {
        const keys = path.split('.');
        let current: unknown = this._config;
        
        for (const key of keys) {
            if (typeof current !== 'object' || current === null || !(key in current)) {
                throw new Error(`配置路径不存在: ${path}`);
            }
            current = (current as Record<string, unknown>)[key];
        }
        
        return current as T;
    }
    
    /**
     * 设置指定路径的配置值
     * 
     * @param path - 配置路径
     * @param value - 新值
     */
    public set<T = unknown>(path: string, value: T): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        let current = this._config as Record<string, unknown>;
        
        // 导航到父对象
        for (const key of keys) {
            if (typeof current[key] !== 'object' || current[key] === null) {
                throw new Error(`配置路径无效: ${path}`);
            }
            current = current[key] as Record<string, unknown>;
        }
        
        const oldValue = current[lastKey];
        
        // 验证新值
        this.validateConfigValue(path, value);
        
        // 设置新值
        current[lastKey] = value;
        
        // 触发更新事件
        this.emitConfigUpdate({
            path,
            oldValue,
            newValue: value,
            timestamp: Date.now()
        });
    }
    
    /**
     * 批量更新配置
     * 
     * @param updates - 配置更新对象
     */
    public update(updates: Partial<INetworkConfig>): void {
        const flatUpdates = this.flattenObject(updates as unknown as Record<string, unknown>);
        
        for (const [path, value] of Object.entries(flatUpdates)) {
            this.set(path, value);
        }
    }
    
    /**
     * 重置配置为默认值
     */
    public reset(): void {
        const oldConfig = { ...this._config };
        this._config = this.createDefaultConfig();
        
        this.emitConfigUpdate({
            path: '',
            oldValue: oldConfig,
            newValue: this._config,
            timestamp: Date.now()
        });
    }
    
    /**
     * 添加配置更新监听器
     * 
     * @param path - 监听的配置路径（空字符串监听所有）
     * @param listener - 监听器函数
     */
    public addUpdateListener(path: string, listener: (event: IConfigUpdateEvent) => void): void {
        if (!this._updateListeners.has(path)) {
            this._updateListeners.set(path, []);
        }
        this._updateListeners.get(path)!.push(listener);
    }
    
    /**
     * 移除配置更新监听器
     * 
     * @param path - 配置路径
     * @param listener - 监听器函数
     */
    public removeUpdateListener(path: string, listener: (event: IConfigUpdateEvent) => void): void {
        const listeners = this._updateListeners.get(path);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * 从环境变量加载配置
     */
    public loadFromEnv(): void {
        const envConfig = this.parseEnvConfig();
        if (Object.keys(envConfig).length > 0) {
            this.update(envConfig);
        }
    }
    
    /**
     * 从JSON对象加载配置
     * 
     * @param config - 配置对象
     */
    public loadFromObject(config: Partial<INetworkConfig>): void {
        this.validateConfig(config);
        this.update(config);
    }
    
    /**
     * 导出配置为JSON
     */
    public exportConfig(): INetworkConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    
    /**
     * 验证配置值
     */
    private validateConfigValue(path: string, value: unknown): void {
        // 基本类型检查
        if (path.includes('timeout') || path.includes('interval') || path.includes('delay')) {
            if (typeof value !== 'number' || value < 0) {
                throw new Error(`配置值必须是非负数: ${path}`);
            }
        }
        
        if (path.includes('size') && typeof value === 'number' && value <= 0) {
            throw new Error(`大小配置必须是正数: ${path}`);
        }
        
        if (path.includes('url') && typeof value !== 'string') {
            throw new Error(`URL配置必须是字符串: ${path}`);
        }
        
        // 特定路径验证
        if (path === 'syncVar.maxFieldNumber' && typeof value === 'number' && value > SYNCVAR_CONFIG.MAX_FIELD_NUMBER) {
            throw new Error(`字段编号不能超过 ${SYNCVAR_CONFIG.MAX_FIELD_NUMBER}`);
        }
        
        if (path === 'syncVar.minFieldNumber' && typeof value === 'number' && value < SYNCVAR_CONFIG.MIN_FIELD_NUMBER) {
            throw new Error(`字段编号不能小于 ${SYNCVAR_CONFIG.MIN_FIELD_NUMBER}`);
        }
    }
    
    /**
     * 验证整个配置对象
     */
    private validateConfig(config: Partial<INetworkConfig>): void {
        // 递归验证配置结构
        const flatConfig = this.flattenObject(config);
        for (const [path, value] of Object.entries(flatConfig)) {
            this.validateConfigValue(path, value);
        }
    }
    
    /**
     * 扁平化对象
     */
    private flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
        const flattened: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value as Record<string, unknown>, newKey));
            } else {
                flattened[newKey] = value;
            }
        }
        
        return flattened;
    }
    
    /**
     * 解析环境变量配置
     */
    private parseEnvConfig(): Partial<INetworkConfig> {
        const config: Partial<INetworkConfig> = {};
        
        // 连接配置
        if (process.env.NETWORK_CONNECTION_TIMEOUT) {
            config.connection = {
                timeout: parseInt(process.env.NETWORK_CONNECTION_TIMEOUT, 10),
                maxReconnectAttempts: NETWORK_CONFIG.DEFAULT_MAX_RECONNECT_ATTEMPTS,
                reconnectDelay: NETWORK_CONFIG.DEFAULT_RECONNECT_DELAY
            };
        }
        
        // 心跳配置
        if (process.env.NETWORK_HEARTBEAT_INTERVAL) {
            config.heartbeat = {
                interval: parseInt(process.env.NETWORK_HEARTBEAT_INTERVAL, 10),
                timeout: NETWORK_CONFIG.DEFAULT_HEARTBEAT_TIMEOUT,
                maxConsecutiveLoss: NETWORK_CONFIG.DEFAULT_MAX_CONSECUTIVE_LOSS,
                packetSize: NETWORK_CONFIG.DEFAULT_HEARTBEAT_PACKET_SIZE,
                enableAdaptiveInterval: true,
                rttHistorySize: NETWORK_CONFIG.DEFAULT_RTT_HISTORY_SIZE
            };
        }
        
        // TSRPC配置
        if (process.env.TSRPC_SERVER_URL) {
            config.tsrpc = {
                defaultServerUrl: process.env.TSRPC_SERVER_URL,
                defaultTimeout: TSRPC_CONFIG.DEFAULT_TIMEOUT,
                heartbeatInterval: TSRPC_CONFIG.DEFAULT_HEARTBEAT.interval,
                heartbeatTimeout: TSRPC_CONFIG.DEFAULT_HEARTBEAT.timeout,
                poolConfig: {
                    minConnections: TSRPC_CONFIG.DEFAULT_POOL_CONFIG.minConnections,
                    maxConnections: TSRPC_CONFIG.DEFAULT_POOL_CONFIG.maxConnections,
                    idleTimeout: TSRPC_CONFIG.DEFAULT_POOL_CONFIG.idleTimeout
                }
            };
        }
        
        return config;
    }
    
    /**
     * 触发配置更新事件
     */
    private emitConfigUpdate(event: IConfigUpdateEvent): void {
        // 触发具体路径的监听器
        const listeners = this._updateListeners.get(event.path);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error(`配置更新监听器错误 (${event.path}):`, error);
                }
            });
        }
        
        // 触发全局监听器
        const globalListeners = this._updateListeners.get('');
        if (globalListeners) {
            globalListeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('全局配置更新监听器错误:', error);
                }
            });
        }
    }
}

/**
 * 配置管理器单例实例
 */
export const NetworkConfig = NetworkConfigManager.Instance;