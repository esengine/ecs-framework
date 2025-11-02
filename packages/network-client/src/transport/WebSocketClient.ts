/**
 * WebSocket客户端传输层实现
 */
import { createLogger, ITimer } from '@esengine/ecs-framework';
import {
    IClientTransport,
    IConnectionOptions,
    ConnectionState,
    IConnectionStats
} from '@esengine/network-shared';
import { NetworkTimerManager } from '../utils';

/**
 * WebSocket客户端实现
 */
export class WebSocketClient implements IClientTransport {
    private logger = createLogger('WebSocketClient');
    private websocket?: WebSocket;
    private connectionState: ConnectionState = ConnectionState.Disconnected;
    private options: IConnectionOptions = {};
    private url = '';
    private reconnectTimer?: ITimer;
    private reconnectAttempts = 0;
    private stats: IConnectionStats;

    /**
     * 消息接收事件处理器
     */
    private messageHandlers: ((data: ArrayBuffer | string) => void)[] = [];

    /**
     * 连接状态变化事件处理器
     */
    private stateChangeHandlers: ((state: ConnectionState) => void)[] = [];

    /**
     * 错误事件处理器
     */
    private errorHandlers: ((error: Error) => void)[] = [];

    /**
     * 构造函数
     */
    constructor() {
        this.stats = {
            state: ConnectionState.Disconnected,
            reconnectCount: 0,
            bytesSent: 0,
            bytesReceived: 0,
            messagesSent: 0,
            messagesReceived: 0
        };
    }

    /**
     * 连接到服务器
     */
    async connect(url: string, options?: IConnectionOptions): Promise<void> {
        if (this.connectionState === ConnectionState.Connected) {
            this.logger.warn('客户端已连接');
            return;
        }

        this.url = url;
        this.options = {
            timeout: 10000,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            autoReconnect: true,
            protocolVersion: '1.0',
            ...options
        };

        return this.connectInternal();
    }

    /**
     * 断开连接
     */
    async disconnect(reason?: string): Promise<void> {
        this.options.autoReconnect = false; // 禁用自动重连
        this.clearReconnectTimer();

        if (this.websocket) {
            this.websocket.close(1000, reason || '客户端主动断开');
            this.websocket = undefined;
        }

        this.setConnectionState(ConnectionState.Disconnected);
        this.logger.info(`客户端断开连接: ${reason || '主动断开'}`);
    }

    /**
     * 发送数据到服务器
     */
    send(data: ArrayBuffer | string): void {
        if (!this.websocket || this.connectionState !== ConnectionState.Connected) {
            this.logger.warn('客户端未连接，无法发送消息');
            return;
        }

        try {
            this.websocket.send(data);
            this.stats.messagesSent++;

            // 估算字节数
            const bytes = typeof data === 'string' ? new Blob([data]).size : data.byteLength;
            this.stats.bytesSent += bytes;

        } catch (error) {
            this.logger.error('发送消息失败:', error);
            this.handleError(error as Error);
        }
    }

    /**
     * 监听服务器消息
     */
    onMessage(handler: (data: ArrayBuffer | string) => void): void {
        this.messageHandlers.push(handler);
    }

    /**
     * 监听连接状态变化
     */
    onConnectionStateChange(handler: (state: ConnectionState) => void): void {
        this.stateChangeHandlers.push(handler);
    }

    /**
     * 监听错误事件
     */
    onError(handler: (error: Error) => void): void {
        this.errorHandlers.push(handler);
    }

    /**
     * 获取连接状态
     */
    getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    /**
     * 获取连接统计信息
     */
    getStats(): IConnectionStats {
        return { ...this.stats };
    }

