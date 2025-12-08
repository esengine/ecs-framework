import { Entity, Core } from '@esengine/ecs-framework';
import { BehaviorTreeData } from './execution/BehaviorTreeData';
import { BehaviorTreeRuntimeComponent } from './execution/BehaviorTreeRuntimeComponent';
import { BehaviorTreeAssetManager } from './execution/BehaviorTreeAssetManager';

/**
 * 行为树启动辅助类
 *
 * 提供便捷方法来启动、停止行为树
 */
export class BehaviorTreeStarter {
    /**
     * 启动行为树
     *
     * @param entity 游戏实体
     * @param treeData 行为树数据
     * @param autoStart 是否自动开始执行
     */
    static start(entity: Entity, treeData: BehaviorTreeData, autoStart: boolean = true): void {
        const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
        assetManager.loadAsset(treeData);

        let runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
        if (!runtime) {
            runtime = new BehaviorTreeRuntimeComponent();
            entity.addComponent(runtime);
        }

        runtime.treeAssetId = treeData.id;
        runtime.autoStart = autoStart;

        if (treeData.blackboardVariables) {
            for (const [key, value] of treeData.blackboardVariables.entries()) {
                runtime.setBlackboardValue(key, value);
            }
        }

        if (autoStart) {
            runtime.isRunning = true;
        }
    }

    /**
     * 停止行为树
     *
     * @param entity 游戏实体
     */
    static stop(entity: Entity): void {
        const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
        if (runtime) {
            runtime.isRunning = false;
            runtime.resetAllStates();
        }
    }

    /**
     * 暂停行为树
     *
     * @param entity 游戏实体
     */
    static pause(entity: Entity): void {
        const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
        if (runtime) {
            runtime.isRunning = false;
        }
    }

    /**
     * 恢复行为树
     *
     * @param entity 游戏实体
     */
    static resume(entity: Entity): void {
        const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
        if (runtime) {
            runtime.isRunning = true;
        }
    }

    /**
     * 重启行为树
     *
     * @param entity 游戏实体
     */
    static restart(entity: Entity): void {
        const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
        if (runtime) {
            runtime.resetAllStates();
            runtime.isRunning = true;
        }
    }
}
