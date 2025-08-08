import { NetworkRole } from '../NetworkRole';
import { createLogger } from '@esengine/ecs-framework';

/**
 * 网络环境状态
 */
export enum NetworkEnvironmentState {
    /** 未初始化状态 */
    None = 'none',
    /** 服务端模式 */
    Server = 'server',
    /** 客户端模式 */
    Client = 'client',
    /** 混合模式（既是服务端又是客户端，用于特殊场景） */
    Hybrid = 'hybrid'
}

/**
 * 网络环境管理器
 * 
 * 全局管理当前网络环境状态，让NetworkComponent能够自动检测角色
 * 避免在构造函数中传递角色参数，保持与核心ECS框架的兼容性
 */
export class NetworkEnvironment {
    private static readonly logger = createLogger('NetworkEnvironment');
    private static _instance: NetworkEnvironment | null = null;
    private _state: NetworkEnvironmentState = NetworkEnvironmentState.None;
    private _serverStartTime: number = 0;
    private _clientConnectTime: number = 0;
    
    /**
     * 获取NetworkEnvironment单例实例
     */
    public static get Instance(): NetworkEnvironment {
        if (!NetworkEnvironment._instance) {
            NetworkEnvironment._instance = new NetworkEnvironment();
        }
        return NetworkEnvironment._instance;
    }
    
    private constructor() {}
    
    /**
     * 设置为服务端模式
     */
    public static SetServerMode(): void {
        const instance = NetworkEnvironment.Instance;
        
        if (instance._state === NetworkEnvironmentState.Client) {
            // 如果已经是客户端，则变为混合模式
            instance._state = NetworkEnvironmentState.Hybrid;
        } else {
            instance._state = NetworkEnvironmentState.Server;
        }
        
        instance._serverStartTime = Date.now();
        NetworkEnvironment.logger.info(`环境设置为: ${instance._state}`);
    }
    
    /**
     * 设置为客户端模式
     */
    public static SetClientMode(): void {
        const instance = NetworkEnvironment.Instance;
        
        if (instance._state === NetworkEnvironmentState.Server) {
            // 如果已经是服务端，则变为混合模式
            instance._state = NetworkEnvironmentState.Hybrid;
        } else {
            instance._state = NetworkEnvironmentState.Client;
        }
        
        instance._clientConnectTime = Date.now();
        NetworkEnvironment.logger.info(`环境设置为: ${instance._state}`);
    }
    
    /**
     * 清除服务端模式
     */
    public static ClearServerMode(): void {
        const instance = NetworkEnvironment.Instance;
        
        if (instance._state === NetworkEnvironmentState.Server) {
            instance._state = NetworkEnvironmentState.None;
        } else if (instance._state === NetworkEnvironmentState.Hybrid) {
            instance._state = NetworkEnvironmentState.Client;
        }
        
        instance._serverStartTime = 0;
        NetworkEnvironment.logger.info(`服务端模式已清除，当前状态: ${instance._state}`);
    }
    
    /**
     * 清除客户端模式
     */
    public static ClearClientMode(): void {
        const instance = NetworkEnvironment.Instance;
        
        if (instance._state === NetworkEnvironmentState.Client) {
            instance._state = NetworkEnvironmentState.None;
        } else if (instance._state === NetworkEnvironmentState.Hybrid) {
            instance._state = NetworkEnvironmentState.Server;
        }
        
        instance._clientConnectTime = 0;
        NetworkEnvironment.logger.info(`客户端模式已清除，当前状态: ${instance._state}`);
    }
    
    /**
     * 重置环境状态
     */
    public static Reset(): void {
        const instance = NetworkEnvironment.Instance;
        instance._state = NetworkEnvironmentState.None;
        instance._serverStartTime = 0;
        instance._clientConnectTime = 0;
        NetworkEnvironment.logger.info('环境状态已重置');
    }
    
