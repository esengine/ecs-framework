/**
 * 客户端连接管理
 */

import { EventEmitter } from 'events';
import { NetworkValue, NetworkMessage } from '@esengine/ecs-framework-network-shared';
import { TransportMessage } from './Transport';

/**
 * 客户端连接状态
 */
export enum ClientConnectionState {
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 认证中 */
  AUTHENTICATING = 'authenticating',
  /** 已认证 */
  AUTHENTICATED = 'authenticated',
  /** 断开连接中 */
  DISCONNECTING = 'disconnecting',
  /** 已断开 */
  DISCONNECTED = 'disconnected',
  /** 错误状态 */
  ERROR = 'error'
}

/**
 * 客户端权限
 */
export interface ClientPermissions {
  /** 是否可以加入房间 */
  canJoinRooms?: boolean;
  /** 是否可以创建房间 */
  canCreateRooms?: boolean;
  /** 是否可以发送RPC */
  canSendRpc?: boolean;
  /** 是否可以同步变量 */
  canSyncVars?: boolean;
  /** 自定义权限 */
  customPermissions?: Record<string, boolean>;
}

/**
 * 客户端连接事件
 */
export interface ClientConnectionEvents {
  /** 状态变化 */
  'state-changed': (oldState: ClientConnectionState, newState: ClientConnectionState) => void;
  /** 收到消息 */
  'message': (message: TransportMessage) => void;
  /** 连接错误 */
  'error': (error: Error) => void;
  /** 连接超时 */
  'timeout': () => void;
  /** 身份验证成功 */
  'authenticated': (userData: Record<string, NetworkValue>) => void;
  /** 身份验证失败 */
  'authentication-failed': (reason: string) => void;
}

/**
 * 客户端统计信息
 */
export interface ClientStats {
  /** 消息发送数 */
  messagesSent: number;
  /** 消息接收数 */
  messagesReceived: number;
  /** 字节发送数 */
  bytesSent: number;
  /** 字节接收数 */
  bytesReceived: number;
  /** 最后活跃时间 */
  lastActivity: Date;
  /** 连接时长(毫秒) */
  connectionDuration: number;
}

/**
 * 客户端连接管理类
 */
export class ClientConnection extends EventEmitter {
  /** 连接ID */
  public readonly id: string;
  
  /** 客户端IP地址 */
  public readonly remoteAddress: string;
  
  /** 连接创建时间 */
  public readonly connectedAt: Date;
  
  /** 当前状态 */
  private _state: ClientConnectionState = ClientConnectionState.CONNECTING;
  
  /** 用户数据 */
  private _userData: Record<string, NetworkValue> = {};
  
  /** 权限信息 */
  private _permissions: ClientPermissions = {};
  
  /** 所在房间ID */
  private _currentRoomId: string | null = null;
  
  /** 统计信息 */
  private _stats: ClientStats;
  
  /** 最后活跃时间 */
  private _lastActivity: Date;
  
  /** 超时定时器 */
  private _timeoutTimer: NodeJS.Timeout | null = null;
  
  /** 连接超时时间(毫秒) */
  private _connectionTimeout: number;
  
  /** 发送消息回调 */
  private _sendMessageCallback: (message: TransportMessage) => Promise<boolean>;

  constructor(
    id: string,
    remoteAddress: string,
    sendMessageCallback: (message: TransportMessage) => Promise<boolean>,
    options: {
      connectionTimeout?: number;
      userData?: Record<string, NetworkValue>;
      permissions?: ClientPermissions;
    } = {}
  ) {
    super();
    
    this.id = id;
    this.remoteAddress = remoteAddress;
    this.connectedAt = new Date();
    this._lastActivity = new Date();
    this._connectionTimeout = options.connectionTimeout || 60000; // 1分钟
    this._sendMessageCallback = sendMessageCallback;
    
    if (options.userData) {
      this._userData = { ...options.userData };
    }
    
    if (options.permissions) {
      this._permissions = { ...options.permissions };
    }
    
    this._stats = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      lastActivity: this._lastActivity,
      connectionDuration: 0
    };
    
