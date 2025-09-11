import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';
import { RpcMethodMetadata, RpcMethodRegistry } from '../types/RpcTypes';
import { getRpcMethods, RpcMethodValidator, RpcValidationResult } from '../decorators/RpcDecorators';

/**
 * RPC元数据管理器事件
 */
export interface RpcMetadataManagerEvents {
    methodRegistered: (metadata: RpcMethodMetadata) => void;
    methodUnregistered: (methodName: string) => void;
    classRegistered: (className: string, methodCount: number) => void;
    classUnregistered: (className: string) => void;
}

/**
 * 方法搜索查询条件
 */
export interface RpcMethodSearchQuery {
    className?: string;
    isServerRpc?: boolean;
    requireAuth?: boolean;
    target?: string;
}

/**
 * RPC注册统计信息
 */
export interface RpcRegistryStats {
    totalMethods: number;
    serverRpcMethods: number;
    clientRpcMethods: number;
    registeredClasses: number;
}

/**
 * RPC元数据管理器
 * 负责管理所有RPC方法的元数据和注册信息
 */
export class RpcMetadataManager extends EventEmitter {
    private logger = createLogger('RpcMetadataManager');
    
    /** 方法注册表 */
    private registry: RpcMethodRegistry = new Map();
    
    /** 类到方法的映射 */
    private classMethods = new Map<string, Set<string>>();
    
    /** 方法名到类的映射 */
    private methodToClass = new Map<string, string>();
    
    /** 实例缓存 */
    private instances = new Map<string, object>();

    /**
     * 注册RPC类
     */
    public registerClass(instance: object): void {
        const className = instance.constructor.name;
        
        try {
            const rpcMethods = getRpcMethods(instance.constructor as Function);
            
            if (rpcMethods.length === 0) {
                this.logger.warn(`类 ${className} 没有RPC方法`);
                return;
            }
            
            // 验证所有方法定义
            for (const metadata of rpcMethods) {
                const validation = RpcMethodValidator.validateMethodDefinition(metadata);
                if (!validation.valid) {
                    throw new Error(`${className}.${metadata.methodName}: ${validation.error}`);
                }
            }
            
            // 注册方法
            const methodNames = new Set<string>();
            
            for (const metadata of rpcMethods) {
                const fullMethodName = `${className}.${metadata.methodName}`;
                
                // 检查方法是否已存在
                if (this.registry.has(fullMethodName)) {
                    throw new Error(`RPC方法已存在: ${fullMethodName}`);
                }
                
                // 获取实际方法处理器
                const handler = (instance as Record<string, unknown>)[metadata.methodName];
                if (typeof handler !== 'function') {
                    throw new Error(`方法不存在或不是函数: ${fullMethodName}`);
                }
                
                // 注册方法
                this.registry.set(fullMethodName, {
                    metadata,
                    handler: handler.bind(instance)
                });
                
                methodNames.add(metadata.methodName);
                this.methodToClass.set(fullMethodName, className);
                
                this.logger.debug(`已注册RPC方法: ${fullMethodName}`);
                this.emit('methodRegistered', metadata);
            }
            
            // 更新类映射
            this.classMethods.set(className, methodNames);
            this.instances.set(className, instance);
            
            this.logger.info(`已注册RPC类: ${className}，方法数: ${methodNames.size}`);
            this.emit('classRegistered', className, methodNames.size);
            
        } catch (error) {
            this.logger.error(`注册RPC类失败: ${className}`, error);
            throw error;
        }
    }

    /**
     * 注销RPC类
     */
    public unregisterClass(classNameOrInstance: string | object): void {
        const className = typeof classNameOrInstance === 'string' 
            ? classNameOrInstance 
            : classNameOrInstance.constructor.name;
        
        const methodNames = this.classMethods.get(className);
        if (!methodNames) {
            this.logger.warn(`RPC类未注册: ${className}`);
            return;
        }
        
        // 移除所有方法
        for (const methodName of methodNames) {
            const fullMethodName = `${className}.${methodName}`;
            this.registry.delete(fullMethodName);
            this.methodToClass.delete(fullMethodName);
            this.emit('methodUnregistered', fullMethodName);
        }
        
        // 清理映射
        this.classMethods.delete(className);
        this.instances.delete(className);
        
        this.logger.info(`已注销RPC类: ${className}`);
        this.emit('classUnregistered', className);
    }

    /**
     * 获取RPC方法元数据
     */
    public getMethodMetadata(methodName: string): RpcMethodMetadata | undefined {
        const entry = this.registry.get(methodName);
        return entry?.metadata;
    }

