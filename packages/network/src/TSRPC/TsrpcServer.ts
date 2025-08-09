/**
 * TSRPC 服务器
 */
import { WsServer } from 'tsrpc';
import { ServiceType, serviceProto } from './protocols/serviceProto';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('TsrpcServer');

export class TsrpcNetworkServer {
    private _server: WsServer<ServiceType>;
    private _connectedClients = new Map<string, any>();
    private _isRunning: boolean = false;
    private _startTime: number = 0;
    private _totalConnections: number = 0;
    private _maxConcurrentConnections: number = 0;
    private _eventHandlers: Map<string, Function[]> = new Map();
    private _performanceStats = {
        totalMessages: 0,
        totalBytesTransferred: 0,
        averageResponseTime: 0,
        peakConnections: 0,
        uptime: 0
    };

    constructor(port: number = 3000) {
        this._server = new WsServer(serviceProto, {
            port: port,
            // JSON兼容模式
            json: false,
            // 连接日志
            logConnect: true
        });

        this.setupApi();
        this.setupEvents();
    }

    private setupApi() {
        // 实现同步组件API
        this._server.implementApi('SyncComponent', async (call) => {
            try {
                const { entityId, componentType, componentData, timestamp } = call.req;
                
                logger.debug(`收到组件同步: Entity ${entityId}, Component ${componentType}`);
                
                // 广播组件更新给其他客户端
                this.broadcastComponentUpdate(entityId, componentType, componentData, timestamp, call.conn.id);
                
                call.succ({
                    success: true,
                    entityId
                });
            } catch (error) {
                call.error('同步组件失败', { error: (error as Error).message });
            }
        });

        // 实现加入房间API
        this._server.implementApi('JoinRoom', async (call) => {
            try {
                const { roomId, playerName, password } = call.req;
                
                // 检查房间是否存在，如果不存在则自动创建
                let room = this._rooms.get(roomId);
                if (!room) {
                    this.createRoom(roomId, { maxPlayers: 10 });
                    room = this._rooms.get(roomId)!;
                }

                // 检查房间是否已满
                if (room.currentPlayers >= room.maxPlayers) {
                    call.succ({
                        success: false,
                        errorMsg: '房间已满'
                    });
                    return;
                }

                // 检查密码
                if (room.password && room.password !== password) {
                    call.succ({
                        success: false,
                        errorMsg: '密码错误'
                    });
                    return;
                }

                const playerId = Date.now() + Math.floor(Math.random() * 1000); // 更好的ID生成
                
                // 添加玩家到房间
                const playerInfo: PlayerInfo = {
                    playerId,
                    playerName,
                    joinedAt: Date.now()
                };
                room.players.set(call.conn.id, playerInfo);
                room.currentPlayers++;

                // 记录连接
                this._connectedClients.set(call.conn.id, {
                    playerId,
                    roomId,
                    playerName,
                    connId: call.conn.id
                });

                logger.info(`玩家 ${playerName} (ID: ${playerId}) 加入房间 ${roomId} (${room.currentPlayers}/${room.maxPlayers})`);

                // 通知房间内其他玩家
                this.broadcastToRoom(roomId, 'PlayerJoined', {
                    playerId,
                    playerName,
                    timestamp: Date.now()
                }, call.conn.id);

                call.succ({
                    success: true,
                    playerId,
                    roomInfo: {
                        roomId,
                        playerCount: room.currentPlayers,
                        maxPlayers: room.maxPlayers,
                        metadata: room.metadata
                    }
                });
            } catch (error) {
                call.error('加入房间失败', { error: (error as Error).message });
            }
        });
    }

    private setupEvents() {
        // 连接建立
        this._server.flows.postConnectFlow.push((conn) => {
            logger.info(`客户端连接: ${conn.id}`);
            return conn;
        });

        // 连接断开
        this._server.flows.postDisconnectFlow.push((data) => {
            const client = this._connectedClients.get(data.conn.id);
            if (client) {
                logger.info(`客户端断开: ${client.playerName} (${data.conn.id})`);
                
                // 从房间中移除玩家
                const room = this._rooms.get(client.roomId);
                if (room) {
                    room.players.delete(data.conn.id);
                    room.currentPlayers--;
                    
                    // 通知房间内其他玩家
                    this.broadcastToRoom(client.roomId, 'PlayerLeft', {
                        playerId: client.playerId,
                        playerName: client.playerName,
                        timestamp: Date.now()
                    });
                    
                    logger.info(`玩家 ${client.playerName} 离开房间 ${client.roomId} (${room.currentPlayers}/${room.maxPlayers})`);
                    
                    // 如果房间空了，可选择性删除房间
                    if (room.currentPlayers === 0) {
                        logger.info(`房间 ${client.roomId} 已空，保留等待新玩家`);
                        // 可以选择删除空房间: this._rooms.delete(client.roomId);
                    }
                }
                
                this._connectedClients.delete(data.conn.id);
            }
            return data;
        });
    }

