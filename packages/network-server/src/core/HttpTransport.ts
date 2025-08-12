/**
 * HTTP 传输层实现
 * 
 * 用于处理 REST API 请求和长轮询连接
 */

import { createServer, IncomingMessage, ServerResponse, Server as HttpServer } from 'http';
import { parse as parseUrl } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Transport, TransportConfig, ClientConnectionInfo, TransportMessage } from './Transport';

/**
 * HTTP 传输配置
 */
export interface HttpTransportConfig extends TransportConfig {
  /** API 路径前缀 */
  apiPrefix?: string;
  /** 最大请求大小(字节) */
  maxRequestSize?: number;
  /** 长轮询超时(毫秒) */
  longPollTimeout?: number;
  /** 是否启用 CORS */
  enableCors?: boolean;
  /** 允许的域名 */
  corsOrigins?: string[];
}

/**
 * HTTP 请求上下文
 */
interface HttpRequestContext {
  /** 请求ID */
  id: string;
  /** HTTP 请求 */
  request: IncomingMessage;
  /** HTTP 响应 */
  response: ServerResponse;
  /** 解析后的URL */
  parsedUrl: any;
  /** 请求体数据 */
  body?: string;
  /** 查询参数 */
  query: Record<string, string>;
}

/**
 * HTTP 客户端连接信息(用于长轮询)
 */
interface HttpConnectionInfo extends ClientConnectionInfo {
  /** 长轮询响应对象 */
  longPollResponse?: ServerResponse;
  /** 消息队列 */
  messageQueue: TransportMessage[];
  /** 长轮询超时定时器 */
  longPollTimer?: NodeJS.Timeout;
}

/**
 * HTTP 传输层实现
 */
export class HttpTransport extends Transport {
  private httpServer: HttpServer | null = null;
  private httpConnections = new Map<string, HttpConnectionInfo>();
  
  protected override config: HttpTransportConfig;

  constructor(config: HttpTransportConfig) {
    super(config);
    this.config = {
      apiPrefix: '/api',
      maxRequestSize: 1024 * 1024, // 1MB
      longPollTimeout: 30000, // 30秒
      enableCors: true,
      corsOrigins: ['*'],
      heartbeatInterval: 60000,
      connectionTimeout: 120000,
      maxConnections: 1000,
      ...config
    };
  }

  /**
   * 启动 HTTP 服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('HTTP transport is already running');
    }

    try {
      this.httpServer = createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      this.httpServer.on('error', (error: Error) => {
        this.handleError(error);
      });

      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(this.config.port, this.config.host, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            this.isRunning = true;
            resolve();
          }
        });
      });

      this.emit('server-started', this.config);
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  /**
   * 停止 HTTP 服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // 断开所有长轮询连接
    for (const [connectionId] of this.httpConnections) {
      this.disconnectClient(connectionId, 'server-shutdown');
    }

    await this.cleanup();
    this.emit('server-stopped');
  }

  /**
   * 发送消息给指定客户端
   */
  async sendToClient(connectionId: string, message: TransportMessage): Promise<boolean> {
    const connection = this.httpConnections.get(connectionId);
    if (!connection) {
      return false;
    }

    // 如果有长轮询连接，直接发送
    if (connection.longPollResponse && !connection.longPollResponse.headersSent) {
      this.sendLongPollResponse(connection, [message]);
      return true;
    }

    // 否则加入消息队列
    connection.messageQueue.push(message);
    return true;
  }