    /**
     * 获取RPC方法处理器
     */
    public getMethodHandler(methodName: string): Function | undefined {
        const entry = this.registry.get(methodName);
        return entry?.handler;
    }

    /**
     * 检查方法是否存在
     */
    public hasMethod(methodName: string): boolean {
        return this.registry.has(methodName);
    }

    /**
     * 获取所有服务端RPC方法
     */
    public getServerRpcMethods(): RpcMethodMetadata[] {
        const methods: RpcMethodMetadata[] = [];
        
        for (const [, entry] of this.registry) {
            if (entry.metadata.isServerRpc) {
                methods.push(entry.metadata);
            }
        }
        
        return methods;
    }

    /**
     * 获取所有客户端RPC方法
     */
    public getClientRpcMethods(): RpcMethodMetadata[] {
        const methods: RpcMethodMetadata[] = [];
        
        for (const [, entry] of this.registry) {
            if (!entry.metadata.isServerRpc) {
                methods.push(entry.metadata);
            }
        }
        
        return methods;
    }

    /**
     * 获取类的所有RPC方法
     */
    public getClassMethods(className: string): RpcMethodMetadata[] {
        const methodNames = this.classMethods.get(className);
        if (!methodNames) {
            return [];
        }
        
        const methods: RpcMethodMetadata[] = [];
        
        for (const methodName of methodNames) {
            const fullMethodName = `${className}.${methodName}`;
            const entry = this.registry.get(fullMethodName);
            if (entry) {
                methods.push(entry.metadata);
            }
        }
        
        return methods;
    }

    /**
     * 获取已注册的类名列表
     */
    public getRegisteredClasses(): string[] {
        return Array.from(this.classMethods.keys());
    }

    /**
     * 获取所有已注册的方法名
     */
    public getAllMethodNames(): string[] {
        return Array.from(this.registry.keys());
    }

    /**
     * 根据方法名获取所属类
     */
    public getMethodClass(methodName: string): string | undefined {
        return this.methodToClass.get(methodName);
    }

    /**
     * 获取类实例
     */
    public getClassInstance(className: string): object | undefined {
        return this.instances.get(className);
    }

    /**
     * 获取注册统计信息
     */
    public getStats(): RpcRegistryStats {
        let serverRpcCount = 0;
        let clientRpcCount = 0;
        
        for (const [, entry] of this.registry) {
            if (entry.metadata.isServerRpc) {
                serverRpcCount++;
            } else {
                clientRpcCount++;
            }
        }
        
        return {
            totalMethods: this.registry.size,
            serverRpcMethods: serverRpcCount,
            clientRpcMethods: clientRpcCount,
            registeredClasses: this.classMethods.size
        };
    }

    /**
     * 验证方法调用
     */
    public validateMethodCall(
        methodName: string,
        args: unknown[],
        callerId?: string
    ): RpcValidationResult {
        const metadata = this.getMethodMetadata(methodName);
        if (!metadata) {
            return {
                valid: false,
                error: `RPC方法不存在: ${methodName}`
            };
        }
        
        return RpcMethodValidator.validateCall(metadata, args, callerId);
    }

    /**
     * 搜索方法
     */
    public searchMethods(query: RpcMethodSearchQuery): RpcMethodMetadata[] {
        const results: RpcMethodMetadata[] = [];
        
        for (const [methodName, entry] of this.registry) {
            const metadata = entry.metadata;
            
            // 类名过滤
            if (query.className && metadata.className !== query.className) {
                continue;
            }
            
            // RPC类型过滤
            if (query.isServerRpc !== undefined && metadata.isServerRpc !== query.isServerRpc) {
                continue;
            }
            
            // 认证要求过滤
            if (query.requireAuth !== undefined && metadata.options.requireAuth !== query.requireAuth) {
                continue;
            }
            
            // 目标过滤
            if (query.target && metadata.options.target !== query.target) {
                continue;
            }
            
            results.push(metadata);
        }
        
        return results;
    }

    /**
     * 清空所有注册
     */
    public clear(): void {
        const classNames = Array.from(this.classMethods.keys());
        
        for (const className of classNames) {
            this.unregisterClass(className);
        }
        
        this.registry.clear();
        this.classMethods.clear();
        this.methodToClass.clear();
        this.instances.clear();
        
        this.logger.info('已清空所有RPC注册');
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.clear();
        this.removeAllListeners();
    }
}