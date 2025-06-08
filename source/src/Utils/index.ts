/**
 * 工具模块导出
 */

export * from './Extensions';
export * from './Pool';
export * from './Emitter';
export * from './GlobalManager';
export * from './PerformanceMonitor';
export { Time } from './Time';
/**
 * WebAssembly核心模块
 * 提供高性能的ECS查询和计算功能
 */
export { 
    WasmEcsCore, 
    ecsCore, 
    initializeEcs, 
    Query, 
    EntityId, 
    ComponentMask, 
    QueryResult,
    PerformanceStats
} from './WasmCore'; 