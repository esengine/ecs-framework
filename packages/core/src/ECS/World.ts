import {IScene} from "./IScene";
import {Scene} from "./Scene";
import {createLogger} from "../Utils/Logger";

const logger = createLogger("World");

/**
 * 全局系统接口
 * 全局系统是在World级别运行的系统，不依赖特定Scene
 */
export interface IGlobalSystem {
    /**
     * 系统名称
     */
    readonly name: string;

    /**
     * 初始化系统
     */
    initialize?(): void;

    /**
     * 更新系统
     */
    update(deltaTime?: number): void;

    /**
     * 重置系统
     */
    reset?(): void;

    /**
     * 销毁系统
     */
    destroy?(): void;
}

/**
 * World配置接口
 */
export interface IWorldConfig {
    /**
     * World名称
     */
    name?: string;

    /**
     * 是否启用调试模式
     */
    debug?: boolean;

    /**
     * 最大Scene数量限制
     */
    maxScenes?: number;

    /**
     * 是否自动清理空Scene
     */
    autoCleanup?: boolean;
}

/**
 * World类 - ECS世界管理器
 *
 * World是Scene的容器，每个World可以管理多个Scene。
 * 这种设计允许创建独立的游戏世界，如：
 * - 游戏房间（每个房间一个World）
 * - 不同的游戏模式
 * - 独立的模拟环境
 *
 * @example
 * ```typescript
 * // 创建游戏房间的World
 * const roomWorld = new World({ name: 'Room_001' });
 *
 * // 在World中创建Scene
 * const gameScene = roomWorld.createScene('game', new Scene());
 * const uiScene = roomWorld.createScene('ui', new Scene());
 *
 * // 更新整个World
 * roomWorld.update(deltaTime);
 * ```
 */
export class World {
    public readonly name: string;
    private readonly _config: IWorldConfig;
    private readonly _scenes: Map<string, IScene> = new Map();
    private readonly _activeScenes: Set<string> = new Set();
    private readonly _globalSystems: IGlobalSystem[] = [];
    private _isActive: boolean = false;
    private _createdAt: number;

    constructor(config: IWorldConfig = {}) {
        this._config = {
            name: "World",
            debug: false,
            maxScenes: 10,
            autoCleanup: true,
            ...config
        };

        this.name = this._config.name!;
        this._createdAt = Date.now();
    }

    // ===== Scene管理 =====

    /**
     * 创建并添加Scene到World
     */
    public createScene<T extends IScene>(sceneId: string, sceneInstance?: T): T {
        if (this._scenes.has(sceneId)) {
            throw new Error(`Scene ID '${sceneId}' 已存在于World '${this.name}' 中`);
        }

        if (this._scenes.size >= this._config.maxScenes!) {
            throw new Error(`World '${this.name}' 已达到最大Scene数量限制: ${this._config.maxScenes}`);
        }

        // 如果没有提供Scene实例，创建默认Scene
        const scene = sceneInstance || (new Scene() as unknown as T);

        // 设置Scene的标识
        if ("id" in scene) {
            (scene as any).id = sceneId;
        }
        if ("name" in scene && !scene.name) {
            scene.name = sceneId;
        }

        this._scenes.set(sceneId, scene);

        // 初始化Scene
        scene.initialize();

        return scene;
    }

    /**
     * 移除Scene
     */
    public removeScene(sceneId: string): boolean {
        const scene = this._scenes.get(sceneId);
        if (!scene) {
            return false;
        }

        // 如果Scene正在运行，先停止它
        if (this._activeScenes.has(sceneId)) {
            this.setSceneActive(sceneId, false);
        }

        // 清理Scene资源
        scene.end();
        this._scenes.delete(sceneId);

        logger.info(`从World '${this.name}' 中移除Scene: ${sceneId}`);
        return true;
    }

    /**
     * 获取Scene
     */
    public getScene<T extends IScene>(sceneId: string): T | null {
        return this._scenes.get(sceneId) as T || null;
    }

