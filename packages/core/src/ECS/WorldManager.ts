import {World, IWorldConfig} from "./World";
import {createLogger} from "../Utils/Logger";
import type {IService} from "../Core/ServiceContainer";

const logger = createLogger("WorldManager");

/**
 * WorldManager配置接口
 */
export interface IWorldManagerConfig {
    /**
     * 最大World数量
     */
    maxWorlds?: number;

    /**
     * 是否自动清理空World
     */
    autoCleanup?: boolean;

    /**
     * 清理间隔（毫秒）
     */
    cleanupInterval?: number;

    /**
     * 是否启用调试模式
     */
    debug?: boolean;
}

/**
 * World管理器 - 管理所有World实例
 *
 * WorldManager负责管理多个独立的World实例。
 * 每个World都是独立的ECS环境，可以包含多个Scene。
 *
 * 适用场景：
 * - MMO游戏的多房间管理
 * - 服务器端的多游戏实例
 * - 需要完全隔离的多个游戏环境
 *
 * @example
 * ```typescript
 * // 创建WorldManager实例
 * const worldManager = new WorldManager({
 *     maxWorlds: 100,
 *     autoCleanup: true
 * });
 *
 * // 创建游戏房间World
 * const room1 = worldManager.createWorld('room_001', {
 *     name: 'GameRoom_001',
 *     maxScenes: 5
 * });
 * room1.setActive(true);
 *
 * // 游戏循环
 * function gameLoop(deltaTime: number) {
 *     Core.update(deltaTime);
 *     worldManager.updateAll();  // 更新所有活跃World
 * }
 * ```
 */
export class WorldManager implements IService {
    private readonly _config: IWorldManagerConfig;
    private readonly _worlds: Map<string, World> = new Map();
    private readonly _activeWorlds: Set<string> = new Set();
    private _cleanupTimer: ReturnType<typeof setInterval> | null = null;
    private _isRunning: boolean = false;

    public constructor(config: IWorldManagerConfig = {}) {
        this._config = {
            maxWorlds: 50,
            autoCleanup: true,
            cleanupInterval: 30000, // 30秒
            debug: false,
            ...config
        };

        // 默认启动运行状态
        this._isRunning = true;

        logger.info("WorldManager已初始化", {
            maxWorlds: this._config.maxWorlds,
            autoCleanup: this._config.autoCleanup,
            cleanupInterval: this._config.cleanupInterval
        });

        this.startCleanupTimer();
    }

    // ===== World管理 =====

    /**
     * 创建新World
     */
    public createWorld(worldId: string, config?: IWorldConfig): World {
        if (!worldId || typeof worldId !== "string" || worldId.trim() === "") {
            throw new Error("World ID不能为空");
        }

        if (this._worlds.has(worldId)) {
            throw new Error(`World ID '${worldId}' 已存在`);
        }

        if (this._worlds.size >= this._config.maxWorlds!) {
            throw new Error(`已达到最大World数量限制: ${this._config.maxWorlds}`);
        }

        const worldConfig: IWorldConfig = {
            name: worldId,
            ...(this._config.debug !== undefined && {debug: this._config.debug}),
            ...(config?.maxScenes !== undefined && {maxScenes: config.maxScenes}),
            ...(config?.autoCleanup !== undefined && {autoCleanup: config.autoCleanup})
        };

        const world = new World(worldConfig);
        this._worlds.set(worldId, world);

        return world;
    }

    /**
     * 移除World
     */
    public removeWorld(worldId: string): boolean {
        const world = this._worlds.get(worldId);
        if (!world) {
            return false;
        }

        // 如果World正在运行，先停止它
        if (this._activeWorlds.has(worldId)) {
            this.setWorldActive(worldId, false);
        }

        // 销毁World
        world.destroy();
        this._worlds.delete(worldId);

        logger.info(`移除World: ${worldId}`);
        return true;
    }

    /**
     * 获取World
     */
    public getWorld(worldId: string): World | null {
        return this._worlds.get(worldId) || null;
    }

    /**
     * 获取所有World ID
     */
    public getWorldIds(): string[] {
        return Array.from(this._worlds.keys());
    }

    /**
     * 获取所有World
     */
    public getAllWorlds(): World[] {
        return Array.from(this._worlds.values());
    }

    /**
     * 设置World激活状态
     */
    public setWorldActive(worldId: string, active: boolean): void {
        const world = this._worlds.get(worldId);
        if (!world) {
            logger.warn(`World '${worldId}' 不存在`);
            return;
        }

        if (active) {
            this._activeWorlds.add(worldId);
            world.start();
            logger.debug(`激活World: ${worldId}`);
        } else {
            this._activeWorlds.delete(worldId);
            world.stop();
            logger.debug(`停用World: ${worldId}`);
        }
    }

    /**
     * 检查World是否激活
     */
    public isWorldActive(worldId: string): boolean {
        return this._activeWorlds.has(worldId);
    }

    // ===== 批量操作 =====

    /**
     * 更新所有活跃的World
     *
     * 应该在每帧的游戏循环中调用。
     * 会自动更新所有活跃World的全局系统和场景。
     *
     * @example
     * ```typescript
     * function gameLoop(deltaTime: number) {
     *     Core.update(deltaTime);      // 更新全局服务
     *     worldManager.updateAll();    // 更新所有World
     * }
     * ```
     */
    public updateAll(): void {
        if (!this._isRunning) return;

        for (const worldId of this._activeWorlds) {
            const world = this._worlds.get(worldId);
            if (world && world.isActive) {
                // 更新World的全局System
                world.updateGlobalSystems();

                // 更新World中的所有Scene
                world.updateScenes();
            }
        }
    }

