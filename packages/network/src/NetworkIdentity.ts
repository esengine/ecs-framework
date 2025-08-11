/**
 * 网络身份组件
 * 
 * 标识网络对象的唯一身份，管理网络组件和权威性
 * 所有需要网络同步的实体都必须拥有此组件
 */

import { Component } from '@esengine/ecs-framework';
import { INetworkBehaviour } from './Types/NetworkTypes';

export class NetworkIdentity extends Component {
  /** 网络对象的唯一标识符 */
  public networkId: number = 0;

  /** 所有者客户端ID，0 表示服务端拥有 */
  public ownerId: number = 0;

  /** 是否拥有权威，权威端可以修改 SyncVar 和发送 RPC */
  public hasAuthority: boolean = false;

  /** 是否为本地玩家对象 */
  public isLocalPlayer: boolean = false;

  /** 挂载的网络组件列表 */
  public networkBehaviours: INetworkBehaviour[] = [];

  /**
   * 添加网络组件
   * @param behaviour 要添加的网络组件
   */
  public addNetworkBehaviour(behaviour: INetworkBehaviour): void {
    if (this.networkBehaviours.includes(behaviour)) {
      return; // 已经添加过了
    }

    this.networkBehaviours.push(behaviour);
    behaviour.networkIdentity = this;
  }

  /**
   * 移除网络组件
   * @param behaviour 要移除的网络组件
   */
  public removeNetworkBehaviour(behaviour: INetworkBehaviour): void {
    const index = this.networkBehaviours.indexOf(behaviour);
    if (index !== -1) {
      this.networkBehaviours.splice(index, 1);
      behaviour.networkIdentity = null;
    }
  }

  /**
   * 设置权威性
   * @param hasAuthority 是否拥有权威
   * @param ownerId 所有者客户端ID
   */
  public setAuthority(hasAuthority: boolean, ownerId: number = 0): void {
    this.hasAuthority = hasAuthority;
    this.ownerId = ownerId;
  }

  /**
   * 设置为本地玩家
   */
  public setAsLocalPlayer(): void {
    this.isLocalPlayer = true;
    this.hasAuthority = true;
  }

  /**
   * 获取指定类型的网络组件
   */
  public getNetworkBehaviour<T extends INetworkBehaviour>(type: new (...args: any[]) => T): T | null {
    return this.networkBehaviours.find(b => b instanceof type) as T || null;
  }

  /**
   * 获取所有指定类型的网络组件
   */
  public getNetworkBehaviours<T extends INetworkBehaviour>(type: new (...args: any[]) => T): T[] {
    return this.networkBehaviours.filter(b => b instanceof type) as T[];
  }

  /**
   * 组件启动时的处理
   */
  public start(): void {
    // 如果没有分配网络ID，从网络管理器获取
    if (this.networkId === 0) {
      // 这里需要从 NetworkManager 获取新的网络ID
      // 实现延后到 NetworkManager 完成
    }
  }

  /**
   * 组件销毁时的清理
   */
  public destroy(): void {
    // 清理所有网络组件的引用
    this.networkBehaviours.forEach(behaviour => {
      behaviour.networkIdentity = null;
    });
    this.networkBehaviours.length = 0;
  }
}