/**
 * Entity Creation Registry Service
 *
 * Manages entity creation templates for the scene hierarchy context menu
 */

import { injectable } from 'tsyringe';
import type { IService } from '@esengine/esengine';
import type { EntityCreationTemplate } from '../Types/UITypes';

@injectable()
export class EntityCreationRegistry implements IService {
    private templates: Map<string, EntityCreationTemplate> = new Map();

    /**
     * Register an entity creation template
     */
    register(template: EntityCreationTemplate): void {
        if (this.templates.has(template.id)) {
            console.warn(`[EntityCreationRegistry] Template '${template.id}' already exists, overwriting`);
        }
        this.templates.set(template.id, template);
    }

    /**
     * Register multiple templates
     */
    registerMany(templates: EntityCreationTemplate[]): void {
        for (const template of templates) {
            this.register(template);
        }
    }

    /**
     * Unregister a template by ID
     */
    unregister(id: string): void {
        this.templates.delete(id);
    }

    /**
     * Get all registered templates sorted by order
     */
    getAll(): EntityCreationTemplate[] {
        return Array.from(this.templates.values())
            .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    }

    /**
     * Get a template by ID
     */
    get(id: string): EntityCreationTemplate | undefined {
        return this.templates.get(id);
    }

    /**
     * Check if a template exists
     */
    has(id: string): boolean {
        return this.templates.has(id);
    }

    /**
     * Clear all templates
     */
    clear(): void {
        this.templates.clear();
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.templates.clear();
    }
}
