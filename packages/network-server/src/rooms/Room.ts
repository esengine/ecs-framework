/**
 * 房间管理
 * 
 * 类似于 Unity Mirror 的 Scene 概念，管理一组客户端和网络对象
 */

import { EventEmitter } from 'events';
import { Entity, Scene } from '@esengine/ecs-framework';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { ClientConnection } from '../core/ClientConnection';
import { TransportMessage } from '../core/Transport';

/**
 * 房间状态
 */
export enum RoomState {
  /** 创建中 */
  CREATING = 'creating',
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 暂停状态 */
  PAUSED = 'paused',
  /** 关闭中 */
  CLOSING = 'closing',
  /** 已关闭 */
  CLOSED = 'closed'
}

/**
 * 房间配置
 */
export interface RoomConfig {
  /** 房间ID */
  id: string;
  /** 房间名称 */
  name: string;
  /** 房间描述 */
  description?: string;
  /** 最大玩家数 */
  maxPlayers: number;
  /** 是否私有房间 */
  isPrivate?: boolean;
  /** 房间密码 */
  password?: string;
  /** 房间元数据 */
  metadata?: Record<string, NetworkValue>;
  /** 是否持久化 */
  persistent?: boolean;
  /** 房间过期时间(毫秒) */
  expirationTime?: number;
}

/**
 * 玩家数据
 */
export interface PlayerData {
  /** 客户端连接 */
  client: ClientConnection;
  /** 加入时间 */
  joinedAt: Date;
  /** 是否为房主 */
  isOwner: boolean;
  /** 玩家自定义数据 */
  customData: Record<string, NetworkValue>;
}

/**
 * 房间统计信息
 */
export interface RoomStats {
  /** 当前玩家数 */
  currentPlayers: number;
  /** 最大玩家数 */
  maxPlayers: number;
  /** 总加入过的玩家数 */
  totalPlayersJoined: number;
  /** 消息总数 */
  totalMessages: number;
  /** 创建时间 */
  createdAt: Date;
  /** 房间存活时间(毫秒) */
  lifetime: number;
}

/**
 * 房间事件
 */
export interface RoomEvents {
  /** 玩家加入 */
  'player-joined': (player: PlayerData) => void;
  /** 玩家离开 */
  'player-left': (clientId: string, reason?: string) => void;
  /** 房主变更 */
  'owner-changed': (newOwnerId: string, oldOwnerId?: string) => void;
  /** 房间状态变化 */
  'state-changed': (oldState: RoomState, newState: RoomState) => void;
  /** 收到消息 */
  'message': (clientId: string, message: TransportMessage) => void;
  /** 房间更新 */
  'room-updated': (updatedFields: Partial<RoomConfig>) => void;
  /** 房间错误 */
  'error': (error: Error, clientId?: string) => void;
  /** 房间即将关闭 */
  'closing': (reason: string) => void;
  /** 房间已关闭 */
  'closed': (reason: string) => void;
}

/**
 * 房间类
 */
export class Room extends EventEmitter {
  private config: RoomConfig;
  private state: RoomState = RoomState.CREATING;
  private players = new Map<string, PlayerData>();
  private ownerId: string | null = null;
  private ecsScene: Scene | null = null;
  private stats: RoomStats;
  private expirationTimer: NodeJS.Timeout | null = null;

  constructor(config: RoomConfig) {
    super();
    
    this.config = { ...config };
    this.stats = {
      currentPlayers: 0,
      maxPlayers: config.maxPlayers,
      totalPlayersJoined: 0,
      totalMessages: 0,
      createdAt: new Date(),
      lifetime: 0
    };

    this.initialize();
  }

  /**
   * 获取房间ID
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * 获取房间名称
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * 获取房间状态
   */
  get currentState(): RoomState {
    return this.state;
  }

  /**
   * 获取房间配置
   */
  getConfig(): Readonly<RoomConfig> {
    return this.config;
  }

  /**
   * 获取房间统计信息
   */
  getStats(): RoomStats {
    this.stats.lifetime = Date.now() - this.stats.createdAt.getTime();
    this.stats.currentPlayers = this.players.size;
    return { ...this.stats };
  }

  /**
   * 获取所有玩家
   */
  getPlayers(): PlayerData[] {
    return Array.from(this.players.values());
  }

  /**
   * 获取指定玩家
   */
  getPlayer(clientId: string): PlayerData | undefined {
    return this.players.get(clientId);
  }

  /**
   * 检查玩家是否在房间中
   */
  hasPlayer(clientId: string): boolean {
    return this.players.has(clientId);
  }

  /**
   * 获取当前玩家数量
   */
  getPlayerCount(): number {
    return this.players.size;
  }

  /**
   * 检查房间是否已满
   */
  isFull(): boolean {
    return this.players.size >= this.config.maxPlayers;
  }

