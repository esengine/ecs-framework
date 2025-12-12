/**
 * 状态管理模块导出
 * State management module exports
 */

export { useEditorStore, selectProjectState, selectPanelState, selectUIState } from './EditorStore';
export type { EditorState, ProjectState, PanelState, UIState, CompilerDialogState, EditorActions } from './EditorStore';

export {
    useHierarchyStore,
    selectSceneInfo,
    selectPrefabEditMode,
    selectSelectedIds,
    selectFirstSelectedId,
    selectExpandedIds,
    selectIsRemoteConnected,
    selectRemoteEntities
} from './HierarchyStore';
export type { HierarchyStore, HierarchyState, HierarchyActions, SceneInfo, PrefabEditModeState } from './HierarchyStore';

export {
    useInspectorStore,
    selectTarget,
    selectTargetType,
    selectIsLocked,
    selectComponentVersion
} from './InspectorStore';
export type { InspectorStore, InspectorState, InspectorActions } from './InspectorStore';

// Re-export dialog store from managers for convenience
export { useDialogStore } from '../app/managers/DialogManager';
