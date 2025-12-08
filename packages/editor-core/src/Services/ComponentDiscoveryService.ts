import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';

const logger = createLogger('ComponentDiscoveryService');

export interface ComponentFileInfo {
    path: string;
    fileName: string;
    className: string | null;
}

export interface ComponentScanOptions {
    basePath: string;
    pattern: string;
    scanFunction: (path: string, pattern: string) => Promise<string[]>;
    readFunction: (path: string) => Promise<string>;
}

@Injectable()
export class ComponentDiscoveryService implements IService {
    private discoveredComponents: Map<string, ComponentFileInfo> = new Map();
    private messageHub: MessageHub;

    constructor(messageHub: MessageHub) {
        this.messageHub = messageHub;
    }

    public async scanComponents(options: ComponentScanOptions): Promise<ComponentFileInfo[]> {
        try {
            logger.info('Scanning for components', {
                basePath: options.basePath,
                pattern: options.pattern
            });

            const files = await options.scanFunction(options.basePath, options.pattern);
            logger.info(`Found ${files.length} component files`);

            const componentInfos: ComponentFileInfo[] = [];

            for (const filePath of files) {
                try {
                    const fileContent = await options.readFunction(filePath);
                    const componentInfo = this.parseComponentFile(filePath, fileContent);

                    if (componentInfo) {
                        componentInfos.push(componentInfo);
                        this.discoveredComponents.set(filePath, componentInfo);
                    }
                } catch (error) {
                    logger.warn(`Failed to parse component file: ${filePath}`, error);
                }
            }

            await this.messageHub.publish('components:discovered', {
                count: componentInfos.length,
                components: componentInfos
            });

            logger.info(`Successfully parsed ${componentInfos.length} components`);
            return componentInfos;
        } catch (error) {
            logger.error('Failed to scan components', error);
            throw error;
        }
    }

    public getDiscoveredComponents(): ComponentFileInfo[] {
        return Array.from(this.discoveredComponents.values());
    }

    public clearDiscoveredComponents(): void {
        this.discoveredComponents.clear();
        logger.info('Cleared discovered components');
    }

    private parseComponentFile(filePath: string, content: string): ComponentFileInfo | null {
        const fileName = filePath.split(/[\\/]/).pop() || '';

        const classMatch = content.match(/export\s+class\s+(\w+)\s+extends\s+Component/);

        if (classMatch) {
            const className = classMatch[1];
            logger.debug(`Found component class: ${className} in ${fileName}`);

            return {
                path: filePath,
                fileName,
                className
            };
        }

        logger.debug(`No valid component class found in ${fileName}`);
        return null;
    }

    public dispose(): void {
        this.discoveredComponents.clear();
        logger.info('ComponentDiscoveryService disposed');
    }
}
