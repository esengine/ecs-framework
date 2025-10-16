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

        return loadedComponents;
    }

    public async loadComponent(
        componentInfo: ComponentFileInfo,
        modulePathTransform?: (filePath: string) => string
    ): Promise<LoadedComponentInfo | null> {
        try {
            if (!componentInfo.className) {
                logger.warn(`No class name found for component: ${componentInfo.fileName}`);
                return null;
            }

            let componentClass: typeof Component | undefined;

            if (modulePathTransform) {
                const modulePath = modulePathTransform(componentInfo.path);

                try {
                    const module = await import(/* @vite-ignore */ modulePath);

                    componentClass = module[componentInfo.className] || module.default;

                    if (!componentClass) {
                        logger.warn(`Component class ${componentInfo.className} not found in module exports`);
                        logger.warn(`Available exports: ${Object.keys(module).join(', ')}`);
                    }
                } catch (error) {
                    logger.error(`Failed to import component module: ${modulePath}`, error);
                }
            }

            this.componentRegistry.register({
                name: componentInfo.className,
                type: componentClass as any,
                category: componentInfo.className.includes('Transform') ? 'Transform' :
                         componentInfo.className.includes('Render') || componentInfo.className.includes('Sprite') ? 'Rendering' :
                         componentInfo.className.includes('Physics') || componentInfo.className.includes('RigidBody') ? 'Physics' :
                         'Custom',
                description: `Component from ${componentInfo.fileName}`,
                metadata: {
                    path: componentInfo.path,
                    fileName: componentInfo.fileName
                }
            });

            const loadedInfo: LoadedComponentInfo = {
                fileInfo: componentInfo,
                componentClass: (componentClass || Component) as any,
                loadedAt: Date.now()
            };

            this.loadedComponents.set(componentInfo.path, loadedInfo);

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

        return true;
    }

    public clearLoadedComponents(): void {
        for (const [filePath] of this.loadedComponents) {
            this.unloadComponent(filePath);
        }
    }

    private convertToModulePath(filePath: string): string {
        return filePath;
    }

    public dispose(): void {
        this.clearLoadedComponents();
    }
}
