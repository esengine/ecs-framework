export * from './Extensions';
export * from './Pool';
export * from './Emitter';
export * from './GlobalManager';
export * from './PerformanceMonitor';
export { Time } from './Time';
export { 
    WasmEcsCore, 
    ecsCore, 
    initializeEcs, 
    EntityId, 
    ComponentMask, 
    QueryResult,
    PerformanceStats as WasmPerformanceStats,
    WasmLoader,
    JavaScriptFallback
} from './Wasm'; 