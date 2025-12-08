import React from 'react';
import { Component, IService, createLogger } from '@esengine/ecs-framework';

const logger = createLogger('ComponentInspectorRegistry');

/**
 * 组件检查器上下文
 * Context passed to component inspectors
 */
export interface ComponentInspectorContext {
    /** 被检查的组件 */
    component: Component;
    /** 所属实体 */
    entity: any;
    /** 版本号（用于触发重渲染） */
    version?: number;
    /** 属性变更回调 */
    onChange?: (propertyName: string, value: any) => void;
    /** 动作回调 */
    onAction?: (actionId: string, propertyName: string, component: Component) => void;
}

/**
 * Inspector render mode.
 * 检查器渲染模式。
 */
export type InspectorRenderMode = 'replace' | 'append';

/**
 * 组件检查器接口
 * Interface for custom component inspectors
 */
export interface IComponentInspector<T extends Component = Component> {
    /** 唯一标识符 */
    readonly id: string;
    /** 显示名称 */
    readonly name: string;
    /** 优先级（数字越大优先级越高） */
    readonly priority?: number;
    /** 目标组件类型名称列表 */
    readonly targetComponents: string[];
    /**
     * 渲染模式
     * - 'replace': 替换默认的 PropertyInspector（默认）
     * - 'append': 追加到默认的 PropertyInspector 后面
     */
    readonly renderMode?: InspectorRenderMode;

    /**
     * 判断是否可以处理该组件
     */
    canHandle(component: Component): component is T;

    /**
     * 渲染组件检查器
     */
    render(context: ComponentInspectorContext): React.ReactElement;
}

/**
 * 组件检查器注册表
 * Registry for custom component inspectors
 */
export class ComponentInspectorRegistry implements IService {
    private inspectors: Map<string, IComponentInspector> = new Map();

    /**
     * 注册组件检查器
     */
    register(inspector: IComponentInspector): void {
        if (this.inspectors.has(inspector.id)) {
            logger.warn(`Overwriting existing component inspector: ${inspector.id}`);
        }
        this.inspectors.set(inspector.id, inspector);
        logger.debug(`Registered component inspector: ${inspector.name} (${inspector.id})`);
    }

    /**
     * 注销组件检查器
     */
    unregister(inspectorId: string): void {
        if (this.inspectors.delete(inspectorId)) {
            logger.debug(`Unregistered component inspector: ${inspectorId}`);
        }
    }

    /**
     * 查找可以处理指定组件的检查器（仅 replace 模式）
     * Find inspector that can handle the component (replace mode only)
     */
    findInspector(component: Component): IComponentInspector | undefined {
        const inspectors = Array.from(this.inspectors.values())
            .filter(i => i.renderMode !== 'append')
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const inspector of inspectors) {
            try {
                if (inspector.canHandle(component)) {
                    return inspector;
                }
            } catch (error) {
                logger.error(`Error in canHandle for inspector ${inspector.id}:`, error);
            }
        }

        return undefined;
    }

    /**
     * 查找所有追加模式的检查器
     * Find all append-mode inspectors for the component
     */
    findAppendInspectors(component: Component): IComponentInspector[] {
        const result: IComponentInspector[] = [];
        const inspectors = Array.from(this.inspectors.values())
            .filter(i => i.renderMode === 'append')
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const inspector of inspectors) {
            try {
                if (inspector.canHandle(component)) {
                    result.push(inspector);
                }
            } catch (error) {
                logger.error(`Error in canHandle for inspector ${inspector.id}:`, error);
            }
        }

        return result;
    }

    /**
     * 检查是否有自定义检查器（replace 模式）
     */
    hasInspector(component: Component): boolean {
        return this.findInspector(component) !== undefined;
    }

    /**
     * 检查是否有追加检查器
     */
    hasAppendInspectors(component: Component): boolean {
        return this.findAppendInspectors(component).length > 0;
    }

    /**
     * 渲染组件（replace 模式）
     * Render component with replace-mode inspector
     */
    render(context: ComponentInspectorContext): React.ReactElement | null {
        const inspector = this.findInspector(context.component);
        if (!inspector) {
            return null;
        }

        try {
            return inspector.render(context);
        } catch (error) {
            logger.error(`Error rendering with inspector ${inspector.id}:`, error);
            return React.createElement(
                'span',
                { style: { color: '#f87171', fontStyle: 'italic' } },
                '[Inspector Render Error]'
            );
        }
    }

    /**
     * 渲染追加检查器
     * Render append-mode inspectors
     */
    renderAppendInspectors(context: ComponentInspectorContext): React.ReactElement[] {
        const inspectors = this.findAppendInspectors(context.component);
        const elements: React.ReactElement[] = [];

        for (const inspector of inspectors) {
            try {
                elements.push(
                    React.createElement(
                        React.Fragment,
                        { key: inspector.id },
                        inspector.render(context)
                    )
                );
            } catch (error) {
                logger.error(`Error rendering append inspector ${inspector.id}:`, error);
                elements.push(
                    React.createElement(
                        'span',
                        { key: inspector.id, style: { color: '#f87171', fontStyle: 'italic' } },
                        `[${inspector.name} Error]`
                    )
                );
            }
        }

        return elements;
    }

    /**
     * 获取所有注册的检查器
     */
    getAllInspectors(): IComponentInspector[] {
        return Array.from(this.inspectors.values());
    }

    dispose(): void {
        this.inspectors.clear();
        logger.debug('ComponentInspectorRegistry disposed');
    }
}
