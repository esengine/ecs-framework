import type { IService, Entity, PrefabData } from '@esengine/ecs-framework';
import {
    Injectable,
    Core,
    createLogger,
    SceneSerializer,
    Scene,
    PrefabSerializer,
    HierarchySystem,
    ComponentRegistry
} from '@esengine/ecs-framework';
import type { ComponentType } from '@esengine/ecs-framework';
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

/**
 * 预制体编辑模式状态
 * Prefab edit mode state
 */
export interface PrefabEditModeState {
    /** 是否处于预制体编辑模式 | Whether in prefab edit mode */
    isActive: boolean;
    /** 预制体文件路径 | Prefab file path */
    prefabPath: string;
    /** 预制体名称 | Prefab name */
    prefabName: string;
    /** 预制体 GUID | Prefab GUID */
    prefabGuid?: string;
    /** 原始预制体数据（用于比较修改） | Original prefab data (for modification comparison) */
    originalPrefabData: PrefabData;
    /** 原场景路径 | Original scene path */
    originalScenePath: string | null;
    /** 原场景名称 | Original scene name */
    originalSceneName: string;
    /** 原场景是否已修改 | Whether original scene was modified */
    originalSceneModified: boolean;
}

@Injectable()
export class SceneManagerService implements IService {
    private sceneState: SceneState = {
        currentScenePath: null,
        sceneName: 'Untitled',
        isModified: false,
        isSaved: false
    };

    /** 预制体编辑模式状态 | Prefab edit mode state */
    private prefabEditModeState: PrefabEditModeState | null = null;

    /** 预制体编辑时场景中的根实体 | Root entity in scene during prefab editing */
    private prefabRootEntity: Entity | null = null;

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

        // 确保编辑器模式下设置 isEditorMode，延迟组件生命周期回调
        // Ensure isEditorMode is set in editor to defer component lifecycle callbacks
        scene.isEditorMode = true;

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

            // 确保编辑器模式下设置 isEditorMode，延迟组件生命周期回调
            // Ensure isEditorMode is set in editor to defer component lifecycle callbacks
            scene.isEditorMode = true;

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
            const defaultName = this.sceneState.sceneName || 'Untitled';
            let scenesDir: string | undefined;

            // 获取场景目录，限制保存位置 | Get scenes directory to restrict save location
            if (this.projectService?.isProjectOpen()) {
                scenesDir = this.projectService.getScenesPath() ?? undefined;
            }

            path = await this.fileAPI.saveSceneDialog(defaultName, scenesDir);
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
            const defaultName = (this.sceneState.sceneName || 'Untitled') + '.ecs.bin';
            let scenesDir: string | undefined;

            // 获取场景目录，限制保存位置 | Get scenes directory to restrict save location
            if (this.projectService?.isProjectOpen()) {
                scenesDir = this.projectService.getScenesPath() ?? undefined;
            }

            path = await this.fileAPI.saveSceneDialog(defaultName, scenesDir);
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

    // ===== 预制体编辑模式 API | Prefab Edit Mode API =====

