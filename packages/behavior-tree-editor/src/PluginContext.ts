import type { ServiceContainer } from '@esengine/editor-runtime';

/**
 * 插件上下文
 * 存储插件安装时传入的服务容器引用
 */
class PluginContextClass {
    private _services: ServiceContainer | null = null;

    setServices(services: ServiceContainer): void {
        this._services = services;
    }

    getServices(): ServiceContainer {
        if (!this._services) {
            throw new Error('PluginContext not initialized. Make sure the plugin is properly installed.');
        }
        return this._services;
    }

    clear(): void {
        this._services = null;
    }
}

export const PluginContext = new PluginContextClass();
