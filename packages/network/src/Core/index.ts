/**
 * 网络核心模块导出
 * 
 * 提供网络管理、连接和通信的核心功能
 */

export { NetworkManager } from './NetworkManager';
export { NetworkServer } from './NetworkServer';
export { NetworkClient } from './NetworkClient';
export { NetworkConnection, ConnectionState } from './NetworkConnection';
export { NetworkEnvironment, NetworkEnvironmentState } from './NetworkEnvironment';
export { NetworkIdentity, NetworkIdentityRegistry } from './NetworkIdentity';
export { NetworkPerformanceMonitor } from './NetworkPerformanceMonitor';
// 事件接口导出
export type { NetworkServerEvents } from './NetworkServer';
export type { NetworkClientEvents } from './NetworkClient';
export type { NetworkConnectionEvents } from './NetworkConnection';

// 性能监控类型导出
export type { NetworkMetrics, PerformanceSnapshot } from './NetworkPerformanceMonitor';