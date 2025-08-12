/**
 * ClientRpc装饰器 - 客户端版本
 * 
 * 用于标记可以从服务器调用的客户端方法
 */

import 'reflect-metadata';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';

/**
 * ClientRpc配置选项
 */
export interface ClientRpcOptions {
  /** 是否可靠传输 */
  reliable?: boolean;
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 是否仅发送给所有者 */
  ownerOnly?: boolean;
  /** 是否包含发送者 */
  includeSender?: boolean;
  /** 权限要求 */
  requireAuthority?: boolean;
}

/**
 * ClientRpc元数据键
 */
export const CLIENT_RPC_METADATA_KEY = Symbol('client_rpc');

/**
 * ClientRpc元数据
 */
export interface ClientRpcMetadata {
  /** 方法名 */
  methodName: string;
  /** 配置选项 */
  options: ClientRpcOptions;
  /** 原始方法 */
  originalMethod: Function;
}

/**
 * ClientRpc装饰器
 */
export function ClientRpc(options: ClientRpcOptions = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const methodName = propertyKey as string;
    const originalMethod = descriptor.value;
    
    // 获取已有的ClientRpc元数据
    const existingMetadata: ClientRpcMetadata[] = Reflect.getMetadata(CLIENT_RPC_METADATA_KEY, target.constructor) || [];
    
    // 添加新的ClientRpc元数据
    existingMetadata.push({
      methodName,
      options: {
        reliable: true,
        timeout: 30000,
        ownerOnly: false,
        includeSender: false,
        requireAuthority: false,
        ...options
      },
      originalMethod
    });
    
    // 设置元数据
    Reflect.defineMetadata(CLIENT_RPC_METADATA_KEY, existingMetadata, target.constructor);
    
    // 包装原方法（客户端接收RPC调用时执行）
    descriptor.value = function (this: any, ...args: NetworkValue[]) {
      try {
        // 直接调用原方法，客户端接收RPC调用
        return originalMethod.apply(this, args);
      } catch (error) {
        console.error(`Error executing ClientRpc ${methodName}:`, error);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * 获取类的所有ClientRpc元数据
 */
export function getClientRpcMetadata(target: any): ClientRpcMetadata[] {
  return Reflect.getMetadata(CLIENT_RPC_METADATA_KEY, target) || [];
}

/**
 * 检查方法是否为ClientRpc
 */
export function isClientRpc(target: any, methodName: string): boolean {
  const metadata = getClientRpcMetadata(target);
  return metadata.some(meta => meta.methodName === methodName);
}

/**
 * 获取特定方法的ClientRpc选项
 */
export function getClientRpcOptions(target: any, methodName: string): ClientRpcOptions | null {
  const metadata = getClientRpcMetadata(target);
  const rpc = metadata.find(meta => meta.methodName === methodName);
  return rpc ? rpc.options : null;
}