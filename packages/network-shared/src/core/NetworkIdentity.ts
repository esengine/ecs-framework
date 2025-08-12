/**
 * NetworkIdentity 类
 * 
 * 标识网络对象的唯一身份，管理网络组件和权威性
 */

import { Component } from '@esengine/ecs-framework';
import { INetworkObject, INetworkComponent } from '../types/NetworkTypes';
import { NetworkBehaviour } from './NetworkBehaviour';

/**
 * NetworkIdentity 组件
 * 
 * 所有需要网络同步的实体都必须拥有此组件
 */
export class NetworkIdentity extends Component implements INetworkObject {
  /** 网络对象的唯一标识符 */
  public networkId: number = 0;

  /** 所有者客户端ID，0 表示服务端拥有 */
  public ownerId: number = 0;

  /** 是否拥有权威，权威端可以修改 SyncVar 和发送 RPC */
  public hasAuthority: boolean = false;

  /** 是否为本地对象 */
  public isLocal: boolean = false;

  /** 是否为本地玩家对象 */
  public isLocalPlayer: boolean = false;

  /** 预制体名称（用于网络生成） */
  public prefabName: string = '';

  /** 场景对象ID（用于场景中已存在的对象） */
  public sceneId: number = 0;

  /** 挂载的网络组件列表 */
  public networkComponents: INetworkComponent[] = [];

  /** 是否已在网络中生成 */
  public isSpawned: boolean = false;

  /** 可见性距离（用于网络LOD） */
  public visibilityDistance: number = 100;

  /** 网络更新频率覆盖（0 = 使用全局设置） */
  public updateRate: number = 0;

  /** 是否总是相关（不受距离限制） */
  public alwaysRelevant: boolean = false;

  constructor() {
    super();
  }

  /**
   * 组件启动时初始化
   */
  public override onEnabled(): void {
    super.onEnabled();
    this.gatherNetworkComponents();
    this.registerToNetworkManager();
  }

  /**
   * 收集实体上的所有网络组件
   */
  private gatherNetworkComponents(): void {
    if (!this.entity) {
      return;
    }

    // 清空现有列表
    this.networkComponents = [];

    // 获取实体上的所有组件
    // 获取实体上的所有组件，简化类型处理
    const components = (this.entity as any).getComponents();
    
    for (const component of components) {
      if (component instanceof NetworkBehaviour) {
        this.addNetworkComponent(component);
      }
    }
  }

  /**
   * 添加网络组件
   */
  public addNetworkComponent(component: INetworkComponent): void {
    if (this.networkComponents.includes(component)) {
      return;
    }

    this.networkComponents.push(component);
    component.networkObject = this;

    // 如果已经注册到网络，通知网络管理器
    if (this.isSpawned) {
      this.notifyNetworkManager('component-added', {
        networkId: this.networkId,
        componentType: component.componentType,
        component
      });
    }
  }

  /**
   * 移除网络组件
   */
  public removeNetworkComponent(component: INetworkComponent): void {
    const index = this.networkComponents.indexOf(component);
    if (index === -1) {
      return;
    }

    this.networkComponents.splice(index, 1);
    component.networkObject = null;

    // 如果已经注册到网络，通知网络管理器
    if (this.isSpawned) {
      this.notifyNetworkManager('component-removed', {
        networkId: this.networkId,
        componentType: component.componentType,
        component
      });
    }
  }

  /**
   * 设置权威性
   */
  public setAuthority(hasAuthority: boolean, ownerId: number = 0): void {
    const oldAuthority = this.hasAuthority;
    const oldOwner = this.ownerId;

    this.hasAuthority = hasAuthority;
    this.ownerId = ownerId;
    this.isLocal = this.checkIsLocal();

    // 如果权威性发生变化，通知相关系统
    if (oldAuthority !== hasAuthority || oldOwner !== ownerId) {
      this.onAuthorityChanged(oldAuthority, hasAuthority, oldOwner, ownerId);
    }
  }

  /**
   * 设置为本地玩家
   */
  public setAsLocalPlayer(): void {
    this.isLocalPlayer = true;
    this.hasAuthority = true;
    this.isLocal = true;
  }

  /**
   * 检查是否为本地对象
   */
  private checkIsLocal(): boolean {
    const localClientId = this.getLocalClientId();
    return this.ownerId === localClientId;
  }

