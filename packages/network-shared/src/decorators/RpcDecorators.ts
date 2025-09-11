import 'reflect-metadata';
import { RpcTarget } from '../types/NetworkTypes';
import { RpcOptions, RpcMethodMetadata } from '../types/RpcTypes';

/**
 * RPC元数据键
 */
const RPC_METADATA_KEY = Symbol('rpc:metadata');
const RPC_METHODS_KEY = Symbol('rpc:methods');

/**
 * RPC验证结果
 */
export interface RpcValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * 服务端RPC装饰器选项
 */
export interface ServerRpcOptions extends RpcOptions {
    /** 允许的调用者类型 */
    allowedCallers?: 'all' | 'authenticated' | 'admin';
    /** 最大并发调用数 */
    maxConcurrent?: number;
}

/**
 * 客户端RPC装饰器选项  
 */
export interface ClientRpcOptions extends RpcOptions {
    /** 广播到多个客户端时的聚合策略 */
    aggregationStrategy?: 'first' | 'all' | 'majority';
    /** 缓存策略 */
    cacheStrategy?: 'none' | 'memory' | 'persistent';
    /** 缓存有效期(毫秒) */
    cacheTTL?: number;
}

/**
 * 服务端RPC装饰器
 * 标记方法可以被客户端调用
 */
export function ServerRpc(options: ServerRpcOptions = {}): MethodDecorator {
    return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const className = target.constructor.name;
        const methodName = String(propertyKey);
        
        // 获取参数类型和返回值类型
        const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
        const returnType = Reflect.getMetadata('design:returntype', target, propertyKey);
        
        const metadata: RpcMethodMetadata = {
            methodName,
            className,
            isServerRpc: true,
            options: {
                reliable: true,
                priority: 5,
                target: RpcTarget.Server,
                timeout: 30000,
                requireAuth: false,
                rateLimit: 60,
                ...options
            },
            paramTypes: paramTypes.map((type: unknown) => type?.constructor?.name || 'unknown'),
            returnType: returnType?.name || 'unknown'
        };
        
        // 存储元数据
        Reflect.defineMetadata(RPC_METADATA_KEY, metadata, target, propertyKey);
        
        // 添加到方法列表
        const existingMethods = Reflect.getMetadata(RPC_METHODS_KEY, target.constructor) || [];
        existingMethods.push(methodName);
        Reflect.defineMetadata(RPC_METHODS_KEY, existingMethods, target.constructor);
        
        // 包装原方法以添加验证和日志
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: unknown[]) {
            // 这里可以添加调用前的验证逻辑
            try {
                const result = await originalMethod.apply(this, args);
                return result;
            } catch (error) {
                // 这里可以添加错误处理逻辑
                throw error;
            }
        };
        
        return descriptor;
    };
}

/**
 * 客户端RPC装饰器
 * 标记方法可以调用到客户端
 */
export function ClientRpc(options: ClientRpcOptions = {}): MethodDecorator {
    return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const className = target.constructor.name;
        const methodName = String(propertyKey);
        
        // 获取参数类型和返回值类型
        const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
        const returnType = Reflect.getMetadata('design:returntype', target, propertyKey);
        
        const metadata: RpcMethodMetadata = {
            methodName,
            className,
            isServerRpc: false,
            options: {
                reliable: false,
                priority: 3,
                target: RpcTarget.All,
                timeout: 10000,
                requireAuth: false,
                rateLimit: 30,
                ...options
            },
            paramTypes: paramTypes.map((type: unknown) => type?.constructor?.name || 'unknown'),
            returnType: returnType?.name || 'unknown'
        };
        
        // 存储元数据
        Reflect.defineMetadata(RPC_METADATA_KEY, metadata, target, propertyKey);
        
        // 添加到方法列表
        const existingMethods = Reflect.getMetadata(RPC_METHODS_KEY, target.constructor) || [];
        existingMethods.push(methodName);
        Reflect.defineMetadata(RPC_METHODS_KEY, existingMethods, target.constructor);
        
        // 包装原方法以添加调用逻辑
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: unknown[]) {
            // 这里将被RPC调用器替换
            // 目前保持原方法以支持本地测试
            return originalMethod.apply(this, args);
        };
        
        return descriptor;
    };
}

/**
 * 获取类的所有RPC方法元数据
 */
export function getRpcMethods(target: Function): RpcMethodMetadata[] {
    const methodNames = Reflect.getMetadata(RPC_METHODS_KEY, target) || [];
    const prototype = target.prototype;
    
    return methodNames.map((methodName: string) => {
        const metadata = Reflect.getMetadata(RPC_METADATA_KEY, prototype, methodName);
        if (!metadata) {
            throw new Error(`RPC元数据未找到: ${target.name}.${methodName}`);
        }
        return metadata;
    });
}

/**
 * 获取特定方法的RPC元数据
 */
export function getRpcMethodMetadata(
    target: object, 
    methodName: string | symbol
): RpcMethodMetadata | undefined {
    return Reflect.getMetadata(RPC_METADATA_KEY, target, methodName);
}

/**
 * 检查方法是否为RPC方法
 */
export function isRpcMethod(target: object, methodName: string | symbol): boolean {
    return Reflect.hasMetadata(RPC_METADATA_KEY, target, methodName);
}

/**
 * 检查方法是否为服务端RPC
 */
export function isServerRpcMethod(target: object, methodName: string | symbol): boolean {
    const metadata = getRpcMethodMetadata(target, methodName);
    return metadata?.isServerRpc === true;
}

/**
 * 检查方法是否为客户端RPC
 */
export function isClientRpcMethod(target: object, methodName: string | symbol): boolean {
    const metadata = getRpcMethodMetadata(target, methodName);
    return metadata?.isServerRpc === false;
}

/**
 * RPC方法验证器
 */
export class RpcMethodValidator {
    /**
     * 验证RPC方法调用参数
     */
    static validateCall(
        metadata: RpcMethodMetadata,
        args: unknown[],
        callerId?: string
    ): RpcValidationResult {
        // 参数数量检查
        if (args.length !== metadata.paramTypes.length) {
            return {
                valid: false,
                error: `参数数量不匹配，期望 ${metadata.paramTypes.length} 个，实际 ${args.length} 个`
            };
        }
        
        // 权限检查
        if (metadata.options.requireAuth && !callerId) {
            return {
                valid: false,
                error: '该方法需要身份验证'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * 验证RPC方法定义
     */
    static validateMethodDefinition(metadata: RpcMethodMetadata): RpcValidationResult {
        // 方法名检查
        if (!metadata.methodName || typeof metadata.methodName !== 'string') {
            return {
                valid: false,
                error: '方法名无效'
            };
        }
        
        // 超时时间检查
        if (metadata.options.timeout && metadata.options.timeout <= 0) {
            return {
                valid: false,
                error: '超时时间必须大于0'
            };
        }
        
        // 优先级检查
        if (metadata.options.priority !== undefined && 
            (metadata.options.priority < 0 || metadata.options.priority > 10)) {
            return {
                valid: false,
                error: '优先级必须在0-10之间'
            };
        }
        
        return { valid: true };
    }
}