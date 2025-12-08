/**
 * 项目插件加载器
 * Project Plugin Loader
 */

import { PluginManager, LocaleService, MessageHub } from '@esengine/editor-core';
import type { IPlugin, ModuleManifest } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import { TauriAPI } from '../api/tauri';
import { PluginSDKRegistry } from './PluginSDKRegistry';

interface PluginPackageJson {
    name: string;
    version: string;
    main?: string;
    module?: string;
    exports?: {
        '.': {
            import?: string;
            require?: string;
        }
    };
}

/**
 * 插件元数据（用于卸载时清理）
 */
interface LoadedPluginMeta {
    name: string;
    scriptElement?: HTMLScriptElement;
}

/**
 * 项目插件加载器
 *
 * 使用全局变量方案加载插件：
 * 1. 插件构建时将 @esengine/* 标记为 external
 * 2. 插件输出为 IIFE 格式，依赖从 window.__ESENGINE__ 获取
 * 3. 插件导出到 window.__ESENGINE_PLUGINS__[pluginName]
 */
export class PluginLoader {
    private loadedPlugins: Map<string, LoadedPluginMeta> = new Map();

    /**
     * 加载项目中的所有插件
     */
    async loadProjectPlugins(projectPath: string, pluginManager: PluginManager): Promise<void> {
        // 确保 SDK 已注册到全局
        PluginSDKRegistry.initialize();

        // 初始化插件容器
        this.initPluginContainer();

        const pluginsPath = `${projectPath}/plugins`;

        try {
            const exists = await TauriAPI.pathExists(pluginsPath);
            if (!exists) {
                return;
            }

            const entries = await TauriAPI.listDirectory(pluginsPath);
            const pluginDirs = entries.filter((entry) => entry.is_dir && !entry.name.startsWith('.'));

            for (const entry of pluginDirs) {
                const pluginPath = `${pluginsPath}/${entry.name}`;
                await this.loadPlugin(pluginPath, entry.name, pluginManager);
            }
        } catch (error) {
            console.error('[PluginLoader] Failed to load project plugins:', error);
        }
    }

    /**
     * 初始化插件容器
     */
    private initPluginContainer(): void {
        if (!window.__ESENGINE_PLUGINS__) {
            window.__ESENGINE_PLUGINS__ = {};
        }
    }

    /**
     * 加载单个插件
     */
    private async loadPlugin(
        pluginPath: string,
        pluginDirName: string,
        pluginManager: PluginManager
    ): Promise<void> {
        try {
            // 1. 读取 package.json
            const packageJson = await this.readPackageJson(pluginPath);
            if (!packageJson) {
                return;
            }

            // 2. 如果插件已加载，跳过
            if (this.loadedPlugins.has(packageJson.name)) {
                console.warn(`[PluginLoader] Plugin ${packageJson.name} already loaded`);
                return;
            }

            // 3. 确定入口文件
            const entryPoint = this.resolveEntryPoint(packageJson);

            // 4. 验证文件存在
            const fullPath = `${pluginPath}/${entryPoint}`;
            const exists = await TauriAPI.pathExists(fullPath);
            if (!exists) {
                console.error(`[PluginLoader] Plugin not built: ${fullPath}`);
                console.error(`[PluginLoader] Run: cd ${pluginPath} && npm run build`);
                return;
            }

            // 5. 读取插件代码
            const pluginCode = await TauriAPI.readFileContent(fullPath);

            // 6. 执行插件代码（CSS 应内联到 JS 中，会自动注入）
            const pluginLoader = await this.executePluginCode(
                pluginCode,
                packageJson.name,
                pluginDirName
            );

            if (!pluginLoader) {
                console.error(`[PluginLoader] No valid plugin found in ${packageJson.name}`);
                return;
            }

            // 7. 注册插件
            pluginManager.register(pluginLoader);

            // 8. 初始化编辑器模块（注册面板、文件处理器等）
            const pluginId = pluginLoader.manifest.id;
            await pluginManager.initializePluginEditor(pluginId, Core.services);

            // 9. 记录已加载
            this.loadedPlugins.set(packageJson.name, {
                name: packageJson.name,
            });

            // 10. 同步语言设置
            this.syncPluginLocale(pluginLoader, packageJson.name);

        } catch (error) {
            console.error(`[PluginLoader] Failed to load plugin from ${pluginPath}:`, error);
            if (error instanceof Error) {
                console.error('[PluginLoader] Stack:', error.stack);
            }
        }
    }

