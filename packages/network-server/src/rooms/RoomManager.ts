/**
 * 房间管理器
 * 负责房间的创建、销毁和管理
 */
import { createLogger, ITimer, Core } from '@esengine/ecs-framework';
import { Room, RoomConfig, PlayerInfo, RoomEvents } from './Room';
import { ClientSession } from '../core/ConnectionManager';
import { RoomState, IRoomInfo, EventEmitter } from '@esengine/network-shared';

/**
 * 房间管理器配置
 */
export interface RoomManagerConfig {
    maxRooms: number;
    defaultMaxPlayers: number;
    autoCleanupInterval: number;    // 自动清理间隔（毫秒）
    roomIdLength: number;
    allowDuplicateNames: boolean;
    defaultAutoDestroy: boolean;
}

/**
 * 房间查询选项
 */
export interface RoomQueryOptions {
    state?: RoomState;
    hasPassword?: boolean;
    minPlayers?: number;
    maxPlayers?: number;
    notFull?: boolean;
    publicOnly?: boolean;
    limit?: number;
    offset?: number;
}

/**
 * 房间创建选项
 */
export interface CreateRoomOptions {
    id?: string;
    name: string;
    maxPlayers?: number;
    isPublic?: boolean;
    password?: string;
    metadata?: Record<string, any>;
    autoDestroy?: boolean;
}

/**
 * 房间管理器事件接口
 */
export interface RoomManagerEvents {
    roomCreated: (room: Room) => void;
    roomDestroyed: (room: Room, reason: string) => void;
    playerJoinedRoom: (room: Room, player: PlayerInfo) => void;
    playerLeftRoom: (room: Room, player: PlayerInfo, reason?: string) => void;
}

/**
 * 房间管理器统计
 */
export interface RoomManagerStats {
    totalRooms: number;
    activeRooms: number;
    totalPlayers: number;
    roomsByState: Record<RoomState, number>;
    roomsCreated: number;
    roomsDestroyed: number;
    playersJoined: number;
    playersLeft: number;
}

/**
 * 房间管理器
 */
export class RoomManager extends EventEmitter {
    private logger = createLogger('RoomManager');
    private config: RoomManagerConfig;
    private rooms: Map<string, Room> = new Map();
    private playerRoomMap: Map<string, string> = new Map(); // sessionId -> roomId
    private stats: RoomManagerStats;
    private cleanupTimer?: ITimer;

    // 事件处理器
    private eventHandlers: Partial<RoomManagerEvents> = {};

    /**
     * 构造函数
     */
    constructor(config: Partial<RoomManagerConfig> = {}) {
        super();

        this.config = {
            maxRooms: 1000,
            defaultMaxPlayers: 8,
            autoCleanupInterval: 300000, // 5分钟
            roomIdLength: 8,
            allowDuplicateNames: true,
            defaultAutoDestroy: true,
            ...config
        };

        this.stats = {
            totalRooms: 0,
            activeRooms: 0,
            totalPlayers: 0,
            roomsByState: {
                [RoomState.Waiting]: 0,
                [RoomState.Playing]: 0,
                [RoomState.Paused]: 0,
                [RoomState.Finished]: 0
            },
            roomsCreated: 0,
            roomsDestroyed: 0,
            playersJoined: 0,
            playersLeft: 0
        };

        this.startAutoCleanup();
    }

