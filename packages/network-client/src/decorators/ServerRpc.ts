/**
 * ServerRpc装饰器 - 客户端版本
 * 
 * 用于标记可以向服务器发送的RPC方法
 */

import 'reflect-metadata';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { ClientNetworkBehaviour } from '../core/ClientNetworkBehaviour';

/**
 * ServerRpc配置选项
 */
export interface ServerRpcOptions {
  /** 是否可靠传输 */
  reliable?: boolean;
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 是否需要权威 */
  requireAuthority?: boolean;
  /** 是否需要是本地玩家 */
  requireLocalPlayer?: boolean;
}

/**
 * ServerRpc元数据键
 */
export const SERVER_RPC_METADATA_KEY = Symbol('server_rpc');

/**
 * ServerRpc元数据
 */
export interface ServerRpcMetadata {
  /** 方法名 */
  methodName: string;
  /** 配置选项 */
  options: ServerRpcOptions;
  /** 原始方法 */
  originalMethod: Function;
}

/**
 * ServerRpc装饰器
 */
export function ServerRpc(options: ServerRpcOptions = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const methodName = propertyKey as string;
    const originalMethod = descriptor.value;
    
    // 获取已有的ServerRpc元数据
    const existingMetadata: ServerRpcMetadata[] = Reflect.getMetadata(SERVER_RPC_METADATA_KEY, target.constructor) || [];
    
    // 添加新的ServerRpc元数据
    existingMetadata.push({
      methodName,
      options: {
        reliable: true,
        timeout: 30000,
        requireAuthority: false,
        requireLocalPlayer: false,
        ...options
      },
      originalMethod
    });
    
    // 设置元数据
    Reflect.defineMetadata(SERVER_RPC_METADATA_KEY, existingMetadata, target.constructor);
    
    // 替换方法实现为发送RPC调用
    descriptor.value = async function (this: ClientNetworkBehaviour, ...args: NetworkValue[]) {
      try {
        // 获取NetworkIdentity
        const networkIdentity = this.entity?.getComponent('NetworkIdentity' as any);
        if (!networkIdentity) {
          throw new Error('NetworkIdentity component not found');
        }

        // 检查权限要求
        if (options.requireAuthority && !(networkIdentity as any).hasAuthority) {
          throw new Error(`ServerRpc ${methodName} requires authority`);
        }

        if (options.requireLocalPlayer && !(networkIdentity as any).isLocalPlayer) {
          throw new Error(`ServerRpc ${methodName} requires local player`);
        }

        // 发送RPC到服务器
        if (options.reliable) {
          const result = await this.sendServerRpc(methodName, ...args);
          return result;
        } else {
          await this.sendServerRpcUnreliable(methodName, ...args);
          return null;
        }
        
      } catch (error) {
        console.error(`Error sending ServerRpc ${methodName}:`, error);
        throw error;
      }
    };
    
    // 保存原方法到特殊属性，用于本地预测或调试
    (descriptor.value as any).__originalMethod = originalMethod;
    
    return descriptor;
  };
}

/**
 * 获取类的所有ServerRpc元数据
 */
export function getServerRpcMetadata(target: any): ServerRpcMetadata[] {
  return Reflect.getMetadata(SERVER_RPC_METADATA_KEY, target) || [];
}

/**
 * 检查方法是否为ServerRpc
 */
export function isServerRpc(target: any, methodName: string): boolean {
  const metadata = getServerRpcMetadata(target);
  return metadata.some(meta => meta.methodName === methodName);
}

/**
 * 获取特定方法的ServerRpc选项
 */
export function getServerRpcOptions(target: any, methodName: string): ServerRpcOptions | null {
  const metadata = getServerRpcMetadata(target);
  const rpc = metadata.find(meta => meta.methodName === methodName);
  return rpc ? rpc.options : null;
}

/**
 * 获取方法的原始实现（未被装饰器修改的版本）
 */
export function getOriginalMethod(method: Function): Function | null {
  return (method as any).__originalMethod || null;
}