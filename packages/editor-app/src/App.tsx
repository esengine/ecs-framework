import { useState, useEffect, useRef, useCallback } from 'react';
import { Core, Scene } from '@esengine/ecs-framework';
import { EditorPluginManager, UIRegistry, MessageHub, SerializerRegistry, EntityStoreService, ComponentRegistry, LocaleService, ProjectService, ComponentDiscoveryService, PropertyMetadataService, LogService, SettingsRegistry, SceneManagerService } from '@esengine/editor-core';
import { GlobalBlackboardService } from '@esengine/behavior-tree';
import { SceneInspectorPlugin } from './plugins/SceneInspectorPlugin';
import { ProfilerPlugin } from './plugins/ProfilerPlugin';
import { EditorAppearancePlugin } from './plugins/EditorAppearancePlugin';
import { BehaviorTreePlugin } from './plugins/BehaviorTreePlugin';
import { StartupPage } from './components/StartupPage';
import { SceneHierarchy } from './components/SceneHierarchy';
import { EntityInspector } from './components/EntityInspector';
import { AssetBrowser } from './components/AssetBrowser';
import { ConsolePanel } from './components/ConsolePanel';
import { PluginManagerWindow } from './components/PluginManagerWindow';
import { ProfilerWindow } from './components/ProfilerWindow';
import { PortManager } from './components/PortManager';
import { SettingsWindow } from './components/SettingsWindow';
import { AboutDialog } from './components/AboutDialog';
import { ErrorDialog } from './components/ErrorDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { BehaviorTreeWindow } from './components/BehaviorTreeWindow';
import { Viewport } from './components/Viewport';
import { MenuBar } from './components/MenuBar';
import { FlexLayoutDockContainer, FlexDockPanel } from './components/FlexLayoutDockContainer';
import { TauriAPI } from './api/tauri';
import { TauriFileAPI } from './adapters/TauriFileAPI';
import { SettingsService } from './services/SettingsService';
import { checkForUpdatesOnStartup } from './utils/updater';
import { useLocale } from './hooks/useLocale';
import { en, zh } from './locales';
import { Loader2, Globe } from 'lucide-react';
import './styles/App.css';

const coreInstance = Core.create({ debug: true });

const localeService = new LocaleService();
localeService.registerTranslations('en', en);
localeService.registerTranslations('zh', zh);
Core.services.registerInstance(LocaleService, localeService);

