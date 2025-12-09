import { React, useRef, useEffect, useState, useMemo, Icons } from '@esengine/editor-runtime';
import type { LucideIcon } from '@esengine/editor-runtime';
import type { NodeTemplate } from '@esengine/behavior-tree';
import { NodeFactory } from '../../infrastructure/factories/NodeFactory';
import { useBTLocale } from '../../hooks/useBTLocale';

const { Search, X, ChevronDown, ChevronRight } = Icons;

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

interface CategoryGroup {
    category: string;
    templates: NodeTemplate[];
    isExpanded: boolean;
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
    const { t } = useBTLocale();
    const selectedNodeRef = useRef<HTMLDivElement>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

    const nodeFactory = useMemo(() => new NodeFactory(), []);
    const allTemplates = useMemo(() => nodeFactory.getAllTemplates(), [nodeFactory]);
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

    const uncategorizedLabel = t('quickCreate.uncategorized');
    const categoryGroups: CategoryGroup[] = React.useMemo(() => {
        const groups = new Map<string, NodeTemplate[]>();

        filteredTemplates.forEach((template: NodeTemplate) => {
            const category = template.category || uncategorizedLabel;
            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category)!.push(template);
        });

        return Array.from(groups.entries()).map(([category, templates]) => ({
            category,
            templates,
            isExpanded: searchTextLower ? true : expandedCategories.has(category)
        })).sort((a, b) => a.category.localeCompare(b.category));
    }, [filteredTemplates, expandedCategories, searchTextLower, uncategorizedLabel]);

    const flattenedTemplates = React.useMemo(() => {
        return categoryGroups.flatMap((group) =>
            group.isExpanded ? group.templates : []
        );
    }, [categoryGroups]);

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    useEffect(() => {
        if (allTemplates.length > 0 && expandedCategories.size === 0) {
            const categories = new Set(allTemplates.map((tmpl) => tmpl.category || uncategorizedLabel));
            setExpandedCategories(categories);
        }
    }, [allTemplates, expandedCategories.size, uncategorizedLabel]);

    useEffect(() => {
        if (shouldAutoScroll && selectedNodeRef.current) {
            selectedNodeRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
            setShouldAutoScroll(false);
        }
    }, [selectedIndex, shouldAutoScroll]);

    if (!visible) return null;

    let globalIndex = -1;

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
                .category-header {
                    transition: background-color 0.15s;
                }
                .category-header:hover {
                    background-color: #3c3c3c;
                }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: '300px',
                    maxHeight: '500px',
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
                        placeholder={t('quickCreate.searchPlaceholder')}
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
                                setShouldAutoScroll(true);
                                onIndexChange(Math.min(selectedIndex + 1, flattenedTemplates.length - 1));
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setShouldAutoScroll(true);
                                onIndexChange(Math.max(selectedIndex - 1, 0));
                            } else if (e.key === 'Enter' && flattenedTemplates.length > 0) {
                                e.preventDefault();
                                const selectedTemplate = flattenedTemplates[selectedIndex];
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
                        padding: '4px'
                    }}
                >
                    {categoryGroups.length === 0 ? (
                        <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: '#666',
                            fontSize: '12px'
                        }}>
                            {t('quickCreate.noMatchingNodes')}
                        </div>
                    ) : (
                        categoryGroups.map((group) => {
                            return (
                                <div key={group.category} style={{ marginBottom: '4px' }}>
                                    <div
                                        className="category-header"
                                        onClick={() => toggleCategory(group.category)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 12px',
                                            backgroundColor: '#1e1e1e',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            userSelect: 'none'
                                        }}
                                    >
                                        {group.isExpanded ? (
                                            <ChevronDown size={14} style={{ color: '#999', flexShrink: 0 }} />
                                        ) : (
                                            <ChevronRight size={14} style={{ color: '#999', flexShrink: 0 }} />
                                        )}
                                        <span style={{
                                            color: '#aaa',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            flex: 1
                                        }}>
                                            {group.category}
                                        </span>
                                        <span style={{
                                            color: '#666',
                                            fontSize: '11px',
                                            backgroundColor: '#2d2d2d',
                                            padding: '2px 6px',
                                            borderRadius: '10px'
                                        }}>
                                            {group.templates.length}
                                        </span>
                                    </div>

                                    {group.isExpanded && (
                                        <div style={{ paddingLeft: '8px', paddingTop: '4px' }}>
                                            {group.templates.map((template: NodeTemplate) => {
                                                globalIndex++;
                                                const IconComponent = template.icon ? iconMap[template.icon] : null;
                                                const className = template.className || '';
                                                const isSelected = globalIndex === selectedIndex;
                                                return (
                                                    <div
                                                        key={template.className || template.displayName}
                                                        ref={isSelected ? selectedNodeRef : null}
                                                        onClick={() => onNodeSelect(template)}
                                                        onMouseEnter={() => onIndexChange(globalIndex)}
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
                                                            lineHeight: '1.4'
                                                        }}>
                                                            {template.description}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};