    /**
     * 广播组件更新给其他客户端
     */
    private broadcastComponentUpdate(entityId: number, componentType: string, componentData: any, timestamp: number, excludeConnId?: string) {
        const updateMsg = {
            entityId,
            componentType,
            componentData,
            timestamp
        };

        // 给所有其他客户端发送更新消息
        const targetConns = this._server.connections.filter(conn => conn.id !== excludeConnId);
        this._server.broadcastMsg('ComponentUpdate', updateMsg, targetConns);
    }

    /**
     * 启动服务器
     */
    async start(): Promise<void> {
        await this._server.start();
        logger.info(`TSRPC服务器已启动，端口: ${this._server.options.port}`);
    }

    /**
     * 停止服务器
     */
    async stop(): Promise<void> {
        await this._server.stop();
        logger.info('TSRPC服务器已停止');
    }

    /**
     * 获取连接的客户端数量
     */
    get clientCount(): number {
        return this._connectedClients.size;
    }

    /**
     * 获取服务器实例
     */
    get server(): WsServer<ServiceType> {
        return this._server;
    }

    /**
     * 高级房间管理功能
     */
    
    /**
     * 创建房间
     */
    public createRoom(roomId: string, options?: {
        maxPlayers?: number;
        password?: string;
        metadata?: Record<string, any>;
    }): boolean {
        if (this._rooms.has(roomId)) {
            return false; // 房间已存在
        }

        const room: RoomInfo = {
            roomId,
            maxPlayers: options?.maxPlayers || 10,
            currentPlayers: 0,
            players: new Map(),
            created: Date.now(),
            password: options?.password,
            metadata: options?.metadata || {}
        };

        this._rooms.set(roomId, room);
        logger.info(`创建房间: ${roomId}, 最大玩家数: ${room.maxPlayers}`);
        return true;
    }

    /**
     * 删除房间
     */
    public removeRoom(roomId: string): boolean {
        const room = this._rooms.get(roomId);
        if (!room) {
            return false;
        }

        // 通知房间内的所有玩家
        for (const [connId, playerInfo] of room.players) {
            const conn = this._server.connections.find(c => c.id === connId);
            if (conn) {
                this._server.broadcastMsg('RoomClosed', { roomId, reason: '房间已关闭' }, [conn]);
                // 从已连接客户端列表中移除
                this._connectedClients.delete(connId);
            }
        }

        this._rooms.delete(roomId);
        logger.info(`删除房间: ${roomId}`);
        return true;
    }

    /**
     * 获取房间列表
     */
    public getRoomList(includePassword: boolean = false): Array<{
        roomId: string;
        currentPlayers: number;
        maxPlayers: number;
        hasPassword: boolean;
        metadata: Record<string, any>;
    }> {
        const roomList: Array<{
            roomId: string;
            currentPlayers: number;
            maxPlayers: number;
            hasPassword: boolean;
            metadata: Record<string, any>;
        }> = [];

        for (const room of this._rooms.values()) {
            roomList.push({
                roomId: room.roomId,
                currentPlayers: room.currentPlayers,
                maxPlayers: room.maxPlayers,
                hasPassword: !!room.password,
                metadata: room.metadata
            });
        }

        return roomList;
    }

    /**
     * 获取房间详情
     */
    public getRoomInfo(roomId: string): RoomInfo | null {
        return this._rooms.get(roomId) || null;
    }

