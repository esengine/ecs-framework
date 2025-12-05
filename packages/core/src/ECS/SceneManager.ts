import { IScene } from './IScene';
import { Scene } from './Scene';
import { Entity } from './Entity';
import { ECSFluentAPI, createECSAPI } from './Core/FluentAPI';
import { Time } from '../Utils/Time';
import { createLogger } from '../Utils/Logger';
import type { IService } from '../Core/ServiceContainer';
import { World } from './World';
import { PerformanceMonitor } from '../Utils/PerformanceMonitor';

/**
 * 单场景管理器
 *
 * 适用场景：
 * - 单人游戏
 * - 简单场景切换
 * - 不需要多World隔离的项目
 *
 * 特点：
 * - 轻量级，零额外开销
 * - 简单直观的API
 * - 支持延迟场景切换
 * - 自动管理ECS API
 *
 * @example
 * ```typescript
 * // 初始化Core
 * Core.create({ debug: true });
 *
 * // 创建场景管理器
 * const sceneManager = new SceneManager();
 *
 * // 设置场景
 * class GameScene extends Scene {
 *     initialize() {
 *         const player = this.createEntity('Player');
 *         player.addComponent(new Transform(100, 100));
 *     }
 * }
 *
 * sceneManager.setScene(new GameScene());
 *
 * // 游戏循环
 * function gameLoop(deltaTime: number) {
 *     Core.update(deltaTime);      // 更新全局服务
 *     sceneManager.update();       // 更新场景
 * }
 *
 * // 延迟切换场景（下一帧生效）
 * sceneManager.loadScene(new MenuScene());
 * ```
 */
export class SceneManager implements IService {
    /**
     * 内部默认World
     */
    private _defaultWorld: World;

    /**
     * 待切换的下一个场景（延迟切换用）
     */
    private _nextScene: IScene | null = null;

    /**
     * ECS流式API
     */
    private _ecsAPI: ECSFluentAPI | null = null;

    /**
     * 日志器
     */
    private _logger = createLogger('SceneManager');

    /**
     * 场景切换回调函数
     */
    private _onSceneChangedCallback?: () => void;

    /**
     * 性能监控器（从 Core 注入）
     */
    private _performanceMonitor: PerformanceMonitor | null = null;

    /**
     * 待迁移的持久化实体
     *
     * Pending persistent entities for migration.
     */
    private _pendingPersistentEntities: Entity[] = [];

    /**
     * 默认场景ID
     */
    private static readonly DEFAULT_SCENE_ID = '__main__';

    constructor(performanceMonitor?: PerformanceMonitor) {
        this._defaultWorld = new World({ name: '__default__' });
        this._defaultWorld.start();
        this._performanceMonitor = performanceMonitor || null;
    }

    /**
     * 设置场景切换回调
     *
     * @param callback 场景切换时的回调函数
     * @internal
     */
    public setSceneChangedCallback(callback: () => void): void {
        this._onSceneChangedCallback = callback;
    }

    /**
     * 设置当前场景（立即切换）
     *
     * 会自动处理旧场景的结束和新场景的初始化。
     * 持久化实体会自动迁移到新场景。
     *
     * Set current scene (immediate transition).
     * Automatically handles old scene cleanup and new scene initialization.
     * Persistent entities are automatically migrated to the new scene.
     *
     * @param scene - 要设置的场景实例 | Scene instance to set
     * @returns 返回设置的场景实例，便于链式调用 | Returns the scene for chaining
     *
     * @example
     * ```typescript
     * const gameScene = sceneManager.setScene(new GameScene());
     * console.log(gameScene.name);
     * ```
     */
    public setScene<T extends IScene>(scene: T): T {
        // 从当前场景提取持久化实体
        const currentScene = this.currentScene;
        if (currentScene && currentScene instanceof Scene) {
            this._pendingPersistentEntities = currentScene.extractPersistentEntities();
            if (this._pendingPersistentEntities.length > 0) {
                this._logger.debug(
                    `Extracted ${this._pendingPersistentEntities.length} persistent entities for migration`
                );
            }
        }

        // 移除旧场景
        this._defaultWorld.removeAllScenes();

        // 注册全局 PerformanceMonitor 到 Scene 的 ServiceContainer
        if (this._performanceMonitor) {
            scene.services.registerInstance(PerformanceMonitor, this._performanceMonitor);
        }

        // 通过 World 创建新场景
        this._defaultWorld.createScene(SceneManager.DEFAULT_SCENE_ID, scene);
        this._defaultWorld.setSceneActive(SceneManager.DEFAULT_SCENE_ID, true);

        // 迁移持久化实体到新场景
        if (this._pendingPersistentEntities.length > 0 && scene instanceof Scene) {
            scene.receiveMigratedEntities(this._pendingPersistentEntities);
            this._logger.debug(
                `Migrated ${this._pendingPersistentEntities.length} persistent entities to new scene`
            );
            this._pendingPersistentEntities = [];
        }

        // 重建ECS API
        if (scene.querySystem && scene.eventSystem) {
            this._ecsAPI = createECSAPI(scene, scene.querySystem, scene.eventSystem);
        } else {
            this._ecsAPI = null;
        }

        // 触发场景切换回调
        Time.sceneChanged();

        // 通知调试管理器（通过回调）
        if (this._onSceneChangedCallback) {
            this._onSceneChangedCallback();
        }

        this._logger.info(`Scene changed to: ${scene.name}`);

        return scene;
    }

