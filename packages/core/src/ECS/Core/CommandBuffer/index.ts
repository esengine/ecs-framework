/**
 * CommandBuffer 模块导出
 * 
 * 结构性命令缓冲系统，用于延迟和批处理ECS的结构性变更操作
 */

export { CommandBuffer } from './CommandBuffer';
export { SceneCommandBufferContext } from './SceneCommandBufferContext';
export { OpType } from './Types';
export type { 
    EntityId, 
    AddOp, 
    RemoveOp, 
    CreateOp, 
    DestroyOp, 
    Op, 
    ICommandBufferContext
} from './Types';
export type { CommandBufferStats } from './CommandBuffer';