    /**
     * 创建房间
     */
    createRoom(creatorSession: ClientSession, options: CreateRoomOptions): Room | null {
        // 检查房间数量限制
        if (this.rooms.size >= this.config.maxRooms) {
            this.logger.warn(`房间数量已达上限: ${this.config.maxRooms}`);
            return null;
        }

        // 检查玩家是否已在其他房间
        if (this.playerRoomMap.has(creatorSession.id)) {
            this.logger.warn(`玩家已在其他房间中: ${creatorSession.id}`);
            return null;
        }

        // 检查房间名称重复
        if (!this.config.allowDuplicateNames && this.isNameExists(options.name)) {
            this.logger.warn(`房间名称已存在: ${options.name}`);
            return null;
        }

        // 生成房间ID
        const roomId = options.id || this.generateRoomId();
        if (this.rooms.has(roomId)) {
            this.logger.warn(`房间ID已存在: ${roomId}`);
            return null;
        }

        // 创建房间配置
        const roomConfig: RoomConfig = {
            id: roomId,
            name: options.name,
            maxPlayers: options.maxPlayers || this.config.defaultMaxPlayers,
            isPublic: options.isPublic !== false, // 默认为公开
            password: options.password,
            metadata: options.metadata || {},
            autoDestroy: options.autoDestroy ?? this.config.defaultAutoDestroy
        };

        try {
            // 创建房间实例
            const room = new Room(roomConfig);
            this.setupRoomEvents(room);

            // 添加到房间列表
            this.rooms.set(roomId, room);

            // 创建者自动加入房间
            const success = room.addPlayer(creatorSession, `Creator_${creatorSession.id.substr(-6)}`);
            if (!success) {
                // 加入失败，销毁房间
                this.destroyRoom(roomId, '创建者加入失败');
                return null;
            }

            // 更新玩家房间映射
            this.playerRoomMap.set(creatorSession.id, roomId);

            // 更新统计
            this.stats.roomsCreated++;
            this.updateStats();

            this.logger.info(`房间创建成功: ${roomId} by ${creatorSession.id}`);

            // 触发事件
            this.eventHandlers.roomCreated?.(room);
            this.emit('roomCreated', room);

            return room;

        } catch (error) {
            this.logger.error(`创建房间失败: ${roomId}`, error);
            return null;
        }
    }

    /**
     * 销毁房间
     */
    destroyRoom(roomId: string, reason: string = '房间关闭'): boolean {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }

        // 移除所有玩家的房间映射
        for (const player of room.getAllPlayers()) {
            this.playerRoomMap.delete(player.sessionId);
        }

        // 销毁房间
        room.destroy(reason);

        // 从房间列表移除
        this.rooms.delete(roomId);

        // 更新统计
        this.stats.roomsDestroyed++;
        this.updateStats();

        this.logger.info(`房间已销毁: ${roomId}, 原因: ${reason}`);

        // 触发事件
        this.eventHandlers.roomDestroyed?.(room, reason);
        this.emit('roomDestroyed', room, reason);

