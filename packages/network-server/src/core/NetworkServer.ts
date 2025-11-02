/**
 * 网络服务器核心类
 * 负责服务器的启动/停止、传输层管理和客户端会话管理
 */
import { createLogger, Core } from '@esengine/ecs-framework';
import {
    ITransportConfig,
    MessageType,
    INetworkMessage,
    IConnectMessage,
    IConnectResponseMessage,
    IHeartbeatMessage,
    EventEmitter
} from '@esengine/network-shared';
import { WebSocketTransport } from '../transport/WebSocketTransport';
import { ConnectionManager, ClientSession } from './ConnectionManager';
import { JSONSerializer } from '@esengine/network-shared';
import { MessageManager } from '@esengine/network-shared';
import { ErrorHandler } from '@esengine/network-shared';

/**
 * 网络服务器配置
 */
export interface NetworkServerConfig {
    transport: ITransportConfig;
    authentication: {
        required: boolean;
        timeout: number;
        maxAttempts: number;
    };
    rateLimit: {
        enabled: boolean;
        maxRequestsPerMinute: number;
        banDuration: number;
    };
    features: {
        enableCompression: boolean;
        enableHeartbeat: boolean;
        enableRooms: boolean;
        enableMetrics: boolean;
    };
}

/**
 * 服务器状态
 */
export enum ServerState {
    Stopped = 'stopped',
    Starting = 'starting',
    Running = 'running',
    Stopping = 'stopping',
    Error = 'error'
}

/**
 * 服务器统计信息
 */
export interface ServerStats {
    state: ServerState;
    uptime: number;
    startTime?: number;
    connections: {
        total: number;
        authenticated: number;
        peak: number;
    };
    messages: {
        sent: number;
        received: number;
        errors: number;
    };
    bandwidth: {
        inbound: number;
        outbound: number;
    };
}

/**
 * 网络服务器事件接口
 */
export interface NetworkServerEvents {
    serverStarted: (port: number) => void;
    serverStopped: () => void;
    serverError: (error: Error) => void;
    clientConnected: (session: ClientSession) => void;
    clientDisconnected: (session: ClientSession, reason?: string) => void;
    clientAuthenticated: (session: ClientSession) => void;
    messageReceived: (session: ClientSession, message: INetworkMessage) => void;
    messageSent: (session: ClientSession, message: INetworkMessage) => void;
}

/**
 * 网络服务器核心实现
 */
export class NetworkServer extends EventEmitter {
    private logger = createLogger('NetworkServer');
    private config: NetworkServerConfig;
    private state: ServerState = ServerState.Stopped;
    private stats: ServerStats;

    // 核心组件
    private transport?: WebSocketTransport;
    private connectionManager: ConnectionManager;
    private serializer: JSONSerializer;
    private messageManager: MessageManager;
    private errorHandler: ErrorHandler;

    // 事件处理器
    private eventHandlers: Partial<NetworkServerEvents> = {};

    // 速率限制
    private rateLimitMap: Map<string, { count: number; resetTime: number; banned: boolean }> = new Map();

    /**
     * 构造函数
     */
    constructor(config: Partial<NetworkServerConfig> = {}) {
        super();

        this.config = {
            transport: {
                port: 8080,
                host: '0.0.0.0',
                maxConnections: 1000,
                heartbeatInterval: 30000,
                connectionTimeout: 60000,
                maxMessageSize: 1024 * 1024,
                compression: true,
                ...config.transport
            },
            authentication: {
                required: false,
                timeout: 30000,
                maxAttempts: 3,
                ...config.authentication
            },
            rateLimit: {
                enabled: true,
                maxRequestsPerMinute: 100,
                banDuration: 300000, // 5分钟
                ...config.rateLimit
            },
            features: {
                enableCompression: true,
                enableHeartbeat: true,
                enableRooms: true,
                enableMetrics: true,
                ...config.features
            }
        };

        this.stats = {
            state: ServerState.Stopped,
            uptime: 0,
            connections: {
                total: 0,
                authenticated: 0,
                peak: 0
            },
            messages: {
                sent: 0,
                received: 0,
                errors: 0
            },
            bandwidth: {
                inbound: 0,
                outbound: 0
            }
        };

        // 初始化核心组件
        this.connectionManager = new ConnectionManager({
            heartbeatInterval: this.config.transport.heartbeatInterval,
            heartbeatTimeout: this.config.transport.connectionTimeout
        });

        this.serializer = new JSONSerializer({
            enableTypeChecking: true,
            enableCompression: this.config.features.enableCompression,
            maxMessageSize: this.config.transport.maxMessageSize
        });

        this.messageManager = new MessageManager({
            enableTimestampValidation: true,
            enableMessageDeduplication: true
        });

        this.errorHandler = new ErrorHandler({
            maxRetryAttempts: 3,
            enableAutoRecovery: true
        });

        this.setupEventHandlers();
    }

