/**
 * Browser Runtime Entry Point
 * 浏览器运行时入口
 */

import { Core, Scene, SceneSerializer } from '@esengine/ecs-framework';
import { EngineBridge } from '@esengine/ecs-engine-bindgen';
import { TransformComponent, SpriteComponent, SpriteAnimatorComponent, CameraComponent } from '@esengine/ecs-components';
import { AssetManager, EngineIntegration } from '@esengine/asset-system';
import { initializeRuntime, createRuntimeSystems, type RuntimeSystems } from './RuntimeSystems';

interface RuntimeConfig {
    canvasId: string;
    width?: number;
    height?: number;
}

class BrowserRuntime {
    private bridge: EngineBridge;
    private systems: RuntimeSystems | null = null;
    private animationId: number | null = null;
    private assetManager: AssetManager;
    private engineIntegration: EngineIntegration;
    private canvasId: string;

    constructor(config: RuntimeConfig) {
        this.canvasId = config.canvasId;
        if (!Core.Instance) {
            Core.create();
        }

        if (!Core.scene) {
            const runtimeScene = new Scene({ name: 'Runtime Scene' });
            Core.setScene(runtimeScene);
        }

        this.bridge = new EngineBridge({
            canvasId: config.canvasId,
            width: config.width || window.innerWidth,
            height: config.height || window.innerHeight
        });

        this.assetManager = new AssetManager();
        this.engineIntegration = new EngineIntegration(this.assetManager, this.bridge);
    }

    async initialize(wasmModule: any): Promise<void> {
        await this.bridge.initializeWithModule(wasmModule);

        this.bridge.setPathResolver((path: string) => {
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/asset?')) {
                return path;
            }
            return `/asset?path=${encodeURIComponent(path)}`;
        });

        this.bridge.setShowGrid(false);
        this.bridge.setShowGizmos(false);

        // 初始化模块系统
        await initializeRuntime(Core);

        // 创建运行时系统（传入 canvasId 用于 UI 输入绑定）
        this.systems = createRuntimeSystems(Core.scene!, this.bridge, {
            canvasId: this.canvasId
        });
    }

    async loadScene(sceneUrl: string): Promise<void> {
        const response = await fetch(sceneUrl);
        const sceneJson = await response.text();

        if (!Core.scene) {
            throw new Error('Core.scene not initialized');
        }

        SceneSerializer.deserialize(Core.scene, sceneJson, {
            strategy: 'replace',
            preserveIds: true
        });
    }

    start(): void {
        if (this.animationId !== null) return;

        let lastTime = performance.now();
        const loop = () => {
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            Core.update(deltaTime);

            this.animationId = requestAnimationFrame(loop);
        };

        loop();
    }

    stop(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    handleResize(width: number, height: number): void {
        this.bridge.resize(width, height);
    }

    getAssetManager(): AssetManager {
        return this.assetManager;
    }

    getEngineIntegration(): EngineIntegration {
        return this.engineIntegration;
    }

    getSystems(): RuntimeSystems | null {
        return this.systems;
    }
}

export default {
    create: (config: RuntimeConfig) => new BrowserRuntime(config),
    BrowserRuntime,
    Core,
    TransformComponent,
    SpriteComponent,
    SpriteAnimatorComponent,
    CameraComponent
};
