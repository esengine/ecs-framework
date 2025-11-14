import 'reflect-metadata';
import { Core } from '@esengine/ecs-framework';
import { singleton } from 'tsyringe';
import { DIContainer, globalContainer } from '../di/DIContainer';
import { EditorEventBus } from '../events/EditorEventBus';
import { CommandRegistry } from '../commands/CommandRegistry';
import { PanelRegistry } from '../commands/PanelRegistry';

export interface EditorContext {
    container: DIContainer;
    eventBus: EditorEventBus;
    commands: CommandRegistry;
    panels: PanelRegistry;
    scene: Core;
}

@singleton()
export class EditorBootstrap {
    private initialized = false;

    async initialize(): Promise<EditorContext> {
        if (this.initialized) {
            throw new Error('EditorBootstrap has already been initialized');
        }

        console.log('[EditorBootstrap] Starting editor initialization...');

        const scene = await this.createScene();
        console.log('[EditorBootstrap] Scene created');

        const container = globalContainer;

        const eventBus = container.resolve(EditorEventBus);
        console.log('[EditorBootstrap] EventBus initialized');

        const commands = container.resolve(CommandRegistry);
        console.log('[EditorBootstrap] CommandRegistry initialized');

        const panels = container.resolve(PanelRegistry);
        console.log('[EditorBootstrap] PanelRegistry initialized');

        this.initialized = true;
        console.log('[EditorBootstrap] Editor initialized successfully');

        return {
            container,
            eventBus,
            commands,
            panels,
            scene
        };
    }

    private async createScene(): Promise<Core> {
        const scene = await Core.create();
        return scene;
    }
}
