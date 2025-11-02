import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TreePine, X, Settings, Clipboard, Save, FolderOpen, Maximize2, Minimize2, Download, FilePlus } from 'lucide-react';
import { open, ask, message } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Core } from '@esengine/ecs-framework';
import { BehaviorTreeEditor } from './BehaviorTreeEditor';
import { BehaviorTreeNodePalette } from './BehaviorTreeNodePalette';
import { BehaviorTreeNodeProperties } from './BehaviorTreeNodeProperties';
import { BehaviorTreeBlackboard } from './BehaviorTreeBlackboard';
import { ExportRuntimeDialog, type ExportOptions } from './ExportRuntimeDialog';
import { BehaviorTreeNameDialog } from './BehaviorTreeNameDialog';
import { useToast } from './Toast';
import { useBehaviorTreeStore, type Connection } from '../stores/behaviorTreeStore';
import type { NodeTemplate, BlackboardValueType, PropertyDefinition } from '@esengine/behavior-tree';
import { GlobalBlackboardService, GlobalBlackboardConfig, EditorFormatConverter, BehaviorTreeAssetSerializer } from '@esengine/behavior-tree';
import { createLogger } from '@esengine/ecs-framework';
import { LocalBlackboardTypeGenerator } from '../generators/LocalBlackboardTypeGenerator';
import { GlobalBlackboardTypeGenerator } from '../generators/GlobalBlackboardTypeGenerator';
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
    const { showToast } = useToast();
    const {
        nodes,
        connections,
        updateNodes,
        exportToJSON,
        exportToRuntimeAsset,
        importFromJSON,
        blackboardVariables,
        setBlackboardVariables,
        updateBlackboardVariable,
        initialBlackboardVariables,
        isExecuting,
        removeConnections,
        reset
    } = useBehaviorTreeStore();

    const [selectedNode, setSelectedNode] = useState<{
        id: string;
        template: NodeTemplate;
        data: Record<string, any>;
    } | undefined>();

    const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'blackboard'>('blackboard');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    const [globalVariables, setGlobalVariables] = useState<Record<string, any>>({});
    const [projectPath, setProjectPath] = useState<string>('');
    const [hasUnsavedGlobalChanges, setHasUnsavedGlobalChanges] = useState(false);
    const [availableBTreeFiles, setAvailableBTreeFiles] = useState<string[]>([]);
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const isInitialMount = useRef(true);
    const initialStateSnapshot = useRef<{ nodes: number; variables: number }>({ nodes: 0, variables: 0 });

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

    // 加载可用的 btree 文件
    useEffect(() => {
        const loadAvailableFiles = async () => {
            if (projectPath) {
                try {
                    const files = await invoke<string[]>('scan_behavior_trees', { projectPath });
                    setAvailableBTreeFiles(files);
                } catch (error) {
                    logger.error('加载行为树文件列表失败', error);
                    setAvailableBTreeFiles([]);
                }
            } else {
                setAvailableBTreeFiles([]);
            }
        };

        loadAvailableFiles();
    }, [projectPath]);

    // 实时更新全局变量显示
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

    // 监听节点列表变化，如果选中的节点被删除，清除选中状态
    useEffect(() => {
        if (selectedNode && selectedNode.id) {
            const nodeStillExists = nodes.some((node: any) => node.id === selectedNode.id);
            if (!nodeStillExists) {
                setSelectedNode(undefined);
            }
        }
    }, [nodes, selectedNode]);

    /**
     * 推断 JavaScript 值的类型
     */
    const inferValueType = (value: any): string => {
        if (value === null || value === undefined) {
            return 'any';
        }
        const jsType = typeof value;
        if (jsType === 'object') {
            if (Array.isArray(value)) {
                return 'array';
            }
            return 'object';
        }
        return jsType;
    };

    /**
     * 检查两个类型是否兼容
     */
    const areTypesCompatible = (sourceType: string, targetType: string): boolean => {
        if (sourceType === targetType) {
            return true;
        }
        if (targetType === 'any' || targetType === 'blackboard' || targetType === 'variable') {
            return true;
        }
        if (sourceType === 'number' && targetType === 'string') {
            return true;
        }
        if (sourceType === 'boolean' && targetType === 'string') {
            return true;
        }
        if (sourceType === 'string' && targetType === 'select') {
            return true;
        }
        return false;
    };

    const handleVariableChange = (key: string, value: any) => {
        const oldValue = blackboardVariables[key];
        const oldType = inferValueType(oldValue);
        const newType = inferValueType(value);

        // 更新变量值
        updateBlackboardVariable(key, value);

        // 如果类型发生变化，检查并清理不兼容的连接
        if (oldType !== newType) {
            // 找到所有使用该变量的黑板变量节点
            const affectedNodeIds = nodes
                .filter((node: any) =>
                    node.data.nodeType === 'blackboard-variable' &&
                    node.data.variableName === key
                )
                .map((node: any) => node.id);

            if (affectedNodeIds.length > 0) {
                // 先找出所有需要移除的连接
                const connectionsToRemove = connections.filter((conn: Connection) => {
                    // 检查是否是从黑板变量节点连出的属性连接
                    if (conn.connectionType === 'property' &&
                        affectedNodeIds.includes(conn.from) &&
                        conn.toProperty) {

                        // 找到目标节点和属性
                        const targetNode = nodes.find((n: any) => n.id === conn.to);
                        if (targetNode) {
                            const targetProperty = targetNode.template.properties.find(
                                (p: PropertyDefinition) => p.name === conn.toProperty
                            );

                            if (targetProperty && !areTypesCompatible(newType, targetProperty.type)) {
                                return true; // 需要移除
                            }
                        }
                    }
                    return false; // 不需要移除
                });

                // 如果有需要移除的连接，执行移除
                if (connectionsToRemove.length > 0) {
                    removeConnections((conn: Connection) => {
                        // 检查当前连接是否在需要移除的列表中
                        return !connectionsToRemove.some((removeConn: Connection) =>
                            removeConn.from === conn.from &&
                            removeConn.to === conn.to &&
                            removeConn.fromProperty === conn.fromProperty &&
                            removeConn.toProperty === conn.toProperty &&
                            removeConn.connectionType === conn.connectionType
                        );
                    });

                    showToast(
                        `变量 "${key}" 类型从 ${oldType} 改为 ${newType}，已移除 ${connectionsToRemove.length} 个不兼容的连接`,
                        'warning',
                        5000
                    );
                }
            }
        }
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
        } catch (error) {
            logger.error('保存全局黑板配置失败', error);
        }
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

            const saveFilePath = currentFilePath;

            // 如果没有当前文件路径，打开自定义保存对话框
            if (!saveFilePath) {
                if (!projectPath) {
                    logger.error('未设置项目路径，无法保存行为树');
                    await message('请先打开项目', { title: '错误', kind: 'error' });
                    return;
                }
                setIsSaveDialogOpen(true);
                return;
            }

            // 有文件路径，直接保存
            await saveToFile(saveFilePath);
        } catch (error) {
            logger.error('保存失败', error);
        }
    };

    const saveToFile = async (filePath: string) => {
        try {
            // 使用初始黑板变量（设计时的值）而不是运行时的值
            const varsToSave = isExecuting ? initialBlackboardVariables : blackboardVariables;
            const json = exportToJSON(
                { name: 'behavior-tree', description: '' },
                varsToSave
            );
            await invoke('write_behavior_tree_file', { filePath, content: json });
            logger.info('行为树已保存', filePath);

            // 更新当前文件路径和清除未保存标记
            setCurrentFilePath(filePath);
            setHasUnsavedChanges(false);
            isInitialMount.current = true;

            // 显示保存成功提示
            const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || '行为树';
            showToast(`${fileName} 已保存`, 'success');

            // 自动保存全局黑板配置
            if (hasUnsavedGlobalChanges) {
                await saveGlobalBlackboard();
                showToast('全局黑板已保存', 'success');
            }
        } catch (error) {
            logger.error('保存失败', error);
            showToast(`保存失败: ${error}`, 'error');
            throw error;
        }
    };

    const handleSaveDialogConfirm = async (name: string) => {
        setIsSaveDialogOpen(false);
        try {
            const filePath = `${projectPath}/.ecs/behaviors/${name}.btree`;
            await saveToFile(filePath);

            // 刷新可用文件列表
            const files = await invoke<string[]>('scan_behavior_trees', { projectPath });
            setAvailableBTreeFiles(files);
        } catch (error) {
            logger.error('保存失败', error);
        }
    };

    const handleSaveDialogCancel = () => {
        setIsSaveDialogOpen(false);
    };

    const handleNew = async () => {
        // 检查是否有未保存的更改
        if (hasUnsavedChanges) {
            const shouldSave = await ask(
                '当前行为树有未保存的更改，是否要保存？',
                {
                    title: '创建新行为树',
                    kind: 'warning',
                    okLabel: '保存',
                    cancelLabel: '不保存'
                }
            );

            if (shouldSave) {
                await handleSave();
            }
        }

        // 重置为新的空白行为树
        reset();
        setCurrentFilePath(null);
        setHasUnsavedChanges(false);
        isInitialMount.current = true;
        showToast('已创建新行为树', 'success');
        logger.info('创建新行为树');
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
                setCurrentFilePath(selected as string);
                setHasUnsavedChanges(false);
                isInitialMount.current = true;
                logger.info('行为树已加载', selected);
            }
        } catch (error) {
            logger.error('加载失败', error);
        }
    };

    const handleExportRuntime = () => {
        setIsExportDialogOpen(true);
    };

    const handleClose = async () => {
        // 检查是否有未保存的更改
        if (hasUnsavedChanges || hasUnsavedGlobalChanges) {
            const messages = [];
            if (hasUnsavedChanges) {
                messages.push('• 行为树有未保存的更改');
            }
            if (hasUnsavedGlobalChanges) {
                messages.push('• 全局变量有未保存的更改');
            }

            // 询问是否保存
            const shouldSave = await ask(
                `检测到未保存的更改：\n\n${messages.join('\n')}\n\n是否要保存更改？`,
                {
                    title: '保存确认',
                    kind: 'warning',
                    okLabel: '保存',
                    cancelLabel: '不保存'
                }
            );

            if (shouldSave) {
                // 用户选择保存
                await handleSave();
                if (hasUnsavedGlobalChanges) {
                    await saveGlobalBlackboard();
                }
                // 清空状态
                reset();
                setCurrentFilePath(null);
                setHasUnsavedChanges(false);
                isInitialMount.current = true;
                onClose();
            } else {
                // 用户选择不保存，再次确认
                const confirmDiscard = await ask(
                    '确定要放弃所有未保存的更改吗？',
                    {
                        title: '确认关闭',
                        kind: 'warning',
                        okLabel: '确定',
                        cancelLabel: '取消'
                    }
                );

                if (confirmDiscard) {
                    // 清空状态
                    reset();
                    setCurrentFilePath(null);
                    setHasUnsavedChanges(false);
                    isInitialMount.current = true;
                    onClose();
                }
                // 如果用户选择取消，则什么都不做（窗口保持打开）
            }
        } else {
            // 没有未保存的更改，直接关闭
            reset();
            setCurrentFilePath(null);
            setHasUnsavedChanges(false);
            isInitialMount.current = true;
            onClose();
        }
    };

    const handleDoExport = async (options: ExportOptions) => {
        if (options.mode === 'workspace') {
            await handleExportWorkspace(options);
        } else {
            const fileName = options.selectedFiles[0];
            if (!fileName) {
                logger.error('没有可导出的文件');
                return;
            }
            const format = options.fileFormats.get(fileName) || 'binary';
            await handleExportSingle(fileName, format, options.assetOutputPath, options.typeOutputPath);
        }
    };

    const handleExportSingle = async (fileName: string, format: 'json' | 'binary', outputPath: string, typeOutputPath: string) => {
        try {
            const extension = format === 'binary' ? 'bin' : 'json';
            const filePath = `${outputPath}/${fileName}.btree.${extension}`;

            const varsToSave = isExecuting ? initialBlackboardVariables : blackboardVariables;
            const data = exportToRuntimeAsset(
                { name: fileName, description: 'Runtime behavior tree asset' },
                varsToSave,
                format
            );

            await invoke('create_directory', { path: outputPath });

            if (format === 'binary') {
                await invoke('write_binary_file', { filePath, content: Array.from(data as Uint8Array) });
            } else {
                await invoke('write_file_content', { path: filePath, content: data as string });
            }

            logger.info(`运行时资产已导出 (${format})`, filePath);

            // 生成 TypeScript 类型定义
            await generateTypeScriptTypes(fileName, typeOutputPath);

            showToast(`${fileName} 导出成功`, 'success');
        } catch (error) {
            logger.error('导出失败', error);
            showToast(`导出失败: ${error}`, 'error');
        }
    };

    const generateTypeScriptTypes = async (assetId: string, outputPath: string): Promise<void> => {
        try {
            const sourceFilePath = `${projectPath}/.ecs/behaviors/${assetId}.btree`;
            const editorJson = await invoke<string>('read_file_content', { path: sourceFilePath });

            const editorFormat = JSON.parse(editorJson);
            const blackboard = editorFormat.blackboard || {};

            // 使用新的类型生成器
            const tsCode = LocalBlackboardTypeGenerator.generate(blackboard, {
                behaviorTreeName: assetId,
                includeConstants: true,
                includeDefaults: true,
                includeHelpers: true
            });

            const tsFilePath = `${outputPath}/${assetId}.ts`;
            await invoke('create_directory', { path: outputPath });
            await invoke('write_file_content', {
                path: tsFilePath,
                content: tsCode
            });

            logger.info(`TypeScript 类型定义已生成: ${assetId}.ts`);
        } catch (error) {
            logger.error(`生成 TypeScript 类型定义失败: ${assetId}`, error);
        }
    };

    const handleExportWorkspace = async (options: ExportOptions) => {
        if (!projectPath) {
            logger.error('未设置项目路径');
            return;
        }

        try {
            const assetOutputDir = options.assetOutputPath;

            if (options.selectedFiles.length === 0) {
                logger.warn('没有选择要导出的文件');
                return;
            }

            logger.info(`开始导出 ${options.selectedFiles.length} 个文件...`);

            for (const assetId of options.selectedFiles) {
                try {
                    const format = options.fileFormats.get(assetId) || 'binary';
                    const extension = format === 'binary' ? 'bin' : 'json';

                    const sourceFilePath = `${projectPath}/.ecs/behaviors/${assetId}.btree`;
                    const editorJson = await invoke<string>('read_file_content', { path: sourceFilePath });

                    const editorFormat = JSON.parse(editorJson);

                    const asset = EditorFormatConverter.toAsset(editorFormat, {
                        name: assetId,
                        description: editorFormat.metadata?.description || ''
                    });

                    const data = BehaviorTreeAssetSerializer.serialize(asset, {
                        format,
                        pretty: format === 'json',
                        validate: true
                    });

                    const outputFilePath = `${assetOutputDir}/${assetId}.btree.${extension}`;

                    const outputDir2 = outputFilePath.substring(0, outputFilePath.lastIndexOf('/'));
                    await invoke('create_directory', { path: outputDir2 });

                    if (format === 'binary') {
                        await invoke('write_binary_file', {
                            filePath: outputFilePath,
                            content: Array.from(data as Uint8Array)
                        });
                    } else {
                        await invoke('write_file_content', {
                            path: outputFilePath,
                            content: data as string
                        });
                    }

                    logger.info(`导出成功: ${assetId} (${format})`);

                    // 为当前文件生成 TypeScript 类型定义
                    await generateTypeScriptTypes(assetId, options.typeOutputPath);
                } catch (error) {
                    logger.error(`导出失败: ${assetId}`, error);
                }
            }

            // 导出全局变量的 TypeScript 类型定义
            try {
                const globalBlackboard = Core.services.resolve(GlobalBlackboardService);
                const config = globalBlackboard.exportConfig();
                const tsCode = GlobalBlackboardTypeGenerator.generate(config);
                const globalTsFilePath = `${options.typeOutputPath}/GlobalBlackboard.ts`;

                await invoke('write_file_content', {
                    path: globalTsFilePath,
                    content: tsCode
                });

                logger.info('全局变量类型定义已生成:', globalTsFilePath);
            } catch (error) {
                logger.error('导出全局变量类型定义失败', error);
            }

            logger.info(`工作区导出完成: ${assetOutputDir}`);
            showToast('工作区导出成功', 'success');
        } catch (error) {
            logger.error('工作区导出失败', error);
            showToast(`工作区导出失败: ${error}`, 'error');
        }
    };

    // 监听 filePath prop 变化，自动加载文件
    useEffect(() => {
        if (filePath && isOpen) {
            invoke<string>('read_behavior_tree_file', { filePath })
                .then((json: string) => {
                    importFromJSON(json);
                    setCurrentFilePath(filePath);
                    setHasUnsavedChanges(false);
                    isInitialMount.current = true;
                    logger.info('自动加载行为树文件', filePath);
                })
                .catch((error: any) => {
                    logger.error('自动加载文件失败', error);
                });
        }
    }, [filePath, isOpen, importFromJSON]);

    // 监听窗口打开，重置状态
    useEffect(() => {
        if (isOpen) {
            // 如果没有传入文件路径，说明是新建空窗口，清空所有状态
            if (!filePath) {
                reset();
                setCurrentFilePath(null);
            }
            isInitialMount.current = true;
            setHasUnsavedChanges(false);
            initialStateSnapshot.current = {
                nodes: nodes.length,
                variables: Object.keys(blackboardVariables).length
            };
        }
    }, [isOpen]);

    // 监听节点和黑板变量变化，标记为未保存
    useEffect(() => {
        // 跳过首次渲染
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // 检查是否有实际变化
        const currentNodes = nodes.length;
        const currentVariables = Object.keys(blackboardVariables).length;

        if (currentNodes !== initialStateSnapshot.current.nodes ||
            currentVariables !== initialStateSnapshot.current.variables) {
            setHasUnsavedChanges(true);
        }
    }, [nodes, blackboardVariables]);

    if (!isOpen) return null;

    return (
        <div className="behavior-tree-overlay">
            <div className={`behavior-tree-window ${isFullscreen ? 'fullscreen' : ''}`}>
                <div className="behavior-tree-header">
                    <div className="behavior-tree-title">
                        <TreePine size={20} />
                        <span>
                            {currentFilePath
                                ? `${currentFilePath.split(/[\\/]/).pop()?.replace('.btree', '')}${hasUnsavedChanges ? ' *' : ''}`
                                : t('behaviorTree.title')
                            }
                        </span>
                    </div>
                    <div className="behavior-tree-toolbar">
                        <button onClick={handleNew} className="behavior-tree-toolbar-btn" title="新建">
                            <FilePlus size={16} />
                        </button>
                        <button onClick={handleLoad} className="behavior-tree-toolbar-btn" title="打开">
                            <FolderOpen size={16} />
                        </button>
                        <button onClick={handleSave} className="behavior-tree-toolbar-btn" title="保存">
                            <Save size={16} />
                        </button>
                        <button onClick={handleExportRuntime} className="behavior-tree-toolbar-btn" title="导出运行时资产">
                            <Download size={16} />
                        </button>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="behavior-tree-toolbar-btn"
                            title={isFullscreen ? '退出全屏' : '全屏'}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button onClick={handleClose} className="behavior-tree-toolbar-btn" title={t('behaviorTree.close')}>
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
                            projectPath={projectPath || propProjectPath || null}
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
                                    projectPath={projectPath}
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

            <ExportRuntimeDialog
                isOpen={isExportDialogOpen}
                onClose={() => setIsExportDialogOpen(false)}
                onExport={handleDoExport}
                hasProject={!!projectPath}
                availableFiles={availableBTreeFiles}
                currentFileName={currentFilePath ? currentFilePath.split(/[\\/]/).pop()?.replace('.btree', '') : undefined}
                projectPath={projectPath}
            />

            <BehaviorTreeNameDialog
                isOpen={isSaveDialogOpen}
                onConfirm={handleSaveDialogConfirm}
                onCancel={handleSaveDialogCancel}
            />
        </div>
    );
};
