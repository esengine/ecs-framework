import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';

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
}

@Injectable()
export class ProjectService implements IService {
    private currentProject: ProjectInfo | null = null;
    private projectConfig: ProjectConfig | null = null;
    private messageHub: MessageHub;

    constructor(messageHub: MessageHub) {
        this.messageHub = messageHub;
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
            buildOutput: 'temp/editor-components'
        };
    }

    public dispose(): void {
        this.currentProject = null;
        this.projectConfig = null;
        logger.info('ProjectService disposed');
    }
}
