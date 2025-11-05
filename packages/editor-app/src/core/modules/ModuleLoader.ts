import { singleton } from 'tsyringe';
import type { IEditorModule, IModuleContext } from '../interfaces';

interface ModuleMetadata {
    module: IEditorModule;
    loaded: boolean;
    loadedAt?: number;
}

@singleton()
export class ModuleLoader {
    private modules = new Map<string, ModuleMetadata>();
    private loadOrder: string[] = [];

    async loadModule<TEvents extends Record<string, unknown> = Record<string, unknown>>(
        module: IEditorModule<TEvents>,
        context: IModuleContext<TEvents>
    ): Promise<void> {
        if (this.modules.has(module.id)) {
            console.warn(`Module ${module.id} is already loaded`);
            return;
        }

        console.log(`[ModuleLoader] Loading module: ${module.name} (${module.id})`);

        if (module.dependencies && module.dependencies.length > 0) {
            await this.loadDependencies(module.dependencies, context);
        }

        try {
            await module.load(context);

            this.modules.set(module.id, {
                module,
                loaded: true,
                loadedAt: Date.now()
            });

            this.loadOrder.push(module.id);

            console.log(`[ModuleLoader] Module loaded: ${module.name}`);
        } catch (error) {
            console.error(`[ModuleLoader] Failed to load module ${module.id}:`, error);
            throw error;
        }
    }

    async unloadModule(moduleId: string): Promise<void> {
        const metadata = this.modules.get(moduleId);
        if (!metadata) {
            console.warn(`Module ${moduleId} is not loaded`);
            return;
        }

        console.log(`[ModuleLoader] Unloading module: ${moduleId}`);

        const dependents = this.getDependents(moduleId);
        if (dependents.length > 0) {
            throw new Error(
                `Cannot unload module ${moduleId}: other modules depend on it: ${dependents.join(', ')}`
            );
        }

        if (metadata.module.unload) {
            try {
                await metadata.module.unload();
            } catch (error) {
                console.error(`[ModuleLoader] Error during module unload:`, error);
            }
        }

        this.modules.delete(moduleId);
        const index = this.loadOrder.indexOf(moduleId);
        if (index !== -1) {
            this.loadOrder.splice(index, 1);
        }

        console.log(`[ModuleLoader] Module unloaded: ${moduleId}`);
    }

    async reloadModule<TEvents extends Record<string, unknown> = Record<string, unknown>>(
        moduleId: string,
        context: IModuleContext<TEvents>
    ): Promise<void> {
        const metadata = this.modules.get(moduleId);
        if (!metadata) {
            throw new Error(`Module ${moduleId} is not loaded`);
        }

        console.log(`[ModuleLoader] Reloading module: ${moduleId}`);

        if (metadata.module.reload) {
            await metadata.module.reload();
        } else {
            await this.unloadModule(moduleId);
            await this.loadModule(metadata.module as IEditorModule<TEvents>, context);
        }

        console.log(`[ModuleLoader] Module reloaded: ${moduleId}`);
    }

    getModule(moduleId: string): IEditorModule | undefined {
        return this.modules.get(moduleId)?.module;
    }

    getAllModules(): IEditorModule[] {
        return Array.from(this.modules.values()).map((metadata) => metadata.module);
    }

    getLoadOrder(): string[] {
        return [...this.loadOrder];
    }

    isLoaded(moduleId: string): boolean {
        return this.modules.has(moduleId);
    }

    private async loadDependencies<TEvents extends Record<string, unknown> = Record<string, unknown>>(
        dependencies: string[],
        context: IModuleContext<TEvents>
    ): Promise<void> {
        for (const depId of dependencies) {
            if (!this.isLoaded(depId)) {
                throw new Error(
                    `Dependency ${depId} is not loaded. Please load dependencies before loading this module.`
                );
            }
        }
    }

    private getDependents(moduleId: string): string[] {
        const dependents: string[] = [];

        for (const [id, metadata] of this.modules.entries()) {
            if (metadata.module.dependencies?.includes(moduleId)) {
                dependents.push(id);
            }
        }

        return dependents;
    }
}