    this.setState(ClientConnectionState.CONNECTED);
    this.startTimeout();
  }

  /**
   * 获取当前状态
   */
  get state(): ClientConnectionState {
    return this._state;
  }

  /**
   * 获取用户数据
   */
  get userData(): Readonly<Record<string, NetworkValue>> {
    return this._userData;
  }

  /**
   * 获取权限信息
   */
  get permissions(): Readonly<ClientPermissions> {
    return this._permissions;
  }

  /**
   * 获取当前房间ID
   */
  get currentRoomId(): string | null {
    return this._currentRoomId;
  }

  /**
   * 获取统计信息
   */
  get stats(): Readonly<ClientStats> {
    this._stats.connectionDuration = Date.now() - this.connectedAt.getTime();
    this._stats.lastActivity = this._lastActivity;
    return this._stats;
  }

  /**
   * 获取最后活跃时间
   */
  get lastActivity(): Date {
    return this._lastActivity;
  }

  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this._state === ClientConnectionState.CONNECTED || 
           this._state === ClientConnectionState.AUTHENTICATED;
  }

  /**
   * 是否已认证
   */
  get isAuthenticated(): boolean {
    return this._state === ClientConnectionState.AUTHENTICATED;
  }

  /**
   * 发送消息
   */
  async sendMessage(message: TransportMessage): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const success = await this._sendMessageCallback(message);
      if (success) {
        this._stats.messagesSent++;
        const messageSize = JSON.stringify(message).length;
        this._stats.bytesSent += messageSize;
        this.updateActivity();
      }
      return success;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(message: TransportMessage): void {
    if (!this.isConnected) {
      return;
    }

    this._stats.messagesReceived++;
    const messageSize = JSON.stringify(message).length;
    this._stats.bytesReceived += messageSize;
    this.updateActivity();
    
    this.emit('message', message);
  }

  /**
   * 设置用户数据
   */
  setUserData(key: string, value: NetworkValue): void {
    this._userData[key] = value;
  }

  /**
   * 获取用户数据
   */
  getUserData<T extends NetworkValue = NetworkValue>(key: string): T | undefined {
    return this._userData[key] as T;
  }

  /**
   * 批量设置用户数据
   */
  setUserDataBatch(data: Record<string, NetworkValue>): void {
    Object.assign(this._userData, data);
  }

  /**
   * 设置权限
   */
  setPermission(permission: keyof ClientPermissions, value: boolean): void {
    (this._permissions as any)[permission] = value;
  }

  /**
   * 检查权限
   */
  hasPermission(permission: keyof ClientPermissions): boolean {
    return (this._permissions as any)[permission] || false;
  }

  /**
   * 设置自定义权限
   */
  setCustomPermission(permission: string, value: boolean): void {
    if (!this._permissions.customPermissions) {
      this._permissions.customPermissions = {};
    }
    this._permissions.customPermissions[permission] = value;
  }

  /**
   * 检查自定义权限
   */
  hasCustomPermission(permission: string): boolean {
    return this._permissions.customPermissions?.[permission] || false;
  }

  /**
   * 进行身份认证
   */
  async authenticate(credentials: Record<string, NetworkValue>): Promise<boolean> {
    if (this._state !== ClientConnectionState.CONNECTED) {
      return false;
    }

    this.setState(ClientConnectionState.AUTHENTICATING);

    try {
      // 这里可以添加实际的认证逻辑
      // 目前简单地认为所有认证都成功
      
      this.setUserDataBatch(credentials);
      this.setState(ClientConnectionState.AUTHENTICATED);
      this.emit('authenticated', credentials);
      
      return true;
    } catch (error) {
      this.setState(ClientConnectionState.CONNECTED);
      this.emit('authentication-failed', (error as Error).message);
      return false;
    }
  }

  /**
   * 加入房间
   */
  joinRoom(roomId: string): void {
    this._currentRoomId = roomId;
  }

  /**
   * 离开房间
   */
  leaveRoom(): void {
    this._currentRoomId = null;
  }

  /**
   * 断开连接
   */
  disconnect(reason?: string): void {
    if (this._state === ClientConnectionState.DISCONNECTED) {
      return;
    }

    this.setState(ClientConnectionState.DISCONNECTING);
    this.stopTimeout();
    
    // 发送断开连接消息
    this.sendMessage({
      type: 'system',
      data: {
        action: 'disconnect',
        reason: reason || 'server-disconnect'
      }
    }).finally(() => {
      this.setState(ClientConnectionState.DISCONNECTED);
    });
  }

  /**
   * 更新活跃时间
   */
  updateActivity(): void {
    this._lastActivity = new Date();
    this.resetTimeout();
  }

  /**
   * 设置连接状态
   */
  private setState(newState: ClientConnectionState): void {
    const oldState = this._state;
    if (oldState !== newState) {
      this._state = newState;
      this.emit('state-changed', oldState, newState);
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    this.setState(ClientConnectionState.ERROR);
    this.emit('error', error);
  }

  /**
   * 启动超时检测
   */
  private startTimeout(): void {
    this.resetTimeout();
  }

  /**
   * 重置超时定时器
   */
  private resetTimeout(): void {
    this.stopTimeout();
    
    if (this._connectionTimeout > 0) {
      this._timeoutTimer = setTimeout(() => {
        this.handleTimeout();
      }, this._connectionTimeout);
    }
  }

  /**
   * 停止超时检测
   */
  private stopTimeout(): void {
    if (this._timeoutTimer) {
      clearTimeout(this._timeoutTimer);
      this._timeoutTimer = null;
    }
  }

  /**
   * 处理超时
   */
  private handleTimeout(): void {
    this.emit('timeout');
    this.disconnect('timeout');
  }

  /**
   * 销毁连接
   */
  destroy(): void {
    this.stopTimeout();
    this.removeAllListeners();
    this.setState(ClientConnectionState.DISCONNECTED);
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof ClientConnectionEvents>(event: K, listener: ClientConnectionEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof ClientConnectionEvents>(event: K, ...args: Parameters<ClientConnectionEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  /**
   * 序列化连接信息
   */
  toJSON(): object {
    return {
      id: this.id,
      remoteAddress: this.remoteAddress,
      state: this._state,
      connectedAt: this.connectedAt.toISOString(),
      lastActivity: this._lastActivity.toISOString(),
      currentRoomId: this._currentRoomId,
      userData: this._userData,
      permissions: this._permissions,
      stats: this.stats
    };
  }
}