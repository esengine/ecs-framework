/**
 * 数据持久化接口
 * 为游戏状态、会话信息、用户数据等提供统一的存储抽象
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * 数据存储类型
 */
export enum DataType {
    STATE_SNAPSHOT = 'state_snapshot',
    USER_SESSION = 'user_session',
    GAME_DATA = 'game_data',
    AUTH_TOKEN = 'auth_token',
    USER_PROFILE = 'user_profile',
    ADMIN_RECORD = 'admin_record',
    SECURITY_LOG = 'security_log',
    METRIC_DATA = 'metric_data'
}

/**
 * 查询条件
 */
export interface QueryOptions {
    filters?: Record<string, any>;
    sort?: { field: string; order: 'asc' | 'desc' }[];
    limit?: number;
    offset?: number;
    fields?: string[];
}

/**
 * 查询结果
 */
export interface QueryResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

/**
 * 存储配置
 */
export interface StorageConfig {
    type: 'memory' | 'file' | 'database' | 'redis';
    connectionString?: string;
    options?: Record<string, any>;
}

/**
 * 批量操作配置
 */
export interface BatchOptions {
    batchSize: number;
    concurrency: number;
    onProgress?: (processed: number, total: number) => void;
}

/**
 * 事务配置
 */
export interface TransactionOptions {
    isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
    timeout?: number;
}

/**
 * 数据持久化事件
 */
export interface PersistenceEvents {
    'data:saved': (type: DataType, key: string, data: any) => void;
    'data:loaded': (type: DataType, key: string, data: any) => void;
    'data:deleted': (type: DataType, key: string) => void;
    'batch:started': (operation: string, count: number) => void;
    'batch:completed': (operation: string, processed: number, failed: number) => void;
    'transaction:started': (transactionId: string) => void;
    'transaction:committed': (transactionId: string) => void;
    'transaction:rolled_back': (transactionId: string, reason: string) => void;
    'error': (operation: string, error: Error) => void;
}

/**
 * 数据持久化接口
 */
export interface IDataPersistence {
    /**
     * 保存单个数据项
     */
    save<T>(type: DataType, key: string, data: T, ttl?: number): Promise<void>;
    
    /**
     * 加载单个数据项
     */
    load<T>(type: DataType, key: string): Promise<T | null>;
    
    /**
     * 删除单个数据项
     */
    delete(type: DataType, key: string): Promise<boolean>;
    
    /**
     * 检查数据项是否存在
     */
    exists(type: DataType, key: string): Promise<boolean>;
    
    /**
     * 查询多个数据项
     */
    query<T>(type: DataType, options?: QueryOptions): Promise<QueryResult<T>>;
    
    /**
     * 批量保存
     */
    batchSave<T>(type: DataType, items: Array<{key: string, data: T, ttl?: number}>, options?: BatchOptions): Promise<void>;
    
    /**
     * 批量加载
     */
    batchLoad<T>(type: DataType, keys: string[]): Promise<Map<string, T>>;
    
    /**
     * 批量删除
     */
    batchDelete(type: DataType, keys: string[]): Promise<number>;
    
    /**
     * 开始事务
     */
    beginTransaction(options?: TransactionOptions): Promise<string>;
    
    /**
     * 提交事务
     */
    commitTransaction(transactionId: string): Promise<void>;
    
    /**
     * 回滚事务
     */
    rollbackTransaction(transactionId: string): Promise<void>;
    
    /**
     * 清理过期数据
     */
    cleanup(): Promise<number>;
    
    /**
     * 获取存储统计信息
     */
    getStats(): Promise<StorageStats>;
    
    /**
     * 关闭连接
     */
    close(): Promise<void>;
}

/**
 * 存储统计信息
 */
export interface StorageStats {
    totalItems: number;
    itemsByType: Record<DataType, number>;
    storageSize: number;
    lastCleanup: number;
    connectionStatus: string;
}

/**
 * 内存存储实现
 */
