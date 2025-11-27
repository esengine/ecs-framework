import { Core, ComponentRegistry as CoreComponentRegistry } from '@esengine/ecs-framework';
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
    ICompilerRegistry
} from '@esengine/editor-core';
import {
    TransformComponent,
    SpriteComponent,
    SpriteAnimatorComponent,
    TextComponent,
    CameraComponent,
    RigidBodyComponent,
    BoxColliderComponent,
    CircleColliderComponent,
    AudioSourceComponent
} from '@esengine/ecs-components';
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
            { name: 'TextComponent', type: TextComponent, editorName: 'Text', category: 'components.category.rendering', description: 'components.text.description', icon: 'Type' },
            { name: 'CameraComponent', type: CameraComponent, editorName: 'Camera', category: 'components.category.rendering', description: 'components.camera.description', icon: 'Camera' },
            { name: 'RigidBodyComponent', type: RigidBodyComponent, editorName: 'RigidBody', category: 'components.category.physics', description: 'components.rigidBody.description', icon: 'Atom' },
            { name: 'BoxColliderComponent', type: BoxColliderComponent, editorName: 'BoxCollider', category: 'components.category.physics', description: 'components.boxCollider.description', icon: 'Square' },
            { name: 'CircleColliderComponent', type: CircleColliderComponent, editorName: 'CircleCollider', category: 'components.category.physics', description: 'components.circleCollider.description', icon: 'Circle' },
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
            fieldEditorRegistry
        };
    }

    setupRemoteLogListener(logService: LogService): void {
        window.addEventListener('profiler:remote-log', ((event: CustomEvent) => {
            const { level, message, timestamp, clientId } = event.detail;
            logService.addRemoteLog(level, message, timestamp, clientId);
        }) as EventListener);
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
