import { useEffect, useRef, useState } from 'react';
import '../styles/ContextMenu.css';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    useEffect(() => {
        if (menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let x = position.x;
            let y = position.y;

            if (x + rect.width > viewportWidth) {
                x = Math.max(0, viewportWidth - rect.width - 10);
            }

            if (y + rect.height > viewportHeight) {
                y = Math.max(0, viewportHeight - rect.height - 10);
            }

            if (x !== position.x || y !== position.y) {
                setAdjustedPosition({ x, y });
            }
        }
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

                return (
                    <div
                        key={index}
                        className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
                        onClick={() => {
                            if (!item.disabled) {
                                item.onClick();
                                onClose();
                            }
                        }}
                    >
                        {item.icon && <span className="context-menu-icon">{item.icon}</span>}
                        <span className="context-menu-label">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
