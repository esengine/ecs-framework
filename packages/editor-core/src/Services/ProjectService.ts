import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger, Scene } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';
import type { IFileAPI } from '../Types/IFileAPI';

const logger = createLogger('ProjectService');

export type ProjectType = 'cocos' | 'laya' | 'unknown';

export interface ProjectInfo {
    path: string;
    type: ProjectType;
    name: string;
    configPath?: string;
}

export interface ProjectConfig {
    projectType?: ProjectType;
    componentsPath?: string;
    componentPattern?: string;
    buildOutput?: string;
    scenesPath?: string;
    defaultScene?: string;
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
                projectType: 'cocos',
                componentsPath: 'components',
                componentPattern: '**/*.ts',
                buildOutput: 'temp/editor-components',
                scenesPath: 'ecs-scenes',
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
            projectInfo.type = 'cocos';
        } catch (error) {
            logger.warn('No ecs-editor.config.json found, using defaults');
        }

        return projectInfo;
    }

    private async loadConfig(configPath: string): Promise<ProjectConfig> {
        return {
            projectType: 'cocos',
            componentsPath: '',
            componentPattern: '**/*.ts',
            buildOutput: 'temp/editor-components',
            scenesPath: 'ecs-scenes',
            defaultScene: 'main.ecs'
        };
    }

    public dispose(): void {
        this.currentProject = null;
        this.projectConfig = null;
        logger.info('ProjectService disposed');
    }
}
