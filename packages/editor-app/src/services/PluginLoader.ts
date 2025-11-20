import { EditorPluginManager, LocaleService, MessageHub } from '@esengine/editor-core';
import type { IEditorPlugin } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import { TauriAPI } from '../api/tauri';

interface PluginPackageJson {
    name: string;
    version: string;
    main?: string;
    module?: string;
    exports?: {
        '.': {
            import?: string;
            require?: string;
            development?: {
                types?: string;
                import?: string;
            };
        }
    };
}

export class PluginLoader {
    private loadedPluginNames: Set<string> = new Set();
    private moduleVersions: Map<string, number> = new Map();
    private loadedModuleUrls: Set<string> = new Set();

    async loadProjectPlugins(projectPath: string, pluginManager: EditorPluginManager): Promise<void> {
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

    private async loadPlugin(pluginPath: string, pluginDirName: string, pluginManager: EditorPluginManager): Promise<void> {
        try {
            const packageJsonPath = `${pluginPath}/package.json`;
            const packageJsonExists = await TauriAPI.pathExists(packageJsonPath);

            if (!packageJsonExists) {
                console.warn(`[PluginLoader] No package.json found in ${pluginPath}`);
                return;
            }

            const packageJsonContent = await TauriAPI.readFileContent(packageJsonPath);
            const packageJson: PluginPackageJson = JSON.parse(packageJsonContent);

            if (this.loadedPluginNames.has(packageJson.name)) {
                try {
                    await pluginManager.uninstallEditor(packageJson.name);
                    this.loadedPluginNames.delete(packageJson.name);
                } catch (error) {
                    console.error(`[PluginLoader] Failed to uninstall existing plugin ${packageJson.name}:`, error);
                }
            }

            let entryPoint = 'src/index.ts';

            if (packageJson.exports?.['.']?.development?.import) {
                entryPoint = packageJson.exports['.'].development.import;
            } else if (packageJson.exports?.['.']?.import) {
                const importPath = packageJson.exports['.'].import;
                if (importPath.startsWith('src/')) {
                    entryPoint = importPath;
                } else {
                    const srcPath = importPath.replace('dist/', 'src/').replace('.js', '.ts');
                    const srcExists = await TauriAPI.pathExists(`${pluginPath}/${srcPath}`);
                    entryPoint = srcExists ? srcPath : importPath;
                }
            } else if (packageJson.module) {
                const srcPath = packageJson.module.replace('dist/', 'src/').replace('.js', '.ts');
                const srcExists = await TauriAPI.pathExists(`${pluginPath}/${srcPath}`);
                entryPoint = srcExists ? srcPath : packageJson.module;
            } else if (packageJson.main) {
                const srcPath = packageJson.main.replace('dist/', 'src/').replace('.js', '.ts');
                const srcExists = await TauriAPI.pathExists(`${pluginPath}/${srcPath}`);
                entryPoint = srcExists ? srcPath : packageJson.main;
            }

            // 移除开头的 ./
            entryPoint = entryPoint.replace(/^\.\//, '');

            // 使用版本号+时间戳确保每次加载都是唯一URL
            const currentVersion = (this.moduleVersions.get(packageJson.name) || 0) + 1;
            this.moduleVersions.set(packageJson.name, currentVersion);
            const timestamp = Date.now();
            const moduleUrl = `/@user-project/plugins/${pluginDirName}/${entryPoint}?v=${currentVersion}&t=${timestamp}`;

            // 清除可能存在的旧模块缓存
            this.loadedModuleUrls.add(moduleUrl);

            const module = await import(/* @vite-ignore */ moduleUrl);

            let pluginInstance: IEditorPlugin | null = null;
            try {
                pluginInstance = this.findPluginInstance(module);
            } catch (findError) {
                console.error('[PluginLoader] Error finding plugin instance:', findError);
                console.error('[PluginLoader] Module object:', module);
                return;
            }

            if (!pluginInstance) {
                console.error(`[PluginLoader] No plugin instance found in ${packageJson.name}`);
                return;
            }

            await pluginManager.installEditor(pluginInstance);
            this.loadedPluginNames.add(packageJson.name);

            // 同步插件的语言设置
            try {
                const localeService = Core.services.resolve(LocaleService);
                const currentLocale = localeService.getCurrentLocale();
                if (pluginInstance.setLocale) {
                    pluginInstance.setLocale(currentLocale);
                }
            } catch (error) {
                console.warn(`[PluginLoader] Failed to set locale for plugin ${packageJson.name}:`, error);
            }

            // 通知节点面板重新加载模板
            try {
                const messageHub = Core.services.resolve(MessageHub);
                const localeService = Core.services.resolve(LocaleService);
                messageHub.publish('locale:changed', { locale: localeService.getCurrentLocale() });
            } catch (error) {
                console.warn('[PluginLoader] Failed to publish locale:changed event:', error);
            }
        } catch (error) {
            console.error(`[PluginLoader] Failed to load plugin from ${pluginPath}:`, error);
            if (error instanceof Error) {
                console.error('[PluginLoader] Error stack:', error.stack);
            }
        }
    }

    private findPluginInstance(module: any): IEditorPlugin | null {
        if (module.default && this.isPluginInstance(module.default)) {
            return module.default;
        }

        for (const key of Object.keys(module)) {
            const value = module[key];
            if (value && this.isPluginInstance(value)) {
                return value;
            }
        }

        console.error('[PluginLoader] No valid plugin instance found. Exports:', module);
        return null;
    }

    private isPluginInstance(obj: any): obj is IEditorPlugin {
        try {
            if (!obj || typeof obj !== 'object') {
                return false;
            }

            const hasRequiredProperties =
                typeof obj.name === 'string' &&
                typeof obj.version === 'string' &&
                typeof obj.displayName === 'string' &&
                typeof obj.category === 'string' &&
                typeof obj.install === 'function' &&
                typeof obj.uninstall === 'function';

            return hasRequiredProperties;
        } catch (error) {
            console.error('[PluginLoader] Error in isPluginInstance:', error);
            return false;
        }
    }

    async unloadProjectPlugins(pluginManager: EditorPluginManager): Promise<void> {
        for (const pluginName of this.loadedPluginNames) {
            try {
                await pluginManager.uninstallEditor(pluginName);
            } catch (error) {
                console.error(`[PluginLoader] Failed to unload plugin ${pluginName}:`, error);
            }
        }

        // 清除Vite模块缓存（如果HMR可用）
        this.invalidateModuleCache();

        this.loadedPluginNames.clear();
        this.loadedModuleUrls.clear();
    }

    private invalidateModuleCache(): void {
        try {
            // 尝试使用Vite HMR API无效化模块
            if (import.meta.hot) {
                import.meta.hot.invalidate();
            }
        } catch (error) {
            console.warn('[PluginLoader] Failed to invalidate module cache:', error);
        }
    }

    getLoadedPluginNames(): string[] {
        return Array.from(this.loadedPluginNames);
    }
}

declare global {
    interface ImportMeta {
        hot?: {
            invalidate(): void;
            accept(callback?: () => void): void;
            dispose(callback: () => void): void;
        };
    }
}
