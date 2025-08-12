/**
 * ClientRpc 装饰器
 * 
 * 用于标记可以在服务端调用，在客户端执行的方法
 */

import 'reflect-metadata';
import { RpcMetadata, DecoratorTarget, Constructor, RpcParameterType, RpcReturnType } from '../types/NetworkTypes';
import { getNetworkComponentMetadata } from './NetworkComponent';

/**
 * ClientRpc 装饰器选项
 */
export interface ClientRpcOptions {
  /** 是否需要权限验证 */
  requiresAuth?: boolean;
  /** 是否可靠传输，默认为 true */
  reliable?: boolean;
  /** 是否需要响应 */
  requiresResponse?: boolean;
  /** 目标客户端筛选器 */
  targetFilter?: 'all' | 'others' | 'owner' | 'specific';
}

/**
 * 存储 ClientRpc 元数据的 Symbol
 */
export const CLIENT_RPC_METADATA_KEY = Symbol('client_rpc_metadata');

/**
 * ClientRpc 装饰器
 * 
 * @param options 装饰器选项
 * @returns 方法装饰器函数
 * 
 * @example
 * ```typescript
 * @NetworkComponent()
 * class PlayerController extends Component {
 *   @ClientRpc({ targetFilter: 'all' })
 *   public showDamageEffect(damage: number, position: Vector3): void {
 *     // 在所有客户端显示伤害效果
 *     console.log(`Showing damage: ${damage} at ${position}`);
 *   }
 * 
 *   @ClientRpc({ targetFilter: 'owner', reliable: false })
 *   public updateUI(data: UIData): void {
 *     // 只在拥有者客户端更新UI，使用不可靠传输
 *   }
 * 
 *   @ClientRpc({ requiresResponse: true })
 *   public requestClientData(): ClientData {
 *     // 请求客户端数据并等待响应
 *     return this.getClientData();
 *   }
 * }
 * ```
 */
export function ClientRpc(options: ClientRpcOptions = {}): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (typeof propertyKey !== 'string') {
      throw new Error('ClientRpc can only be applied to string method names');
    }

    // 获取或创建元数据数组
    let metadata: RpcMetadata[] = Reflect.getMetadata(CLIENT_RPC_METADATA_KEY, (target as { constructor: Constructor }).constructor);
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(CLIENT_RPC_METADATA_KEY, metadata, (target as { constructor: Constructor }).constructor);
    }

    // 创建 RPC 元数据
    const rpcMetadata: RpcMetadata = {
      methodName: propertyKey,
      rpcType: 'client-rpc',
      requiresAuth: options.requiresAuth || false,
      reliable: options.reliable !== false,
      requiresResponse: options.requiresResponse || false
    };

    metadata.push(rpcMetadata);

    // 更新 NetworkComponent 元数据
    const componentMetadata = getNetworkComponentMetadata((target as { constructor: Constructor }).constructor);
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
      throw new Error(`ClientRpc can only be applied to methods, got ${typeof originalMethod}`);
    }

    // 包装方法以添加网络调用逻辑
    descriptor.value = function (this: Record<string, unknown> & {
      isServer?: () => boolean;
      sendClientRpc?: (methodName: string, args: RpcParameterType[], options: ClientRpcOptions, metadata: RpcMetadata) => RpcReturnType;
    }, ...args: RpcParameterType[]): RpcReturnType {
      // 如果在服务端调用，发送到客户端
      const isServer = this.isServer?.() || (typeof window === 'undefined' && typeof process !== 'undefined');
      if (isServer) {
        return this.sendClientRpc?.(propertyKey, args, options, rpcMetadata) as RpcReturnType;
      }
      
      // 如果在客户端，直接执行本地方法
      return (originalMethod as (...args: RpcParameterType[]) => RpcReturnType).apply(this, args);
    };

    // 保存原方法的引用，供直接调用
    const decoratedFunction = descriptor.value as typeof descriptor.value & {
      __originalMethod: typeof originalMethod;
      __rpcMetadata: RpcMetadata;
      __rpcOptions: ClientRpcOptions;
    };
    decoratedFunction.__originalMethod = originalMethod;
    decoratedFunction.__rpcMetadata = rpcMetadata;
    decoratedFunction.__rpcOptions = options;

    return descriptor;
  };
}

/**
 * 获取类的 ClientRpc 元数据
 */
export function getClientRpcMetadata(target: Constructor): RpcMetadata[] {
  return Reflect.getMetadata(CLIENT_RPC_METADATA_KEY, target) || [];
}

/**
 * 检查方法是否为 ClientRpc
 */
export function isClientRpc(target: Constructor, methodName: string): boolean {
  const metadata = getClientRpcMetadata(target);
  return metadata.some(m => m.methodName === methodName);
}

/**
 * 获取特定方法的 ClientRpc 元数据
 */
export function getClientRpcMethodMetadata(target: Constructor, methodName: string): RpcMetadata | null {
  const metadata = getClientRpcMetadata(target);
  return metadata.find(m => m.methodName === methodName) || null;
}

/**
 * 直接调用原方法（跳过网络逻辑）
 */
export function invokeClientRpcLocally(instance: Record<string, unknown>, methodName: string, args: RpcParameterType[]): RpcReturnType {
  const method = instance[methodName] as { __originalMethod?: (...args: RpcParameterType[]) => RpcReturnType } | undefined;
  if (method && typeof method.__originalMethod === 'function') {
    return method.__originalMethod.apply(instance, args);
  }
  throw new Error(`Method ${methodName} is not a valid ClientRpc or original method not found`);
}

/**
 * 检查 ClientRpc 是否需要响应
 */
export function clientRpcRequiresResponse(instance: Record<string, unknown>, methodName: string): boolean {
  const method = instance[methodName] as { __rpcMetadata?: RpcMetadata } | undefined;
  return method?.__rpcMetadata?.requiresResponse || false;
}

/**
 * 获取 ClientRpc 的选项
 */
export function getClientRpcOptions(instance: Record<string, unknown>, methodName: string): ClientRpcOptions | null {
  const method = instance[methodName] as { __rpcOptions?: ClientRpcOptions } | undefined;
  return method?.__rpcOptions || null;
}