    /**
     * 延迟加载场景（下一帧切换）
     *
     * 场景不会立即切换，而是在下一次调用 update() 时切换。
     * 这对于避免在当前帧的中途切换场景很有用。
     *
     * @param scene - 要加载的场景实例
     *
     * @example
     * ```typescript
     * // 在某个System中触发场景切换
     * class GameOverSystem extends EntitySystem {
     *     process(entities: readonly Entity[]) {
     *         if (playerHealth <= 0) {
     *             sceneManager.loadScene(new GameOverScene());
     *             // 当前帧继续执行，场景将在下一帧切换
     *         }
     *     }
     * }
     * ```
     */
    public loadScene<T extends IScene>(scene: T): void {
        this._nextScene = scene;
        this._logger.info(`Scheduled scene load: ${scene.name}`);
    }

    /**
     * 获取当前活跃的场景
     *
     * @returns 当前场景实例，如果没有场景则返回null
     */
    public get currentScene(): IScene | null {
        return this._defaultWorld.getScene(SceneManager.DEFAULT_SCENE_ID);
    }

    /**
     * 获取ECS流式API
     *
     * 提供便捷的实体查询、事件发射等功能。
     *
     * @returns ECS API实例，如果当前没有场景则返回null
     *
     * @example
     * ```typescript
     * const api = sceneManager.api;
     * if (api) {
     *     // 查询所有敌人
     *     const enemies = api.find(Enemy, Transform);
     *
     *     // 发射事件
     *     api.emit('game:start', { level: 1 });
     * }
     * ```
     */
    public get api(): ECSFluentAPI | null {
        return this._ecsAPI;
    }

    /**
     * 更新场景
     *
     * 应该在每帧的游戏循环中调用。
     * 会自动处理延迟场景切换。
     *
     * @example
     * ```typescript
     * function gameLoop(deltaTime: number) {
     *     Core.update(deltaTime);
     *     sceneManager.update();  // 每帧调用
     * }
     * ```
     */
    public update(): void {
        // 处理延迟场景切换
        if (this._nextScene) {
            this.setScene(this._nextScene);
            this._nextScene = null;
        }

        // 通过 World 统一更新
        this._defaultWorld.updateGlobalSystems();
        this._defaultWorld.updateScenes();
    }

    /**
     * 销毁场景管理器
     *
     * 会自动结束当前场景并清理所有资源。
     * 通常在应用程序关闭时调用。
     */
    public destroy(): void {
        this._logger.info('SceneManager destroying');

        this._defaultWorld.destroy();
        this._nextScene = null;
        this._ecsAPI = null;

        this._logger.info('SceneManager destroyed');
    }

    /**
     * 检查是否有活跃场景
     *
     * @returns 如果有活跃场景返回true，否则返回false
     */
    public get hasScene(): boolean {
        return this._defaultWorld.getScene(SceneManager.DEFAULT_SCENE_ID) !== null;
    }

    /**
     * 检查是否有待切换的场景
     *
     * @returns 如果有待切换场景返回true，否则返回false
     */
    public get hasPendingScene(): boolean {
        return this._nextScene !== null;
    }

    /**
     * 释放资源（IService接口）
     */
    public dispose(): void {
        this.destroy();
    }
}
