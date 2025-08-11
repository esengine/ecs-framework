/**
 * TSRPC 服务端传输层
 * 
 * 封装TSRPC服务端功能，提供网络消息处理和客户端管理
 */

import { WsServer } from 'tsrpc';
import { createLogger } from '@esengine/ecs-framework';
import { serviceProto, ServiceType } from './protocols/serviceProto';
import { NetworkConfig, NetworkMessage } from '../Types/NetworkTypes';
import { 
  ReqJoinRoom, ResJoinRoom,
  ReqServerStatus, ResServerStatus,
  ReqPing, ResPing,
  MsgNetworkMessage,
  MsgSyncVar,
  MsgRpcCall,
  MsgNetworkObjectSpawn,
  MsgNetworkObjectDespawn,
  MsgClientDisconnected,
  MsgAuthorityChange
} from './protocols/NetworkProtocols';

const logger = createLogger('TsrpcServer');

/**
 * 客户端连接信息
 */
interface ClientConnection {
  /** 客户端ID */
  id: number;
  /** 连接对象 */
  connection: any;
  /** 连接时间 */
  connectTime: number;
  /** 最后活跃时间 */
  lastActivity: number;
  /** 客户端信息 */
  clientInfo?: {
    version: string;
    platform: string;
  };
}

/**
 * TSRPC服务端包装器
 */
export class TsrpcServer {
  private server: WsServer<ServiceType> | null = null;
  private clients: Map<number, ClientConnection> = new Map();
  private nextClientId: number = 1;
  private config: NetworkConfig;
  private startTime: number = 0;
  
  /** 统计信息 */
  private stats = {
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0
  };

  /** 事件处理器 */
  public onClientConnected?: (clientId: number) => void;
  public onClientDisconnected?: (clientId: number, reason?: string) => void;
  public onMessage?: (message: NetworkMessage, fromClientId: number) => void;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * 启动服务端
   */
  public async start(): Promise<void> {
    if (this.server) {
      throw new Error('服务端已经在运行中');
    }

    // 创建TSRPC WebSocket服务端
    this.server = new WsServer(serviceProto, {
      port: this.config.port || 7777
    });

    this.startTime = Date.now();
    this.setupApiHandlers();
    this.setupMessageHandlers();
    this.setupConnectionHandlers();

    // 启动服务端
    await this.server.start();
    logger.info(`TSRPC服务端已启动，端口: ${this.config.port}`);
  }

