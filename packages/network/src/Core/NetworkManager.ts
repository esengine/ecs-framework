import { NetworkServer } from './NetworkServer';
import { NetworkClient } from './NetworkClient';
import { NetworkEnvironment } from './NetworkEnvironment';

/**
 * 网络管理器 - 网络框架的核心入口
 * 
 * 负责管理整个网络生命周期
 * 支持启动服务端、客户端，管理连接状态
 */
export class NetworkManager {
    private static _instance: NetworkManager | null = null;
    private _server: NetworkServer | null = null;
    private _client: NetworkClient | null = null;
    private _isServer: boolean = false;
    private _isClient: boolean = false;
    
    /**
     * 获取NetworkManager单例实例
     */
    public static get Instance(): NetworkManager {
        if (!NetworkManager._instance) {
            NetworkManager._instance = new NetworkManager();
        }
        return NetworkManager._instance;
    }
    
    private constructor() {}
    
    /**
     * 启动服务端
     * 
     * @param port - 监听端口
     * @param host - 监听地址，默认为 '0.0.0.0'
     * @returns Promise<boolean> 启动是否成功
     */
    public static async StartServer(port: number, host: string = '0.0.0.0'): Promise<boolean> {
        const instance = NetworkManager.Instance;
        
        if (instance._isServer) {
            console.warn('[NetworkManager] 服务端已经在运行');
            return false;
        }
        
        try {
            instance._server = new NetworkServer();
            await instance._server.start(port, host);
            instance._isServer = true;
            
            // 自动设置网络环境为服务端模式
            NetworkEnvironment.SetServerMode();
            
            console.log(`[NetworkManager] 服务端启动成功，监听 ${host}:${port}`);
            return true;
        } catch (error) {
            console.error('[NetworkManager] 服务端启动失败:', error);
            instance._server = null;
            return false;
        }
    }
    
    /**
     * 启动客户端
     * 
     * @param url - 服务端WebSocket地址
     * @returns Promise<boolean> 连接是否成功
     */
    public static async StartClient(url: string): Promise<boolean> {
        const instance = NetworkManager.Instance;
        
        if (instance._isClient) {
            console.warn('[NetworkManager] 客户端已经在运行');
            return false;
        }
        
        try {
            instance._client = new NetworkClient();
            await instance._client.connect(url);
            instance._isClient = true;
            
            // 自动设置网络环境为客户端模式
            NetworkEnvironment.SetClientMode();
            
            console.log(`[NetworkManager] 客户端连接成功: ${url}`);
            return true;
        } catch (error) {
            console.error('[NetworkManager] 客户端连接失败:', error);
            instance._client = null;
            return false;
        }
    }
    
    /**
     * 停止服务端
     */
    public static async StopServer(): Promise<void> {
        const instance = NetworkManager.Instance;
        
        if (instance._server && instance._isServer) {
            await instance._server.stop();
            instance._server = null;
            instance._isServer = false;
            
            // 清除服务端环境模式
            NetworkEnvironment.ClearServerMode();
            
            console.log('[NetworkManager] 服务端已停止');
        }
    }
    
    /**
     * 断开客户端连接
     */
    public static async StopClient(): Promise<void> {
        const instance = NetworkManager.Instance;
        
        if (instance._client && instance._isClient) {
            await instance._client.disconnect();
            instance._client = null;
            instance._isClient = false;
            
            // 清除客户端环境模式
            NetworkEnvironment.ClearClientMode();
            
            console.log('[NetworkManager] 客户端已断开连接');
        }
    }
    
    /**
     * 完全停止网络管理器
     */
    public static async Stop(): Promise<void> {
        await NetworkManager.StopServer();
        await NetworkManager.StopClient();
        
        // 重置网络环境
        NetworkEnvironment.Reset();
        
        NetworkManager._instance = null;
    }
    
    /**
     * 检查是否为服务端
     */
    public static get isServer(): boolean {
        return NetworkManager.Instance._isServer;
    }
    
    /**
     * 检查是否为客户端
     */
    public static get isClient(): boolean {
        return NetworkManager.Instance._isClient;
    }
    
    /**
     * 获取服务端实例
     */
    public static get server(): NetworkServer | null {
        return NetworkManager.Instance._server;
    }
    
    /**
     * 获取服务端实例 (方法形式，用于动态调用)
     */
    public static GetServer(): NetworkServer | null {
        return NetworkManager.Instance._server;
    }
    
    /**
     * 获取客户端实例
     */
    public static get client(): NetworkClient | null {
        return NetworkManager.Instance._client;
    }
    
    /**
     * 获取当前连接数（仅服务端有效）
     */
    public static get connectionCount(): number {
        const instance = NetworkManager.Instance;
        return instance._server ? instance._server.connectionCount : 0;
    }
    
    /**
     * 获取网络统计信息
     */
    public static getNetworkStats(): {
        isServer: boolean;
        isClient: boolean;
        connectionCount: number;
        serverUptime?: number;
        clientConnectedTime?: number;
    } {
        const instance = NetworkManager.Instance;
        
        return {
            isServer: instance._isServer,
            isClient: instance._isClient,
            connectionCount: instance._server ? instance._server.connectionCount : 0,
            serverUptime: instance._server ? instance._server.uptime : undefined,
            clientConnectedTime: instance._client ? instance._client.connectedTime : undefined
        };
    }
}