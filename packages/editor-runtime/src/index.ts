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
    PanelPosition,
    UIExtensionType,

    // Classes
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

    // Plugin system
    PluginManager,

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
    ISerializer,
    FileCreationTemplate,
    FileActionHandler,
    RegisteredPlugin,
    PluginConfig,
    PluginCategory,
    LoadingPhase,
    ModuleType,
    ModuleDescriptor,
    PluginDependency,
    PluginState,

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
    GizmoProviderRegistration,

    // UI types
    MenuItem,
    ToolbarItem,
    PanelDescriptor,
    EntityCreationTemplate,
    IFileAPI,
    PropertyMetadata,
    MenuItemDescriptor,
    ToolbarItemDescriptor,
    ComponentAction,

    // Plugin system types
    IPluginLoader,
    IRuntimeModuleLoader,
    IEditorModuleLoader,
    PluginDescriptor,
    SystemContext,
    ComponentInspectorProviderDef,
} from '@esengine/editor-core';


// =============================================================================
// Tauri API (低级 API，建议使用 FileSystem 封装)
// =============================================================================
export { invoke, convertFileSrc } from '@tauri-apps/api/core';
export { open, save, message, ask, confirm } from '@tauri-apps/plugin-dialog';
// 注意：以下 API 可能有权限问题，建议使用 FileSystem 替代
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
// FileSystem API (推荐使用)
// 通过后端命令实现，避免前端权限问题
// =============================================================================
export { FileSystem, type DirectoryEntry } from './FileSystem';

// =============================================================================
// Icons (Lucide React)
// =============================================================================
import * as Icons from 'lucide-react';
export { Icons };
export type { LucideIcon } from 'lucide-react';

// =============================================================================
// Plugin API
// =============================================================================
export { PluginAPI } from './PluginAPI';

// =============================================================================
// UI System
// =============================================================================
export {
    // Components - Core
    UITransformComponent,
    AnchorPreset,
    UIRenderComponent,
    UIRenderType,
    UIInteractableComponent,
    UITextComponent,
    UILayoutComponent,
    UILayoutType,
    UIJustifyContent,
    UIAlignItems,
    // Components - Widgets
    UIButtonComponent,
    UIProgressBarComponent,
    UIProgressDirection,
    UIProgressFillMode,
    UISliderComponent,
    UISliderOrientation,
    UIScrollViewComponent,
    UIScrollbarVisibility,
    // Systems - Core
    UILayoutSystem,
    UIInputSystem,
    MouseButton,
    UIAnimationSystem,
    Easing,
    UIRenderDataProvider,
    // Systems - Render
    UIRenderCollector,
    getUIRenderCollector,
    resetUIRenderCollector,
    invalidateUIRenderCaches,
    UIRenderBeginSystem,
    UIRectRenderSystem,
    UITextRenderSystem,
    UIButtonRenderSystem,
    UIProgressBarRenderSystem,
    UISliderRenderSystem,
    UIScrollViewRenderSystem,
    // Rendering
    WebGLUIRenderer,
    TextRenderer,
    // Builder API
    UIBuilder,
    // Plugin
    UIPlugin,
    UIRuntimeModule,
} from '@esengine/ui';

export type {
    // Types from UI
    UIBorderStyle,
    UIShadowStyle,
    UICursorType,
    UITextAlign,
    UITextVerticalAlign,
    UITextOverflow,
    UIFontWeight,
    UIPadding,
    UIButtonStyle,
    UIButtonDisplayMode,
    UIInputEvent,
    EasingFunction,
    EasingName,
    UIRenderPrimitive,
    ProviderRenderData as UIProviderRenderData,
    IRenderDataProvider as UIIRenderDataProvider,
    IUIRenderDataProvider,
    TextMeasurement,
    TextRenderOptions,
    UIBaseConfig,
    UIButtonConfig,
    UITextConfig,
    UIImageConfig,
    UIProgressBarConfig,
    UISliderConfig,
    UIPanelConfig,
    UIScrollViewConfig,
} from '@esengine/ui';

// =============================================================================
// SDK Metadata
// =============================================================================
export const SDK_VERSION = '1.0.0';
export const SDK_NAME = '@esengine/editor-runtime';
