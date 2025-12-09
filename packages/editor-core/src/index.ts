/**
 * ECS Framework Editor Core
 *
 * Plugin-based editor framework for ECS Framework
 */

// 配置 | Configuration
export * from './Config';

// 新插件系统 | New plugin system
export * from './Plugin';

export * from './Services/UIRegistry';
export * from './Services/MessageHub';
export * from './Services/SerializerRegistry';
export * from './Services/EntityStoreService';
export * from './Services/ComponentRegistry';
export * from './Services/LocaleService';
export * from './Services/PropertyMetadata';
export * from './Services/ProjectService';
export * from './Services/ComponentDiscoveryService';
export * from './Services/LogService';
export * from './Services/SettingsRegistry';
export * from './Services/SceneManagerService';
export * from './Services/SceneTemplateRegistry';
export * from './Services/FileActionRegistry';
export * from './Services/EntityCreationRegistry';
export * from './Services/CompilerRegistry';
export * from './Services/ICompiler';
export * from './Services/ICommand';
export * from './Services/BaseCommand';
export * from './Services/CommandManager';
export * from './Services/IEditorDataStore';
export * from './Services/IFileSystem';
export * from './Services/IDialog';
export * from './Services/INotification';
export * from './Services/IInspectorProvider';
export * from './Services/InspectorRegistry';
export * from './Services/IPropertyRenderer';
export * from './Services/PropertyRendererRegistry';
export * from './Services/IFieldEditor';
export * from './Services/FieldEditorRegistry';
export * from './Services/ComponentInspectorRegistry';
export * from './Services/ComponentActionRegistry';
export * from './Services/AssetRegistryService';
export * from './Services/IViewportService';
export * from './Services/PreviewSceneService';
export * from './Services/EditorViewportService';

// Build System | 构建系统
export * from './Services/Build';

// User Code System | 用户代码系统
export * from './Services/UserCode';

// Module System | 模块系统
export * from './Services/Module';

export * from './Gizmos';
export * from './Rendering';

export * from './Module/IEventBus';
export * from './Module/ICommandRegistry';
export * from './Module/IPanelRegistry';
export * from './Module/IModuleContext';
export * from './Module/IEditorModule';

export * from './Types/IFileAPI';
export * from './Types/UITypes';
