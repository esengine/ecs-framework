/**
 * 网络客户端核心类
 * 负责客户端连接管理、服务器通信和本地状态同步
 */
import { createLogger } from '@esengine/ecs-framework';
import {
    IConnectionOptions,
    ConnectionState,
    IConnectionStats,
    MessageType,
    INetworkMessage,
    IConnectMessage,
    IConnectResponseMessage,
    IHeartbeatMessage,
    NetworkErrorType,
    EventEmitter
} from '@esengine/network-shared';
import { WebSocketClient } from '../transport/WebSocketClient';
import { ReconnectionManager } from '../transport/ReconnectionManager';
import { JSONSerializer } from '@esengine/network-shared';
import { MessageManager } from '@esengine/network-shared';
import { ErrorHandler } from '@esengine/network-shared';
import { HeartbeatManager } from '@esengine/network-shared';

/**
 * 网络客户端配置
 */
export interface NetworkClientConfig {
    connection: IConnectionOptions;
    features: {
        enableHeartbeat: boolean;
        enableReconnection: boolean;
        enableCompression: boolean;
        enableMessageQueue: boolean;
    };
    authentication: {
        autoAuthenticate: boolean;
        credentials?: Record<string, any>;
    };
}

/**
 * 客户端状态
 */
export enum ClientState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Authenticating = 'authenticating',
    Authenticated = 'authenticated',
    Reconnecting = 'reconnecting',
    Error = 'error'
}

/**
 * 客户端统计信息
 */
export interface ClientStats {
    state: ClientState;
    connectionState: ConnectionState;
    connectionTime?: number;
    lastConnectTime?: number;
    reconnectAttempts: number;
    totalReconnects: number;
    messages: {
        sent: number;
        received: number;
        queued: number;
        errors: number;
    };
    latency?: number;
    uptime: number;
}

/**
 * 网络客户端事件接口
 */
export interface NetworkClientEvents {
    connected: () => void;
    disconnected: (reason?: string) => void;
    authenticated: (clientId: string) => void;
    authenticationFailed: (error: string) => void;
    reconnecting: (attempt: number) => void;
    reconnected: () => void;
    reconnectionFailed: () => void;
    messageReceived: (message: INetworkMessage) => void;
    error: (error: Error) => void;
    stateChanged: (oldState: ClientState, newState: ClientState) => void;
}

/**
 * 网络客户端核心实现
 */
export class NetworkClient extends EventEmitter {
    private logger = createLogger('NetworkClient');
    private config: NetworkClientConfig;
    private state: ClientState = ClientState.Disconnected;
    private stats: ClientStats;
    private clientId?: string;
    private connectTime?: number;

    // 核心组件
    private transport?: WebSocketClient;
    private reconnectionManager: ReconnectionManager;
    private serializer: JSONSerializer;
    private messageManager: MessageManager;
    private errorHandler: ErrorHandler;
    private heartbeatManager: HeartbeatManager;

    // 事件处理器
    private eventHandlers: Partial<NetworkClientEvents> = {};

    // 消息队列
    private messageQueue: INetworkMessage[] = [];
    private isProcessingQueue = false;

    /**
     * 构造函数
     */
    constructor(config: Partial<NetworkClientConfig> = {}) {
        super();

        this.config = {
            connection: {
                timeout: 10000,
                reconnectInterval: 3000,
                maxReconnectAttempts: 5,
                autoReconnect: true,
                ...config.connection
            },
            features: {
                enableHeartbeat: true,
                enableReconnection: true,
                enableCompression: true,
                enableMessageQueue: true,
                ...config.features
            },
            authentication: {
                autoAuthenticate: true,
                ...config.authentication
            }
        };

        this.stats = {
            state: ClientState.Disconnected,
            connectionState: ConnectionState.Disconnected,
            reconnectAttempts: 0,
            totalReconnects: 0,
            messages: {
                sent: 0,
                received: 0,
                queued: 0,
                errors: 0
            },
            uptime: 0
        };

        // 初始化核心组件
        this.reconnectionManager = new ReconnectionManager({
            enabled: this.config.features.enableReconnection,
            maxAttempts: this.config.connection.maxReconnectAttempts,
            initialDelay: this.config.connection.reconnectInterval
        });

        this.serializer = new JSONSerializer({
            enableTypeChecking: true,
            enableCompression: this.config.features.enableCompression
        });

        this.messageManager = new MessageManager({
            enableTimestampValidation: true,
            enableMessageDeduplication: true
        });

        this.errorHandler = new ErrorHandler({
            maxRetryAttempts: 3,
            enableAutoRecovery: true
        });

        this.heartbeatManager = new HeartbeatManager({
            interval: 30000,
            timeout: 60000,
            enableLatencyMeasurement: true
        });

        this.setupEventHandlers();
    }

