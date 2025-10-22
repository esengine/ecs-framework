import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TreePine, X, Settings, Clipboard, Save, FolderOpen, Maximize2, Minimize2 } from 'lucide-react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { BehaviorTreeEditor } from './BehaviorTreeEditor';
import { BehaviorTreeNodePalette } from './BehaviorTreeNodePalette';
import { BehaviorTreeNodeProperties } from './BehaviorTreeNodeProperties';
import { BehaviorTreeBlackboard } from './BehaviorTreeBlackboard';
import { useBehaviorTreeStore } from '../stores/behaviorTreeStore';
import type { NodeTemplate } from '@esengine/behavior-tree';
import { createLogger } from '@esengine/ecs-framework';
import '../styles/BehaviorTreeWindow.css';

interface BehaviorTreeWindowProps {
    isOpen: boolean;
    onClose: () => void;
    filePath?: string | null;
}

/**
 * 行为树编辑器窗口
 */
const logger = createLogger('BehaviorTreeWindow');

export const BehaviorTreeWindow: React.FC<BehaviorTreeWindowProps> = ({
    isOpen,
    onClose,
    filePath
}) => {
    const { t } = useTranslation();
    const { nodes, updateNodes, exportToJSON, importFromJSON } = useBehaviorTreeStore();

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
    const [isFullscreen, setIsFullscreen] = useState(false);

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

    const handleSave = async () => {
        try {
            const filePath = await save({
                filters: [{
                    name: 'Behavior Tree',
                    extensions: ['btree']
                }],
                defaultPath: 'behavior-tree.btree'
            });

            if (filePath) {
                const json = exportToJSON(
                    { name: 'behavior-tree', description: '' },
                    blackboardVariables
                );
                await invoke('write_behavior_tree_file', { filePath, content: json });
                logger.info('行为树已保存', filePath);
            }
        } catch (error) {
            logger.error('保存失败', error);
        }
    };

    const handleLoad = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Behavior Tree',
                    extensions: ['btree']
                }]
            });

            if (selected) {
                const json = await invoke<string>('read_behavior_tree_file', { filePath: selected as string });
                const result = importFromJSON(json);
                setBlackboardVariables(result.blackboard);
                logger.info('行为树已加载', selected);
            }
        } catch (error) {
            logger.error('加载失败', error);
        }
    };


    useEffect(() => {
        if (filePath && isOpen) {
            invoke<string>('read_behavior_tree_file', { filePath })
                .then((json: string) => {
                    const result = importFromJSON(json);
                    setBlackboardVariables(result.blackboard);
                    logger.info('自动加载行为树文件', filePath);
                })
                .catch((error: any) => {
                    logger.error('自动加载文件失败', error);
                });
        }
    }, [filePath, isOpen, importFromJSON]);

    if (!isOpen) return null;

    return (
        <div className="behavior-tree-overlay">
            <div className={`behavior-tree-window ${isFullscreen ? 'fullscreen' : ''}`}>
                <div className="behavior-tree-header">
                    <div className="behavior-tree-title">
                        <TreePine size={20} />
                        <span>{t('behaviorTree.title')}</span>
                    </div>
                    <div className="behavior-tree-toolbar">
                        <button onClick={handleSave} className="behavior-tree-toolbar-btn" title="保存">
                            <Save size={16} />
                        </button>
                        <button onClick={handleLoad} className="behavior-tree-toolbar-btn" title="打开">
                            <FolderOpen size={16} />
                        </button>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="behavior-tree-toolbar-btn"
                            title={isFullscreen ? "退出全屏" : "全屏"}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button onClick={onClose} className="behavior-tree-toolbar-btn" title={t('behaviorTree.close')}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="behavior-tree-content">
                    <div className="behavior-tree-panel behavior-tree-panel-left">
                        <div className="behavior-tree-panel-header">
                            {t('behaviorTree.nodePalette')}
                        </div>
                        <div className="behavior-tree-panel-content">
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

                    <div className="behavior-tree-panel behavior-tree-panel-center">
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

                    <div className="behavior-tree-panel behavior-tree-panel-right">
                        <div className="behavior-tree-tabs">
                            <button
                                onClick={() => setRightPanelTab('properties')}
                                className={`behavior-tree-tab ${rightPanelTab === 'properties' ? 'active' : ''}`}
                            >
                                <Settings size={16} />
                                {t('behaviorTree.properties')}
                            </button>
                            <button
                                onClick={() => setRightPanelTab('blackboard')}
                                className={`behavior-tree-tab ${rightPanelTab === 'blackboard' ? 'active' : ''}`}
                            >
                                <Clipboard size={16} />
                                {t('behaviorTree.blackboard')}
                            </button>
                        </div>

                        <div className="behavior-tree-panel-content">
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
