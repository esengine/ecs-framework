/**
 * Component Action Registry Service
 *
 * Manages component-specific actions for the inspector panel
 */

import { injectable } from 'tsyringe';
import type { IService } from '@esengine/ecs-framework';
import type { ComponentAction } from '../Plugin/IPluginLoader';
// Re-export ComponentAction type from Plugin system
export type { ComponentAction } from '../Plugin/IPluginLoader';

@injectable()
export class ComponentActionRegistry implements IService {
    private actions: Map<string, ComponentAction[]> = new Map();

    /**
     * Register a component action
     */
    register(action: ComponentAction): void {
        const componentName = action.componentName;
        if (!this.actions.has(componentName)) {
            this.actions.set(componentName, []);
        }

        const actions = this.actions.get(componentName)!;
        const existingIndex = actions.findIndex(a => a.id === action.id);

        if (existingIndex >= 0) {
            console.warn(`[ComponentActionRegistry] Action '${action.id}' already exists for '${componentName}', overwriting`);
            actions[existingIndex] = action;
        } else {
            actions.push(action);
        }
    }

    /**
     * Register multiple actions
     */
    registerMany(actions: ComponentAction[]): void {
        for (const action of actions) {
            this.register(action);
        }
    }

    /**
     * Unregister an action by ID
     */
    unregister(componentName: string, actionId: string): void {
        const actions = this.actions.get(componentName);
        if (actions) {
            const index = actions.findIndex(a => a.id === actionId);
            if (index >= 0) {
                actions.splice(index, 1);
            }
        }
    }

    /**
     * Get all actions for a component type sorted by order
     */
    getActionsForComponent(componentName: string): ComponentAction[] {
        const actions = this.actions.get(componentName) || [];
        return [...actions].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    }

    /**
     * Check if a component has any actions
     */
    hasActions(componentName: string): boolean {
        const actions = this.actions.get(componentName);
        return actions !== undefined && actions.length > 0;
    }

    /**
     * Clear all actions
     */
    clear(): void {
        this.actions.clear();
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.actions.clear();
    }
}
