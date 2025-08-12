/**
 * 客户端网络标识组件
 * 
 * 标识网络对象并管理其状态
 */

import { Component, Entity } from '@esengine/ecs-framework';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { ClientNetworkBehaviour } from './ClientNetworkBehaviour';

/**
 * 网络权威类型
 */
export enum NetworkAuthority {
  /** 服务器权威 */
  SERVER = 'server',
  /** 客户端权威 */
  CLIENT = 'client',
  /** 所有者权威 */
  OWNER = 'owner'
}

/**
 * SyncVar信息
 */
export interface SyncVarInfo {
  /** 字段名 */
  fieldName: string;
  /** 当前值 */
  currentValue: NetworkValue;
  /** 上一个值 */
  previousValue: NetworkValue;
  /** 最后更新时间 */
  lastUpdateTime: number;
  /** 是否已变更 */
  isDirty: boolean;
}

/**
 * 网络标识组件
 */
export class NetworkIdentity extends Component {
  /** 网络ID */
  private _networkId: string = '';
  /** 所有者用户ID */
  private _ownerId: string = '';
  /** 是否为本地玩家 */
  private _isLocalPlayer: boolean = false;
  /** 权威类型 */
  private _authority: NetworkAuthority = NetworkAuthority.SERVER;
  /** 是否有权威 */
  private _hasAuthority: boolean = false;
  /** 网络行为组件列表 */
  private networkBehaviours: ClientNetworkBehaviour[] = [];
  /** SyncVar信息映射 */
  private syncVars: Map<string, SyncVarInfo> = new Map();
  /** 预测状态 */
  private predictionEnabled: boolean = false;
  /** 插值状态 */
  private interpolationEnabled: boolean = true;

  /**
   * 网络ID
   */
  get networkId(): string {
    return this._networkId;
  }

  set networkId(value: string) {
    this._networkId = value;
  }

  /**
   * 所有者用户ID
   */
  get ownerId(): string {
    return this._ownerId;
  }

  set ownerId(value: string) {
    this._ownerId = value;
  }

  /**
   * 是否为本地玩家
   */
  get isLocalPlayer(): boolean {
    return this._isLocalPlayer;
  }

  set isLocalPlayer(value: boolean) {
    if (this._isLocalPlayer !== value) {
      this._isLocalPlayer = value;
      this.notifyLocalPlayerChanged();
    }
  }

  /**
   * 权威类型
   */
  get authority(): NetworkAuthority {
    return this._authority;
  }

  set authority(value: NetworkAuthority) {
    if (this._authority !== value) {
      this._authority = value;
      this.updateAuthorityStatus();
    }
  }

  /**
   * 是否有权威
   */
  get hasAuthority(): boolean {
    return this._hasAuthority;
  }

  /**
   * 是否启用预测
   */
  get isPredictionEnabled(): boolean {
    return this.predictionEnabled;
  }

  set isPredictionEnabled(value: boolean) {
    this.predictionEnabled = value;
  }

  /**
   * 是否启用插值
   */
  get isInterpolationEnabled(): boolean {
    return this.interpolationEnabled;
  }

  set isInterpolationEnabled(value: boolean) {
    this.interpolationEnabled = value;
  }

  /**
   * 组件初始化
   */
  initialize(): void {
    this.collectNetworkBehaviours();
    this.notifyNetworkStart();
  }

  /**
   * 收集网络行为组件
   */
  private collectNetworkBehaviours(): void {
    // 暂时留空，等待实际集成时实现
    this.networkBehaviours = [];
  }

  /**
   * 更新权威状态
   */
  private updateAuthorityStatus(): void {
    const oldHasAuthority = this._hasAuthority;
    
    // 根据权威类型计算是否有权威
    switch (this._authority) {
      case NetworkAuthority.SERVER:
        this._hasAuthority = false; // 客户端永远没有服务器权威
        break;
      case NetworkAuthority.CLIENT:
        this._hasAuthority = true; // 客户端权威
        break;
      case NetworkAuthority.OWNER:
        this._hasAuthority = this._isLocalPlayer; // 本地玩家才有权威
        break;
    }

    // 通知权威变化
    if (oldHasAuthority !== this._hasAuthority) {
      this.notifyAuthorityChanged();
    }
  }

  /**
   * 通知权威变化
   */
  private notifyAuthorityChanged(): void {
    this.networkBehaviours.forEach(behaviour => {
      if (this._hasAuthority) {
        behaviour.onStartAuthority();
      } else {
        behaviour.onStopAuthority();
      }
    });
  }

