import { Core, ComponentRegistry as CoreComponentRegistry } from '@esengine/ecs-framework';
import { invoke } from '@tauri-apps/api/core';
import {
    UIRegistry,
    MessageHub,
    IMessageHub,
    SerializerRegistry,
    EntityStoreService,
    ComponentRegistry,
    ProjectService,
    ComponentDiscoveryService,
    PropertyMetadataService,
    LogService,
    SettingsRegistry,
    SceneManagerService,
    SceneTemplateRegistry,
    FileActionRegistry,
    IFileActionRegistry,
    EntityCreationRegistry,
    PluginManager,
    IPluginManager,
    InspectorRegistry,
    IInspectorRegistry,
    PropertyRendererRegistry,
    FieldEditorRegistry,
    ComponentActionRegistry,
    ComponentInspectorRegistry,
    IDialogService,
    IFileSystemService,
    CompilerRegistry,
    ICompilerRegistry,
    IViewportService_ID,
    IPreviewSceneService,
    IEditorViewportServiceIdentifier,
    PreviewSceneService,
    EditorViewportService,
    BuildService,
    WebBuildPipeline,
    WeChatBuildPipeline,
    moduleRegistry,
    UserCodeService,
    UserCodeTarget,
    type HotReloadEvent
} from '@esengine/editor-core';
import { ViewportService } from '../../services/ViewportService';
import { TransformComponent } from '@esengine/engine-core';
import { SpriteComponent, SpriteAnimatorComponent } from '@esengine/sprite';
import { CameraComponent } from '@esengine/camera';
import { AudioSourceComponent } from '@esengine/audio';
import { UITextComponent } from '@esengine/ui';
import { BehaviorTreeRuntimeComponent } from '@esengine/behavior-tree';
import { TauriFileAPI } from '../../adapters/TauriFileAPI';
import { DIContainer } from '../../core/di/DIContainer';
import { TypedEventBus } from '../../core/events/TypedEventBus';
import { CommandRegistry } from '../../core/commands/CommandRegistry';
import { PanelRegistry } from '../../core/commands/PanelRegistry';
import type { EditorEventMap } from '../../core/events/EditorEventMap';
import { TauriFileSystemService } from '../../services/TauriFileSystemService';
import { TauriDialogService } from '../../services/TauriDialogService';
import { NotificationService } from '../../services/NotificationService';
import {
    StringRenderer,
    NumberRenderer,
    BooleanRenderer,
    NullRenderer,
    Vector2Renderer,
    Vector3Renderer,
    ColorRenderer,
    ComponentRenderer,
    ArrayRenderer,
    FallbackRenderer
} from '../../infrastructure/property-renderers';
import {
    AssetFieldEditor,
    Vector2FieldEditor,
    Vector3FieldEditor,
    Vector4FieldEditor,
    ColorFieldEditor,
    AnimationClipsFieldEditor
} from '../../infrastructure/field-editors';
import { TransformComponentInspector } from '../../components/inspectors/component-inspectors/TransformComponentInspector';
import { buildFileSystem } from '../../services/BuildFileSystemService';
import { TauriModuleFileSystem } from '../../services/TauriModuleFileSystem';
import { PluginSDKRegistry } from '../../services/PluginSDKRegistry';

export interface EditorServices {
    uiRegistry: UIRegistry;
    messageHub: MessageHub;
    serializerRegistry: SerializerRegistry;
    entityStore: EntityStoreService;
    componentRegistry: ComponentRegistry;
    projectService: ProjectService;
    componentDiscovery: ComponentDiscoveryService;
    propertyMetadata: PropertyMetadataService;
    logService: LogService;
    settingsRegistry: SettingsRegistry;
    sceneManager: SceneManagerService;
    fileActionRegistry: FileActionRegistry;
    pluginManager: PluginManager;
    diContainer: DIContainer;
    eventBus: TypedEventBus<EditorEventMap>;
    commandRegistry: CommandRegistry;
    panelRegistry: PanelRegistry;
    fileSystem: TauriFileSystemService;
    dialog: TauriDialogService;
    notification: NotificationService;
    inspectorRegistry: InspectorRegistry;
    propertyRendererRegistry: PropertyRendererRegistry;
    fieldEditorRegistry: FieldEditorRegistry;
    buildService: BuildService;
    userCodeService: UserCodeService;
}

