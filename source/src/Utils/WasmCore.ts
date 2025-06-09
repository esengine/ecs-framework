/**
 * WASM ECS核心模块
 * 
 * 提供高性能的ECS操作，支持WASM和JavaScript双重实现
 */

export * from './Wasm';
export type Query = import('./Wasm').QueryResult; 