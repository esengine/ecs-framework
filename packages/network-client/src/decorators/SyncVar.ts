/**
 * SyncVar装饰器 - 客户端版本
 * 
 * 用于标记需要同步的变量
 */

import 'reflect-metadata';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { ClientNetworkBehaviour } from '../core/ClientNetworkBehaviour';

/**
 * SyncVar配置选项
 */
export interface SyncVarOptions {
  /** 是否可从客户端修改 */
  clientCanModify?: boolean;
  /** 同步间隔(毫秒)，0表示立即同步 */
  syncInterval?: number;
  /** 是否仅同步给所有者 */
  ownerOnly?: boolean;
  /** 自定义序列化器 */
  serializer?: (value: any) => NetworkValue;
  /** 自定义反序列化器 */
  deserializer?: (value: NetworkValue) => any;
}

/**
 * SyncVar元数据键
 */
export const SYNCVAR_METADATA_KEY = Symbol('syncvar');

/**
 * SyncVar元数据
 */
export interface SyncVarMetadata {
  /** 属性名 */
  propertyKey: string;
  /** 配置选项 */
  options: SyncVarOptions;
}

/**
 * SyncVar装饰器
 */
export function SyncVar(options: SyncVarOptions = {}): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const key = propertyKey as string;
    
    // 获取已有的SyncVar元数据
    const existingMetadata: SyncVarMetadata[] = Reflect.getMetadata(SYNCVAR_METADATA_KEY, target.constructor) || [];
    
    // 添加新的SyncVar元数据
    existingMetadata.push({
      propertyKey: key,
      options: {
        clientCanModify: false,
        syncInterval: 0,
        ownerOnly: false,
        ...options
      }
    });
    
    // 设置元数据
    Reflect.defineMetadata(SYNCVAR_METADATA_KEY, existingMetadata, target.constructor);
    
    // 存储原始属性名（用于内部存储）
    const privateKey = `_syncvar_${key}`;
    
    // 创建属性访问器
    Object.defineProperty(target, key, {
      get: function (this: ClientNetworkBehaviour) {
        // 从NetworkIdentity获取SyncVar值
        const networkIdentity = this.entity?.getComponent('NetworkIdentity' as any);
        if (networkIdentity) {
          const syncVarValue = (networkIdentity as any).getSyncVar(key);
          if (syncVarValue !== undefined) {
            return options.deserializer ? options.deserializer(syncVarValue) : syncVarValue;
          }
        }
        
        // 如果网络值不存在，返回本地存储的值
        return (this as any)[privateKey];
      },
      
      set: function (this: ClientNetworkBehaviour, value: any) {
        const oldValue = (this as any)[privateKey];
        const newValue = options.serializer ? options.serializer(value) : value;
        
        // 存储到本地
        (this as any)[privateKey] = value;
        
        // 获取NetworkIdentity
        const networkIdentity = this.entity?.getComponent('NetworkIdentity' as any);
        if (!networkIdentity) {
          return;
        }
        
        // 检查是否可以修改
        if (!options.clientCanModify && !(networkIdentity as any).hasAuthority) {
          console.warn(`Cannot modify SyncVar ${key} without authority`);
          return;
        }
        
        // 注册SyncVar（如果尚未注册）
        (networkIdentity as any).registerSyncVar(key, newValue);
        
        // 更新NetworkIdentity中的值
        (networkIdentity as any).updateSyncVar(key, newValue);
        
        // 如果有权威且值发生变化，发送到服务器
        if ((networkIdentity as any).hasAuthority && oldValue !== value) {
          this.updateSyncVar(key, newValue).catch(error => {
            console.error(`Failed to sync variable ${key}:`, error);
          });
        }
      },
      
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * 获取类的所有SyncVar元数据
 */
export function getSyncVarMetadata(target: any): SyncVarMetadata[] {
  return Reflect.getMetadata(SYNCVAR_METADATA_KEY, target) || [];
}

/**
 * 检查属性是否为SyncVar
 */
export function isSyncVar(target: any, propertyKey: string): boolean {
  const metadata = getSyncVarMetadata(target);
  return metadata.some(meta => meta.propertyKey === propertyKey);
}

/**
 * 获取特定属性的SyncVar选项
 */
export function getSyncVarOptions(target: any, propertyKey: string): SyncVarOptions | null {
  const metadata = getSyncVarMetadata(target);
  const syncVar = metadata.find(meta => meta.propertyKey === propertyKey);
  return syncVar ? syncVar.options : null;
}