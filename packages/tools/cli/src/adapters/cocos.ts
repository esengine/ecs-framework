import type { FileEntry, PlatformAdapter, ProjectConfig } from './types.js';

/**
 * @zh Cocos Creator 3.x 平台适配器
 * @en Cocos Creator 3.x platform adapter
 */
export const cocosAdapter: PlatformAdapter = {
    id: 'cocos',
    name: 'Cocos Creator 3.x',
    description: 'Generate ECS integration for Cocos Creator 3.x projects',

    getDependencies() {
        return {
            '@esengine/ecs-framework': 'latest',
            '@esengine/network': 'latest',
            '@esengine/rpc': 'latest'
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

        // 网络相关文件
        files.push({
            path: 'assets/scripts/ecs/network/NetworkManager.ts',
            content: generateNetworkManager()
        });

        files.push({
            path: 'assets/scripts/ecs/network/NetworkHandlers.ts',
            content: generateNetworkHandlers()
        });

        files.push({
            path: 'assets/scripts/ecs/README.md',
            content: generateReadme(config)
        });

        return files;
    }
};

function generateECSManager(config: ProjectConfig): string {
    return `import { _decorator, Component, director } from 'cc';
import { Core, Scene, type ICoreConfig } from '@esengine/ecs-framework';
import { MovementSystem } from './systems/MovementSystem';

const { ccclass, property } = _decorator;

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
 * ECS Manager - Bridge between Cocos Creator and ESEngine ECS
 *
 * Attach this component to a node in your scene.
 * All game logic should be implemented in ECS Systems.
 */
@ccclass('ECSManager')
export class ECSManager extends Component {
    /** @zh 调试模式 @en Debug mode */
    @property({ tooltip: 'Enable debug mode for ECS framework' })
    debug = false;

    /** @zh 跨场景保持 @en Keep across scenes */
    @property({ tooltip: 'Keep this node alive across scenes' })
    persistent = true;

    /** @zh 启用远程调试 @en Enable remote debugging */
    @property({ tooltip: 'Connect to ECS debugger via WebSocket' })
    remoteDebug = false;

    /** @zh WebSocket调试地址 @en WebSocket debug URL */
    @property({ tooltip: 'WebSocket URL for remote debugging' })
    debugUrl = 'ws://localhost:9229';

    /** @zh 自动重连 @en Auto reconnect */
    @property({ tooltip: 'Auto reconnect when connection lost' })
    autoReconnect = true;

    private static _instance: ECSManager | null = null;
    private _scene!: GameScene;

    static get instance() { return ECSManager._instance; }
    get scene() { return this._scene; }

    onLoad() {
        if (ECSManager._instance) {
            this.destroy();
            return;
        }
        ECSManager._instance = this;

        if (this.persistent) {
            director.addPersistRootNode(this.node);
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

This module integrates ESEngine ECS framework with Cocos Creator.

## Quick Start

1. Attach \`ECSManager\` component to a node in your scene
2. Create your own components in \`components/\` folder
3. Create your systems in \`systems/\` folder
4. Register systems in \`ECSManager.start()\`

## Creating Components

\`\`\`typescript
import { Component } from '@esengine/ecs-framework';

export class MyComponent extends Component {
    // Your data here
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

## Network

使用 \`NetworkManager\` 组件连接服务器：

\`\`\`typescript
import { NetworkManager } from './network/NetworkManager';

// 在某个节点上添加 NetworkManager 组件
// 设置 serverUrl 和 playerName
// 启用 autoConnect 自动连接
\`\`\`
`;
}

function generateNetworkManager(): string {
    return `import { _decorator, Component } from 'cc';
import { Core } from '@esengine/ecs-framework';
import { NetworkPlugin, type ConnectOptions } from '@esengine/network';
import { setupNetworkHandlers } from './NetworkHandlers';

const { ccclass, property } = _decorator;

/**
 * @zh 网络管理器组件
 * @en Network manager component
 *
 * @zh 添加到场景中的节点上，自动管理网络连接
 * @en Attach to a node in your scene to manage network connections
 */
@ccclass('NetworkManager')
export class NetworkManager extends Component {
    /** @zh 服务器地址 @en Server URL */
    @property({ tooltip: 'WebSocket server URL' })
    serverUrl = 'ws://localhost:3000';

    /** @zh 玩家名称 @en Player name */
    @property({ tooltip: 'Player name for joining' })
    playerName = 'Player';

    /** @zh 房间ID @en Room ID */
    @property({ tooltip: 'Room ID to join (optional)' })
    roomId = '';

    /** @zh 自动连接 @en Auto connect on start */
    @property({ tooltip: 'Connect automatically on start' })
    autoConnect = true;

    /** @zh 启用预测 @en Enable client prediction */
    @property({ tooltip: 'Enable client-side prediction' })
    enablePrediction = true;

    /** @zh 自动重连 @en Enable auto reconnect */
    @property({ tooltip: 'Auto reconnect on disconnect' })
    autoReconnect = true;

    private static _instance: NetworkManager | null = null;
    private _plugin!: NetworkPlugin;
    private _localPlayerId = 0;
    private _isConnected = false;

    static get instance() { return NetworkManager._instance; }
    get plugin() { return this._plugin; }
    get localPlayerId() { return this._localPlayerId; }
    get isConnected() { return this._isConnected; }

    onLoad() {
        if (NetworkManager._instance) {
            this.destroy();
            return;
        }
        NetworkManager._instance = this;

        this._plugin = new NetworkPlugin({
            enablePrediction: this.enablePrediction,
            enableAutoReconnect: this.autoReconnect,
            maxReconnectAttempts: 5,
            reconnectInterval: 2000,
        });
    }

    async start() {
        if (this.autoConnect) {
            await this.connect();
        }
    }

    /**
     * @zh 连接到服务器
     * @en Connect to server
     */
    async connect(): Promise<boolean> {
        try {
            await Core.installPlugin(this._plugin);
            setupNetworkHandlers(this._plugin);

            const options: ConnectOptions = {
                url: this.serverUrl,
                playerName: this.playerName,
                roomId: this.roomId || undefined,
                onConnect: () => {
                    console.log('[Network] Connected');
                    this._isConnected = true;
                },
                onDisconnect: (reason) => {
                    console.log('[Network] Disconnected:', reason);
                    this._isConnected = false;
                },
                onError: (error) => {
                    console.error('[Network] Error:', error);
                },
            };

            const success = await this._plugin.connect(options);
            if (success) {
                this._localPlayerId = this._plugin.localPlayerId;
                this._isConnected = true;
                console.log('[Network] Joined as player:', this._localPlayerId);
            }
            return success;
        } catch (error) {
            console.error('[Network] Connection failed:', error);
            return false;
        }
    }

    /**
     * @zh 断开连接
     * @en Disconnect from server
     */
    async disconnect(): Promise<void> {
        await this._plugin.disconnect();
        this._isConnected = false;
        this._localPlayerId = 0;
    }

    /**
     * @zh 发送移动输入
     * @en Send move input
     */
    sendMove(x: number, y: number): void {
        if (!this._isConnected) return;
        this._plugin.sendMoveInput(x, y);
    }

    /**
     * @zh 发送动作输入
     * @en Send action input
     */
    sendAction(action: string): void {
        if (!this._isConnected) return;
        this._plugin.sendActionInput(action);
    }

    onDestroy() {
        if (NetworkManager._instance === this) {
            NetworkManager._instance = null;
            this.disconnect();
        }
    }
}
`;
}

function generateNetworkHandlers(): string {
    return `import type { NetworkPlugin } from '@esengine/network';
import { PositionComponent } from '../components/PositionComponent';

/**
 * @zh 设置网络事件处理器
 * @en Setup network event handlers
 *
 * @zh 在这里注册预制体工厂和处理网络事件
 * @en Register prefab factories and handle network events here
 */
export function setupNetworkHandlers(plugin: NetworkPlugin): void {
    // 注册玩家预制体
    plugin.registerPrefab('player', (scene, spawn) => {
        const entity = scene.createEntity(\`Player_\${spawn.netId}\`);
        entity.addComponent(new PositionComponent(spawn.x ?? 0, spawn.y ?? 0));

        console.log('[Network] Player spawned:', spawn.netId);
        return entity;
    });

    // 注册 NPC 预制体
    plugin.registerPrefab('npc', (scene, spawn) => {
        const entity = scene.createEntity(\`NPC_\${spawn.netId}\`);
        entity.addComponent(new PositionComponent(spawn.x ?? 0, spawn.y ?? 0));

        console.log('[Network] NPC spawned:', spawn.netId);
        return entity;
    });

    // 在这里添加更多预制体...
}
`;
}
