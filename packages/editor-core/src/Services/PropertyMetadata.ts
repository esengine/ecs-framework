import type { IService, PropertyOptions, PropertyAction, PropertyControl, AssetType, EnumOption } from '@esengine/ecs-framework';
import { Injectable, Component, getPropertyMetadata } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('PropertyMetadata');

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
        logger.warn(`No property metadata found for component: ${component.constructor.name}`);
        return {};
    }

    public dispose(): void {
        this.metadata.clear();
        logger.info('PropertyMetadataService disposed');
    }
}
