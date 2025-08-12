/**
 * ECS Framework Network Server
 * 
 * 提供完整的网络服务端功能，包括：
 * - WebSocket 和 HTTP 传输层
 * - 客户端连接管理
 * - 房间系统
 * - 身份验证和权限管理
 * - SyncVar 和 RPC 系统
 * - 消息验证
 */

// 核心模块
export * from './core';

// 房间系统
export * from './rooms';

// 认证系统
export * from './auth';

// 网络系统
export * from './systems';

// 验证系统
export * from './validation';

// 版本信息
export const VERSION = '1.0.0';

// 导出常用组合配置
export interface ServerConfigPreset {
  /** 服务器名称 */
  name: string;
  /** WebSocket 端口 */
  wsPort: number;
  /** HTTP 端口（可选） */
  httpPort?: number;
  /** 最大连接数 */
  maxConnections: number;
  /** 是否启用认证 */
  enableAuth: boolean;
  /** 是否启用房间系统 */
  enableRooms: boolean;
}

/**
 * 预定义服务器配置
 */
export const ServerPresets = {
  /** 开发环境配置 */
  Development: {
    name: 'Development Server',
    wsPort: 8080,
    httpPort: 3000,
    maxConnections: 100,
    enableAuth: false,
    enableRooms: true
  } as ServerConfigPreset,

  /** 生产环境配置 */
  Production: {
    name: 'Production Server',
    wsPort: 443,
    httpPort: 80,
    maxConnections: 10000,
    enableAuth: true,
    enableRooms: true
  } as ServerConfigPreset,

  /** 测试环境配置 */
  Testing: {
    name: 'Test Server',
    wsPort: 9090,
    maxConnections: 10,
    enableAuth: false,
    enableRooms: false
  } as ServerConfigPreset
};