/**
 * Browser Runtime Entry Point
 * 浏览器运行时入口
 *
 * Uses the same Rust WASM engine as the editor
 * 使用与编辑器相同的 Rust WASM 引擎
 */

import { Core, Scene, SceneSerializer } from '@esengine/ecs-framework';
import { EngineBridge, EngineRenderSystem, CameraSystem } from '@esengine/ecs-engine-bindgen';
import { TransformComponent, SpriteComponent, SpriteAnimatorComponent, SpriteAnimatorSystem, CameraComponent } from '@esengine/ecs-components';
import { AssetManager, EngineIntegration, AssetPathResolver, AssetPlatform } from '@esengine/asset-system';

interface RuntimeConfig {
    canvasId: string;
    width?: number;
    height?: number;
}

class BrowserRuntime {
    private bridge: EngineBridge;
    private cameraSystem: CameraSystem;
    private renderSystem: EngineRenderSystem;
    private animatorSystem: SpriteAnimatorSystem;
    private animationId: number | null = null;
    private assetManager: AssetManager;
    private engineIntegration: EngineIntegration;

    constructor(config: RuntimeConfig) {
        // Initialize Core if not already created
        if (!Core.Instance) {
            Core.create();
        }

        // Initialize Core.scene if not already initialized
        if (!Core.scene) {
            const runtimeScene = new Scene({ name: 'Runtime Scene' });
            Core.setScene(runtimeScene);
        }

        // Initialize Rust WASM engine bridge
        this.bridge = new EngineBridge({
            canvasId: config.canvasId,
            width: config.width || window.innerWidth,
            height: config.height || window.innerHeight
        });

        // Initialize asset system
        // 初始化资产系统
        this.assetManager = new AssetManager();
        this.engineIntegration = new EngineIntegration(this.assetManager, this.bridge);

        // Add camera system (updates before render)
        this.cameraSystem = new CameraSystem(this.bridge);
        Core.scene!.addSystem(this.cameraSystem);

        // Add sprite animator system
        this.animatorSystem = new SpriteAnimatorSystem();
        Core.scene!.addSystem(this.animatorSystem);

        // Add render system
        this.renderSystem = new EngineRenderSystem(this.bridge, TransformComponent);
        Core.scene!.addSystem(this.renderSystem);
    }

    async initialize(wasmModule: any): Promise<void> {
        await this.bridge.initializeWithModule(wasmModule);

        // Set path resolver for browser asset proxy
        // 设置浏览器资产代理的路径解析器
        this.bridge.setPathResolver((path: string) => {
            // If already a URL, return as-is
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/asset?')) {
                return path;
            }
            // Use asset proxy endpoint for local file paths
            return `/asset?path=${encodeURIComponent(path)}`;
        });

        // Disable editor tools for game runtime
        this.bridge.setShowGrid(false);
        this.bridge.setShowGizmos(false);
    }

    async loadScene(sceneUrl: string): Promise<void> {
        try {
            const response = await fetch(sceneUrl);
            const sceneJson = await response.text();

            if (!Core.scene) {
                throw new Error('Core.scene not initialized');
            }

            SceneSerializer.deserialize(Core.scene, sceneJson, {
                strategy: 'replace',
                preserveIds: true
            });

            // Textures are now loaded automatically by EngineRenderSystem
            // via Rust engine's path-based texture loading
            // 纹理现在由EngineRenderSystem通过Rust引擎的路径加载自动处理

            // Auto-play animations are started by SpriteAnimatorSystem.onAdded
            // 自动播放动画由SpriteAnimatorSystem.onAdded启动
        } catch (error) {
            console.error('Failed to load scene:', error);
            throw error;
        }
    }

    start(): void {
        if (this.animationId !== null) return;

        let lastTime = performance.now();
        const loop = () => {
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Update Core (includes Time.update and all scenes)
            // Texture loading is handled automatically by EngineRenderSystem
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
}

// Export everything on a single object for IIFE bundle
export default {
    create: (config: RuntimeConfig) => {
        const runtime = new BrowserRuntime(config);
        return runtime;
    },
    BrowserRuntime,
    Core,
    TransformComponent,
    SpriteComponent,
    SpriteAnimatorComponent,
    CameraComponent
};