    /**
     * 启动服务器
     */
    async start(): Promise<void> {
        if (this.state !== ServerState.Stopped) {
            throw new Error(`服务器状态错误: ${this.state}`);
        }

        this.setState(ServerState.Starting);
        this.logger.info('正在启动网络服务器...');

        try {
            // 创建传输层
            this.transport = new WebSocketTransport(this.config.transport);
            this.setupTransportEvents();

            // 启动传输层
            await this.transport.start(
                this.config.transport.port,
                this.config.transport.host
            );

            // 启动连接管理器
            this.connectionManager.start();

            // 记录启动时间
            this.stats.startTime = Date.now();
            this.setState(ServerState.Running);

            this.logger.info(`网络服务器已启动: ${this.config.transport.host}:${this.config.transport.port}`);
            this.eventHandlers.serverStarted?.(this.config.transport.port);

        } catch (error) {
            this.setState(ServerState.Error);
            this.logger.error('启动网络服务器失败:', error);
            this.eventHandlers.serverError?.(error as Error);
            throw error;
        }
    }

    /**
     * 停止服务器
     */
    async stop(): Promise<void> {
        if (this.state === ServerState.Stopped) {
            return;
        }

        this.setState(ServerState.Stopping);
        this.logger.info('正在停止网络服务器...');

        try {
            // 停止连接管理器
            this.connectionManager.stop();

            // 停止传输层
            if (this.transport) {
                await this.transport.stop();
                this.transport = undefined;
            }

            // 清理速率限制数据
            this.rateLimitMap.clear();

            this.setState(ServerState.Stopped);
            this.logger.info('网络服务器已停止');
            this.eventHandlers.serverStopped?.();

        } catch (error) {
            this.logger.error('停止网络服务器失败:', error);
            this.eventHandlers.serverError?.(error as Error);
            throw error;
        }
    }

    /**
     * 发送消息到指定客户端
     */
    sendToClient<T extends INetworkMessage>(clientId: string, message: T): boolean {
        if (!this.transport || this.state !== ServerState.Running) {
            this.logger.warn('服务器未运行，无法发送消息');
            return false;
        }

        const session = this.connectionManager.getSession(clientId);
        if (!session) {
            this.logger.warn(`客户端会话不存在: ${clientId}`);
            return false;
        }

        try {
            const serializedMessage = this.serializer.serialize(message);
            this.transport.send(clientId, serializedMessage.data);

            // 更新统计
            this.stats.messages.sent++;
            this.stats.bandwidth.outbound += serializedMessage.size;

            this.eventHandlers.messageSent?.(session, message);
            return true;

        } catch (error) {
            this.logger.error(`发送消息到客户端 ${clientId} 失败:`, error);
            this.stats.messages.errors++;
            this.errorHandler.handleError(error as Error, `sendToClient:${clientId}`);
            return false;
        }
    }

    /**
     * 广播消息到所有客户端
     */
    broadcast<T extends INetworkMessage>(message: T, exclude?: string[]): number {
        if (!this.transport || this.state !== ServerState.Running) {
            this.logger.warn('服务器未运行，无法广播消息');
            return 0;
        }

        try {
            const serializedMessage = this.serializer.serialize(message);
            this.transport.broadcast(serializedMessage.data, exclude);

            const clientCount = this.connectionManager.getAllSessions().length - (exclude?.length || 0);

            // 更新统计
            this.stats.messages.sent += clientCount;
            this.stats.bandwidth.outbound += serializedMessage.size * clientCount;

            return clientCount;

        } catch (error) {
            this.logger.error('广播消息失败:', error);
            this.stats.messages.errors++;
            this.errorHandler.handleError(error as Error, 'broadcast');
            return 0;
        }
    }

    /**
     * 踢出客户端
     */
    kickClient(clientId: string, reason?: string): boolean {
        const session = this.connectionManager.getSession(clientId);
        if (!session) {
            return false;
        }

        if (this.transport) {
            this.transport.disconnectClient(clientId, reason);
        }

        return this.connectionManager.removeSession(clientId, reason);
    }

    /**
     * 获取服务器状态
     */
    getState(): ServerState {
        return this.state;
    }

