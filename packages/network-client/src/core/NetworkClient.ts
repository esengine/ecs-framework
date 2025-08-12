/**
 * 网络客户端主类
 * 
 * 管理连接、认证、房间加入等功能
 */

import { Scene, EntityManager, Emitter, ITimer, Core } from '@esengine/ecs-framework';
import { 
  NetworkIdentity as SharedNetworkIdentity,
  NetworkValue,
  RpcMessage,
  SyncVarMessage
} from '@esengine/ecs-framework-network-shared';
import { 
  ClientTransport, 
  WebSocketClientTransport, 
  HttpClientTransport,
  ConnectionState,
  ClientMessage,
  ClientTransportConfig,
  WebSocketClientConfig,
  HttpClientConfig
} from '../transport';

/**
 * 网络客户端配置
 */
export interface NetworkClientConfig {
  /** 传输类型 */
  transport: 'websocket' | 'http';
  /** 传输配置 */
  transportConfig: WebSocketClientConfig | HttpClientConfig;
  /** 是否启用预测 */
  enablePrediction?: boolean;
  /** 预测缓冲区大小 */
  predictionBuffer?: number;
  /** 是否启用插值 */
  enableInterpolation?: boolean;
  /** 插值延迟(毫秒) */
  interpolationDelay?: number;
  /** 网络对象同步间隔(毫秒) */
  syncInterval?: number;
  /** 是否启用调试 */
  debug?: boolean;
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 用户数据 */
  data?: NetworkValue;
}

/**
 * 房间信息
 */
export interface RoomInfo {
  /** 房间ID */
  roomId: string;
  /** 房间名称 */
  name: string;
  /** 当前人数 */
  playerCount: number;
  /** 最大人数 */
  maxPlayers: number;
  /** 房间元数据 */
  metadata?: NetworkValue;
  /** 是否私有房间 */
  isPrivate?: boolean;
}

/**
 * 认证消息
 */
export interface AuthMessage {
  action: string;
  username: string;
  password?: string;
  userData?: NetworkValue;
}

/**
 * 房间消息
 */
export interface RoomMessage {
  action: string;
  roomId?: string;
  name?: string;
  maxPlayers?: number;
  metadata?: NetworkValue;
  isPrivate?: boolean;
  password?: string;
}

/**
 * 网络客户端事件
 */
export interface NetworkClientEvents {
  /** 连接建立 */
  'connected': () => void;
  /** 连接断开 */
  'disconnected': (reason: string) => void;
  /** 认证成功 */
  'authenticated': (userInfo: UserInfo) => void;
  /** 加入房间成功 */
  'joined-room': (roomInfo: RoomInfo) => void;
  /** 离开房间 */
  'left-room': (roomId: string) => void;
  /** 房间列表更新 */
  'room-list-updated': (rooms: RoomInfo[]) => void;
  /** 玩家加入房间 */
  'player-joined': (userId: string, userInfo: UserInfo) => void;
  /** 玩家离开房间 */
  'player-left': (userId: string) => void;
  /** 网络对象创建 */
  'network-object-created': (networkId: string, data: NetworkValue) => void;
  /** 网络对象销毁 */
  'network-object-destroyed': (networkId: string) => void;
  /** SyncVar 更新 */
  'syncvar-updated': (networkId: string, fieldName: string, value: NetworkValue) => void;
  /** RPC 调用 */
  'rpc-received': (networkId: string, methodName: string, args: NetworkValue[]) => void;
  /** 错误发生 */
  'error': (error: Error) => void;
}

/**
 * 网络客户端主类
 */
export class NetworkClient {
  private transport: ClientTransport;
  private config: NetworkClientConfig;
  private currentUser: UserInfo | null = null;
  private currentRoom: RoomInfo | null = null;
  private availableRooms: Map<string, RoomInfo> = new Map();
  private networkObjects: Map<string, SharedNetworkIdentity> = new Map();
  private pendingRpcs: Map<string, { resolve: Function; reject: Function; timeout: ITimer<any> }> = new Map();
  private scene: Scene | null = null;
  private eventEmitter: Emitter<keyof NetworkClientEvents, any>;

  constructor(config: NetworkClientConfig) {
    this.eventEmitter = new Emitter();
    
    this.config = {
      enablePrediction: true,
      predictionBuffer: 64,
      enableInterpolation: true,
      interpolationDelay: 100,
      syncInterval: 50,
      debug: false,
      ...config
    };

    this.transport = this.createTransport();
    this.setupTransportEvents();
  }

  /**
   * 创建传输层
   */
  private createTransport(): ClientTransport {
    switch (this.config.transport) {
      case 'websocket':
        return new WebSocketClientTransport(this.config.transportConfig as WebSocketClientConfig);
      case 'http':
        return new HttpClientTransport(this.config.transportConfig as HttpClientConfig);
      default:
        throw new Error(`Unsupported transport type: ${this.config.transport}`);
    }
  }

