/**
 * ECS Framework Network Plugin - 网络插件
 * 
 * 为ECS框架提供网络同步和帧同步功能
 */

// 网络组件基类
export { NetworkComponent } from './NetworkComponent';
export { INetworkSyncable } from './INetworkSyncable';

// Protobuf序列化系统
export * from './Serialization';

// 快照系统（帧同步）
export * from './Snapshot';