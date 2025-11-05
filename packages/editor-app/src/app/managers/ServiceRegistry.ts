import { Core } from '@esengine/ecs-framework';
import {
    UIRegistry,
    MessageHub,
    SerializerRegistry,
    EntityStoreService,
    ComponentRegistry,
    ProjectService,
    ComponentDiscoveryService,
    PropertyMetadataService,
    LogService,
    SettingsRegistry,
    SceneManagerService,
    FileActionRegistry,
    EditorPluginManager,
    InspectorRegistry
} from '@esengine/editor-core';
import { TauriFileAPI } from '../../adapters/TauriFileAPI';
import { DIContainer } from '../../core/di/DIContainer';
import { TypedEventBus } from '../../core/events/TypedEventBus';
import { CommandRegistry } from '../../core/commands/CommandRegistry';
import { PanelRegistry } from '../../core/commands/PanelRegistry';
import type { EditorEventMap } from '../../core/events/EditorEventMap';
import { TauriFileSystemService } from '../../services/TauriFileSystemService';
import { TauriDialogService } from '../../services/TauriDialogService';
import { NotificationService } from '../../services/NotificationService';

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
    pluginManager: EditorPluginManager;
    diContainer: DIContainer;
    eventBus: TypedEventBus<EditorEventMap>;
    commandRegistry: CommandRegistry;
    panelRegistry: PanelRegistry;
    fileSystem: TauriFileSystemService;
    dialog: TauriDialogService;
    notification: NotificationService;
    inspectorRegistry: InspectorRegistry;
}

export class ServiceRegistry {
    registerAllServices(coreInstance: Core): EditorServices {
        const fileAPI = new TauriFileAPI();

        const uiRegistry = new UIRegistry();
        const messageHub = new MessageHub();
        const serializerRegistry = new SerializerRegistry();
        const entityStore = new EntityStoreService(messageHub);
        const componentRegistry = new ComponentRegistry();
        const projectService = new ProjectService(messageHub, fileAPI);
        const componentDiscovery = new ComponentDiscoveryService(messageHub);
        const propertyMetadata = new PropertyMetadataService();
        const logService = new LogService();
        const settingsRegistry = new SettingsRegistry();
        const sceneManager = new SceneManagerService(messageHub, fileAPI, projectService);
        const fileActionRegistry = new FileActionRegistry();

        Core.services.registerInstance(UIRegistry, uiRegistry);
        Core.services.registerInstance(MessageHub, messageHub);
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

        const pluginManager = new EditorPluginManager();
        pluginManager.initialize(coreInstance, Core.services);
        Core.services.registerInstance(EditorPluginManager, pluginManager);

        const diContainer = new DIContainer();
        const eventBus = new TypedEventBus<EditorEventMap>();
        const commandRegistry = new CommandRegistry();
        const panelRegistry = new PanelRegistry();

        const fileSystem = new TauriFileSystemService();
        const dialog = new TauriDialogService();
        const notification = new NotificationService();
        const inspectorRegistry = new InspectorRegistry();

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
            inspectorRegistry
        };
    }

    setupRemoteLogListener(logService: LogService): void {
        window.addEventListener('profiler:remote-log', ((event: CustomEvent) => {
            const { level, message, timestamp, clientId } = event.detail;
            logService.addRemoteLog(level, message, timestamp, clientId);
        }) as EventListener);
    }
}
