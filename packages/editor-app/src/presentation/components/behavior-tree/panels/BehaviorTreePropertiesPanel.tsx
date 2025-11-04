import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Clipboard } from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { BehaviorTreeNodeProperties } from '../../../../components/BehaviorTreeNodeProperties';
import { BehaviorTreeBlackboard } from '../../../../components/BehaviorTreeBlackboard';
import { GlobalBlackboardService, type BlackboardValueType, type NodeTemplate } from '@esengine/behavior-tree';
import { useBehaviorTreeStore, type Connection } from '../../../../stores/behaviorTreeStore';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../../../../components/Toast';
import { createLogger } from '@esengine/ecs-framework';
import './BehaviorTreePropertiesPanel.css';

const logger = createLogger('BehaviorTreePropertiesPanel');

interface BehaviorTreePropertiesPanelProps {
    projectPath?: string | null;
}

export const BehaviorTreePropertiesPanel: React.FC<BehaviorTreePropertiesPanelProps> = ({ projectPath: propProjectPath }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const messageHub = Core.services.resolve(MessageHub);

    const {
        nodes,
        connections,
        updateNodes,
        blackboardVariables,
        setBlackboardVariables,
        updateBlackboardVariable,
        initialBlackboardVariables,
        isExecuting,
        removeConnections
    } = useBehaviorTreeStore();

    const [selectedNode, setSelectedNode] = useState<{
        id: string;
        template: NodeTemplate;
        data: Record<string, any>;
    } | undefined>();

    const [activeTab, setActiveTab] = useState<'properties' | 'blackboard'>('blackboard');
    const [projectPath, setProjectPath] = useState<string>('');
    const [globalVariables, setGlobalVariables] = useState<Record<string, any>>({});
    const [hasUnsavedGlobalChanges, setHasUnsavedGlobalChanges] = useState(false);

    useEffect(() => {
        const initProject = async () => {
            if (propProjectPath) {
                setProjectPath(propProjectPath);
                localStorage.setItem('ecs-project-path', propProjectPath);
                await loadGlobalBlackboard(propProjectPath);
            } else {
                const savedPath = localStorage.getItem('ecs-project-path');
                if (savedPath) {
                    setProjectPath(savedPath);
                    await loadGlobalBlackboard(savedPath);
                }
            }
        };
        initProject();
    }, [propProjectPath]);

    useEffect(() => {
        const updateGlobalVariables = () => {
            const globalBlackboard = Core.services.resolve(GlobalBlackboardService);
            const allVars = globalBlackboard.getAllVariables();
            const varsObject: Record<string, any> = {};
            allVars.forEach((v) => {
                varsObject[v.name] = v.value;
            });
            setGlobalVariables(varsObject);
        };

        updateGlobalVariables();
        const interval = setInterval(updateGlobalVariables, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleNodeSelected = (data: any) => {
            if (data.node) {
                let template = data.node.template;
                let nodeData = data.node.data;

                if (data.node.data.nodeType === 'blackboard-variable') {
                    const varName = (data.node.data.variableName as string) || '';
                    const varValue = blackboardVariables[varName];
                    const varType = typeof varValue === 'number' ? 'number' :
                        typeof varValue === 'boolean' ? 'boolean' : 'string';

                    nodeData = {
                        ...data.node.data,
                        __blackboardValue: varValue
                    };

                    template = {
                        ...data.node.template,
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
                    id: data.node.id,
                    template,
                    data: nodeData
                });
                setActiveTab('properties');
            }
        };

        const unsubscribe = messageHub?.subscribe('behavior-tree:node-selected', handleNodeSelected);
        return () => unsubscribe?.();
    }, [messageHub, blackboardVariables, t]);

    useEffect(() => {
        if (selectedNode && selectedNode.id) {
            const nodeStillExists = nodes.some((node: any) => node.id === selectedNode.id);
            if (!nodeStillExists) {
                setSelectedNode(undefined);
            }
        }
    }, [nodes, selectedNode]);

    const loadGlobalBlackboard = async (path: string) => {
        try {
            const json = await invoke<string>('read_global_blackboard', { projectPath: path });
            const config = JSON.parse(json);
            Core.services.resolve(GlobalBlackboardService).importConfig(config);

            const allVars = Core.services.resolve(GlobalBlackboardService).getAllVariables();
            const varsObject: Record<string, any> = {};
            allVars.forEach((v) => {
                varsObject[v.name] = v.value;
            });
            setGlobalVariables(varsObject);
            setHasUnsavedGlobalChanges(false);
            logger.info('全局黑板配置已加载');
        } catch (error) {
            logger.error('加载全局黑板配置失败', error);
        }
    };

    const saveGlobalBlackboard = async () => {
        if (!projectPath) {
            logger.error('未设置项目路径，无法保存全局黑板配置');
            return;
        }

        try {
            const globalBlackboard = Core.services.resolve(GlobalBlackboardService);
            const json = globalBlackboard.toJSON();
            await invoke('write_global_blackboard', { projectPath, content: json });
            setHasUnsavedGlobalChanges(false);
            logger.info('全局黑板配置已保存到', `${projectPath}/.ecs/global-blackboard.json`);
            showToast('全局黑板已保存', 'success');
        } catch (error) {
            logger.error('保存全局黑板配置失败', error);
            showToast('保存全局黑板失败', 'error');
        }
    };

    const handleVariableChange = (key: string, value: any) => {
        updateBlackboardVariable(key, value);
    };

    const handleVariableAdd = (key: string, value: any) => {
        updateBlackboardVariable(key, value);
    };

    const handleVariableDelete = (key: string) => {
        const newVars = { ...blackboardVariables };
        delete newVars[key];
        setBlackboardVariables(newVars);
    };

    const handleVariableRename = (oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        const newVars = { ...blackboardVariables };
        const value = newVars[oldKey];
        delete newVars[oldKey];
        newVars[newKey] = value;
        setBlackboardVariables(newVars);
    };

    const handleGlobalVariableChange = (key: string, value: any) => {
        const globalBlackboard = Core.services.resolve(GlobalBlackboardService);
        globalBlackboard.setValue(key, value, true);
        const allVars = globalBlackboard.getAllVariables();
        const varsObject: Record<string, any> = {};
        allVars.forEach((v) => {
            varsObject[v.name] = v.value;
        });
        setGlobalVariables(varsObject);
        setHasUnsavedGlobalChanges(true);
    };

    const handleGlobalVariableAdd = (key: string, value: any, type: BlackboardValueType) => {
        const globalBlackboard = Core.services.resolve(GlobalBlackboardService);
        globalBlackboard.defineVariable(key, type, value);
        const allVars = globalBlackboard.getAllVariables();
        const varsObject: Record<string, any> = {};
        allVars.forEach((v) => {
            varsObject[v.name] = v.value;
        });
        setGlobalVariables(varsObject);
        setHasUnsavedGlobalChanges(true);
    };

    const handleGlobalVariableDelete = (key: string) => {
        const globalBlackboard = Core.services.resolve(GlobalBlackboardService);
        globalBlackboard.removeVariable(key);
        const allVars = globalBlackboard.getAllVariables();
        const varsObject: Record<string, any> = {};
        allVars.forEach((v) => {
            varsObject[v.name] = v.value;
        });
        setGlobalVariables(varsObject);
        setHasUnsavedGlobalChanges(true);
    };

    const handlePropertyChange = (propertyName: string, value: any) => {
        if (!selectedNode) return;

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
    };

    return (
        <div className="behavior-tree-properties-panel">
            <div className="properties-panel-tabs">
                <button
                    onClick={() => setActiveTab('properties')}
                    className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
                >
                    <Settings size={16} />
                    {t('behaviorTree.properties')}
                </button>
                <button
                    onClick={() => setActiveTab('blackboard')}
                    className={`tab-button ${activeTab === 'blackboard' ? 'active' : ''}`}
                >
                    <Clipboard size={16} />
                    {t('behaviorTree.blackboard')}
                </button>
            </div>

            <div className="properties-panel-content">
                {activeTab === 'properties' ? (
                    <BehaviorTreeNodeProperties
                        selectedNode={selectedNode}
                        projectPath={projectPath}
                        onPropertyChange={handlePropertyChange}
                    />
                ) : (
                    <BehaviorTreeBlackboard
                        variables={blackboardVariables}
                        initialVariables={isExecuting ? initialBlackboardVariables : undefined}
                        globalVariables={globalVariables}
                        onVariableChange={handleVariableChange}
                        onVariableAdd={handleVariableAdd}
                        onVariableDelete={handleVariableDelete}
                        onVariableRename={handleVariableRename}
                        onGlobalVariableChange={handleGlobalVariableChange}
                        onGlobalVariableAdd={handleGlobalVariableAdd}
                        onGlobalVariableDelete={handleGlobalVariableDelete}
                        projectPath={projectPath}
                        hasUnsavedGlobalChanges={hasUnsavedGlobalChanges}
                        onSaveGlobal={saveGlobalBlackboard}
                    />
                )}
            </div>
        </div>
    );
};