  /**
   * 设置传输层事件监听
   */
  private setupTransportEvents(): void {
    this.transport.on('connected', () => {
      this.eventEmitter.emit('connected');
    });

    this.transport.on('disconnected', (reason) => {
      this.handleDisconnected(reason);
    });

    this.transport.on('message', (message) => {
      this.handleMessage(message);
    });

    this.transport.on('error', (error) => {
      this.eventEmitter.emit('error', error);
    });
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    return this.transport.connect();
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this.cleanup();
  }

  /**
   * 用户认证
   */
  async authenticate(username: string, password?: string, userData?: NetworkValue): Promise<UserInfo> {
    if (!this.transport.isConnected()) {
      throw new Error('Not connected to server');
    }

    const authMessage: AuthMessage = {
      action: 'login',
      username,
      password,
      userData
    };

    const response = await this.sendRequestWithResponse('system', authMessage as any);
    
    if (response.success && response.userInfo) {
      this.currentUser = response.userInfo as UserInfo;
      this.eventEmitter.emit('authenticated', this.currentUser);
      return this.currentUser;
    } else {
      throw new Error(response.error || 'Authentication failed');
    }
  }

  /**
   * 获取房间列表
   */
  async getRoomList(): Promise<RoomInfo[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const roomMessage: RoomMessage = {
      action: 'list-rooms'
    };

    const response = await this.sendRequestWithResponse('system', roomMessage as any);
    
    if (response.success && response.rooms) {
      this.availableRooms.clear();
      response.rooms.forEach((room: RoomInfo) => {
        this.availableRooms.set(room.roomId, room);
      });
      
      this.eventEmitter.emit('room-list-updated', response.rooms);
      return response.rooms;
    } else {
      throw new Error(response.error || 'Failed to get room list');
    }
  }

  /**
   * 创建房间
   */
  async createRoom(name: string, maxPlayers: number = 8, metadata?: NetworkValue, isPrivate = false): Promise<RoomInfo> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const roomMessage: RoomMessage = {
      action: 'create-room',
      name,
      maxPlayers,
      metadata,
      isPrivate
    };

    const response = await this.sendRequestWithResponse('system', roomMessage as any);
    
