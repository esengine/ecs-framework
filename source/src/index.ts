/**
 * ECS Framework - 轻量级实体组件系统框架
 * 适用于Laya、Cocos等游戏引擎的小游戏开发
 * @version 2.0.0
 * @author ECS Framework Team
 */

// 核心模块
export { Core } from './Core';

// 核心事件和管理器
export { CoreEvents } from './ECS/CoreEvents';
export { Emitter, FuncPack } from './Utils/Emitter';
export { GlobalManager } from './Utils/GlobalManager';
export { TimerManager } from './Utils/Timers/TimerManager';
export { ITimer } from './Utils/Timers/ITimer';
export { Timer } from './Utils/Timers/Timer';

// ECS核心
export * from './ECS';

// 数学库
export * from './Math';

// 工具类
export { Screen } from './Utils/Screen';
export * from './Utils/Pool';
export * from './Utils/PerformanceMonitor';
export * from './Utils/Extensions';

// 类型定义
export * from './Types'; 