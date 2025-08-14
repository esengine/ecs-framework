/**
 * 房间基础实现
 * 提供房间的基本功能，包括玩家管理和房间状态管理
 */
import { createLogger } from '@esengine/ecs-framework';
import { RoomState, IRoomInfo, INetworkMessage, EventEmitter } from '@esengine/network-shared';
import { ClientSession } from '../core/ConnectionManager';

/**
 * 房间配置
 */
export interface RoomConfig {
    id: string;
    name: string;
    maxPlayers: number;
    isPublic: boolean;
    password?: string;
    metadata?: Record<string, any>;
    autoDestroy: boolean;          // 是否在空房间时自动销毁
    customData?: Record<string, any>;
}

/**
 * 玩家信息
 */
export interface PlayerInfo {
    sessionId: string;
    name: string;
    isHost: boolean;
    joinTime: number;
    customData?: Record<string, any>;
}

/**
 * 房间事件接口
 */
export interface RoomEvents {
    playerJoined: (player: PlayerInfo) => void;
    playerLeft: (player: PlayerInfo, reason?: string) => void;
    hostChanged: (oldHost: PlayerInfo, newHost: PlayerInfo) => void;
    stateChanged: (oldState: RoomState, newState: RoomState) => void;
    messageReceived: (message: INetworkMessage, fromPlayer: PlayerInfo) => void;
    roomDestroyed: (reason: string) => void;
}

/**
 * 房间统计信息
 */
export interface RoomStats {
    id: string;
    playerCount: number;
    maxPlayers: number;
    createTime: number;
    totalPlayersJoined: number;
    messagesSent: number;
    messagesReceived: number;
    state: RoomState;
}

/**
 * 房间类
 */
export class Room extends EventEmitter {
    private logger = createLogger('Room');
    private config: RoomConfig;
    private state: RoomState = RoomState.Waiting;
    private players: Map<string, PlayerInfo> = new Map();
    private hostId?: string;
    private createTime: number = Date.now();
    private stats: RoomStats;

    // 事件处理器
    private eventHandlers: Partial<RoomEvents> = {};

    /**
     * 构造函数
     */
    constructor(config: RoomConfig) {
        super();
        this.config = { ...config };
        
        this.stats = {
            id: config.id,
            playerCount: 0,
            maxPlayers: config.maxPlayers,
            createTime: this.createTime,
            totalPlayersJoined: 0,
            messagesSent: 0,
            messagesReceived: 0,
            state: this.state
        };

        this.logger.info(`房间已创建: ${config.id} (${config.name})`);
    }

    /**
     * 玩家加入房间
     */
    addPlayer(session: ClientSession, playerName?: string, password?: string): boolean {
        // 检查房间是否已满
        if (this.players.size >= this.config.maxPlayers) {
            this.logger.warn(`房间已满，拒绝玩家加入: ${session.id}`);
            return false;
        }

        // 检查玩家是否已在房间中
        if (this.players.has(session.id)) {
            this.logger.warn(`玩家已在房间中: ${session.id}`);
            return false;
        }

        // 检查房间密码
        if (this.config.password && password !== this.config.password) {
            this.logger.warn(`密码错误，拒绝玩家加入: ${session.id}`);
            return false;
        }

        // 检查房间状态
        if (this.state === RoomState.Finished) {
            this.logger.warn(`房间已结束，拒绝玩家加入: ${session.id}`);
            return false;
        }

        // 创建玩家信息
        const player: PlayerInfo = {
            sessionId: session.id,
            name: playerName || `Player_${session.id.substr(-6)}`,
            isHost: this.players.size === 0, // 第一个加入的玩家成为房主
            joinTime: Date.now(),
            customData: {}
        };

        // 添加玩家到房间
        this.players.set(session.id, player);
        this.stats.playerCount = this.players.size;
        this.stats.totalPlayersJoined++;

        // 设置房主
        if (player.isHost) {
            this.hostId = session.id;
        }

        this.logger.info(`玩家加入房间: ${player.name} (${session.id}) -> 房间 ${this.config.id}`);
        
        // 触发事件
        this.eventHandlers.playerJoined?.(player);
        this.emit('playerJoined', player);

        return true;
    }

