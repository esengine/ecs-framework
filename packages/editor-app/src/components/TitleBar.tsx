import { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { UIRegistry, MessageHub, PluginManager, CommandManager } from '@esengine/editor-core';
import type { MenuItem as PluginMenuItem } from '@esengine/editor-core';
import * as LucideIcons from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
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
    uiRegistry?: UIRegistry;
    messageHub?: MessageHub;
    pluginManager?: PluginManager;
    commandManager?: CommandManager;
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
    uiRegistry,
    messageHub,
    pluginManager,
    commandManager,
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
    const { t } = useLocale();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [pluginMenuItems, setPluginMenuItems] = useState<PluginMenuItem[]>([]);
    const [isMaximized, setIsMaximized] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const appWindow = getCurrentWindow();

    // Update undo/redo state | 更新撤销/重做状态
    const updateUndoRedoState = useCallback(() => {
        if (commandManager) {
            setCanUndo(commandManager.canUndo());
            setCanRedo(commandManager.canRedo());
        }
    }, [commandManager]);

    // Handle undo | 处理撤销
    const handleUndo = useCallback(() => {
        if (commandManager && commandManager.canUndo()) {
            commandManager.undo();
            updateUndoRedoState();
        }
    }, [commandManager, updateUndoRedoState]);

    // Handle redo | 处理重做
    const handleRedo = useCallback(() => {
        if (commandManager && commandManager.canRedo()) {
            commandManager.redo();
            updateUndoRedoState();
        }
    }, [commandManager, updateUndoRedoState]);

    // Update undo/redo state periodically | 定期更新撤销/重做状态
    useEffect(() => {
        updateUndoRedoState();
        const interval = setInterval(updateUndoRedoState, 100);
        return () => clearInterval(interval);
    }, [updateUndoRedoState]);

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

    const menus: Record<string, MenuItem[]> = {
        file: [
            { label: t('menu.file.newScene'), shortcut: 'Ctrl+N', onClick: onNewScene },
            { label: t('menu.file.openScene'), shortcut: 'Ctrl+O', onClick: onOpenScene },
            { separator: true },
            { label: t('menu.file.saveScene'), shortcut: 'Ctrl+S', onClick: onSaveScene },
            { label: t('menu.file.saveSceneAs'), shortcut: 'Ctrl+Shift+S', onClick: onSaveSceneAs },
            { separator: true },
            { label: t('menu.file.buildSettings'), shortcut: 'Ctrl+Shift+B', onClick: onOpenBuildSettings },
            { separator: true },
            { label: t('menu.file.openProject'), onClick: onOpenProject },
            { label: t('menu.file.closeProject'), onClick: onCloseProject },
            { separator: true },
            { label: t('menu.file.exit'), onClick: onExit }
        ],
        edit: [
            { label: t('menu.edit.undo'), shortcut: 'Ctrl+Z', disabled: !canUndo, onClick: handleUndo },
            { label: t('menu.edit.redo'), shortcut: 'Ctrl+Y', disabled: !canRedo, onClick: handleRedo },
            { separator: true },
            { label: t('menu.edit.cut'), shortcut: 'Ctrl+X', disabled: true },
            { label: t('menu.edit.copy'), shortcut: 'Ctrl+C', disabled: true },
            { label: t('menu.edit.paste'), shortcut: 'Ctrl+V', disabled: true },
            { label: t('menu.edit.delete'), shortcut: 'Delete', disabled: true },
            { separator: true },
            { label: t('menu.edit.selectAll'), shortcut: 'Ctrl+A', disabled: true }
        ],
        window: [
            ...pluginMenuItems.map((item) => ({
                label: item.label || '',
                icon: item.icon,
                disabled: item.disabled,
                onClick: item.onClick
            })),
            ...(pluginMenuItems.length > 0 ? [{ separator: true } as MenuItem] : []),
            { label: t('menu.window.pluginManager'), onClick: onOpenPluginManager },
            { separator: true },
            { label: t('menu.window.devtools'), onClick: onToggleDevtools }
        ],
        tools: [
            { label: t('menu.tools.createPlugin'), onClick: onCreatePlugin },
            { label: t('menu.tools.reloadPlugins'), shortcut: 'Ctrl+R', onClick: onReloadPlugins },
            { separator: true },
            { label: t('menu.tools.portManager'), onClick: onOpenPortManager },
            { separator: true },
            { label: t('menu.tools.settings'), onClick: onOpenSettings }
        ],
        help: [
            { label: t('menu.help.documentation'), disabled: true },
            { separator: true },
            { label: t('menu.help.about'), onClick: onOpenAbout }
        ]
    };

    // 菜单键到翻译键的映射 | Map menu keys to translation keys
    const menuTitleKeys: Record<string, string> = {
        file: 'menu.file.title',
        edit: 'menu.edit.title',
        window: 'menu.window.title',
        tools: 'menu.tools.title',
        help: 'menu.help.title'
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
                                {t(menuTitleKeys[menuKey] || menuKey)}
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
                    <button className="titlebar-button" onClick={handleMinimize} title={t('titleBar.minimize')}>
                    <svg width="10" height="1" viewBox="0 0 10 1">
                        <rect width="10" height="1" fill="currentColor"/>
                    </svg>
                </button>
                <button className="titlebar-button" onClick={handleMaximize} title={isMaximized ? t('titleBar.restore') : t('titleBar.maximize')}>
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
                <button className="titlebar-button titlebar-button-close" onClick={handleClose} title={t('titleBar.close')}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                </button>
                </div>
            </div>
        </div>
    );
}
