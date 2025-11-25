import 'reflect-metadata';

// =============================================================================
// React
// =============================================================================
import * as React from 'react';
import * as ReactDOM from 'react-dom';
export { React, ReactDOM };

export {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    useContext,
    useReducer,
    useLayoutEffect,
    useImperativeHandle,
    useDebugValue,
    useDeferredValue,
    useTransition,
    useId,
    useSyncExternalStore,
    useInsertionEffect,
    createContext,
    forwardRef,
    memo,
    lazy,
    Suspense,
    Fragment,
    StrictMode,
    createElement,
    cloneElement,
    isValidElement,
    Children,
    createRef,
    Component as ReactComponent,
    PureComponent
} from 'react';

export type {
    FC,
    ReactNode,
    ReactElement,
    ComponentType,
    ComponentProps,
    PropsWithChildren,
    RefObject,
    MutableRefObject,
    Dispatch,
    SetStateAction,
    CSSProperties,
    MouseEvent,
    KeyboardEvent,
    ChangeEvent,
    FormEvent,
    FocusEvent,
    DragEvent
} from 'react';

// =============================================================================
// State Management
// =============================================================================
export { create as createStore } from 'zustand';
export type { StoreApi, UseBoundStore } from 'zustand';

// =============================================================================
// Dependency Injection
// =============================================================================
export { container, injectable, singleton, inject } from 'tsyringe';
export type { DependencyContainer } from 'tsyringe';

// =============================================================================
// ECS Framework Core
// =============================================================================
export * from '@esengine/ecs-framework';

// =============================================================================
// Editor Core
// Rename conflicting exports to avoid collision with ecs-framework
// =============================================================================
export {
    ComponentRegistry as EditorComponentRegistry,
} from '@esengine/editor-core';

export type {
    IEventBus as IEditorEventBus,
    PluginState as EditorPluginState,
    PropertyControl as EditorPropertyControl,
    PropertyType as EditorPropertyType,
} from '@esengine/editor-core';

// Runtime exports from editor-core
export {
    // Enums
    EditorPluginCategory,
    PanelPosition,
    UIExtensionType,

    // Classes
    EditorPluginManager,
    PluginRegistry,
    pluginRegistry,
    UIRegistry,
    MessageHub,
    SerializerRegistry,
    EntityStoreService,
    LocaleService,
    ProjectService,
    ComponentDiscoveryService,
    LogService,
    SettingsRegistry,
    SceneManagerService,
    FileActionRegistry,
    EntityCreationRegistry,
    CompilerRegistry,
    CommandManager,
    InspectorRegistry,
    PropertyRendererRegistry,
    FieldEditorRegistry,
    ComponentActionRegistry,
    BaseCommand,
    PropertyMetadataService,

    // Gizmo exports
    GizmoRegistry,
    GizmoColors,
    hasGizmoProvider,
    hexToGizmoColor,
    isGizmoProviderRegistered,

    // Symbols (用于跨包插件访问)
    IFileSystemService,
    IDialogService,
    IMessageHub,
    ICompilerRegistry,
    IInspectorRegistry,
} from '@esengine/editor-core';

// Type-only exports from editor-core
export type {
    // Plugin types
    IEditorPlugin,
    IEditorPluginMetadata,
    ISerializer,
    FileContextMenuItem,
    FileCreationTemplate,
    FileActionHandler,
    EditorPluginDefinition,
    RegisteredPlugin,
    MenuTreeNode,
    ComponentRegistration,
    MenuItemRegistration,
    PanelRegistration,
    ToolbarItemRegistration,
    EntityTemplateRegistration,
    AssetHandlerRegistration,
    ComponentActionDefinition,

    // Service interfaces
    IFileSystem,
    FileEntry,
    IDialog,
    INotification,
    IInspectorProvider,
    InspectorContext,
    IPropertyRenderer,
    IFieldEditor,
    FieldEditorContext,
    ICompiler,
    CompileResult,
    CompilerContext,
    ICommand,
    IEditorDataStore,

    // Module interfaces
    ICommandRegistry,
    IPanelRegistry,
    IModuleContext,
    IEditorModule,
    Unsubscribe,

    // Gizmo types
    GizmoType,
    GizmoColor,
    IRectGizmoData,
    ICircleGizmoData,
    ILineGizmoData,
    IGridGizmoData,
    IGizmoRenderData,
    IGizmoProvider,
    GizmoProviderFn,

    // UI types
    MenuItem,
    ToolbarItem,
    PanelDescriptor,
    EntityCreationTemplate,
    IFileAPI,
    PropertyMetadata,
} from '@esengine/editor-core';


// =============================================================================
// Tauri API
// =============================================================================
export { invoke, convertFileSrc } from '@tauri-apps/api/core';
export { open, save, message, ask, confirm } from '@tauri-apps/plugin-dialog';
export {
    readTextFile,
    writeTextFile,
    readDir,
    exists,
    mkdir,
    remove,
    rename,
    copyFile
} from '@tauri-apps/plugin-fs';

// =============================================================================
// Icons (Lucide React)
// =============================================================================
import * as Icons from 'lucide-react';
export { Icons };
export type { LucideIcon } from 'lucide-react';

// =============================================================================
// SDK Metadata
// =============================================================================
export const SDK_VERSION = '1.0.0';
export const SDK_NAME = '@esengine/editor-runtime';