export class MemoryDataPersistence extends EventEmitter<PersistenceEvents> implements IDataPersistence {
    private logger = createLogger('MemoryDataPersistence');
    private storage: Map<string, {data: any, expiry?: number}> = new Map();
    private transactions: Map<string, Map<string, {data: any, expiry?: number}>> = new Map();
    private cleanupTimer?: NodeJS.Timeout;

    constructor() {
        super();
        this.startCleanupTimer();
    }

    async save<T>(type: DataType, key: string, data: T, ttl?: number): Promise<void> {
        const fullKey = this.buildKey(type, key);
        const item = {
            data,
            expiry: ttl ? Date.now() + ttl * 1000 : undefined
        };
        
        this.storage.set(fullKey, item);
        this.emit('data:saved', type, key, data);
        this.logger.debug(`保存数据: ${fullKey}`);
    }

    async load<T>(type: DataType, key: string): Promise<T | null> {
        const fullKey = this.buildKey(type, key);
        const item = this.storage.get(fullKey);
        
        if (!item) {
            return null;
        }

        // 检查过期
        if (item.expiry && Date.now() > item.expiry) {
            this.storage.delete(fullKey);
            return null;
        }

        this.emit('data:loaded', type, key, item.data);
        return item.data as T;
    }

    async delete(type: DataType, key: string): Promise<boolean> {
        const fullKey = this.buildKey(type, key);
        const deleted = this.storage.delete(fullKey);
        
        if (deleted) {
            this.emit('data:deleted', type, key);
            this.logger.debug(`删除数据: ${fullKey}`);
        }
        
        return deleted;
    }

    async exists(type: DataType, key: string): Promise<boolean> {
        const fullKey = this.buildKey(type, key);
        const item = this.storage.get(fullKey);
        
        if (!item) {
            return false;
        }

        // 检查过期
        if (item.expiry && Date.now() > item.expiry) {
            this.storage.delete(fullKey);
            return false;
        }

        return true;
    }

    async query<T>(type: DataType, options: QueryOptions = {}): Promise<QueryResult<T>> {
        const prefix = `${type}:`;
        const items: Array<{key: string, data: T}> = [];
        
        for (const [fullKey, item] of this.storage.entries()) {
            if (fullKey.startsWith(prefix)) {
                // 检查过期
                if (item.expiry && Date.now() > item.expiry) {
                    this.storage.delete(fullKey);
                    continue;
                }

                const key = fullKey.substring(prefix.length);
                items.push({ key, data: item.data as T });
            }
        }

        // 应用过滤器
        let filtered = items;
        if (options.filters) {
            filtered = items.filter(item => this.matchesFilters(item.data, options.filters!));
        }

        // 排序
        if (options.sort && options.sort.length > 0) {
            filtered = this.applySorting(filtered, options.sort);
        }

        // 分页
        const offset = options.offset || 0;
        const limit = options.limit || filtered.length;
        const paged = filtered.slice(offset, offset + limit);

        return {
            data: paged.map(item => item.data),
            total: filtered.length,
            page: Math.floor(offset / (limit || 1)) + 1,
            pageSize: limit,
            hasMore: offset + limit < filtered.length
        };
    }

    async batchSave<T>(
        type: DataType, 
        items: Array<{key: string, data: T, ttl?: number}>, 
        options?: BatchOptions
    ): Promise<void> {
        this.emit('batch:started', 'save', items.length);
        
        let processed = 0;
        const batchSize = options?.batchSize || 100;
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            
            for (const item of batch) {
                await this.save(type, item.key, item.data, item.ttl);
                processed++;
                
                if (options?.onProgress) {
                    options.onProgress(processed, items.length);
                }
            }
        }
        