    /**
     * 获取所有激活的World
     */
    public getActiveWorlds(): World[] {
        const activeWorlds: World[] = [];
        for (const worldId of this._activeWorlds) {
            const world = this._worlds.get(worldId);
            if (world) {
                activeWorlds.push(world);
            }
        }
        return activeWorlds;
    }

    /**
     * 启动所有World
     */
    public startAll(): void {
        this._isRunning = true;

        for (const worldId of this._worlds.keys()) {
            this.setWorldActive(worldId, true);
        }

        logger.info("启动所有World");
    }

    /**
     * 停止所有World
     */
    public stopAll(): void {
        this._isRunning = false;

        for (const worldId of this._activeWorlds) {
            this.setWorldActive(worldId, false);
        }

        logger.info("停止所有World");
    }

    /**
     * 查找满足条件的World
     */
    public findWorlds(predicate: (world: World) => boolean): World[] {
        const results: World[] = [];
        for (const world of this._worlds.values()) {
            if (predicate(world)) {
                results.push(world);
            }
        }
        return results;
    }

    /**
     * 根据名称查找World
     */
    public findWorldByName(name: string): World | null {
        for (const world of this._worlds.values()) {
            if (world.name === name) {
                return world;
            }
        }
        return null;
    }

    // ===== 统计和监控 =====

    /**
     * 获取WorldManager统计信息
     */
    public getStats() {
        const stats = {
            totalWorlds: this._worlds.size,
            activeWorlds: this._activeWorlds.size,
            totalScenes: 0,
            totalEntities: 0,
            totalSystems: 0,
            memoryUsage: 0,
            isRunning: this._isRunning,
            config: {...this._config},
            worlds: [] as any[]
        };

        for (const [worldId, world] of this._worlds) {
            const worldStats = world.getStats();
            stats.totalScenes += worldStats.totalSystems; // World的getStats可能需要调整
            stats.totalEntities += worldStats.totalEntities;
            stats.totalSystems += worldStats.totalSystems;

            stats.worlds.push({
                id: worldId,
                name: world.name,
                isActive: this._activeWorlds.has(worldId),
                sceneCount: world.sceneCount,
                ...worldStats
            });
        }

        return stats;
    }

    /**
     * 获取详细状态信息
     */
    public getDetailedStatus() {
        return {
            ...this.getStats(),
            worlds: Array.from(this._worlds.entries()).map(([worldId, world]) => ({
                id: worldId,
                isActive: this._activeWorlds.has(worldId),
                status: world.getStatus()
            }))
        };
    }

    // ===== 生命周期管理 =====

    /**
     * 清理空World
     */
    public cleanup(): number {
        const worldsToRemove: string[] = [];

        for (const [worldId, world] of this._worlds) {
            if (this.shouldCleanupWorld(world)) {
                worldsToRemove.push(worldId);
            }
        }

        for (const worldId of worldsToRemove) {
            this.removeWorld(worldId);
        }

        if (worldsToRemove.length > 0) {
            logger.debug(`清理了 ${worldsToRemove.length} 个World`);
        }

        return worldsToRemove.length;
    }

    /**
     * 销毁WorldManager
     */
    public destroy(): void {
        logger.info("正在销毁WorldManager...");

        // 停止清理定时器
        this.stopCleanupTimer();

        // 停止所有World
        this.stopAll();

        // 销毁所有World
        const worldIds = Array.from(this._worlds.keys());
        for (const worldId of worldIds) {
            this.removeWorld(worldId);
        }

        this._worlds.clear();
        this._activeWorlds.clear();
        this._isRunning = false;

        logger.info("WorldManager已销毁");
    }

    /**
     * 实现 IService 接口的 dispose 方法
     * 调用 destroy 方法进行清理
     */
    public dispose(): void {
        this.destroy();
    }

    // ===== 私有方法 =====

    /**
     * 启动清理定时器
     */
    private startCleanupTimer(): void {
        if (!this._config.autoCleanup || this._cleanupTimer) {
            return;
        }

        this._cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this._config.cleanupInterval);

        logger.debug(`启动World清理定时器，间隔: ${this._config.cleanupInterval}ms`);
    }

    /**
     * 停止清理定时器
     */
    private stopCleanupTimer(): void {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
            logger.debug("停止World清理定时器");
        }
    }

    /**
     * 判断World是否应该被清理
     */
    private shouldCleanupWorld(world: World): boolean {
        // 清理策略：
        // 1. World未激活
        // 2. 没有Scene或所有Scene都是空的
        // 3. 创建时间超过10分钟

        if (world.isActive) {
            return false;
        }

        if (world.sceneCount === 0) {
            const age = Date.now() - world.createdAt;
            return age > 10 * 60 * 1000; // 10分钟
        }

        // 检查是否所有Scene都是空的
        const allScenes = world.getAllScenes();
        const hasEntities = allScenes.some((scene) =>
            scene.entities && scene.entities.count > 0
        );

        if (!hasEntities) {
            const age = Date.now() - world.createdAt;
            return age > 10 * 60 * 1000; // 10分钟
        }

        return false;
    }

    // ===== 访问器 =====

    /**
     * 获取World总数
     */
    public get worldCount(): number {
        return this._worlds.size;
    }

    /**
     * 获取激活World数量
     */
    public get activeWorldCount(): number {
        return this._activeWorlds.size;
    }

    /**
     * 检查是否正在运行
     */
    public get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * 获取配置
     */
    public get config(): IWorldManagerConfig {
        return {...this._config};
    }
}