    /**
     * 获取所有Scene ID
     */
    public getSceneIds(): string[] {
        return Array.from(this._scenes.keys());
    }

    /**
     * 获取所有Scene
     */
    public getAllScenes(): IScene[] {
        return Array.from(this._scenes.values());
    }

    /**
     * 移除所有Scene
     */
    public removeAllScenes(): void {
        const sceneIds = Array.from(this._scenes.keys());
        for (const sceneId of sceneIds) {
            this.removeScene(sceneId);
        }
        logger.info(`从World '${this.name}' 中移除所有Scene`);
    }

    /**
     * 设置Scene激活状态
     */
    public setSceneActive(sceneId: string, active: boolean): void {
        const scene = this._scenes.get(sceneId);
        if (!scene) {
            logger.warn(`Scene '${sceneId}' 不存在于World '${this.name}' 中`);
            return;
        }

        if (active) {
            this._activeScenes.add(sceneId);
            // 启动Scene
            if (scene.begin) {
                scene.begin();
            }
            logger.debug(`在World '${this.name}' 中激活Scene: ${sceneId}`);
        } else {
            this._activeScenes.delete(sceneId);
            // 可选择性地停止Scene，或者让它继续运行但不更新
            logger.debug(`在World '${this.name}' 中停用Scene: ${sceneId}`);
        }
    }

    /**
     * 检查Scene是否激活
     */
    public isSceneActive(sceneId: string): boolean {
        return this._activeScenes.has(sceneId);
    }

    /**
     * 获取活跃Scene数量
     */
    public getActiveSceneCount(): number {
        return this._activeScenes.size;
    }

    // ===== 全局System管理 =====

    /**
     * 添加全局System
     * 全局System会在所有激活Scene之前更新
     */
    public addGlobalSystem<T extends IGlobalSystem>(system: T): T {
        if (this._globalSystems.includes(system)) {
            return system;
        }

        this._globalSystems.push(system);
        if (system.initialize) {
            system.initialize();
        }

        logger.debug(`在World '${this.name}' 中添加全局System: ${system.name}`);
        return system;
    }

    /**
     * 移除全局System
     */
    public removeGlobalSystem(system: IGlobalSystem): boolean {
        const index = this._globalSystems.indexOf(system);
        if (index === -1) {
            return false;
        }

        this._globalSystems.splice(index, 1);
        if (system.reset) {
            system.reset();
        }

        logger.debug(`从World '${this.name}' 中移除全局System: ${system.name}`);
        return true;
    }

    /**
     * 获取全局System
     */
    public getGlobalSystem<T extends IGlobalSystem>(type: new (...args: any[]) => T): T | null {
        for (const system of this._globalSystems) {
            if (system instanceof type) {
                return system as T;
            }
        }
        return null;
    }

    // ===== World生命周期 =====

    /**
     * 启动World
     */
    public start(): void {
        if (this._isActive) {
            return;
        }

        this._isActive = true;

        // 启动所有全局System
        for (const system of this._globalSystems) {
            if (system.initialize) {
                system.initialize();
            }
        }

        logger.info(`启动World: ${this.name}`);
    }

    /**
     * 停止World
     */
    public stop(): void {
        if (!this._isActive) {
            return;
        }

        // 停止所有Scene
        for (const sceneId of this._activeScenes) {
            this.setSceneActive(sceneId, false);
        }

        // 重置所有全局System
        for (const system of this._globalSystems) {
            if (system.reset) {
                system.reset();
            }
        }

        this._isActive = false;
        logger.info(`停止World: ${this.name}`);
    }

    /**
     * 更新World中的全局System
     * 注意：此方法由Core.update()调用，不应直接调用
     */
    public updateGlobalSystems(): void {
        if (!this._isActive) {
            return;
        }

        // 更新全局System
        for (const system of this._globalSystems) {
            if (system.update) {
                system.update();
            }
        }
    }

