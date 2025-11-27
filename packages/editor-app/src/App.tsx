import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { Core, createLogger, Scene } from '@esengine/ecs-framework';
import * as ECSFramework from '@esengine/ecs-framework';

// 将 React 暴露到全局，供动态加载的插件使用
// editor-runtime.js 将 React 设为 external，需要从全局获取
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
(window as any).ReactJSXRuntime = ReactJSXRuntime;
import {
    PluginManager,
    UIRegistry,
    MessageHub,
    EntityStoreService,
    ComponentRegistry,
    LocaleService,
    LogService,
    SettingsRegistry,
    SceneManagerService,
    ProjectService,
    CompilerRegistry,
    ICompilerRegistry,
    InspectorRegistry,
    INotification,
    CommandManager
} from '@esengine/editor-core';
import type { IDialogExtended } from './services/TauriDialogService';
import { GlobalBlackboardService } from '@esengine/behavior-tree';
import { ServiceRegistry, PluginInstaller, useDialogStore } from './app/managers';
import { StartupPage } from './components/StartupPage';
import { ProjectCreationWizard } from './components/ProjectCreationWizard';
import { SceneHierarchy } from './components/SceneHierarchy';
import { Inspector } from './components/inspectors/Inspector';
import { AssetBrowser } from './components/AssetBrowser';
import { ConsolePanel } from './components/ConsolePanel';
import { Viewport } from './components/Viewport';
import { ProfilerWindow } from './components/ProfilerWindow';
import { PortManager } from './components/PortManager';
import { SettingsWindow } from './components/SettingsWindow';
import { AboutDialog } from './components/AboutDialog';
import { ErrorDialog } from './components/ErrorDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PluginGeneratorWindow } from './components/PluginGeneratorWindow';
import { ToastProvider, useToast } from './components/Toast';
import { MenuBar } from './components/MenuBar';
import { FlexLayoutDockContainer, FlexDockPanel } from './components/FlexLayoutDockContainer';
import { TauriAPI } from './api/tauri';
import { SettingsService } from './services/SettingsService';
import { PluginLoader } from './services/PluginLoader';
import { EngineService } from './services/EngineService';
import { CompilerConfigDialog } from './components/CompilerConfigDialog';
import { checkForUpdatesOnStartup } from './utils/updater';
import { useLocale } from './hooks/useLocale';
import { en, zh } from './locales';
import type { Locale } from '@esengine/editor-core';
import { Loader2, Globe, ChevronDown } from 'lucide-react';
import './styles/App.css';

const coreInstance = Core.create({ debug: true });

const localeService = new LocaleService();
localeService.registerTranslations('en', en);
localeService.registerTranslations('zh', zh);
Core.services.registerInstance(LocaleService, localeService);

Core.services.registerSingleton(GlobalBlackboardService);
Core.services.registerSingleton(CompilerRegistry);

// 在 CompilerRegistry 实例化后，也用 Symbol 注册，用于跨包插件访问
// 注意：registerSingleton 会延迟实例化，所以需要在第一次使用后再注册 Symbol
const compilerRegistryInstance = Core.services.resolve(CompilerRegistry);
Core.services.registerInstance(ICompilerRegistry, compilerRegistryInstance);

const logger = createLogger('App');