    /**
     * 连接到服务器
     */
    async connect(url: string, options?: IConnectionOptions): Promise<void> {
        if (this.state === ClientState.Connected || this.state === ClientState.Connecting) {
            this.logger.warn('客户端已连接或正在连接');
            return;
        }

        this.setState(ClientState.Connecting);
        
        try {
            // 合并连接选项
            const connectionOptions = { ...this.config.connection, ...options };

            // 创建传输层
            this.transport = new WebSocketClient();
            this.setupTransportEvents();

            // 连接到服务器
            await this.transport.connect(url, connectionOptions);

            this.setState(ClientState.Connected);
            this.connectTime = Date.now();
            this.stats.lastConnectTime = this.connectTime;

            this.logger.info(`已连接到服务器: ${url}`);
            
            // 启动心跳
            if (this.config.features.enableHeartbeat) {
                this.startHeartbeat();
            }

            // 发送连接消息
            await this.sendConnectMessage();

            // 处理队列中的消息
            if (this.config.features.enableMessageQueue) {
                this.processMessageQueue();
            }

            this.eventHandlers.connected?.();

        } catch (error) {
            this.setState(ClientState.Error);
            this.logger.error('连接失败:', error);
            this.handleError(error as Error);
            throw error;
        }
    }

    /**
     * 断开连接
     */
    async disconnect(reason?: string): Promise<void> {
        if (this.state === ClientState.Disconnected) {
            return;
        }

        this.logger.info(`断开连接: ${reason || '用户主动断开'}`);

        // 停止重连
        this.reconnectionManager.stopReconnection('用户主动断开');

        // 停止心跳
        this.heartbeatManager.stop();

        // 断开传输层连接
        if (this.transport) {
            await this.transport.disconnect(reason);
            this.transport = undefined;
        }

        this.setState(ClientState.Disconnected);
        this.connectTime = undefined;
        this.clientId = undefined;

        this.eventHandlers.disconnected?.(reason);
    }

    /**
     * 发送消息
     */
    send<T extends INetworkMessage>(message: T): boolean {
        if (!this.transport || this.state !== ClientState.Connected && this.state !== ClientState.Authenticated) {
            if (this.config.features.enableMessageQueue) {
                this.queueMessage(message);
                return true;
            } else {
                this.logger.warn('客户端未连接，无法发送消息');
                return false;
            }
        }

        try {
            const serializedMessage = this.serializer.serialize(message);
            this.transport.send(serializedMessage.data);

            this.stats.messages.sent++;
            return true;

        } catch (error) {
            this.logger.error('发送消息失败:', error);
            this.stats.messages.errors++;
            this.handleError(error as Error);
            return false;
        }
    }

    /**
     * 获取客户端状态
     */
    getState(): ClientState {
        return this.state;
    }

    /**
     * 获取连接状态
     */
    getConnectionState(): ConnectionState {
        return this.transport?.getConnectionState() || ConnectionState.Disconnected;
    }

    /**
     * 获取客户端统计信息
     */
    getStats(): ClientStats {
        const currentStats = { ...this.stats };
        
        currentStats.connectionState = this.getConnectionState();
        currentStats.reconnectAttempts = this.reconnectionManager.getState().currentAttempt;
        currentStats.totalReconnects = this.reconnectionManager.getStats().successfulReconnections;
        
        if (this.connectTime) {
            currentStats.uptime = Date.now() - this.connectTime;
        }

        const transportStats = this.transport?.getStats();
        if (transportStats) {
            currentStats.latency = transportStats.latency;
        }

        currentStats.messages.queued = this.messageQueue.length;

        return currentStats;
    }

    /**
     * 获取客户端ID
     */
    getClientId(): string | undefined {
        return this.clientId;
    }

    /**
     * 检查是否已连接
     */
    isConnected(): boolean {
        return this.state === ClientState.Connected || this.state === ClientState.Authenticated;
    }

