/**
 * 房间管理器
 * 
 * 管理所有房间的创建、销毁、查找等操作
 */

import { EventEmitter } from 'events';
import { Room, RoomConfig, RoomState, PlayerData } from './Room';
import { ClientConnection } from '../core/ClientConnection';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';

/**
 * 房间管理器配置
 */
export interface RoomManagerConfig {
  /** 最大房间数量 */
  maxRooms?: number;
  /** 默认房间过期时间(毫秒) */
  defaultExpirationTime?: number;
  /** 是否启用房间统计 */
  enableStats?: boolean;
  /** 房间清理间隔(毫秒) */
  cleanupInterval?: number;
}

/**
 * 房间查询选项
 */
export interface RoomQueryOptions {
  /** 房间名称模糊搜索 */
  namePattern?: string;
  /** 房间状态过滤 */
  state?: RoomState;
  /** 是否私有房间 */
  isPrivate?: boolean;
  /** 最小空位数 */
  minAvailableSlots?: number;
  /** 最大空位数 */
  maxAvailableSlots?: number;
  /** 元数据过滤 */
  metadata?: Record<string, NetworkValue>;
  /** 限制结果数量 */
  limit?: number;
  /** 跳过条数 */
  offset?: number;
}

/**
 * 房间管理器统计信息
 */
export interface RoomManagerStats {
  /** 总房间数 */
  totalRooms: number;
  /** 活跃房间数 */
  activeRooms: number;
  /** 总玩家数 */
  totalPlayers: number;
  /** 私有房间数 */
  privateRooms: number;
  /** 持久化房间数 */
  persistentRooms: number;
  /** 创建的房间总数 */
  roomsCreated: number;
  /** 关闭的房间总数 */
  roomsClosed: number;
}

/**
 * 房间管理器事件
 */
export interface RoomManagerEvents {
  /** 房间创建 */
  'room-created': (room: Room) => void;
  /** 房间关闭 */
  'room-closed': (roomId: string, reason: string) => void;
  /** 玩家加入房间 */
  'player-joined-room': (roomId: string, player: PlayerData) => void;
  /** 玩家离开房间 */
  'player-left-room': (roomId: string, clientId: string, reason?: string) => void;
  /** 房间管理器错误 */
  'error': (error: Error, roomId?: string) => void;
}

/**
 * 房间管理器
 */
