/**
 * 客户端网络行为基类
 * 
 * 类似Unity Mirror的NetworkBehaviour，提供网络功能
 */

import { Component, Entity } from '@esengine/ecs-framework';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { NetworkClient } from './NetworkClient';
import { NetworkIdentity } from './NetworkIdentity';

/**
 * 客户端网络行为基类
 */
export abstract class ClientNetworkBehaviour extends Component {
  /** 网络标识组件 */
  protected networkIdentity: NetworkIdentity | null = null;
  /** 网络客户端实例 */
  protected networkClient: NetworkClient | null = null;
  
  /**
   * 组件初始化
   */
  initialize(): void {
    
    // 获取网络标识组件
    this.networkIdentity = this.entity.getComponent(NetworkIdentity);
    if (!this.networkIdentity) {
      throw new Error('NetworkBehaviour requires NetworkIdentity component');
    }
    
    // 从全局获取网络客户端实例
    this.networkClient = this.getNetworkClient();
  }

  /**
   * 获取网络客户端实例
   */
  protected getNetworkClient(): NetworkClient | null {
    // 这里需要实现从全局管理器获取客户端实例的逻辑
    // 暂时返回null，在实际使用时需要通过单例模式或依赖注入获取
    return null;
  }

  /**
   * 是否为本地玩家
   */
  get isLocalPlayer(): boolean {
    return this.networkIdentity?.isLocalPlayer ?? false;
  }

  /**
   * 是否为服务器权威
   */
  get hasAuthority(): boolean {
    return this.networkIdentity?.hasAuthority ?? false;
  }

  /**
   * 网络ID
   */
  get networkId(): string {
    return this.networkIdentity?.networkId ?? '';
  }

  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this.networkClient?.isInRoom() ?? false;
  }

  /**
   * 发送RPC到服务器
   */
  protected async sendServerRpc(methodName: string, ...args: NetworkValue[]): Promise<NetworkValue> {
    if (!this.networkClient || !this.networkIdentity) {
      throw new Error('Network client or identity not available');
    }

    return this.networkClient.sendRpc(this.networkIdentity.networkId, methodName, args, true);
  }

  /**
   * 发送不可靠RPC到服务器
   */
  protected async sendServerRpcUnreliable(methodName: string, ...args: NetworkValue[]): Promise<void> {
    if (!this.networkClient || !this.networkIdentity) {
      throw new Error('Network client or identity not available');
    }

    await this.networkClient.sendRpc(this.networkIdentity.networkId, methodName, args, false);
  }

  /**
   * 更新SyncVar
   */
  protected async updateSyncVar(fieldName: string, value: NetworkValue): Promise<void> {
    if (!this.networkClient || !this.networkIdentity) {
      throw new Error('Network client or identity not available');
    }

    await this.networkClient.updateSyncVar(this.networkIdentity.networkId, fieldName, value);
  }

  /**
   * 当收到RPC调用时
   */
  onRpcReceived(methodName: string, args: NetworkValue[]): void {
    // 尝试调用对应的方法
    const method = (this as any)[methodName];
    if (typeof method === 'function') {
      try {
        method.apply(this, args);
      } catch (error) {
        console.error(`Error calling RPC method ${methodName}:`, error);
      }
    } else {
      console.warn(`RPC method ${methodName} not found on ${this.constructor.name}`);
    }
  }

  /**
   * 当SyncVar更新时
   */
  onSyncVarChanged(fieldName: string, oldValue: NetworkValue, newValue: NetworkValue): void {
    // 子类可以重写此方法来处理SyncVar变化
  }

  /**
   * 当获得权威时
   */
  onStartAuthority(): void {
    // 子类可以重写此方法
  }

  /**
   * 当失去权威时
   */
  onStopAuthority(): void {
    // 子类可以重写此方法
  }

  /**
   * 当成为本地玩家时
   */
  onStartLocalPlayer(): void {
    // 子类可以重写此方法
  }

  /**
   * 当不再是本地玩家时
   */
  onStopLocalPlayer(): void {
    // 子类可以重写此方法
  }

  /**
   * 网络启动时调用
   */
  onNetworkStart(): void {
    // 子类可以重写此方法
  }

  /**
   * 网络停止时调用
   */
  onNetworkStop(): void {
    // 子类可以重写此方法
  }

  /**
   * 组件销毁
   */
  onDestroy(): void {
    this.networkIdentity = null;
    this.networkClient = null;
  }
}