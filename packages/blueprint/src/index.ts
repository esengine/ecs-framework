/**
 * @esengine/blueprint - Visual scripting system for ECS Framework
 * 蓝图可视化脚本系统
 */

// Types
export * from './types';

// Runtime
export * from './runtime';

// Nodes (import to register)
import './nodes';

// Re-export commonly used items
export { NodeRegistry, RegisterNode } from './runtime/NodeRegistry';
export { BlueprintVM } from './runtime/BlueprintVM';
export {
    createBlueprintComponentData,
    initializeBlueprintVM,
    startBlueprint,
    stopBlueprint,
    tickBlueprint,
    cleanupBlueprint
} from './runtime/BlueprintComponent';
export {
    createBlueprintSystem,
    triggerBlueprintEvent,
    triggerCustomBlueprintEvent
} from './runtime/BlueprintSystem';
export { createEmptyBlueprint, validateBlueprintAsset } from './types/blueprint';