  /**
   * 检查房间是否为空
   */
  isEmpty(): boolean {
    return this.players.size === 0;
  }

  /**
   * 获取房主
   */
  getOwner(): PlayerData | undefined {
    return this.ownerId ? this.players.get(this.ownerId) : undefined;
  }

  /**
   * 获取 ECS 场景
   */
  getEcsScene(): Scene | null {
    return this.ecsScene;
  }

  /**
   * 玩家加入房间
   */
  async addPlayer(client: ClientConnection, customData: Record<string, NetworkValue> = {}): Promise<boolean> {
    if (this.state !== RoomState.ACTIVE) {
      throw new Error(`Cannot join room in state: ${this.state}`);
    }

    if (this.hasPlayer(client.id)) {
      throw new Error(`Player ${client.id} is already in the room`);
    }

    if (this.isFull()) {
      throw new Error('Room is full');
    }

    // 检查房间密码
    if (this.config.isPrivate && this.config.password) {
      const providedPassword = customData.password as string;
      if (providedPassword !== this.config.password) {
        throw new Error('Invalid room password');
      }
    }

    const isFirstPlayer = this.isEmpty();
    const playerData: PlayerData = {
      client,
      joinedAt: new Date(),
      isOwner: isFirstPlayer,
      customData: { ...customData }
    };

    this.players.set(client.id, playerData);
    client.joinRoom(this.id);

    // 设置房主
    if (isFirstPlayer) {
      this.ownerId = client.id;
    }

    this.stats.totalPlayersJoined++;
    
    // 通知其他玩家
    await this.broadcast({
      type: 'system',
      data: {
        action: 'player-joined',
        playerId: client.id,
        playerData: {
          id: client.id,
          joinedAt: playerData.joinedAt.toISOString(),
          isOwner: playerData.isOwner,
          customData: playerData.customData
        }
      }
    }, client.id);

    console.log(`Player ${client.id} joined room ${this.id}`);
    this.emit('player-joined', playerData);

    return true;
  }

  /**
   * 玩家离开房间
   */
  async removePlayer(clientId: string, reason?: string): Promise<boolean> {
    const player = this.players.get(clientId);
    if (!player) {
      return false;
    }

    this.players.delete(clientId);
    player.client.leaveRoom();

    // 如果离开的是房主，转移房主权限
    if (this.ownerId === clientId) {
      await this.transferOwnership();
    }

    // 通知其他玩家
    await this.broadcast({
      type: 'system',
      data: {
        action: 'player-left',
        playerId: clientId,
        reason: reason || 'unknown'
      }
    });

    console.log(`Player ${clientId} left room ${this.id}, reason: ${reason || 'unknown'}`);
    this.emit('player-left', clientId, reason);

    // 如果房间为空，考虑关闭
    if (this.isEmpty() && !this.config.persistent) {
      await this.close('empty-room');
    }

    return true;
  }

  /**
   * 转移房主权限
   */
  async transferOwnership(newOwnerId?: string): Promise<boolean> {
    const oldOwnerId = this.ownerId;

    if (newOwnerId) {
      const newOwner = this.players.get(newOwnerId);
      if (!newOwner) {
        return false;
      }
      this.ownerId = newOwnerId;
      newOwner.isOwner = true;
    } else {
      // 自动选择下一个玩家作为房主
      const players = Array.from(this.players.values());
      if (players.length > 0) {
        const newOwner = players[0];
        this.ownerId = newOwner.client.id;
        newOwner.isOwner = true;
      } else {
        this.ownerId = null;
      }
    }

    // 更新旧房主状态
    if (oldOwnerId) {
      const oldOwner = this.players.get(oldOwnerId);
      if (oldOwner) {
        oldOwner.isOwner = false;
      }
    }

    // 通知所有玩家房主变更
    if (this.ownerId) {
      await this.broadcast({
        type: 'system',
        data: {
          action: 'owner-changed',
          newOwnerId: this.ownerId,
          oldOwnerId: oldOwnerId || ''
        }
      });

      console.log(`Room ${this.id} ownership transferred from ${oldOwnerId || 'none'} to ${this.ownerId}`);
      this.emit('owner-changed', this.ownerId, oldOwnerId || undefined);
    }

    return true;
  }

  /**
   * 广播消息给房间内所有玩家
   */
  async broadcast(message: TransportMessage, excludeClientId?: string): Promise<number> {
    const players = Array.from(this.players.values())
      .filter(player => player.client.id !== excludeClientId);

    const promises = players.map(player => player.client.sendMessage(message));
    const results = await Promise.allSettled(promises);
    
    return results.filter(result => result.status === 'fulfilled' && result.value).length;
  }

  /**
   * 发送消息给指定玩家
   */
  async sendToPlayer(clientId: string, message: TransportMessage): Promise<boolean> {
    const player = this.players.get(clientId);
    if (!player) {
      return false;
    }

    return await player.client.sendMessage(message);
  }