    /**
     * 检查是否已认证
     */
    isAuthenticated(): boolean {
        return this.state === ClientState.Authenticated;
    }

    /**
     * 手动触发重连
     */
    reconnect(): void {
        if (this.config.features.enableReconnection) {
            this.reconnectionManager.forceReconnect();
        }
    }

    /**
     * 设置事件处理器
     */
    override on<K extends keyof NetworkClientEvents>(event: K, handler: NetworkClientEvents[K]): this {
        this.eventHandlers[event] = handler;
        return this;
    }

    /**
     * 移除事件处理器
     */
    override off<K extends keyof NetworkClientEvents>(event: K): this {
        delete this.eventHandlers[event];
        return this;
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<NetworkClientConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('客户端配置已更新:', newConfig);
    }

    /**
     * 销毁客户端
     */
    async destroy(): Promise<void> {
        await this.disconnect('客户端销毁');
        
        // 清理组件
        this.reconnectionManager.reset();
        this.heartbeatManager.stop();
        this.messageQueue.length = 0;
        
        this.removeAllListeners();
    }

    /**
     * 设置客户端状态
     */
    private setState(newState: ClientState): void {
        if (this.state === newState) return;

        const oldState = this.state;
        this.state = newState;
        this.stats.state = newState;

        this.logger.debug(`客户端状态变化: ${oldState} -> ${newState}`);
        this.eventHandlers.stateChanged?.(oldState, newState);
    }

    /**
     * 设置事件处理器
     */
    private setupEventHandlers(): void {
        // 重连管理器事件
        this.reconnectionManager.on('reconnectStarted', (attempt) => {
            this.setState(ClientState.Reconnecting);
            this.eventHandlers.reconnecting?.(attempt);
        });

        this.reconnectionManager.on('reconnectSucceeded', () => {
            this.setState(ClientState.Connected);
            this.stats.totalReconnects++;
            this.eventHandlers.reconnected?.();
        });

        this.reconnectionManager.on('maxAttemptsReached', () => {
            this.setState(ClientState.Error);
            this.eventHandlers.reconnectionFailed?.();
        });

        // 心跳管理器事件
        this.heartbeatManager.on('healthStatusChanged', (isHealthy) => {
            if (!isHealthy && this.config.features.enableReconnection) {
                this.logger.warn('连接不健康，开始重连');
                this.reconnectionManager.startReconnection();
            }
        });

        // 错误处理器事件
        this.errorHandler.on('criticalError', (error) => {
            this.setState(ClientState.Error);
            this.eventHandlers.error?.(new Error(error.message));
        });

        // 设置重连回调
        this.reconnectionManager.setReconnectCallback(async () => {
            if (this.transport) {
                await this.transport.reconnect();
            }
        });
    }