export class ServiceRegistry {
    registerAllServices(coreInstance: Core): EditorServices {
        const fileAPI = new TauriFileAPI();

        const uiRegistry = new UIRegistry();
        const messageHub = new MessageHub();
        const serializerRegistry = new SerializerRegistry();
        const entityStore = new EntityStoreService(messageHub);
        const componentRegistry = new ComponentRegistry();

        // 注册标准组件到编辑器和核心注册表
        // Register to both editor registry (for UI) and core registry (for serialization)
        const standardComponents = [
            { name: 'TransformComponent', type: TransformComponent, editorName: 'Transform', category: 'components.category.core', description: 'components.transform.description', icon: 'Move3d' },
            { name: 'SpriteComponent', type: SpriteComponent, editorName: 'Sprite', category: 'components.category.rendering', description: 'components.sprite.description', icon: 'Image' },
            { name: 'SpriteAnimatorComponent', type: SpriteAnimatorComponent, editorName: 'SpriteAnimator', category: 'components.category.rendering', description: 'components.spriteAnimator.description', icon: 'Film' },
            { name: 'UITextComponent', type: UITextComponent, editorName: 'UIText', category: 'components.category.ui', description: 'components.text.description', icon: 'Type' },
            { name: 'CameraComponent', type: CameraComponent, editorName: 'Camera', category: 'components.category.rendering', description: 'components.camera.description', icon: 'Camera' },
            { name: 'AudioSourceComponent', type: AudioSourceComponent, editorName: 'AudioSource', category: 'components.category.audio', description: 'components.audioSource.description', icon: 'Volume2' },
            { name: 'BehaviorTreeRuntimeComponent', type: BehaviorTreeRuntimeComponent, editorName: 'BehaviorTreeRuntime', category: 'components.category.ai', description: 'components.behaviorTreeRuntime.description', icon: 'GitBranch' }
        ];

        for (const comp of standardComponents) {
            // Register to editor registry for UI
            componentRegistry.register({
                name: comp.editorName,
                type: comp.type,
                category: comp.category,
                description: comp.description,
                icon: comp.icon
            });

            // Register to core registry for serialization/deserialization
            CoreComponentRegistry.register(comp.type as any);
        }

        // Enable hot reload for editor environment
        // 在编辑器环境中启用热更新
        CoreComponentRegistry.enableHotReload();

        const projectService = new ProjectService(messageHub, fileAPI);
        const componentDiscovery = new ComponentDiscoveryService(messageHub);
        const propertyMetadata = new PropertyMetadataService();
        const logService = new LogService();
        const settingsRegistry = new SettingsRegistry();
        const sceneManager = new SceneManagerService(messageHub, fileAPI, projectService, entityStore);
        const fileActionRegistry = new FileActionRegistry();
        const entityCreationRegistry = new EntityCreationRegistry();
        const componentActionRegistry = new ComponentActionRegistry();
        const componentInspectorRegistry = new ComponentInspectorRegistry();

        Core.services.registerInstance(UIRegistry, uiRegistry);
        Core.services.registerInstance(MessageHub, messageHub);
        Core.services.registerInstance(IMessageHub, messageHub);  // Symbol 注册用于跨包插件访问
        Core.services.registerInstance(SerializerRegistry, serializerRegistry);
        Core.services.registerInstance(EntityStoreService, entityStore);
        Core.services.registerInstance(ComponentRegistry, componentRegistry);
        Core.services.registerInstance(ProjectService, projectService);
        Core.services.registerInstance(ComponentDiscoveryService, componentDiscovery);
        Core.services.registerInstance(PropertyMetadataService, propertyMetadata);
        Core.services.registerInstance(LogService, logService);
        Core.services.registerInstance(SettingsRegistry, settingsRegistry);
        Core.services.registerInstance(SceneManagerService, sceneManager);
        Core.services.registerInstance(FileActionRegistry, fileActionRegistry);
        Core.services.registerInstance(IFileActionRegistry, fileActionRegistry);  // Symbol 注册用于跨包插件访问
        Core.services.registerInstance(EntityCreationRegistry, entityCreationRegistry);
        Core.services.registerInstance(ComponentActionRegistry, componentActionRegistry);
        Core.services.registerInstance(ComponentInspectorRegistry, componentInspectorRegistry);

        const pluginManager = new PluginManager();
        Core.services.registerInstance(IPluginManager, pluginManager);

        const diContainer = new DIContainer();
        const eventBus = new TypedEventBus<EditorEventMap>();
        const commandRegistry = new CommandRegistry();
        const panelRegistry = new PanelRegistry();

        const fileSystem = new TauriFileSystemService();
        const dialog = new TauriDialogService();
        const notification = new NotificationService();
        Core.services.registerInstance(NotificationService, notification);
        Core.services.registerInstance(IDialogService, dialog);
        Core.services.registerInstance(IFileSystemService, fileSystem);

        // Register viewport service for editor panels
        // 注册视口服务供编辑器面板使用
        const viewportService = ViewportService.getInstance();
        Core.services.registerInstance(IViewportService_ID, viewportService);

        // Register preview scene service for isolated preview scenes
        // 注册预览场景服务，用于隔离的预览场景
        const previewSceneService = PreviewSceneService.getInstance();
        Core.services.registerInstance(IPreviewSceneService, previewSceneService);

        // Register editor viewport service for coordinating viewports with overlays
        // 注册编辑器视口服务，协调带有覆盖层的视口
        const editorViewportService = EditorViewportService.getInstance();
        editorViewportService.setViewportService(viewportService);
        Core.services.registerInstance(IEditorViewportServiceIdentifier, editorViewportService);

        const inspectorRegistry = new InspectorRegistry();
        Core.services.registerInstance(InspectorRegistry, inspectorRegistry);
        Core.services.registerInstance(IInspectorRegistry, inspectorRegistry);  // Symbol 注册用于跨包插件访问

        const propertyRendererRegistry = new PropertyRendererRegistry();
        Core.services.registerInstance(PropertyRendererRegistry, propertyRendererRegistry);

        propertyRendererRegistry.register(new StringRenderer());
        propertyRendererRegistry.register(new NumberRenderer());
        propertyRendererRegistry.register(new BooleanRenderer());
        propertyRendererRegistry.register(new NullRenderer());
        propertyRendererRegistry.register(new Vector2Renderer());
        propertyRendererRegistry.register(new Vector3Renderer());
        propertyRendererRegistry.register(new ColorRenderer());
        propertyRendererRegistry.register(new ComponentRenderer());
        propertyRendererRegistry.register(new ArrayRenderer());
        propertyRendererRegistry.register(new FallbackRenderer());

        const fieldEditorRegistry = new FieldEditorRegistry();
        Core.services.registerInstance(FieldEditorRegistry, fieldEditorRegistry);

        fieldEditorRegistry.register(new AssetFieldEditor());
        fieldEditorRegistry.register(new Vector2FieldEditor());
        fieldEditorRegistry.register(new Vector3FieldEditor());
        fieldEditorRegistry.register(new Vector4FieldEditor());
        fieldEditorRegistry.register(new ColorFieldEditor());
        fieldEditorRegistry.register(new AnimationClipsFieldEditor());

        // 注册组件检查器
        // Register component inspectors
        componentInspectorRegistry.register(new TransformComponentInspector());

        // 注册构建服务
        // Register build service
        const buildService = new BuildService();

        // Register Web build pipeline with file system service
        // 注册 Web 构建管线并注入文件系统服务
        const webPipeline = new WebBuildPipeline();
        webPipeline.setFileSystem(buildFileSystem);

        // Get engine modules path from Tauri backend
        // 从 Tauri 后端获取引擎模块路径
        invoke<string>('get_engine_modules_base_path').then(enginePath => {
            console.log('[ServiceRegistry] Engine modules path:', enginePath);
            webPipeline.setEngineModulesPath(enginePath);
        }).catch(err => {
            console.warn('[ServiceRegistry] Failed to get engine modules path:', err);
        });

        buildService.register(webPipeline);

        // Register WeChat build pipeline
        // 注册微信构建管线
        const wechatPipeline = new WeChatBuildPipeline();
        wechatPipeline.setFileSystem(buildFileSystem);
        buildService.register(wechatPipeline);

        Core.services.registerInstance(BuildService, buildService);

        // Initialize ModuleRegistry with Tauri file system
        // 使用 Tauri 文件系统初始化 ModuleRegistry
        // Engine modules are read via Tauri commands from local file system
        // 引擎模块通过 Tauri 命令从本地文件系统读取
        const tauriModuleFs = new TauriModuleFileSystem();
        moduleRegistry.initialize(tauriModuleFs, '/engine').catch(err => {
            console.warn('[ServiceRegistry] Failed to initialize ModuleRegistry:', err);
        });

        // Initialize UserCodeService for user script compilation and loading
        // 初始化 UserCodeService 用于用户脚本编译和加载
        const userCodeService = new UserCodeService(fileSystem);
        Core.services.registerInstance(UserCodeService, userCodeService);

        // Helper function to compile and load user scripts
        // 辅助函数：编译和加载用户脚本
        let currentProjectPath: string | null = null;

        const compileAndLoadUserScripts = async (projectPath: string) => {
            // Ensure PluginSDKRegistry is initialized before loading user code
            // 确保在加载用户代码之前 PluginSDKRegistry 已初始化
            PluginSDKRegistry.initialize();

            try {
                // 1. 编译运行时脚本 | Compile runtime scripts
                const runtimeResult = await userCodeService.compile({
                    projectPath: projectPath,
                    target: UserCodeTarget.Runtime
                });

                if (runtimeResult.success && runtimeResult.outputPath) {
                    const module = await userCodeService.load(runtimeResult.outputPath, UserCodeTarget.Runtime);
                    userCodeService.registerComponents(module, componentRegistry);
                    messageHub.publish('usercode:reloaded', {
                        projectPath,
                        exports: Object.keys(module.exports)
                    });
                } else if (runtimeResult.errors.length > 0) {
                    console.warn('[UserCodeService] Runtime compilation errors:', runtimeResult.errors);
                }

                // 2. 编译编辑器脚本 | Compile editor scripts
                const editorResult = await userCodeService.compile({
                    projectPath: projectPath,
                    target: UserCodeTarget.Editor
                });

                if (editorResult.success && editorResult.outputPath) {
                    const editorModule = await userCodeService.load(editorResult.outputPath, UserCodeTarget.Editor);
                    userCodeService.registerEditorExtensions(editorModule, componentInspectorRegistry);
                    messageHub.publish('usercode:editor-reloaded', {
                        projectPath,
                        exports: Object.keys(editorModule.exports)
                    });
                } else if (editorResult.errors.length > 0) {
                    // 编辑器脚本编译错误只记录，不影响运行时
                    console.warn('[UserCodeService] Editor compilation errors:', editorResult.errors);
                }
            } catch (error) {
                console.error('[UserCodeService] Failed to compile/load:', error);
            }
        };

        // Subscribe to project:opened to compile and load user scripts
        // 订阅 project:opened 以编译和加载用户脚本
        messageHub.subscribe('project:opened', async (data: { path: string; type: string; name: string }) => {
            currentProjectPath = data.path;
            await compileAndLoadUserScripts(data.path);

            // Start watching for file changes (external editor support)
            // 开始监视文件变更（支持外部编辑器）
            userCodeService.watch(data.path, async (event) => {
                console.log('[UserCodeService] Hot reload event:', event.changedFiles);

                if (event.newModule) {
                    // 1. 注册新的/更新的组件到注册表
                    userCodeService.registerComponents(event.newModule, componentRegistry);

                    // 2. 热更新：更新现有实例的原型链
                    const updatedCount = userCodeService.hotReloadInstances(event.newModule);
                    console.log(`[UserCodeService] Hot reloaded ${updatedCount} component instances`);

                    // 3. 如果正在预览，热更新用户系统
                    const scene = Core.scene;
                    if (scene && !scene.isEditorMode) {
                        userCodeService.hotReloadSystems(event.newModule, scene);
                    }

                    // 4. 通知用户代码已重新加载
                    messageHub.publish('usercode:reloaded', {
                        projectPath: data.path,
                        exports: Object.keys(event.newModule.exports),
                        updatedInstances: updatedCount
                    });
                }
            }).catch(err => {
                console.warn('[UserCodeService] Failed to start file watcher:', err);
            });
        });

        // Subscribe to project:closed to stop watching and cleanup
        // 订阅 project:closed 以停止监视和清理
        messageHub.subscribe('project:closed', async () => {
            currentProjectPath = null;
            await userCodeService.stopWatch();
            userCodeService.unregisterEditorExtensions(componentInspectorRegistry);
        });

        // Subscribe to script file changes (create/delete) from editor operations
        // 订阅编辑器操作的脚本文件变更（创建/删除）
        // Note: file:modified is handled by the Rust file watcher for external editor support
        // 注意：file:modified 由 Rust 文件监视器处理以支持外部编辑器
        messageHub.subscribe('file:created', async (data: { path: string }) => {
            if (currentProjectPath && this.isScriptFile(data.path)) {
                await compileAndLoadUserScripts(currentProjectPath);
            }
        });

        messageHub.subscribe('file:deleted', async (data: { path: string }) => {
            if (currentProjectPath && this.isScriptFile(data.path)) {
                await compileAndLoadUserScripts(currentProjectPath);
            }
        });

        // 预览开始时注册用户系统
        // Register user systems when preview starts
        messageHub.subscribe('preview:start', () => {
            const runtimeModule = userCodeService.getModule(UserCodeTarget.Runtime);
            if (runtimeModule) {
                const scene = Core.scene;
                if (scene) {
                    userCodeService.registerSystems(runtimeModule, scene);
                }
            }
        });

        // 预览停止时移除用户系统
        // Unregister user systems when preview stops
        messageHub.subscribe('preview:stop', () => {
            const scene = Core.scene;
            if (scene) {
                userCodeService.unregisterSystems(scene);
            }
        });

        // 注册默认场景模板 - 创建默认相机
        // Register default scene template - creates default camera
        this.registerDefaultSceneTemplate();

        return {
            uiRegistry,
            messageHub,
            serializerRegistry,
            entityStore,
            componentRegistry,
            projectService,
            componentDiscovery,
            propertyMetadata,
            logService,
            settingsRegistry,
            sceneManager,
            fileActionRegistry,
            pluginManager,
            diContainer,
            eventBus,
            commandRegistry,
            panelRegistry,
            fileSystem,
            dialog,
            notification,
            inspectorRegistry,
            propertyRendererRegistry,
            fieldEditorRegistry,
            buildService,
            userCodeService
        };
    }

