import type { IScene, ServiceContainer } from '@esengine/esengine';
import { ComponentRegistry } from '@esengine/esengine';
import type { IRuntimeModule, SystemContext } from '@esengine/engine-core';
import { ChunkComponent } from './components/ChunkComponent';
import { StreamingAnchorComponent } from './components/StreamingAnchorComponent';
import { ChunkLoaderComponent } from './components/ChunkLoaderComponent';
import { ChunkStreamingSystem } from './systems/ChunkStreamingSystem';
import { ChunkCullingSystem } from './systems/ChunkCullingSystem';
import { ChunkManager } from './services/ChunkManager';

/**
 * 世界流式加载模块
 *
 * Runtime module for world streaming functionality.
 *
 * 提供世界流式加载功能的运行时模块。
 */
export class WorldStreamingModule implements IRuntimeModule {
    private _chunkManager: ChunkManager | null = null;

    get chunkManager(): ChunkManager | null {
        return this._chunkManager;
    }

    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(ChunkComponent);
        registry.register(StreamingAnchorComponent);
        registry.register(ChunkLoaderComponent);
    }

    registerServices(services: ServiceContainer): void {
        this._chunkManager = new ChunkManager();
        services.registerInstance(ChunkManager, this._chunkManager);
    }

    createSystems(scene: IScene, _context: SystemContext): void {
        const streamingSystem = new ChunkStreamingSystem();
        if (this._chunkManager) {
            streamingSystem.setChunkManager(this._chunkManager);
        }
        scene.addSystem(streamingSystem);
        scene.addSystem(new ChunkCullingSystem());
    }

    onSystemsCreated(_scene: IScene, _context: SystemContext): void {
        // No post-creation setup needed
    }
}

export const worldStreamingModule = new WorldStreamingModule();