    /**
     * 内部连接实现
     */
    private async connectInternal(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.setConnectionState(ConnectionState.Connecting);
                this.logger.info(`连接到服务器: ${this.url}`);

                // 检查WebSocket支持
                if (typeof WebSocket === 'undefined') {
                    throw new Error('当前环境不支持WebSocket');
                }

                this.websocket = new WebSocket(this.url);
                this.setupWebSocketEvents(resolve, reject);

                // 设置连接超时
                if (this.options.timeout) {
                    NetworkTimerManager.schedule(
                        this.options.timeout / 1000, // 转为秒
                        false, // 不重复
                        this,
                        () => {
                            if (this.connectionState === ConnectionState.Connecting) {
                                this.websocket?.close();
                                reject(new Error(`连接超时 (${this.options.timeout}ms)`));
                            }
                        }
                    );
                }

            } catch (error) {
                this.logger.error('创建WebSocket连接失败:', error);
                this.setConnectionState(ConnectionState.Failed);
                reject(error);
            }
        });
    }

    /**
     * 设置WebSocket事件监听
     */
    private setupWebSocketEvents(
        resolve: () => void,
        reject: (error: Error) => void
    ): void {
        if (!this.websocket) return;

        // 连接打开
        this.websocket.onopen = () => {
            this.setConnectionState(ConnectionState.Connected);
            this.stats.connectTime = Date.now();
            this.reconnectAttempts = 0; // 重置重连计数
            this.logger.info('WebSocket连接已建立');
            resolve();
        };

        // 消息接收
        this.websocket.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        // 连接关闭
        this.websocket.onclose = (event) => {
            this.handleConnectionClose(event.code, event.reason);
        };

        // 错误处理
        this.websocket.onerror = (event) => {
            const error = new Error(`WebSocket错误: ${event}`);
            this.logger.error('WebSocket错误:', error);
            this.handleError(error);

            if (this.connectionState === ConnectionState.Connecting) {
                reject(error);
            }
        };
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(data: any): void {
        try {
            this.stats.messagesReceived++;

            // 估算字节数
            const bytes = typeof data === 'string' ? new Blob([data]).size : data.byteLength || 0;
            this.stats.bytesReceived += bytes;

            // 触发消息事件
            this.messageHandlers.forEach((handler) => {
                try {
                    handler(data);
                } catch (error) {
                    this.logger.error('消息事件处理器错误:', error);
                }
            });

        } catch (error) {
            this.logger.error('处理接收消息失败:', error);
            this.handleError(error as Error);
        }
    }

    /**
     * 处理连接关闭
     */
    private handleConnectionClose(code: number, reason: string): void {
        this.stats.disconnectTime = Date.now();
        this.websocket = undefined;

        this.logger.info(`WebSocket连接已关闭: code=${code}, reason=${reason}`);

        // 根据关闭代码决定是否重连
        const shouldReconnect = this.shouldReconnect(code);

        if (shouldReconnect && this.options.autoReconnect) {
            this.setConnectionState(ConnectionState.Reconnecting);
            this.scheduleReconnect();
        } else {
            this.setConnectionState(ConnectionState.Disconnected);
        }
    }

    /**
     * 判断是否应该重连
     */
    private shouldReconnect(closeCode: number): boolean {
        // 正常关闭（1000）或服务器重启（1001）时应该重连
        // 协议错误（1002-1003）、数据格式错误（1007）等不应重连
        const reconnectableCodes = [1000, 1001, 1006, 1011];
        return reconnectableCodes.includes(closeCode);
    }

    /**
     * 安排重连
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
            this.logger.error(`达到最大重连次数 (${this.reconnectAttempts})`);
            this.setConnectionState(ConnectionState.Failed);
            return;
        }

        // 指数退避算法
        const delay = Math.min(
            this.options.reconnectInterval! * Math.pow(2, this.reconnectAttempts),
            30000 // 最大30秒
        );

        this.logger.info(`${delay}ms 后尝试重连 (第 ${this.reconnectAttempts + 1} 次)`);

        this.reconnectTimer = NetworkTimerManager.schedule(
            delay / 1000, // 转为秒
            false, // 不重复
            this,
            () => {
                this.reconnectAttempts++;
                this.stats.reconnectCount++;

                this.connectInternal().catch((error) => {
                    this.logger.error(`重连失败 (第 ${this.reconnectAttempts} 次):`, error);
                    this.scheduleReconnect();
                });
            }
        );
    }

    /**
     * 清除重连定时器
     */
    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            this.reconnectTimer.stop();
            this.reconnectTimer = undefined;
        }
    }

    /**
     * 设置连接状态
     */
    private setConnectionState(state: ConnectionState): void {
        if (this.connectionState === state) return;

        const oldState = this.connectionState;
        this.connectionState = state;
        this.stats.state = state;

        this.logger.debug(`连接状态变化: ${oldState} -> ${state}`);

        // 触发状态变化事件
        this.stateChangeHandlers.forEach((handler) => {
            try {
                handler(state);
            } catch (error) {
                this.logger.error('状态变化事件处理器错误:', error);
            }
        });
    }

    /**
     * 处理错误
     */
    private handleError(error: Error): void {
        this.errorHandlers.forEach((handler) => {
            try {
                handler(error);
            } catch (handlerError) {
                this.logger.error('错误事件处理器错误:', handlerError);
            }
        });
    }

    /**
     * 发送心跳
     */
    public ping(): void {
        if (this.websocket && this.connectionState === ConnectionState.Connected) {
            // WebSocket的ping/pong由浏览器自动处理
            // 这里可以发送应用层心跳消息
            this.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
    }

    /**
     * 手动触发重连
     */
    public reconnect(): void {
        if (this.connectionState === ConnectionState.Disconnected ||
            this.connectionState === ConnectionState.Failed) {
            this.reconnectAttempts = 0;
            this.connectInternal().catch((error) => {
                this.logger.error('手动重连失败:', error);
            });
        }
    }

    /**
     * 获取延迟信息（简单实现）
     */
    public getLatency(): number | undefined {
        return this.stats.latency;
    }

    /**
     * 销毁客户端
     */
    public destroy(): void {
        this.disconnect('客户端销毁');
        this.messageHandlers.length = 0;
        this.stateChangeHandlers.length = 0;
        this.errorHandlers.length = 0;
    }
}