    /**
     * 检查服务器是否正在运行
     */
    isRunning(): boolean {
        return this.state === ServerState.Running;
    }

    /**
     * 获取服务器统计信息
     */
    getStats(): ServerStats {
        const currentStats = { ...this.stats };

        if (this.stats.startTime) {
            currentStats.uptime = Date.now() - this.stats.startTime;
        }

        const connectionStats = this.connectionManager.getConnectionStats();
        currentStats.connections.total = connectionStats.totalConnections;
        currentStats.connections.authenticated = connectionStats.authenticatedConnections;

        return currentStats;
    }

    /**
     * 获取所有客户端会话
     */
    getAllSessions(): ClientSession[] {
        return this.connectionManager.getAllSessions();
    }

    /**
     * 获取指定客户端会话
     */
    getSession(clientId: string): ClientSession | undefined {
        return this.connectionManager.getSession(clientId);
    }

    /**
     * 设置事件处理器
     */
    override on<K extends keyof NetworkServerEvents>(event: K, handler: NetworkServerEvents[K]): this {
        this.eventHandlers[event] = handler;
        return this;
    }

    /**
     * 移除事件处理器
     */
    override off<K extends keyof NetworkServerEvents>(event: K): this {
        delete this.eventHandlers[event];
        return this;
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<NetworkServerConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('服务器配置已更新:', newConfig);
    }

    /**
     * 设置服务器状态
     */
    private setState(newState: ServerState): void {
        if (this.state === newState) return;

        const oldState = this.state;
        this.state = newState;
        this.stats.state = newState;

        this.logger.info(`服务器状态变化: ${oldState} -> ${newState}`);
    }

    /**
     * 设置事件处理器
     */
    private setupEventHandlers(): void {
        // 连接管理器事件
        this.connectionManager.on('sessionAdded', (session: ClientSession) => {
            this.eventHandlers.clientConnected?.(session);
            this.updateConnectionPeak();
        });

        this.connectionManager.on('sessionRemoved', (session: ClientSession, reason?: string) => {
            this.eventHandlers.clientDisconnected?.(session, reason);
        });

        this.connectionManager.on('sessionAuthChanged', (session: ClientSession, authenticated: boolean) => {
            if (authenticated) {
                this.eventHandlers.clientAuthenticated?.(session);
            }
        });

        // 错误处理器事件
        this.errorHandler.on('criticalError', (error: any) => {
            this.logger.error('严重错误:', error);
            this.eventHandlers.serverError?.(new Error(error.message));
        });
    }

    /**
     * 设置传输层事件
     */
    private setupTransportEvents(): void {
        if (!this.transport) return;

        this.transport.onConnect((clientInfo) => {
            this.handleClientConnect(clientInfo);
        });

        this.transport.onDisconnect((clientId, reason) => {
            this.handleClientDisconnect(clientId, reason);
        });

        this.transport.onMessage((clientId, data) => {
            this.handleClientMessage(clientId, data);
        });

        this.transport.onError((error) => {
            this.handleTransportError(error);
        });
    }

    /**
     * 处理客户端连接
     */
    private handleClientConnect(clientInfo: any): void {
        try {
            // 检查速率限制
            if (this.isRateLimited(clientInfo.remoteAddress)) {
                this.transport?.disconnectClient(clientInfo.id, '速率限制');
                return;
            }

            // 创建客户端会话
            const session = this.connectionManager.addSession(clientInfo);

            this.logger.info(`客户端已连接: ${clientInfo.id} from ${clientInfo.remoteAddress}`);

        } catch (error) {
            this.logger.error('处理客户端连接失败:', error);
            this.transport?.disconnectClient(clientInfo.id, '服务器错误');
        }
    }

    /**
     * 处理客户端断开连接
     */
    private handleClientDisconnect(clientId: string, reason?: string): void {
        this.connectionManager.removeSession(clientId, reason);
        this.logger.info(`客户端已断开连接: ${clientId}, 原因: ${reason || '未知'}`);
    }

