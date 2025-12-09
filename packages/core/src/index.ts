/**
 * ECS Framework - 轻量级实体组件系统框架
 * 适用于Laya、Cocos Creator等JavaScript游戏引擎和H5小游戏开发
 */

// 核心模块
export { Core } from './Core';
export { ServiceContainer, ServiceLifetime } from './Core/ServiceContainer';
export type { IService, ServiceType, ServiceIdentifier } from './Core/ServiceContainer';

// 插件服务注册表（基于 ServiceToken 的类型安全服务管理）
// Plugin Service Registry (type-safe service management based on ServiceToken)
export { PluginServiceRegistry, createServiceToken } from './Core/PluginServiceRegistry';
export type { ServiceToken } from './Core/PluginServiceRegistry';

// 插件系统
export { PluginManager } from './Core/PluginManager';
export { PluginState } from './Core/Plugin';
export type { IPlugin, IPluginMetadata } from './Core/Plugin';

// 内置插件
export * from './Plugins';

// 依赖注入
export {
    Injectable,
    InjectProperty,
    Updatable,
    registerInjectable,
    createInstance,
    injectProperties,
    isUpdatable,
    getUpdatableMetadata,
    getPropertyInjectMetadata
} from './Core/DI';
export type { InjectableMetadata, UpdatableMetadata } from './Core/DI';

// 核心管理器
export { Emitter, FuncPack } from './Utils/Emitter';
export { GlobalManager } from './Utils/GlobalManager';
export { TimerManager } from './Utils/Timers/TimerManager';
export { ITimer } from './Utils/Timers/ITimer';
export { Timer } from './Utils/Timers/Timer';

// 日志系统
export {
    LoggerManager,
    ConsoleLogger,
    Logger,
    createLogger,
    setGlobalLogLevel,
    LogLevel
} from './Utils/Logger';
export type { ILogger, LoggerConfig } from './Utils/Logger';

// ECS核心组件
export * from './ECS';

// TypeScript类型增强API
export * from './ECS/TypedEntity';
export * from './ECS/Core/Query/TypedQuery';

// 事件系统
export { ECSEventType, EventPriority, EVENT_TYPES, EventTypeValidator } from './ECS/CoreEvents';

// 工具类和类型定义
export * from './Utils';
export * from './Types';

// 显式导出ComponentPool类（解决与Types中ComponentPool接口的命名冲突）
export { ComponentPool, ComponentPoolManager } from './ECS/Core/Storage';

// 平台适配
export * from './Platform';
