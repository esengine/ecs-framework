import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger, Scene } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';
import { SceneTemplateRegistry } from './SceneTemplateRegistry';
import type { IFileAPI } from '../Types/IFileAPI';

const logger = createLogger('ProjectService');

export type ProjectType = 'esengine' | 'unknown';

export interface ProjectInfo {
    path: string;
    type: ProjectType;
    name: string;
    configPath?: string;
}

/**
 * UI 设计分辨率配置
 * UI Design Resolution Configuration
 */
export interface UIDesignResolution {
    /** 设计宽度 / Design width */
    width: number;
    /** 设计高度 / Design height */
    height: number;
}

/**
 * 插件配置
 * Plugin Configuration
 */
export interface PluginSettings {
    /** 启用的插件 ID 列表 / Enabled plugin IDs */
    enabledPlugins: string[];
}

/**
 * 模块配置
 * Module Configuration
 */
export interface ModuleSettings {
    /**
     * 禁用的模块 ID 列表（黑名单方式）
     * Disabled module IDs (blacklist approach)
     * Modules NOT in this list are enabled.
     * 不在此列表中的模块为启用状态。
     */
    disabledModules: string[];
}

/**
 * 构建配置
 * Build Settings Configuration
 *
 * Persisted build settings for the project.
 * 项目的持久化构建设置。
 */
export interface BuildSettingsConfig {
    /** Selected scenes for build | 构建选中的场景 */
    scenes?: string[];
    /** Scripting defines | 脚本定义 */
    scriptingDefines?: string[];
    /** Company name | 公司名 */
    companyName?: string;
    /** Product name | 产品名 */
    productName?: string;
    /** Version | 版本号 */
    version?: string;
    /** Development build | 开发构建 */
    developmentBuild?: boolean;
    /** Source map | 源码映射 */
    sourceMap?: boolean;
    /** Compression method | 压缩方式 */
    compressionMethod?: 'Default' | 'LZ4' | 'LZ4HC';
    /** Web build mode | Web 构建模式 */
    buildMode?: 'split-bundles' | 'single-bundle' | 'single-file';
}

export interface ProjectConfig {
    projectType?: ProjectType;
    /** User scripts directory (default: 'scripts') | 用户脚本目录（默认：'scripts'） */
    scriptsPath?: string;
    /** Build output directory | 构建输出目录 */
    buildOutput?: string;
    /** Scenes directory | 场景目录 */
    scenesPath?: string;
    /** Default scene file | 默认场景文件 */
    defaultScene?: string;
    /** UI design resolution | UI 设计分辨率 */
    uiDesignResolution?: UIDesignResolution;
    /** Plugin settings | 插件配置 */
    plugins?: PluginSettings;
    /** Module settings | 模块配置 */
    modules?: ModuleSettings;
    /** Build settings | 构建配置 */
    buildSettings?: BuildSettingsConfig;
}

@Injectable()
export class ProjectService implements IService {
    private currentProject: ProjectInfo | null = null;
    private projectConfig: ProjectConfig | null = null;
    private messageHub: MessageHub;
    private fileAPI: IFileAPI;

    constructor(messageHub: MessageHub, fileAPI: IFileAPI) {
        this.messageHub = messageHub;
        this.fileAPI = fileAPI;
    }

