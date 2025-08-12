/**
 * NetworkComponent 装饰器
 * 
 * 用于标记网络组件，自动注册到网络系统
 */

import 'reflect-metadata';
import { NetworkComponentMetadata } from '../types/NetworkTypes';

/**
 * NetworkComponent 装饰器选项
 */
export interface NetworkComponentOptions {
  /** 是否自动生成 protobuf 协议 */
  autoGenerateProtocol?: boolean;
  /** 自定义组件类型名 */
  typeName?: string;
  /** 是否仅服务端存在 */
  serverOnly?: boolean;
  /** 是否仅客户端存在 */
  clientOnly?: boolean;
}

/**
 * 存储 NetworkComponent 元数据的 Symbol
 */
export const NETWORK_COMPONENT_METADATA_KEY = Symbol('network_component_metadata');

/**
 * NetworkComponent 装饰器
 * 
 * @param options 装饰器选项
 * @returns 类装饰器函数
 * 
 * @example
 * ```typescript
 * @NetworkComponent({ autoGenerateProtocol: true })
 * class PlayerController extends Component implements INetworkComponent {
 *   networkObject: INetworkObject | null = null;
 *   networkId: number = 0;
 *   hasAuthority: boolean = false;
 *   componentType: string = 'PlayerController';
 * 
 *   @SyncVar()
 *   public health: number = 100;
 * 
 *   @ClientRpc()
 *   public showDamage(damage: number): void {
 *     // 显示伤害效果
 *   }
 * }
 * ```
 */
export function NetworkComponent(options: NetworkComponentOptions = {}): ClassDecorator {
  return function <T extends Function>(target: T) {
    const metadata: NetworkComponentMetadata = {
      componentType: options.typeName || target.name,
      syncVars: [],
      rpcs: [],
      autoGenerateProtocol: options.autoGenerateProtocol !== false,
    };

    // 存储元数据
    Reflect.defineMetadata(NETWORK_COMPONENT_METADATA_KEY, metadata, target);
    
    // 注册到全局组件注册表
    NetworkComponentRegistry.register(target as any, metadata);

    return target;
  };
}

/**
 * 获取类的 NetworkComponent 元数据
 */
export function getNetworkComponentMetadata(target: any): NetworkComponentMetadata | null {
  return Reflect.getMetadata(NETWORK_COMPONENT_METADATA_KEY, target) || null;
}

/**
 * 检查类是否为 NetworkComponent
 */
export function isNetworkComponent(target: any): boolean {
  return Reflect.hasMetadata(NETWORK_COMPONENT_METADATA_KEY, target);
}

/**
 * 网络组件注册表
 */
class NetworkComponentRegistry {
  private static components = new Map<string, {
    constructor: any;
    metadata: NetworkComponentMetadata;
  }>();

  /**
   * 注册网络组件
   */
  static register(constructor: any, metadata: NetworkComponentMetadata): void {
    this.components.set(metadata.componentType, {
      constructor,
      metadata
    });
  }

  /**
   * 获取组件信息
   */
  static getComponent(typeName: string) {
    return this.components.get(typeName);
  }

  /**
   * 获取所有组件
   */
  static getAllComponents() {
    return Array.from(this.components.entries()).map(([typeName, info]) => ({
      typeName,
      ...info
    }));
  }

  /**
   * 检查组件是否已注册
   */
  static hasComponent(typeName: string): boolean {
    return this.components.has(typeName);
  }

  /**
   * 清空注册表 (主要用于测试)
   */
  static clear(): void {
    this.components.clear();
  }
}

export { NetworkComponentRegistry };