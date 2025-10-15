import { useState, useRef, useEffect } from 'react';
import '../styles/MenuBar.css';

interface MenuItem {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
  onClick?: () => void;
}

interface MenuBarProps {
  locale?: string;
  onNewScene?: () => void;
  onOpenScene?: () => void;
  onSaveScene?: () => void;
  onSaveSceneAs?: () => void;
  onOpenProject?: () => void;
  onCloseProject?: () => void;
  onExit?: () => void;
  onOpenPluginManager?: () => void;
  onToggleDevtools?: () => void;
}

export function MenuBar({
  locale = 'en',
  onNewScene,
  onOpenScene,
  onSaveScene,
  onSaveSceneAs,
  onOpenProject,
  onCloseProject,
  onExit,
  onOpenPluginManager,
  onToggleDevtools
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
        help: 'Help',
        documentation: 'Documentation',
        about: 'About',
        devtools: 'Developer Tools'
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
        help: '帮助',
        documentation: '文档',
        about: '关于',
        devtools: '开发者工具'
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
      { label: t('sceneHierarchy'), disabled: true },
      { label: t('inspector'), disabled: true },
      { label: t('assets'), disabled: true },
      { label: t('console'), disabled: true },
      { label: t('viewport'), disabled: true },
      { separator: true },
      { label: t('pluginManager'), onClick: onOpenPluginManager },
      { separator: true },
      { label: t('devtools'), onClick: onToggleDevtools }
    ],
    help: [
      { label: t('documentation'), disabled: true },
      { separator: true },
      { label: t('about'), disabled: true }
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
    if (!item.disabled && !item.separator && item.onClick) {
      item.onClick();
      setOpenMenu(null);
    }
  };

  return (
    <div className="menu-bar" ref={menuRef}>
      {Object.keys(menus).map(menuKey => (
        <div key={menuKey} className="menu-item">
          <button
            className={`menu-button ${openMenu === menuKey ? 'active' : ''}`}
            onClick={() => handleMenuClick(menuKey)}
          >
            {t(menuKey)}
          </button>
          {openMenu === menuKey && (
            <div className="menu-dropdown">
              {menus[menuKey].map((item, index) => {
                if (item.separator) {
                  return <div key={index} className="menu-separator" />;
                }
                return (
                  <button
                    key={index}
                    className={`menu-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => handleMenuItemClick(item)}
                    disabled={item.disabled}
                  >
                    <span>{item.label}</span>
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