export class RoomManager extends EventEmitter {
  private config: RoomManagerConfig;
  private rooms = new Map<string, Room>();
  private stats: RoomManagerStats;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: RoomManagerConfig = {}) {
    super();
    
    this.config = {
      maxRooms: 1000,
      defaultExpirationTime: 0, // 0 = 不过期
      enableStats: true,
      cleanupInterval: 60000, // 1分钟
      ...config
    };

    this.stats = {
      totalRooms: 0,
      activeRooms: 0,
      totalPlayers: 0,
      privateRooms: 0,
      persistentRooms: 0,
      roomsCreated: 0,
      roomsClosed: 0
    };

    this.initialize();
  }

  /**
   * 获取房间管理器配置
   */
  getConfig(): Readonly<RoomManagerConfig> {
    return this.config;
  }

  /**
   * 获取房间管理器统计信息
   */
  getStats(): RoomManagerStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * 创建房间
   */
  async createRoom(config: RoomConfig, creatorClient?: ClientConnection): Promise<Room> {
    // 检查房间数量限制
    if (this.config.maxRooms && this.rooms.size >= this.config.maxRooms) {
      throw new Error('Maximum number of rooms reached');
    }

    // 检查房间ID是否已存在
    if (this.rooms.has(config.id)) {
      throw new Error(`Room with id "${config.id}" already exists`);
    }

    // 应用默认过期时间
    const roomConfig: RoomConfig = {
      expirationTime: this.config.defaultExpirationTime,
      ...config
    };

    const room = new Room(roomConfig);
    
    // 设置房间事件监听
    this.setupRoomEvents(room);
    
    this.rooms.set(room.id, room);
    this.stats.roomsCreated++;

    console.log(`Room created: ${room.id} by ${creatorClient?.id || 'system'}`);
    this.emit('room-created', room);

    // 如果有创建者，自动加入房间
    if (creatorClient) {
      try {
        await room.addPlayer(creatorClient);
      } catch (error) {
        console.error(`Failed to add creator to room ${room.id}:`, error);
      }
    }

    return room;
  }

  /**
   * 获取房间
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 检查房间是否存在
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * 获取所有房间
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 查询房间
   */
  findRooms(options: RoomQueryOptions = {}): Room[] {
    let rooms = Array.from(this.rooms.values());

    // 状态过滤
    if (options.state !== undefined) {
      rooms = rooms.filter(room => room.currentState === options.state);
    }

    // 私有房间过滤
    if (options.isPrivate !== undefined) {
      rooms = rooms.filter(room => room.getConfig().isPrivate === options.isPrivate);
    }

    // 名称模糊搜索
    if (options.namePattern) {
      const pattern = options.namePattern.toLowerCase();
      rooms = rooms.filter(room => 
        room.getConfig().name.toLowerCase().includes(pattern)
      );
    }

    // 空位数过滤
    if (options.minAvailableSlots !== undefined) {
      rooms = rooms.filter(room => {
        const available = room.getConfig().maxPlayers - room.getPlayerCount();
        return available >= options.minAvailableSlots!;
      });
    }

    if (options.maxAvailableSlots !== undefined) {
      rooms = rooms.filter(room => {
        const available = room.getConfig().maxPlayers - room.getPlayerCount();
        return available <= options.maxAvailableSlots!;
      });
    }

    // 元数据过滤
    if (options.metadata) {
      rooms = rooms.filter(room => {
        const roomMetadata = room.getConfig().metadata || {};
        return Object.entries(options.metadata!).every(([key, value]) => 
          roomMetadata[key] === value
        );
      });
    }

    // 排序（按创建时间，最新的在前）
    rooms.sort((a, b) => 
      b.getStats().createdAt.getTime() - a.getStats().createdAt.getTime()
    );

    // 分页
    const offset = options.offset || 0;
    const limit = options.limit || rooms.length;
    return rooms.slice(offset, offset + limit);
  }

  /**
   * 关闭房间
   */
  async closeRoom(roomId: string, reason: string = 'manual'): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    try {
      await room.close(reason);
      return true;
    } catch (error) {
      this.emit('error', error as Error, roomId);
      return false;
    }
  }

  /**
   * 玩家加入房间
   */
  async joinRoom(
    roomId: string, 
    client: ClientConnection, 
    customData: Record<string, NetworkValue> = {}
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room "${roomId}" not found`);
    }

    try {
      return await room.addPlayer(client, customData);
    } catch (error) {
      this.emit('error', error as Error, roomId);
      throw error;
    }
  }

  /**
   * 玩家离开房间
   */
  async leaveRoom(roomId: string, clientId: string, reason?: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    try {
      return await room.removePlayer(clientId, reason);
    } catch (error) {
      this.emit('error', error as Error, roomId);
      return false;
    }
  }

  /**
   * 玩家离开所有房间
   */
  async leaveAllRooms(clientId: string, reason?: string): Promise<number> {
    let leftCount = 0;
    
    for (const room of this.rooms.values()) {
      if (room.hasPlayer(clientId)) {
        try {
          await room.removePlayer(clientId, reason);
          leftCount++;
        } catch (error) {
          console.error(`Error removing player ${clientId} from room ${room.id}:`, error);
        }
      }
    }
    
    return leftCount;
  }

  /**
   * 获取玩家所在的房间
   */
  getPlayerRooms(clientId: string): Room[] {
    return Array.from(this.rooms.values())
      .filter(room => room.hasPlayer(clientId));
  }

  /**
   * 获取房间数量
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * 获取总玩家数量
   */
  getTotalPlayerCount(): number {
    return Array.from(this.rooms.values())
      .reduce((total, room) => total + room.getPlayerCount(), 0);
  }

  /**
   * 清理空闲房间
   */
  async cleanupRooms(): Promise<number> {
    let cleanedCount = 0;
    const now = Date.now();

    for (const room of this.rooms.values()) {
      const config = room.getConfig();
      const stats = room.getStats();
      
      // 清理条件：
      // 1. 非持久化的空房间
      // 2. 已过期的房间
      // 3. 已关闭的房间
      let shouldClean = false;
      let reason = '';

      if (room.currentState === RoomState.CLOSED) {
        shouldClean = true;
        reason = 'room-closed';
      } else if (!config.persistent && room.isEmpty()) {
        shouldClean = true;
        reason = 'empty-room';
      } else if (config.expirationTime && config.expirationTime > 0) {
        const expireTime = stats.createdAt.getTime() + config.expirationTime;
        if (now >= expireTime) {
          shouldClean = true;
          reason = 'expired';
        }
      }

      if (shouldClean) {
        try {
          if (room.currentState !== RoomState.CLOSED) {
            await room.close(reason);
          }
          this.rooms.delete(room.id);
          cleanedCount++;
          console.log(`Cleaned up room: ${room.id}, reason: ${reason}`);
        } catch (error) {
          console.error(`Error cleaning up room ${room.id}:`, error);
        }
      }
    }

    return cleanedCount;
  }

  /**
   * 关闭所有房间
   */
  async closeAllRooms(reason: string = 'shutdown'): Promise<void> {
    const rooms = Array.from(this.rooms.values());
    const promises = rooms.map(room => room.close(reason));
    
    await Promise.allSettled(promises);
    this.rooms.clear();
    
    console.log(`Closed ${rooms.length} rooms, reason: ${reason}`);
  }

  /**
   * 销毁房间管理器
   */
  async destroy(): Promise<void> {
    // 停止清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 关闭所有房间
    await this.closeAllRooms('manager-destroyed');
    
    // 移除所有事件监听器
    this.removeAllListeners();
  }

  /**
   * 初始化房间管理器
   */
  private initialize(): void {
    // 启动清理定时器
    if (this.config.cleanupInterval && this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupRooms().catch(error => {
          console.error('Error during room cleanup:', error);
        });
      }, this.config.cleanupInterval);
    }
  }

  /**
   * 设置房间事件监听
   */
  private setupRoomEvents(room: Room): void {
    room.on('player-joined', (player) => {
      this.emit('player-joined-room', room.id, player);
    });

    room.on('player-left', (clientId, reason) => {
      this.emit('player-left-room', room.id, clientId, reason);
    });

    room.on('closed', (reason) => {
      this.rooms.delete(room.id);
      this.stats.roomsClosed++;
      console.log(`Room ${room.id} removed from manager, reason: ${reason}`);
      this.emit('room-closed', room.id, reason);
    });

    room.on('error', (error) => {
      this.emit('error', error, room.id);
    });
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalRooms = this.rooms.size;
    this.stats.activeRooms = Array.from(this.rooms.values())
      .filter(room => room.currentState === RoomState.ACTIVE).length;
    this.stats.totalPlayers = this.getTotalPlayerCount();
    this.stats.privateRooms = Array.from(this.rooms.values())
      .filter(room => room.getConfig().isPrivate).length;
    this.stats.persistentRooms = Array.from(this.rooms.values())
      .filter(room => room.getConfig().persistent).length;
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof RoomManagerEvents>(event: K, listener: RoomManagerEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof RoomManagerEvents>(event: K, ...args: Parameters<RoomManagerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}