    /**
     * 处理客户端消息
     */
    private handleClientMessage(clientId: string, data: ArrayBuffer | string): void {
        try {
            // 获取客户端会话
            const session = this.connectionManager.getSession(clientId);
            if (!session) {
                this.logger.warn(`收到未知客户端消息: ${clientId}`);
                return;
            }

            // 检查速率限制
            if (this.isRateLimited(session.info.remoteAddress)) {
                this.kickClient(clientId, '速率限制');
                return;
            }

            // 反序列化消息
            const deserializationResult = this.serializer.deserialize<INetworkMessage>(data);
            if (!deserializationResult.isValid) {
                this.logger.debug(`消息反序列化失败 (${clientId}): ${deserializationResult.errors?.join(', ')}`);
                this.stats.messages.errors++;
                return;
            }

            const message = deserializationResult.data;

            // 验证消息
            const validationResult = this.messageManager.validateMessage(message, clientId);
            if (!validationResult.isValid) {
                this.logger.warn(`消息验证失败: ${validationResult.errors.join(', ')}`);
                this.stats.messages.errors++;
                return;
            }

            // 更新心跳
            this.connectionManager.updateHeartbeat(clientId);

            // 更新统计
            this.stats.messages.received++;
            this.stats.bandwidth.inbound += (typeof data === 'string' ? data.length : data.byteLength);

            // 处理不同类型的消息
            this.processMessage(session, message);

            this.eventHandlers.messageReceived?.(session, message);

        } catch (error) {
            this.logger.error(`处理客户端 ${clientId} 消息失败:`, error);
            this.stats.messages.errors++;
            this.errorHandler.handleError(error as Error, `handleClientMessage:${clientId}`);
        }
    }

    /**
     * 处理传输层错误
     */
    private handleTransportError(error: Error): void {
        this.logger.error('传输层错误:', error);
        this.errorHandler.handleError(error, 'transport');
        this.eventHandlers.serverError?.(error);
    }

    /**
     * 处理具体消息类型
     */
    private processMessage(session: ClientSession, message: INetworkMessage): void {
        switch (message.type) {
            case MessageType.CONNECT:
                this.handleConnectMessage(session, message as IConnectMessage);
                break;

            case MessageType.HEARTBEAT:
                this.handleHeartbeatMessage(session, message as IHeartbeatMessage);
                break;

            default:
                // 其他消息类型由外部处理器处理
                break;
        }
    }

    /**
     * 处理连接消息
     */
    private handleConnectMessage(session: ClientSession, message: IConnectMessage): void {
        const response: IConnectResponseMessage = this.messageManager.createMessage(
            MessageType.CONNECT,
            {
                success: true,
                clientId: session.id,
                serverInfo: {
                    name: 'ECS Network Server',
                    version: '1.0.0',
                    maxPlayers: this.config.transport.maxConnections || 1000,
                    currentPlayers: this.connectionManager.getAllSessions().length
                }
            },
            'server'
        );

        this.sendToClient(session.id, response);

        if (this.config.authentication.required) {
            // 设置认证超时
            Core.schedule(this.config.authentication.timeout / 1000, false, this, () => {
                if (!session.authenticated) {
                    this.kickClient(session.id, '认证超时');
                }
            });
        } else {
            // 自动设置为已认证
            this.connectionManager.setSessionAuthenticated(session.id, true);
        }
    }

    /**
     * 处理心跳消息
     */
    private handleHeartbeatMessage(session: ClientSession, message: IHeartbeatMessage): void {
        const response: IHeartbeatMessage = this.messageManager.createMessage(
            MessageType.HEARTBEAT,
            {
                clientTime: message.data.clientTime,
                serverTime: Date.now()
            },
            'server'
        );

        this.sendToClient(session.id, response);
    }

    /**
     * 检查速率限制
     */
    private isRateLimited(address: string): boolean {
        if (!this.config.rateLimit.enabled) {
            return false;
        }

        const now = Date.now();
        const limit = this.rateLimitMap.get(address);

        if (!limit) {
            this.rateLimitMap.set(address, {
                count: 1,
                resetTime: now + 60000, // 1分钟重置
                banned: false
            });
            return false;
        }

        // 检查是否被封禁
        if (limit.banned && now < limit.resetTime) {
            return true;
        }

        // 重置计数
        if (now > limit.resetTime) {
            limit.count = 1;
            limit.resetTime = now + 60000;
            limit.banned = false;
            return false;
        }

        limit.count++;

        // 检查是否超过限制
        if (limit.count > this.config.rateLimit.maxRequestsPerMinute) {
            limit.banned = true;
            limit.resetTime = now + this.config.rateLimit.banDuration;
            this.logger.warn(`客户端 ${address} 被封禁，原因: 速率限制`);
            return true;
        }

        return false;
    }

    /**
     * 更新连接峰值
     */
    private updateConnectionPeak(): void {
        const current = this.connectionManager.getAllSessions().length;
        if (current > this.stats.connections.peak) {
            this.stats.connections.peak = current;
        }
    }
}
