/**
 * @esengine/world-streaming
 *
 * World streaming and chunk management system for open world games.
 *
 * 世界流式加载和区块管理系统，用于开放世界游戏。
 */

// Types
export {
    EChunkState,
    EChunkPriority,
    DEFAULT_STREAMING_CONFIG
} from './types';

export type {
    IChunkCoord,
    IChunkBounds,
    IChunkData,
    ISerializedEntity,
    IChunkInfo,
    IChunkLoadRequest,
    IStreamingConfig
} from './types';

// Components
export {
    ChunkComponent,
    StreamingAnchorComponent,
    ChunkLoaderComponent
} from './components';

// Systems
export {
    ChunkStreamingSystem,
    ChunkCullingSystem
} from './systems';

// Services
export {
    SpatialHashGrid,
    ChunkSerializer,
    ChunkManager
} from './services';

export type {
    IChunkSerializer,
    IChunkDataProvider,
    IChunkManagerEvents
} from './services';

// Module
export { WorldStreamingModule, worldStreamingModule } from './WorldStreamingModule';