// 注册全局黑板服务
Core.services.registerSingleton(GlobalBlackboardService);

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
  const [settingsRegistry, setSettingsRegistry] = useState<SettingsRegistry | null>(null);
  const [sceneManager, setSceneManager] = useState<SceneManagerService | null>(null);
  const { t, locale, changeLocale } = useLocale();
  const [status, setStatus] = useState(t('header.status.initializing'));
  const [panels, setPanels] = useState<FlexDockPanel[]>([]);
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showProfiler, setShowProfiler] = useState(false);
  const [showPortManager, setShowPortManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showBehaviorTreeEditor, setShowBehaviorTreeEditor] = useState(false);
  const [behaviorTreeFilePath, setBehaviorTreeFilePath] = useState<string | null>(null);
  const [pluginUpdateTrigger, setPluginUpdateTrigger] = useState(0);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isProfilerMode, setIsProfilerMode] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  } | null>(null);

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
    if (messageHub) {
      const unsubscribeEnabled = messageHub.subscribe('plugin:enabled', () => {
        setPluginUpdateTrigger(prev => prev + 1);
      });

      const unsubscribeDisabled = messageHub.subscribe('plugin:disabled', () => {
        setPluginUpdateTrigger(prev => prev + 1);
      });

      return () => {
        unsubscribeEnabled();
        unsubscribeDisabled();
      };
    }
  }, [messageHub]);

  // 监听远程连接状态
  useEffect(() => {
    const checkConnection = () => {
      const profilerService = (window as any).__PROFILER_SERVICE__;
      if (profilerService && profilerService.isConnected()) {
        if (!isRemoteConnected) {
          setIsRemoteConnected(true);
          setStatus(t('header.status.remoteConnected'));
        }
      } else {
        if (isRemoteConnected) {
          setIsRemoteConnected(false);
          if (projectLoaded) {
            const componentRegistry = Core.services.resolve(ComponentRegistry);
            const componentCount = componentRegistry?.getAllComponents().length || 0;
            setStatus(t('header.status.projectOpened') + (componentCount > 0 ? ` (${componentCount} components registered)` : ''));
          } else {
            setStatus(t('header.status.ready'));
          }
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [projectLoaded, isRemoteConnected, t]);

  useEffect(() => {
    const initializeEditor = async () => {
      // 使用 ref 防止 React StrictMode 的双重调用
      if (initRef.current) {
        return;
      }
      initRef.current = true;

      try {
        (window as any).__ECS_FRAMEWORK__ = await import('@esengine/ecs-framework');

        const editorScene = new Scene();
        Core.setScene(editorScene);

        const uiRegistry = new UIRegistry();
        const messageHub = new MessageHub();
        const serializerRegistry = new SerializerRegistry();
        const entityStore = new EntityStoreService(messageHub);
        const componentRegistry = new ComponentRegistry();
        const fileAPI = new TauriFileAPI();
        const projectService = new ProjectService(messageHub, fileAPI);
        const componentDiscovery = new ComponentDiscoveryService(messageHub);
        const propertyMetadata = new PropertyMetadataService();
        const logService = new LogService();
        const settingsRegistry = new SettingsRegistry();
        const sceneManagerService = new SceneManagerService(messageHub, fileAPI, projectService);

        // 监听远程日志事件
        window.addEventListener('profiler:remote-log', ((event: CustomEvent) => {
          const { level, message, timestamp, clientId } = event.detail;
          logService.addRemoteLog(level, message, timestamp, clientId);
        }) as EventListener);

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
        Core.services.registerInstance(SceneManagerService, sceneManagerService);

        const pluginMgr = new EditorPluginManager();
        pluginMgr.initialize(coreInstance, Core.services);
        Core.services.registerInstance(EditorPluginManager, pluginMgr);

        await pluginMgr.installEditor(new SceneInspectorPlugin());
        await pluginMgr.installEditor(new ProfilerPlugin());
        await pluginMgr.installEditor(new EditorAppearancePlugin());
        await pluginMgr.installEditor(new BehaviorTreePlugin());

        messageHub.subscribe('ui:openWindow', (data: any) => {
          if (data.windowId === 'profiler') {
            setShowProfiler(true);
          } else if (data.windowId === 'pluginManager') {
            setShowPluginManager(true);
          } else if (data.windowId === 'behavior-tree-editor') {
            setShowBehaviorTreeEditor(true);
          }
        });

        await TauriAPI.greet('Developer');

        setInitialized(true);
        setPluginManager(pluginMgr);
        setEntityStore(entityStore);
        setMessageHub(messageHub);
        setLogService(logService);
        setUiRegistry(uiRegistry);
        setSettingsRegistry(settingsRegistry);
        setSceneManager(sceneManagerService);
        setStatus(t('header.status.ready'));

        // Check for updates on startup (after 3 seconds)
        checkForUpdatesOnStartup();
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        setStatus(t('header.status.failed'));
      }
    };

    initializeEditor();
  }, []);

  const handleOpenRecentProject = async (projectPath: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage(locale === 'zh' ? '步骤 1/2: 打开项目配置...' : 'Step 1/2: Opening project config...');

      const projectService = Core.services.resolve(ProjectService);

      if (!projectService) {
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

      setStatus(t('header.status.projectOpened'));

      setLoadingMessage(locale === 'zh' ? '步骤 2/2: 加载场景...' : 'Step 2/2: Loading scene...');

      const sceneManagerService = Core.services.resolve(SceneManagerService);
      const scenesPath = projectService.getScenesPath();
      if (scenesPath && sceneManagerService) {
        try {
          const sceneFiles = await TauriAPI.scanDirectory(scenesPath, '*.ecs');

          if (sceneFiles.length > 0) {
            const defaultScenePath = projectService.getDefaultScenePath();
            const sceneToLoad = sceneFiles.find(f => f === defaultScenePath) || sceneFiles[0];

            await sceneManagerService.openScene(sceneToLoad);
          } else {
            await sceneManagerService.newScene();
          }
        } catch (error) {
          await sceneManagerService.newScene();
        }
      }

      const settings = SettingsService.getInstance();
      settings.addRecentProject(projectPath);

      setCurrentProjectPath(projectPath);
      setProjectLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to open project:', error);
      setStatus(t('header.status.failed'));
      setIsLoading(false);

      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorDialog({
        title: locale === 'zh' ? '打开项目失败' : 'Failed to Open Project',
        message: locale === 'zh'
          ? `无法打开项目:\n${errorMessage}`
          : `Failed to open project:\n${errorMessage}`
      });
    }
  };

  const handleOpenProject = async () => {
    try {
      const projectPath = await TauriAPI.openProjectDialog();
      if (!projectPath) return;

      await handleOpenRecentProject(projectPath);
    } catch (error) {
      console.error('Failed to open project dialog:', error);
    }
  };

  const handleCreateProject = async () => {
    let selectedProjectPath: string | null = null;

    try {
      selectedProjectPath = await TauriAPI.openProjectDialog();
      if (!selectedProjectPath) return;

      setIsLoading(true);
      setLoadingMessage(locale === 'zh' ? '正在创建项目...' : 'Creating project...');

      const projectService = Core.services.resolve(ProjectService);
      if (!projectService) {
        console.error('ProjectService not available');
        setIsLoading(false);
        setErrorDialog({
          title: locale === 'zh' ? '创建项目失败' : 'Failed to Create Project',
          message: locale === 'zh' ? '项目服务不可用，请重启编辑器' : 'Project service is not available. Please restart the editor.'
        });
        return;
      }

      await projectService.createProject(selectedProjectPath);

      setLoadingMessage(locale === 'zh' ? '项目创建成功，正在打开...' : 'Project created, opening...');

      await handleOpenRecentProject(selectedProjectPath);
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsLoading(false);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const pathToOpen = selectedProjectPath;

      if (errorMessage.includes('already exists') && pathToOpen) {
        setConfirmDialog({
          title: locale === 'zh' ? '项目已存在' : 'Project Already Exists',
          message: locale === 'zh'
            ? '该目录下已存在 ECS 项目，是否要打开该项目？'
            : 'An ECS project already exists in this directory. Do you want to open it?',
          confirmText: locale === 'zh' ? '打开项目' : 'Open Project',
          cancelText: locale === 'zh' ? '取消' : 'Cancel',
          onConfirm: () => {
            setConfirmDialog(null);
            setIsLoading(true);
            setLoadingMessage(locale === 'zh' ? '正在打开项目...' : 'Opening project...');
            handleOpenRecentProject(pathToOpen).catch((err) => {
              console.error('Failed to open project:', err);
              setIsLoading(false);
              setErrorDialog({
                title: locale === 'zh' ? '打开项目失败' : 'Failed to Open Project',
                message: locale === 'zh'
                  ? `无法打开项目:\n${err instanceof Error ? err.message : String(err)}`
                  : `Failed to open project:\n${err instanceof Error ? err.message : String(err)}`
              });
            });
          }
        });
      } else {
        setStatus(locale === 'zh' ? '创建项目失败' : 'Failed to create project');
        setErrorDialog({
          title: locale === 'zh' ? '创建项目失败' : 'Failed to Create Project',
          message: locale === 'zh'
            ? `无法创建项目:\n${errorMessage}`
            : `Failed to create project:\n${errorMessage}`
        });
      }
    }
  };

  const handleProfilerMode = async () => {
    setIsProfilerMode(true);
    setProjectLoaded(true);
    setStatus(t('header.status.profilerMode') || 'Profiler Mode - Waiting for connection...');
  };

  const handleNewScene = async () => {
    if (!sceneManager) {
      console.error('SceneManagerService not available');
      return;
    }

    try {
      await sceneManager.newScene();
      setStatus(locale === 'zh' ? '已创建新场景' : 'New scene created');
    } catch (error) {
      console.error('Failed to create new scene:', error);
      setStatus(locale === 'zh' ? '创建场景失败' : 'Failed to create scene');
    }
  };

  const handleOpenScene = async () => {
    if (!sceneManager) {
      console.error('SceneManagerService not available');
      return;
    }

    try {
      await sceneManager.openScene();
      const sceneState = sceneManager.getSceneState();
      setStatus(locale === 'zh' ? `已打开场景: ${sceneState.sceneName}` : `Scene opened: ${sceneState.sceneName}`);
    } catch (error) {
      console.error('Failed to open scene:', error);
      setStatus(locale === 'zh' ? '打开场景失败' : 'Failed to open scene');
    }
  };

  const handleOpenSceneByPath = useCallback(async (scenePath: string) => {
    console.log('[App] handleOpenSceneByPath called with:', scenePath);

    if (!sceneManager) {
      console.error('SceneManagerService not available');
      return;
    }

    try {
      console.log('[App] Opening scene:', scenePath);
      await sceneManager.openScene(scenePath);
      const sceneState = sceneManager.getSceneState();
      console.log('[App] Scene opened, state:', sceneState);
      setStatus(locale === 'zh' ? `已打开场景: ${sceneState.sceneName}` : `Scene opened: ${sceneState.sceneName}`);
    } catch (error) {
      console.error('Failed to open scene:', error);
      setStatus(locale === 'zh' ? '打开场景失败' : 'Failed to open scene');
      setErrorDialog({
        title: locale === 'zh' ? '打开场景失败' : 'Failed to Open Scene',
        message: locale === 'zh'
          ? `无法打开场景:\n${error instanceof Error ? error.message : String(error)}`
          : `Failed to open scene:\n${error instanceof Error ? error.message : String(error)}`
      });
    }
  }, [sceneManager, locale]);

  const handleOpenBehaviorTree = useCallback((btreePath: string) => {
    setBehaviorTreeFilePath(btreePath);
    setShowBehaviorTreeEditor(true);
  }, []);

  const handleSaveScene = async () => {
    if (!sceneManager) {
      console.error('SceneManagerService not available');
      return;
    }

    try {
      await sceneManager.saveScene();
      const sceneState = sceneManager.getSceneState();
      setStatus(locale === 'zh' ? `已保存场景: ${sceneState.sceneName}` : `Scene saved: ${sceneState.sceneName}`);
    } catch (error) {
      console.error('Failed to save scene:', error);
      setStatus(locale === 'zh' ? '保存场景失败' : 'Failed to save scene');
    }
  };

  const handleSaveSceneAs = async () => {
    if (!sceneManager) {
      console.error('SceneManagerService not available');
      return;
    }

    try {
      await sceneManager.saveSceneAs();
      const sceneState = sceneManager.getSceneState();
      setStatus(locale === 'zh' ? `已保存场景: ${sceneState.sceneName}` : `Scene saved: ${sceneState.sceneName}`);
    } catch (error) {
      console.error('Failed to save scene as:', error);
      setStatus(locale === 'zh' ? '另存场景失败' : 'Failed to save scene as');
    }
  };

  const handleExportScene = async () => {
    if (!sceneManager) {
      console.error('SceneManagerService not available');
      return;
    }

    try {
      await sceneManager.exportScene();
      const sceneState = sceneManager.getSceneState();
      setStatus(locale === 'zh' ? `已导出场景: ${sceneState.sceneName}` : `Scene exported: ${sceneState.sceneName}`);
    } catch (error) {
      console.error('Failed to export scene:', error);
      setStatus(locale === 'zh' ? '导出场景失败' : 'Failed to export scene');
    }
  };

  const handleCloseProject = () => {
    setProjectLoaded(false);
    setCurrentProjectPath(null);
    setIsProfilerMode(false);
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

  const handleOpenAbout = () => {
    setShowAbout(true);
  };

  useEffect(() => {
    if (projectLoaded && entityStore && messageHub && logService && uiRegistry && pluginManager) {
      let corePanels: FlexDockPanel[];

      if (isProfilerMode) {
        corePanels = [
          {
            id: 'scene-hierarchy',
            title: locale === 'zh' ? '场景层级' : 'Scene Hierarchy',
            content: <SceneHierarchy entityStore={entityStore} messageHub={messageHub} />,
            closable: false
          },
          {
            id: 'inspector',
            title: locale === 'zh' ? '检视器' : 'Inspector',
            content: <EntityInspector entityStore={entityStore} messageHub={messageHub} />,
            closable: false
          },
          {
            id: 'console',
            title: locale === 'zh' ? '控制台' : 'Console',
            content: <ConsolePanel logService={logService} />,
            closable: false
          }
        ];
      } else {
        corePanels = [
          {
            id: 'scene-hierarchy',
            title: locale === 'zh' ? '场景层级' : 'Scene Hierarchy',
            content: <SceneHierarchy entityStore={entityStore} messageHub={messageHub} />,
            closable: false
          },
          {
            id: 'inspector',
            title: locale === 'zh' ? '检视器' : 'Inspector',
            content: <EntityInspector entityStore={entityStore} messageHub={messageHub} />,
            closable: false
          },
          {
            id: 'assets',
            title: locale === 'zh' ? '资产' : 'Assets',
            content: <AssetBrowser projectPath={currentProjectPath} locale={locale} onOpenScene={handleOpenSceneByPath} onOpenBehaviorTree={handleOpenBehaviorTree} />,
            closable: false
          },
          {
            id: 'console',
            title: locale === 'zh' ? '控制台' : 'Console',
            content: <ConsolePanel logService={logService} />,
            closable: false
          }
        ];
      }

      const enabledPlugins = pluginManager.getAllPluginMetadata()
        .filter(p => p.enabled)
        .map(p => p.name);

      const pluginPanels: FlexDockPanel[] = uiRegistry.getAllPanels()
        .filter(panelDesc => {
          if (!panelDesc.component) {
            return false;
          }
          return enabledPlugins.some(pluginName => {
            const plugin = pluginManager.getEditorPlugin(pluginName);
            if (plugin && plugin.registerPanels) {
              const pluginPanels = plugin.registerPanels();
              return pluginPanels.some(p => p.id === panelDesc.id);
            }
            return false;
          });
        })
        .map(panelDesc => {
          const Component = panelDesc.component;
          return {
            id: panelDesc.id,
            title: (panelDesc as any).titleZh && locale === 'zh' ? (panelDesc as any).titleZh : panelDesc.title,
            content: <Component />,
            closable: panelDesc.closable ?? true
          };
        });

      console.log('[App] Loading plugin panels:', pluginPanels);
      setPanels([...corePanels, ...pluginPanels]);
    }
  }, [projectLoaded, entityStore, messageHub, logService, uiRegistry, pluginManager, locale, currentProjectPath, t, pluginUpdateTrigger, isProfilerMode, handleOpenSceneByPath, handleOpenBehaviorTree]);


  if (!initialized) {
    return (
      <div className="editor-loading">
        <Loader2 size={32} className="animate-spin" />
        <h2>Loading Editor...</h2>
      </div>
    );
  }

  if (!projectLoaded) {
    const settings = SettingsService.getInstance();
    const recentProjects = settings.getRecentProjects();

    return (
      <>
        <StartupPage
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onOpenRecentProject={handleOpenRecentProject}
          onProfilerMode={handleProfilerMode}
          recentProjects={recentProjects}
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
        {errorDialog && (
          <ErrorDialog
            title={errorDialog.title}
            message={errorDialog.message}
            onClose={() => setErrorDialog(null)}
          />
        )}
        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="editor-container">
      <div className={`editor-header ${isRemoteConnected ? 'remote-connected' : ''}`}>
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
          onOpenSettings={() => setShowSettings(true)}
          onToggleDevtools={handleToggleDevtools}
          onOpenAbout={handleOpenAbout}
        />
        <div className="header-right">
          <button onClick={handleLocaleChange} className="toolbar-btn locale-btn" title={locale === 'en' ? '切换到中文' : 'Switch to English'}>
            <Globe size={14} />
          </button>
          <span className="status">{status}</span>
        </div>
      </div>

      <div className="editor-content">
        <FlexLayoutDockContainer panels={panels} />
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

      {showSettings && settingsRegistry && (
        <SettingsWindow onClose={() => setShowSettings(false)} settingsRegistry={settingsRegistry} />
      )}

      {showAbout && (
        <AboutDialog onClose={() => setShowAbout(false)} locale={locale} />
      )}

      {showBehaviorTreeEditor && (
        <BehaviorTreeWindow
          isOpen={showBehaviorTreeEditor}
          onClose={() => {
            setShowBehaviorTreeEditor(false);
            setBehaviorTreeFilePath(null);
          }}
          filePath={behaviorTreeFilePath}
          projectPath={currentProjectPath}
        />
      )}

      {errorDialog && (
        <ErrorDialog
          title={errorDialog.title}
          message={errorDialog.message}
          onClose={() => setErrorDialog(null)}
        />
      )}
    </div>
  );
}

export default App;
