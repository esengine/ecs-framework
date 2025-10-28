import { EditorPluginManager } from '@esengine/editor-core';
import type { IEditorPlugin } from '@esengine/editor-core';
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

    async loadProjectPlugins(projectPath: string, pluginManager: EditorPluginManager): Promise<void> {
        const pluginsPath = `${projectPath}/plugins`;

        try {
            const exists = await TauriAPI.pathExists(pluginsPath);
            if (!exists) {
                console.log('[PluginLoader] No plugins directory found');
                return;
            }

            const entries = await TauriAPI.listDirectory(pluginsPath);
            const pluginDirs = entries.filter(entry => entry.is_dir && !entry.name.startsWith('.'));
            console.log('[PluginLoader] Found plugin directories:', pluginDirs.map(d => d.name));

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
                console.log(`[PluginLoader] Plugin ${packageJson.name} already loaded`);
                return;
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

            const moduleUrl = `/@user-project/plugins/${pluginDirName}/${entryPoint}`;

            console.log(`[PluginLoader] Loading plugin from: ${moduleUrl}`);

            const module = await import(/* @vite-ignore */ moduleUrl);
            console.log(`[PluginLoader] Module loaded successfully`);

            let pluginInstance: IEditorPlugin | null = null;
            try {
                pluginInstance = this.findPluginInstance(module);
            } catch (findError) {
                console.error(`[PluginLoader] Error finding plugin instance:`, findError);
                console.error(`[PluginLoader] Module object:`, module);
                return;
            }

            if (!pluginInstance) {
                console.error(`[PluginLoader] No plugin instance found in ${packageJson.name}`);
                return;
            }

            await pluginManager.installEditor(pluginInstance);
            this.loadedPluginNames.add(packageJson.name);

            console.log(`[PluginLoader] Successfully loaded plugin: ${packageJson.name}`);
        } catch (error) {
            console.error(`[PluginLoader] Failed to load plugin from ${pluginPath}:`, error);
            if (error instanceof Error) {
                console.error(`[PluginLoader] Error stack:`, error.stack);
            }
        }
    }

    private findPluginInstance(module: any): IEditorPlugin | null {
        console.log('[PluginLoader] Module exports:', Object.keys(module));

        if (module.default && this.isPluginInstance(module.default)) {
            console.log('[PluginLoader] Found plugin in default export');
            return module.default;
        }

        for (const key of Object.keys(module)) {
            const value = module[key];
            if (value && this.isPluginInstance(value)) {
                console.log(`[PluginLoader] Found plugin in export: ${key}`);
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

            if (!hasRequiredProperties) {
                console.log('[PluginLoader] Object is not a valid plugin:', {
                    hasName: typeof obj.name === 'string',
                    hasVersion: typeof obj.version === 'string',
                    hasDisplayName: typeof obj.displayName === 'string',
                    hasCategory: typeof obj.category === 'string',
                    hasInstall: typeof obj.install === 'function',
                    hasUninstall: typeof obj.uninstall === 'function',
                    objectType: typeof obj,
                    objectConstructor: obj?.constructor?.name
                });
            }

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
        this.loadedPluginNames.clear();
    }
}
