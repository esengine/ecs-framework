import type { IService } from '@esengine/ecs-framework';
import { Injectable, Core, createLogger, SceneSerializer, Scene } from '@esengine/ecs-framework';
import type { MessageHub } from './MessageHub';
import type { IFileAPI } from '../Types/IFileAPI';
import type { ProjectService } from './ProjectService';
import type { EntityStoreService } from './EntityStoreService';

const logger = createLogger('SceneManagerService');

export interface SceneState {
    currentScenePath: string | null;
    sceneName: string;
    isModified: boolean;
    isSaved: boolean;
}

@Injectable()
export class SceneManagerService implements IService {
    private sceneState: SceneState = {
        currentScenePath: null,
        sceneName: 'Untitled',
        isModified: false,
        isSaved: false
    };

    private unsubscribeHandlers: Array<() => void> = [];

    constructor(
        private messageHub: MessageHub,
        private fileAPI: IFileAPI,
        private projectService?: ProjectService,
        private entityStore?: EntityStoreService
    ) {
        this.setupAutoModificationTracking();
        logger.info('SceneManagerService initialized');
    }

    public async newScene(): Promise<void> {
        if (!await this.canClose()) {
            return;
        }

        const scene = Core.scene as Scene | null;
        if (!scene) {
            throw new Error('No active scene');
        }
        scene.entities.removeAllEntities();
        const systems = [...scene.systems];
        for (const system of systems) {
            scene.removeEntityProcessor(system);
        }

        this.sceneState = {
            currentScenePath: null,
            sceneName: 'Untitled',
            isModified: false,
            isSaved: false
        };

        this.entityStore?.syncFromScene();
        await this.messageHub.publish('scene:new', {});
        logger.info('New scene created');
    }

    public async openScene(filePath?: string): Promise<void> {
        if (!await this.canClose()) {
            return;
        }

        let path: string | null | undefined = filePath;
        if (!path) {
            path = await this.fileAPI.openSceneDialog();
            if (!path) {
                return;
            }
        }

        try {
            const jsonData = await this.fileAPI.readFileContent(path);

            const validation = SceneSerializer.validate(jsonData);
            if (!validation.valid) {
                throw new Error(`场景文件损坏: ${validation.errors?.join(', ')}`);
            }

            const scene = Core.scene as Scene | null;
            if (!scene) {
                throw new Error('No active scene');
            }
            scene.deserialize(jsonData, {
                strategy: 'replace'
            });

            const fileName = path.split(/[/\\]/).pop() || 'Untitled';
            const sceneName = fileName.replace('.ecs', '');

            this.sceneState = {
                currentScenePath: path,
                sceneName,
                isModified: false,
                isSaved: true
            };

            this.entityStore?.syncFromScene();
            await this.messageHub.publish('scene:loaded', {
                path,
                sceneName,
                isModified: false,
                isSaved: true
            });
            logger.info(`Scene loaded: ${path}`);
        } catch (error) {
            logger.error('Failed to load scene:', error);
            throw error;
        }
    }

    public async saveScene(): Promise<void> {
        if (!this.sceneState.currentScenePath) {
            await this.saveSceneAs();
            return;
        }

        try {
            const scene = Core.scene as Scene | null;
            if (!scene) {
                throw new Error('No active scene');
            }
            const jsonData = scene.serialize({
                format: 'json',
                pretty: true,
                includeMetadata: true
            }) as string;

            await this.fileAPI.saveProject(this.sceneState.currentScenePath, jsonData);

            this.sceneState.isModified = false;
            this.sceneState.isSaved = true;

            await this.messageHub.publish('scene:saved', {
                path: this.sceneState.currentScenePath
            });
            logger.info(`Scene saved: ${this.sceneState.currentScenePath}`);
        } catch (error) {
            logger.error('Failed to save scene:', error);
            throw error;
        }
    }