    /**
     * 房间内广播消息
     */
    public broadcastToRoom(roomId: string, message: string, data: any, excludeConnId?: string): void {
        const room = this._rooms.get(roomId);
        if (!room) {
            logger.warn(`房间不存在: ${roomId}`);
            return;
        }

        const targetConns = this._server.connections.filter(conn => {
            return room.players.has(conn.id) && conn.id !== excludeConnId;
        });

        if (targetConns.length > 0) {
            // 使用对应的房间消息类型
            switch (message) {
                case 'PlayerJoined':
                    this._server.broadcastMsg('PlayerJoined', data, targetConns);
                    break;
                case 'PlayerLeft':
                    this._server.broadcastMsg('PlayerLeft', data, targetConns);
                    break;
                case 'PlayerKicked':
                    this._server.broadcastMsg('PlayerKicked', data, targetConns);
                    break;
                default:
                    // 其他消息使用ComponentUpdate作为通用消息
                    this._server.broadcastMsg('ComponentUpdate', {
                        entityId: 0,
                        componentType: message,
                        componentData: data,
                        timestamp: Date.now()
                    }, targetConns);
                    break;
            }
        }
    }

    /**
     * 踢出玩家
     */
    public kickPlayer(roomId: string, playerId: number, reason?: string): boolean {
        const room = this._rooms.get(roomId);
        if (!room) {
            return false;
        }

        let targetConnId: string | null = null;
        for (const [connId, playerInfo] of room.players) {
            if (playerInfo.playerId === playerId) {
                targetConnId = connId;
                break;
            }
        }

        if (!targetConnId) {
            return false;
        }

        // 从房间中移除玩家
        room.players.delete(targetConnId);
        room.currentPlayers--;

        // 从已连接客户端列表中移除
        this._connectedClients.delete(targetConnId);

        // 通知被踢出的玩家
        const conn = this._server.connections.find(c => c.id === targetConnId);
        if (conn) {
            this.broadcastToRoom(roomId, 'PlayerKicked', {
                playerId,
                reason: reason || '被踢出房间'
            });
            
            // 断开连接
            conn.close(reason);
        }

        logger.info(`踢出玩家: ${playerId} 从房间 ${roomId}, 原因: ${reason || '未指定'}`);
        return true;
    }

    /**
     * 设置房间元数据
     */
    public setRoomMetadata(roomId: string, metadata: Record<string, any>): boolean {
        const room = this._rooms.get(roomId);
        if (!room) {
            return false;
        }

        room.metadata = { ...room.metadata, ...metadata };
        logger.debug(`更新房间元数据: ${roomId}`, metadata);
        return true;
    }

    /**
     * 房间状态统计
     */
    public getRoomStats(): {
        totalRooms: number;
        totalPlayers: number;
        averagePlayersPerRoom: number;
        roomDetails: Array<{
            roomId: string;
            players: number;
            maxPlayers: number;
            uptime: number;
        }>;
    } {
        let totalPlayers = 0;
        const roomDetails: Array<{
            roomId: string;
            players: number;
            maxPlayers: number;
            uptime: number;
        }> = [];

        for (const room of this._rooms.values()) {
            totalPlayers += room.currentPlayers;
            roomDetails.push({
                roomId: room.roomId,
                players: room.currentPlayers,
                maxPlayers: room.maxPlayers,
                uptime: Date.now() - room.created
            });
        }

        return {
            totalRooms: this._rooms.size,
            totalPlayers,
            averagePlayersPerRoom: this._rooms.size > 0 ? totalPlayers / this._rooms.size : 0,
            roomDetails
        };
    }

    // 添加房间映射和房间信息接口
    private _rooms = new Map<string, RoomInfo>();

    /**
     * 启动服务器
     */
    public async start(): Promise<void> {
        try {
            await this._server.start();
            this._isRunning = true;
            this._startTime = Date.now();
            logger.info(`TSRPC服务器已启动，端口: ${this._server.options.port}`);
            this.emit('started');
        } catch (error) {
            logger.error('启动TSRPC服务器失败:', error);
            this.emit('startError', error);
            throw error;
        }
    }

    /**
     * 停止服务器
     */
    public async stop(): Promise<void> {
        try {
            if (this._isRunning) {
                await this._server.stop();
                this._isRunning = false;
                this._startTime = 0;
                this._connectedClients.clear();
                this._rooms.clear();
                logger.info('TSRPC服务器已停止');
                this.emit('stopped');
            }
        } catch (error) {
            logger.error('停止TSRPC服务器失败:', error);
            this.emit('stopError', error);
            throw error;
        }
    }

