import { useState } from 'react';
import { TreePine, X, Settings, Clipboard } from 'lucide-react';
import { BehaviorTreeEditor } from './BehaviorTreeEditor';
import { BehaviorTreeNodePalette } from './BehaviorTreeNodePalette';
import { BehaviorTreeNodeProperties } from './BehaviorTreeNodeProperties';
import { BehaviorTreeBlackboard } from './BehaviorTreeBlackboard';
import type { NodeTemplate } from '@esengine/behavior-tree';

interface BehaviorTreeWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 行为树编辑器窗口
 */
export const BehaviorTreeWindow: React.FC<BehaviorTreeWindowProps> = ({
    isOpen,
    onClose
}) => {
    const [selectedNode, setSelectedNode] = useState<{
        template: NodeTemplate;
        data: Record<string, any>;
    } | undefined>();

    const [blackboardVariables, setBlackboardVariables] = useState<Record<string, any>>({
        health: 100,
        hasWeapon: true,
        enemyDistance: 5.0
    });

    const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'blackboard'>('blackboard');

    const handleVariableChange = (key: string, value: any) => {
        setBlackboardVariables(prev => ({ ...prev, [key]: value }));
    };

    const handleVariableAdd = (key: string, value: any) => {
        setBlackboardVariables(prev => ({ ...prev, [key]: value }));
    };

    const handleVariableDelete = (key: string) => {
        setBlackboardVariables(prev => {
            const newVars = { ...prev };
            delete newVars[key];
            return newVars;
        });
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '90%',
                    height: '90%',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    position: 'relative'
                }}>
                {/* 标题栏 */}
                <div style={{
                    padding: '12px 20px',
                    backgroundColor: '#2d2d2d',
                    borderBottom: '1px solid #444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#cccccc',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        <TreePine size={24} />
                        <span>Behavior Tree Editor</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            color: '#cccccc',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <X size={16} />
                        Close
                    </button>
                </div>

                {/* 主内容区域 */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {/* 左侧节点面板 */}
                    <div style={{
                        width: '280px',
                        borderRight: '1px solid #333',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <div style={{
                            padding: '12px 15px',
                            backgroundColor: '#2d2d2d',
                            borderBottom: '1px solid #333',
                            color: '#cccccc',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            Node Palette
                        </div>
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            position: 'relative'
                        }}>
                            <BehaviorTreeNodePalette
                                onNodeSelect={(template) => {
                                    setSelectedNode({
                                        template,
                                        data: { ...template.defaultConfig }
                                    });
                                }}
                            />
                        </div>
                    </div>

                    {/* 中央编辑器 */}
                    <div style={{
                        flex: 1,
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <BehaviorTreeEditor
                            onNodeSelect={(node) => {
                                setSelectedNode({
                                    template: node.template,
                                    data: node.data
                                });
                            }}
                            onNodeCreate={(template, position) => {
                                // Node created successfully
                            }}
                            blackboardVariables={blackboardVariables}
                        />
                    </div>

                    {/* 右侧面板 */}
                    <div style={{
                        width: '320px',
                        borderLeft: '1px solid #333',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Tab 切换 */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#2d2d2d',
                            borderBottom: '1px solid #333'
                        }}>
                            <button
                                onClick={() => setRightPanelTab('properties')}
                                style={{
                                    flex: 1,
                                    padding: '12px 15px',
                                    backgroundColor: rightPanelTab === 'properties' ? '#1e1e1e' : 'transparent',
                                    border: 'none',
                                    borderBottom: rightPanelTab === 'properties' ? '2px solid #0e639c' : '2px solid transparent',
                                    color: rightPanelTab === 'properties' ? '#cccccc' : '#666',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Settings size={16} />
                                Properties
                            </button>
                            <button
                                onClick={() => setRightPanelTab('blackboard')}
                                style={{
                                    flex: 1,
                                    padding: '12px 15px',
                                    backgroundColor: rightPanelTab === 'blackboard' ? '#1e1e1e' : 'transparent',
                                    border: 'none',
                                    borderBottom: rightPanelTab === 'blackboard' ? '2px solid #0e639c' : '2px solid transparent',
                                    color: rightPanelTab === 'blackboard' ? '#cccccc' : '#666',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Clipboard size={16} />
                                Blackboard
                            </button>
                        </div>

                        {/* 面板内容 */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            {rightPanelTab === 'properties' ? (
                                <BehaviorTreeNodeProperties
                                    selectedNode={selectedNode}
                                    onPropertyChange={(propertyName, value) => {
                                        if (selectedNode) {
                                            setSelectedNode({
                                                ...selectedNode,
                                                data: {
                                                    ...selectedNode.data,
                                                    [propertyName]: value
                                                }
                                            });
                                        }
                                    }}
                                />
                            ) : (
                                <BehaviorTreeBlackboard
                                    variables={blackboardVariables}
                                    onVariableChange={handleVariableChange}
                                    onVariableAdd={handleVariableAdd}
                                    onVariableDelete={handleVariableDelete}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
