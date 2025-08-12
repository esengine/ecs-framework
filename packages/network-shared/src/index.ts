/**
 * ECS Framework Network Shared
 * 
 * 共享的网络组件、装饰器和类型定义
 */

// 确保 reflect-metadata 被导入
import 'reflect-metadata';

// 类型定义
export * from './types';

// 装饰器
export * from './decorators';

// 核心类
export * from './core';

// 序列化工具
export * from './serialization';

// 协议编译器
export * from './protocol';

// 工具函数
export * from './utils';

// 版本信息
export const VERSION = '1.0.0';

// 默认配置
export const DEFAULT_NETWORK_CONFIG = {
  port: 7777,
  host: 'localhost',
  maxConnections: 100,
  syncRate: 20,
  snapshotRate: 5,
  compression: true,
  encryption: false,
  timeout: 30000,
  maxReconnectAttempts: 3,
  reconnectInterval: 5000
};