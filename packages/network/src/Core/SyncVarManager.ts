/**
 * 同步变量管理器
 * 
 * 负责管理 SyncVar 的同步逻辑，包括变化检测、权限验证和消息发送
 */

import { createLogger } from '@esengine/ecs-framework';
import { NetworkBehaviour } from '../NetworkBehaviour';
import { getSyncVarMetadata, SYNCVAR_METADATA_KEY } from '../decorators/SyncVar';
import { SyncVarMessage, SyncVarMetadata } from '../types/NetworkTypes';

const logger = createLogger('SyncVarManager');

/**
 * SyncVar 变化记录
 */
interface SyncVarChange {
  networkId: number;
  componentType: string;
  propertyName: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export class SyncVarManager {
  private static _instance: SyncVarManager | null = null;

  /** 待同步的变化列表 */
  private pendingChanges: SyncVarChange[] = [];

  /** 已注册的网络组件实例 */
  private registeredComponents: Map<string, NetworkBehaviour[]> = new Map();

  public static get instance(): SyncVarManager {
    if (!SyncVarManager._instance) {
      SyncVarManager._instance = new SyncVarManager();
    }
    return SyncVarManager._instance;
  }

  private constructor() {}

  /**
   * 注册网络组件，为其设置 SyncVar 支持
   */
  public registerComponent(component: NetworkBehaviour): void {
    const componentType = component.constructor.name;
    
    // 获取 SyncVar 元数据
    const metadata = getSyncVarMetadata(component.constructor);
    if (metadata.length === 0) {
      return; // 没有 SyncVar，无需处理
    }

    // 添加到注册列表
    if (!this.registeredComponents.has(componentType)) {
      this.registeredComponents.set(componentType, []);
    }
    this.registeredComponents.get(componentType)!.push(component);

    // 为组件添加变化通知方法
    this.addSyncVarSupport(component, metadata);

    logger.debug(`注册网络组件: ${componentType}，包含 ${metadata.length} 个 SyncVar`);
  }

  /**
   * 注销网络组件
   */
  public unregisterComponent(component: NetworkBehaviour): void {
    const componentType = component.constructor.name;
    const components = this.registeredComponents.get(componentType);
    
    if (components) {
      const index = components.indexOf(component);
      if (index !== -1) {
        components.splice(index, 1);
      }
      
      if (components.length === 0) {
        this.registeredComponents.delete(componentType);
      }
    }

    logger.debug(`注销网络组件: ${componentType}`);
  }

  /**
   * 处理收到的 SyncVar 消息
   */
  public handleSyncVarMessage(message: SyncVarMessage): void {
    const components = this.registeredComponents.get(message.componentType);
    if (!components) {
      logger.warn(`收到未知组件类型的 SyncVar 消息: ${message.componentType}`);
      return;
    }

    // 找到对应的网络对象
    const targetComponent = components.find(c => c.networkId === message.networkId);
    if (!targetComponent) {
      logger.warn(`找不到网络ID为 ${message.networkId} 的组件: ${message.componentType}`);
      return;
    }

    // 应用同步值
    this.applySyncVar(targetComponent, message.propertyName, message.value);
  }

  /**
   * 获取待发送的 SyncVar 消息
   */
  public getPendingMessages(): SyncVarMessage[] {
    const messages: SyncVarMessage[] = [];

    for (const change of this.pendingChanges) {
      messages.push({
        type: 'syncvar',
        networkId: change.networkId,
        componentType: change.componentType,
        propertyName: change.propertyName,
        value: change.newValue,
        data: change.newValue,
        timestamp: change.timestamp
      });
    }

    // 清空待同步列表
    this.pendingChanges.length = 0;
    return messages;
  }

  /**
   * 为网络组件添加 SyncVar 支持
   */
  private addSyncVarSupport(component: NetworkBehaviour, metadata: SyncVarMetadata[]): void {
    // 添加变化通知方法
    (component as any).notifySyncVarChanged = (propertyName: string, oldValue: any, newValue: any) => {
      this.onSyncVarChanged(component, propertyName, oldValue, newValue, metadata);
    };
  }

  /**
   * 处理 SyncVar 变化
   */
  private onSyncVarChanged(
    component: NetworkBehaviour,
    propertyName: string,
    oldValue: any,
    newValue: any,
    metadata: SyncVarMetadata[]
  ): void {
    // 找到对应的元数据
    const syncVarMeta = metadata.find(m => m.propertyName === propertyName);
    if (!syncVarMeta) {
      return;
    }

    // 权限检查
    if (syncVarMeta.authorityOnly && !component.hasAuthority) {
      logger.warn(`权限不足，无法修改 SyncVar: ${component.constructor.name}.${propertyName}`);
      // 回滚值
      (component as any)[`_${propertyName}`] = oldValue;
      return;
    }

    // 记录变化
    const change: SyncVarChange = {
      networkId: component.networkId,
      componentType: component.constructor.name,
      propertyName,
      oldValue,
      newValue,
      timestamp: Date.now()
    };

    this.pendingChanges.push(change);

    logger.debug(`SyncVar 变化: ${change.componentType}.${propertyName} = ${newValue}`);
  }

  /**
   * 应用同步变量值
   */
  private applySyncVar(component: NetworkBehaviour, propertyName: string, value: any): void {
    try {
      // 直接设置内部值，跳过 setter 的权限检查
      (component as any)[`_${propertyName}`] = value;

      // 获取并调用变化回调
      const metadata = getSyncVarMetadata(component.constructor);
      const syncVarMeta = metadata.find(m => m.propertyName === propertyName);
      
      if (syncVarMeta?.onChanged && typeof (component as any)[syncVarMeta.onChanged] === 'function') {
        (component as any)[syncVarMeta.onChanged](undefined, value);
      }

      logger.debug(`应用 SyncVar: ${component.constructor.name}.${propertyName} = ${value}`);
    } catch (error) {
      logger.error(`应用 SyncVar 失败: ${component.constructor.name}.${propertyName}`, error);
    }
  }

  /**
   * 清理所有待同步变化
   */
  public clearPendingChanges(): void {
    this.pendingChanges.length = 0;
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    return {
      registeredComponents: this.registeredComponents.size,
      pendingChanges: this.pendingChanges.length,
      totalInstances: Array.from(this.registeredComponents.values())
        .reduce((sum, components) => sum + components.length, 0)
    };
  }
}