    public async createProject(projectPath: string): Promise<void> {
        try {
            const sep = projectPath.includes('\\') ? '\\' : '/';
            const configPath = `${projectPath}${sep}ecs-editor.config.json`;

            const configExists = await this.fileAPI.pathExists(configPath);
            if (configExists) {
                throw new Error('ECS project already exists in this directory');
            }

            const config: ProjectConfig = {
                projectType: 'esengine',
                scriptsPath: 'scripts',
                buildOutput: '.esengine/compiled',
                scenesPath: 'scenes',
                defaultScene: 'main.ecs',
                plugins: { enabledPlugins: [] },
                modules: { disabledModules: [] }
            };

            await this.fileAPI.writeFileContent(configPath, JSON.stringify(config, null, 2));

            // Create scenes folder and default scene
            // 创建场景文件夹和默认场景
            const scenesPath = `${projectPath}${sep}${config.scenesPath}`;
            await this.fileAPI.createDirectory(scenesPath);

            const defaultScenePath = `${scenesPath}${sep}${config.defaultScene}`;
            const defaultScene = new Scene();

            // 使用场景模板注册表创建默认实体（如相机）
            // Use scene template registry to create default entities (e.g., camera)
            SceneTemplateRegistry.createDefaultEntities(defaultScene);

            const sceneData = defaultScene.serialize({
                format: 'json',
                pretty: true,
                includeMetadata: true
            }) as string;
            await this.fileAPI.writeFileContent(defaultScenePath, sceneData);

            // Create scripts folder for user scripts
            // 创建用户脚本文件夹
            const scriptsPath = `${projectPath}${sep}${config.scriptsPath}`;
            await this.fileAPI.createDirectory(scriptsPath);

            // Create scripts/editor folder for editor extension scripts
            // 创建编辑器扩展脚本文件夹
            const editorScriptsPath = `${scriptsPath}${sep}editor`;
            await this.fileAPI.createDirectory(editorScriptsPath);

            // Create assets folder for project assets (textures, audio, etc.)
            // 创建资源文件夹（纹理、音频等）
            const assetsPath = `${projectPath}${sep}assets`;
            await this.fileAPI.createDirectory(assetsPath);

            // Create tsconfig.json for runtime scripts (components, systems)
            // 创建运行时脚本的 tsconfig.json（组件、系统等）
            // Note: paths will be populated by update_project_tsconfig when project is opened
            // 注意：paths 会在项目打开时由 update_project_tsconfig 填充
            const tsConfig = {
                compilerOptions: {
                    target: 'ES2020',
                    module: 'ESNext',
                    moduleResolution: 'bundler',
                    lib: ['ES2020', 'DOM'],
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true,
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                    noEmit: true
                    // paths will be added by editor when project is opened
                    // paths 会在编辑器打开项目时添加
                },
                include: ['scripts/**/*.ts'],
                exclude: ['scripts/editor/**/*.ts', '.esengine']
            };
            const tsConfigPath = `${projectPath}${sep}tsconfig.json`;
            await this.fileAPI.writeFileContent(tsConfigPath, JSON.stringify(tsConfig, null, 2));

            // Create tsconfig.editor.json for editor extension scripts
            // 创建编辑器扩展脚本的 tsconfig.editor.json
            const tsConfigEditor = {
                compilerOptions: {
                    target: 'ES2020',
                    module: 'ESNext',
                    moduleResolution: 'bundler',
                    lib: ['ES2020', 'DOM'],
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true,
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                    noEmit: true
                    // paths will be added by editor when project is opened
                    // paths 会在编辑器打开项目时添加
                },
                include: ['scripts/editor/**/*.ts'],
                exclude: ['.esengine']
            };
            const tsConfigEditorPath = `${projectPath}${sep}tsconfig.editor.json`;
            await this.fileAPI.writeFileContent(tsConfigEditorPath, JSON.stringify(tsConfigEditor, null, 2));

            await this.messageHub.publish('project:created', {
                path: projectPath
            });

            logger.info('Project created', { path: projectPath });
        } catch (error) {
            logger.error('Failed to create project', error);
            throw error;
        }
    }

    public async openProject(projectPath: string): Promise<void> {
        try {
            const projectInfo = await this.validateProject(projectPath);

            this.currentProject = projectInfo;

            if (projectInfo.configPath) {
                this.projectConfig = await this.loadConfig(projectInfo.configPath);
            }

            await this.messageHub.publish('project:opened', {
                path: projectPath,
                type: projectInfo.type,
                name: projectInfo.name
            });

            logger.info('Project opened', { path: projectPath, type: projectInfo.type });
        } catch (error) {
            logger.error('Failed to open project', error);
            throw error;
        }
    }

    public async closeProject(): Promise<void> {
        if (!this.currentProject) {
            logger.warn('No project is currently open');
            return;
        }

        const projectPath = this.currentProject.path;
        this.currentProject = null;
        this.projectConfig = null;

        await this.messageHub.publish('project:closed', { path: projectPath });
        logger.info('Project closed', { path: projectPath });
    }

    public getCurrentProject(): ProjectInfo | null {
        return this.currentProject;
    }

    public getProjectConfig(): ProjectConfig | null {
        return this.projectConfig;
    }

    public isProjectOpen(): boolean {
        return this.currentProject !== null;
    }

    /**
     * Get user scripts directory path.
     * 获取用户脚本目录路径。
     *
     * @returns Scripts directory path | 脚本目录路径
     */
    public getScriptsPath(): string | null {
        if (!this.currentProject) {
            return null;
        }
        const scriptsPath = this.projectConfig?.scriptsPath || 'scripts';
        const sep = this.currentProject.path.includes('\\') ? '\\' : '/';
        return `${this.currentProject.path}${sep}${scriptsPath}`;
    }