    if (response.success && response.room) {
      this.currentRoom = response.room as RoomInfo;
      this.eventEmitter.emit('joined-room', this.currentRoom);
      return this.currentRoom;
    } else {
      throw new Error(response.error || 'Failed to create room');
    }
  }

  /**
   * 加入房间
   */
  async joinRoom(roomId: string, password?: string): Promise<RoomInfo> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const roomMessage: RoomMessage = {
      action: 'join-room',
      roomId,
      password
    };

    const response = await this.sendRequestWithResponse('system', roomMessage as any);
    
    if (response.success && response.room) {
      this.currentRoom = response.room as RoomInfo;
      this.eventEmitter.emit('joined-room', this.currentRoom);
      return this.currentRoom;
    } else {
      throw new Error(response.error || 'Failed to join room');
    }
  }

  /**
   * 离开房间
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) {
      return;
    }

    const roomMessage: RoomMessage = {
      action: 'leave-room',
      roomId: this.currentRoom.roomId
    };

    try {
      await this.sendRequestWithResponse('system', roomMessage as any);
    } finally {
      const roomId = this.currentRoom.roomId;
      this.currentRoom = null;
      this.networkObjects.clear();
      this.eventEmitter.emit('left-room', roomId);
    }
  }

  /**
   * 发送RPC调用
   */
  async sendRpc(networkId: string, methodName: string, args: NetworkValue[] = [], reliable = true): Promise<NetworkValue> {
    if (!this.isInRoom()) {
      throw new Error('Not in a room');
    }

    const rpcMessage: any = {
      networkId,
      methodName,
      args,
      isServer: false,
      messageId: this.generateMessageId()
    };

    if (reliable) {
      return this.sendRequestWithResponse('rpc', rpcMessage);
    } else {
      await this.transport.sendMessage({
        type: 'rpc',
        data: rpcMessage as NetworkValue,
        reliable: false
      });
      return {};
    }
  }

  /**
   * 更新SyncVar
   */
  async updateSyncVar(networkId: string, fieldName: string, value: NetworkValue): Promise<void> {
    if (!this.isInRoom()) {
      throw new Error('Not in a room');
    }

    const syncMessage: any = {
      networkId,
      propertyName: fieldName,
      value,
      isServer: false
    };

    await this.transport.sendMessage({
      type: 'syncvar',
      data: syncMessage as NetworkValue,
      reliable: true
    });
  }

  /**
   * 设置ECS场景
   */
  setScene(scene: Scene): void {
    this.scene = scene;
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUser;
  }

  /**
   * 获取当前房间信息
   */
  getCurrentRoom(): RoomInfo | null {
    return this.currentRoom;
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState {
    return this.transport.getState();
  }

  /**
   * 是否已认证
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.transport.isConnected();
  }

  /**
   * 是否在房间中
   */
  isInRoom(): boolean {
    return this.isAuthenticated() && this.currentRoom !== null;
  }

  /**
   * 获取网络对象
   */
  getNetworkObject(networkId: string): SharedNetworkIdentity | null {
    return this.networkObjects.get(networkId) || null;
  }

  /**
   * 获取所有网络对象
   */
  getAllNetworkObjects(): SharedNetworkIdentity[] {
    return Array.from(this.networkObjects.values());
  }

  /**
   * 处理断开连接
   */
  private handleDisconnected(reason: string): void {
    this.cleanup();
    this.eventEmitter.emit('disconnected', reason);
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: ClientMessage): void {
    try {
      switch (message.type) {
        case 'system':
          this.handleSystemMessage(message);
          break;
        case 'rpc':
          this.handleRpcMessage(message);
          break;
        case 'syncvar':
          this.handleSyncVarMessage(message);
          break;
        case 'custom':
          this.handleCustomMessage(message);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.eventEmitter.emit('error', error as Error);
    }
  }

  /**
   * 处理系统消息
   */
  private handleSystemMessage(message: ClientMessage): void {
    const data = message.data as any;

    // 处理响应消息
    if (message.messageId && this.pendingRpcs.has(message.messageId)) {
      const pending = this.pendingRpcs.get(message.messageId)!;
      pending.timeout.stop();
      this.pendingRpcs.delete(message.messageId);
      
      if (data.success) {
        pending.resolve(data);
      } else {
        pending.reject(new Error(data.error || 'Request failed'));
      }
      return;
    }

    // 处理广播消息
    switch (data.action) {
      case 'player-joined':
        this.eventEmitter.emit('player-joined', data.userId, data.userInfo);
        break;
      case 'player-left':
        this.eventEmitter.emit('player-left', data.userId);
        break;
      case 'network-object-created':
        this.handleNetworkObjectCreated(data);
        break;
      case 'network-object-destroyed':
        this.handleNetworkObjectDestroyed(data);
        break;
    }
  }

  /**
   * 处理RPC消息
   */
  private handleRpcMessage(message: ClientMessage): void {
    const rpcData = message.data as any;
    this.eventEmitter.emit('rpc-received', rpcData.networkId, rpcData.methodName, rpcData.args || []);
  }

  /**
   * 处理SyncVar消息
   */
  private handleSyncVarMessage(message: ClientMessage): void {
    const syncData = message.data as any;
    this.eventEmitter.emit('syncvar-updated', syncData.networkId, syncData.propertyName, syncData.value);
  }

  /**
   * 处理自定义消息
   */
  private handleCustomMessage(message: ClientMessage): void {
    // 可扩展的自定义消息处理
  }

  /**
   * 处理网络对象创建
   */
  private handleNetworkObjectCreated(data: any): void {
    const networkObject = new SharedNetworkIdentity();
    this.networkObjects.set(data.networkId, networkObject);
    this.eventEmitter.emit('network-object-created', data.networkId, data.data || {});
  }

  /**
   * 处理网络对象销毁
   */
  private handleNetworkObjectDestroyed(data: any): void {
    this.networkObjects.delete(data.networkId);
    this.eventEmitter.emit('network-object-destroyed', data.networkId);
  }

  /**
   * 发送请求并等待响应
   */
  private sendRequestWithResponse(type: ClientMessage['type'], data: NetworkValue, timeout = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      
      const timeoutTimer = Core.schedule(timeout / 1000, false, this, () => {
        this.pendingRpcs.delete(messageId);
        reject(new Error('Request timeout'));
      });

      this.pendingRpcs.set(messageId, {
        resolve,
        reject,
        timeout: timeoutTimer
      });

      this.transport.sendMessage({
        type,
        data,
        messageId,
        reliable: true
      }).catch(reject);
    });
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.currentUser = null;
    this.currentRoom = null;
    this.availableRooms.clear();
    this.networkObjects.clear();
    
    // 取消所有待处理的RPC
    this.pendingRpcs.forEach(pending => {
      pending.timeout.stop();
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRpcs.clear();
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    this.disconnect();
    this.transport.destroy();
    // 清理事件监听器，由于Emitter没有clear方法，我们重新创建一个
    this.eventEmitter = new Emitter();
  }

  /**
   * 类型安全的事件监听
   */
  on<K extends keyof NetworkClientEvents>(event: K, listener: NetworkClientEvents[K]): void {
    this.eventEmitter.addObserver(event, listener, this);
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof NetworkClientEvents>(event: K, listener: NetworkClientEvents[K]): void {
    this.eventEmitter.removeObserver(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  emit<K extends keyof NetworkClientEvents>(event: K, ...args: Parameters<NetworkClientEvents[K]>): void {
    this.eventEmitter.emit(event, ...args);
  }
}