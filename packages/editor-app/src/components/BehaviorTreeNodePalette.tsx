import React, { useState } from 'react';
import { NodeTemplates, NodeTemplate } from '@esengine/behavior-tree';
import { NodeIcon } from './NodeIcon';

interface BehaviorTreeNodePaletteProps {
    onNodeSelect?: (template: NodeTemplate) => void;
}

/**
 * 行为树节点面板
 *
 * 显示所有可用的行为树节点模板，支持拖拽创建
 */
export const BehaviorTreeNodePalette: React.FC<BehaviorTreeNodePaletteProps> = ({
    onNodeSelect
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const allTemplates = NodeTemplates.getAllTemplates();

    // 按类别分组
    const categories = ['all', ...new Set(allTemplates.map(t => t.category))];

    const filteredTemplates = selectedCategory === 'all'
        ? allTemplates
        : allTemplates.filter(t => t.category === selectedCategory);

    const handleNodeClick = (template: NodeTemplate) => {
        onNodeSelect?.(template);
    };

    const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
        const templateJson = JSON.stringify(template);
        e.dataTransfer.setData('application/behavior-tree-node', templateJson);
        e.dataTransfer.setData('text/plain', templateJson);
        e.dataTransfer.effectAllowed = 'copy';

        const dragImage = e.currentTarget as HTMLElement;
        if (dragImage) {
            e.dataTransfer.setDragImage(dragImage, 50, 25);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#1e1e1e',
            color: '#cccccc',
            fontFamily: 'sans-serif'
        }}>
            <style>{`
                .node-palette-list::-webkit-scrollbar {
                    width: 8px;
                }
                .node-palette-list::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }
                .node-palette-list::-webkit-scrollbar-thumb {
                    background: #3c3c3c;
                    border-radius: 4px;
                }
                .node-palette-list::-webkit-scrollbar-thumb:hover {
                    background: #4c4c4c;
                }
            `}</style>
            {/* 类别选择器 */}
            <div style={{
                padding: '10px',
                borderBottom: '1px solid #333',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px'
            }}>
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: selectedCategory === category ? '#0e639c' : '#3c3c3c',
                            color: '#cccccc',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* 节点列表 */}
            <div className="node-palette-list" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px'
            }}>
                {filteredTemplates.map((template, index) => (
                    <div
                        key={index}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, template)}
                        onClick={() => handleNodeClick(template)}
                        style={{
                            padding: '10px',
                            marginBottom: '8px',
                            backgroundColor: '#2d2d2d',
                            borderLeft: `4px solid ${template.color || '#666'}`,
                            borderRadius: '3px',
                            cursor: 'grab',
                            transition: 'all 0.2s',
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#3d3d3d';
                            e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#2d2d2d';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.cursor = 'grabbing';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.cursor = 'grab';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '5px',
                            pointerEvents: 'none'
                        }}>
                            {template.icon && (
                                <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                                    <NodeIcon iconName={template.icon} size={16} />
                                </span>
                            )}
                            <strong style={{ fontSize: '14px' }}>{template.displayName}</strong>
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#999',
                            lineHeight: '1.4',
                            pointerEvents: 'none'
                        }}>
                            {template.description}
                        </div>
                        <div style={{
                            marginTop: '5px',
                            fontSize: '11px',
                            color: '#666',
                            pointerEvents: 'none'
                        }}>
                            {template.category}
                        </div>
                    </div>
                ))}
            </div>

            {/* 帮助提示 */}
            <div style={{
                padding: '10px',
                borderTop: '1px solid #333',
                fontSize: '11px',
                color: '#666',
                textAlign: 'center'
            }}>
                拖拽节点到编辑器或点击选择
            </div>
        </div>
    );
};