    /**
     * 执行插件代码并返回插件加载器
     */
    private async executePluginCode(
        code: string,
        pluginName: string,
        _pluginDirName: string
    ): Promise<IPlugin | null> {
        const pluginKey = this.sanitizePluginKey(pluginName);

        try {
            // 插件代码是 IIFE 格式，会自动导出到 window.__ESENGINE_PLUGINS__
            await this.executeViaScriptTag(code, pluginName);

            // 从全局容器获取插件模块
            const pluginModule = window.__ESENGINE_PLUGINS__[pluginKey];
            if (!pluginModule) {
                // 尝试其他可能的 key 格式
                const altKeys = Object.keys(window.__ESENGINE_PLUGINS__).filter(k =>
                    k.includes(pluginName.replace(/@/g, '').replace(/\//g, '_').replace(/-/g, '_'))
                );

                if (altKeys.length > 0 && altKeys[0] !== undefined) {
                    const foundKey = altKeys[0];
                    const altModule = window.__ESENGINE_PLUGINS__[foundKey];
                    return this.findPluginLoader(altModule);
                }

                console.error(`[PluginLoader] Plugin ${pluginName} did not export to __ESENGINE_PLUGINS__`);
                return null;
            }

            return this.findPluginLoader(pluginModule);

        } catch (error) {
            console.error(`[PluginLoader] Failed to execute plugin code for ${pluginName}:`, error);
            return null;
        }
    }

    /**
     * 通过 script 标签执行代码
     */
    private executeViaScriptTag(code: string, pluginName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const pluginKey = this.sanitizePluginKey(pluginName);

            const blob = new Blob([code], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);

            const script = document.createElement('script');
            script.id = `plugin-${pluginKey}`;
            script.async = false;

            script.onload = () => {
                URL.revokeObjectURL(blobUrl);
                resolve();
            };

            script.onerror = (e) => {
                URL.revokeObjectURL(blobUrl);
                reject(new Error(`Script load failed: ${e}`));
            };

            script.src = blobUrl;
            document.head.appendChild(script);
        });
    }

    /**
     * 清理插件名称为有效的 key
     */
    private sanitizePluginKey(pluginName: string): string {
        return pluginName.replace(/[@/\-.]/g, '_');
    }

    /**
     * 读取插件的 package.json
     */
    private async readPackageJson(pluginPath: string): Promise<PluginPackageJson | null> {
        const packageJsonPath = `${pluginPath}/package.json`;
        const exists = await TauriAPI.pathExists(packageJsonPath);

        if (!exists) {
            console.warn(`[PluginLoader] No package.json found in ${pluginPath}`);
            return null;
        }

        const content = await TauriAPI.readFileContent(packageJsonPath);
        return JSON.parse(content);
    }

    /**
     * 解析插件入口文件路径
     */
    private resolveEntryPoint(packageJson: PluginPackageJson): string {
        const entry = (
            packageJson.exports?.['.']?.import ||
            packageJson.module ||
            packageJson.main ||
            'dist/index.js'
        );
        return entry.replace(/^\.\//, '');
    }

    /**
     * 查找模块中的插件
     */
    private findPluginLoader(module: any): IPlugin | null {
        // 优先检查 default 导出
        if (module.default && this.isPluginLoader(module.default)) {
            return module.default;
        }

        // 检查命名导出（常见的命名：Plugin, XXXPlugin）
        for (const key of Object.keys(module)) {
            const value = module[key];
            if (value && this.isPluginLoader(value)) {
                return value;
            }
        }

        return null;
    }

    /**
     * 验证对象是否为有效的插件
     */
    private isPluginLoader(obj: any): obj is IPlugin {
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        // 新的 IPlugin 接口检查
        if (obj.manifest && this.isModuleManifest(obj.manifest)) {
            return true;
        }

        return false;
    }

    /**
     * 验证对象是否为有效的模块清单
     */
    private isModuleManifest(obj: any): obj is ModuleManifest {
        return (
            obj &&
            typeof obj.id === 'string' &&
            typeof obj.name === 'string' &&
            typeof obj.version === 'string'
        );
    }

    /**
     * 同步插件语言设置
     */
    private syncPluginLocale(plugin: IPlugin, pluginName: string): void {
        try {
            const localeService = Core.services.resolve(LocaleService);
            const currentLocale = localeService.getCurrentLocale();

            // 类型安全地检查 editorModule 是否有 setLocale 方法
            const editorModule = plugin.editorModule as { setLocale?: (locale: string) => void } | undefined;
            if (editorModule?.setLocale) {
                editorModule.setLocale(currentLocale);
            }

            // 通知 UI 刷新
            const messageHub = Core.services.resolve(MessageHub);
            messageHub.publish('locale:changed', { locale: currentLocale });
        } catch (error) {
            console.warn(`[PluginLoader] Failed to sync locale for ${pluginName}:`, error);
        }
    }

    /**
     * 卸载所有已加载的插件
     */
    async unloadProjectPlugins(_pluginManager: PluginManager): Promise<void> {
        for (const pluginName of this.loadedPlugins.keys()) {
            // 清理全局容器中的插件
            const pluginKey = this.sanitizePluginKey(pluginName);
            if (window.__ESENGINE_PLUGINS__?.[pluginKey]) {
                delete window.__ESENGINE_PLUGINS__[pluginKey];
            }

            // 移除 script 标签
            const scriptEl = document.getElementById(`plugin-${pluginKey}`);
            if (scriptEl) {
                scriptEl.remove();
            }
        }
        this.loadedPlugins.clear();
    }

    /**
     * 获取已加载的插件名称列表
     */
    getLoadedPluginNames(): string[] {
        return Array.from(this.loadedPlugins.keys());
    }
}

// 全局类型声明
declare global {
    interface Window {
        __ESENGINE_PLUGINS__: Record<string, any>;
    }
}
