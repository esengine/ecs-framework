import { React, useState, useRef, useEffect, type ReactNode, Icons } from '@esengine/editor-runtime';

const { GripVertical } = Icons;

interface DraggablePanelProps {
    title: string | ReactNode;
    icon?: ReactNode;
    isVisible: boolean;
    onClose: () => void;
    width?: number;
    maxHeight?: number;
    initialPosition?: { x: number; y: number };
    headerActions?: ReactNode;
    children: ReactNode;
    footer?: ReactNode | false;
}

/**
 * 可拖动面板通用组件
 * 提供标题栏拖动、关闭按钮等基础功能
 */
export const DraggablePanel: React.FC<DraggablePanelProps> = ({
    title,
    icon,
    isVisible,
    onClose,
    width = 400,
    maxHeight = 600,
    initialPosition = { x: 20, y: 100 },
    headerActions,
    children,
    footer
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isVisible) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // 限制面板在视口内
            const maxX = window.innerWidth - width;
            const maxY = window.innerHeight - 100;

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, width]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!panelRef.current) return;

        const rect = panelRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
    };

    if (!isVisible) return null;

    return (
        <div
            ref={panelRef}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${width}px`,
                maxHeight: `${maxHeight}px`,
                backgroundColor: '#1e1e1e',
                border: '1px solid #3f3f3f',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                userSelect: isDragging ? 'none' : 'auto'
            }}
        >
            {/* 可拖动标题栏 */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #3f3f3f',
                    backgroundColor: '#252525',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <GripVertical size={14} color="#666" style={{ flexShrink: 0 }} />
                    {icon}
                    {typeof title === 'string' ? (
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#fff'
                        }}>
                            {title}
                        </span>
                    ) : (
                        title
                    )}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {headerActions}
                    <button
                        onClick={onClose}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: '#3c3c3c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ccc',
                            fontSize: '11px',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* 内容区域 */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {children}
            </div>

            {/* 页脚 */}
            {footer && (
                <div style={{
                    borderTop: '1px solid #3f3f3f',
                    backgroundColor: '#252525',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px'
                }}>
                    {footer}
                </div>
            )}
        </div>
    );
};