    /**
     * 进入预制体编辑模式
     * Enter prefab edit mode
     *
     * @param prefabPath - 预制体文件路径 | Prefab file path
     */
    public async enterPrefabEditMode(prefabPath: string): Promise<void> {
        // 如果已在预制体编辑模式，先退出
        // If already in prefab edit mode, exit first
        if (this.prefabEditModeState?.isActive) {
            await this.exitPrefabEditMode(false);
        }

        const scene = Core.scene as Scene | null;
        if (!scene) {
            throw new Error('No active scene');
        }

        try {
            // 1. 读取预制体文件 | Read prefab file
            const prefabJson = await this.fileAPI.readFileContent(prefabPath);
            const prefabData = PrefabSerializer.deserialize(prefabJson);

            // 2. 验证预制体数据 | Validate prefab data
            const validation = PrefabSerializer.validate(prefabData);
            if (!validation.valid) {
                throw new Error(`Invalid prefab: ${validation.errors?.join(', ')}`);
            }

            // 3. 保存当前场景状态 | Save current scene state
            const savedScenePath = this.sceneState.currentScenePath;
            const savedSceneName = this.sceneState.sceneName;
            const savedSceneModified = this.sceneState.isModified;

            // 4. 请求保存场景快照（通过 MessageHub，由 EngineService 处理）
            // Request to save scene snapshot (via MessageHub, handled by EngineService)
            const snapshotSaved = await this.messageHub.request<void, boolean>(
                'engine:saveSceneSnapshot',
                undefined,
                5000
            ).catch(() => false);

            if (!snapshotSaved) {
                logger.warn('Failed to save scene snapshot, proceeding without snapshot');
            }

            // 5. 清空场景 | Clear scene
            scene.entities.removeAllEntities();

            // 5.1 清理查询系统和系统缓存 | Clear query system and system caches
            scene.querySystem.setEntities([]);
            scene.clearSystemEntityCaches();

            // 5.2 重置所有系统的实体跟踪状态 | Reset entity tracking for all systems
            for (const system of scene.systems) {
                system.resetEntityTracking();
            }

            // 6. 获取组件注册表 | Get component registry
            // ComponentRegistry.getAllComponentNames() 返回 Map<string, Function>
            // 需要转换为 Map<string, ComponentType>
            const nameToType = ComponentRegistry.getAllComponentNames();
            const componentRegistry = new Map<string, ComponentType>();
            nameToType.forEach((type, name) => {
                componentRegistry.set(name, type as ComponentType);
            });

            // 7. 实例化预制体到场景 | Instantiate prefab to scene
            logger.info(`Instantiating prefab with ${componentRegistry.size} registered component types`);
            logger.debug('Available component types:', Array.from(componentRegistry.keys()));

            this.prefabRootEntity = PrefabSerializer.instantiate(
                prefabData,
                scene,
                componentRegistry,
                {
                    trackInstance: false,  // 编辑模式不追踪实例 | Don't track instance in edit mode
                    preserveIds: false
                }
            );

            logger.info(`Prefab instantiated, root entity: ${this.prefabRootEntity?.name} (id: ${this.prefabRootEntity?.id})`);
            logger.info(`Scene entity count: ${scene.entities.count}`);

            // 7.1 强制重建查询系统 | Force rebuild query system
            // 使用 setEntities 完全重置，确保所有索引正确重建
            // Using setEntities to fully reset, ensuring all indexes are correctly rebuilt
            const allEntities = Array.from(scene.entities.buffer);
            scene.querySystem.setEntities(allEntities);

            // 7.2 重置所有系统的实体跟踪状态，强制它们重新扫描
            // Reset all system entity tracking, forcing them to rescan
            for (const system of scene.systems) {
                system.resetEntityTracking();
            }

            // 7.3 清理系统缓存 | Clear system caches
            scene.clearSystemEntityCaches();

            // 8. 加载场景资源（纹理、音频等）| Load scene resources (textures, audio, etc.)
            if (this.sceneResourceManager) {
                await this.sceneResourceManager.loadSceneResources(scene);
                logger.info('Scene resources loaded for prefab');
            } else {
                logger.warn('SceneResourceManager not available, skipping resource loading');
            }

            // 9. 设置预制体编辑模式状态 | Set prefab edit mode state
            const prefabName = prefabData.metadata.name || prefabPath.split(/[/\\]/).pop()?.replace('.prefab', '') || 'Prefab';
            this.prefabEditModeState = {
                isActive: true,
                prefabPath,
                prefabName,
                prefabGuid: prefabData.metadata.guid,
                originalPrefabData: prefabData,
                originalScenePath: savedScenePath,
                originalSceneName: savedSceneName,
                originalSceneModified: savedSceneModified
            };

            // 10. 更新场景状态 | Update scene state
            this.sceneState = {
                currentScenePath: null,
                sceneName: `Prefab: ${prefabName}`,
                isModified: false,
                isSaved: true
            };

            // 11. 同步到 EntityStore | Sync to EntityStore
            this.entityStore?.syncFromScene();

            // 12. 发布事件 | Publish events
            await this.messageHub.publish('prefab:editMode:enter', {
                prefabPath,
                prefabName,
                prefabGuid: prefabData.metadata.guid
            });
            await this.messageHub.publish('prefab:editMode:changed', {
                isActive: true,
                prefabPath,
                prefabName
            });

            logger.info(`Entered prefab edit mode: ${prefabPath}`);
        } catch (error) {
            logger.error('Failed to enter prefab edit mode:', error);
            throw error;
        }
    }

    /**
     * 退出预制体编辑模式
     * Exit prefab edit mode
     *
     * @param save - 是否保存修改 | Whether to save changes
     */
    public async exitPrefabEditMode(save: boolean = false): Promise<void> {
        if (!this.prefabEditModeState?.isActive) {
            logger.warn('Not in prefab edit mode');
            return;
        }

        const scene = Core.scene as Scene | null;
        if (!scene) {
            throw new Error('No active scene');
        }

        try {
            // 1. 如果需要保存，先保存预制体 | If save requested, save prefab first
            if (save && this.sceneState.isModified) {
                await this.savePrefab();
            }

            // 2. 清空当前场景 | Clear current scene
            scene.entities.removeAllEntities();
            this.prefabRootEntity = null;

            // 3. 请求恢复场景快照（通过 MessageHub，由 EngineService 处理）
            // Request to restore scene snapshot (via MessageHub, handled by EngineService)
            const snapshotRestored = await this.messageHub.request<void, boolean>(
                'engine:restoreSceneSnapshot',
                undefined,
                5000
            ).catch(() => false);

            // 4. 恢复场景状态 | Restore scene state
            const originalState = this.prefabEditModeState;
            this.sceneState = {
                currentScenePath: originalState.originalScenePath,
                sceneName: originalState.originalSceneName,
                isModified: originalState.originalSceneModified,
                isSaved: !originalState.originalSceneModified
            };

            // 5. 清除预制体编辑模式状态 | Clear prefab edit mode state
            this.prefabEditModeState = null;

            // 6. 同步到 EntityStore | Sync to EntityStore
            this.entityStore?.syncFromScene();

            // 7. 发布事件 | Publish events
            await this.messageHub.publish('prefab:editMode:exit', { saved: save });
            await this.messageHub.publish('prefab:editMode:changed', {
                isActive: false
            });

            if (snapshotRestored) {
                await this.messageHub.publish('scene:restored', {});
            }

            logger.info(`Exited prefab edit mode, saved: ${save}`);
        } catch (error) {
            logger.error('Failed to exit prefab edit mode:', error);
            throw error;
        }
    }

