import type { IService } from '@esengine/ecs-framework';
import { Injectable, Core, createLogger, SceneSerializer, Scene } from '@esengine/ecs-framework';
import type { SceneResourceManager } from '@esengine/asset-system';
import type { MessageHub } from './MessageHub';
import type { IFileAPI } from '../Types/IFileAPI';
import type { ProjectService } from './ProjectService';
import type { EntityStoreService } from './EntityStoreService';
import { SceneTemplateRegistry } from './SceneTemplateRegistry';

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
    private sceneResourceManager: SceneResourceManager | null = null;

    constructor(
        private messageHub: MessageHub,
        private fileAPI: IFileAPI,
        private projectService?: ProjectService,
        private entityStore?: EntityStoreService
    ) {
        this.setupAutoModificationTracking();
        logger.info('SceneManagerService initialized');
    }

    /**
     * 设置场景资源管理器
     * Set scene resource manager
     */
    public setSceneResourceManager(manager: SceneResourceManager | null): void {
        this.sceneResourceManager = manager;
    }

    /**
     * 创建新场景
     * Create a new scene
     *
     * @param templateName - 场景模板名称，不传则使用默认模板 / Scene template name, uses default if not specified
     */
    public async newScene(templateName?: string): Promise<void> {
        if (!await this.canClose()) {
            return;
        }

        const scene = Core.scene as Scene | null;
        if (!scene) {
            throw new Error('No active scene');
        }

        // 只移除实体，保留系统（系统由模块管理）
        // Only remove entities, preserve systems (systems managed by modules)
        scene.entities.removeAllEntities();

        // 使用场景模板创建默认实体
        // Create default entities using scene template
        const createdEntities = SceneTemplateRegistry.createDefaultEntities(scene, templateName);
        logger.debug(`Created ${createdEntities.length} default entities from template`);

        this.sceneState = {
            currentScenePath: null,
            sceneName: 'Untitled',
            isModified: false,
            isSaved: false
        };

        // 同步到 EntityStore
        // Sync to EntityStore
        this.entityStore?.syncFromScene();

        // 通知创建的实体
        // Notify about created entities
        for (const entity of createdEntities) {
            await this.messageHub.publish('entity:added', { entity });
        }

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

            // 加载场景资源 / Load scene resources
            if (this.sceneResourceManager) {
                await this.sceneResourceManager.loadSceneResources(scene);
            } else {
                logger.warn('[SceneManagerService] SceneResourceManager not available, skipping resource loading');
            }

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