function App() {
    const initRef = useRef(false);
    const [pluginLoader] = useState(() => new PluginLoader());
    const { showToast, hideToast } = useToast();
    const [initialized, setInitialized] = useState(false);
    const [projectLoaded, setProjectLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(null);
    const [pluginManager, setPluginManager] = useState<PluginManager | null>(null);
    const [entityStore, setEntityStore] = useState<EntityStoreService | null>(null);
    const [messageHub, setMessageHub] = useState<MessageHub | null>(null);
    const [inspectorRegistry, setInspectorRegistry] = useState<InspectorRegistry | null>(null);
    const [logService, setLogService] = useState<LogService | null>(null);
    const [uiRegistry, setUiRegistry] = useState<UIRegistry | null>(null);
    const [settingsRegistry, setSettingsRegistry] = useState<SettingsRegistry | null>(null);
    const [sceneManager, setSceneManager] = useState<SceneManagerService | null>(null);
    const [notification, setNotification] = useState<INotification | null>(null);
    const [dialog, setDialog] = useState<IDialogExtended | null>(null);
    const [commandManager] = useState(() => new CommandManager());
    const { t, locale, changeLocale } = useLocale();

    // 同步 locale 到 TauriDialogService
    useEffect(() => {
        if (dialog) {
            dialog.setLocale(locale);
        }
    }, [locale, dialog]);
    const [status, setStatus] = useState(t('header.status.initializing'));
    const [panels, setPanels] = useState<FlexDockPanel[]>([]);
    const [pluginUpdateTrigger, setPluginUpdateTrigger] = useState(0);
    const [isRemoteConnected, setIsRemoteConnected] = useState(false);
    const [isProfilerMode, setIsProfilerMode] = useState(false);
    const [showProjectWizard, setShowProjectWizard] = useState(false);

    const {
        showProfiler, setShowProfiler,
        showPortManager, setShowPortManager,
        showSettings, setShowSettings,
        showAbout, setShowAbout,
        showPluginGenerator, setShowPluginGenerator,
        errorDialog, setErrorDialog,
        confirmDialog, setConfirmDialog
    } = useDialogStore();
    const [settingsInitialCategory, setSettingsInitialCategory] = useState<string | undefined>(undefined);
    const [activeDynamicPanels, setActiveDynamicPanels] = useState<string[]>([]);
    const [activePanelId, setActivePanelId] = useState<string | undefined>(undefined);
    const [dynamicPanelTitles, setDynamicPanelTitles] = useState<Map<string, string>>(new Map());
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
    const [compilerDialog, setCompilerDialog] = useState<{
        isOpen: boolean;
        compilerId: string;
        currentFileName?: string;
    }>({ isOpen: false, compilerId: '' });
    const [showLocaleMemu, setShowLocaleMenu] = useState(false);
    const localeMenuRef = useRef<HTMLDivElement>(null);

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

    // 语言菜单点击外部关闭
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (localeMenuRef.current && !localeMenuRef.current.contains(e.target as Node)) {
                setShowLocaleMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 快捷键监听
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        if (sceneManager) {
                            try {
                                await sceneManager.saveScene();
                                const sceneState = sceneManager.getSceneState();
                                showToast(locale === 'zh' ? `已保存场景: ${sceneState.sceneName}` : `Scene saved: ${sceneState.sceneName}`, 'success');
                            } catch (error) {
                                console.error('Failed to save scene:', error);
                                showToast(locale === 'zh' ? '保存场景失败' : 'Failed to save scene', 'error');
                            }
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        handleReloadPlugins();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [sceneManager, locale, currentProjectPath, pluginManager]);

    useEffect(() => {
        if (messageHub) {
            const unsubscribeEnabled = messageHub.subscribe('plugin:enabled', () => {
                setPluginUpdateTrigger((prev) => prev + 1);
            });

            const unsubscribeDisabled = messageHub.subscribe('plugin:disabled', () => {
                setPluginUpdateTrigger((prev) => prev + 1);
            });

            const unsubscribeNotification = messageHub.subscribe('notification:show', (notification: { message: string; type: 'success' | 'error' | 'warning' | 'info'; timestamp: number }) => {
                if (notification && notification.message) {
                    showToast(notification.message, notification.type);
                }
            });

            return () => {
                unsubscribeEnabled();
                unsubscribeDisabled();
                unsubscribeNotification();
            };
        }
    }, [messageHub, showToast]);

    // 监听远程连接状态
    useEffect(() => {
        const checkConnection = () => {
            const profilerService = (window as any).__PROFILER_SERVICE__;
            const connected = profilerService && profilerService.isConnected();

            setIsRemoteConnected((prevConnected) => {
                if (connected !== prevConnected) {
                    // 状态发生变化
                    if (connected) {
                        setStatus(t('header.status.remoteConnected'));
                    } else {
                        if (projectLoaded) {
                            const componentRegistry = Core.services.resolve(ComponentRegistry);
                            const componentCount = componentRegistry?.getAllComponents().length || 0;
                            setStatus(t('header.status.projectOpened') + (componentCount > 0 ? ` (${componentCount} components registered)` : ''));
                        } else {
                            setStatus(t('header.status.ready'));
                        }
                    }
                    return connected;
                }
                return prevConnected;
            });
        };

        const interval = setInterval(checkConnection, 1000);

        return () => clearInterval(interval);
    }, [projectLoaded, t]);

    useEffect(() => {
        const initializeEditor = async () => {
            // 使用 ref 防止 React StrictMode 的双重调用
            if (initRef.current) {
                return;
            }
            initRef.current = true;

            try {
                (window as any).__ECS_FRAMEWORK__ = ECSFramework;

                const editorScene = new Scene();
                Core.setScene(editorScene);

                const serviceRegistry = new ServiceRegistry();
                const services = serviceRegistry.registerAllServices(coreInstance);

                serviceRegistry.setupRemoteLogListener(services.logService);

                const pluginInstaller = new PluginInstaller();
                await pluginInstaller.installBuiltinPlugins(services.pluginManager);

                // 初始化编辑器模块（安装设置、面板等）
                await services.pluginManager.initializeEditor(Core.services);

                services.notification.setCallbacks(showToast, hideToast);
                (services.dialog as IDialogExtended).setConfirmCallback(setConfirmDialog);

                services.messageHub.subscribe('ui:openWindow', (data: any) => {
                    const { windowId } = data;

                    if (windowId === 'profiler') {
                        setShowProfiler(true);
                    } else if (windowId === 'pluginManager') {
                        // 插件管理现在整合到设置窗口中
                        setSettingsInitialCategory('plugins');
                        setShowSettings(true);
                    }
                });

                setInitialized(true);
                setPluginManager(services.pluginManager);
                setEntityStore(services.entityStore);
                setMessageHub(services.messageHub);
                setInspectorRegistry(services.inspectorRegistry);
                setLogService(services.logService);
                setUiRegistry(services.uiRegistry);
                setSettingsRegistry(services.settingsRegistry);
                setSceneManager(services.sceneManager);
                setNotification(services.notification);
                setDialog(services.dialog as IDialogExtended);
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

    useEffect(() => {
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('dynamic-panel:open', (data: any) => {
            const { panelId, title } = data;
            logger.info('Opening dynamic panel:', panelId, 'with title:', title);
            setActiveDynamicPanels((prev) => {
                const newPanels = prev.includes(panelId) ? prev : [...prev, panelId];
                return newPanels;
            });
            setActivePanelId(panelId);

            // 更新动态面板标题
            if (title) {
                setDynamicPanelTitles((prev) => {
                    const newTitles = new Map(prev);
                    newTitles.set(panelId, title);
                    return newTitles;
                });
            }
        });

        return () => unsubscribe?.();
    }, [messageHub]);

    useEffect(() => {
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('editor:fullscreen', (data: any) => {
            const { fullscreen } = data;
            logger.info('Editor fullscreen state changed:', fullscreen);
            setIsEditorFullscreen(fullscreen);
        });

        return () => unsubscribe?.();
    }, [messageHub]);

    useEffect(() => {
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('compiler:open-dialog', (data: {
            compilerId: string;
            currentFileName?: string;
            projectPath?: string;
        }) => {
            logger.info('Opening compiler dialog:', data.compilerId);
            setCompilerDialog({
                isOpen: true,
                compilerId: data.compilerId,
                currentFileName: data.currentFileName
            });
        });

        return () => unsubscribe?.();
    }, [messageHub]);

    const handleOpenRecentProject = async (projectPath: string) => {
        try {
            setIsLoading(true);
            setLoadingMessage(locale === 'zh' ? '步骤 1/3: 打开项目配置...' : 'Step 1/3: Opening project config...');

            const projectService = Core.services.resolve(ProjectService);

            if (!projectService) {
                console.error('Required services not available');
                setIsLoading(false);
                return;
            }

            await projectService.openProject(projectPath);

            // 设置 Tauri project:// 协议的基础路径（用于加载插件等项目文件）
            await TauriAPI.setProjectBasePath(projectPath);

            const settings = SettingsService.getInstance();
            settings.addRecentProject(projectPath);

            setCurrentProjectPath(projectPath);
            // 设置 projectLoaded 为 true，触发主界面渲染（包括 Viewport）
            setProjectLoaded(true);

            // 等待引擎初始化完成（Viewport 渲染后会触发引擎初始化）
            setLoadingMessage(locale === 'zh' ? '步骤 2/3: 初始化引擎和模块...' : 'Step 2/3: Initializing engine and modules...');
            const engineService = EngineService.getInstance();

            // 等待引擎初始化（最多等待 30 秒，因为需要等待 Viewport 渲染）
            const engineReady = await engineService.waitForInitialization(30000);
            if (!engineReady) {
                throw new Error(locale === 'zh' ? '引擎初始化超时' : 'Engine initialization timeout');
            }

            // 初始化模块系统（所有插件的 runtimeModule 会在 PluginManager 安装时自动注册）
            await engineService.initializeModuleSystems();

            // 应用项目的 UI 设计分辨率
            // Apply project's UI design resolution
            const uiResolution = projectService.getUIDesignResolution();
            engineService.setUICanvasSize(uiResolution.width, uiResolution.height);

            setStatus(t('header.status.projectOpened'));

            setLoadingMessage(locale === 'zh' ? '步骤 3/3: 初始化场景...' : 'Step 3/3: Initializing scene...');

            const sceneManagerService = Core.services.resolve(SceneManagerService);
            if (sceneManagerService) {
                await sceneManagerService.newScene();
            }

            if (pluginManager) {
                setLoadingMessage(locale === 'zh' ? '加载项目插件...' : 'Loading project plugins...');
                await pluginLoader.loadProjectPlugins(projectPath, pluginManager);
            }

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

    const handleCreateProject = () => {
        setShowProjectWizard(true);
    };

    const handleCreateProjectFromWizard = async (projectName: string, projectPath: string, _templateId: string) => {
        const fullProjectPath = `${projectPath}\\${projectName}`;

        try {
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

            await projectService.createProject(fullProjectPath);

            setLoadingMessage(locale === 'zh' ? '项目创建成功，正在打开...' : 'Project created, opening...');

            await handleOpenRecentProject(fullProjectPath);
        } catch (error) {
            console.error('Failed to create project:', error);
            setIsLoading(false);

            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('already exists')) {
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
                        handleOpenRecentProject(fullProjectPath).catch((err) => {
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

    const handleBrowseProjectPath = async (): Promise<string | null> => {
        try {
            const path = await TauriAPI.openProjectDialog();
            return path || null;
        } catch (error) {
            console.error('Failed to browse path:', error);
            return null;
        }
    };

    const handleProfilerMode = async () => {
        setIsProfilerMode(true);
        setIsRemoteConnected(true);
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
        if (!sceneManager) {
            console.error('SceneManagerService not available');
            return;
        }

        try {
            await sceneManager.openScene(scenePath);
            const sceneState = sceneManager.getSceneState();
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

    const handleCloseProject = async () => {
        // 卸载项目插件
        if (pluginManager) {
            await pluginLoader.unloadProjectPlugins(pluginManager);
        }

        // 清理模块系统
        const engineService = EngineService.getInstance();
        engineService.clearModuleSystems();

        // 关闭 ProjectService 中的项目
        const projectService = Core.services.tryResolve(ProjectService);
        if (projectService) {
            await projectService.closeProject();
        }

        setProjectLoaded(false);
        setCurrentProjectPath(null);
        setIsProfilerMode(false);
        setStatus(t('header.status.ready'));
    };

    const handleExit = () => {
        window.close();
    };

    const handleLocaleChange = (newLocale: Locale) => {
        changeLocale(newLocale);

        // 通知所有已加载的插件更新语言
        if (pluginManager) {
            pluginManager.setLocale(newLocale);

            // 通过 MessageHub 通知需要重新获取节点模板
            if (messageHub) {
                messageHub.publish('locale:changed', { locale: newLocale });
            }
        }
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

    const handleCreatePlugin = () => {
        setShowPluginGenerator(true);
    };

    const handleReloadPlugins = async () => {
        if (currentProjectPath && pluginManager) {
            try {
                // 1. 关闭所有动态面板
                setActiveDynamicPanels([]);

                // 2. 清空当前面板列表（强制卸载插件面板组件）
                setPanels((prev) => prev.filter((p) =>
                    ['scene-hierarchy', 'inspector', 'console', 'asset-browser'].includes(p.id)
                ));

                // 3. 等待React完成卸载
                await new Promise((resolve) => setTimeout(resolve, 200));

                // 4. 卸载所有项目插件（清理UIRegistry、调用uninstall）
                await pluginLoader.unloadProjectPlugins(pluginManager);

                // 5. 等待卸载完成
                await new Promise((resolve) => setTimeout(resolve, 100));

                // 6. 重新加载插件
                await pluginLoader.loadProjectPlugins(currentProjectPath, pluginManager);

                // 7. 触发面板重新渲染
                setPluginUpdateTrigger((prev) => prev + 1);

                showToast(locale === 'zh' ? '插件已重新加载' : 'Plugins reloaded', 'success');
            } catch (error) {
                console.error('Failed to reload plugins:', error);
                showToast(locale === 'zh' ? '重新加载插件失败' : 'Failed to reload plugins', 'error');
            }
        }
    };

    useEffect(() => {
        if (projectLoaded && entityStore && messageHub && logService && uiRegistry && pluginManager) {
            let corePanels: FlexDockPanel[];

            if (isProfilerMode) {
                corePanels = [
                    {
                        id: 'scene-hierarchy',
                        title: locale === 'zh' ? '场景层级' : 'Scene Hierarchy',
                        content: <SceneHierarchy entityStore={entityStore} messageHub={messageHub} commandManager={commandManager} isProfilerMode={true} />,
                        closable: false
                    },
                    {
                        id: 'inspector',
                        title: locale === 'zh' ? '检视器' : 'Inspector',
                        content: <Inspector entityStore={entityStore} messageHub={messageHub} inspectorRegistry={inspectorRegistry!} projectPath={currentProjectPath} commandManager={commandManager} />,
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
                        content: <SceneHierarchy entityStore={entityStore} messageHub={messageHub} commandManager={commandManager} />,
                        closable: false
                    },
                    {
                        id: 'viewport',
                        title: locale === 'zh' ? '视口' : 'Viewport',
                        content: <Viewport locale={locale} messageHub={messageHub} />,
                        closable: false
                    },
                    {
                        id: 'inspector',
                        title: locale === 'zh' ? '检视器' : 'Inspector',
                        content: <Inspector entityStore={entityStore} messageHub={messageHub} inspectorRegistry={inspectorRegistry!} projectPath={currentProjectPath} commandManager={commandManager} />,
                        closable: false
                    },
                    {
                        id: 'assets',
                        title: locale === 'zh' ? '资产' : 'Assets',
                        content: <AssetBrowser projectPath={currentProjectPath} locale={locale} onOpenScene={handleOpenSceneByPath} />,
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

            // 获取启用的插件面板
            const pluginPanels: FlexDockPanel[] = uiRegistry.getAllPanels()
                .filter((panelDesc) => {
                    if (!panelDesc.component) {
                        return false;
                    }
                    if (panelDesc.isDynamic) {
                        return false;
                    }
                    return true;
                })
                .map((panelDesc) => {
                    const Component = panelDesc.component;
                    return {
                        id: panelDesc.id,
                        title: (panelDesc as any).titleZh && locale === 'zh' ? (panelDesc as any).titleZh : panelDesc.title,
                        content: <Component key={`${panelDesc.id}-${pluginUpdateTrigger}`} projectPath={currentProjectPath} />,
                        closable: panelDesc.closable ?? true
                    };
                });

            // 添加激活的动态面板
            const dynamicPanels: FlexDockPanel[] = activeDynamicPanels
                .filter((panelId) => {
                    const panelDesc = uiRegistry.getPanel(panelId);
                    return panelDesc && panelDesc.component;
                })
                .map((panelId) => {
                    const panelDesc = uiRegistry.getPanel(panelId)!;
                    const Component = panelDesc.component;
                    // 优先使用动态标题，否则使用默认标题
                    const customTitle = dynamicPanelTitles.get(panelId);
                    const defaultTitle = (panelDesc as any).titleZh && locale === 'zh' ? (panelDesc as any).titleZh : panelDesc.title;
                    return {
                        id: panelDesc.id,
                        title: customTitle || defaultTitle,
                        content: <Component projectPath={currentProjectPath} />,
                        closable: panelDesc.closable ?? true
                    };
                });

            setPanels([...corePanels, ...pluginPanels, ...dynamicPanels]);
        }
    }, [projectLoaded, entityStore, messageHub, logService, uiRegistry, pluginManager, locale, currentProjectPath, t, pluginUpdateTrigger, isProfilerMode, handleOpenSceneByPath, activeDynamicPanels, dynamicPanelTitles]);


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
                    onLocaleChange={handleLocaleChange}
                    recentProjects={recentProjects}
                    locale={locale}
                />
                <ProjectCreationWizard
                    isOpen={showProjectWizard}
                    onClose={() => setShowProjectWizard(false)}
                    onCreateProject={handleCreateProjectFromWizard}
                    onBrowsePath={handleBrowseProjectPath}
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
                        onConfirm={() => {
                            confirmDialog.onConfirm();
                            setConfirmDialog(null);
                        }}
                        onCancel={() => {
                            if (confirmDialog.onCancel) {
                                confirmDialog.onCancel();
                            }
                            setConfirmDialog(null);
                        }}
                    />
                )}
            </>
        );
    }

    const projectName = currentProjectPath ? currentProjectPath.split(/[\\/]/).pop() : 'Untitled';

    return (
        <div className="editor-container">
            {!isEditorFullscreen && (
                <>
                    <div className="editor-titlebar" data-tauri-drag-region>
                        <span className="titlebar-project-name">{projectName}</span>
                        <span className="titlebar-app-name">ESEngine Editor</span>
                    </div>
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
                        onOpenPluginManager={() => {
                            setSettingsInitialCategory('plugins');
                            setShowSettings(true);
                        }}
                        onOpenProfiler={() => setShowProfiler(true)}
                        onOpenPortManager={() => setShowPortManager(true)}
                        onOpenSettings={() => setShowSettings(true)}
                        onToggleDevtools={handleToggleDevtools}
                        onOpenAbout={handleOpenAbout}
                        onCreatePlugin={handleCreatePlugin}
                        onReloadPlugins={handleReloadPlugins}
                    />
                    <div className="header-right">
                        <div className="locale-dropdown" ref={localeMenuRef}>
                            <button
                                className="toolbar-btn locale-btn"
                                onClick={() => setShowLocaleMenu(!showLocaleMemu)}
                            >
                                <Globe size={14} />
                                <span className="locale-label">{locale === 'en' ? 'EN' : '中'}</span>
                                <ChevronDown size={10} />
                            </button>
                            {showLocaleMemu && (
                                <div className="locale-menu">
                                    <button
                                        className={`locale-menu-item ${locale === 'en' ? 'active' : ''}`}
                                        onClick={() => {
                                            handleLocaleChange('en');
                                            setShowLocaleMenu(false);
                                        }}
                                    >
                                        English
                                    </button>
                                    <button
                                        className={`locale-menu-item ${locale === 'zh' ? 'active' : ''}`}
                                        onClick={() => {
                                            handleLocaleChange('zh');
                                            setShowLocaleMenu(false);
                                        }}
                                    >
                                        中文
                                    </button>
                                </div>
                            )}
                        </div>
                        <span className="status">{status}</span>
                    </div>
                    </div>
                </>
            )}

            <CompilerConfigDialog
                isOpen={compilerDialog.isOpen}
                compilerId={compilerDialog.compilerId}
                projectPath={currentProjectPath}
                currentFileName={compilerDialog.currentFileName}
                onClose={() => setCompilerDialog({ isOpen: false, compilerId: '' })}
                onCompileComplete={(result) => {
                    if (result.success) {
                        showToast(result.message, 'success');
                    } else {
                        showToast(result.message, 'error');
                    }
                }}
            />

            <div className="editor-content">
                <FlexLayoutDockContainer
                    panels={panels}
                    activePanelId={activePanelId}
                    onPanelClose={(panelId) => {
                        logger.info('Panel closed:', panelId);
                        setActiveDynamicPanels((prev) => prev.filter((id) => id !== panelId));
                    }}
                />
            </div>

            <div className="editor-footer">
                <span>{t('footer.plugins')}: {pluginManager?.getAllPlugins().length ?? 0}</span>
                <span>{t('footer.entities')}: {entityStore?.getAllEntities().length ?? 0}</span>
                <span>{t('footer.core')}: {t('footer.active')}</span>
            </div>


            {showProfiler && (
                <ProfilerWindow onClose={() => setShowProfiler(false)} />
            )}

            {showPortManager && (
                <PortManager onClose={() => setShowPortManager(false)} />
            )}

            {showSettings && settingsRegistry && (
                <SettingsWindow
                    onClose={() => {
                        setShowSettings(false);
                        setSettingsInitialCategory(undefined);
                    }}
                    settingsRegistry={settingsRegistry}
                    initialCategoryId={settingsInitialCategory}
                />
            )}

            {showAbout && (
                <AboutDialog onClose={() => setShowAbout(false)} locale={locale} />
            )}

            {showPluginGenerator && (
                <PluginGeneratorWindow
                    onClose={() => setShowPluginGenerator(false)}
                    projectPath={currentProjectPath}
                    locale={locale}
                    onSuccess={async () => {
                        if (currentProjectPath && pluginManager) {
                            await pluginLoader.loadProjectPlugins(currentProjectPath, pluginManager);
                        }
                    }}
                />
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
                    onConfirm={() => {
                        confirmDialog.onConfirm();
                        setConfirmDialog(null);
                    }}
                    onCancel={() => {
                        if (confirmDialog.onCancel) {
                            confirmDialog.onCancel();
                        }
                        setConfirmDialog(null);
                    }}
                />
            )}
        </div>
    );
}

function AppWithToast() {
    return (
        <ToastProvider>
            <App />
        </ToastProvider>
    );
}

export default AppWithToast;
