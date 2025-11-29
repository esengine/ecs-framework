import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { NodeTemplate, NodeCategory } from '../../domain/models/GraphNode';
import { Position } from '../../domain/value-objects/Position';

export interface NodeContextMenuProps {
    position: { x: number; y: number };
    canvasPosition: Position;
    templates: NodeTemplate[];
    isOpen: boolean;
    onSelectTemplate: (template: NodeTemplate, position: Position) => void;
    onClose: () => void;
}

interface CategoryGroup {
    category: NodeCategory;
    label: string;
    templates: NodeTemplate[];
}

const CATEGORY_LABELS: Record<NodeCategory, string> = {
    event: 'Event',
    function: 'Function',
    pure: 'Pure',
    flow: 'Flow Control',
    variable: 'Variable',
    literal: 'Literal',
    comment: 'Comment',
    custom: 'Custom'
};

const CATEGORY_ORDER: NodeCategory[] = [
    'event',
    'function',
    'pure',
    'flow',
    'variable',
    'literal',
    'comment',
    'custom'
];

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
        <>
            {text.slice(0, index)}
            <span className="highlight">{text.slice(index, index + query.length)}</span>
            {text.slice(index + query.length)}
        </>
    );
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    position,
    canvasPosition,
    templates,
    isOpen,
    onSelectTemplate,
    onClose
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
        new Set(['event', 'function', 'pure', 'flow'])
    );
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [contextSensitive, setContextSensitive] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
            setSearchQuery('');
            setHighlightedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen, onClose]);

    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;

        const query = searchQuery.toLowerCase();
        return templates.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.id.toLowerCase().includes(query)
        );
    }, [templates, searchQuery]);

    const categoryGroups = useMemo((): CategoryGroup[] => {
        const groups = new Map<NodeCategory, NodeTemplate[]>();

        filteredTemplates.forEach(template => {
            const category = template.category || 'custom';
            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category)!.push(template);
        });

        return CATEGORY_ORDER
            .filter(cat => groups.has(cat))
            .map(cat => ({
                category: cat,
                label: CATEGORY_LABELS[cat],
                templates: groups.get(cat)!
            }));
    }, [filteredTemplates]);

    const flatItems = useMemo(() => {
        if (searchQuery.trim()) {
            return filteredTemplates;
        }
        return categoryGroups.flatMap(g =>
            expandedCategories.has(g.category) ? g.templates : []
        );
    }, [searchQuery, categoryGroups, expandedCategories, filteredTemplates]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < flatItems.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : flatItems.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (flatItems[highlightedIndex]) {
                    onSelectTemplate(flatItems[highlightedIndex], canvasPosition);
                    onClose();
                }
                break;
        }
    }, [flatItems, highlightedIndex, canvasPosition, onSelectTemplate, onClose]);

    const toggleCategory = useCallback((category: NodeCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }, []);

    const handleItemClick = useCallback((template: NodeTemplate) => {
        onSelectTemplate(template, canvasPosition);
        onClose();
    }, [canvasPosition, onSelectTemplate, onClose]);

    const adjustedPosition = useMemo(() => {
        const menuWidth = 320;
        const menuHeight = 450;
        const padding = 10;

        let x = position.x;
        let y = position.y;

        if (typeof window !== 'undefined') {
            if (x + menuWidth > window.innerWidth - padding) {
                x = window.innerWidth - menuWidth - padding;
            }
            if (y + menuHeight > window.innerHeight - padding) {
                y = window.innerHeight - menuHeight - padding;
            }
        }

        return { x: Math.max(padding, x), y: Math.max(padding, y) };
    }, [position]);

    if (!isOpen) return null;

    const showCategorized = !searchQuery.trim();

    return (
        <div
            ref={menuRef}
            className="ne-context-menu"
            style={{
                left: adjustedPosition.x,
                top: adjustedPosition.y
            }}
            onKeyDown={handleKeyDown}
        >
            {/* Header */}
            <div className="ne-context-menu-header">
                <span className="ne-context-menu-title">All Possible Actions</span>
                <div className="ne-context-menu-options">
                    <label className="ne-context-menu-checkbox">
                        <input
                            type="checkbox"
                            checked={contextSensitive}
                            onChange={e => setContextSensitive(e.target.checked)}
                        />
                        Context Sensitive
                    </label>
                </div>
            </div>

            {/* Search Box */}
            <div className="ne-context-menu-search">
                <div className="ne-context-menu-search-wrapper">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="ne-context-menu-search-input"
                        placeholder=""
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            setHighlightedIndex(0);
                        }}
                    />
                    {searchQuery && (
                        <button
                            className="ne-context-menu-search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="ne-context-menu-content">
                {filteredTemplates.length === 0 ? (
                    <div className="ne-context-menu-empty">
                        No matching nodes
                    </div>
                ) : showCategorized ? (
                    categoryGroups.map(group => (
                        <div
                            key={group.category}
                            className={`ne-context-menu-category ${expandedCategories.has(group.category) ? 'expanded' : ''}`}
                        >
                            <div
                                className="ne-context-menu-category-header"
                                onClick={() => toggleCategory(group.category)}
                            >
                                <span className="ne-context-menu-category-chevron">▶</span>
                                <span className="ne-context-menu-category-title">
                                    {group.label}
                                </span>
                            </div>
                            <div className="ne-context-menu-category-items">
                                {group.templates.map((template) => {
                                    const flatIndex = flatItems.indexOf(template);
                                    return (
                                        <div
                                            key={template.id}
                                            className={`ne-context-menu-item ${flatIndex === highlightedIndex ? 'highlighted' : ''}`}
                                            onClick={() => handleItemClick(template)}
                                            onMouseEnter={() => setHighlightedIndex(flatIndex)}
                                        >
                                            <div className="ne-context-menu-item-icon">
                                                {template.category === 'function' || template.category === 'pure' ? (
                                                    <span className="ne-context-menu-item-icon-func">f</span>
                                                ) : (
                                                    <div className={`ne-context-menu-item-icon-dot ${template.category}`} />
                                                )}
                                            </div>
                                            <div className="ne-context-menu-item-info">
                                                <div className="ne-context-menu-item-title">
                                                    {template.title}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    filteredTemplates.map((template, idx) => (
                        <div
                            key={template.id}
                            className={`ne-context-menu-item ${idx === highlightedIndex ? 'highlighted' : ''}`}
                            onClick={() => handleItemClick(template)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                            <div className="ne-context-menu-item-icon">
                                {template.category === 'function' || template.category === 'pure' ? (
                                    <span className="ne-context-menu-item-icon-func">f</span>
                                ) : (
                                    <div className={`ne-context-menu-item-icon-dot ${template.category}`} />
                                )}
                            </div>
                            <div className="ne-context-menu-item-info">
                                <div className="ne-context-menu-item-title">
                                    {highlightMatch(template.title, searchQuery)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="ne-context-menu-footer">
                <span><kbd>↑↓</kbd> Navigate</span>
                <span><kbd>Enter</kbd> Select</span>
                <span><kbd>Esc</kbd> Close</span>
            </div>
        </div>
    );
};

export default NodeContextMenu;
