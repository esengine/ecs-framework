/**
 * ECS框架加速提供者接口
 * 
 * 提供可替换的性能加速实现，专注于ECS实体查询功能
 * 支持JavaScript、WebAssembly等不同后端实现
 */

// ================================
// 核心接口定义
// ================================

/**
 * 实体查询结果
 */
export interface QueryResult {
    /** 查询到的实体ID数组 */
    entities: Uint32Array;
    /** 查询到的实体数量 */
    count: number;
}

/**
 * 实体查询接口
 * 
 * 提供高性能的ECS实体查询功能
 */
export interface QueryProvider {
    /**
     * 根据单个组件掩码查询实体
     * @param componentMask 组件掩码
     * @param maxResults 最大结果数量
     * @returns 查询结果
     */
    queryByComponent(componentMask: bigint, maxResults: number): QueryResult;
    
    /**
     * 根据多个组件掩码查询实体（AND操作）
     * @param componentMasks 组件掩码数组
     * @param maxResults 最大结果数量
     * @returns 查询结果
     */
    queryByComponents(componentMasks: bigint[], maxResults: number): QueryResult;
    
    /**
     * 查询包含指定组件但排除其他组件的实体
     * @param includeMask 必须包含的组件掩码
     * @param excludeMask 必须排除的组件掩码
     * @param maxResults 最大结果数量
     * @returns 查询结果
     */
    queryExcluding(includeMask: bigint, excludeMask: bigint, maxResults: number): QueryResult;
    
    /**
     * 更新实体的组件掩码
     * @param entityId 实体ID
     * @param componentMask 新的组件掩码
     */
    updateEntityMask(entityId: number, componentMask: bigint): void;
    
    /**
     * 批量更新实体掩码
     * @param entityIds 实体ID数组
     * @param masks 掩码数组
     */
    batchUpdateMasks(entityIds: Uint32Array, masks: BigUint64Array): void;
}

/**
 * 加速提供者接口
 * 
 * 定义了ECS框架加速提供者的基本契约
 */
export interface AccelerationProvider {
    /** 提供者名称 */
    readonly name: string;
    /** 提供者版本 */
    readonly version: string;
    /** 是否为WebAssembly实现 */
    readonly isWasm: boolean;
    
    /** 实体查询功能模块 */
    query: QueryProvider;
    
    /**
     * 初始化提供者
     * @throws {Error} 初始化失败时抛出错误
     */
    initialize(): Promise<void>;
    
    /**
     * 检查是否支持指定功能
     * @param feature 功能名称
     * @returns 是否支持该功能
     */
    supports(feature: string): boolean;
    
    /**
     * 获取性能信息
     * @returns 性能统计信息
     */
    getPerformanceInfo(): {
        /** 每秒操作数 */
        operationsPerSecond: number;
        /** 内存使用量（字节） */
        memoryUsage: number;
        /** 支持的功能列表 */
        features: string[];
    };
    
    /**
     * 清理资源
     */
    dispose(): void;
}

// ================================
// JavaScript实现
// ================================

/**
 * JavaScript实现的基础加速提供者
 * 
 * 提供纯JavaScript的ECS查询实现，作为默认后端
 */
export class JavaScriptProvider implements AccelerationProvider {
    readonly name = 'JavaScript';
    readonly version = '1.0.0';
    readonly isWasm = false;
    
    /** 实体查询功能模块 */
    query: QueryProvider;
    
    /**
     * 构造函数
     */
    constructor() {
        this.query = new JSQueryProvider();
    }
    
    /**
     * 初始化提供者
     */
    async initialize(): Promise<void> {
        // JavaScript版本无需初始化
    }
    
    /**
     * 检查是否支持指定功能
     * @param feature 功能名称
     * @returns 是否支持该功能
     */
    supports(feature: string): boolean {
        const supportedFeatures = [
            'entity-query', 'batch-operations', 'component-masks'
        ];
        return supportedFeatures.includes(feature);
    }
    
    /**
     * 获取性能信息
     * @returns 性能统计信息
     */
    getPerformanceInfo() {
        return {
            operationsPerSecond: 1000000, // 100万次/秒
            memoryUsage: 0,
            features: ['entity-query', 'batch-operations', 'component-masks']
        };
    }
    
    /**
     * 清理资源
     */
    dispose(): void {
        // JavaScript版本无需清理
    }
}

/**
 * JavaScript查询实现
 * 
 * 使用Map存储实体掩码，提供基础的查询功能
 */
class JSQueryProvider implements QueryProvider {
    /** 实体掩码存储 */
    private entityMasks = new Map<number, bigint>();
    
    /**
     * 根据单个组件掩码查询实体
     * @param componentMask 组件掩码
     * @param maxResults 最大结果数量
     * @returns 查询结果
     */
    queryByComponent(componentMask: bigint, maxResults: number): QueryResult {
        const results = new Uint32Array(maxResults);
        let count = 0;
        
        for (const [entityId, mask] of this.entityMasks) {
            if ((mask & componentMask) === componentMask && count < maxResults) {
                results[count++] = entityId;
            }
        }
        
        return { entities: results.slice(0, count), count };
    }
    
