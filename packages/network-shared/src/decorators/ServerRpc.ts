/**
 * ServerRpc 装饰器
 * 
 * 用于标记可以在客户端调用，在服务端执行的方法
 */

import 'reflect-metadata';
import { RpcMetadata, DecoratorTarget, Constructor, RpcParameterType, RpcReturnType } from '../types/NetworkTypes';
import { getNetworkComponentMetadata } from './NetworkComponent';

/**
 * ServerRpc 装饰器选项
 */
export interface ServerRpcOptions {
  /** 是否需要权限验证 */
  requiresAuth?: boolean;
  /** 是否可靠传输，默认为 true */
  reliable?: boolean;
  /** 是否需要响应 */
  requiresResponse?: boolean;
  /** 是否需要拥有者权限 */
  requiresOwnership?: boolean;
  /** 调用频率限制 (调用/秒) */
  rateLimit?: number;
}

/**
 * 存储 ServerRpc 元数据的 Symbol
 */
export const SERVER_RPC_METADATA_KEY = Symbol('server_rpc_metadata');

/**
 * ServerRpc 装饰器
 * 
 * @param options 装饰器选项
 * @returns 方法装饰器函数
 * 
 * @example
 * ```typescript
 * @NetworkComponent()
 * class PlayerController extends Component {
 *   @ServerRpc({ requiresOwnership: true, rateLimit: 10 })
 *   public movePlayer(direction: Vector3): void {
 *     // 在服务端处理玩家移动，需要拥有者权限，限制每秒10次调用
 *     this.transform.position.add(direction);
 *   }
 * 
 *   @ServerRpc({ requiresAuth: true })
 *   public purchaseItem(itemId: string): boolean {
 *     // 购买物品，需要认证
 *     return this.inventory.tryPurchase(itemId);
 *   }
 * 
 *   @ServerRpc({ requiresResponse: true })
 *   public getPlayerStats(): PlayerStats {
 *     // 获取玩家统计数据并返回给客户端
 *     return this.stats.toObject();
 *   }
 * }
 * ```
 */
export function ServerRpc(options: ServerRpcOptions = {}): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (typeof propertyKey !== 'string') {
      throw new Error('ServerRpc can only be applied to string method names');
    }

    // 获取或创建元数据数组
    const targetConstructor = (target as { constructor: Constructor }).constructor;
    let metadata: RpcMetadata[] = Reflect.getMetadata(SERVER_RPC_METADATA_KEY, targetConstructor);
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(SERVER_RPC_METADATA_KEY, metadata, targetConstructor);
    }

    // 创建 RPC 元数据
    const rpcMetadata: RpcMetadata = {
      methodName: propertyKey,
      rpcType: 'server-rpc',
      requiresAuth: options.requiresAuth || false,
      reliable: options.reliable !== false,
      requiresResponse: options.requiresResponse || false
    };

    metadata.push(rpcMetadata);

    // 更新 NetworkComponent 元数据
    const componentMetadata = getNetworkComponentMetadata(targetConstructor);
    if (componentMetadata) {
      const existingIndex = componentMetadata.rpcs.findIndex(rpc => rpc.methodName === propertyKey);
      if (existingIndex >= 0) {
        componentMetadata.rpcs[existingIndex] = rpcMetadata;
      } else {
        componentMetadata.rpcs.push(rpcMetadata);
      }
    }

    // 保存原方法
    const originalMethod = descriptor.value;
    if (typeof originalMethod !== 'function') {
      throw new Error(`ServerRpc can only be applied to methods, got ${typeof originalMethod}`);
    }

    // 包装方法以添加网络调用逻辑
    descriptor.value = function (this: any, ...args: any[]) {
      // 如果在客户端调用，发送到服务端
      const isClient = this.isClient?.() || (typeof window !== 'undefined');
      if (isClient) {
        return this.sendServerRpc?.(propertyKey, args, options, rpcMetadata);
      }
      
      // 如果在服务端，直接执行本地方法
      return originalMethod.apply(this, args);
    };

    // 保存原方法的引用，供直接调用
    (descriptor.value as any).__originalMethod = originalMethod;
    (descriptor.value as any).__rpcMetadata = rpcMetadata;
    (descriptor.value as any).__rpcOptions = options;

    return descriptor;
  };
}

/**
 * Command 装饰器 (ServerRpc 的别名，用于兼容性)
 */
export const Command = ServerRpc;

/**
 * 获取类的 ServerRpc 元数据
 */
export function getServerRpcMetadata(target: Constructor): RpcMetadata[] {
  return Reflect.getMetadata(SERVER_RPC_METADATA_KEY, target) || [];
}

/**
 * 检查方法是否为 ServerRpc
 */
export function isServerRpc(target: Constructor, methodName: string): boolean {
  const metadata = getServerRpcMetadata(target);
  return metadata.some(m => m.methodName === methodName);
}

/**
 * 获取特定方法的 ServerRpc 元数据
 */
export function getServerRpcMethodMetadata(target: Constructor, methodName: string): RpcMetadata | null {
  const metadata = getServerRpcMetadata(target);
  return metadata.find(m => m.methodName === methodName) || null;
}

/**
 * 直接调用原方法（跳过网络逻辑）
 */
export function invokeServerRpcLocally(instance: any, methodName: string, args: any[]): any {
  const method = instance[methodName];
  if (method && typeof method.__originalMethod === 'function') {
    return method.__originalMethod.apply(instance, args);
  }
  throw new Error(`Method ${methodName} is not a valid ServerRpc or original method not found`);
}

/**
 * 检查 ServerRpc 是否需要响应
 */
export function serverRpcRequiresResponse(instance: any, methodName: string): boolean {
  const method = instance[methodName];
  return method?.__rpcMetadata?.requiresResponse || false;
}

/**
 * 获取 ServerRpc 的选项
 */
export function getServerRpcOptions(instance: any, methodName: string): ServerRpcOptions | null {
  const method = instance[methodName];
  return method?.__rpcOptions || null;
}