    /**
     * 更新World中的所有激活Scene
     * 注意：此方法由Core.update()调用，不应直接调用
     */
    public updateScenes(): void {
        if (!this._isActive) {
            return;
        }

        // 更新所有激活的Scene
        for (const sceneId of this._activeScenes) {
            const scene = this._scenes.get(sceneId);
            if (scene && scene.update) {
                scene.update();
            }
        }

        // 自动清理（如果启用）
        if (this._config.autoCleanup && this.shouldAutoCleanup()) {
            this.cleanup();
        }
    }

    /**
     * 销毁World
     */
    public destroy(): void {
        logger.info(`销毁World: ${this.name}`);

        // 停止World
        this.stop();

        // 销毁所有Scene
        const sceneIds = Array.from(this._scenes.keys());
        for (const sceneId of sceneIds) {
            this.removeScene(sceneId);
        }

        // 清理全局System
        for (const system of this._globalSystems) {
            if (system.destroy) {
                system.destroy();
            } else if (system.reset) {
                system.reset();
            }
        }
        this._globalSystems.length = 0;

        this._scenes.clear();
        this._activeScenes.clear();
    }

    // ===== 状态信息 =====

    /**
     * 获取World状态
     */
    public getStatus() {
        return {
            name: this.name,
            isActive: this._isActive,
            sceneCount: this._scenes.size,
            activeSceneCount: this._activeScenes.size,
            globalSystemCount: this._globalSystems.length,
            createdAt: this._createdAt,
            config: {...this._config},
            scenes: Array.from(this._scenes.keys()).map((sceneId) => ({
                id: sceneId,
                isActive: this._activeScenes.has(sceneId),
                name: this._scenes.get(sceneId)?.name || sceneId
            }))
        };
    }

    /**
     * 获取World统计信息
     */
    public getStats() {
        const stats = {
            totalEntities: 0,
            totalSystems: this._globalSystems.length,
            memoryUsage: 0,
            performance: {
                averageUpdateTime: 0,
                maxUpdateTime: 0
            }
        };

        // 统计所有Scene的实体数量
        for (const scene of this._scenes.values()) {
            if (scene.entities) {
                stats.totalEntities += scene.entities.count;
            }
            if (scene.systems) {
                stats.totalSystems += scene.systems.length;
            }
        }

        return stats;
    }

    // ===== 私有方法 =====

    /**
     * 检查是否应该执行自动清理
     */
    private shouldAutoCleanup(): boolean {
        // 简单的清理策略：如果有空Scene且超过5分钟没有实体
        const currentTime = Date.now();
        const cleanupThreshold = 5 * 60 * 1000; // 5分钟

        for (const [sceneId, scene] of this._scenes) {
            if (!this._activeScenes.has(sceneId) &&
                scene.entities &&
                scene.entities.count === 0 &&
                (currentTime - this._createdAt) > cleanupThreshold) {
                return true;
            }
        }

        return false;
    }

    /**
     * 执行清理操作
     */
    private cleanup(): void {
        const sceneIds = Array.from(this._scenes.keys());
        const currentTime = Date.now();
        const cleanupThreshold = 5 * 60 * 1000; // 5分钟

        for (const sceneId of sceneIds) {
            const scene = this._scenes.get(sceneId);
            if (scene &&
                !this._activeScenes.has(sceneId) &&
                scene.entities &&
                scene.entities.count === 0 &&
                (currentTime - this._createdAt) > cleanupThreshold) {

                this.removeScene(sceneId);
                logger.debug(`自动清理空Scene: ${sceneId} from World ${this.name}`);
            }
        }
    }

    // ===== 访问器 =====

    /**
     * 检查World是否激活
     */
    public get isActive(): boolean {
        return this._isActive;
    }

    /**
     * 获取Scene数量
     */
    public get sceneCount(): number {
        return this._scenes.size;
    }

    /**
     * 获取创建时间
     */
    public get createdAt(): number {
        return this._createdAt;
    }
}