    /**
     * 保存预制体
     * Save prefab
     */
    public async savePrefab(): Promise<void> {
        if (!this.prefabEditModeState?.isActive) {
            throw new Error('Not in prefab edit mode');
        }

        const scene = Core.scene as Scene | null;
        if (!scene) {
            throw new Error('No active scene');
        }

        if (!this.prefabRootEntity) {
            throw new Error('No prefab root entity');
        }

        try {
            const hierarchySystem = scene.getSystem(HierarchySystem) ?? undefined;

            // 1. 从根实体创建预制体数据 | Create prefab data from root entity
            const newPrefabData = PrefabSerializer.createPrefab(
                this.prefabRootEntity,
                {
                    name: this.prefabEditModeState.prefabName,
                    description: this.prefabEditModeState.originalPrefabData.metadata.description,
                    tags: this.prefabEditModeState.originalPrefabData.metadata.tags,
                    includeChildren: true
                },
                hierarchySystem
            );

            // 2. 保持原有 GUID | Preserve original GUID
            if (this.prefabEditModeState.prefabGuid) {
                newPrefabData.metadata.guid = this.prefabEditModeState.prefabGuid;
            }

            // 3. 保持原有创建时间，更新修改时间 | Preserve creation time, update modification time
            newPrefabData.metadata.createdAt = this.prefabEditModeState.originalPrefabData.metadata.createdAt;
            newPrefabData.metadata.modifiedAt = Date.now();

            // 4. 序列化并保存 | Serialize and save
            const prefabJson = PrefabSerializer.serialize(newPrefabData, true);
            await this.fileAPI.saveProject(this.prefabEditModeState.prefabPath, prefabJson);

            // 5. 更新原始数据（用于后续修改检测）| Update original data (for subsequent modification detection)
            this.prefabEditModeState.originalPrefabData = newPrefabData;

            // 6. 标记为已保存 | Mark as saved
            this.sceneState.isModified = false;
            this.sceneState.isSaved = true;

            // 7. 发布事件 | Publish event
            await this.messageHub.publish('prefab:saved', {
                prefabPath: this.prefabEditModeState.prefabPath,
                prefabName: this.prefabEditModeState.prefabName
            });

            logger.info(`Prefab saved: ${this.prefabEditModeState.prefabPath}`);
        } catch (error) {
            logger.error('Failed to save prefab:', error);
            throw error;
        }
    }

    /**
     * 检查是否处于预制体编辑模式
     * Check if in prefab edit mode
     */
    public isPrefabEditMode(): boolean {
        return this.prefabEditModeState?.isActive ?? false;
    }

    /**
     * 获取预制体编辑模式状态
     * Get prefab edit mode state
     */
    public getPrefabEditModeState(): PrefabEditModeState | null {
        return this.prefabEditModeState ? { ...this.prefabEditModeState } : null;
    }

    /**
     * 检查预制体是否已修改
     * Check if prefab has been modified
     */
    public isPrefabModified(): boolean {
        return (this.prefabEditModeState?.isActive ?? false) && this.sceneState.isModified;
    }

    private setupAutoModificationTracking(): void {
        // 实体级别事件 | Entity-level events
        const unsubscribeEntityAdded = this.messageHub.subscribe('entity:added', () => {
            this.markAsModified();
        });
        const unsubscribeEntityRemoved = this.messageHub.subscribe('entity:removed', () => {
            this.markAsModified();
        });
        const unsubscribeEntityReordered = this.messageHub.subscribe('entity:reordered', () => {
            this.markAsModified();
        });

        // 组件级别事件 | Component-level events
        const unsubscribeComponentAdded = this.messageHub.subscribe('component:added', () => {
            this.markAsModified();
        });
        const unsubscribeComponentRemoved = this.messageHub.subscribe('component:removed', () => {
            this.markAsModified();
        });
        const unsubscribeComponentPropertyChanged = this.messageHub.subscribe('component:property:changed', () => {
            this.markAsModified();
        });

        // 通用场景修改事件 | Generic scene modification event
        const unsubscribeSceneModified = this.messageHub.subscribe('scene:modified', () => {
            this.markAsModified();
        });

        this.unsubscribeHandlers.push(
            unsubscribeEntityAdded,
            unsubscribeEntityRemoved,
            unsubscribeEntityReordered,
            unsubscribeComponentAdded,
            unsubscribeComponentRemoved,
            unsubscribeComponentPropertyChanged,
            unsubscribeSceneModified
        );

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
