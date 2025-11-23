import React from 'react';
import { IService, createLogger } from '@esengine/ecs-framework';
import { IPropertyRenderer, IPropertyRendererRegistry, PropertyContext } from './IPropertyRenderer';

const logger = createLogger('PropertyRendererRegistry');

export class PropertyRendererRegistry implements IPropertyRendererRegistry, IService {
    private renderers: Map<string, IPropertyRenderer> = new Map();

    register(renderer: IPropertyRenderer): void {
        if (this.renderers.has(renderer.id)) {
            logger.warn(`Overwriting existing property renderer: ${renderer.id}`);
        }

        this.renderers.set(renderer.id, renderer);
        logger.debug(`Registered property renderer: ${renderer.name} (${renderer.id})`);
    }

    unregister(rendererId: string): void {
        if (this.renderers.delete(rendererId)) {
            logger.debug(`Unregistered property renderer: ${rendererId}`);
        }
    }

    findRenderer(value: any, context: PropertyContext): IPropertyRenderer | undefined {
        const renderers = Array.from(this.renderers.values())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const renderer of renderers) {
            try {
                if (renderer.canHandle(value, context)) {
                    return renderer;
                }
            } catch (error) {
                logger.error(`Error in canHandle for renderer ${renderer.id}:`, error);
            }
        }

        return undefined;
    }

    render(value: any, context: PropertyContext): React.ReactElement | null {
        const renderer = this.findRenderer(value, context);

        if (!renderer) {
            logger.debug(`No renderer found for value type: ${typeof value}`);
            return null;
        }

        try {
            return renderer.render(value, context);
        } catch (error) {
            logger.error(`Error rendering with ${renderer.id}:`, error);
            return React.createElement(
                'span',
                { style: { color: '#f87171', fontStyle: 'italic' } },
                '[Render Error]'
            );
        }
    }

    getAllRenderers(): IPropertyRenderer[] {
        return Array.from(this.renderers.values());
    }

    hasRenderer(value: any, context: PropertyContext): boolean {
        return this.findRenderer(value, context) !== undefined;
    }

    dispose(): void {
        this.renderers.clear();
        logger.debug('PropertyRendererRegistry disposed');
    }
}
