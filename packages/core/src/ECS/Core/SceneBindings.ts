import { Entity } from '../Entity';
import { IScene } from '../IScene';

/**
 * 场景绑定管理器
 * 
 * 统一处理实体与场景相关的副作用调用
 */
export class SceneBindings {
    /**
     * 通知场景实体组件已变更
     * 
     * 包含场景标记变更和查询系统更新两个操作
     * 
     * @param entity - 发生变更的实体
     * @param options - 可选配置
     */
    public static notifyComponentChanged(
        entity: Entity,
        options: {
            suppressQueryUpdate?: boolean;
        } = {}
    ): void {
        const scene = entity.scene;
        if (!scene) {
            return;
        }

        // 通知场景组件变更
        scene.markComponentChanged();

        // 更新查询系统（除非被抑制）
        if (!options.suppressQueryUpdate && scene.querySystem) {
            scene.querySystem.removeEntity(entity);
            scene.querySystem.addEntity(entity);
        }
    }

    /**
     * 从场景中移除实体（用于销毁时）
     * 
     * @param entity - 要移除的实体
     */
    public static removeFromScene(entity: Entity): void {
        const scene = entity.scene;
        if (!scene) {
            return;
        }

        // 从查询系统中移除
        if (scene.querySystem) {
            scene.querySystem.removeEntity(entity);
        }

        // 从实体列表中移除
        if (scene.entities) {
            scene.entities.remove(entity);
        }
    }

    /**
     * 检查场景是否抑制副作用
     * 
     * @param scene - 场景实例
     * @returns 是否抑制副作用
     */
    public static shouldSuppressEffects(scene: IScene | null): boolean {
        return scene ? scene.suspendEffects : false;
    }
}