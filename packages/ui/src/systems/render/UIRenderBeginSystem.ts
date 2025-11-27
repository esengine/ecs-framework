/**
 * UI Render Begin System
 * UI 渲染开始系统
 *
 * This system runs at the beginning of each frame (before other UI render systems)
 * to clear the UIRenderCollector. This ensures that each frame starts with a fresh
 * set of render primitives.
 *
 * 此系统在每帧开始时运行（在其他 UI 渲染系统之前），以清除 UIRenderCollector。
 * 这确保每帧都以一组新的渲染原语开始。
 */

import { EntitySystem, Entity, ECSSystem, Matcher } from '@esengine/ecs-framework';
import { getUIRenderCollector } from './UIRenderCollector';

/**
 * UI Render Begin System
 * UI 渲染开始系统
 *
 * Runs before all other UI render systems to clear the collector.
 * 在所有其他 UI 渲染系统之前运行，以清除收集器。
 *
 * Update order: 99 (runs before UIRectRenderSystem at 100)
 */
@ECSSystem('UIRenderBegin', { updateOrder: 99 })
export class UIRenderBeginSystem extends EntitySystem {
    constructor() {
        // Use Matcher.nothing() to indicate this system doesn't process any entities
        // It only uses lifecycle methods (onBegin) to clear the collector each frame
        // 使用 Matcher.nothing() 表明此系统不处理任何实体
        // 它只使用生命周期方法 (onBegin) 在每帧清除收集器
        super(Matcher.nothing());
    }

    /**
     * Called at the beginning of each frame
     * 每帧开始时调用
     */
    protected override onBegin(): void {
        // Clear the collector for a fresh frame
        // 清除收集器，准备新的一帧
        const collector = getUIRenderCollector();
        collector.clear();
    }

    /**
     * No entities to process (marker component never exists)
     * 没有实体需要处理（标记组件永远不存在）
     */
    protected process(_entities: readonly Entity[]): void {
        // This should never be called since no entity has the marker component
    }
}
