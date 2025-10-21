import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TreePine, X, Settings, Clipboard } from 'lucide-react';
import { BehaviorTreeEditor } from './BehaviorTreeEditor';
import { BehaviorTreeNodePalette } from './BehaviorTreeNodePalette';
import { BehaviorTreeNodeProperties } from './BehaviorTreeNodeProperties';
import { BehaviorTreeBlackboard } from './BehaviorTreeBlackboard';
import { useBehaviorTreeStore } from '../stores/behaviorTreeStore';
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
    const { t } = useTranslation();
    const { nodes, updateNodes } = useBehaviorTreeStore();

    const [selectedNode, setSelectedNode] = useState<{
        id: string;
        template: NodeTemplate;
        data: Record<string, any>;
    } | undefined>();

    const [blackboardVariables, setBlackboardVariables] = useState<Record<string, any>>({
        health: 100,
        hasWeapon: true,
        enemyDistance: 5.0
    });

    const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'blackboard'>('blackboard');

    // 监听节点列表变化，如果选中的节点被删除，清除选中状态
    useEffect(() => {
        if (selectedNode && selectedNode.id) {
            const nodeStillExists = nodes.some((node: any) => node.id === selectedNode.id);
            if (!nodeStillExists) {
                setSelectedNode(undefined);
            }
        }
    }, [nodes, selectedNode]);

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

    const handleVariableRename = (oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        setBlackboardVariables(prev => {
            const newVars = { ...prev };
            const value = newVars[oldKey];
            delete newVars[oldKey];
            newVars[newKey] = value;
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
                        <span>{t('behaviorTree.title')}</span>
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
                        {t('behaviorTree.close')}
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
                            {t('behaviorTree.nodePalette')}
                        </div>
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            position: 'relative'
                        }}>
                            <BehaviorTreeNodePalette
                                onNodeSelect={(template) => {
                                    setSelectedNode({
                                        id: '',
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
                                let template = node.template;
                                let data = node.data;

                                // 如果是黑板变量节点，动态生成属性
                                if (node.data.nodeType === 'blackboard-variable') {
                                    const varName = node.data.variableName || '';
                                    const varValue = blackboardVariables[varName];
                                    const varType = typeof varValue === 'number' ? 'number' :
                                                   typeof varValue === 'boolean' ? 'boolean' : 'string';

                                    data = {
                                        ...node.data,
                                        __blackboardValue: varValue
                                    };

                                    template = {
                                        ...node.template,
                                        properties: [
                                            {
                                                name: 'variableName',
                                                label: t('behaviorTree.variableName'),
                                                type: 'variable',
                                                defaultValue: varName,
                                                description: t('behaviorTree.variableName'),
                                                required: true
                                            },
                                            {
                                                name: '__blackboardValue',
                                                label: t('behaviorTree.currentValue'),
                                                type: varType,
                                                defaultValue: varValue,
                                                description: t('behaviorTree.currentValue')
                                            }
                                        ]
                                    };
                                }

                                setSelectedNode({
                                    id: node.id,
                                    template,
                                    data
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
                                {t('behaviorTree.properties')}
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
                                {t('behaviorTree.blackboard')}
                            </button>
                        </div>

                        {/* 面板内容 */}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            {rightPanelTab === 'properties' ? (
                                <BehaviorTreeNodeProperties
                                    selectedNode={selectedNode}
                                    onPropertyChange={(propertyName, value) => {
                                        if (selectedNode) {
                                            // 如果是黑板变量节点的值修改
                                            if (selectedNode.data.nodeType === 'blackboard-variable' && propertyName === '__blackboardValue') {
                                                const varName = selectedNode.data.variableName;
                                                if (varName) {
                                                    handleVariableChange(varName, value);
                                                    setSelectedNode({
                                                        ...selectedNode,
                                                        data: {
                                                            ...selectedNode.data,
                                                            __blackboardValue: value
                                                        }
                                                    });
                                                }
                                                return;
                                            }

                                            // 如果修改的是黑板变量的名称
                                            if (selectedNode.data.nodeType === 'blackboard-variable' && propertyName === 'variableName') {
                                                const newVarValue = blackboardVariables[value];
                                                const newVarType = typeof newVarValue === 'number' ? 'number' :
                                                                  typeof newVarValue === 'boolean' ? 'boolean' : 'string';

                                                updateNodes((nodes: any) => nodes.map((node: any) => {
                                                    if (node.id === selectedNode.id) {
                                                        return {
                                                            ...node,
                                                            data: {
                                                                ...node.data,
                                                                [propertyName]: value
                                                            },
                                                            template: {
                                                                ...node.template,
                                                                displayName: value
                                                            }
                                                        };
                                                    }
                                                    return node;
                                                }));

                                                const updatedTemplate = {
                                                    ...selectedNode.template,
                                                    displayName: value,
                                                    properties: [
                                                        {
                                                            name: 'variableName',
                                                            label: t('behaviorTree.variableName'),
                                                            type: 'variable' as const,
                                                            defaultValue: value,
                                                            description: t('behaviorTree.variableName'),
                                                            required: true
                                                        },
                                                        {
                                                            name: '__blackboardValue',
                                                            label: t('behaviorTree.currentValue'),
                                                            type: newVarType as 'string' | 'number' | 'boolean',
                                                            defaultValue: newVarValue,
                                                            description: t('behaviorTree.currentValue')
                                                        }
                                                    ]
                                                };

                                                setSelectedNode({
                                                    ...selectedNode,
                                                    template: updatedTemplate,
                                                    data: {
                                                        ...selectedNode.data,
                                                        [propertyName]: value,
                                                        __blackboardValue: newVarValue
                                                    }
                                                });
                                            } else {
                                                // 普通属性修改
                                                updateNodes((nodes: any) => nodes.map((node: any) => {
                                                    if (node.id === selectedNode.id) {
                                                        return {
                                                            ...node,
                                                            data: {
                                                                ...node.data,
                                                                [propertyName]: value
                                                            }
                                                        };
                                                    }
                                                    return node;
                                                }));

                                                setSelectedNode({
                                                    ...selectedNode,
                                                    data: {
                                                        ...selectedNode.data,
                                                        [propertyName]: value
                                                    }
                                                });
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <BehaviorTreeBlackboard
                                    variables={blackboardVariables}
                                    onVariableChange={handleVariableChange}
                                    onVariableAdd={handleVariableAdd}
                                    onVariableDelete={handleVariableDelete}
                                    onVariableRename={handleVariableRename}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
