/**
 * 网络组件基类
 * 
 * 所有需要网络同步功能的组件都应继承此类
 * 提供 SyncVar 和 RPC 功能的基础实现
 */

import { Component } from '@esengine/ecs-framework';
import { INetworkBehaviour } from './types/NetworkTypes';
import { NetworkIdentity } from './NetworkIdentity';
import { NetworkManager } from './NetworkManager';

export abstract class NetworkBehaviour extends Component implements INetworkBehaviour {
  /** 网络身份组件引用 */
  public networkIdentity: NetworkIdentity | null = null;

  /**
   * 是否拥有权威
   * 权威端可以修改带有 authorityOnly 标记的 SyncVar
   */
  public get hasAuthority(): boolean {
    return this.networkIdentity?.hasAuthority || false;
  }

  /**
   * 是否为本地玩家
   */
  public get isLocalPlayer(): boolean {
    return this.networkIdentity?.isLocalPlayer || false;
  }

  /**
   * 是否在服务端运行
   */
  public get isServer(): boolean {
    return NetworkManager.isServer;
  }

  /**
   * 是否在客户端运行
   */
  public get isClient(): boolean {
    return NetworkManager.isClient;
  }

  /**
   * 网络ID
   */
  public get networkId(): number {
    return this.networkIdentity?.networkId || 0;
  }

  /**
   * 组件初始化时自动注册到网络身份
   */
  public start(): void {
    this.registerNetworkBehaviour();
  }

  /**
   * 组件销毁时自动从网络身份注销
   */
  public destroy(): void {
    this.unregisterNetworkBehaviour();
  }

  /**
   * 注册到网络身份组件
   */
  private registerNetworkBehaviour(): void {
    if (!this.entity) return;

    const networkIdentity = this.entity.getComponent?.(NetworkIdentity);
    if (networkIdentity) {
      networkIdentity.addNetworkBehaviour(this);
    }
  }

  /**
   * 从网络身份组件注销
   */
  private unregisterNetworkBehaviour(): void {
    if (this.networkIdentity) {
      this.networkIdentity.removeNetworkBehaviour(this);
    }
  }

  /**
   * 检查权威性
   * 用于验证是否可以执行需要权威的操作
   */
  protected checkAuthority(): boolean {
    if (!this.hasAuthority) {
      console.warn(`[NetworkBehaviour] 操作被拒绝：${this.constructor.name} 没有权威`);
      return false;
    }
    return true;
  }

  /**
   * 发送客户端RPC
   * 只能在服务端调用，向指定客户端或所有客户端发送消息
   */
  protected sendClientRpc(methodName: string, args: any[] = [], targetClient?: number): void {
    if (!this.isServer) {
      console.warn(`[NetworkBehaviour] ClientRpc 只能在服务端调用: ${methodName}`);
      return;
    }

    NetworkManager.instance?.sendClientRpc(
      this.networkId,
      this.constructor.name,
      methodName,
      args,
      targetClient
    );
  }

  /**
   * 发送命令到服务端
   * 只能在客户端调用，向服务端发送命令
   */
  protected sendCommand(methodName: string, args: any[] = []): void {
    if (!this.isClient) {
      console.warn(`[NetworkBehaviour] Command 只能在客户端调用: ${methodName}`);
      return;
    }

    if (!this.hasAuthority) {
      console.warn(`[NetworkBehaviour] Command 需要权威才能调用: ${methodName}`);
      return;
    }

    NetworkManager.instance?.sendCommand(
      this.networkId,
      this.constructor.name,
      methodName,
      args
    );
  }
}