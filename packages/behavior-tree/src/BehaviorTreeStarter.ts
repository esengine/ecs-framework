import { Entity } from '@esengine/ecs-framework';
import { BehaviorTreeNode } from './Components/BehaviorTreeNode';
import { ActiveNode } from './Components/ActiveNode';
import { TaskStatus } from './Types/TaskStatus';

/**
 * 行为树启动/停止辅助类
 *
 * 提供便捷方法来启动、停止和暂停行为树
 */
export class BehaviorTreeStarter {
    /**
     * 启动行为树
     *
     * 给根节点添加 ActiveNode 组件，使行为树开始执行
     *
     * @param rootEntity 行为树根节点实体
     *
     * @example
     * ```typescript
     * const aiRoot = scene.createEntity('aiRoot');
     * // ... 构建行为树结构
     * BehaviorTreeStarter.start(aiRoot);
     * ```
     */
    static start(rootEntity: Entity): void {
        if (!rootEntity.hasComponent(BehaviorTreeNode)) {
            throw new Error('Entity must have BehaviorTreeNode component');
        }

        if (!rootEntity.hasComponent(ActiveNode)) {
            rootEntity.addComponent(new ActiveNode());
        }
    }

    /**
     * 停止行为树
     *
     * 移除所有节点的 ActiveNode 组件，停止执行
     *
     * @param rootEntity 行为树根节点实体
     *
     * @example
     * ```typescript
     * BehaviorTreeStarter.stop(aiRoot);
     * ```
     */
    static stop(rootEntity: Entity): void {
        this.stopRecursive(rootEntity);
    }

    /**
     * 递归停止所有子节点
     */
    private static stopRecursive(entity: Entity): void {
        // 移除活跃标记
        if (entity.hasComponent(ActiveNode)) {
            entity.removeComponentByType(ActiveNode);
        }

        // 重置节点状态
        const node = entity.getComponent(BehaviorTreeNode);
        if (node) {
            node.reset();
        }

        // 递归处理子节点
        for (const child of entity.children) {
            this.stopRecursive(child);
        }
    }

    /**
     * 暂停行为树
     *
     * 移除 ActiveNode 但保留节点状态，可以恢复执行
     *
     * @param rootEntity 行为树根节点实体
     *
     * @example
     * ```typescript
     * // 暂停
     * BehaviorTreeStarter.pause(aiRoot);
     *
     * // 恢复
     * BehaviorTreeStarter.resume(aiRoot);
     * ```
     */
    static pause(rootEntity: Entity): void {
        this.pauseRecursive(rootEntity);
    }

    /**
     * 递归暂停所有子节点
     */
    private static pauseRecursive(entity: Entity): void {
        // 只移除活跃标记，不重置状态
        if (entity.hasComponent(ActiveNode)) {
            entity.removeComponentByType(ActiveNode);
        }

        // 递归处理子节点
        for (const child of entity.children) {
            this.pauseRecursive(child);
        }
    }

    /**
     * 恢复行为树执行
     *
     * 从暂停状态恢复，重新添加 ActiveNode 到之前正在执行的节点
     *
     * @param rootEntity 行为树根节点实体
     *
     * @example
     * ```typescript
     * BehaviorTreeStarter.resume(aiRoot);
     * ```
     */
    static resume(rootEntity: Entity): void {
        this.resumeRecursive(rootEntity);
    }

    /**
     * 递归恢复所有正在执行的节点
     */
    private static resumeRecursive(entity: Entity): void {
        const node = entity.getComponent(BehaviorTreeNode);
        if (!node) {
            return;
        }

        // 如果节点状态是 Running，恢复活跃标记
        if (node.status === TaskStatus.Running) {
            if (!entity.hasComponent(ActiveNode)) {
                entity.addComponent(new ActiveNode());
            }
        }

        // 递归处理子节点
        for (const child of entity.children) {
            this.resumeRecursive(child);
        }
    }

    /**
     * 重启行为树
     *
     * 停止并重置所有节点，然后重新启动
     *
     * @param rootEntity 行为树根节点实体
     *
     * @example
     * ```typescript
     * BehaviorTreeStarter.restart(aiRoot);
     * ```
     */
    static restart(rootEntity: Entity): void {
        this.stop(rootEntity);
        this.start(rootEntity);
    }

    /**
     * 检查行为树是否正在运行
     *
     * @param rootEntity 行为树根节点实体
     * @returns 是否正在运行
     *
     * @example
     * ```typescript
     * if (BehaviorTreeStarter.isRunning(aiRoot)) {
     *     console.log('AI is active');
     * }
     * ```
     */
    static isRunning(rootEntity: Entity): boolean {
        return rootEntity.hasComponent(ActiveNode);
    }
}
