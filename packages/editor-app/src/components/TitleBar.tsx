import { useState, useRef, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { UIRegistry, MessageHub, PluginManager } from '@esengine/editor-core';
import type { MenuItem as PluginMenuItem } from '@esengine/editor-core';
import * as LucideIcons from 'lucide-react';
import '../styles/TitleBar.css';

interface MenuItem {
    label?: string;
    shortcut?: string;
    icon?: string;
    disabled?: boolean;
    separator?: boolean;
    submenu?: MenuItem[];
    onClick?: () => void;
}

interface TitleBarProps {
    projectName?: string;
    locale?: string;
    uiRegistry?: UIRegistry;
    messageHub?: MessageHub;
    pluginManager?: PluginManager;
    onNewScene?: () => void;
    onOpenScene?: () => void;
    onSaveScene?: () => void;
    onSaveSceneAs?: () => void;
    onOpenProject?: () => void;
    onCloseProject?: () => void;
    onExit?: () => void;
    onOpenPluginManager?: () => void;
    onOpenProfiler?: () => void;
    onOpenPortManager?: () => void;
    onOpenSettings?: () => void;
    onToggleDevtools?: () => void;
    onOpenAbout?: () => void;
    onCreatePlugin?: () => void;
    onReloadPlugins?: () => void;
    onOpenBuildSettings?: () => void;
}

export function TitleBar({
    projectName = 'Untitled',
    locale = 'en',
    uiRegistry,
    messageHub,
    pluginManager,
    onNewScene,
    onOpenScene,
    onSaveScene,
    onSaveSceneAs,
    onOpenProject,
    onCloseProject,
    onExit,
    onOpenPluginManager,
    onOpenProfiler: _onOpenProfiler,
    onOpenPortManager,
    onOpenSettings,
    onToggleDevtools,
    onOpenAbout,
    onCreatePlugin,
    onReloadPlugins,
    onOpenBuildSettings
}: TitleBarProps) {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [pluginMenuItems, setPluginMenuItems] = useState<PluginMenuItem[]>([]);
    const [isMaximized, setIsMaximized] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const appWindow = getCurrentWindow();

    const updateMenuItems = () => {
        if (uiRegistry) {
            const items = uiRegistry.getChildMenus('window');
            setPluginMenuItems(items);
        }
    };

    useEffect(() => {
        updateMenuItems();
    }, [uiRegistry, pluginManager]);

    useEffect(() => {
        if (messageHub) {
            const unsubscribeInstalled = messageHub.subscribe('plugin:installed', () => {
                updateMenuItems();
            });

            const unsubscribeEnabled = messageHub.subscribe('plugin:enabled', () => {
                updateMenuItems();
            });

            const unsubscribeDisabled = messageHub.subscribe('plugin:disabled', () => {
                updateMenuItems();
            });

            return () => {
                unsubscribeInstalled();
                unsubscribeEnabled();
                unsubscribeDisabled();
            };
        }
    }, [messageHub, uiRegistry, pluginManager]);

    useEffect(() => {
        const checkMaximized = async () => {
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        };

        checkMaximized();

        const unlisten = appWindow.onResized(async () => {
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        });

        return () => {
            unlisten.then(fn => fn());
        };
    }, []);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            en: {
                file: 'File',
                newScene: 'New Scene',
                openScene: 'Open Scene',
                saveScene: 'Save Scene',
                saveSceneAs: 'Save Scene As...',
                openProject: 'Open Project',
                closeProject: 'Close Project',
                exit: 'Exit',
                edit: 'Edit',
                undo: 'Undo',
                redo: 'Redo',
                cut: 'Cut',
                copy: 'Copy',
                paste: 'Paste',
                delete: 'Delete',
                selectAll: 'Select All',
                window: 'Window',
                sceneHierarchy: 'Scene Hierarchy',
                inspector: 'Inspector',
                assets: 'Assets',
                console: 'Console',
                viewport: 'Viewport',
                pluginManager: 'Plugin Manager',
                tools: 'Tools',
                createPlugin: 'Create Plugin',
                reloadPlugins: 'Reload Plugins',
                portManager: 'Port Manager',
                settings: 'Settings',
                help: 'Help',
                documentation: 'Documentation',
                checkForUpdates: 'Check for Updates',
                about: 'About',
                devtools: 'Developer Tools',
                buildSettings: 'Build Settings'
            },
            zh: {
                file: '文件',
                newScene: '新建场景',
                openScene: '打开场景',
                saveScene: '保存场景',
                saveSceneAs: '场景另存为...',
                openProject: '打开项目',
                closeProject: '关闭项目',
                exit: '退出',
                edit: '编辑',
                undo: '撤销',
                redo: '重做',
                cut: '剪切',
                copy: '复制',
                paste: '粘贴',
                delete: '删除',
                selectAll: '全选',
                window: '窗口',
                sceneHierarchy: '场景层级',
                inspector: '检视器',
                assets: '资产',
                console: '控制台',
                viewport: '视口',
                pluginManager: '插件管理器',
                tools: '工具',
                createPlugin: '创建插件',
                reloadPlugins: '重新加载插件',
                portManager: '端口管理器',
                settings: '设置',
                help: '帮助',
                documentation: '文档',
                checkForUpdates: '检查更新',
                about: '关于',
                devtools: '开发者工具',
                buildSettings: '构建设置'
            }
        };
        return translations[locale]?.[key] || key;
    };

    const menus: Record<string, MenuItem[]> = {
        file: [
            { label: t('newScene'), shortcut: 'Ctrl+N', onClick: onNewScene },
            { label: t('openScene'), shortcut: 'Ctrl+O', onClick: onOpenScene },
            { separator: true },
            { label: t('saveScene'), shortcut: 'Ctrl+S', onClick: onSaveScene },
            { label: t('saveSceneAs'), shortcut: 'Ctrl+Shift+S', onClick: onSaveSceneAs },
            { separator: true },
            { label: t('buildSettings'), shortcut: 'Ctrl+Shift+B', onClick: onOpenBuildSettings },
            { separator: true },
            { label: t('openProject'), onClick: onOpenProject },
            { label: t('closeProject'), onClick: onCloseProject },
            { separator: true },
            { label: t('exit'), onClick: onExit }
        ],
        edit: [
            { label: t('undo'), shortcut: 'Ctrl+Z', disabled: true },
            { label: t('redo'), shortcut: 'Ctrl+Y', disabled: true },
            { separator: true },
            { label: t('cut'), shortcut: 'Ctrl+X', disabled: true },
            { label: t('copy'), shortcut: 'Ctrl+C', disabled: true },
            { label: t('paste'), shortcut: 'Ctrl+V', disabled: true },
            { label: t('delete'), shortcut: 'Delete', disabled: true },
            { separator: true },
            { label: t('selectAll'), shortcut: 'Ctrl+A', disabled: true }
        ],
        window: [
            ...pluginMenuItems.map((item) => ({
                label: item.label || '',
                icon: item.icon,
                disabled: item.disabled,
                onClick: item.onClick
            })),
            ...(pluginMenuItems.length > 0 ? [{ separator: true } as MenuItem] : []),
            { label: t('pluginManager'), onClick: onOpenPluginManager },
            { separator: true },
            { label: t('devtools'), onClick: onToggleDevtools }
        ],
        tools: [
            { label: t('createPlugin'), onClick: onCreatePlugin },
            { label: t('reloadPlugins'), shortcut: 'Ctrl+R', onClick: onReloadPlugins },
            { separator: true },
            { label: t('portManager'), onClick: onOpenPortManager },
            { separator: true },
            { label: t('settings'), onClick: onOpenSettings }
        ],
        help: [
            { label: t('documentation'), disabled: true },
            { separator: true },
            { label: t('about'), onClick: onOpenAbout }
        ]
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = (menuKey: string) => {
        setOpenMenu(openMenu === menuKey ? null : menuKey);
    };

    const handleMenuItemClick = (item: MenuItem) => {
        if (!item.disabled && !item.separator && item.onClick && item.label) {
            item.onClick();
            setOpenMenu(null);
        }
    };

    const handleMinimize = async () => {
        await appWindow.minimize();
    };

    const handleMaximize = async () => {
        await appWindow.toggleMaximize();
    };

    const handleClose = async () => {
        await appWindow.close();
    };

    return (
        <div className="titlebar">
            {/* Left: Logo and Menu */}
            <div className="titlebar-left">
                <div className="titlebar-logo">
                    <span className="titlebar-logo-text">ES</span>
                </div>
                <div className="titlebar-menus" ref={menuRef}>
                    {Object.keys(menus).map((menuKey) => (
                        <div key={menuKey} className="titlebar-menu-item">
                            <button
                                className={`titlebar-menu-button ${openMenu === menuKey ? 'active' : ''}`}
                                onClick={() => handleMenuClick(menuKey)}
                            >
                                {t(menuKey)}
                            </button>
                            {openMenu === menuKey && menus[menuKey] && (
                                <div className="titlebar-dropdown">
                                    {menus[menuKey].map((item, index) => {
                                        if (item.separator) {
                                            return <div key={index} className="titlebar-dropdown-separator" />;
                                        }
                                        const IconComponent = item.icon ? (LucideIcons as any)[item.icon] : null;
                                        return (
                                            <button
                                                key={index}
                                                className={`titlebar-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                                                onClick={() => handleMenuItemClick(item)}
                                                disabled={item.disabled}
                                            >
                                                <span className="titlebar-dropdown-item-content">
                                                    {IconComponent && <IconComponent size={14} />}
                                                    <span>{item.label || ''}</span>
                                                </span>
                                                {item.shortcut && <span className="titlebar-dropdown-shortcut">{item.shortcut}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: Draggable area */}
            <div className="titlebar-center" data-tauri-drag-region />

            {/* Right: Project name + Window controls */}
            <div className="titlebar-right">
                <span className="titlebar-project-name" data-tauri-drag-region>{projectName}</span>
                <div className="titlebar-window-controls">
                    <button className="titlebar-button" onClick={handleMinimize} title="Minimize">
                    <svg width="10" height="1" viewBox="0 0 10 1">
                        <rect width="10" height="1" fill="currentColor"/>
                    </svg>
                </button>
                <button className="titlebar-button" onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
                    {isMaximized ? (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                            <path d="M2 0v2H0v8h8V8h2V0H2zm6 8H2V4h6v4z" fill="currentColor"/>
                        </svg>
                    ) : (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                            <rect width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1"/>
                        </svg>
                    )}
                </button>
                <button className="titlebar-button titlebar-button-close" onClick={handleClose} title="Close">
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                </button>
                </div>
            </div>
        </div>
    );
}