    setupRemoteLogListener(logService: LogService): void {
        window.addEventListener('profiler:remote-log', ((event: CustomEvent) => {
            const { level, message, timestamp, clientId } = event.detail;
            logService.addRemoteLog(level, message, timestamp, clientId);
        }) as EventListener);
    }

    /**
     * Check if a file path is a TypeScript script file (not in editor folder)
     * 检查文件路径是否为 TypeScript 脚本文件（不在 editor 文件夹中）
     */
    private isScriptFile(filePath: string): boolean {
        // Must be .ts file | 必须是 .ts 文件
        if (!filePath.endsWith('.ts')) {
            return false;
        }

        // Normalize path separators | 规范化路径分隔符
        const normalizedPath = filePath.replace(/\\/g, '/');

        // Must be in scripts folder | 必须在 scripts 文件夹中
        if (!normalizedPath.includes('/scripts/')) {
            return false;
        }

        // Exclude editor scripts | 排除编辑器脚本
        if (normalizedPath.includes('/scripts/editor/')) {
            return false;
        }

        // Exclude .esengine folder | 排除 .esengine 文件夹
        if (normalizedPath.includes('/.esengine/')) {
            return false;
        }

        return true;
    }

    /**
     * 注册默认场景模板
     * Register default scene template with default entities
     */
    private registerDefaultSceneTemplate(): void {
        // 注册默认相机创建器
        // Register default camera creator
        SceneTemplateRegistry.registerDefaultEntity((scene) => {
            // 检查是否已存在相机
            // Check if camera already exists
            const existingCameras = scene.entities.findEntitiesWithComponent(CameraComponent);
            if (existingCameras.length > 0) {
                return null;
            }

            // 创建默认相机实体
            // Create default camera entity
            const cameraEntity = scene.createEntity('Main Camera');
            cameraEntity.addComponent(new TransformComponent());
            const camera = new CameraComponent();
            camera.orthographicSize = 1;
            cameraEntity.addComponent(camera);

            return cameraEntity;
        });
    }
}
