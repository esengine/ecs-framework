/**
 * Runtime Plugin Manager
 * 运行时插件管理器
 */

import { ComponentRegistry, ServiceContainer } from '@esengine/esengine';
import type { IScene } from '@esengine/esengine';
import type { IPlugin, IRuntimeModule, SystemContext, ModuleManifest } from '@esengine/engine-core';

export type { IPlugin, IRuntimeModule, SystemContext, ModuleManifest };

export class RuntimePluginManager {
    private _plugins = new Map<string, IPlugin>();
    private _enabledPlugins = new Set<string>();
    private _bInitialized = false;

    register(plugin: IPlugin): void {
        const id = plugin.manifest.id;
        if (this._plugins.has(id)) {
            return;
        }
        this._plugins.set(id, plugin);
        if (plugin.manifest.defaultEnabled !== false) {
            this._enabledPlugins.add(id);
        }
    }

    enable(pluginId: string): void {
        this._enabledPlugins.add(pluginId);
    }

    disable(pluginId: string): void {
        this._enabledPlugins.delete(pluginId);
    }

    isEnabled(pluginId: string): boolean {
        return this._enabledPlugins.has(pluginId);
    }

    loadConfig(config: { enabledPlugins: string[] }): void {
        this._enabledPlugins.clear();
        for (const id of config.enabledPlugins) {
            this._enabledPlugins.add(id);
        }
        // 始终启用引擎核心模块
        for (const [id, plugin] of this._plugins) {
            if (plugin.manifest.isEngineModule) {
                this._enabledPlugins.add(id);
            }
        }
    }

    async initializeRuntime(services: ServiceContainer): Promise<void> {
        if (this._bInitialized) {
            return;
        }

        for (const [id, plugin] of this._plugins) {
            if (!this._enabledPlugins.has(id)) continue;
            const mod = plugin.runtimeModule;
            if (mod?.registerComponents) {
                try {
                    mod.registerComponents(ComponentRegistry);
                } catch (e) {
                    console.error(`[PluginManager] Failed to register components for ${id}:`, e);
                }
            }
        }

        for (const [id, plugin] of this._plugins) {
            if (!this._enabledPlugins.has(id)) continue;
            const mod = plugin.runtimeModule;
            if (mod?.registerServices) {
                try {
                    mod.registerServices(services);
                } catch (e) {
                    console.error(`[PluginManager] Failed to register services for ${id}:`, e);
                }
            }
        }

        for (const [id, plugin] of this._plugins) {
            if (!this._enabledPlugins.has(id)) continue;
            const mod = plugin.runtimeModule;
            if (mod?.onInitialize) {
                try {
                    await mod.onInitialize();
                } catch (e) {
                    console.error(`[PluginManager] Failed to initialize ${id}:`, e);
                }
            }
        }

        this._bInitialized = true;
    }

    createSystemsForScene(scene: IScene, context: SystemContext): void {
        // Phase 1: 创建系统
        for (const [id, plugin] of this._plugins) {
            if (!this._enabledPlugins.has(id)) continue;
            const mod = plugin.runtimeModule;
            if (mod?.createSystems) {
                try {
                    mod.createSystems(scene, context);
                } catch (e) {
                    console.error(`[PluginManager] Failed to create systems for ${id}:`, e);
                }
            }
        }

        // Phase 2: 连接跨插件依赖
        for (const [id, plugin] of this._plugins) {
            if (!this._enabledPlugins.has(id)) continue;
            const mod = plugin.runtimeModule;
            if (mod?.onSystemsCreated) {
                try {
                    mod.onSystemsCreated(scene, context);
                } catch (e) {
                    console.error(`[PluginManager] Failed to wire dependencies for ${id}:`, e);
                }
            }
        }
    }

    getPlugins(): IPlugin[] {
        return Array.from(this._plugins.values());
    }

    getPlugin(id: string): IPlugin | undefined {
        return this._plugins.get(id);
    }

    reset(): void {
        this._plugins.clear();
        this._enabledPlugins.clear();
        this._bInitialized = false;
    }
}

export const runtimePluginManager = new RuntimePluginManager();
