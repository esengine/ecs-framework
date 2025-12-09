import { useState, useRef, useEffect } from 'react';
import { UIRegistry, MessageHub, PluginManager } from '@esengine/editor-core';
import type { MenuItem as PluginMenuItem } from '@esengine/editor-core';
import * as LucideIcons from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
import '../styles/MenuBar.css';

interface MenuItem {
  label?: string;
  shortcut?: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
  onClick?: () => void;
}

interface MenuBarProps {
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

export function MenuBar({
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
}: MenuBarProps) {
    const { t } = useLocale();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [pluginMenuItems, setPluginMenuItems] = useState<PluginMenuItem[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

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
            { label: t('menu.edit.undo'), shortcut: 'Ctrl+Z', disabled: true },
            { label: t('menu.edit.redo'), shortcut: 'Ctrl+Y', disabled: true },
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

    return (
        <div className="menu-bar" ref={menuRef}>
            {Object.keys(menus).map((menuKey) => (
                <div key={menuKey} className="menu-item">
                    <button
                        className={`menu-button ${openMenu === menuKey ? 'active' : ''}`}
                        onClick={() => handleMenuClick(menuKey)}
                    >
                        {t(menuTitleKeys[menuKey] || menuKey)}
                    </button>
                    {openMenu === menuKey && menus[menuKey] && (
                        <div className="menu-dropdown">
                            {menus[menuKey].map((item, index) => {
                                if (item.separator) {
                                    return <div key={index} className="menu-separator" />;
                                }
                                const IconComponent = item.icon ? (LucideIcons as any)[item.icon] : null;
                                return (
                                    <button
                                        key={index}
                                        className={`menu-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                                        onClick={() => handleMenuItemClick(item)}
                                        disabled={item.disabled}
                                    >
                                        <span className="menu-item-content">
                                            {IconComponent && <IconComponent size={16} />}
                                            <span>{item.label || ''}</span>
                                        </span>
                                        {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
