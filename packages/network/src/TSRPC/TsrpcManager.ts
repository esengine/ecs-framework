/**
 * TSRPC 网络管理器
 */
import { createLogger } from '@esengine/ecs-framework';
import { TsrpcNetworkServer } from './TsrpcServer';
import { TsrpcNetworkClient } from './TsrpcClient';

const logger = createLogger('TsrpcManager');

export enum NetworkMode {
    Server = 'server',
    Client = 'client'
}

export class TsrpcManager {
    private static _instance: TsrpcManager | null = null;
    private _server: TsrpcNetworkServer | null = null;
    private _client: TsrpcNetworkClient | null = null;
    private _mode: NetworkMode | null = null;

    private constructor() {}

    public static getInstance(): TsrpcManager {
        if (!TsrpcManager._instance) {
            TsrpcManager._instance = new TsrpcManager();
        }
        return TsrpcManager._instance;
    }

    /**
     * 初始化为服务器模式
     */
    async initAsServer(port: number = 3000): Promise<void> {
        if (this._mode !== null) {
            throw new Error('TSRPC管理器已经初始化');
        }

        this._mode = NetworkMode.Server;
        this._server = new TsrpcNetworkServer(port);
        await this._server.start();
        
        logger.info(`TSRPC管理器已初始化为服务器模式，端口: ${port}`);
    }

    /**
     * 初始化为客户端模式
     */
    async initAsClient(serverUrl: string = 'ws://localhost:3000'): Promise<void> {
        if (this._mode !== null) {
            throw new Error('TSRPC管理器已经初始化');
        }

        this._mode = NetworkMode.Client;
        this._client = new TsrpcNetworkClient(serverUrl);
        const connected = await this._client.connect();
        
        if (connected) {
            logger.info(`TSRPC管理器已初始化为客户端模式，服务器: ${serverUrl}`);
        } else {
            throw new Error('无法连接到TSRPC服务器');
        }
    }

    /**
     * 关闭网络连接
     */
    async shutdown(): Promise<void> {
        if (this._server) {
            await this._server.stop();
            this._server = null;
        }

        if (this._client) {
            this._client.disconnect();
            this._client = null;
        }

        this._mode = null;
        logger.info('TSRPC管理器已关闭');
    }

    /**
     * 获取服务器实例（仅服务器模式）
     */
    get server(): TsrpcNetworkServer {
        if (!this._server) {
            throw new Error('未初始化为服务器模式或服务器未启动');
        }
        return this._server;
    }

    /**
     * 获取客户端实例（仅客户端模式）
     */
    get client(): TsrpcNetworkClient {
        if (!this._client) {
            throw new Error('未初始化为客户端模式或客户端未连接');
        }
        return this._client;
    }

    /**
     * 获取当前模式
     */
    get mode(): NetworkMode | null {
        return this._mode;
    }

    /**
     * 是否为服务器模式
     */
    get isServer(): boolean {
        return this._mode === NetworkMode.Server;
    }

    /**
     * 是否为客户端模式
     */
    get isClient(): boolean {
        return this._mode === NetworkMode.Client;
    }

    /**
     * 是否已初始化
     */
    get isInitialized(): boolean {
        return this._mode !== null;
    }
}