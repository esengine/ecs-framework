/**
 * 网络身份组件
 */
import { Component, Emitter } from '@esengine/ecs-framework';
import { AuthorityType, NetworkScope } from '../types/NetworkTypes';
import { 
  NetworkEventType, 
  NetworkIdentityEventData, 
  NetworkEventUtils 
} from '../events/NetworkEvents';

/**
 * 网络身份组件
 * 
 * 为实体提供网络同步能力的核心组件。
 * 每个需要网络同步的实体都必须拥有此组件。
 * 
 * 集成了事件系统，当属性变化时自动发射事件用于网络同步。
 */
export class NetworkIdentity extends Component {
  /**
   * 事件发射器
   * 用于发射网络相关事件
   */
  private eventEmitter = new Emitter<NetworkEventType, NetworkIdentity>();
  /**
   * 网络ID (全局唯一)
   * 用于在网络中标识实体
   */
  public networkId: number = 0;

  /**
   * 拥有者ID
   * 表示哪个客户端拥有此实体的控制权
   */
  public ownerId: string = '';

  /**
   * 权限类型
   * 决定哪一端对此实体有控制权
   */
  public authority: AuthorityType = AuthorityType.Server;

  /**
   * 同步频率 (Hz)
   * 每秒同步的次数
   */
  public syncRate: number = 20;

  /**
   * 网络作用域
   * 决定哪些客户端可以看到此实体
   */
  public scope: NetworkScope = NetworkScope.Room;

  /**
   * 是否是本地玩家
   * 标识此实体是否代表本地玩家
   */
  public isLocalPlayer: boolean = false;

  /**
   * 是否启用网络同步
   * 临时禁用/启用同步
   */
  public syncEnabled: boolean = true;

  /**
   * 同步优先级
   * 影响同步的顺序和频率，数值越高优先级越高
   */
  public priority: number = 0;

  /**
   * 距离阈值
   * 用于附近同步模式，超过此距离的客户端不会收到同步
   */
  public distanceThreshold: number = 100;

  /**
   * 最后同步时间
   * 记录上次同步的时间戳
   */
  public lastSyncTime: number = 0;

  /**
   * 是否可见
   * 控制实体是否对其他客户端可见
   */
  public visible: boolean = true;

  /**
   * 自定义同步过滤器
   * 用于自定义作用域的同步逻辑
   */
  public customSyncFilter?: (clientId: string) => boolean;

  /**
   * 获取实体的同步权重
   * 基于优先级和距离计算
   */
  public getSyncWeight(distance?: number): number {
    let weight = this.priority;
    
    if (distance !== undefined && this.scope === NetworkScope.Nearby) {
      // 距离越近权重越高
      const distanceFactor = Math.max(0, 1 - (distance / this.distanceThreshold));
      weight *= distanceFactor;
    }
    
    return weight;
  }

  /**
   * 检查是否应该同步给指定客户端
   */
  public shouldSyncToClient(clientId: string, distance?: number): boolean {
    if (!this.syncEnabled || !this.visible) {
      return false;
    }

    switch (this.scope) {
      case NetworkScope.Global:
        return true;
      
      case NetworkScope.Room:
        return true; // 由房间管理器控制
      
      case NetworkScope.Owner:
        return clientId === this.ownerId;
      
      case NetworkScope.Nearby:
        return distance !== undefined && distance <= this.distanceThreshold;
      
      case NetworkScope.Custom:
        return this.customSyncFilter ? this.customSyncFilter(clientId) : false;
      
      default:
        return false;
    }
  }

  /**
   * 检查客户端是否有权限修改此实体
   */
  public hasAuthority(clientId: string): boolean {
    switch (this.authority) {
      case AuthorityType.Server:
        return false; // 只有服务端有权限
      
      case AuthorityType.Client:
        return clientId === this.ownerId;
      
      case AuthorityType.Shared:
        return true; // 任何人都可以修改
      
      default:
        return false;
    }
  }