  /**
   * 停止服务端
   */
  public async stop(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      this.server = null;
      this.clients.clear();
      logger.info('TSRPC服务端已停止');
    }
  }

  /**
   * 向指定客户端发送消息
   */
  public sendToClient(clientId: number, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn(`客户端不存在: ${clientId}`);
      return;
    }

    try {
      // 发送消息给指定连接
      this.server?.broadcastMsg(message.type, message.data || message, [client.connection]);
      this.stats.messagesSent++;
      logger.debug(`向客户端 ${clientId} 发送消息: ${message.type || 'unknown'}`);
    } catch (error) {
      logger.error(`向客户端 ${clientId} 发送消息失败:`, error);
    }
  }

  /**
   * 向所有客户端广播消息
   */
  public broadcast(message: any, excludeClientId?: number): void {
    if (!this.server) {
      logger.warn('服务端未启动，无法广播消息');
      return;
    }

    try {
      if (excludeClientId) {
        // 排除指定客户端
        const targetConnections = Array.from(this.clients.entries())
          .filter(([clientId, client]) => clientId !== excludeClientId)
          .map(([clientId, client]) => client.connection);
        
        this.server.broadcastMsg(message.type, message.data || message, targetConnections);
        this.stats.messagesSent += targetConnections.length;
      } else {
        // 广播给所有客户端
        this.server.broadcastMsg(message.type, message.data || message);
        this.stats.messagesSent += this.clients.size;
      }
    } catch (error) {
      logger.error('广播消息失败:', error);
    }

    logger.debug(`广播消息给 ${this.clients.size} 个客户端: ${message.type || 'unknown'}`);
  }

  /**
   * 获取连接的客户端列表
   */
  public getConnectedClients(): number[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 获取客户端数量
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 获取服务端统计信息
   */
  public getStats() {
    return {
      ...this.stats,
      clientCount: this.clients.size,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * 设置API处理器
   */
  private setupApiHandlers(): void {
    if (!this.server) return;

    // 客户端加入房间
    this.server.implementApi('network/JoinRoom', call => {
      const clientId = this.nextClientId++;
      const client: ClientConnection = {
        id: clientId,
        connection: call.conn,
        connectTime: Date.now(),
        lastActivity: Date.now(),
        clientInfo: call.req.clientInfo
      };

      this.clients.set(clientId, client);
      logger.info(`客户端 ${clientId} 连接成功`);

      // 通知上层
      this.onClientConnected?.(clientId);

      // 返回响应
      call.succ({
        clientId,
        roomId: call.req.roomId || 'default',
        serverInfo: {
          version: '1.0.0',
          syncRate: this.config.syncRate || 20
        }
      });
    });

    // 服务端状态查询
    this.server.implementApi('network/ServerStatus', call => {
      const stats = this.getStats();
      call.succ({
        clientCount: stats.clientCount,
        networkObjectCount: 0, // 这里需要从NetworkRegistry获取
        uptime: stats.uptime,
        networkStats: {
          messagesSent: stats.messagesSent,
          messagesReceived: stats.messagesReceived,
          bytesSent: stats.bytesSent,
          bytesReceived: stats.bytesReceived
        }
      });
    });

    // 心跳检测
    this.server.implementApi('network/Ping', call => {
      call.succ({
        serverTimestamp: Date.now(),
        clientTimestamp: call.req.timestamp
      });
    });
  }

  /**
   * 设置消息处理器
   */
  private setupMessageHandlers(): void {
    if (!this.server) return;

    // 网络消息处理
    this.server.listenMsg('network/NetworkMessage', msg => {
      const clientId = this.getClientIdByConnection(msg.conn);
      if (clientId) {
        this.stats.messagesReceived++;
        this.updateClientActivity(clientId);
        
        // 转换为内部消息格式
        const networkMessage: NetworkMessage = {
          type: msg.msg.type,
          networkId: msg.msg.networkId,
          data: msg.msg.data,
          timestamp: msg.msg.timestamp
        };

        this.onMessage?.(networkMessage, clientId);
      }
    });

    // SyncVar消息处理
    this.server.listenMsg('network/SyncVar', msg => {
      const clientId = this.getClientIdByConnection(msg.conn);
      if (clientId) {
        this.stats.messagesReceived++;
        this.updateClientActivity(clientId);

        // 转换并广播给其他客户端
        const syncVarMessage: MsgSyncVar = msg.msg;
        this.broadcast({
          type: 'network/SyncVar',
          data: syncVarMessage
        }, clientId);
      }
    });

    // RPC调用消息处理
    this.server.listenMsg('network/RpcCall', msg => {
      const clientId = this.getClientIdByConnection(msg.conn);
      if (clientId) {
        this.stats.messagesReceived++;
        this.updateClientActivity(clientId);

        const rpcMessage: MsgRpcCall = msg.msg;
        
        if (rpcMessage.isClientRpc) {
          // 服务端到客户端的RPC，广播给所有客户端
          this.broadcast({
            type: 'network/RpcCall',
            data: rpcMessage
          });
        } else {
          // 客户端到服务端的Command，只在服务端处理
          const networkMessage: NetworkMessage = {
            type: 'rpc',
            networkId: rpcMessage.networkId,
            data: {
              componentType: rpcMessage.componentType,
              methodName: rpcMessage.methodName,
              args: rpcMessage.args
            },
            timestamp: rpcMessage.timestamp
          };

          this.onMessage?.(networkMessage, clientId);
        }
      }
    });
  }

  /**
   * 设置连接处理器
   */
  private setupConnectionHandlers(): void {
    if (!this.server) return;

    // 连接断开处理
    this.server.flows.postDisconnectFlow.push(conn => {
      const clientId = this.getClientIdByConnection(conn);
      if (clientId) {
        this.clients.delete(clientId);
        logger.info(`客户端 ${clientId} 断开连接`);
        
        // 通知其他客户端
        this.broadcast({
          type: 'network/ClientDisconnected',
          data: { clientId, reason: 'disconnected' }
        });

        // 通知上层
        this.onClientDisconnected?.(clientId, 'disconnected');
      }

      return conn;
    });
  }

  /**
   * 根据连接对象获取客户端ID
   */
  private getClientIdByConnection(conn: any): number | null {
    for (const [clientId, client] of this.clients) {
      if (client.connection === conn) {
        return clientId;
      }
    }
    return null;
  }

  /**
   * 更新客户端活跃时间
   */
  private updateClientActivity(clientId: number): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = Date.now();
    }
  }
}