    /**
     * 获取服务器统计信息
     */
    public getStats(): {
        isRunning: boolean;
        uptime: number;
        connectedClients: number;
        totalConnections: number;
        maxConcurrentConnections: number;
        rooms: number;
        performance: typeof this._performanceStats;
    } {
        this._performanceStats.uptime = this._isRunning ? Date.now() - this._startTime : 0;
        this._performanceStats.peakConnections = Math.max(
            this._maxConcurrentConnections,
            this._connectedClients.size
        );

        return {
            isRunning: this._isRunning,
            uptime: this._performanceStats.uptime,
            connectedClients: this._connectedClients.size,
            totalConnections: this._totalConnections,
            maxConcurrentConnections: this._maxConcurrentConnections,
            rooms: this._rooms.size,
            performance: { ...this._performanceStats }
        };
    }

    /**
     * 广播消息给所有客户端
     */
    public broadcastToAll(msgName: string, msg: any, excludeConnId?: string): void {
        for (const [connId, clientInfo] of this._connectedClients) {
            if (excludeConnId && connId === excludeConnId) {
                continue;
            }
            try {
                this._server.sendMsg(clientInfo.conn, msgName, msg);
                this._performanceStats.totalMessages++;
            } catch (error) {
                logger.error(`向客户端 ${connId} 广播消息失败:`, error);
            }
        }
    }

    /**
     * 向房间内广播消息
     */
    public broadcastToRoom(roomId: string, msgName: string, msg: any, excludeConnId?: string): void {
        const room = this._rooms.get(roomId);
        if (!room) {
            logger.warn(`房间 ${roomId} 不存在`);
            return;
        }

        for (const [connId] of room.players) {
            if (excludeConnId && connId === excludeConnId) {
                continue;
            }
            
            const clientInfo = this._connectedClients.get(connId);
            if (clientInfo) {
                try {
                    this._server.sendMsg(clientInfo.conn, msgName, msg);
                    this._performanceStats.totalMessages++;
                } catch (error) {
                    logger.error(`向房间 ${roomId} 客户端 ${connId} 广播消息失败:`, error);
                }
            }
        }
    }

    /**
     * 添加事件监听器
     */
    public on(event: string, handler: Function): void {
        if (!this._eventHandlers.has(event)) {
            this._eventHandlers.set(event, []);
        }
        this._eventHandlers.get(event)!.push(handler);
    }

    /**
     * 移除事件监听器
     */
    public off(event: string, handler: Function): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    private emit(event: string, ...args: any[]): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(...args);
                } catch (error) {
                    logger.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 获取房间列表
     */
    public getRooms(): Array<{
        roomId: string;
        currentPlayers: number;
        maxPlayers: number;
        created: number;
        hasPassword: boolean;
    }> {
        return Array.from(this._rooms.values()).map(room => ({
            roomId: room.roomId,
            currentPlayers: room.currentPlayers,
            maxPlayers: room.maxPlayers,
            created: room.created,
            hasPassword: !!room.password
        }));
    }

    /**
     * 强制踢出玩家
     */
    public kickPlayer(connId: string, reason?: string): boolean {
        const clientInfo = this._connectedClients.get(connId);
        if (clientInfo) {
            try {
                // 发送踢出通知
                this._server.sendMsg(clientInfo.conn, 'PlayerKicked', {
                    reason: reason || '被服务器踢出'
                });
                
                // 断开连接
                clientInfo.conn.close();
                logger.info(`踢出玩家 ${connId}: ${reason || '未指定原因'}`);
                return true;
            } catch (error) {
                logger.error(`踢出玩家 ${connId} 失败:`, error);
                return false;
            }
        }
        return false;
    }

    /**
     * 获取在线玩家列表
     */
    public getOnlinePlayers(): Array<{
        connId: string;
        playerId?: number;
        playerName?: string;
        joinedAt: number;
        roomId?: string;
    }> {
        const players: Array<{
            connId: string;
            playerId?: number;
            playerName?: string;
            joinedAt: number;
            roomId?: string;
        }> = [];

        for (const [connId, clientInfo] of this._connectedClients) {
            players.push({
                connId,
                playerId: clientInfo.playerId,
                playerName: clientInfo.playerName,
                joinedAt: clientInfo.joinedAt,
                roomId: clientInfo.roomId
            });
        }

        return players;
    }
}

/**
 * 房间信息接口
 */
interface RoomInfo {
    roomId: string;
    maxPlayers: number;
    currentPlayers: number;
    players: Map<string, PlayerInfo>; // connId -> PlayerInfo
    created: number;
    password?: string;
    metadata: Record<string, any>;
}

/**
 * 玩家信息接口
 */
interface PlayerInfo {
    playerId: number;
    playerName?: string;
    joinedAt: number;
}