import React from 'react';
import { IInspectorProvider, InspectorContext } from '@esengine/editor-core';
import { Node as BehaviorTreeNode } from '../domain/models/Node';

/**
 * 行为树节点Inspector提供器
 * 为行为树节点提供检视面板
 */
export class BehaviorTreeNodeInspectorProvider implements IInspectorProvider<BehaviorTreeNode> {
    readonly id = 'behavior-tree-node-inspector';
    readonly name = '行为树节点检视器';
    readonly priority = 100;

    canHandle(target: unknown): target is BehaviorTreeNode {
        return target instanceof BehaviorTreeNode ||
            (typeof target === 'object' &&
                target !== null &&
                'template' in target &&
                'data' in target &&
                'position' in target &&
                'children' in target);
    }

    render(node: BehaviorTreeNode, context: InspectorContext): React.ReactElement {
        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <span className="entity-name">{node.template.displayName || '未命名节点'}</span>
                </div>

                <div className="inspector-content">
                    <div className="inspector-section">
                        <div className="section-title">基本信息</div>
                        <div className="property-field">
                            <label className="property-label">节点类型</label>
                            <span className="property-value-text">{node.template.type}</span>
                        </div>
                        <div className="property-field">
                            <label className="property-label">分类</label>
                            <span className="property-value-text">{node.template.category}</span>
                        </div>
                        {node.template.description && (
                            <div className="property-field">
                                <label className="property-label">描述</label>
                                <span className="property-value-text" style={{ color: '#999' }}>
                                    {node.template.description}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="inspector-section">
                        <div className="section-title">调试信息</div>
                        <div className="property-field">
                            <label className="property-label">节点ID</label>
                            <span className="property-value-text" style={{
                                fontFamily: 'Consolas, Monaco, monospace',
                                color: '#666',
                                fontSize: '11px'
                            }}>
                                {node.id}
                            </span>
                        </div>
                        <div className="property-field">
                            <label className="property-label">位置</label>
                            <span className="property-value-text" style={{ color: '#999' }}>
                                ({node.position.x.toFixed(0)}, {node.position.y.toFixed(0)})
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