    /**
     * 设置传输层事件
     */
    private setupTransportEvents(): void {
        if (!this.transport) return;

        this.transport.onMessage((data) => {
            this.handleMessage(data);
        });

        this.transport.onConnectionStateChange((state) => {
            this.handleConnectionStateChange(state);
        });

        this.transport.onError((error) => {
            this.handleTransportError(error);
        });
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(data: ArrayBuffer | string): void {
        try {
            const deserializationResult = this.serializer.deserialize<INetworkMessage>(data);
            if (!deserializationResult.isValid) {
                this.logger.warn(`消息反序列化失败: ${deserializationResult.errors?.join(', ')}`);
                this.stats.messages.errors++;
                return;
            }

            const message = deserializationResult.data;
            
            // 验证消息
            const validationResult = this.messageManager.validateMessage(message);
            if (!validationResult.isValid) {
                this.logger.warn(`消息验证失败: ${validationResult.errors.join(', ')}`);
                this.stats.messages.errors++;
                return;
            }

            this.stats.messages.received++;

            // 处理特定类型的消息
            this.processMessage(message);

            this.eventHandlers.messageReceived?.(message);

        } catch (error) {
            this.logger.error('处理消息失败:', error);
            this.stats.messages.errors++;
            this.handleError(error as Error);
        }
    }

    /**
     * 处理连接状态变化
     */
    private handleConnectionStateChange(state: ConnectionState): void {
        this.logger.debug(`传输层连接状态: ${state}`);

        switch (state) {
            case ConnectionState.Connected:
                this.reconnectionManager.onReconnectionSuccess();
                break;
                
            case ConnectionState.Disconnected:
            case ConnectionState.Failed:
                if (this.config.features.enableReconnection) {
                    this.reconnectionManager.startReconnection();
                } else {
                    this.setState(ClientState.Disconnected);
                }
                break;
        }
    }

    /**
     * 处理传输层错误
     */
    private handleTransportError(error: Error): void {
        this.logger.error('传输层错误:', error);
        this.handleError(error);
    }

    /**
     * 处理错误
     */
    private handleError(error: Error): void {
        this.errorHandler.handleError(error, 'NetworkClient');
        this.eventHandlers.error?.(error);
    }

    /**
     * 处理具体消息类型
     */
    private processMessage(message: INetworkMessage): void {
        switch (message.type) {
            case MessageType.CONNECT:
                this.handleConnectResponse(message as IConnectResponseMessage);
                break;
                
            case MessageType.HEARTBEAT:
                this.handleHeartbeatResponse(message as IHeartbeatMessage);
                break;
        }
    }

    /**
     * 发送连接消息
     */
    private async sendConnectMessage(): Promise<void> {
        const connectMessage: IConnectMessage = this.messageManager.createMessage(
            MessageType.CONNECT,
            {
                clientVersion: '1.0.0',
                protocolVersion: '1.0.0',
                authToken: this.config.authentication.credentials?.token,
                clientInfo: {
                    name: 'ECS Network Client',
                    platform: typeof window !== 'undefined' ? 'browser' : 'node',
                    version: '1.0.0'
                }
            },
            'client'
        );

        this.send(connectMessage);
    }

    /**
     * 处理连接响应
     */
    private handleConnectResponse(message: IConnectResponseMessage): void {
        if (message.data.success) {
            this.clientId = message.data.clientId;
            
            if (this.config.authentication.autoAuthenticate) {
                this.setState(ClientState.Authenticated);
                this.eventHandlers.authenticated?.(this.clientId!);
            }
            
            this.logger.info(`连接成功，客户端ID: ${this.clientId}`);
        } else {
            this.logger.error(`连接失败: ${message.data.error}`);
            this.setState(ClientState.Error);
            this.eventHandlers.authenticationFailed?.(message.data.error || '连接失败');
        }
    }

    /**
     * 处理心跳响应
     */
    private handleHeartbeatResponse(message: IHeartbeatMessage): void {
        this.heartbeatManager.handleHeartbeatResponse({
            type: MessageType.HEARTBEAT,
            clientTime: message.data.clientTime,
            serverTime: message.data.serverTime
        });
    }

    /**
     * 启动心跳
     */
    private startHeartbeat(): void {
        this.heartbeatManager.start((heartbeatMessage) => {
            const message: IHeartbeatMessage = this.messageManager.createMessage(
                MessageType.HEARTBEAT,
                heartbeatMessage,
                this.clientId || 'client'
            );
            this.send(message);
        });
    }

    /**
     * 将消息加入队列
     */
    private queueMessage(message: INetworkMessage): void {
        this.messageQueue.push(message);
        this.stats.messages.queued = this.messageQueue.length;
        
        this.logger.debug(`消息已加入队列，当前队列长度: ${this.messageQueue.length}`);
    }

    /**
     * 处理消息队列
     */
    private async processMessageQueue(): Promise<void> {
        if (this.isProcessingQueue || this.messageQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        
        try {
            while (this.messageQueue.length > 0 && this.isConnected()) {
                const message = this.messageQueue.shift()!;
                
                if (this.send(message)) {
                    this.logger.debug(`队列消息发送成功，剩余: ${this.messageQueue.length}`);
                } else {
                    // 发送失败，重新加入队列头部
                    this.messageQueue.unshift(message);
                    break;
                }
            }
        } finally {
            this.isProcessingQueue = false;
            this.stats.messages.queued = this.messageQueue.length;
        }
    }

    /**
     * 清空消息队列
     */
    public clearMessageQueue(): number {
        const count = this.messageQueue.length;
        this.messageQueue.length = 0;
        this.stats.messages.queued = 0;
        this.logger.info(`已清空消息队列，清理了 ${count} 条消息`);
        return count;
    }

    /**
     * 获取延迟信息
     */
    public getLatency(): number | undefined {
        return this.heartbeatManager.getStatus().latency;
    }

    /**
     * 获取心跳统计
     */
    public getHeartbeatStats() {
        return this.heartbeatManager.getStats();
    }
}