  /**
   * 广播消息给所有客户端
   */
  async broadcast(message: TransportMessage, excludeId?: string): Promise<number> {
    let sentCount = 0;

    for (const [connectionId, connection] of this.httpConnections) {
      if (excludeId && connectionId === excludeId) {
        continue;
      }

      if (await this.sendToClient(connectionId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * 发送消息给指定客户端列表
   */
  async sendToClients(connectionIds: string[], message: TransportMessage): Promise<number> {
    let sentCount = 0;

    for (const connectionId of connectionIds) {
      if (await this.sendToClient(connectionId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * 断开指定客户端连接
   */
  async disconnectClient(connectionId: string, reason?: string): Promise<void> {
    const connection = this.httpConnections.get(connectionId);
    if (connection) {
      this.cleanupConnection(connectionId);
      this.removeConnection(connectionId, reason);
    }
  }

  /**
   * 处理 HTTP 请求
   */
  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // 设置 CORS 头
      if (this.config.enableCors) {
        this.setCorsHeaders(res);
      }

      // 处理 OPTIONS 请求
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const parsedUrl = parseUrl(req.url || '', true);
      const pathname = parsedUrl.pathname || '';

      // 检查是否为 API 请求
      if (!pathname.startsWith(this.config.apiPrefix!)) {
        this.sendErrorResponse(res, 404, 'Not Found');
        return;
      }

      const context: HttpRequestContext = {
        id: uuidv4(),
        request: req,
        response: res,
        parsedUrl,
        query: parsedUrl.query as Record<string, string>,
      };

      // 读取请求体
      if (req.method === 'POST' || req.method === 'PUT') {
        context.body = await this.readRequestBody(req);
      }

      // 路由处理
      const apiPath = pathname.substring(this.config.apiPrefix!.length);
      await this.routeApiRequest(context, apiPath);

    } catch (error) {
      this.handleError(error as Error);
      this.sendErrorResponse(res, 500, 'Internal Server Error');
    }
  }

  /**
   * API 路由处理
   */
  private async routeApiRequest(context: HttpRequestContext, apiPath: string): Promise<void> {
    const { request, response } = context;

    switch (apiPath) {
      case '/connect':
        if (request.method === 'POST') {
          await this.handleConnect(context);
        } else {
          this.sendErrorResponse(response, 405, 'Method Not Allowed');
        }
        break;

      case '/disconnect':
        if (request.method === 'POST') {
          await this.handleDisconnect(context);
        } else {
          this.sendErrorResponse(response, 405, 'Method Not Allowed');
        }
        break;

      case '/poll':
        if (request.method === 'GET') {
          await this.handleLongPoll(context);
        } else {
          this.sendErrorResponse(response, 405, 'Method Not Allowed');
        }
        break;

      case '/send':
        if (request.method === 'POST') {
          await this.handleSendMessage(context);
        } else {
          this.sendErrorResponse(response, 405, 'Method Not Allowed');
        }
        break;

      case '/status':
        if (request.method === 'GET') {
          await this.handleStatus(context);
        } else {
          this.sendErrorResponse(response, 405, 'Method Not Allowed');
        }
        break;

      default:
        this.sendErrorResponse(response, 404, 'API endpoint not found');
        break;
    }
  }

  /**
   * 处理连接请求
   */
  private async handleConnect(context: HttpRequestContext): Promise<void> {
    const { request, response } = context;

    try {
      // 检查连接数限制
      if (this.config.maxConnections && this.httpConnections.size >= this.config.maxConnections) {
        this.sendErrorResponse(response, 429, 'Too many connections');
        return;
      }

      const connectionId = uuidv4();
      const remoteAddress = request.socket.remoteAddress || request.headers['x-forwarded-for'] || 'unknown';

      const connectionInfo: HttpConnectionInfo = {
        id: connectionId,
        remoteAddress: Array.isArray(remoteAddress) ? remoteAddress[0] : remoteAddress,
        connectedAt: new Date(),
        lastActivity: new Date(),
        userData: {},
        messageQueue: []
      };

      this.httpConnections.set(connectionId, connectionInfo);
      this.addConnection(connectionInfo);

      this.sendJsonResponse(response, 200, {
        success: true,
        connectionId,
        serverTime: Date.now()
      });

    } catch (error) {
      this.handleError(error as Error);
      this.sendErrorResponse(response, 500, 'Failed to create connection');
    }
  }

  /**
   * 处理断开连接请求
   */
  private async handleDisconnect(context: HttpRequestContext): Promise<void> {
    const { response, query } = context;

    const connectionId = query.connectionId;
    if (!connectionId) {
      this.sendErrorResponse(response, 400, 'Missing connectionId');
      return;
    }

    await this.disconnectClient(connectionId, 'client-disconnect');
    
    this.sendJsonResponse(response, 200, {
      success: true,
      message: 'Disconnected successfully'
    });
  }

  /**
   * 处理长轮询请求
   */
  private async handleLongPoll(context: HttpRequestContext): Promise<void> {
    const { response, query } = context;

    const connectionId = query.connectionId;
    if (!connectionId) {
      this.sendErrorResponse(response, 400, 'Missing connectionId');
      return;
    }

    const connection = this.httpConnections.get(connectionId);
    if (!connection) {
      this.sendErrorResponse(response, 404, 'Connection not found');
      return;
    }

    this.updateClientActivity(connectionId);

    // 如果有排队的消息，立即返回
    if (connection.messageQueue.length > 0) {
      const messages = connection.messageQueue.splice(0);
      this.sendLongPollResponse(connection, messages);
      return;
    }

    // 设置长轮询
    connection.longPollResponse = response;
    
    // 设置超时
    connection.longPollTimer = setTimeout(() => {
      this.sendLongPollResponse(connection, []);
    }, this.config.longPollTimeout);
  }

  /**
   * 处理发送消息请求
   */
  private async handleSendMessage(context: HttpRequestContext): Promise<void> {
    const { response, query, body } = context;

    const connectionId = query.connectionId;
    if (!connectionId) {
      this.sendErrorResponse(response, 400, 'Missing connectionId');
      return;
    }

    const connection = this.httpConnections.get(connectionId);
    if (!connection) {
      this.sendErrorResponse(response, 404, 'Connection not found');
      return;
    }

    if (!body) {
      this.sendErrorResponse(response, 400, 'Missing message body');
      return;
    }

    try {
      const message = JSON.parse(body) as TransportMessage;
      message.senderId = connectionId;
      
      this.handleMessage(connectionId, message);
      
      this.sendJsonResponse(response, 200, {
        success: true,
        message: 'Message sent successfully'
      });

    } catch (error) {
      this.sendErrorResponse(response, 400, 'Invalid message format');
    }
  }

  /**
   * 处理状态请求
   */
  private async handleStatus(context: HttpRequestContext): Promise<void> {
    const { response } = context;

    this.sendJsonResponse(response, 200, {
      success: true,
      status: 'running',
      connections: this.httpConnections.size,
      uptime: process.uptime(),
      serverTime: Date.now()
    });
  }

  /**
   * 读取请求体
   */
  private readRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      let totalSize = 0;

      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > this.config.maxRequestSize!) {
          reject(new Error('Request body too large'));
          return;
        }
        body += chunk.toString();
      });

      req.on('end', () => {
        resolve(body);
      });

      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 发送长轮询响应
   */
  private sendLongPollResponse(connection: HttpConnectionInfo, messages: TransportMessage[]): void {
    if (!connection.longPollResponse || connection.longPollResponse.headersSent) {
      return;
    }

    // 清理定时器
    if (connection.longPollTimer) {
      clearTimeout(connection.longPollTimer);
      connection.longPollTimer = undefined;
    }

    this.sendJsonResponse(connection.longPollResponse, 200, {
      success: true,
      messages
    });

    connection.longPollResponse = undefined;
  }

  /**
   * 设置 CORS 头
   */
  private setCorsHeaders(res: ServerResponse): void {
    const origins = this.config.corsOrigins!;
    const origin = origins.includes('*') ? '*' : origins[0];
    
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  /**
   * 发送 JSON 响应
   */
  private sendJsonResponse(res: ServerResponse, statusCode: number, data: any): void {
    if (res.headersSent) return;
    
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify(data));
  }

  /**
   * 发送错误响应
   */
  private sendErrorResponse(res: ServerResponse, statusCode: number, message: string): void {
    if (res.headersSent) return;
    
    this.sendJsonResponse(res, statusCode, {
      success: false,
      error: message,
      code: statusCode
    });
  }

  /**
   * 清理连接资源
   */
  private cleanupConnection(connectionId: string): void {
    const connection = this.httpConnections.get(connectionId);
    if (connection) {
      if (connection.longPollTimer) {
        clearTimeout(connection.longPollTimer);
      }
      if (connection.longPollResponse && !connection.longPollResponse.headersSent) {
        this.sendJsonResponse(connection.longPollResponse, 200, {
          success: true,
          messages: [],
          disconnected: true
        });
      }
      this.httpConnections.delete(connectionId);
    }
  }

  /**
   * 清理所有资源
   */
  private async cleanup(): Promise<void> {
    // 清理所有连接
    for (const connectionId of this.httpConnections.keys()) {
      this.cleanupConnection(connectionId);
    }
    this.clearConnections();

    // 关闭 HTTP 服务器
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = null;
    }
  }

  /**
   * 获取 HTTP 连接统计信息
   */
  getHttpStats(): {
    totalConnections: number;
    activeLongPolls: number;
    queuedMessages: number;
  } {
    let activeLongPolls = 0;
    let queuedMessages = 0;

    for (const connection of this.httpConnections.values()) {
      if (connection.longPollResponse && !connection.longPollResponse.headersSent) {
        activeLongPolls++;
      }
      queuedMessages += connection.messageQueue.length;
    }

    return {
      totalConnections: this.httpConnections.size,
      activeLongPolls,
      queuedMessages
    };
  }
}