    /**
     * 玩家离开房间
     */
    removePlayer(sessionId: string, reason?: string): boolean {
        const player = this.players.get(sessionId);
        if (!player) {
            return false;
        }

        // 从房间移除玩家
        this.players.delete(sessionId);
        this.stats.playerCount = this.players.size;

        this.logger.info(`玩家离开房间: ${player.name} (${sessionId}) <- 房间 ${this.config.id}, 原因: ${reason || '未知'}`);

        // 如果离开的是房主，需要转移房主权限
        if (player.isHost && this.players.size > 0) {
            this.transferHost();
        }

        // 触发事件
        this.eventHandlers.playerLeft?.(player, reason);
        this.emit('playerLeft', player, reason);

        // 检查是否需要自动销毁房间
        if (this.config.autoDestroy && this.players.size === 0) {
            this.destroy('房间为空');
        }

        return true;
    }

    /**
     * 获取玩家信息
     */
    getPlayer(sessionId: string): PlayerInfo | undefined {
        return this.players.get(sessionId);
    }

    /**
     * 获取所有玩家
     */
    getAllPlayers(): PlayerInfo[] {
        return Array.from(this.players.values());
    }

    /**
     * 获取房主
     */
    getHost(): PlayerInfo | undefined {
        return this.hostId ? this.players.get(this.hostId) : undefined;
    }

    /**
     * 转移房主权限
     */
    transferHost(newHostId?: string): boolean {
        if (this.players.size === 0) {
            return false;
        }

        const oldHost = this.getHost();
        let newHost: PlayerInfo | undefined;

        if (newHostId) {
            newHost = this.players.get(newHostId);
            if (!newHost) {
                this.logger.warn(`指定的新房主不存在: ${newHostId}`);
                return false;
            }
        } else {
            // 自动选择第一个玩家作为新房主
            newHost = Array.from(this.players.values())[0];
        }

        // 更新房主信息
        if (oldHost) {
            oldHost.isHost = false;
        }
        newHost.isHost = true;
        this.hostId = newHost.sessionId;

        this.logger.info(`房主权限转移: ${oldHost?.name || 'unknown'} -> ${newHost.name}`);

        // 触发事件
        if (oldHost) {
            this.eventHandlers.hostChanged?.(oldHost, newHost);
            this.emit('hostChanged', oldHost, newHost);
        }

        return true;
    }

    /**
     * 设置房间状态
     */
    setState(newState: RoomState): void {
        if (this.state === newState) {
            return;
        }

        const oldState = this.state;
        this.state = newState;
        this.stats.state = newState;

        this.logger.info(`房间状态变化: ${oldState} -> ${newState}`);

        // 触发事件
        this.eventHandlers.stateChanged?.(oldState, newState);
        this.emit('stateChanged', oldState, newState);
    }

    /**
     * 处理房间消息
     */
    handleMessage(message: INetworkMessage, fromSessionId: string): void {
        const player = this.players.get(fromSessionId);
        if (!player) {
            this.logger.warn(`收到非房间成员的消息: ${fromSessionId}`);
            return;
        }

        this.stats.messagesReceived++;

        // 触发事件
        this.eventHandlers.messageReceived?.(message, player);
        this.emit('messageReceived', message, player);
    }

    /**
     * 广播消息到房间内所有玩家
     */
    broadcast(message: INetworkMessage, exclude?: string[], onSend?: (sessionId: string) => void): void {
        const excludeSet = new Set(exclude || []);
        let sentCount = 0;

        for (const player of this.players.values()) {
            if (!excludeSet.has(player.sessionId)) {
                if (onSend) {
                    onSend(player.sessionId);
                    sentCount++;
                }
            }
        }

        this.stats.messagesSent += sentCount;
    }

