// ECS工具类导出
export { EntityList } from './EntityList';
export { EntityProcessorList } from './EntityProcessorList';
export { IdentifierPool } from './IdentifierPool';
export { Matcher } from './Matcher';
export { Bits } from './Bits';
export { ComponentTypeManager } from './ComponentTypeManager';

// 双轨制ID系统 - 现代高性能ECS的核心
export { 
    DualTrackIdSystem, 
    DualTrackIdUtils,
    CompressedEntityPool,
    EntityIdUtils,
    GlobalIdMapper,
    GlobalId,
    GlobalIdUtils
} from './DualTrackIdSystem';