    /**
     * 检查是否为服务端环境
     */
    public static get isServer(): boolean {
        const instance = NetworkEnvironment.Instance;
        return instance._state === NetworkEnvironmentState.Server || 
               instance._state === NetworkEnvironmentState.Hybrid;
    }
    
    /**
     * 检查是否为客户端环境
     */
    public static get isClient(): boolean {
        const instance = NetworkEnvironment.Instance;
        return instance._state === NetworkEnvironmentState.Client || 
               instance._state === NetworkEnvironmentState.Hybrid;
    }
    
    /**
     * 检查是否为混合环境
     */
    public static get isHybrid(): boolean {
        const instance = NetworkEnvironment.Instance;
        return instance._state === NetworkEnvironmentState.Hybrid;
    }
    
    /**
     * 获取当前环境状态
     */
    public static get state(): NetworkEnvironmentState {
        return NetworkEnvironment.Instance._state;
    }
    
    /**
     * 获取主要角色（用于NetworkComponent）
     * 
     * 在混合模式下，优先返回服务端角色
     * @returns 当前主要网络角色
     */
    public static getPrimaryRole(): NetworkRole {
        const instance = NetworkEnvironment.Instance;
        
        switch (instance._state) {
            case NetworkEnvironmentState.Server:
            case NetworkEnvironmentState.Hybrid:
                return NetworkRole.SERVER;
            case NetworkEnvironmentState.Client:
                return NetworkRole.CLIENT;
            case NetworkEnvironmentState.None:
            default:
                // 默认返回客户端角色，避免抛出异常
                return NetworkRole.CLIENT;
        }
    }
    
    /**
     * 检查环境是否已初始化
     */
    public static get isInitialized(): boolean {
        return NetworkEnvironment.Instance._state !== NetworkEnvironmentState.None;
    }
    
    /**
     * 获取服务端运行时间（毫秒）
     */
    public static get serverUptime(): number {
        const instance = NetworkEnvironment.Instance;
        return instance._serverStartTime > 0 ? Date.now() - instance._serverStartTime : 0;
    }
    
    /**
     * 获取客户端连接时间（毫秒）
     */
    public static get clientConnectTime(): number {
        const instance = NetworkEnvironment.Instance;
        return instance._clientConnectTime > 0 ? Date.now() - instance._clientConnectTime : 0;
    }
    
    /**
     * 获取环境统计信息
     */
    public static getStats(): {
        state: NetworkEnvironmentState;
        isServer: boolean;
        isClient: boolean;
        isHybrid: boolean;
        isInitialized: boolean;
        primaryRole: NetworkRole;
        serverUptime: number;
        clientConnectTime: number;
    } {
        return {
            state: NetworkEnvironment.state,
            isServer: NetworkEnvironment.isServer,
            isClient: NetworkEnvironment.isClient,
            isHybrid: NetworkEnvironment.isHybrid,
            isInitialized: NetworkEnvironment.isInitialized,
            primaryRole: NetworkEnvironment.getPrimaryRole(),
            serverUptime: NetworkEnvironment.serverUptime,
            clientConnectTime: NetworkEnvironment.clientConnectTime
        };
    }
    
    /**
     * 强制设置环境状态（用于测试）
     * 
     * @param state - 要设置的环境状态
     * @param serverStartTime - 服务端启动时间（可选）
     * @param clientConnectTime - 客户端连接时间（可选）
     */
    public static forceSetState(
        state: NetworkEnvironmentState, 
        serverStartTime?: number, 
        clientConnectTime?: number
    ): void {
        const instance = NetworkEnvironment.Instance;
        instance._state = state;
        
        if (serverStartTime !== undefined) {
            instance._serverStartTime = serverStartTime;
        }
        
        if (clientConnectTime !== undefined) {
            instance._clientConnectTime = clientConnectTime;
        }
        
        NetworkEnvironment.logger.debug(`强制设置环境状态为: ${state}`);
    }
}