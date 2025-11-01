/**
 * WebSocket连接管理器
 */
export class WebSocketManager {
    private ws?: WebSocket;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private url: string;
    private autoReconnect: boolean;
    private reconnectTimer?: ReturnType<typeof setTimeout>;
    private onOpen?: (event: Event) => void;
    private onClose?: (event: CloseEvent) => void;
    private onError?: (error: Event | any) => void;
    private messageHandler?: (message: any) => void;

    constructor(url: string, autoReconnect: boolean = true) {
        this.url = url;
        this.autoReconnect = autoReconnect;
    }

    /**
     * 设置消息处理回调
     */
    public setMessageHandler(handler: (message: any) => void): void {
        this.messageHandler = handler;
    }

    /**
     * 连接WebSocket
     */
    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = (event) => {
                    this.handleOpen(event);
                    resolve();
                };

                this.ws.onclose = (event) => {
                    this.handleClose(event);
                };

                this.ws.onerror = (error) => {
                    this.handleError(error);
                    reject(error);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

            } catch (error) {
                this.handleConnectionFailure(error);
                reject(error);
            }
        });
    }

    /**
     * 断开连接
     */
    public disconnect(): void {
        if (this.ws) {
            this.autoReconnect = false; // 主动断开时不自动重连
            this.ws.close();
            delete (this as any).ws;
        }
        this.isConnected = false;
    }

    /**
     * 发送数据
     */
    public send(data: any): void {
        if (!this.isConnected || !this.ws) {
            return;
        }

        try {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.ws.send(message);
        } catch (error) {
        }
    }

    /**
     * 获取连接状态
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * 设置最大重连次数
     */
    public setMaxReconnectAttempts(attempts: number): void {
        this.maxReconnectAttempts = attempts;
    }

    /**
     * 计划重连
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;

        this.reconnectTimer = setTimeout(() => {
            this.connect().catch((_error) => {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            });
        }, delay);
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const message = JSON.parse(event.data);
            // 调用消息处理回调
            if (this.messageHandler) {
                this.messageHandler(message);
            }
        } catch (error) {
        }
    }

    private handleOpen(event: Event): void {
        this.isConnected = true;
        this.reconnectAttempts = 0;

        if (this.onOpen) {
            this.onOpen(event);
        }
    }

    private handleClose(event: CloseEvent): void {
        this.isConnected = false;

        if (this.onClose) {
            this.onClose(event);
        }

        if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
    }

    private handleError(error: Event): void {
        if (this.onError) {
            this.onError(error);
        }
    }

    private handleConnectionFailure(error: any): void {
        if (this.onError) {
            this.onError(error);
        }
    }
}
