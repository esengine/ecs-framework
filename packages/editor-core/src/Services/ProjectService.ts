import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger, Scene } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';
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

export interface ProjectConfig {
    projectType?: ProjectType;
    componentsPath?: string;
    componentPattern?: string;
    buildOutput?: string;
    scenesPath?: string;
    defaultScene?: string;
    /** UI 设计分辨率 / UI design resolution */
    uiDesignResolution?: UIDesignResolution;
    /** 插件配置 / Plugin settings */
    plugins?: PluginSettings;
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
                componentsPath: 'components',
                componentPattern: '**/*.ts',
                buildOutput: 'temp/editor-components',
                scenesPath: 'scenes',
                defaultScene: 'main.ecs'
            };

            await this.fileAPI.writeFileContent(configPath, JSON.stringify(config, null, 2));

            const scenesPath = `${projectPath}${sep}${config.scenesPath}`;
            await this.fileAPI.createDirectory(scenesPath);

            const defaultScenePath = `${scenesPath}${sep}${config.defaultScene}`;
            const emptyScene = new Scene();
            const sceneData = emptyScene.serialize({
                format: 'json',
                pretty: true,
                includeMetadata: true
            }) as string;
            await this.fileAPI.writeFileContent(defaultScenePath, sceneData);

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

    public getComponentsPath(): string | null {
        if (!this.currentProject) {
            return null;
        }
        if (!this.projectConfig?.componentsPath) {
            return this.currentProject.path;
        }
        const sep = this.currentProject.path.includes('\\') ? '\\' : '/';
        return `${this.currentProject.path}${sep}${this.projectConfig.componentsPath}`;
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
            const result = {
                projectType: config.projectType || 'esengine',
                componentsPath: config.componentsPath || '',
                componentPattern: config.componentPattern || '**/*.ts',
                buildOutput: config.buildOutput || 'temp/editor-components',
                scenesPath: config.scenesPath || 'scenes',
                defaultScene: config.defaultScene || 'main.ecs',
                uiDesignResolution: config.uiDesignResolution,
                plugins: config.plugins
            };
            logger.debug('Loaded config result:', result);
            return result;
        } catch (error) {
            logger.warn('Failed to load config, using defaults', error);
            return {
                projectType: 'esengine',
                componentsPath: '',
                componentPattern: '**/*.ts',
                buildOutput: 'temp/editor-components',
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

    public dispose(): void {
        this.currentProject = null;
        this.projectConfig = null;
        logger.info('ProjectService disposed');
    }
}
