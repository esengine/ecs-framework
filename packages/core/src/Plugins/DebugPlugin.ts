import type { Core } from '../Core';
import type { ServiceContainer } from '../Core/ServiceContainer';
import { IPlugin } from '../Core/Plugin';
import { createLogger } from '../Utils/Logger';
import type { Scene } from '../ECS/Scene';
import type { IScene } from '../ECS/IScene';
import type { Entity } from '../ECS/Entity';
import type { Component } from '../ECS/Component';
import type { EntitySystem } from '../ECS/Systems/EntitySystem';
import { WorldManager } from '../ECS/WorldManager';
import { Injectable, Inject } from '../Core/DI/Decorators';
import type { IService } from '../Core/ServiceContainer';
import type { PerformanceData } from '../Utils/PerformanceMonitor';

const logger = createLogger('DebugPlugin');

/**
 * ECS 调试插件统计信息
 */
export interface ECSDebugStats {
    scenes: SceneDebugInfo[];
    totalEntities: number;
    totalSystems: number;
    timestamp: number;
}

/**
 * 场景调试信息
 */
export interface SceneDebugInfo {
    name: string;
    entityCount: number;
    systems: SystemDebugInfo[];
    entities: EntityDebugInfo[];
}

/**
 * 系统调试信息
 */
export interface SystemDebugInfo {
    name: string;
    enabled: boolean;
    updateOrder: number;
    entityCount: number;
    performance?: {
        avgExecutionTime: number;
        maxExecutionTime: number;
        totalCalls: number;
    };
}

/**
 * 实体调试信息
 */
export interface EntityDebugInfo {
    id: number;
    name: string;
    enabled: boolean;
    tag: number;
    componentCount: number;
    components: ComponentDebugInfo[];
}

/**
 * 组件调试信息
 */
export interface ComponentDebugInfo {
    type: string;
    data: any;
}

/**
 * ECS 调试插件
 *
 * 提供运行时调试功能：
 * - 实时查看实体和组件信息
 * - System 执行统计
 * - 性能监控
 * - 实体查询
 *
 * @example
 * ```typescript
 * const core = Core.create();
 * const debugPlugin = new DebugPlugin({ autoStart: true, updateInterval: 1000 });
 * await core.pluginManager.install(debugPlugin);
 *
 * // 获取调试信息
 * const stats = debugPlugin.getStats();
 * console.log('Total entities:', stats.totalEntities);
 *
 * // 查询实体
 * const entities = debugPlugin.queryEntities({ tag: 1 });
 * ```
 */
@Injectable()
export class DebugPlugin implements IPlugin, IService {
    readonly name = '@esengine/debug-plugin';
    readonly version = '1.0.0';

    private worldManager: WorldManager | null = null;
    private updateInterval: number;
    private updateTimer: any = null;
    private autoStart: boolean;

    /**
     * 创建调试插件实例
     *
     * @param options - 配置选项
     */
    constructor(options?: { autoStart?: boolean; updateInterval?: number }) {
        this.autoStart = options?.autoStart ?? false;
        this.updateInterval = options?.updateInterval ?? 1000;
    }

    /**
     * 安装插件
     */
    async install(core: Core, services: ServiceContainer): Promise<void> {
        this.worldManager = services.resolve(WorldManager);

        logger.info('ECS Debug Plugin installed');

        if (this.autoStart) {
            this.start();
        }
    }

    /**
     * 卸载插件
     */
    async uninstall(): Promise<void> {
        this.stop();
        this.worldManager = null;

        logger.info('ECS Debug Plugin uninstalled');
    }

    /**
     * 实现 IService 接口
     */
    public dispose(): void {
        this.stop();
        this.worldManager = null;
    }

    /**
     * 启动调试监控
     */
    public start(): void {
        if (this.updateTimer) {
            logger.warn('Debug monitoring already started');
            return;
        }

        logger.info('Starting debug monitoring');

        this.updateTimer = setInterval(() => {
            this.logStats();
        }, this.updateInterval);
    }