  /**
   * 通知本地玩家状态变化
   */
  private notifyLocalPlayerChanged(): void {
    this.updateAuthorityStatus(); // 本地玩家状态影响权威
    
    this.networkBehaviours.forEach(behaviour => {
      if (this._isLocalPlayer) {
        behaviour.onStartLocalPlayer();
      } else {
        behaviour.onStopLocalPlayer();
      }
    });
  }

  /**
   * 通知网络启动
   */
  private notifyNetworkStart(): void {
    this.networkBehaviours.forEach(behaviour => {
      behaviour.onNetworkStart();
    });
  }

  /**
   * 通知网络停止
   */
  private notifyNetworkStop(): void {
    this.networkBehaviours.forEach(behaviour => {
      behaviour.onNetworkStop();
    });
  }

  /**
   * 处理RPC调用
   */
  handleRpcCall(methodName: string, args: NetworkValue[]): void {
    // 将RPC调用分发给所有网络行为组件
    this.networkBehaviours.forEach(behaviour => {
      behaviour.onRpcReceived(methodName, args);
    });
  }

  /**
   * 注册SyncVar
   */
  registerSyncVar(fieldName: string, initialValue: NetworkValue): void {
    this.syncVars.set(fieldName, {
      fieldName,
      currentValue: initialValue,
      previousValue: initialValue,
      lastUpdateTime: Date.now(),
      isDirty: false
    });
  }

  /**
   * 更新SyncVar
   */
  updateSyncVar(fieldName: string, newValue: NetworkValue): void {
    const syncVar = this.syncVars.get(fieldName);
    if (!syncVar) {
      console.warn(`SyncVar ${fieldName} not registered on ${this._networkId}`);
      return;
    }

    const oldValue = syncVar.currentValue;
    syncVar.previousValue = oldValue;
    syncVar.currentValue = newValue;
    syncVar.lastUpdateTime = Date.now();
    syncVar.isDirty = true;

    // 通知所有网络行为组件
    this.networkBehaviours.forEach(behaviour => {
      behaviour.onSyncVarChanged(fieldName, oldValue, newValue);
    });
  }

  /**
   * 获取SyncVar值
   */
  getSyncVar(fieldName: string): NetworkValue | undefined {
    return this.syncVars.get(fieldName)?.currentValue;
  }

  /**
   * 获取所有SyncVar
   */
  getAllSyncVars(): Map<string, SyncVarInfo> {
    return new Map(this.syncVars);
  }

  /**
   * 获取脏SyncVar
   */
  getDirtySyncVars(): SyncVarInfo[] {
    return Array.from(this.syncVars.values()).filter(syncVar => syncVar.isDirty);
  }

  /**
   * 清除脏标记
   */
  clearDirtyFlags(): void {
    this.syncVars.forEach(syncVar => {
      syncVar.isDirty = false;
    });
  }

  /**
   * 序列化网络状态
   */
  serializeState(): NetworkValue {
    const state: any = {
      networkId: this._networkId,
      ownerId: this._ownerId,
      isLocalPlayer: this._isLocalPlayer,
      authority: this._authority,
      syncVars: {}
    };

    // 序列化SyncVar
    this.syncVars.forEach((syncVar, fieldName) => {
      state.syncVars[fieldName] = syncVar.currentValue;
    });

    return state;
  }

  /**
   * 反序列化网络状态
   */
  deserializeState(state: any): void {
    if (state.networkId) this._networkId = state.networkId;
    if (state.ownerId) this._ownerId = state.ownerId;
    if (typeof state.isLocalPlayer === 'boolean') this.isLocalPlayer = state.isLocalPlayer;
    if (state.authority) this.authority = state.authority;

    // 反序列化SyncVar
    if (state.syncVars) {
      Object.entries(state.syncVars).forEach(([fieldName, value]) => {
        if (this.syncVars.has(fieldName)) {
          this.updateSyncVar(fieldName, value as NetworkValue);
        }
      });
    }
  }

  /**
   * 设置预测状态
   */
  setPredictionState(enabled: boolean): void {
    this.predictionEnabled = enabled;
  }

  /**
   * 设置插值状态
   */
  setInterpolationState(enabled: boolean): void {
    this.interpolationEnabled = enabled;
  }

  /**
   * 检查是否可以发送RPC
   */
  canSendRpc(): boolean {
    return this._hasAuthority || this._isLocalPlayer;
  }

  /**
   * 检查是否可以更新SyncVar
   */
  canUpdateSyncVar(): boolean {
    return this._hasAuthority;
  }

  /**
   * 组件销毁
   */
  onDestroy(): void {
    this.notifyNetworkStop();
    this.networkBehaviours = [];
    this.syncVars.clear();
  }
}