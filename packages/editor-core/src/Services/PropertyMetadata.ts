import type { IService, PropertyOptions, PropertyAction, PropertyControl, AssetType, EnumOption } from '@esengine/esengine';
import { Injectable, Component, getPropertyMetadata } from '@esengine/esengine';
import { createLogger } from '@esengine/esengine';

const logger = createLogger('PropertyMetadata');

/**
 * 不需要在 Inspector 中显示的内部组件类型
 * 这些组件不使用 @Property 装饰器，因为它们的属性不应该被手动编辑
 */
const INTERNAL_COMPONENTS = new Set([
    'HierarchyComponent'
]);

export type { PropertyOptions, PropertyAction, PropertyControl, AssetType, EnumOption };
export type PropertyMetadata = PropertyOptions;
export type PropertyType = 'number' | 'integer' | 'string' | 'boolean' | 'color' | 'vector2' | 'vector3' | 'enum' | 'asset' | 'animationClips';

export interface ComponentMetadata {
    properties: Record<string, PropertyMetadata>;
}

/**
 * 组件属性元数据服务
 *
 * 管理组件属性的元数据信息，用于动态生成属性编辑器
 */
@Injectable()
export class PropertyMetadataService implements IService {
    private metadata: Map<new (...args: any[]) => Component, ComponentMetadata> = new Map();

    /**
     * 注册组件元数据
     */
    public register(componentType: new (...args: any[]) => Component, metadata: ComponentMetadata): void {
        this.metadata.set(componentType, metadata);
        logger.debug(`Registered metadata for component: ${componentType.name}`);
    }

    /**
     * 获取组件元数据
     */
    public getMetadata(componentType: new (...args: any[]) => Component): ComponentMetadata | undefined {
        return this.metadata.get(componentType);
    }

    /**
     * 获取组件的所有可编辑属性
     */
    public getEditableProperties(component: Component): Record<string, PropertyMetadata> {
        // 优先使用手动注册的元数据
        const registeredMetadata = this.metadata.get(component.constructor as new (...args: any[]) => Component);
        if (registeredMetadata) {
            return registeredMetadata.properties;
        }

        // 然后尝试从装饰器获取元数据
        const decoratorMetadata = getPropertyMetadata(component.constructor);
        if (decoratorMetadata) {
            return decoratorMetadata as Record<string, PropertyMetadata>;
        }

        // 没有元数据时返回空对象
        // 内部组件（如 HierarchyComponent）不需要警告
        if (!INTERNAL_COMPONENTS.has(component.constructor.name)) {
            logger.warn(`No property metadata found for component: ${component.constructor.name}`);
        }
        return {};
    }

    public dispose(): void {
        this.metadata.clear();
        logger.info('PropertyMetadataService disposed');
    }
}
