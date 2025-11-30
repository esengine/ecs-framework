/**
 * Runtime Bootstrap
 * 运行时启动器 - 提供通用的初始化流程
 */

import { Core } from '@esengine/ecs-framework';
import type { IScene } from '@esengine/ecs-framework';
import {
    runtimePluginManager,
    type IPlugin,
    type IRuntimeModule,
    type PluginDescriptor,
    type SystemContext
} from './PluginManager';

export interface RuntimeConfig {
    enabledPlugins?: string[];
    isEditor?: boolean;
}

/**
 * 创建插件（简化工厂）
 */
export function createPlugin(
    descriptor: PluginDescriptor,
    runtimeModule: IRuntimeModule
): IPlugin {
    return { descriptor, runtimeModule };
}

/**
 * 注册插件到运行时
 */
export function registerPlugin(plugin: IPlugin): void {
    runtimePluginManager.register(plugin);
}

/**
 * 初始化运行时
 * @param config 运行时配置
 */
export async function initializeRuntime(config?: RuntimeConfig): Promise<void> {
    if (config?.enabledPlugins) {
        runtimePluginManager.loadConfig({ enabledPlugins: config.enabledPlugins });
    } else {
        for (const plugin of runtimePluginManager.getPlugins()) {
            runtimePluginManager.enable(plugin.descriptor.id);
        }
    }

    await runtimePluginManager.initializeRuntime(Core.services);
}

/**
 * 为场景创建系统
 */
export function createSystemsForScene(scene: IScene, context: SystemContext): void {
    runtimePluginManager.createSystemsForScene(scene, context);
}

/**
 * 重置运行时（用于热重载等场景）
 */
export function resetRuntime(): void {
    runtimePluginManager.reset();
}