    /**
     * 检查玩家是否在房间中
     */
    hasPlayer(sessionId: string): boolean {
        return this.players.has(sessionId);
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
     * 获取房间信息
     */
    getRoomInfo(): IRoomInfo {
        return {
            id: this.config.id,
            name: this.config.name,
            playerCount: this.players.size,
            maxPlayers: this.config.maxPlayers,
            state: this.state,
            metadata: this.config.metadata
        };
    }

    /**
     * 获取房间配置
     */
    getConfig(): RoomConfig {
        return { ...this.config };
    }

    /**
     * 获取房间统计信息
     */
    getStats(): RoomStats {
        return {
            ...this.stats,
            playerCount: this.players.size
        };
    }

    /**
     * 更新房间配置
     */
    updateConfig(updates: Partial<RoomConfig>): void {
        Object.assign(this.config, updates);
        this.logger.info(`房间配置已更新: ${this.config.id}`, updates);
    }

    /**
     * 设置玩家自定义数据
     */
    setPlayerData(sessionId: string, data: Record<string, any>): boolean {
        const player = this.players.get(sessionId);
        if (!player) {
            return false;
        }

        player.customData = { ...player.customData, ...data };
        return true;
    }

    /**
     * 获取房间运行时间
     */
    getUptime(): number {
        return Date.now() - this.createTime;
    }

    /**
     * 验证密码
     */
    validatePassword(password?: string): boolean {
        if (!this.config.password) {
            return true; // 无密码房间
        }
        return password === this.config.password;
    }

    /**
     * 设置事件处理器
     */
    override on<K extends keyof RoomEvents>(event: K, handler: RoomEvents[K]): this {
        this.eventHandlers[event] = handler;
        return super.on(event, handler as any);
    }

    /**
     * 移除事件处理器
     */
    override off<K extends keyof RoomEvents>(event: K): this {
        delete this.eventHandlers[event];
        return super.off(event, this.eventHandlers[event] as any);
    }

    /**
     * 销毁房间
     */
    destroy(reason: string = '房间关闭'): void {
        this.logger.info(`房间销毁: ${this.config.id}, 原因: ${reason}`);

        // 清理所有玩家
        const playersToRemove = Array.from(this.players.keys());
        for (const sessionId of playersToRemove) {
            this.removePlayer(sessionId, reason);
        }

        // 触发销毁事件
        this.eventHandlers.roomDestroyed?.(reason);
        this.emit('roomDestroyed', reason);

        // 清理资源
        this.players.clear();
        this.removeAllListeners();
    }

    /**
     * 获取房间详细状态
     */
    getDetailedStatus() {
        return {
            config: this.getConfig(),
            info: this.getRoomInfo(),
            stats: this.getStats(),
            players: this.getAllPlayers(),
            host: this.getHost(),
            uptime: this.getUptime(),
            isEmpty: this.isEmpty(),
            isFull: this.isFull()
        };
    }

    /**
     * 踢出玩家
     */
    kickPlayer(sessionId: string, reason: string = '被踢出房间'): boolean {
        if (!this.hasPlayer(sessionId)) {
            return false;
        }

        return this.removePlayer(sessionId, reason);
    }

    /**
     * 暂停房间
     */
    pause(): void {
        if (this.state === RoomState.Playing) {
            this.setState(RoomState.Paused);
        }
    }

    /**
     * 恢复房间
     */
    resume(): void {
        if (this.state === RoomState.Paused) {
            this.setState(RoomState.Playing);
        }
    }

    /**
     * 开始游戏
     */
    startGame(): boolean {
        if (this.state !== RoomState.Waiting) {
            return false;
        }

        if (this.players.size === 0) {
            return false;
        }

        this.setState(RoomState.Playing);
        return true;
    }

    /**
     * 结束游戏
     */
    endGame(): boolean {
        if (this.state !== RoomState.Playing && this.state !== RoomState.Paused) {
            return false;
        }

        this.setState(RoomState.Finished);
        return true;
    }

    /**
     * 重置房间到等待状态
     */
    reset(): void {
        this.setState(RoomState.Waiting);
        // 可以根据需要重置其他状态
    }
}