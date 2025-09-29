/**
 * ECS Framework - 轻量级实体组件系统框架
 * 适用于Laya、Cocos Creator等JavaScript游戏引擎和H5小游戏开发
 */

// 核心模块
export { Core } from './Core';

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

// 事件系统
export { ECSEventType, EventPriority, EVENT_TYPES, EventTypeValidator } from './ECS/CoreEvents';

// 工具类和类型定义
export * from './Utils';
export * from './Types';

// 平台适配
export * from './Platform'; 