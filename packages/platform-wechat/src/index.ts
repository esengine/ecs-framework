/**
 * 微信小游戏平台适配器包
 * @packageDocumentation
 */

// 主适配器
export { WeChatAdapter } from './WeChatAdapter';

// 引擎桥接
export { EngineBridge } from './EngineBridge';
export type { EngineBridgeConfig } from './EngineBridge';

// 子系统
export { WeChatCanvasSubsystem } from './subsystems/WeChatCanvasSubsystem';
export { WeChatAudioSubsystem } from './subsystems/WeChatAudioSubsystem';
export { WeChatStorageSubsystem } from './subsystems/WeChatStorageSubsystem';
export { WeChatNetworkSubsystem } from './subsystems/WeChatNetworkSubsystem';
export { WeChatInputSubsystem } from './subsystems/WeChatInputSubsystem';
export { WeChatFileSubsystem } from './subsystems/WeChatFileSubsystem';
export { WeChatWASMSubsystem } from './subsystems/WeChatWASMSubsystem';

// 工具
export { getWx, isWeChatMiniGame } from './utils';
