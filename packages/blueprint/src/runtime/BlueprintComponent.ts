/**
 * Blueprint Component - Attaches a blueprint to an entity
 * 蓝图组件 - 将蓝图附加到实体
 */

import { BlueprintAsset } from '../types/blueprint';
import { BlueprintVM } from './BlueprintVM';
import { IEntity, IScene } from './ExecutionContext';

/**
 * Component interface for ECS integration
 * 用于 ECS 集成的组件接口
 */
export interface IBlueprintComponent {
    /** Entity ID this component belongs to (此组件所属的实体ID) */
    entityId: number | null;

    /** Blueprint asset reference (蓝图资产引用) */
    blueprintAsset: BlueprintAsset | null;

    /** Blueprint asset path for serialization (用于序列化的蓝图资产路径) */
    blueprintPath: string;

    /** Auto-start execution when entity is created (实体创建时自动开始执行) */
    autoStart: boolean;

    /** Enable debug mode for VM (启用 VM 调试模式) */
    debug: boolean;

    /** Runtime VM instance (运行时 VM 实例) */
    vm: BlueprintVM | null;

    /** Whether the blueprint has started (蓝图是否已启动) */
    isStarted: boolean;
}

/**
 * Creates a blueprint component data object
 * 创建蓝图组件数据对象
 */
export function createBlueprintComponentData(): IBlueprintComponent {
    return {
        entityId: null,
        blueprintAsset: null,
        blueprintPath: '',
        autoStart: true,
        debug: false,
        vm: null,
        isStarted: false
    };
}

/**
 * Initialize the VM for a blueprint component
 * 为蓝图组件初始化 VM
 */
export function initializeBlueprintVM(
    component: IBlueprintComponent,
    entity: IEntity,
    scene: IScene
): void {
    if (!component.blueprintAsset) {
        return;
    }

    // Create VM instance
    // 创建 VM 实例
    component.vm = new BlueprintVM(component.blueprintAsset, entity, scene);
    component.vm.debug = component.debug;
}

/**
 * Start blueprint execution
 * 开始蓝图执行
 */
export function startBlueprint(component: IBlueprintComponent): void {
    if (component.vm && !component.isStarted) {
        component.vm.start();
        component.isStarted = true;
    }
}

/**
 * Stop blueprint execution
 * 停止蓝图执行
 */
export function stopBlueprint(component: IBlueprintComponent): void {
    if (component.vm && component.isStarted) {
        component.vm.stop();
        component.isStarted = false;
    }
}

/**
 * Update blueprint execution
 * 更新蓝图执行
 */
export function tickBlueprint(component: IBlueprintComponent, deltaTime: number): void {
    if (component.vm && component.isStarted) {
        component.vm.tick(deltaTime);
    }
}

/**
 * Clean up blueprint resources
 * 清理蓝图资源
 */
export function cleanupBlueprint(component: IBlueprintComponent): void {
    if (component.vm) {
        if (component.isStarted) {
            component.vm.stop();
        }
        component.vm = null;
        component.isStarted = false;
    }
}
