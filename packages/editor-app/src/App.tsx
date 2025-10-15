import { useState, useEffect } from 'react';
import { Core, Scene } from '@esengine/ecs-framework';
import { EditorPluginManager, UIRegistry, MessageHub, SerializerRegistry, EntityStoreService, ComponentRegistry, LocaleService, PropertyMetadataService, ProjectService, ComponentDiscoveryService, ComponentLoaderService } from '@esengine/editor-core';
import { SceneInspectorPlugin } from './plugins/SceneInspectorPlugin';
import { StartupPage } from './components/StartupPage';
import { SceneHierarchy } from './components/SceneHierarchy';
import { EntityInspector } from './components/EntityInspector';
import { AssetBrowser } from './components/AssetBrowser';
import { TauriAPI } from './api/tauri';
import { TransformComponent } from './example-components/TransformComponent';
import { SpriteComponent } from './example-components/SpriteComponent';
import { RigidBodyComponent } from './example-components/RigidBodyComponent';
import { useLocale } from './hooks/useLocale';
import { en, zh } from './locales';
import './styles/App.css';

const coreInstance = Core.create({ debug: true });

const localeService = new LocaleService();
localeService.registerTranslations('en', en);
localeService.registerTranslations('zh', zh);
Core.services.registerInstance(LocaleService, localeService);

const propertyMetadata = new PropertyMetadataService();
Core.services.registerInstance(PropertyMetadataService, propertyMetadata);

propertyMetadata.register(TransformComponent, {
  properties: {
    x: { type: 'number', label: 'X Position' },
    y: { type: 'number', label: 'Y Position' },
    rotation: { type: 'number', label: 'Rotation', min: 0, max: 360 },
    scaleX: { type: 'number', label: 'Scale X', min: 0, step: 0.1 },
    scaleY: { type: 'number', label: 'Scale Y', min: 0, step: 0.1 }
  }
});

propertyMetadata.register(SpriteComponent, {
  properties: {
    texturePath: { type: 'string', label: 'Texture Path' },
    color: { type: 'color', label: 'Tint Color' },
    visible: { type: 'boolean', label: 'Visible' }
  }
});

propertyMetadata.register(RigidBodyComponent, {
  properties: {
    mass: { type: 'number', label: 'Mass', min: 0, step: 0.1 },
    friction: { type: 'number', label: 'Friction', min: 0, max: 1, step: 0.01 },
    restitution: { type: 'number', label: 'Restitution', min: 0, max: 1, step: 0.01 },
    isDynamic: { type: 'boolean', label: 'Dynamic' }
  }
});

