import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import '../styles/ContextMenu.css';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
  /** 快捷键提示文本 */
  shortcut?: string;
  /** 子菜单项 */
  children?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

interface SubMenuProps {
  items: ContextMenuItem[];
  parentRect: DOMRect;
  onClose: () => void;
}

/**
 * 子菜单组件
 */
function SubMenu({ items, parentRect, onClose }: SubMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
    const [submenuRect, setSubmenuRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 默认在父菜单右侧显示
            let x = parentRect.right;
            let y = parentRect.top;

            // 如果右侧空间不足，显示在左侧
            if (x + rect.width > viewportWidth) {
                x = parentRect.left - rect.width;
            }

            // 如果底部空间不足，向上调整
            if (y + rect.height > viewportHeight) {
                y = Math.max(0, viewportHeight - rect.height - 10);
            }

            setPosition({ x, y });
        }
    }, [parentRect]);

    const handleItemMouseEnter = useCallback((index: number, item: ContextMenuItem, e: React.MouseEvent) => {
        if (item.children && item.children.length > 0) {
            setActiveSubmenuIndex(index);
            const itemRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setSubmenuRect(itemRect);
        } else {
            setActiveSubmenuIndex(null);
            setSubmenuRect(null);
        }
    }, []);

    return (
        <div
            ref={menuRef}
            className="context-menu submenu"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={index} className="context-menu-separator" />;
                }

                const hasChildren = item.children && item.children.length > 0;

                return (
                    <div
                        key={index}
                        className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${hasChildren ? 'has-submenu' : ''}`}
                        onClick={() => {
                            if (!item.disabled && !hasChildren) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        onMouseEnter={(e) => handleItemMouseEnter(index, item, e)}
                        onMouseLeave={() => {
                            if (!item.children) {
                                setActiveSubmenuIndex(null);
                            }
                        }}
                    >
                        {item.icon && <span className="context-menu-icon">{item.icon}</span>}
                        <span className="context-menu-label">{item.label}</span>
                        {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
                        {hasChildren && <ChevronRight size={12} className="context-menu-arrow" />}
                        {activeSubmenuIndex === index && submenuRect && item.children && (
                            <SubMenu
                                items={item.children}
                                parentRect={submenuRect}
                                onClose={onClose}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);
    const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
    const [submenuRect, setSubmenuRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const adjustPosition = () => {
            if (menuRef.current) {
                const menu = menuRef.current;
                const rect = menu.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const STATUS_BAR_HEIGHT = 28;
                const TITLE_BAR_HEIGHT = 32;

                let x = position.x;
                let y = position.y;

                if (x + rect.width > viewportWidth - 10) {
                    x = Math.max(10, viewportWidth - rect.width - 10);
                }

                if (y + rect.height > viewportHeight - STATUS_BAR_HEIGHT - 10) {
                    y = Math.max(TITLE_BAR_HEIGHT + 10, viewportHeight - STATUS_BAR_HEIGHT - rect.height - 10);
                }

                if (x < 10) {
                    x = 10;
                }

                if (y < TITLE_BAR_HEIGHT + 10) {
                    y = TITLE_BAR_HEIGHT + 10;
                }

                setAdjustedPosition({ x, y });
            }
        };

        adjustPosition();
        const rafId = requestAnimationFrame(adjustPosition);

        return () => cancelAnimationFrame(rafId);
    }, [position]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleItemMouseEnter = useCallback((index: number, item: ContextMenuItem, e: React.MouseEvent) => {
        if (item.children && item.children.length > 0) {
            setActiveSubmenuIndex(index);
            const itemRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setSubmenuRect(itemRect);
        } else {
            setActiveSubmenuIndex(null);
            setSubmenuRect(null);
        }
    }, []);

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`
            }}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={index} className="context-menu-separator" />;
                }

                const hasChildren = item.children && item.children.length > 0;

                return (
                    <div
                        key={index}
                        className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${hasChildren ? 'has-submenu' : ''}`}
                        onClick={() => {
                            if (!item.disabled && !hasChildren) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        onMouseEnter={(e) => handleItemMouseEnter(index, item, e)}
                        onMouseLeave={() => {
                            if (!item.children) {
                                setActiveSubmenuIndex(null);
                            }
                        }}
                    >
                        {item.icon && <span className="context-menu-icon">{item.icon}</span>}
                        <span className="context-menu-label">{item.label}</span>
                        {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
                        {hasChildren && <ChevronRight size={12} className="context-menu-arrow" />}
                        {activeSubmenuIndex === index && submenuRect && item.children && (
                            <SubMenu
                                items={item.children}
                                parentRect={submenuRect}
                                onClose={onClose}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
