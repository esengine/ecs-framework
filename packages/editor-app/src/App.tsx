import { useState, useEffect, useRef } from 'react';
import { Core, Scene } from '@esengine/ecs-framework';
import { EditorPluginManager, UIRegistry, MessageHub, SerializerRegistry, EntityStoreService, ComponentRegistry, LocaleService, ProjectService, ComponentDiscoveryService, ComponentLoaderService, PropertyMetadataService, LogService } from '@esengine/editor-core';
import { SceneInspectorPlugin } from './plugins/SceneInspectorPlugin';
import { ProfilerPlugin } from './plugins/ProfilerPlugin';
import { StartupPage } from './components/StartupPage';
import { SceneHierarchy } from './components/SceneHierarchy';
import { EntityInspector } from './components/EntityInspector';
import { AssetBrowser } from './components/AssetBrowser';
import { ConsolePanel } from './components/ConsolePanel';
import { ProfilerPanel } from './components/ProfilerPanel';
import { PluginManagerWindow } from './components/PluginManagerWindow';
import { ProfilerWindow } from './components/ProfilerWindow';
import { PortManager } from './components/PortManager';
import { Viewport } from './components/Viewport';
import { MenuBar } from './components/MenuBar';
import { DockContainer, DockablePanel } from './components/DockContainer';
import { TauriAPI } from './api/tauri';
import { useLocale } from './hooks/useLocale';
import { en, zh } from './locales';
import { Loader2, Globe } from 'lucide-react';
import './styles/App.css';

const coreInstance = Core.create({ debug: true });

const localeService = new LocaleService();
localeService.registerTranslations('en', en);
localeService.registerTranslations('zh', zh);
Core.services.registerInstance(LocaleService, localeService);

