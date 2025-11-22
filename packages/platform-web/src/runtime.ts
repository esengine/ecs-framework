/**
 * Browser Runtime Entry Point
 * 浏览器运行时入口
 *
 * Uses the same Rust WASM engine as the editor
 * 使用与编辑器相同的 Rust WASM 引擎
 */

import { Core, Scene, SceneSerializer } from '@esengine/ecs-framework';
import { EngineBridge, EngineRenderSystem, CameraSystem } from '@esengine/ecs-engine-bindgen';
import { TransformComponent, SpriteComponent, CameraComponent } from '@esengine/ecs-components';
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

        // Add render system
        this.renderSystem = new EngineRenderSystem(this.bridge, TransformComponent);
        Core.scene!.addSystem(this.renderSystem);
    }

    async initialize(wasmModule: any): Promise<void> {
        await this.bridge.initializeWithModule(wasmModule);

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

            // Load textures for all sprites in the scene
            // 为场景中的所有精灵加载纹理
            await this.loadSceneTextures();
        } catch (error) {
            console.error('Failed to load scene:', error);
            throw error;
        }
    }

    /**
     * Load textures for all sprites in the scene
     * 为场景中的所有精灵加载纹理
     */
    private async loadSceneTextures(): Promise<void> {
        if (!Core.scene) return;

        // Find all sprites in the scene
        const sprites: Array<{ sprite: SpriteComponent, texturePath: string }> = [];

        for (const entity of Core.scene.entities.buffer) {
            const sprite = entity.getComponent(SpriteComponent);
            if (sprite && sprite.texture && sprite.texture !== '') {
                // Convert local file paths to server URLs
                // 将本地文件路径转换为服务器URL
                let texturePath = sprite.texture;

                // If it's an absolute local path, try to convert it to a relative URL
                // 如果是绝对本地路径，尝试转换为相对URL
                if (texturePath.includes(':\\') || texturePath.startsWith('/')) {
                    // Extract filename from path and serve from /assets directory
                    // TODO: Implement asset path mapping with configurable base URL
                    const filename = texturePath.split(/[\\\/]/).pop() || '';
                    texturePath = `/assets/${filename}`;
                }

                sprites.push({ sprite, texturePath });
            }
        }

        if (sprites.length === 0) {
            return;
        }

        // Load all textures in parallel
        const loadPromises = sprites.map(async ({ sprite, texturePath }) => {
            try {
                const textureId = await this.engineIntegration.loadTextureForComponent(texturePath);
                sprite.textureId = textureId;
            } catch (error) {
                console.error(`Failed to load texture ${texturePath}:`, error);
                // Set to 0 to use default white texture
                sprite.textureId = 0;
            }
        });

        await Promise.all(loadPromises);
    }

    start(): void {
        if (this.animationId !== null) return;

        const loop = () => {
            if (Core.scene) {
                Core.scene.update();
            }
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

    /**
     * Load texture for sprite
     * 为精灵加载纹理
     */
    async loadTextureForSprite(sprite: SpriteComponent, texturePath: string): Promise<void> {
        try {
            const textureId = await this.engineIntegration.loadTextureForComponent(texturePath);
            sprite.textureId = textureId;
        } catch (error) {
            console.error(`Failed to load texture ${texturePath}:`, error);
        }
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
    CameraComponent
};
