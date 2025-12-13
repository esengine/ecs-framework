import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import '../styles/ContextMenu.css';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
  /** 快捷键提示文本 | Shortcut hint text */
  shortcut?: string;
  /** 子菜单项 | Submenu items */
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
  level: number;
}

/**
 * 计算子菜单位置，处理屏幕边界
 * Calculate submenu position, handle screen boundaries
 */
function calculateSubmenuPosition(
    parentRect: DOMRect,
    menuWidth: number,
    menuHeight: number
): { x: number; y: number; flipHorizontal: boolean } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10;

    let x = parentRect.right;
    let y = parentRect.top;
    let flipHorizontal = false;

    // 检查右侧空间是否足够 | Check if there's enough space on the right
    if (x + menuWidth > viewportWidth - padding) {
        // 尝试显示在左侧 | Try to show on the left side
        const leftPosition = parentRect.left - menuWidth;
        if (leftPosition >= padding) {
            x = leftPosition;
            flipHorizontal = true;
        } else {
            // 两侧都不够，选择空间更大的一侧 | Neither side has enough space, choose the larger one
            if (parentRect.left > viewportWidth - parentRect.right) {
                x = padding;
                flipHorizontal = true;
            } else {
                x = viewportWidth - menuWidth - padding;
            }
        }
    }

    // 检查底部空间是否足够 | Check if there's enough space at the bottom
    if (y + menuHeight > viewportHeight - padding) {
        y = Math.max(padding, viewportHeight - menuHeight - padding);
    }

    // 确保不超出顶部 | Ensure it doesn't go above the top
    if (y < padding) {
        y = padding;
    }

    return { x, y, flipHorizontal };
}

/**
 * 子菜单组件
 * SubMenu component
 */
function SubMenu({ items, parentRect, onClose, level }: SubMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
    const [submenuRect, setSubmenuRect] = useState<DOMRect | null>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 计算位置 | Calculate position
    useEffect(() => {
        if (menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const { x, y } = calculateSubmenuPosition(parentRect, rect.width, rect.height);
            setPosition({ x, y });
        }
    }, [parentRect]);

    // 清理定时器 | Cleanup timer
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const handleItemMouseEnter = useCallback((index: number, item: ContextMenuItem, e: React.MouseEvent) => {
        // 清除关闭定时器 | Clear close timer
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        if (item.children && item.children.length > 0) {
            setActiveSubmenuIndex(index);
            const itemRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setSubmenuRect(itemRect);
        } else {
            setActiveSubmenuIndex(null);
            setSubmenuRect(null);
        }
    }, []);

    const handleItemMouseLeave = useCallback((item: ContextMenuItem) => {
        if (item.children && item.children.length > 0) {
            // 延迟关闭子菜单，给用户时间移动到子菜单
            // Delay closing submenu to give user time to move to it
            closeTimeoutRef.current = setTimeout(() => {
                setActiveSubmenuIndex(null);
                setSubmenuRect(null);
            }, 150);
        }
    }, []);

    const handleSubmenuMouseEnter = useCallback(() => {
        // 鼠标进入子菜单区域，取消关闭定时器
        // Mouse entered submenu area, cancel close timer
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    // 初始位置在屏幕外，等待计算后显示
    // Initial position off-screen, wait for calculation before showing
    const style: React.CSSProperties = position
        ? { left: `${position.x}px`, top: `${position.y}px`, opacity: 1 }
        : { left: '-9999px', top: '-9999px', opacity: 0 };

    return (
        <div
            ref={menuRef}
            className="context-menu submenu"
            style={style}
            onMouseEnter={handleSubmenuMouseEnter}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={index} className="context-menu-separator" />;
                }

                const hasChildren = item.children && item.children.length > 0;

                return (
                    <div
                        key={index}
                        className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${hasChildren ? 'has-submenu' : ''} ${activeSubmenuIndex === index ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!item.disabled && !hasChildren) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        onMouseEnter={(e) => handleItemMouseEnter(index, item, e)}
                        onMouseLeave={() => handleItemMouseLeave(item)}
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
                                level={level + 1}
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
    const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);
    const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);
    const [submenuRect, setSubmenuRect] = useState<DOMRect | null>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 计算调整后的位置 | Calculate adjusted position
    useEffect(() => {
        const adjustPosition = () => {
            if (menuRef.current) {
                const menu = menuRef.current;
                const rect = menu.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const STATUS_BAR_HEIGHT = 28;
                const TITLE_BAR_HEIGHT = 32;
                const padding = 10;

                let x = position.x;
                let y = position.y;

                // 检查右边界 | Check right boundary
                if (x + rect.width > viewportWidth - padding) {
                    x = Math.max(padding, viewportWidth - rect.width - padding);
                }

                // 检查下边界 | Check bottom boundary
                if (y + rect.height > viewportHeight - STATUS_BAR_HEIGHT - padding) {
                    y = Math.max(TITLE_BAR_HEIGHT + padding, viewportHeight - STATUS_BAR_HEIGHT - rect.height - padding);
                }

                // 确保不超出左边界 | Ensure not beyond left boundary
                if (x < padding) {
                    x = padding;
                }

                // 确保不超出上边界 | Ensure not beyond top boundary
                if (y < TITLE_BAR_HEIGHT + padding) {
                    y = TITLE_BAR_HEIGHT + padding;
                }

                setAdjustedPosition({ x, y });
            }
        };

        adjustPosition();
        const rafId = requestAnimationFrame(adjustPosition);

        return () => cancelAnimationFrame(rafId);
    }, [position]);

    // 点击外部关闭 | Close on click outside
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

        // 使用 mousedown 而不是 click，以便更快响应
        // Use mousedown instead of click for faster response
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // 清理定时器 | Cleanup timer
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const handleItemMouseEnter = useCallback((index: number, item: ContextMenuItem, e: React.MouseEvent) => {
        // 清除关闭定时器 | Clear close timer
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        if (item.children && item.children.length > 0) {
            setActiveSubmenuIndex(index);
            const itemRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setSubmenuRect(itemRect);
        } else {
            setActiveSubmenuIndex(null);
            setSubmenuRect(null);
        }
    }, []);

    const handleItemMouseLeave = useCallback((item: ContextMenuItem) => {
        if (item.children && item.children.length > 0) {
            // 延迟关闭子菜单，给用户时间移动到子菜单
            // Delay closing submenu to give user time to move to it
            closeTimeoutRef.current = setTimeout(() => {
                setActiveSubmenuIndex(null);
                setSubmenuRect(null);
            }, 150);
        }
    }, []);

    const handleSubmenuMouseEnter = useCallback(() => {
        // 鼠标进入子菜单区域，取消关闭定时器
        // Mouse entered submenu area, cancel close timer
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    // 初始位置在屏幕外，等待计算后显示
    // Initial position off-screen, wait for calculation before showing
    const style: React.CSSProperties = adjustedPosition
        ? { left: `${adjustedPosition.x}px`, top: `${adjustedPosition.y}px`, opacity: 1 }
        : { left: '-9999px', top: '-9999px', opacity: 0 };

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={style}
            onMouseEnter={handleSubmenuMouseEnter}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={index} className="context-menu-separator" />;
                }

                const hasChildren = item.children && item.children.length > 0;

                return (
                    <div
                        key={index}
                        className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${hasChildren ? 'has-submenu' : ''} ${activeSubmenuIndex === index ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!item.disabled && !hasChildren) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        onMouseEnter={(e) => handleItemMouseEnter(index, item, e)}
                        onMouseLeave={() => handleItemMouseLeave(item)}
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
                                level={1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
