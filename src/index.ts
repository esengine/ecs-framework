/**
 * ECS Framework - 轻量级实体组件系统框架
 * 适用于Laya、Cocos等游戏引擎的小游戏开发
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

// ECS核心组件
export * from './ECS';

// 工具类和类型定义
export * from './Utils';
export * from './Types'; 