  /**
   * 设置拥有者
   */
  public setOwner(clientId: string): void {
    const oldOwner = this.ownerId;
    this.ownerId = clientId;
    
    // 发射拥有者变化事件
    this.emitEvent(
      NetworkEventType.IDENTITY_OWNER_CHANGED, 
      NetworkEventUtils.createIdentityEventData(
        this.networkId,
        clientId,
        oldOwner,
        clientId
      )
    );
  }

  /**
   * 设置权限类型
   */
  public setAuthority(authority: AuthorityType): void {
    const oldAuthority = this.authority;
    this.authority = authority;
    
    // 发射权限变化事件
    this.emitEvent(
      NetworkEventType.IDENTITY_AUTHORITY_CHANGED, 
      NetworkEventUtils.createIdentityEventData(
        this.networkId,
        this.ownerId,
        oldAuthority,
        authority
      )
    );
  }

  /**
   * 设置同步状态
   */
  public setSyncEnabled(enabled: boolean): void {
    const oldEnabled = this.syncEnabled;
    this.syncEnabled = enabled;
    
    // 发射同步状态变化事件
    const eventType = enabled 
      ? NetworkEventType.IDENTITY_SYNC_ENABLED 
      : NetworkEventType.IDENTITY_SYNC_DISABLED;
      
    this.emitEvent(
      eventType, 
      NetworkEventUtils.createIdentityEventData(
        this.networkId,
        this.ownerId,
        oldEnabled,
        enabled
      )
    );
  }

  /**
   * 设置同步频率
   */
  public setSyncRate(rate: number): void {
    const oldRate = this.syncRate;
    this.syncRate = rate;
    
    // 发射同步频率变化事件
    this.emitEvent(
      NetworkEventType.SYNC_RATE_CHANGED, 
      NetworkEventUtils.createIdentityEventData(
        this.networkId,
        this.ownerId,
        oldRate,
        rate
      )
    );
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(eventType: NetworkEventType, handler: (data: NetworkIdentityEventData) => void): void {
    this.eventEmitter.addObserver(eventType, handler, this);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(eventType: NetworkEventType, handler: (data: NetworkIdentityEventData) => void): void {
    this.eventEmitter.removeObserver(eventType, handler);
  }

  /**
   * 发射事件
   * @private
   */
  private emitEvent(eventType: NetworkEventType, data: NetworkIdentityEventData): void {
    this.eventEmitter.emit(eventType, data);
  }

  /**
   * 监听属性变化事件
   */
  public onPropertyChanged(handler: (data: NetworkIdentityEventData) => void): void {
    this.addEventListener(NetworkEventType.IDENTITY_PROPERTY_CHANGED, handler);
  }

  /**
   * 监听拥有者变化事件
   */
  public onOwnerChanged(handler: (data: NetworkIdentityEventData) => void): void {
    this.addEventListener(NetworkEventType.IDENTITY_OWNER_CHANGED, handler);
  }

  /**
   * 监听权限变化事件
   */
  public onAuthorityChanged(handler: (data: NetworkIdentityEventData) => void): void {
    this.addEventListener(NetworkEventType.IDENTITY_AUTHORITY_CHANGED, handler);
  }

  /**
   * 监听同步状态变化事件
   */
  public onSyncStateChanged(handler: (data: NetworkIdentityEventData) => void): void {
    this.addEventListener(NetworkEventType.IDENTITY_SYNC_ENABLED, handler);
    this.addEventListener(NetworkEventType.IDENTITY_SYNC_DISABLED, handler);
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): Record<string, any> {
    return {
      networkId: this.networkId,
      ownerId: this.ownerId,
      authority: this.authority,
      scope: this.scope,
      syncRate: this.syncRate,
      priority: this.priority,
      syncEnabled: this.syncEnabled,
      visible: this.visible,
      lastSyncTime: this.lastSyncTime
    };
  }

  /**
   * 组件销毁时清理事件监听器
   */
  public dispose(): void {
    // 清理所有事件监听器
    this.eventEmitter.dispose();
  }
}