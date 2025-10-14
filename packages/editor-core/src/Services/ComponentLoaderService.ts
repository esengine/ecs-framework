import type { IService } from '@esengine/ecs-framework';
import { Injectable, Component } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';
import type { ComponentFileInfo } from './ComponentDiscoveryService';
import { ComponentRegistry } from './ComponentRegistry';

const logger = createLogger('ComponentLoaderService');

export interface LoadedComponentInfo {
    fileInfo: ComponentFileInfo;
    componentClass: typeof Component;
    loadedAt: number;
}

@Injectable()
export class ComponentLoaderService implements IService {
    private loadedComponents: Map<string, LoadedComponentInfo> = new Map();
    private messageHub: MessageHub;
    private componentRegistry: ComponentRegistry;

    constructor(messageHub: MessageHub, componentRegistry: ComponentRegistry) {
        this.messageHub = messageHub;
        this.componentRegistry = componentRegistry;
    }

    public async loadComponents(
        componentInfos: ComponentFileInfo[],
        modulePathTransform?: (filePath: string) => string
    ): Promise<LoadedComponentInfo[]> {
        logger.info(`Loading ${componentInfos.length} components`);

        const loadedComponents: LoadedComponentInfo[] = [];

        for (const componentInfo of componentInfos) {
            try {
                const loadedComponent = await this.loadComponent(componentInfo, modulePathTransform);
                if (loadedComponent) {
                    loadedComponents.push(loadedComponent);
                }
            } catch (error) {
                logger.error(`Failed to load component: ${componentInfo.fileName}`, error);
            }
        }

        await this.messageHub.publish('components:loaded', {
            count: loadedComponents.length,
            components: loadedComponents
        });

        logger.info(`Successfully loaded ${loadedComponents.length} components`);
        return loadedComponents;
    }

    public async loadComponent(
        componentInfo: ComponentFileInfo,
        modulePathTransform?: (filePath: string) => string
    ): Promise<LoadedComponentInfo | null> {
        try {
            const modulePath = modulePathTransform
                ? modulePathTransform(componentInfo.path)
                : this.convertToModulePath(componentInfo.path);

            logger.debug(`Loading component from: ${modulePath}`);

            const module = await import(/* @vite-ignore */ modulePath);

            if (!componentInfo.className) {
                logger.warn(`No class name found for component: ${componentInfo.fileName}`);
                return null;
            }

            const componentClass = module[componentInfo.className];

            if (!componentClass || !(componentClass.prototype instanceof Component)) {
                logger.error(`Invalid component class: ${componentInfo.className}`);
                return null;
            }

            this.componentRegistry.register({
                name: componentInfo.className,
                type: componentClass
            });

            const loadedInfo: LoadedComponentInfo = {
                fileInfo: componentInfo,
                componentClass,
                loadedAt: Date.now()
            };

            this.loadedComponents.set(componentInfo.path, loadedInfo);

            logger.info(`Component loaded and registered: ${componentInfo.className}`);

            return loadedInfo;
        } catch (error) {
            logger.error(`Failed to load component: ${componentInfo.fileName}`, error);
            return null;
        }
    }

    public getLoadedComponents(): LoadedComponentInfo[] {
        return Array.from(this.loadedComponents.values());
    }

    public unloadComponent(filePath: string): boolean {
        const loadedComponent = this.loadedComponents.get(filePath);

        if (!loadedComponent || !loadedComponent.fileInfo.className) {
            return false;
        }

        this.componentRegistry.unregister(loadedComponent.fileInfo.className);
        this.loadedComponents.delete(filePath);

        logger.info(`Component unloaded: ${loadedComponent.fileInfo.className}`);
        return true;
    }

    public clearLoadedComponents(): void {
        for (const [filePath] of this.loadedComponents) {
            this.unloadComponent(filePath);
        }
        logger.info('Cleared all loaded components');
    }

    private convertToModulePath(filePath: string): string {
        const normalizedPath = filePath.replace(/\\/g, '/');

        if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
            return normalizedPath;
        }

        return `file:///${normalizedPath}`;
    }

    public dispose(): void {
        this.clearLoadedComponents();
        logger.info('ComponentLoaderService disposed');
    }
}
