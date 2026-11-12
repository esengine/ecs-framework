import type { FileEntry, PlatformAdapter, ProjectConfig } from './types.js';

/**
 * @zh Cocos Creator 2.x 平台适配器
 * @en Cocos Creator 2.x platform adapter
 */
export const cocos2Adapter: PlatformAdapter = {
    id: 'cocos2',
    name: 'Cocos Creator 2.x',
    description: 'Generate ECS integration for Cocos Creator 2.x projects',

    getDependencies() {
        return {
            '@esengine/ecs-framework': 'latest'
        };
    },

    getDevDependencies() {
        return {};
    },

    getScripts() {
        return {};
    },

    generateFiles(config: ProjectConfig): FileEntry[] {
        const files: FileEntry[] = [];

        files.push({
            path: 'assets/scripts/ecs/ECSManager.ts',
            content: generateECSManager(config)
        });

        files.push({
            path: 'assets/scripts/ecs/components/PositionComponent.ts',
            content: generatePositionComponent()
        });

        files.push({
            path: 'assets/scripts/ecs/systems/MovementSystem.ts',
            content: generateMovementSystem()
        });

        files.push({
            path: 'assets/scripts/ecs/README.md',
            content: generateReadme(config)
        });

        return files;
    }
};

function generateECSManager(config: ProjectConfig): string {
    return `import { Core, Scene, ICoreConfig } from '@esengine/ecs-framework';
import { MovementSystem } from './systems/MovementSystem';

const { ccclass, property } = cc._decorator;

/**
 * Game Scene - Define your game systems here
 */
class GameScene extends Scene {
    initialize(): void {
        this.name = '${config.name}';
        this.addSystem(new MovementSystem());
        // Add more systems here...
    }

    onStart(): void {
        // Create your initial entities here
    }
}

/**
 * ECS Manager - Bridge between Cocos Creator 2.x and ESEngine ECS
 *
 * Attach this component to a node in your scene.
 * All game logic should be implemented in ECS Systems.
 */
@ccclass
export default class ECSManager extends cc.Component {
    /** @zh 调试模式 @en Debug mode */
    @property({ tooltip: 'Enable debug mode for ECS framework' })
    debug: boolean = false;

    /** @zh 跨场景保持 @en Keep across scenes */
    @property({ tooltip: 'Keep this node alive across scenes' })
    persistent: boolean = true;

    /** @zh 启用远程调试 @en Enable remote debugging */
    @property({ tooltip: 'Connect to ECS debugger via WebSocket' })
    remoteDebug: boolean = false;

    /** @zh WebSocket调试地址 @en WebSocket debug URL */
    @property({ tooltip: 'WebSocket URL for remote debugging' })
    debugUrl: string = 'ws://localhost:9229';

    /** @zh 自动重连 @en Auto reconnect */
    @property({ tooltip: 'Auto reconnect when connection lost' })
    autoReconnect: boolean = true;

    private static _instance: ECSManager | null = null;
    private _scene!: GameScene;

    static get instance() { return ECSManager._instance; }
    get scene() { return this._scene; }

    onLoad() {
        if (ECSManager._instance) {
            this.node.destroy();
            return;
        }
        ECSManager._instance = this;

        if (this.persistent) {
            cc.game.addPersistRootNode(this.node);
        }

        const config: ICoreConfig = {
            debug: this.debug
        };

        // 配置远程调试
        if (this.remoteDebug && this.debugUrl) {
            config.debugConfig = {
                enabled: true,
                websocketUrl: this.debugUrl,
                autoReconnect: this.autoReconnect,
                channels: {
                    entities: true,
                    systems: true,
                    performance: true,
                    components: true,
                    scenes: true
                }
            };
        }

        Core.create(config);
        this._scene = new GameScene();
        Core.setScene(this._scene);
    }

    update(dt: number) {
        Core.update(dt);
    }

    onDestroy() {
        if (ECSManager._instance === this) {
            ECSManager._instance = null;
            Core.destroy();
        }
    }
}
`;
}

function generatePositionComponent(): string {
    return `import { Component, ECSComponent } from '@esengine/ecs-framework';

/**
 * Position component - stores entity position
 */
@ECSComponent('Position')
export class PositionComponent extends Component {
    x = 0;
    y = 0;

    constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}
`;
}

function generateMovementSystem(): string {
    return `import { EntitySystem, Matcher, Entity, Time, ECSSystem } from '@esengine/ecs-framework';
import { PositionComponent } from '../components/PositionComponent';

/**
 * Movement system - processes entities with PositionComponent
 *
 * Customize this system for your game logic.
 */
@ECSSystem('MovementSystem')
export class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(PositionComponent));
    }

    protected process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent)!;
            // Update position using Time.deltaTime
            // position.x += velocity.dx * Time.deltaTime;
        }
    }
}
`;
}

function generateReadme(config: ProjectConfig): string {
    return `# ${config.name} - ECS Module

This module integrates ESEngine ECS framework with Cocos Creator 2.x.

## Quick Start

1. Attach \`ECSManager\` component to a node in your scene
2. Create your own components in \`components/\` folder
3. Create your systems in \`systems/\` folder
4. Register systems in \`ECSManager.onLoad()\`

## Cocos Creator 2.x Notes

- Use \`cc._decorator\` for decorators
- Use \`cc.Component\` as base class
- Use \`cc.game.addPersistRootNode()\` for persistent nodes

## Creating Components

\`\`\`typescript
import { Component } from '@esengine/ecs-framework';

export class MyComponent extends Component {
    health: number = 100;

    reset() {
        this.health = 100;
    }
}
\`\`\`

## Creating Systems

\`\`\`typescript
import { EntitySystem, Matcher, Entity } from '@esengine/ecs-framework';
import { MyComponent } from '../components/MyComponent';

export class MySystem extends EntitySystem {
    constructor() {
        super(Matcher.all(MyComponent));
    }

    protected processEntity(entity: Entity, dt: number): void {
        const comp = entity.getComponent(MyComponent)!;
        // Process entity
    }
}
\`\`\`

## Documentation

- [ESEngine ECS Framework](https://github.com/esengine/ecs-framework)
- [Cocos Creator 2.x Docs](https://docs.cocos.com/creator/2.4/manual/)
`;
}