  /**
   * 处理玩家消息
   */
  async handleMessage(clientId: string, message: TransportMessage): Promise<void> {
    if (!this.hasPlayer(clientId)) {
      return;
    }

    this.stats.totalMessages++;
    this.emit('message', clientId, message);

    // 根据消息类型进行处理
    switch (message.type) {
      case 'rpc':
        await this.handleRpcMessage(clientId, message);
        break;
      case 'syncvar':
        await this.handleSyncVarMessage(clientId, message);
        break;
      case 'system':
        await this.handleSystemMessage(clientId, message);
        break;
      default:
        // 转发自定义消息
        await this.broadcast(message, clientId);
        break;
    }
  }

  /**
   * 更新房间配置
   */
  async updateConfig(updates: Partial<RoomConfig>): Promise<void> {
    // 验证更新
    if (updates.maxPlayers !== undefined && updates.maxPlayers < this.players.size) {
      throw new Error('Cannot reduce maxPlayers below current player count');
    }

    const oldConfig = { ...this.config };
    Object.assign(this.config, updates);

    // 通知所有玩家房间更新
    await this.broadcast({
      type: 'system',
      data: {
        action: 'room-updated',
        updates
      }
    });

    this.emit('room-updated', updates);
  }

  /**
   * 暂停房间
   */
  async pause(): Promise<void> {
    if (this.state === RoomState.ACTIVE) {
      this.setState(RoomState.PAUSED);
      
      await this.broadcast({
        type: 'system',
        data: {
          action: 'room-paused'
        }
      });
    }
  }

  /**
   * 恢复房间
   */
  async resume(): Promise<void> {
    if (this.state === RoomState.PAUSED) {
      this.setState(RoomState.ACTIVE);
      
      await this.broadcast({
        type: 'system',
        data: {
          action: 'room-resumed'
        }
      });
    }
  }

  /**
   * 关闭房间
   */
  async close(reason: string = 'server-shutdown'): Promise<void> {
    if (this.state === RoomState.CLOSED || this.state === RoomState.CLOSING) {
      return;
    }

    this.setState(RoomState.CLOSING);
    this.emit('closing', reason);

    // 通知所有玩家房间即将关闭
    await this.broadcast({
      type: 'system',
      data: {
        action: 'room-closing',
        reason
      }
    });

    // 移除所有玩家
    const playerIds = Array.from(this.players.keys());
    for (const clientId of playerIds) {
      await this.removePlayer(clientId, 'room-closed');
    }

    this.cleanup();
    this.setState(RoomState.CLOSED);
    
    console.log(`Room ${this.id} closed, reason: ${reason}`);
    this.emit('closed', reason);
  }

  /**
   * 初始化房间
   */
  private initialize(): void {
    // 创建 ECS 场景
    this.ecsScene = new Scene();
    
    // 设置过期定时器
    if (this.config.expirationTime && this.config.expirationTime > 0) {
      this.expirationTimer = setTimeout(() => {
        this.close('expired');
      }, this.config.expirationTime);
    }

    this.setState(RoomState.ACTIVE);
  }

  /**
   * 处理 RPC 消息
   */
  private async handleRpcMessage(clientId: string, message: TransportMessage): Promise<void> {
    // RPC 消息处理逻辑
    // 这里可以添加权限检查、速率限制等
    await this.broadcast(message, clientId);
  }

  /**
   * 处理 SyncVar 消息
   */
  private async handleSyncVarMessage(clientId: string, message: TransportMessage): Promise<void> {
    // SyncVar 消息处理逻辑
    // 这里可以添加权限检查、数据验证等
    await this.broadcast(message, clientId);
  }

  /**
   * 处理系统消息
   */
  private async handleSystemMessage(clientId: string, message: TransportMessage): Promise<void> {
    const data = message.data as any;
    
    switch (data.action) {
      case 'request-ownership':
        // 处理房主权限转移请求
        if (this.ownerId === clientId) {
          await this.transferOwnership(data.newOwnerId);
        }
        break;
      // 其他系统消息处理...
    }
  }

  /**
   * 设置房间状态
   */
  private setState(newState: RoomState): void {
    const oldState = this.state;
    if (oldState !== newState) {
      this.state = newState;
      this.emit('state-changed', oldState, newState);
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }

    this.removeAllListeners();
    
    if (this.ecsScene) {
      this.ecsScene = null;
    }
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof RoomEvents>(event: K, listener: RoomEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof RoomEvents>(event: K, ...args: Parameters<RoomEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  /**
   * 序列化房间信息
   */
  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      config: this.config,
      stats: this.getStats(),
      players: this.getPlayers().map(player => ({
        id: player.client.id,
        joinedAt: player.joinedAt.toISOString(),
        isOwner: player.isOwner,
        customData: player.customData
      })),
      ownerId: this.ownerId
    };
  }
}