/**
 * 工具模块导出
 */

export * from './Extensions';
export * from './Pool';
export * from './Emitter';
export * from './GlobalManager';
export * from './PerformanceMonitor';
export { Time } from './Time';

// WebAssembly核心模块
export { 
    WasmEcsCore, 
    ecsCore, 
    initializeEcs, 
    Query, 
    EntityId, 
    ComponentMask, 
    QueryResult,
    PerformanceStats as WasmPerformanceStats
} from './WasmCore'; 