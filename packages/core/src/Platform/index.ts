/**
 * 平台适配模块导出
 */

// 接口和类型
export type {
    IPlatformAdapter,
    PlatformWorker,
    WorkerCreationOptions,
    PlatformConfig,
    PlatformDetectionResult
} from './IPlatformAdapter';

// 平台检测器
export { PlatformDetector } from './PlatformDetector';

// 平台管理器
export { PlatformManager } from './PlatformManager';

// 内部导入用于便利函数
import { PlatformManager } from './PlatformManager';
import type { IPlatformAdapter } from './IPlatformAdapter';

// 便利函数
export function registerPlatformAdapter(adapter: IPlatformAdapter) {
    return PlatformManager.getInstance().registerAdapter(adapter);
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

export function hasAdapter() {
    return PlatformManager.getInstance().hasAdapter();
}
