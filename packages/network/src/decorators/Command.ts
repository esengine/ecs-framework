/**
 * Command 装饰器
 * 
 * 用于标记可以从客户端调用的服务端方法
 * 只能在客户端调用，会向服务端发送命令消息
 */

import 'reflect-metadata';
import { RpcMetadata } from '../Types/NetworkTypes';

/**
 * Command 装饰器选项
 */
export interface CommandOptions {
  /** 是否需要权威验证，默认为 true */
  requiresAuthority?: boolean;
}

/**
 * 存储 Command 元数据的 Symbol
 */
export const COMMAND_METADATA_KEY = Symbol('command_metadata');

/**
 * Command 装饰器
 * 
 * @param options 装饰器选项
 * @returns 方法装饰器函数
 * 
 * @example
 * ```typescript
 * class PlayerController extends NetworkBehaviour {
 *   @Command()
 *   public movePlayer(direction: Vector3): void {
 *     // 这个方法会在服务端执行
 *     console.log(`玩家移动: ${direction}`);
 *     // 更新玩家位置逻辑...
 *   }
 * 
 *   private handleInput(): void {
 *     if (this.isClient && this.hasAuthority) {
 *       // 客户端调用，会发送到服务端
 *       this.movePlayer(new Vector3(1, 0, 0));
 *     }
 *   }
 * }
 * ```
 */
export function Command(options: CommandOptions = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (typeof propertyKey !== 'string') {
      throw new Error('Command can only be applied to string method names');
    }

    // 获取或创建元数据数组
    let metadata: RpcMetadata[] = Reflect.getMetadata(COMMAND_METADATA_KEY, target.constructor);
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(COMMAND_METADATA_KEY, metadata, target.constructor);
    }

    // 添加当前方法的元数据
    const rpcMetadata: RpcMetadata = {
      methodName: propertyKey,
      isClientRpc: false,
      requiresAuthority: options.requiresAuthority !== false // 默认为 true
    };

    metadata.push(rpcMetadata);

    // 保存原始方法
    const originalMethod = descriptor.value;

    // 包装方法以添加网络功能
    descriptor.value = function (this: any, ...args: any[]) {
      // 如果在客户端调用，发送命令消息
      if (this.isClient) {
        if (rpcMetadata.requiresAuthority && !this.hasAuthority) {
          console.warn(`[Command] 权限不足，无法调用: ${propertyKey}`);
          return;
        }

        // 发送命令到服务端
        this.sendCommand?.(propertyKey, args);
      } else if (this.isServer) {
        // 在服务端直接执行原始方法
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * 获取类的 Command 元数据
 */
export function getCommandMetadata(target: any): RpcMetadata[] {
  return Reflect.getMetadata(COMMAND_METADATA_KEY, target) || [];
}

/**
 * 检查方法是否为 Command
 */
export function isCommand(target: any, methodName: string): boolean {
  const metadata = getCommandMetadata(target);
  return metadata.some(m => m.methodName === methodName);
}