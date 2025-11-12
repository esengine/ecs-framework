import { BehaviorTreePlugin } from './BehaviorTreePlugin';

export default new BehaviorTreePlugin();

export { BehaviorTreePlugin } from './BehaviorTreePlugin';
export { BehaviorTreeEditorPanel } from './components/panels/BehaviorTreeEditorPanel';
export * from './BehaviorTreeModule';
export * from './services/BehaviorTreeService';
export * from './providers/BehaviorTreeNodeInspectorProvider';

export * from './domain';
export * from './application/commands/tree';
export * from './application/use-cases';
export * from './application/services/BlackboardManager';
export * from './application/services/ExecutionController';
export * from './application/interfaces/IExecutionHooks';
export * from './application/state/BehaviorTreeDataStore';
export * from './hooks';
export * from './stores';
// Re-export specific items to avoid conflicts
export {
    EditorConfig
} from './types';
export * from './infrastructure/factories/NodeFactory';
export * from './infrastructure/serialization/BehaviorTreeSerializer';
export * from './infrastructure/validation/BehaviorTreeValidator';
export * from './infrastructure/events/EditorEventBus';
export * from './utils/BehaviorTreeExecutor';
export * from './utils/DOMCache';
export * from './utils/portUtils';
export * from './compiler/BehaviorTreeCompiler';
// Export everything except DEFAULT_EDITOR_CONFIG from editorConstants
export {
    ICON_MAP,
    ROOT_NODE_TEMPLATE,
    DEFAULT_EDITOR_CONFIG
} from './config/editorConstants';
export * from './interfaces/IEditorExtensions';
