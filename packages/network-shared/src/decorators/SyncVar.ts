/**
 * SyncVar 装饰器
 * 
 * 用于标记需要在网络间自动同步的属性
 */

import 'reflect-metadata';
import { SyncVarMetadata, NetworkValue, DecoratorTarget, Constructor } from '../types/NetworkTypes';
import { getNetworkComponentMetadata } from './NetworkComponent';

/**
 * SyncVar 装饰器选项
 */
export interface SyncVarOptions {
  /** 是否仅权威端可修改，默认为 true */
  authorityOnly?: boolean;
  /** 变化回调函数名 */
  onChanged?: string;
  /** 序列化类型提示 */
  serializeType?: string;
  /** 是否使用增量同步 */
  deltaSync?: boolean;
  /** 同步优先级，数值越大优先级越高 */
  priority?: number;
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
 * @NetworkComponent()
 * class PlayerController extends Component {
 *   @SyncVar({ onChanged: 'onHealthChanged', priority: 10 })
 *   public health: number = 100;
 * 
 *   @SyncVar({ authorityOnly: false })
 *   public playerName: string = '';
 * 
 *   @SyncVar({ deltaSync: true })
 *   public inventory: Item[] = [];
 * 
 *   private onHealthChanged(oldValue: number, newValue: number): void {
 *     console.log(`Health changed from ${oldValue} to ${newValue}`);
 *   }
 * }
 * ```
 */
export function SyncVar<T extends NetworkValue = NetworkValue>(options: SyncVarOptions = {}): PropertyDecorator {
  return function (target: unknown, propertyKey: string | symbol) {
    if (typeof propertyKey !== 'string') {
      throw new Error('SyncVar can only be applied to string property keys');
    }

    // 获取或创建元数据数组
    const targetConstructor = (target as { constructor: Constructor }).constructor;
    let metadata: SyncVarMetadata[] = Reflect.getMetadata(SYNCVAR_METADATA_KEY, targetConstructor);
    if (!metadata) {
      metadata = [];
      Reflect.defineMetadata(SYNCVAR_METADATA_KEY, metadata, targetConstructor);
    }

    // 创建 SyncVar 元数据
    const syncVarMetadata: SyncVarMetadata = {
      propertyName: propertyKey,
      authorityOnly: options.authorityOnly !== false,
      onChanged: options.onChanged,
      serializeType: options.serializeType,
      deltaSync: options.deltaSync || false,
      priority: options.priority || 0
    };

    metadata.push(syncVarMetadata);

    // 更新 NetworkComponent 元数据
    const componentMetadata = getNetworkComponentMetadata(targetConstructor);
    if (componentMetadata) {
      const existingIndex = componentMetadata.syncVars.findIndex(sv => sv.propertyName === propertyKey);
      if (existingIndex >= 0) {
        componentMetadata.syncVars[existingIndex] = syncVarMetadata;
      } else {
        componentMetadata.syncVars.push(syncVarMetadata);
      }
    }

    // 创建属性的内部存储和变化跟踪
    const internalKey = `_${propertyKey}`;
    const dirtyKey = `_${propertyKey}_dirty`;
    const previousKey = `_${propertyKey}_previous`;

    // 重新定义属性的 getter 和 setter
    Object.defineProperty(target, propertyKey, {
      get: function (this: Record<string, unknown>): T {
        return this[internalKey] as T;
      },
      set: function (this: Record<string, unknown>, newValue: T) {
        const oldValue = this[internalKey] as T;
        
        // 检查值是否真的发生了变化
        if (oldValue === newValue) {
          return;
        }

        // 对于复杂对象，进行深度比较
        if (typeof newValue === 'object' && newValue !== null && 
            typeof oldValue === 'object' && oldValue !== null) {
          if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
            return;
          }
        }

        // 保存旧值用于回调
        this[previousKey] = oldValue;
        this[internalKey] = newValue;
        this[dirtyKey] = true;

        // 调用变化回调
        if (options.onChanged && typeof (this[options.onChanged] as unknown) === 'function') {
          (this[options.onChanged] as (oldValue: T, newValue: T) => void)(oldValue, newValue);
        }

        // 通知网络同步系统
        (this as { notifySyncVarChanged?: (key: string, oldValue: T, newValue: T, metadata: SyncVarMetadata) => void }).notifySyncVarChanged?.(propertyKey, oldValue, newValue, syncVarMetadata);
      },
      enumerable: true,
      configurable: true
    });

    // 初始化内部属性
    const targetRecord = target as Record<string, unknown>;
    if (targetRecord[internalKey] === undefined) {
      targetRecord[internalKey] = targetRecord[propertyKey];
    }
    targetRecord[dirtyKey] = false;
  };
}

/**
 * 获取类的 SyncVar 元数据
 */
export function getSyncVarMetadata(target: Constructor): SyncVarMetadata[] {
  return Reflect.getMetadata(SYNCVAR_METADATA_KEY, target) || [];
}

/**
 * 检查属性是否为 SyncVar
 */
export function isSyncVar(target: Constructor, propertyName: string): boolean {
  const metadata = getSyncVarMetadata(target);
  return metadata.some(m => m.propertyName === propertyName);
}

/**
 * 获取 SyncVar 的脏标记
 */
export function isSyncVarDirty(instance: Record<string, unknown>, propertyName: string): boolean {
  return (instance[`_${propertyName}_dirty`] as boolean) || false;
}

/**
 * 清除 SyncVar 的脏标记
 */
export function clearSyncVarDirty(instance: Record<string, unknown>, propertyName: string): void {
  instance[`_${propertyName}_dirty`] = false;
}

/**
 * 获取 SyncVar 的前一个值
 */
export function getSyncVarPreviousValue<T extends NetworkValue = NetworkValue>(instance: Record<string, unknown>, propertyName: string): T | undefined {
  return instance[`_${propertyName}_previous`] as T | undefined;
}

/**
 * 强制设置 SyncVar 值（跳过权限检查和变化检测）
 */
export function setSyncVarValue<T extends NetworkValue = NetworkValue>(instance: Record<string, unknown>, propertyName: string, value: T, skipCallback = false): void {
  const internalKey = `_${propertyName}`;
  const dirtyKey = `_${propertyName}_dirty`;
  const previousKey = `_${propertyName}_previous`;
  
  const oldValue = instance[internalKey] as T;
  instance[previousKey] = oldValue;
  instance[internalKey] = value;
  instance[dirtyKey] = false; // 网络接收的值不标记为脏

  // 可选择性调用回调
  if (!skipCallback) {
    const metadata = getSyncVarMetadata((instance as { constructor: Constructor }).constructor);
    const syncVarMeta = metadata.find(m => m.propertyName === propertyName);
    
    if (syncVarMeta?.onChanged && typeof (instance[syncVarMeta.onChanged] as unknown) === 'function') {
      (instance[syncVarMeta.onChanged] as (oldValue: T, newValue: T) => void)(oldValue, value);
    }
  }
}

/**
 * 批量获取所有脏的 SyncVar
 */
export function getDirtySyncVars(instance: Record<string, unknown>): Array<{
  propertyName: string;
  oldValue: NetworkValue;
  newValue: NetworkValue;
  metadata: SyncVarMetadata;
}> {
  const metadata = getSyncVarMetadata((instance as { constructor: Constructor }).constructor);
  const dirtyVars: Array<{
    propertyName: string;
    oldValue: NetworkValue;
    newValue: NetworkValue;
    metadata: SyncVarMetadata;
  }> = [];

  for (const syncVar of metadata) {
    if (isSyncVarDirty(instance, syncVar.propertyName)) {
      const oldValue = getSyncVarPreviousValue(instance, syncVar.propertyName);
      const newValue = instance[`_${syncVar.propertyName}`] as NetworkValue;
      
      dirtyVars.push({
        propertyName: syncVar.propertyName,
        oldValue: oldValue ?? newValue, // 使用空合并运算符处理undefined
        newValue: newValue,
        metadata: syncVar
      });
    }
  }

  // 按优先级排序，优先级高的先处理
  return dirtyVars.sort((a, b) => (b.metadata.priority || 0) - (a.metadata.priority || 0));
}

/**
 * 批量清除所有脏标记
 */
export function clearAllDirtySyncVars(instance: Record<string, unknown>): void {
  const metadata = getSyncVarMetadata((instance as { constructor: Constructor }).constructor);
  for (const syncVar of metadata) {
    clearSyncVarDirty(instance, syncVar.propertyName);
  }
}