function App() {
  const initRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(null);
  const [pluginManager, setPluginManager] = useState<EditorPluginManager | null>(null);
  const [entityStore, setEntityStore] = useState<EntityStoreService | null>(null);
  const [messageHub, setMessageHub] = useState<MessageHub | null>(null);
  const [logService, setLogService] = useState<LogService | null>(null);
  const [uiRegistry, setUiRegistry] = useState<UIRegistry | null>(null);
  const { t, locale, changeLocale } = useLocale();
  const [status, setStatus] = useState(t('header.status.initializing'));
  const [panels, setPanels] = useState<DockablePanel[]>([]);
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showProfiler, setShowProfiler] = useState(false);
  const [showPortManager, setShowPortManager] = useState(false);

  useEffect(() => {
    // 禁用默认右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const initializeEditor = async () => {
      // 使用 ref 防止 React StrictMode 的双重调用
      if (initRef.current) {
        console.log('[App] Already initialized via ref, skipping second initialization');
        return;
      }
      initRef.current = true;

      try {
        console.log('[App] Starting editor initialization...');
        (window as any).__ECS_FRAMEWORK__ = await import('@esengine/ecs-framework');

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
        const propertyMetadata = new PropertyMetadataService();
        const logService = new LogService();

        Core.services.registerInstance(UIRegistry, uiRegistry);
        Core.services.registerInstance(MessageHub, messageHub);
        Core.services.registerInstance(SerializerRegistry, serializerRegistry);
        Core.services.registerInstance(EntityStoreService, entityStore);
        Core.services.registerInstance(ComponentRegistry, componentRegistry);
        Core.services.registerInstance(ProjectService, projectService);
        Core.services.registerInstance(ComponentDiscoveryService, componentDiscovery);
        Core.services.registerInstance(ComponentLoaderService, componentLoader);
        Core.services.registerInstance(PropertyMetadataService, propertyMetadata);
        Core.services.registerInstance(LogService, logService);

        const pluginMgr = new EditorPluginManager();
        pluginMgr.initialize(coreInstance, Core.services);
        Core.services.registerInstance(EditorPluginManager, pluginMgr);

        await pluginMgr.installEditor(new SceneInspectorPlugin());
        await pluginMgr.installEditor(new ProfilerPlugin());

        console.log('[App] All plugins installed');
        console.log('[App] UIRegistry menu count:', uiRegistry.getAllMenus().length);
        console.log('[App] UIRegistry all menus:', uiRegistry.getAllMenus());
        console.log('[App] UIRegistry window menus:', uiRegistry.getChildMenus('window'));

        messageHub.subscribe('ui:openWindow', (data: any) => {
          if (data.windowId === 'profiler') {
            setShowProfiler(true);
          } else if (data.windowId === 'pluginManager') {
            setShowPluginManager(true);
          }
        });

        const greeting = await TauriAPI.greet('Developer');
        console.log(greeting);

        setInitialized(true);
        setPluginManager(pluginMgr);
        setEntityStore(entityStore);
        setMessageHub(messageHub);
        setLogService(logService);
        setUiRegistry(uiRegistry);
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

      setIsLoading(true);
      setLoadingMessage(locale === 'zh' ? '正在打开项目...' : 'Opening project...');

      const projectService = Core.services.resolve(ProjectService);
      const discoveryService = Core.services.resolve(ComponentDiscoveryService);
      const loaderService = Core.services.resolve(ComponentLoaderService);

      if (!projectService || !discoveryService || !loaderService) {
        console.error('Required services not available');
        setIsLoading(false);
        return;
      }

      await projectService.openProject(projectPath);

      await fetch('/@user-project-set-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: projectPath })
      });

      setLoadingMessage(locale === 'zh' ? '正在扫描组件...' : 'Scanning components...');
      setStatus('Scanning components...');

      const componentsPath = projectService.getComponentsPath();
      if (componentsPath) {
        const componentInfos = await discoveryService.scanComponents({
          basePath: componentsPath,
          pattern: '**/*.ts',
          scanFunction: TauriAPI.scanDirectory,
          readFunction: TauriAPI.readFileContent
        });

        setLoadingMessage(locale === 'zh' ? `正在加载 ${componentInfos.length} 个组件...` : `Loading ${componentInfos.length} components...`);
        setStatus(`Loading ${componentInfos.length} components...`);

        const modulePathTransform = (filePath: string) => {
          const relativePath = filePath.replace(projectPath, '').replace(/\\/g, '/');
          return `/@user-project${relativePath}`;
        };

        await loaderService.loadComponents(componentInfos, modulePathTransform);

        setStatus(t('header.status.projectOpened') + ` (${componentInfos.length} components registered)`);
      } else {
        setStatus(t('header.status.projectOpened'));
      }

      setCurrentProjectPath(projectPath);
      setProjectLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to open project:', error);
      setStatus(t('header.status.failed'));
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    console.log('Create project not implemented yet');
  };

  const handleNewScene = () => {
    console.log('New scene not implemented yet');
  };

  const handleOpenScene = () => {
    console.log('Open scene not implemented yet');
  };

  const handleSaveScene = () => {
    console.log('Save scene not implemented yet');
  };

  const handleSaveSceneAs = () => {
    console.log('Save scene as not implemented yet');
  };

  const handleCloseProject = () => {
    setProjectLoaded(false);
    setCurrentProjectPath(null);
    setStatus(t('header.status.ready'));
  };

  const handleExit = () => {
    window.close();
  };

  const handleLocaleChange = () => {
    const newLocale = locale === 'en' ? 'zh' : 'en';
    changeLocale(newLocale);
  };

  const handleToggleDevtools = async () => {
    try {
      await TauriAPI.toggleDevtools();
    } catch (error) {
      console.error('Failed to toggle devtools:', error);
    }
  };

  useEffect(() => {
    if (projectLoaded && entityStore && messageHub && logService) {
      setPanels([
        {
          id: 'scene-hierarchy',
          title: locale === 'zh' ? '场景层级' : 'Scene Hierarchy',
          position: 'left',
          content: <SceneHierarchy entityStore={entityStore} messageHub={messageHub} />,
          closable: false
        },
        {
          id: 'inspector',
          title: locale === 'zh' ? '检视器' : 'Inspector',
          position: 'right',
          content: <EntityInspector entityStore={entityStore} messageHub={messageHub} />,
          closable: false
        },
        {
          id: 'viewport',
          title: locale === 'zh' ? '视口' : 'Viewport',
          position: 'center',
          content: <Viewport locale={locale} />,
          closable: false
        },
        {
          id: 'assets',
          title: locale === 'zh' ? '资产' : 'Assets',
          position: 'bottom',
          content: <AssetBrowser projectPath={currentProjectPath} locale={locale} />,
          closable: false
        },
        {
          id: 'console',
          title: locale === 'zh' ? '控制台' : 'Console',
          position: 'bottom',
          content: <ConsolePanel logService={logService} />,
          closable: false
        }
      ]);
    }
  }, [projectLoaded, entityStore, messageHub, logService, locale, currentProjectPath, t]);

  const handlePanelMove = (panelId: string, newPosition: any) => {
    setPanels(prevPanels =>
      prevPanels.map(panel =>
        panel.id === panelId ? { ...panel, position: newPosition } : panel
      )
    );
  };

  if (!initialized) {
    return (
      <div className="editor-loading">
        <Loader2 size={32} className="animate-spin" />
        <h2>Loading Editor...</h2>
      </div>
    );
  }

  if (!projectLoaded) {
    return (
      <>
        <StartupPage
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          recentProjects={[]}
          locale={locale}
        />
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <Loader2 size={40} className="animate-spin" />
              <p className="loading-message">{loadingMessage}</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <MenuBar
          locale={locale}
          uiRegistry={uiRegistry || undefined}
          messageHub={messageHub || undefined}
          pluginManager={pluginManager || undefined}
          onNewScene={handleNewScene}
          onOpenScene={handleOpenScene}
          onSaveScene={handleSaveScene}
          onSaveSceneAs={handleSaveSceneAs}
          onOpenProject={handleOpenProject}
          onCloseProject={handleCloseProject}
          onExit={handleExit}
          onOpenPluginManager={() => setShowPluginManager(true)}
          onOpenProfiler={() => setShowProfiler(true)}
          onOpenPortManager={() => setShowPortManager(true)}
          onToggleDevtools={handleToggleDevtools}
        />
        <div className="header-right">
          <button onClick={handleLocaleChange} className="toolbar-btn locale-btn" title={locale === 'en' ? '切换到中文' : 'Switch to English'}>
            <Globe size={14} />
          </button>
          <span className="status">{status}</span>
        </div>
      </div>

      <div className="editor-content">
        <DockContainer panels={panels} onPanelMove={handlePanelMove} />
      </div>

      <div className="editor-footer">
        <span>{t('footer.plugins')}: {pluginManager?.getAllEditorPlugins().length ?? 0}</span>
        <span>{t('footer.entities')}: {entityStore?.getAllEntities().length ?? 0}</span>
        <span>{t('footer.core')}: {initialized ? t('footer.active') : t('footer.inactive')}</span>
      </div>

      {showPluginManager && pluginManager && (
        <PluginManagerWindow
          pluginManager={pluginManager}
          onClose={() => setShowPluginManager(false)}
        />
      )}

      {showProfiler && (
        <ProfilerWindow onClose={() => setShowProfiler(false)} />
      )}

      {showPortManager && (
        <PortManager onClose={() => setShowPortManager(false)} />
      )}
    </div>
  );
}

export default App;