  /**
   * 获取本地客户端ID
   */
  private getLocalClientId(): number {
    // 这个方法会被具体实现重写
    if (typeof (globalThis as any).NetworkManager !== 'undefined') {
      return (globalThis as any).NetworkManager.getLocalClientId?.() || 0;
    }
    return 0;
  }

  /**
   * 权威性变化处理
   */
  private onAuthorityChanged(
    oldAuthority: boolean, 
    newAuthority: boolean, 
    oldOwner: number, 
    newOwner: number
  ): void {
    // 通知网络管理器
    this.notifyNetworkManager('authority-changed', {
      networkId: this.networkId,
      oldAuthority,
      newAuthority,
      oldOwner,
      newOwner
    });

    // 通知所有网络组件
    for (const component of this.networkComponents) {
      if ('onAuthorityChanged' in component && typeof component.onAuthorityChanged === 'function') {
        component.onAuthorityChanged(newAuthority);
      }
    }
  }

  /**
   * 获取指定类型的网络组件
   */
  public getNetworkComponent<T extends INetworkComponent>(type: new (...args: any[]) => T): T | null {
    return this.networkComponents.find(c => c instanceof type) as T || null;
  }

  /**
   * 获取所有指定类型的网络组件
   */
  public getNetworkComponents<T extends INetworkComponent>(type: new (...args: any[]) => T): T[] {
    return this.networkComponents.filter(c => c instanceof type) as T[];
  }

  /**
   * 序列化网络身份
   */
  public serialize(): any {
    return {
      networkId: this.networkId,
      ownerId: this.ownerId,
      hasAuthority: this.hasAuthority,
      isLocal: this.isLocal,
      isLocalPlayer: this.isLocalPlayer,
      prefabName: this.prefabName,
      sceneId: this.sceneId,
      visibilityDistance: this.visibilityDistance,
      updateRate: this.updateRate,
      alwaysRelevant: this.alwaysRelevant
    };
  }

  /**
   * 反序列化网络身份
   */
  public deserialize(data: any): void {
    this.networkId = data.networkId || 0;
    this.ownerId = data.ownerId || 0;
    this.hasAuthority = data.hasAuthority || false;
    this.isLocal = data.isLocal || false;
    this.isLocalPlayer = data.isLocalPlayer || false;
    this.prefabName = data.prefabName || '';
    this.sceneId = data.sceneId || 0;
    this.visibilityDistance = data.visibilityDistance || 100;
    this.updateRate = data.updateRate || 0;
    this.alwaysRelevant = data.alwaysRelevant || false;
  }

  /**
   * 注册到网络管理器
   */
  private registerToNetworkManager(): void {
    this.notifyNetworkManager('register-network-object', {
      networkIdentity: this,
      networkId: this.networkId,
      components: this.networkComponents
    });
    this.isSpawned = true;
  }

  /**
   * 从网络管理器注销
   */
  private unregisterFromNetworkManager(): void {
    this.notifyNetworkManager('unregister-network-object', {
      networkIdentity: this,
      networkId: this.networkId
    });
    this.isSpawned = false;
  }

  /**
   * 通知网络管理器
   */
  private notifyNetworkManager(eventType: string, data: any): void {
    if (typeof (globalThis as any).NetworkManager !== 'undefined') {
      (globalThis as any).NetworkManager.handleNetworkEvent?.(eventType, data);
    }
  }

  /**
   * 检查对象是否对指定客户端可见
   */
  public isVisibleTo(clientId: number, clientPosition?: { x: number; y: number; z?: number }): boolean {
    // 如果总是相关，则对所有客户端可见
    if (this.alwaysRelevant) {
      return true;
    }

    // 如果没有提供客户端位置，默认可见
    // 简单的可见性检查，暂时不依赖Transform组件
    if (!clientPosition) {
      return true;
    }

    // 基于距离的可见性检查（需要自定义位置获取逻辑）
    const position = { x: 0, y: 0, z: 0 }; // 占位符
    const dx = position.x - clientPosition.x;
    const dy = position.y - clientPosition.y;
    const dz = (position.z || 0) - (clientPosition.z || 0);
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return distance <= this.visibilityDistance;
  }

  /**
   * 组件销毁时的清理
   */
  public destroy(): void {
    // 从网络管理器注销
    if (this.isSpawned) {
      this.unregisterFromNetworkManager();
    }

    // 清理所有网络组件的引用
    for (const component of this.networkComponents) {
      component.networkObject = null;
    }
    this.networkComponents = [];

    // 清理网络资源（基类销毁由框架处理）
  }
}