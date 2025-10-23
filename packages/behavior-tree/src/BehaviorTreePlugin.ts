import type { Core } from '@esengine/ecs-framework';
import type { ServiceContainer, IPlugin, IScene } from '@esengine/ecs-framework';
import { WorldManager } from '@esengine/ecs-framework';
import { LeafExecutionSystem } from './Systems/LeafExecutionSystem';
import { DecoratorExecutionSystem } from './Systems/DecoratorExecutionSystem';
import { CompositeExecutionSystem } from './Systems/CompositeExecutionSystem';
import { SubTreeExecutionSystem } from './Systems/SubTreeExecutionSystem';
import { GlobalBlackboardService } from './Services/GlobalBlackboardService';

/**
 * 行为树插件
 *
 * 提供便捷方法向场景添加行为树系统
 *
 * @example
 * ```typescript
 * const core = Core.create();
 * const plugin = new BehaviorTreePlugin();
 * await core.pluginManager.install(plugin);
 *
 * // 为场景添加行为树系统
 * const scene = new Scene();
 * plugin.setupScene(scene);
 * ```
 */
export class BehaviorTreePlugin implements IPlugin {
    readonly name = '@esengine/behavior-tree';
    readonly version = '1.0.0';

    private worldManager: WorldManager | null = null;
    private services: ServiceContainer | null = null;

    /**
     * 安装插件
     */
    async install(core: Core, services: ServiceContainer): Promise<void> {
        this.services = services;

        // 注册全局黑板服务
        services.registerSingleton(GlobalBlackboardService);

        this.worldManager = services.resolve(WorldManager);
    }

    /**
     * 卸载插件
     */
    async uninstall(): Promise<void> {
        // 注销全局黑板服务
        if (this.services) {
            this.services.unregister(GlobalBlackboardService);
        }

        this.worldManager = null;
        this.services = null;
    }

    /**
     * 为场景设置行为树系统
     *
     * 向场景添加所有必需的行为树系统：
     * - LeafExecutionSystem (updateOrder: 100)
     * - DecoratorExecutionSystem (updateOrder: 200)
     * - CompositeExecutionSystem (updateOrder: 300)
     * - SubTreeExecutionSystem (updateOrder: 300)
     *
     * @param scene 目标场景
     *
     * @example
     * ```typescript
     * const scene = new Scene();
     * behaviorTreePlugin.setupScene(scene);
     * ```
     */
    public setupScene(scene: IScene): void {
        scene.addSystem(new LeafExecutionSystem());
        scene.addSystem(new DecoratorExecutionSystem());
        scene.addSystem(new CompositeExecutionSystem());
        scene.addSystem(new SubTreeExecutionSystem());
    }

    /**
     * 为所有现有场景设置行为树系统
     */
    public setupAllScenes(): void {
        if (!this.worldManager) {
            throw new Error('Plugin not installed');
        }

        const worlds = this.worldManager.getAllWorlds();
        for (const world of worlds) {
            for (const scene of world.getAllScenes()) {
                this.setupScene(scene);
            }
        }
    }
}
