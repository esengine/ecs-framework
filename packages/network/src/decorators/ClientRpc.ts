/**
 * ClientRpc 装饰器
 * 
 * 用于标记可以从服务端调用的客户端方法
 * 只能在服务端调用，会向指定客户端或所有客户端发送RPC消息
 */

import 'reflect-metadata';
import { RpcMetadata } from '../types/NetworkTypes';

/**
 * ClientRpc 装饰器选项
 */
export interface ClientRpcOptions {
  /** 是否需要权威验证，默认为 true */
  requiresAuthority?: boolean;
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
 * class PlayerController extends NetworkBehaviour {
 *   @ClientRpc()
 *   public showEffect(effectType: string, position: Vector3): void {
 *     // 这个方法会在客户端执行
 *     console.log(`显示特效: ${effectType} at ${position}`);
 *   }
 * 
 *   private triggerEffect(): void {
 *     if (this.isServer) {
 *       // 服务端调用，会发送到所有客户端
 *       this.showEffect('explosion', new Vector3(0, 0, 0));
 *     }
 *   }
 * }
 * ```
 */
export function ClientRpc(options: ClientRpcOptions = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (typeof propertyKey !== 'string') {
      throw new Error('ClientRpc can only be applied to string method names');
    }

    // 获取或创建元数据数组
    let metadata: RpcMetadata[] = Reflect.getMetadata(CLIENT_RPC_METADATA_KEY, target.constructor);
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(CLIENT_RPC_METADATA_KEY, metadata, target.constructor);
    }

    // 添加当前方法的元数据
    const rpcMetadata: RpcMetadata = {
      methodName: propertyKey,
      isClientRpc: true,
      requiresAuthority: options.requiresAuthority !== false // 默认为 true
    };

    metadata.push(rpcMetadata);

    // 保存原始方法
    const originalMethod = descriptor.value;

    // 包装方法以添加网络功能
    descriptor.value = function (this: any, ...args: any[]) {
      // 如果在服务端调用，发送RPC消息
      if (this.isServer) {
        if (rpcMetadata.requiresAuthority && !this.hasAuthority) {
          console.warn(`[ClientRpc] 权限不足，无法调用: ${propertyKey}`);
          return;
        }

        // 发送客户端RPC
        this.sendClientRpc?.(propertyKey, args);
      } else if (this.isClient) {
        // 在客户端直接执行原始方法
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * 获取类的 ClientRpc 元数据
 */
export function getClientRpcMetadata(target: any): RpcMetadata[] {
  return Reflect.getMetadata(CLIENT_RPC_METADATA_KEY, target) || [];
}

/**
 * 检查方法是否为 ClientRpc
 */
export function isClientRpc(target: any, methodName: string): boolean {
  const metadata = getClientRpcMetadata(target);
  return metadata.some(m => m.methodName === methodName);
}