function App() {
  const [initialized, setInitialized] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(null);
  const [pluginManager, setPluginManager] = useState<EditorPluginManager | null>(null);
  const [entityStore, setEntityStore] = useState<EntityStoreService | null>(null);
  const [messageHub, setMessageHub] = useState<MessageHub | null>(null);
  const { t, locale, changeLocale } = useLocale();
  const [status, setStatus] = useState(t('header.status.initializing'));

  useEffect(() => {
    const initializeEditor = async () => {
      try {
        const editorScene = new Scene();
        Core.setScene(editorScene);

        const uiRegistry = new UIRegistry();
        const messageHub = new MessageHub();
        const serializerRegistry = new SerializerRegistry();
        const entityStore = new EntityStoreService(messageHub);
        const componentRegistry = new ComponentRegistry();
        const projectService = new ProjectService(messageHub);
        const componentDiscovery = new ComponentDiscoveryService(messageHub);
        const componentLoader = new ComponentLoaderService(messageHub, componentRegistry);

        componentRegistry.register({
          name: 'Transform',
          type: TransformComponent,
          category: 'Transform',
          description: 'Position, rotation and scale'
        });

        componentRegistry.register({
          name: 'Sprite',
          type: SpriteComponent,
          category: 'Rendering',
          description: 'Sprite renderer'
        });

        componentRegistry.register({
          name: 'RigidBody',
          type: RigidBodyComponent,
          category: 'Physics',
          description: 'Physics body'
        });

        Core.services.registerInstance(UIRegistry, uiRegistry);
        Core.services.registerInstance(MessageHub, messageHub);
        Core.services.registerInstance(SerializerRegistry, serializerRegistry);
        Core.services.registerInstance(EntityStoreService, entityStore);
        Core.services.registerInstance(ComponentRegistry, componentRegistry);
        Core.services.registerInstance(ProjectService, projectService);
        Core.services.registerInstance(ComponentDiscoveryService, componentDiscovery);
        Core.services.registerInstance(ComponentLoaderService, componentLoader);

        const pluginMgr = new EditorPluginManager();
        pluginMgr.initialize(coreInstance, Core.services);

        await pluginMgr.installEditor(new SceneInspectorPlugin());

        const greeting = await TauriAPI.greet('Developer');
        console.log(greeting);

        setInitialized(true);
        setPluginManager(pluginMgr);
        setEntityStore(entityStore);
        setMessageHub(messageHub);
        setStatus(t('header.status.ready'));
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        setStatus(t('header.status.failed'));
      }
    };

    initializeEditor();
  }, []);

  const handleOpenProject = async () => {
    try {
      const projectPath = await TauriAPI.openProjectDialog();
      if (!projectPath) return;

      const projectService = Core.services.resolve(ProjectService);
      const discoveryService = Core.services.resolve(ComponentDiscoveryService);
      const loaderService = Core.services.resolve(ComponentLoaderService);

      if (!projectService || !discoveryService || !loaderService) {
        console.error('Required services not available');
        return;
      }

      await projectService.openProject(projectPath);
      setStatus('Scanning components...');

      const componentsPath = projectService.getComponentsPath();
      if (componentsPath) {
        const componentInfos = await discoveryService.scanComponents({
          basePath: componentsPath,
          pattern: '**/*.ts',
          scanFunction: TauriAPI.scanDirectory,
          readFunction: TauriAPI.readFileContent
        });

        setStatus(`Loading ${componentInfos.length} components...`);

        await loaderService.loadComponents(componentInfos);

        setStatus(t('header.status.projectOpened') + ` (${componentInfos.length} components loaded)`);
      } else {
        setStatus(t('header.status.projectOpened'));
      }

      setCurrentProjectPath(projectPath);
      setProjectLoaded(true);
    } catch (error) {
      console.error('Failed to open project:', error);
      setStatus(t('header.status.failed'));
    }
  };

  const handleCreateProject = async () => {
    console.log('Create project not implemented yet');
  };

  const handleCreateEntity = () => {
    if (!initialized || !entityStore) return;
    const scene = Core.scene;
    if (!scene) return;

    const entity = scene.createEntity('Entity');
    entityStore.addEntity(entity);
  };

  const handleDeleteEntity = () => {
    if (!entityStore) return;
    const selected = entityStore.getSelectedEntity();
    if (selected) {
      selected.destroy();
      entityStore.removeEntity(selected);
    }
  };

  const handleLocaleChange = () => {
    const newLocale = locale === 'en' ? 'zh' : 'en';
    changeLocale(newLocale);
  };

  if (!initialized) {
    return (
      <div className="editor-loading">
        <h2>Loading Editor...</h2>
      </div>
    );
  }

  if (!projectLoaded) {
    return (
      <StartupPage
        onOpenProject={handleOpenProject}
        onCreateProject={handleCreateProject}
        recentProjects={[]}
        locale={locale}
      />
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1>{t('app.title')}</h1>
        <div className="header-toolbar">
          <button onClick={handleCreateEntity} disabled={!initialized} className="toolbar-btn">
            {t('header.toolbar.createEntity')}
          </button>
          <button onClick={handleDeleteEntity} disabled={!entityStore?.getSelectedEntity()} className="toolbar-btn">
            {t('header.toolbar.deleteEntity')}
          </button>
          <button onClick={handleLocaleChange} className="toolbar-btn locale-btn" title={locale === 'en' ? '切换到中文' : 'Switch to English'}>
            {locale === 'en' ? '中' : 'EN'}
          </button>
        </div>
        <span className="status">{status}</span>
      </div>

      <div className="editor-content">
        <div className="sidebar-left">
          {entityStore && messageHub ? (
            <SceneHierarchy entityStore={entityStore} messageHub={messageHub} />
          ) : (
            <div className="loading">Loading...</div>
          )}
        </div>

        <div className="main-content">
          <div className="viewport">
            <h3>{t('viewport.title')}</h3>
            <p>{t('viewport.placeholder')}</p>
          </div>

          <div className="bottom-panel">
            <AssetBrowser projectPath={currentProjectPath} locale={locale} />
          </div>
        </div>

        <div className="sidebar-right">
          {entityStore && messageHub ? (
            <EntityInspector entityStore={entityStore} messageHub={messageHub} />
          ) : (
            <div className="loading">Loading...</div>
          )}
        </div>
      </div>

      <div className="editor-footer">
        <span>{t('footer.plugins')}: {pluginManager?.getAllEditorPlugins().length ?? 0}</span>
        <span>{t('footer.entities')}: {entityStore?.getAllEntities().length ?? 0}</span>
        <span>{t('footer.core')}: {initialized ? t('footer.active') : t('footer.inactive')}</span>
      </div>
    </div>
  );
}

export default App;