    /**
     * 根据多个组件掩码查询实体（AND操作）
     * @param componentMasks 组件掩码数组
     * @param maxResults 最大结果数量
     * @returns 查询结果
     */
    queryByComponents(componentMasks: bigint[], maxResults: number): QueryResult {
        const results = new Uint32Array(maxResults);
        let count = 0;
        
        for (const [entityId, mask] of this.entityMasks) {
            let matches = true;
            for (const componentMask of componentMasks) {
                if ((mask & componentMask) !== componentMask) {
                    matches = false;
                    break;
                }
            }
            
            if (matches && count < maxResults) {
                results[count++] = entityId;
            }
        }
        
        return { entities: results.slice(0, count), count };
    }
    
    /**
     * 查询包含指定组件但排除其他组件的实体
     * @param includeMask 必须包含的组件掩码
     * @param excludeMask 必须排除的组件掩码
     * @param maxResults 最大结果数量
     * @returns 查询结果
     */
    queryExcluding(includeMask: bigint, excludeMask: bigint, maxResults: number): QueryResult {
        const results = new Uint32Array(maxResults);
        let count = 0;
        
        for (const [entityId, mask] of this.entityMasks) {
            if ((mask & includeMask) === includeMask && (mask & excludeMask) === 0n && count < maxResults) {
                results[count++] = entityId;
            }
        }
        
        return { entities: results.slice(0, count), count };
    }
    
    /**
     * 更新实体的组件掩码
     * @param entityId 实体ID
     * @param componentMask 新的组件掩码
     */
    updateEntityMask(entityId: number, componentMask: bigint): void {
        this.entityMasks.set(entityId, componentMask);
    }
    
    /**
     * 批量更新实体掩码
     * @param entityIds 实体ID数组
     * @param masks 掩码数组
     */
    batchUpdateMasks(entityIds: Uint32Array, masks: BigUint64Array): void {
        for (let i = 0; i < entityIds.length; i++) {
            this.entityMasks.set(entityIds[i], masks[i]);
        }
    }
}

// ================================
// 管理器类
// ================================

/**
 * 加速提供者管理器
 * 
 * 管理不同的加速提供者实现，支持动态切换和性能测试
 */
export class AccelerationManager {
    /** 单例实例 */
    private static instance: AccelerationManager;
    /** 当前使用的提供者 */
    private currentProvider: AccelerationProvider;
    /** 可用的提供者映射 */
    private availableProviders = new Map<string, AccelerationProvider>();
    
    /**
     * 私有构造函数
     */
    private constructor() {
        // 默认使用JavaScript提供者
        this.currentProvider = new JavaScriptProvider();
        this.availableProviders.set('javascript', this.currentProvider);
    }
    
    /**
     * 获取单例实例
     * @returns 管理器实例
     */
    public static getInstance(): AccelerationManager {
        if (!AccelerationManager.instance) {
            AccelerationManager.instance = new AccelerationManager();
        }
        return AccelerationManager.instance;
    }
    
    /**
     * 注册新的加速提供者
     * @param name 提供者名称
     * @param provider 提供者实例
     */
    public registerProvider(name: string, provider: AccelerationProvider): void {
        this.availableProviders.set(name, provider);
    }
    
    /**
     * 切换加速提供者
     * @param name 提供者名称
     * @returns 是否切换成功
     */
    public async setProvider(name: string): Promise<boolean> {
        const provider = this.availableProviders.get(name);
        if (!provider) {
            console.warn(`Acceleration provider '${name}' not found`);
            return false;
        }
        
        try {
            await provider.initialize();
            this.currentProvider = provider;
            console.log(`Switched to acceleration provider: ${provider.name} v${provider.version}`);
            return true;
        } catch (error) {
            console.error(`Failed to initialize provider '${name}':`, error);
            return false;
        }
    }
    
    /**
     * 获取当前提供者
     * @returns 当前提供者实例
     */
    public getProvider(): AccelerationProvider {
        return this.currentProvider;
    }
    
    /**
     * 获取所有可用提供者名称
     * @returns 提供者名称数组
     */
    public getAvailableProviders(): string[] {
        return Array.from(this.availableProviders.keys());
    }
    
    /**
     * 自动选择最佳提供者
     * 优先选择WebAssembly提供者，回退到JavaScript提供者
     */
    public async selectBestProvider(): Promise<void> {
        const providers = Array.from(this.availableProviders.values());
        
        // 优先选择WebAssembly提供者
        const wasmProvider = providers.find(p => p.isWasm);
        if (wasmProvider) {
            const success = await this.setProvider(wasmProvider.name);
            if (success) return;
        }
        
        // 回退到JavaScript提供者
        await this.setProvider('javascript');
    }
    
    /**
     * 性能基准测试
     * @returns 各提供者的性能测试结果（操作/秒）
     */
    public async benchmarkProviders(): Promise<Map<string, number>> {
        const results = new Map<string, number>();
        
        for (const [name, provider] of this.availableProviders) {
            try {
                await provider.initialize();
                
                // 简单的查询性能测试
                const start = performance.now();
                const testMask = 0b1111n; // 测试掩码
                
                for (let i = 0; i < 10000; i++) {
                    provider.query.queryByComponent(testMask, 100);
                }
                
                const end = performance.now();
                results.set(name, 10000 / (end - start) * 1000); // 操作/秒
                
                provider.dispose();
            } catch (error) {
                console.warn(`Benchmark failed for provider '${name}':`, error);
                results.set(name, 0);
            }
        }
        
        return results;
    }
}