    /**
     * Get editor scripts directory path (scripts/editor).
     * 获取编辑器脚本目录路径（scripts/editor）。
     *
     * @returns Editor scripts directory path | 编辑器脚本目录路径
     */
    public getEditorScriptsPath(): string | null {
        const scriptsPath = this.getScriptsPath();
        if (!scriptsPath) {
            return null;
        }
        const sep = scriptsPath.includes('\\') ? '\\' : '/';
        return `${scriptsPath}${sep}editor`;
    }

    public getScenesPath(): string | null {
        if (!this.currentProject) {
            return null;
        }
        const scenesPath = this.projectConfig?.scenesPath || 'assets/scenes';
        const sep = this.currentProject.path.includes('\\') ? '\\' : '/';
        return `${this.currentProject.path}${sep}${scenesPath}`;
    }

    public getDefaultScenePath(): string | null {
        if (!this.currentProject) {
            return null;
        }
        const scenesPath = this.getScenesPath();
        if (!scenesPath) {
            return null;
        }
        const defaultScene = this.projectConfig?.defaultScene || 'main.scene';
        const sep = this.currentProject.path.includes('\\') ? '\\' : '/';
        return `${scenesPath}${sep}${defaultScene}`;
    }

    private async validateProject(projectPath: string): Promise<ProjectInfo> {
        const projectName = projectPath.split(/[\\/]/).pop() || 'Unknown Project';

        const projectInfo: ProjectInfo = {
            path: projectPath,
            type: 'unknown',
            name: projectName
        };

        const sep = projectPath.includes('\\') ? '\\' : '/';
        const configPath = `${projectPath}${sep}ecs-editor.config.json`;

        try {
            projectInfo.configPath = configPath;
            projectInfo.type = 'esengine';
        } catch (error) {
            logger.warn('No ecs-editor.config.json found, using defaults');
        }

        return projectInfo;
    }

    private async loadConfig(configPath: string): Promise<ProjectConfig> {
        try {
            const content = await this.fileAPI.readFileContent(configPath);
            logger.debug('Raw config content:', content);
            const config = JSON.parse(content) as ProjectConfig;
            logger.debug('Parsed config plugins:', config.plugins);
            const result: ProjectConfig = {
                projectType: config.projectType || 'esengine',
                scriptsPath: config.scriptsPath || 'scripts',
                buildOutput: config.buildOutput || '.esengine/compiled',
                scenesPath: config.scenesPath || 'scenes',
                defaultScene: config.defaultScene || 'main.ecs',
                uiDesignResolution: config.uiDesignResolution,
                // Provide default empty plugins config for legacy projects
                // 为旧项目提供默认的空插件配置
                plugins: config.plugins || { enabledPlugins: [] },
                modules: config.modules || { disabledModules: [] }
            };
            logger.debug('Loaded config result:', result);
            return result;
        } catch (error) {
            logger.warn('Failed to load config, using defaults', error);
            return {
                projectType: 'esengine',
                scriptsPath: 'scripts',
                buildOutput: '.esengine/compiled',
                scenesPath: 'scenes',
                defaultScene: 'main.ecs'
            };
        }
    }

    /**
     * 保存项目配置
     */
    public async saveConfig(): Promise<void> {
        if (!this.currentProject?.configPath || !this.projectConfig) {
            logger.warn('No project or config to save');
            return;
        }

        try {
            const content = JSON.stringify(this.projectConfig, null, 2);
            await this.fileAPI.writeFileContent(this.currentProject.configPath, content);
            logger.info('Project config saved');
        } catch (error) {
            logger.error('Failed to save project config', error);
            throw error;
        }
    }

    /**
     * 更新项目配置
     */
    public async updateConfig(updates: Partial<ProjectConfig>): Promise<void> {
        if (!this.projectConfig) {
            logger.warn('No project config to update');
            return;
        }

        this.projectConfig = {
            ...this.projectConfig,
            ...updates
        };

        await this.saveConfig();
        await this.messageHub.publish('project:configUpdated', { config: this.projectConfig });
    }

    /**
     * 获取 UI 设计分辨率
     * Get UI design resolution
     *
     * @returns UI design resolution, defaults to 1920x1080 if not set
     */
    public getUIDesignResolution(): UIDesignResolution {
        return this.projectConfig?.uiDesignResolution || { width: 1920, height: 1080 };
    }

