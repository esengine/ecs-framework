import type { IService } from '@esengine/ecs-framework';
import { Injectable, Component } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('PropertyMetadata');

export type PropertyType = 'number' | 'string' | 'boolean' | 'color' | 'vector2' | 'vector3';

export interface PropertyMetadata {
    type: PropertyType;
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{ label: string; value: any }>;
    readOnly?: boolean;
}

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
        const metadata = this.metadata.get(component.constructor as new (...args: any[]) => Component);
        if (!metadata) {
            return this.inferProperties(component);
        }
        return metadata.properties;
    }

    /**
     * 推断组件属性（当没有明确元数据时）
     */
    private inferProperties(component: Component): Record<string, PropertyMetadata> {
        const properties: Record<string, PropertyMetadata> = {};
        const componentAsAny = component as any;

        for (const key in component) {
            if (component.hasOwnProperty(key)) {
                const value = componentAsAny[key];
                const type = typeof value;

                if (type === 'number') {
                    properties[key] = { type: 'number' };
                } else if (type === 'string') {
                    properties[key] = { type: 'string' };
                } else if (type === 'boolean') {
                    properties[key] = { type: 'boolean' };
                }
            }
        }

        return properties;
    }

    public dispose(): void {
        this.metadata.clear();
        logger.info('PropertyMetadataService disposed');
    }
}
