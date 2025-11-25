import { EditorPluginManager, LocaleService, MessageHub } from '@esengine/editor-core';
import type { IEditorPlugin } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import { TauriAPI } from '../api/tauri';
import { importMapManager } from './ImportMapManager';

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
 * 插件加载器
 *
 * 负责从项目的 plugins 目录加载用户插件。
 * 统一使用 project:// 协议加载预编译的 JS 文件。
 */
export class PluginLoader {
    private loadedPluginNames: Set<string> = new Set();
    private moduleVersions: Map<string, number> = new Map();

    /**
     * 加载项目中的所有插件
     */
    async loadProjectPlugins(projectPath: string, pluginManager: EditorPluginManager): Promise<void> {
        // 确保 Import Map 已初始化
        await importMapManager.initialize();

        const pluginsPath = `${projectPath}/plugins`;

        try {
            const exists = await TauriAPI.pathExists(pluginsPath);
            if (!exists) {
                console.log('[PluginLoader] No plugins directory found');
                return;
            }

            const entries = await TauriAPI.listDirectory(pluginsPath);
            const pluginDirs = entries.filter((entry) => entry.is_dir && !entry.name.startsWith('.'));

            console.log(`[PluginLoader] Found ${pluginDirs.length} plugin(s)`);

            for (const entry of pluginDirs) {
                const pluginPath = `${pluginsPath}/${entry.name}`;
                await this.loadPlugin(pluginPath, entry.name, pluginManager);
            }
        } catch (error) {
            console.error('[PluginLoader] Failed to load project plugins:', error);
        }
    }

    /**
     * 加载单个插件
     */
    private async loadPlugin(
        pluginPath: string,
        pluginDirName: string,
        pluginManager: EditorPluginManager
    ): Promise<void> {
        try {
            // 1. 读取 package.json
            const packageJson = await this.readPackageJson(pluginPath);
            if (!packageJson) {
                return;
            }

            // 2. 如果插件已加载，先卸载
            if (this.loadedPluginNames.has(packageJson.name)) {
                await this.unloadPlugin(packageJson.name, pluginManager);
            }

            // 3. 确定入口文件（必须是编译后的 JS）
            const entryPoint = this.resolveEntryPoint(packageJson);

            // 4. 验证文件存在
            const fullPath = `${pluginPath}/${entryPoint}`;
            const exists = await TauriAPI.pathExists(fullPath);
            if (!exists) {
                console.error(`[PluginLoader] Plugin not built: ${fullPath}`);
                console.error(`[PluginLoader] Run: cd ${pluginPath} && npm run build`);
                return;
            }

            // 5. 构建模块 URL（使用 project:// 协议）
            const moduleUrl = this.buildModuleUrl(pluginDirName, entryPoint, packageJson.name);
            console.log(`[PluginLoader] Loading: ${packageJson.name} from ${moduleUrl}`);

            // 6. 动态导入模块
            const module = await import(/* @vite-ignore */ moduleUrl);

            // 7. 查找并验证插件实例
            const pluginInstance = this.findPluginInstance(module);
            if (!pluginInstance) {
                console.error(`[PluginLoader] No valid plugin instance found in ${packageJson.name}`);
                return;
            }

            // 8. 安装插件
            await pluginManager.installEditor(pluginInstance);
            this.loadedPluginNames.add(packageJson.name);
            console.log(`[PluginLoader] Successfully loaded: ${packageJson.name}`);

            // 9. 同步语言设置
            this.syncPluginLocale(pluginInstance, packageJson.name);

        } catch (error) {
            console.error(`[PluginLoader] Failed to load plugin from ${pluginPath}:`, error);
            if (error instanceof Error) {
                console.error('[PluginLoader] Stack:', error.stack);
            }
        }
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
     * 解析插件入口文件路径（始终使用编译后的 JS）
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
     * 构建模块 URL（使用 project:// 协议）
     *
     * Windows 上需要用 http://project.localhost/ 格式
     * macOS/Linux 上用 project://localhost/ 格式
     */
    private buildModuleUrl(pluginDirName: string, entryPoint: string, pluginName: string): string {
        // 版本号 + 时间戳确保每次加载都是新模块（绕过浏览器缓存）
        const version = (this.moduleVersions.get(pluginName) || 0) + 1;
        this.moduleVersions.set(pluginName, version);
        const timestamp = Date.now();

        const path = `/plugins/${pluginDirName}/${entryPoint}?v=${version}&t=${timestamp}`;

        // Windows 使用 http://scheme.localhost 格式
        // macOS/Linux 使用 scheme://localhost 格式
        const isWindows = navigator.userAgent.includes('Windows');
        if (isWindows) {
            return `http://project.localhost${path}`;
        }
        return `project://localhost${path}`;
    }

    /**
     * 查找模块中的插件实例
     */
    private findPluginInstance(module: any): IEditorPlugin | null {
        // 优先检查 default 导出
        if (module.default && this.isPluginInstance(module.default)) {
            return module.default;
        }

        // 检查命名导出
        for (const key of Object.keys(module)) {
            const value = module[key];
            if (value && this.isPluginInstance(value)) {
                return value;
            }
        }

        return null;
    }

    /**
     * 验证对象是否为有效的插件实例
     */
    private isPluginInstance(obj: any): obj is IEditorPlugin {
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        return (
            typeof obj.name === 'string' &&
            typeof obj.version === 'string' &&
            typeof obj.displayName === 'string' &&
            typeof obj.category === 'string' &&
            typeof obj.install === 'function' &&
            typeof obj.uninstall === 'function'
        );
    }

    /**
     * 同步插件语言设置
     */
    private syncPluginLocale(plugin: IEditorPlugin, pluginName: string): void {
        try {
            const localeService = Core.services.resolve(LocaleService);
            const currentLocale = localeService.getCurrentLocale();

            if (plugin.setLocale) {
                plugin.setLocale(currentLocale);
            }

            // 通知 UI 刷新
            const messageHub = Core.services.resolve(MessageHub);
            messageHub.publish('locale:changed', { locale: currentLocale });
        } catch (error) {
            console.warn(`[PluginLoader] Failed to sync locale for ${pluginName}:`, error);
        }
    }

    /**
     * 卸载单个插件
     */
    private async unloadPlugin(pluginName: string, pluginManager: EditorPluginManager): Promise<void> {
        try {
            await pluginManager.uninstallEditor(pluginName);
            this.loadedPluginNames.delete(pluginName);
            console.log(`[PluginLoader] Unloaded: ${pluginName}`);
        } catch (error) {
            console.error(`[PluginLoader] Failed to unload ${pluginName}:`, error);
        }
    }

    /**
     * 卸载所有已加载的插件
     */
    async unloadProjectPlugins(pluginManager: EditorPluginManager): Promise<void> {
        for (const pluginName of this.loadedPluginNames) {
            await this.unloadPlugin(pluginName, pluginManager);
        }
        this.loadedPluginNames.clear();
    }

    /**
     * 获取已加载的插件名称列表
     */
    getLoadedPluginNames(): string[] {
        return Array.from(this.loadedPluginNames);
    }
}