        this.emit('batch:completed', 'save', processed, 0);
    }

    async batchLoad<T>(type: DataType, keys: string[]): Promise<Map<string, T>> {
        const result = new Map<string, T>();
        
        for (const key of keys) {
            const data = await this.load<T>(type, key);
            if (data !== null) {
                result.set(key, data);
            }
        }
        
        return result;
    }

    async batchDelete(type: DataType, keys: string[]): Promise<number> {
        let deleted = 0;
        
        for (const key of keys) {
            if (await this.delete(type, key)) {
                deleted++;
            }
        }
        
        return deleted;
    }

    async beginTransaction(options?: TransactionOptions): Promise<string> {
        const transactionId = this.generateTransactionId();
        const snapshot = new Map(this.storage);
        this.transactions.set(transactionId, snapshot);
        
        this.emit('transaction:started', transactionId);
        this.logger.debug(`开始事务: ${transactionId}`);
        
        return transactionId;
    }

    async commitTransaction(transactionId: string): Promise<void> {
        if (!this.transactions.has(transactionId)) {
            throw new Error(`Transaction not found: ${transactionId}`);
        }
        
        this.transactions.delete(transactionId);
        this.emit('transaction:committed', transactionId);
        this.logger.debug(`提交事务: ${transactionId}`);
    }

    async rollbackTransaction(transactionId: string): Promise<void> {
        const snapshot = this.transactions.get(transactionId);
        if (!snapshot) {
            throw new Error(`Transaction not found: ${transactionId}`);
        }
        
        this.storage = snapshot;
        this.transactions.delete(transactionId);
        
        this.emit('transaction:rolled_back', transactionId, 'manual rollback');
        this.logger.debug(`回滚事务: ${transactionId}`);
    }

    async cleanup(): Promise<number> {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, item] of this.storage.entries()) {
            if (item.expiry && now > item.expiry) {
                this.storage.delete(key);
                cleaned++;
            }
        }
        
        this.logger.info(`清理过期数据: ${cleaned} 项`);
        return cleaned;
    }

    async getStats(): Promise<StorageStats> {
        const itemsByType: Record<DataType, number> = {} as any;
        
        for (const type of Object.values(DataType)) {
            itemsByType[type] = 0;
        }
        
        for (const key of this.storage.keys()) {
            const [type] = key.split(':');
            if (type in itemsByType) {
                itemsByType[type as DataType]++;
            }
        }
        
        return {
            totalItems: this.storage.size,
            itemsByType,
            storageSize: this.estimateSize(),
            lastCleanup: Date.now(),
            connectionStatus: 'connected'
        };
    }

    async close(): Promise<void> {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.storage.clear();
        this.transactions.clear();
        this.logger.info('内存存储已关闭');
    }

    private buildKey(type: DataType, key: string): string {
        return `${type}:${key}`;
    }

    private matchesFilters(data: any, filters: Record<string, any>): boolean {
        for (const [field, value] of Object.entries(filters)) {
            if (data[field] !== value) {
                return false;
            }
        }
        return true;
    }

    private applySorting<T>(
        items: Array<{key: string, data: T}>, 
        sort: Array<{field: string, order: 'asc' | 'desc'}>
    ): Array<{key: string, data: T}> {
        return items.sort((a, b) => {
            for (const sortRule of sort) {
                const aVal = (a.data as any)[sortRule.field];
                const bVal = (b.data as any)[sortRule.field];
                
                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
                
                if (comparison !== 0) {
                    return sortRule.order === 'desc' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }

    private estimateSize(): number {
        let size = 0;
        for (const [key, item] of this.storage.entries()) {
            size += key.length * 2; // UTF-16
            size += JSON.stringify(item.data).length * 2;
        }
        return size;
    }

    private generateTransactionId(): string {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup().catch(error => {
                this.emit('error', 'cleanup', error);
            });
        }, 5 * 60 * 1000); // 每5分钟清理一次
    }
}

/**
 * 文件系统存储实现
 */
export class FileDataPersistence extends EventEmitter<PersistenceEvents> implements IDataPersistence {
    private logger = createLogger('FileDataPersistence');
    private basePath: string;
    private fs: any;
    private path: any;

    constructor(basePath: string) {
        super();
        this.basePath = basePath;
        
        try {
            this.fs = require('fs').promises;
            this.path = require('path');
            this.ensureDirectoryExists();
        } catch (error) {
            this.logger.error('文件系统模块不可用:', error);
            throw new Error('File system not available in this environment');
        }
    }

    async save<T>(type: DataType, key: string, data: T, ttl?: number): Promise<void> {
        const filePath = this.buildFilePath(type, key);
        const item = {
            data,
            expiry: ttl ? Date.now() + ttl * 1000 : undefined,
            savedAt: Date.now()
        };
        
        await this.fs.writeFile(filePath, JSON.stringify(item, null, 2));
        this.emit('data:saved', type, key, data);
        this.logger.debug(`保存文件: ${filePath}`);
    }

    async load<T>(type: DataType, key: string): Promise<T | null> {
        const filePath = this.buildFilePath(type, key);
        
        try {
            const content = await this.fs.readFile(filePath, 'utf8');
            const item = JSON.parse(content);
            
            // 检查过期
            if (item.expiry && Date.now() > item.expiry) {
                await this.fs.unlink(filePath);
                return null;
            }
            
            this.emit('data:loaded', type, key, item.data);
            return item.data as T;
            
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async delete(type: DataType, key: string): Promise<boolean> {
        const filePath = this.buildFilePath(type, key);
        
        try {
            await this.fs.unlink(filePath);
            this.emit('data:deleted', type, key);
            this.logger.debug(`删除文件: ${filePath}`);
            return true;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }

    async exists(type: DataType, key: string): Promise<boolean> {
        const filePath = this.buildFilePath(type, key);
        
        try {
            const stats = await this.fs.stat(filePath);
            return stats.isFile();
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }

    async query<T>(type: DataType, options: QueryOptions = {}): Promise<QueryResult<T>> {
        const typeDir = this.path.join(this.basePath, type);
        const items: Array<{key: string, data: T}> = [];
        
        try {
            const files = await this.fs.readdir(typeDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const key = file.replace('.json', '');
                    const data = await this.load<T>(type, key);
                    if (data !== null) {
                        items.push({ key, data });
                    }
                }
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // 应用过滤和排序逻辑（与内存实现相同）
        let filtered = items;
        if (options.filters) {
            filtered = items.filter(item => this.matchesFilters(item.data, options.filters!));
        }

        if (options.sort && options.sort.length > 0) {
            filtered = this.applySorting(filtered, options.sort);
        }

        const offset = options.offset || 0;
        const limit = options.limit || filtered.length;
        const paged = filtered.slice(offset, offset + limit);

        return {
            data: paged.map(item => item.data),
            total: filtered.length,
            page: Math.floor(offset / (limit || 1)) + 1,
            pageSize: limit,
            hasMore: offset + limit < filtered.length
        };
    }

    async batchSave<T>(
        type: DataType, 
        items: Array<{key: string, data: T, ttl?: number}>, 
        options?: BatchOptions
    ): Promise<void> {
        this.emit('batch:started', 'save', items.length);
        
        let processed = 0;
        const batchSize = options?.batchSize || 100;
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (item) => {
                await this.save(type, item.key, item.data, item.ttl);
                processed++;
                
                if (options?.onProgress) {
                    options.onProgress(processed, items.length);
                }
            }));
        }
        
        this.emit('batch:completed', 'save', processed, 0);
    }

    async batchLoad<T>(type: DataType, keys: string[]): Promise<Map<string, T>> {
        const result = new Map<string, T>();
        
        await Promise.all(keys.map(async (key) => {
            const data = await this.load<T>(type, key);
            if (data !== null) {
                result.set(key, data);
            }
        }));
        
        return result;
    }

    async batchDelete(type: DataType, keys: string[]): Promise<number> {
        let deleted = 0;
        
        await Promise.all(keys.map(async (key) => {
            if (await this.delete(type, key)) {
                deleted++;
            }
        }));
        
        return deleted;
    }

    async beginTransaction(): Promise<string> {
        // 文件系统不支持真正的事务，返回空事务
        const transactionId = this.generateTransactionId();
        this.emit('transaction:started', transactionId);
        return transactionId;
    }

    async commitTransaction(transactionId: string): Promise<void> {
        this.emit('transaction:committed', transactionId);
    }

    async rollbackTransaction(transactionId: string): Promise<void> {
        this.emit('transaction:rolled_back', transactionId, 'file system rollback not supported');
    }

    async cleanup(): Promise<number> {
        let cleaned = 0;
        
        for (const type of Object.values(DataType)) {
            const typeDir = this.path.join(this.basePath, type);
            
            try {
                const files = await this.fs.readdir(typeDir);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const filePath = this.path.join(typeDir, file);
                        const content = await this.fs.readFile(filePath, 'utf8');
                        const item = JSON.parse(content);
                        
                        if (item.expiry && Date.now() > item.expiry) {
                            await this.fs.unlink(filePath);
                            cleaned++;
                        }
                    }
                }
            } catch (error: any) {
                if (error.code !== 'ENOENT') {
                    this.logger.warn(`清理目录失败 ${typeDir}:`, error);
                }
            }
        }
        
        this.logger.info(`清理过期文件: ${cleaned} 个`);
        return cleaned;
    }

    async getStats(): Promise<StorageStats> {
        const itemsByType: Record<DataType, number> = {} as any;
        let totalItems = 0;
        let storageSize = 0;
        
        for (const type of Object.values(DataType)) {
            itemsByType[type] = 0;
            const typeDir = this.path.join(this.basePath, type);
            
            try {
                const files = await this.fs.readdir(typeDir);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        itemsByType[type]++;
                        totalItems++;
                        
                        const filePath = this.path.join(typeDir, file);
                        const stats = await this.fs.stat(filePath);
                        storageSize += stats.size;
                    }
                }
            } catch (error: any) {
                if (error.code !== 'ENOENT') {
                    this.logger.warn(`获取统计信息失败 ${typeDir}:`, error);
                }
            }
        }
        
        return {
            totalItems,
            itemsByType,
            storageSize,
            lastCleanup: Date.now(),
            connectionStatus: 'connected'
        };
    }

    async close(): Promise<void> {
        this.logger.info('文件存储已关闭');
    }

    private buildFilePath(type: DataType, key: string): string {
        const typeDir = this.path.join(this.basePath, type);
        return this.path.join(typeDir, `${key}.json`);
    }

    private async ensureDirectoryExists(): Promise<void> {
        for (const type of Object.values(DataType)) {
            const typeDir = this.path.join(this.basePath, type);
            await this.fs.mkdir(typeDir, { recursive: true });
        }
    }

    private matchesFilters(data: any, filters: Record<string, any>): boolean {
        for (const [field, value] of Object.entries(filters)) {
            if (data[field] !== value) {
                return false;
            }
        }
        return true;
    }

    private applySorting<T>(
        items: Array<{key: string, data: T}>, 
        sort: Array<{field: string, order: 'asc' | 'desc'}>
    ): Array<{key: string, data: T}> {
        return items.sort((a, b) => {
            for (const sortRule of sort) {
                const aVal = (a.data as any)[sortRule.field];
                const bVal = (b.data as any)[sortRule.field];
                
                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
                
                if (comparison !== 0) {
                    return sortRule.order === 'desc' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }

    private generateTransactionId(): string {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * 数据持久化工厂
 */
export class DataPersistenceFactory {
    private static logger = createLogger('DataPersistenceFactory');

    static create(config: StorageConfig): IDataPersistence {
        switch (config.type) {
            case 'memory':
                return new MemoryDataPersistence();
                
            case 'file':
                const basePath = config.options?.basePath || './data';
                return new FileDataPersistence(basePath);
                
            case 'database':
                // TODO: 实现数据库存储
                throw new Error('Database persistence not implemented yet');
                
            case 'redis':
                // TODO: 实现Redis存储
                throw new Error('Redis persistence not implemented yet');
                
            default:
                throw new Error(`Unsupported storage type: ${config.type}`);
        }
    }
}