    public async saveSceneAs(filePath?: string): Promise<void> {
        let path: string | null | undefined = filePath;
        if (!path) {
            let defaultName = this.sceneState.sceneName || 'Untitled';

            if (this.projectService?.isProjectOpen()) {
                const scenesPath = this.projectService.getScenesPath();
                if (scenesPath) {
                    const sep = scenesPath.includes('\\') ? '\\' : '/';
                    defaultName = `${scenesPath}${sep}${defaultName}`;
                }
            }

            path = await this.fileAPI.saveSceneDialog(defaultName);
            if (!path) {
                return;
            }
        }

        if (!path.endsWith('.ecs')) {
            path += '.ecs';
        }

        try {
            const scene = Core.scene as Scene | null;
            if (!scene) {
                throw new Error('No active scene');
            }
            const jsonData = scene.serialize({
                format: 'json',
                pretty: true,
                includeMetadata: true
            }) as string;

            await this.fileAPI.saveProject(path, jsonData);

            const fileName = path.split(/[/\\]/).pop() || 'Untitled';
            const sceneName = fileName.replace('.ecs', '');

            this.sceneState = {
                currentScenePath: path,
                sceneName,
                isModified: false,
                isSaved: true
            };

            await this.messageHub.publish('scene:saved', { path });
            logger.info(`Scene saved as: ${path}`);
        } catch (error) {
            logger.error('Failed to save scene as:', error);
            throw error;
        }
    }

    public async exportScene(filePath?: string): Promise<void> {
        let path: string | null | undefined = filePath;
        if (!path) {
            let defaultName = (this.sceneState.sceneName || 'Untitled') + '.ecs.bin';

            if (this.projectService?.isProjectOpen()) {
                const scenesPath = this.projectService.getScenesPath();
                if (scenesPath) {
                    const sep = scenesPath.includes('\\') ? '\\' : '/';
                    defaultName = `${scenesPath}${sep}${defaultName}`;
                }
            }

            path = await this.fileAPI.saveSceneDialog(defaultName);
            if (!path) {
                return;
            }
        }

        if (!path.endsWith('.ecs.bin')) {
            path += '.ecs.bin';
        }

        try {
            const scene = Core.scene as Scene | null;
            if (!scene) {
                throw new Error('No active scene');
            }
            const binaryData = scene.serialize({
                format: 'binary'
            }) as Uint8Array;

            await this.fileAPI.exportBinary(binaryData, path);

            await this.messageHub.publish('scene:exported', { path });
            logger.info(`Scene exported: ${path}`);
        } catch (error) {
            logger.error('Failed to export scene:', error);
            throw error;
        }
    }

    public getSceneState(): SceneState {
        return { ...this.sceneState };
    }

    public markAsModified(): void {
        if (!this.sceneState.isModified) {
            this.sceneState.isModified = true;
            this.messageHub.publishSync('scene:modified', {});
            logger.debug('Scene marked as modified');
        }
    }

    public async canClose(): Promise<boolean> {
        if (!this.sceneState.isModified) {
            return true;
        }

        return true;
    }

    private setupAutoModificationTracking(): void {
        const unsubscribeEntityAdded = this.messageHub.subscribe('entity:added', () => {
            this.markAsModified();
        });

        const unsubscribeEntityRemoved = this.messageHub.subscribe('entity:removed', () => {
            this.markAsModified();
        });

        const unsubscribeEntityReordered = this.messageHub.subscribe('entity:reordered', () => {
            this.markAsModified();
        });

        this.unsubscribeHandlers.push(unsubscribeEntityAdded, unsubscribeEntityRemoved, unsubscribeEntityReordered);

        logger.debug('Auto modification tracking setup complete');
    }

    public dispose(): void {
        for (const unsubscribe of this.unsubscribeHandlers) {
            unsubscribe();
        }
        this.unsubscribeHandlers = [];
        logger.info('SceneManagerService disposed');
    }
}