        return true;
    }

    /**
     * 玩家加入房间
     */
    joinRoom(session: ClientSession, roomId: string, password?: string, playerName?: string): boolean {
        // 检查玩家是否已在其他房间
        if (this.playerRoomMap.has(session.id)) {
            this.logger.warn(`玩家已在其他房间中: ${session.id}`);
            return false;
        }

        // 获取房间
        const room = this.rooms.get(roomId);
        if (!room) {
            this.logger.warn(`房间不存在: ${roomId}`);
            return false;
        }

        // 尝试加入房间
        const success = room.addPlayer(session, playerName, password);
        if (!success) {
            return false;
        }

        // 更新玩家房间映射
        this.playerRoomMap.set(session.id, roomId);

        // 更新统计
        this.stats.playersJoined++;
        this.updateStats();

        const player = room.getPlayer(session.id)!;
        this.eventHandlers.playerJoinedRoom?.(room, player);
        this.emit('playerJoinedRoom', room, player);

        return true;
    }

    /**
     * 玩家离开房间
     */
    leaveRoom(sessionId: string, reason?: string): boolean {
        const roomId = this.playerRoomMap.get(sessionId);
        if (!roomId) {
            return false;
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            this.playerRoomMap.delete(sessionId);
            return false;
        }

        const player = room.getPlayer(sessionId);
        if (!player) {
            this.playerRoomMap.delete(sessionId);
            return false;
        }

        // 从房间移除玩家
        const success = room.removePlayer(sessionId, reason);
        if (success) {
            // 更新玩家房间映射
            this.playerRoomMap.delete(sessionId);

            // 更新统计
            this.stats.playersLeft++;
            this.updateStats();

            this.eventHandlers.playerLeftRoom?.(room, player, reason);
            this.emit('playerLeftRoom', room, player, reason);
        }

        return success;
    }

    /**
     * 获取房间
     */
    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    /**
     * 获取玩家所在房间
     */
    getPlayerRoom(sessionId: string): Room | undefined {
        const roomId = this.playerRoomMap.get(sessionId);
        return roomId ? this.rooms.get(roomId) : undefined;
    }

    /**
     * 查询房间列表
     */
    queryRooms(options: RoomQueryOptions = {}): Room[] {
        let rooms = Array.from(this.rooms.values());

        // 应用过滤条件
        if (options.state !== undefined) {
            rooms = rooms.filter((room) => room.getRoomInfo().state === options.state);
        }

        if (options.hasPassword !== undefined) {
            rooms = rooms.filter((room) => {
                const config = room.getConfig();
                return options.hasPassword ? !!config.password : !config.password;
            });
        }

        if (options.minPlayers !== undefined) {
            rooms = rooms.filter((room) => room.getAllPlayers().length >= options.minPlayers!);
        }

        if (options.maxPlayers !== undefined) {
            rooms = rooms.filter((room) => room.getAllPlayers().length <= options.maxPlayers!);
        }

        if (options.notFull) {
            rooms = rooms.filter((room) => !room.isFull());
        }

        if (options.publicOnly) {
            rooms = rooms.filter((room) => room.getConfig().isPublic);
        }

        // 分页
        if (options.offset) {
            rooms = rooms.slice(options.offset);
        }

        if (options.limit) {
            rooms = rooms.slice(0, options.limit);
        }

        return rooms;
    }

    /**
     * 获取房间信息列表
     */
    getRoomInfoList(options: RoomQueryOptions = {}): IRoomInfo[] {
        return this.queryRooms(options).map((room) => room.getRoomInfo());
    }

    /**
     * 获取统计信息
     */
    getStats(): RoomManagerStats {
        this.updateStats();
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            totalRooms: this.rooms.size,
            activeRooms: this.rooms.size,
            totalPlayers: this.playerRoomMap.size,
            roomsByState: {
                [RoomState.Waiting]: 0,
                [RoomState.Playing]: 0,
                [RoomState.Paused]: 0,
                [RoomState.Finished]: 0
            },
            roomsCreated: 0,
            roomsDestroyed: 0,
            playersJoined: 0,
            playersLeft: 0
        };

        this.updateStats();
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<RoomManagerConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('房间管理器配置已更新:', newConfig);
    }

    /**
     * 设置事件处理器
     */
    override on<K extends keyof RoomManagerEvents>(event: K, handler: RoomManagerEvents[K]): this {
        this.eventHandlers[event] = handler;
        return super.on(event, handler as any);
    }

    /**
     * 移除事件处理器
     */
    override off<K extends keyof RoomManagerEvents>(event: K): this {
        delete this.eventHandlers[event];
        return super.off(event, this.eventHandlers[event] as any);
    }

    /**
     * 销毁管理器
     */
    destroy(): void {
        // 停止自动清理
        if (this.cleanupTimer) {
            this.cleanupTimer.stop();
            this.cleanupTimer = undefined;
        }

        // 销毁所有房间
        const roomIds = Array.from(this.rooms.keys());
        for (const roomId of roomIds) {
            this.destroyRoom(roomId, '管理器销毁');
        }

        // 清理资源
        this.rooms.clear();
        this.playerRoomMap.clear();
        this.removeAllListeners();
    }

    /**
     * 生成房间ID
     */
    private generateRoomId(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';

        for (let i = 0; i < this.config.roomIdLength; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // 确保ID唯一
        if (this.rooms.has(result)) {
            return this.generateRoomId();
        }

        return result;
    }

    /**
     * 检查房间名称是否存在
     */
    private isNameExists(name: string): boolean {
        for (const room of this.rooms.values()) {
            if (room.getConfig().name === name) {
                return true;
            }
        }
        return false;
    }

    /**
     * 设置房间事件监听
     */
    private setupRoomEvents(room: Room): void {
        room.on('roomDestroyed', (reason) => {
            // 自动清理已销毁的房间
            this.rooms.delete(room.getConfig().id);
            this.updateStats();
        });
    }

    /**
     * 更新统计信息
     */
    private updateStats(): void {
        this.stats.totalRooms = this.rooms.size;
        this.stats.activeRooms = this.rooms.size;
        this.stats.totalPlayers = this.playerRoomMap.size;

        // 重置状态统计
        this.stats.roomsByState = {
            [RoomState.Waiting]: 0,
            [RoomState.Playing]: 0,
            [RoomState.Paused]: 0,
            [RoomState.Finished]: 0
        };

        // 统计各状态房间数量
        for (const room of this.rooms.values()) {
            const state = room.getRoomInfo().state;
            this.stats.roomsByState[state]++;
        }
    }

    /**
     * 启动自动清理
     */
    private startAutoCleanup(): void {
        this.cleanupTimer = Core.schedule(this.config.autoCleanupInterval / 1000, true, this, () => {
            this.performAutoCleanup();
        });
    }

    /**
     * 执行自动清理
     */
    private performAutoCleanup(): void {
        const now = Date.now();
        const roomsToDestroy: string[] = [];

        for (const [roomId, room] of this.rooms) {
            const config = room.getConfig();
            const stats = room.getStats();

            // 清理空房间（如果启用了自动销毁）
            if (config.autoDestroy && room.isEmpty()) {
                roomsToDestroy.push(roomId);
                continue;
            }

            // 清理长时间无活动的已结束房间
            if (stats.state === RoomState.Finished &&
                now - stats.createTime > 3600000) { // 1小时
                roomsToDestroy.push(roomId);
                continue;
            }
        }

        // 执行清理
        for (const roomId of roomsToDestroy) {
            this.destroyRoom(roomId, '自动清理');
        }

        if (roomsToDestroy.length > 0) {
            this.logger.info(`自动清理了 ${roomsToDestroy.length} 个房间`);
        }
    }

    /**
     * 获取管理器状态摘要
     */
    getStatusSummary() {
        const stats = this.getStats();
        const rooms = Array.from(this.rooms.values());

        return {
            stats,
            roomCount: rooms.length,
            playerCount: this.playerRoomMap.size,
            publicRooms: rooms.filter((r) => r.getConfig().isPublic).length,
            privateRooms: rooms.filter((r) => !r.getConfig().isPublic).length,
            fullRooms: rooms.filter((r) => r.isFull()).length,
            emptyRooms: rooms.filter((r) => r.isEmpty()).length,
            averagePlayersPerRoom: rooms.length > 0 ?
                rooms.reduce((sum, r) => sum + r.getAllPlayers().length, 0) / rooms.length : 0
        };
    }

    /**
     * 踢出玩家（从其所在房间）
     */
    kickPlayer(sessionId: string, reason: string = '被管理员踢出'): boolean {
        const room = this.getPlayerRoom(sessionId);
        if (!room) {
            return false;
        }

        return room.kickPlayer(sessionId, reason);
    }

    /**
     * 批量销毁房间
     */
    destroyRoomsBatch(roomIds: string[], reason: string = '批量清理'): number {
        let destroyedCount = 0;

        for (const roomId of roomIds) {
            if (this.destroyRoom(roomId, reason)) {
                destroyedCount++;
            }
        }

        return destroyedCount;
    }

    /**
     * 检查玩家是否在房间中
     */
    isPlayerInRoom(sessionId: string): boolean {
        return this.playerRoomMap.has(sessionId);
    }

    /**
     * 获取玩家所在房间ID
     */
    getPlayerRoomId(sessionId: string): string | undefined {
        return this.playerRoomMap.get(sessionId);
    }
}