    /**
     * 设置 UI 设计分辨率
     * Set UI design resolution
     *
     * @param resolution - The new design resolution
     */
    public async setUIDesignResolution(resolution: UIDesignResolution): Promise<void> {
        await this.updateConfig({ uiDesignResolution: resolution });
    }

    /**
     * 获取启用的插件列表
     * Get enabled plugins list
     */
    public getEnabledPlugins(): string[] {
        return this.projectConfig?.plugins?.enabledPlugins || [];
    }

    /**
     * 获取插件配置
     * Get plugin settings
     */
    public getPluginSettings(): PluginSettings | null {
        logger.debug('getPluginSettings called, projectConfig:', this.projectConfig);
        logger.debug('getPluginSettings plugins:', this.projectConfig?.plugins);
        return this.projectConfig?.plugins || null;
    }

    /**
     * 设置启用的插件列表
     * Set enabled plugins list
     *
     * @param enabledPlugins - Array of enabled plugin IDs
     */
    public async setEnabledPlugins(enabledPlugins: string[]): Promise<void> {
        await this.updateConfig({
            plugins: {
                enabledPlugins
            }
        });
        await this.messageHub.publish('project:pluginsChanged', { enabledPlugins });
        logger.info('Plugin settings saved', { count: enabledPlugins.length });
    }

    /**
     * 启用插件
     * Enable a plugin
     */
    public async enablePlugin(pluginId: string): Promise<void> {
        const current = this.getEnabledPlugins();
        if (!current.includes(pluginId)) {
            await this.setEnabledPlugins([...current, pluginId]);
        }
    }

    /**
     * 禁用插件
     * Disable a plugin
     */
    public async disablePlugin(pluginId: string): Promise<void> {
        const current = this.getEnabledPlugins();
        await this.setEnabledPlugins(current.filter(id => id !== pluginId));
    }

    // ==================== Module Settings ====================

    /**
     * 获取禁用的模块列表（黑名单）
     * Get disabled modules list (blacklist)
     * @returns Array of disabled module IDs
     */
    public getDisabledModules(): string[] {
        return this.projectConfig?.modules?.disabledModules || [];
    }

    /**
     * 获取模块配置
     * Get module settings
     */
    public getModuleSettings(): ModuleSettings | null {
        return this.projectConfig?.modules || null;
    }

    /**
     * 设置禁用的模块列表
     * Set disabled modules list
     *
     * @param disabledModules - Array of disabled module IDs
     */
    public async setDisabledModules(disabledModules: string[]): Promise<void> {
        await this.updateConfig({
            modules: {
                disabledModules
            }
        });
        await this.messageHub.publish('project:modulesChanged', { disabledModules });
        logger.info('Module settings saved', { disabledCount: disabledModules.length });
    }

    /**
     * 禁用模块
     * Disable a module
     */
    public async disableModule(moduleId: string): Promise<void> {
        const current = this.getDisabledModules();
        if (!current.includes(moduleId)) {
            await this.setDisabledModules([...current, moduleId]);
        }
    }

    /**
     * 启用模块
     * Enable a module
     */
    public async enableModule(moduleId: string): Promise<void> {
        const current = this.getDisabledModules();
        await this.setDisabledModules(current.filter(id => id !== moduleId));
    }

    /**
     * 检查模块是否启用
     * Check if a module is enabled
     */
    public isModuleEnabled(moduleId: string): boolean {
        const disabled = this.getDisabledModules();
        return !disabled.includes(moduleId);
    }

    // ==================== Build Settings ====================

    /**
     * 获取构建设置
     * Get build settings
     */
    public getBuildSettings(): BuildSettingsConfig | null {
        return this.projectConfig?.buildSettings || null;
    }

    /**
     * 更新构建设置
     * Update build settings
     *
     * @param settings - Build settings to update (partial)
     */
    public async updateBuildSettings(settings: Partial<BuildSettingsConfig>): Promise<void> {
        const current = this.projectConfig?.buildSettings || {};
        await this.updateConfig({
            buildSettings: {
                ...current,
                ...settings
            }
        });
        await this.messageHub.publish('project:buildSettingsChanged', { settings });
        logger.info('Build settings saved');
    }

    public dispose(): void {
        this.currentProject = null;
        this.projectConfig = null;
        logger.info('ProjectService disposed');
    }
}
