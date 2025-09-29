/**
 * 平台适配模块导出
 */

// 接口和类型
export type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig,
    PlatformDetectionResult,
    WeChatDeviceInfo,
    BrowserDeviceInfo
} from './IPlatformAdapter';

// 平台检测器
export { PlatformDetector } from './PlatformDetector';

// 平台管理器
export { PlatformManager } from './PlatformManager';

// 平台适配器实现
export { BrowserAdapter } from './BrowserAdapter';
export { WeChatMiniGameAdapter } from './WeChatMiniGameAdapter';

// 内部导入用于便利函数
import { PlatformManager } from './PlatformManager';

// 便利函数
export function getCurrentPlatform() {
    return PlatformManager.getInstance().getDetectionResult();
}

export function getCurrentAdapter() {
    return PlatformManager.getInstance().getAdapter();
}

export function getBasicWorkerConfig() {
    return PlatformManager.getInstance().getBasicWorkerConfig();
}

export function getFullPlatformConfig() {
    return PlatformManager.getInstance().getFullPlatformConfig();
}

export function supportsFeature(feature: 'worker' | 'shared-array-buffer' | 'transferable-objects' | 'module-worker') {
    return PlatformManager.getInstance().supportsFeature(feature);
}