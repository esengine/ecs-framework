/**
 * SyncVar 装饰器
 * 
 * 用于标记需要在网络间自动同步的属性
 * 当属性值发生变化时，会自动同步到其他网络端
 */

import 'reflect-metadata';
import { SyncVarMetadata } from '../Types/NetworkTypes';

/**
 * SyncVar 装饰器选项
 */
export interface SyncVarOptions {
  /** 是否仅权威端可修改，默认为 true */
  authorityOnly?: boolean;
  /** 变化回调函数名，属性变化时会调用此方法 */
  onChanged?: string;
}

/**
 * 存储 SyncVar 元数据的 Symbol
 */
export const SYNCVAR_METADATA_KEY = Symbol('syncvar_metadata');

/**
 * SyncVar 装饰器
 * 
 * @param options 装饰器选项
 * @returns 属性装饰器函数
 * 
 * @example
 * ```typescript
 * class PlayerController extends NetworkBehaviour {
 *   @SyncVar({ onChanged: 'onHealthChanged' })
 *   public health: number = 100;
 * 
 *   @SyncVar({ authorityOnly: false })
 *   public playerName: string = '';
 * 
 *   private onHealthChanged(oldValue: number, newValue: number): void {
 *     console.log(`Health changed from ${oldValue} to ${newValue}`);
 *   }
 * }
 * ```
 */
export function SyncVar(options: SyncVarOptions = {}): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') {
      throw new Error('SyncVar can only be applied to string property keys');
    }

    // 获取或创建元数据数组
    let metadata: SyncVarMetadata[] = Reflect.getMetadata(SYNCVAR_METADATA_KEY, target.constructor);
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(SYNCVAR_METADATA_KEY, metadata, target.constructor);
    }

    // 添加当前属性的元数据
    const syncVarMetadata: SyncVarMetadata = {
      propertyName: propertyKey,
      authorityOnly: options.authorityOnly !== false, // 默认为 true
      onChanged: options.onChanged
    };

    metadata.push(syncVarMetadata);

    // 创建属性的内部存储
    const internalKey = `_${propertyKey}`;
    const changeKey = `_${propertyKey}_changed`;

    // 重新定义属性的 getter 和 setter
    Object.defineProperty(target, propertyKey, {
      get: function (this: any) {
        return this[internalKey];
      },
      set: function (this: any, newValue: any) {
        const oldValue = this[internalKey];
        
        // 检查值是否真的发生了变化
        if (oldValue === newValue) {
          return;
        }

        this[internalKey] = newValue;
        this[changeKey] = true;

        // 调用变化回调
        if (options.onChanged && typeof this[options.onChanged] === 'function') {
          this[options.onChanged](oldValue, newValue);
        }

        // 通知同步管理器
        this.notifySyncVarChanged?.(propertyKey, oldValue, newValue);
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * 获取类的 SyncVar 元数据
 */
export function getSyncVarMetadata(target: any): SyncVarMetadata[] {
  return Reflect.getMetadata(SYNCVAR_METADATA_KEY, target) || [];
}

/**
 * 检查属性是否为 SyncVar
 */
export function isSyncVar(target: any, propertyName: string): boolean {
  const metadata = getSyncVarMetadata(target);
  return metadata.some(m => m.propertyName === propertyName);
}