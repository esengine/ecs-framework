/**
 * NetworkBehaviour 基类
 * 
 * 所有网络组件的基类，提供网络功能的基础实现
 */

import { Component } from '@esengine/ecs-framework';
import { INetworkComponent, INetworkObject, SyncVarMetadata, RpcMetadata, Constructor } from '../types/NetworkTypes';
import { getSyncVarMetadata, getDirtySyncVars, clearAllDirtySyncVars } from '../decorators/SyncVar';
import { getClientRpcMetadata } from '../decorators/ClientRpc';
import { getServerRpcMetadata } from '../decorators/ServerRpc';

/**
 * NetworkBehaviour 基类
 * 
 * 提供网络组件的基础功能：
 * - SyncVar 支持
 * - RPC 调用支持
 * - 网络身份管理
 * - 权限控制
 */
export abstract class NetworkBehaviour extends Component implements INetworkComponent {
  /** 索引签名以支持动态属性访问 */
  [key: string]: unknown;
  
  /** 网络对象引用 */
  public networkObject: INetworkObject | null = null;
  
  /** 网络ID */
  public get networkId(): number {
    return this.networkObject?.networkId || 0;
  }
  
  /** 是否拥有权威 */
  public get hasAuthority(): boolean {
    return this.networkObject?.hasAuthority || false;
  }
  
  /** 组件类型名 */
  public get componentType(): string {
    return this.constructor.name;
  }
  
  /** 是否为服务端 */
  public get isServer(): boolean {
    // 这个方法会被具体的客户端/服务端库重写
    return false;
  }
  
  /** 是否为客户端 */
  public get isClient(): boolean {
    // 这个方法会被具体的客户端/服务端库重写
    return false;
  }
  
  /** 是否为本地对象 */
  public get isLocal(): boolean {
    return this.networkObject?.isLocal || false;
  }

  /** 所有者客户端ID */
  public get ownerId(): number {
    return this.networkObject?.ownerId || 0;
  }

  constructor() {
    super();
    this.setupSyncVarNotification();
  }

  /**
   * 设置 SyncVar 变化通知
   */
  private setupSyncVarNotification(): void {
    // 添加 SyncVar 变化通知方法
    (this as any).notifySyncVarChanged = (
      propertyName: string, 
      oldValue: any, 
      newValue: any, 
      metadata: SyncVarMetadata
    ) => {
      this.onSyncVarChanged(propertyName, oldValue, newValue, metadata);
    };
  }

  /**
   * SyncVar 变化处理
   */
  protected onSyncVarChanged(
    propertyName: string, 
    oldValue: any, 
    newValue: any, 
    metadata: SyncVarMetadata
  ): void {
    // 权限检查
    if (metadata.authorityOnly && !this.hasAuthority) {
      console.warn(`Authority required for SyncVar: ${this.componentType}.${propertyName}`);
      return;
    }

    // 通知网络管理器
    this.notifyNetworkManager('syncvar-changed', {
      networkId: this.networkId,
      componentType: this.componentType,
      propertyName,
      oldValue,
      newValue,
      metadata
    });
  }

  /**
   * 发送客户端 RPC
   */
  protected sendClientRpc(methodName: string, args: any[], options?: any, metadata?: RpcMetadata): any {
    if (!this.hasAuthority && !this.isServer) {
      console.warn(`Authority required for ClientRpc: ${this.componentType}.${methodName}`);
      return;
    }

    return this.notifyNetworkManager('client-rpc', {
      networkId: this.networkId,
      componentType: this.componentType,
      methodName,
      args,
      options,
      metadata
    });
  }

  /**
   * 发送服务端 RPC
   */
  protected sendServerRpc(methodName: string, args: any[], options?: any, metadata?: RpcMetadata): any {
    if (!this.isClient) {
      console.warn(`ServerRpc can only be called from client: ${this.componentType}.${methodName}`);
      return;
    }

    return this.notifyNetworkManager('server-rpc', {
      networkId: this.networkId,
      componentType: this.componentType,
      methodName,
      args,
      options,
      metadata
    });
  }

  /**
   * 通知网络管理器
   */
  private notifyNetworkManager(eventType: string, data: any): any {
    // 这个方法会被具体的客户端/服务端库重写
    // 用于与网络管理器通信
    if (typeof (globalThis as any).NetworkManager !== 'undefined') {
      return (globalThis as any).NetworkManager.handleNetworkEvent?.(eventType, data);
    }
    
    console.warn(`NetworkManager not found for event: ${eventType}`);
    return null;
  }

  /**
   * 获取所有 SyncVar 元数据
   */
  public getSyncVars(): SyncVarMetadata[] {
    return getSyncVarMetadata(this.constructor as Constructor);
  }

  /**
   * 获取所有客户端 RPC 元数据
   */
  public getClientRpcs(): RpcMetadata[] {
    return getClientRpcMetadata(this.constructor as Constructor);
  }

  /**
   * 获取所有服务端 RPC 元数据
   */
  public getServerRpcs(): RpcMetadata[] {
    return getServerRpcMetadata(this.constructor as Constructor);
  }

  /**
   * 获取所有脏的 SyncVar
   */
  public getDirtySyncVars() {
    return getDirtySyncVars(this);
  }

  /**
   * 清除所有脏标记
   */
  public clearDirtySyncVars(): void {
    clearAllDirtySyncVars(this);
  }

  /**
   * 序列化组件状态
   */
  public serializeState(): any {
    const syncVars = this.getSyncVars();
    const state: any = {};

    for (const syncVar of syncVars) {
      const value = (this as any)[`_${syncVar.propertyName}`];
      if (value !== undefined) {
        state[syncVar.propertyName] = value;
      }
    }

    return state;
  }

  /**
   * 反序列化组件状态
   */
  public deserializeState(state: any): void {
    const syncVars = this.getSyncVars();

    for (const syncVar of syncVars) {
      if (state.hasOwnProperty(syncVar.propertyName)) {
        // 直接设置内部值，跳过权限检查
        (this as any)[`_${syncVar.propertyName}`] = state[syncVar.propertyName];
        
        // 调用变化回调
        if (syncVar.onChanged && typeof (this as any)[syncVar.onChanged] === 'function') {
          (this as any)[syncVar.onChanged](undefined, state[syncVar.propertyName]);
        }
      }
    }
  }

  /**
   * 检查是否有权限执行操作
   */
  protected checkAuthority(requiresOwnership = false): boolean {
    if (requiresOwnership && this.ownerId !== this.getLocalClientId()) {
      return false;
    }
    
    return this.hasAuthority;
  }

  /**
   * 获取本地客户端ID
   * 这个方法会被具体实现重写
   */
  protected getLocalClientId(): number {
    return 0;
  }

  /**
   * 组件销毁时的清理
   */
  public onDestroy(): void {
    this.networkObject = null;
    // 清理网络资源（基类销毁由框架处理）
  }
}