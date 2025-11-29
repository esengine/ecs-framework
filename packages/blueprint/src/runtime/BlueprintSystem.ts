/**
 * Blueprint Execution System - Manages blueprint lifecycle and execution
 * 蓝图执行系统 - 管理蓝图生命周期和执行
 */

import {
    IBlueprintComponent,
    initializeBlueprintVM,
    startBlueprint,
    tickBlueprint,
    cleanupBlueprint
} from './BlueprintComponent';
import { IEntity, IScene } from './ExecutionContext';

/**
 * Blueprint system interface for engine integration
 * 用于引擎集成的蓝图系统接口
 */
export interface IBlueprintSystem {
    /** Process entities with blueprint components (处理带有蓝图组件的实体) */
    process(entities: IBlueprintEntity[], deltaTime: number): void;

    /** Called when entity is added to system (实体添加到系统时调用) */
    onEntityAdded(entity: IBlueprintEntity): void;

    /** Called when entity is removed from system (实体从系统移除时调用) */
    onEntityRemoved(entity: IBlueprintEntity): void;
}

/**
 * Entity with blueprint component
 * 带有蓝图组件的实体
 */
export interface IBlueprintEntity extends IEntity {
    /** Blueprint component data (蓝图组件数据) */
    blueprintComponent: IBlueprintComponent;
}

/**
 * Creates a blueprint execution system
 * 创建蓝图执行系统
 */
export function createBlueprintSystem(scene: IScene): IBlueprintSystem {
    return {
        process(entities: IBlueprintEntity[], deltaTime: number): void {
            for (const entity of entities) {
                const component = entity.blueprintComponent;

                // Skip if no blueprint asset loaded
                // 如果没有加载蓝图资产则跳过
                if (!component.blueprintAsset) {
                    continue;
                }

                // Initialize VM if needed
                // 如果需要则初始化 VM
                if (!component.vm) {
                    initializeBlueprintVM(component, entity, scene);
                }

                // Auto-start if enabled
                // 如果启用则自动启动
                if (component.autoStart && !component.isStarted) {
                    startBlueprint(component);
                }

                // Tick the blueprint
                // 更新蓝图
                tickBlueprint(component, deltaTime);
            }
        },

        onEntityAdded(entity: IBlueprintEntity): void {
            const component = entity.blueprintComponent;

            if (component.blueprintAsset) {
                initializeBlueprintVM(component, entity, scene);

                if (component.autoStart) {
                    startBlueprint(component);
                }
            }
        },

        onEntityRemoved(entity: IBlueprintEntity): void {
            cleanupBlueprint(entity.blueprintComponent);
        }
    };
}

/**
 * Utility to manually trigger blueprint events
 * 手动触发蓝图事件的工具
 */
export function triggerBlueprintEvent(
    entity: IBlueprintEntity,
    eventType: string,
    data?: Record<string, unknown>
): void {
    const vm = entity.blueprintComponent.vm;

    if (vm && entity.blueprintComponent.isStarted) {
        vm.triggerEvent(eventType, data);
    }
}

/**
 * Utility to trigger custom events by name
 * 按名称触发自定义事件的工具
 */
export function triggerCustomBlueprintEvent(
    entity: IBlueprintEntity,
    eventName: string,
    data?: Record<string, unknown>
): void {
    const vm = entity.blueprintComponent.vm;

    if (vm && entity.blueprintComponent.isStarted) {
        vm.triggerCustomEvent(eventName, data);
    }
}