    /**
     * 停止调试监控
     */
    public stop(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
            logger.info('Debug monitoring stopped');
        }
    }

    /**
     * 获取当前 ECS 统计信息
     */
    public getStats(): ECSDebugStats {
        if (!this.worldManager) {
            throw new Error('Plugin not installed');
        }

        const scenes: SceneDebugInfo[] = [];
        let totalEntities = 0;
        let totalSystems = 0;

        const worlds = this.worldManager.getAllWorlds();

        for (const world of worlds) {
            for (const scene of world.getAllScenes()) {
                const sceneInfo = this.getSceneInfo(scene);
                scenes.push(sceneInfo);
                totalEntities += sceneInfo.entityCount;
                totalSystems += sceneInfo.systems.length;
            }
        }

        return {
            scenes,
            totalEntities,
            totalSystems,
            timestamp: Date.now()
        };
    }

    /**
     * 获取场景调试信息
     */
    public getSceneInfo(scene: IScene): SceneDebugInfo {
        const entities = scene.entities.buffer;
        const systems = scene.systems;

        return {
            name: scene.name,
            entityCount: entities.length,
            systems: systems.map(sys => this.getSystemInfo(sys)),
            entities: entities.map(entity => this.getEntityInfo(entity))
        };
    }

    /**
     * 获取系统调试信息
     */
    private getSystemInfo(system: EntitySystem): SystemDebugInfo {
        const perfStats = system.getPerformanceStats();

        return {
            name: system.constructor.name,
            enabled: system.enabled,
            updateOrder: system.updateOrder,
            entityCount: system.entities.length,
            performance: perfStats ? {
                avgExecutionTime: perfStats.averageTime,
                maxExecutionTime: perfStats.maxTime,
                totalCalls: perfStats.executionCount
            } : undefined
        };
    }

    /**
     * 获取实体调试信息
     */
    public getEntityInfo(entity: Entity): EntityDebugInfo {
        const components = entity.components;

        return {
            id: entity.id,
            name: entity.name,
            enabled: entity.enabled,
            tag: entity.tag,
            componentCount: components.length,
            components: components.map(comp => this.getComponentInfo(comp))
        };
    }

    /**
     * 获取组件调试信息
     */
    private getComponentInfo(component: any): ComponentDebugInfo {
        const type = component.constructor.name;
        const data: any = {};

        for (const key of Object.keys(component)) {
            if (!key.startsWith('_')) {
                const value = component[key];
                if (typeof value !== 'function') {
                    data[key] = value;
                }
            }
        }

        return { type, data };
    }

    /**
     * 查询实体
     *
     * @param filter - 查询过滤器
     */
    public queryEntities(filter: {
        sceneId?: string;
        tag?: number;
        name?: string;
        hasComponent?: string;
    }): EntityDebugInfo[] {
        if (!this.worldManager) {
            throw new Error('Plugin not installed');
        }

        const results: EntityDebugInfo[] = [];
        const worlds = this.worldManager.getAllWorlds();

        for (const world of worlds) {
            for (const scene of world.getAllScenes()) {
                if (filter.sceneId && scene.name !== filter.sceneId) {
                    continue;
                }

                for (const entity of scene.entities.buffer) {
                    if (filter.tag !== undefined && entity.tag !== filter.tag) {
                        continue;
                    }

                    if (filter.name && !entity.name.includes(filter.name)) {
                        continue;
                    }

                    if (filter.hasComponent) {
                        const hasComp = entity.components.some(
                            c => c.constructor.name === filter.hasComponent
                        );
                        if (!hasComp) {
                            continue;
                        }
                    }

                    results.push(this.getEntityInfo(entity));
                }
            }
        }

        return results;
    }

    /**
     * 打印统计信息到日志
     */
    private logStats(): void {
        const stats = this.getStats();

        logger.info('=== ECS Debug Stats ===');
        logger.info(`Total Entities: ${stats.totalEntities}`);
        logger.info(`Total Systems: ${stats.totalSystems}`);
        logger.info(`Scenes: ${stats.scenes.length}`);

        for (const scene of stats.scenes) {
            logger.info(`\n[Scene: ${scene.name}]`);
            logger.info(`  Entities: ${scene.entityCount}`);
            logger.info(`  Systems: ${scene.systems.length}`);

            for (const system of scene.systems) {
                const perfStr = system.performance
                    ? ` | Avg: ${system.performance.avgExecutionTime.toFixed(2)}ms, Max: ${system.performance.maxExecutionTime.toFixed(2)}ms`
                    : '';
                logger.info(
                    `    - ${system.name} (${system.enabled ? 'enabled' : 'disabled'}) | Entities: ${system.entityCount}${perfStr}`
                );
            }
        }

        logger.info('========================\n');
    }

    /**
     * 导出调试数据为 JSON
     */
    public exportJSON(): string {
        const stats = this.getStats();
        return JSON.stringify(stats, null, 2);
    }
}
