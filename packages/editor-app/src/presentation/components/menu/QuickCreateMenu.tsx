import React, { useRef, useEffect } from 'react';
import { NodeTemplate, NodeTemplates } from '@esengine/behavior-tree';
import { Search, X, LucideIcon } from 'lucide-react';

interface QuickCreateMenuProps {
    visible: boolean;
    position: { x: number; y: number };
    searchText: string;
    selectedIndex: number;
    mode: 'create' | 'replace';
    iconMap: Record<string, LucideIcon>;
    onSearchChange: (text: string) => void;
    onIndexChange: (index: number) => void;
    onNodeSelect: (template: NodeTemplate) => void;
    onClose: () => void;
}

export const QuickCreateMenu: React.FC<QuickCreateMenuProps> = ({
    visible,
    position,
    searchText,
    selectedIndex,
    iconMap,
    onSearchChange,
    onIndexChange,
    onNodeSelect,
    onClose
}) => {
    const selectedNodeRef = useRef<HTMLDivElement>(null);

    const allTemplates = NodeTemplates.getAllTemplates();
    const searchTextLower = searchText.toLowerCase();
    const filteredTemplates = searchTextLower
        ? allTemplates.filter((t: NodeTemplate) => {
            const className = t.className || '';
            return t.displayName.toLowerCase().includes(searchTextLower) ||
                t.description.toLowerCase().includes(searchTextLower) ||
                t.category.toLowerCase().includes(searchTextLower) ||
                className.toLowerCase().includes(searchTextLower);
        })
        : allTemplates;

    useEffect(() => {
        if (selectedNodeRef.current) {
            selectedNodeRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    if (!visible) return null;

    return (
        <>
            <style>{`
                .quick-create-menu-list::-webkit-scrollbar {
                    width: 8px;
                }
                .quick-create-menu-list::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }
                .quick-create-menu-list::-webkit-scrollbar-thumb {
                    background: #3c3c3c;
                    border-radius: 4px;
                }
                .quick-create-menu-list::-webkit-scrollbar-thumb:hover {
                    background: #4c4c4c;
                }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: '300px',
                    maxHeight: '400px',
                    backgroundColor: '#2d2d2d',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* 搜索框 */}
                <div style={{
                    padding: '12px',
                    borderBottom: '1px solid #3c3c3c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Search size={16} style={{ color: '#999', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="搜索节点..."
                        autoFocus
                        value={searchText}
                        onChange={(e) => {
                            onSearchChange(e.target.value);
                            onIndexChange(0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                onClose();
                            } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                onIndexChange(Math.min(selectedIndex + 1, filteredTemplates.length - 1));
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                onIndexChange(Math.max(selectedIndex - 1, 0));
                            } else if (e.key === 'Enter' && filteredTemplates.length > 0) {
                                e.preventDefault();
                                const selectedTemplate = filteredTemplates[selectedIndex];
                                if (selectedTemplate) {
                                    onNodeSelect(selectedTemplate);
                                }
                            }
                        }}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#ccc',
                            fontSize: '14px',
                            padding: '4px'
                        }}
                    />
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* 节点列表 */}
                <div
                    className="quick-create-menu-list"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '8px'
                    }}
                >
                    {filteredTemplates.length === 0 ? (
                        <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: '#666',
                            fontSize: '12px'
                        }}>
                            未找到匹配的节点
                        </div>
                    ) : (
                        filteredTemplates.map((template: NodeTemplate, index: number) => {
                            const IconComponent = template.icon ? iconMap[template.icon] : null;
                            const className = template.className || '';
                            const isSelected = index === selectedIndex;
                            return (
                                <div
                                    key={index}
                                    ref={isSelected ? selectedNodeRef : null}
                                    onClick={() => onNodeSelect(template)}
                                    onMouseEnter={() => onIndexChange(index)}
                                    style={{
                                        padding: '8px 12px',
                                        marginBottom: '4px',
                                        backgroundColor: isSelected ? '#0e639c' : '#1e1e1e',
                                        borderLeft: `3px solid ${template.color || '#666'}`,
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        transform: isSelected ? 'translateX(2px)' : 'translateX(0)'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '4px'
                                    }}>
                                        {IconComponent && (
                                            <IconComponent size={14} style={{ color: template.color || '#999', flexShrink: 0 }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                color: '#ccc',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                marginBottom: '2px'
                                            }}>
                                                {template.displayName}
                                            </div>
                                            {className && (
                                                <div style={{
                                                    color: '#666',
                                                    fontSize: '10px',
                                                    fontFamily: 'Consolas, Monaco, monospace',
                                                    opacity: 0.8
                                                }}>
                                                    {className}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        lineHeight: '1.4',
                                        marginBottom: '2px'
                                    }}>
                                        {template.description}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#666'
                                    }}>
                                        {template.category}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};
