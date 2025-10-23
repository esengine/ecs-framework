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
import type { NodeTemplate, BlackboardValueType } from '@esengine/behavior-tree';
import { GlobalBlackboardService, GlobalBlackboardConfig } from '@esengine/behavior-tree';
import { createLogger } from '@esengine/ecs-framework';
import '../styles/BehaviorTreeWindow.css';

interface BehaviorTreeWindowProps {
    isOpen: boolean;
    onClose: () => void;
    filePath?: string | null;
    projectPath?: string | null;
}

/**
 * 行为树编辑器窗口
 */
const logger = createLogger('BehaviorTreeWindow');

export const BehaviorTreeWindow: React.FC<BehaviorTreeWindowProps> = ({
    isOpen,
    onClose,
    filePath,
    projectPath: propProjectPath
}) => {
    const { t } = useTranslation();
    const {
        nodes,
        updateNodes,
        exportToJSON,
        importFromJSON,
        blackboardVariables,
        setBlackboardVariables,
        updateBlackboardVariable,
        initialBlackboardVariables,
        isExecuting
    } = useBehaviorTreeStore();

    const [selectedNode, setSelectedNode] = useState<{
        id: string;
        template: NodeTemplate;
        data: Record<string, any>;
    } | undefined>();

    const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'blackboard'>('blackboard');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [globalVariables, setGlobalVariables] = useState<Record<string, any>>({});
    const [projectPath, setProjectPath] = useState<string>('');
    const [hasUnsavedGlobalChanges, setHasUnsavedGlobalChanges] = useState(false);

    // 初始化项目路径和加载全局配置
    useEffect(() => {
        const initProject = async () => {
            // 优先使用从 App.tsx 传递过来的项目路径
            if (propProjectPath) {
                setProjectPath(propProjectPath);
                localStorage.setItem('ecs-project-path', propProjectPath);
                await loadGlobalBlackboard(propProjectPath);
                return;
            }

            // 回退到 localStorage
            const savedPath = localStorage.getItem('ecs-project-path');
            if (savedPath) {
                setProjectPath(savedPath);
                await loadGlobalBlackboard(savedPath);
            } else {
                logger.warn('未设置项目路径，全局黑板功能将不可用');
            }
        };

        initProject();
    }, [propProjectPath]);

    // 实时更新全局变量显示
    useEffect(() => {
        const updateGlobalVariables = () => {
            const globalBlackboard = GlobalBlackboardService.getInstance();
            const allVars = globalBlackboard.getAllVariables();
            const varsObject: Record<string, any> = {};
            allVars.forEach(v => {
                varsObject[v.name] = v.value;
            });
            setGlobalVariables(varsObject);
        };

        updateGlobalVariables();
        const interval = setInterval(updateGlobalVariables, 100);
        return () => clearInterval(interval);
    }, []);

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


    const loadGlobalBlackboard = async (path: string) => {
        try {
            const json = await invoke<string>('read_global_blackboard', { projectPath: path });
            const config: GlobalBlackboardConfig = JSON.parse(json);
            GlobalBlackboardService.getInstance().importConfig(config);

            const allVars = GlobalBlackboardService.getInstance().getAllVariables();
            const varsObject: Record<string, any> = {};
            allVars.forEach(v => {
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
            const globalBlackboard = GlobalBlackboardService.getInstance();
            const json = globalBlackboard.toJSON();
            await invoke('write_global_blackboard', { projectPath, content: json });
            setHasUnsavedGlobalChanges(false);
            logger.info('全局黑板配置已保存到', `${projectPath}/.ecs/global-blackboard.json`);
        } catch (error) {
            logger.error('保存全局黑板配置失败', error);
        }
    };

    const handleGlobalVariableChange = (key: string, value: any) => {
        const globalBlackboard = GlobalBlackboardService.getInstance();
        globalBlackboard.setValue(key, value, true);
        const allVars = globalBlackboard.getAllVariables();
        const varsObject: Record<string, any> = {};
        allVars.forEach(v => {
            varsObject[v.name] = v.value;
        });
        setGlobalVariables(varsObject);
        setHasUnsavedGlobalChanges(true);
    };

    const handleGlobalVariableAdd = (key: string, value: any, type: BlackboardValueType) => {
        const globalBlackboard = GlobalBlackboardService.getInstance();
        globalBlackboard.defineVariable(key, type, value);
        const allVars = globalBlackboard.getAllVariables();
        const varsObject: Record<string, any> = {};
        allVars.forEach(v => {
            varsObject[v.name] = v.value;
        });
        setGlobalVariables(varsObject);
        setHasUnsavedGlobalChanges(true);
    };

    const handleGlobalVariableDelete = (key: string) => {
        const globalBlackboard = GlobalBlackboardService.getInstance();
        globalBlackboard.removeVariable(key);
        const allVars = globalBlackboard.getAllVariables();
        const varsObject: Record<string, any> = {};
        allVars.forEach(v => {
            varsObject[v.name] = v.value;
        });
        setGlobalVariables(varsObject);
        setHasUnsavedGlobalChanges(true);
    };

    const handleSave = async () => {
        try {
            // 检查是否正在运行
            if (isExecuting) {
                const confirmed = window.confirm(
                    '行为树正在运行中。保存将使用设计时的初始值，运行时修改的黑板变量不会被保存。\n\n是否继续保存？'
                );
                if (!confirmed) {
                    return;
                }
            }

            const filePath = await save({
                filters: [{
                    name: 'Behavior Tree',
                    extensions: ['btree']
                }],
                defaultPath: 'behavior-tree.btree'
            });

            if (filePath) {
                // 使用初始黑板变量（设计时的值）而不是运行时的值
                const varsToSave = isExecuting ? initialBlackboardVariables : blackboardVariables;
                const json = exportToJSON(
                    { name: 'behavior-tree', description: '' },
                    varsToSave
                );
                await invoke('write_behavior_tree_file', { filePath, content: json });
                logger.info('行为树已保存', filePath);

                // 自动保存全局黑板配置
                if (hasUnsavedGlobalChanges) {
                    await saveGlobalBlackboard();
                }
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
                importFromJSON(json);
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
                    importFromJSON(json);
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
                </div>
            </div>
        </div>
    );
};
