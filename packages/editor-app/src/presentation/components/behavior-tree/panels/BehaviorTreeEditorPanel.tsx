import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, FolderOpen, Download, Play, Pause, Square, SkipForward, Clipboard, ChevronRight, ChevronLeft, Copy, Home, Maximize2, Minimize2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open, message } from '@tauri-apps/plugin-dialog';
import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { BehaviorTreeEditor } from '../../../../components/BehaviorTreeEditor';
import { BehaviorTreeBlackboard } from '../../../../components/BehaviorTreeBlackboard';
import { ExportRuntimeDialog, type ExportOptions } from '../../../../components/ExportRuntimeDialog';
import { BehaviorTreeNameDialog } from '../../../../components/BehaviorTreeNameDialog';
import { useToast } from '../../../../components/Toast';
import { useBehaviorTreeStore, ROOT_NODE_ID } from '../../../../stores/behaviorTreeStore';
import { EditorFormatConverter, BehaviorTreeAssetSerializer, GlobalBlackboardService, type BlackboardValueType } from '@esengine/behavior-tree';
import { createLogger } from '@esengine/ecs-framework';
import { LocalBlackboardTypeGenerator } from '../../../../generators/LocalBlackboardTypeGenerator';
import { GlobalBlackboardTypeGenerator } from '../../../../generators/GlobalBlackboardTypeGenerator';
import { useExecutionController } from '../../../hooks/useExecutionController';
import { behaviorTreeFileService } from '../../../../services/BehaviorTreeFileService';
import './BehaviorTreeEditorPanel.css';

const logger = createLogger('BehaviorTreeEditorPanel');

interface BehaviorTreeEditorPanelProps {
    projectPath?: string | null;
}

export const BehaviorTreeEditorPanel: React.FC<BehaviorTreeEditorPanelProps> = ({ projectPath: propProjectPath }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const messageHub = Core.services.resolve(MessageHub);

    const {
        isOpen,
        pendingFilePath,
        setPendingFilePath,
        nodes,
        connections,
        exportToJSON,
        exportToRuntimeAsset,
        blackboardVariables,
        setBlackboardVariables,
        updateBlackboardVariable,
        initialBlackboardVariables,
        setInitialBlackboardVariables,
        isExecuting,
        setIsExecuting,
        saveNodesDataSnapshot,
        restoreNodesData,
        resetView
    } = useBehaviorTreeStore();

    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [projectPath, setProjectPath] = useState<string>('');
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [availableBTreeFiles, setAvailableBTreeFiles] = useState<string[]>([]);
    const [isBlackboardOpen, setIsBlackboardOpen] = useState(true);
    const [globalVariables, setGlobalVariables] = useState<Record<string, any>>({});
    const [hasUnsavedGlobalChanges, setHasUnsavedGlobalChanges] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isInitialMount = useRef(true);
    const initialStateSnapshot = useRef<{ nodes: number; variables: number }>({ nodes: 0, variables: 0 });
    const processingFileRef = useRef<string | null>(null);

    const {
        executionMode,
        executionSpeed,
        handlePlay,
        handlePause,
        handleStop,
        handleStep,
        handleSpeedChange
    } = useExecutionController({
        rootNodeId: ROOT_NODE_ID,
        projectPath: projectPath || '',
        blackboardVariables,
        nodes,
        connections,
        initialBlackboardVariables,
        onBlackboardUpdate: setBlackboardVariables,
        onInitialBlackboardSave: setInitialBlackboardVariables,
        onExecutingChange: setIsExecuting,
        onSaveNodesDataSnapshot: saveNodesDataSnapshot,
        onRestoreNodesData: restoreNodesData
    });

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
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const currentNodes = nodes.length;
        const currentVariables = Object.keys(blackboardVariables).length;

        if (currentNodes !== initialStateSnapshot.current.nodes ||
            currentVariables !== initialStateSnapshot.current.variables) {
            setHasUnsavedChanges(true);
        }
    }, [nodes, blackboardVariables]);

    const loadFile = useCallback(async (filePath: string) => {
        const result = await behaviorTreeFileService.loadFile(filePath);

        if (result.success && result.fileName) {
            setCurrentFilePath(filePath);
            setHasUnsavedChanges(false);
            isInitialMount.current = true;
            initialStateSnapshot.current = { nodes: 0, variables: 0 };
            showToast(`已打开 ${result.fileName}`, 'success');
        } else if (result.error) {
            showToast(`加载失败: ${result.error}`, 'error');
        }
    }, [showToast]);

    // 使用 useLayoutEffect 处理 pendingFilePath（同步执行，DOM 更新前）
    // 这是文件加载的唯一入口，避免重复
    useLayoutEffect(() => {
        if (!pendingFilePath) return;

        // 防止 React StrictMode 导致的重复执行
        if (processingFileRef.current === pendingFilePath) {
            return;
        }

        processingFileRef.current = pendingFilePath;

        loadFile(pendingFilePath).then(() => {
            setPendingFilePath(null);
            processingFileRef.current = null;
        });
    }, [pendingFilePath, loadFile, setPendingFilePath]);

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

    const handleOpen = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Behavior Tree',
                    extensions: ['btree']
                }]
            });

            if (selected) {
                const result = await behaviorTreeFileService.loadFile(selected as string);
                if (result.success && result.fileName) {
                    setCurrentFilePath(selected as string);
                    setHasUnsavedChanges(false);
                    isInitialMount.current = true;
                    initialStateSnapshot.current = { nodes: 0, variables: 0 };
                    showToast(`已打开 ${result.fileName}`, 'success');
                } else if (result.error) {
                    showToast(`加载失败: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            logger.error('加载失败', error);
            showToast(`加载失败: ${error}`, 'error');
        }
    };

    const handleSave = async () => {
        try {
            if (isExecuting) {
                const confirmed = window.confirm(
                    '行为树正在运行中。保存将使用设计时的初始值，运行时修改的黑板变量不会被保存。\n\n是否继续保存？'
                );
                if (!confirmed) {
                    return;
                }
            }

            const saveFilePath = currentFilePath;

            if (!saveFilePath) {
                if (!projectPath) {
                    logger.error('未设置项目路径，无法保存行为树');
                    await message('请先打开项目', { title: '错误', kind: 'error' });
                    return;
                }
                setIsSaveDialogOpen(true);
                return;
            }

            await saveToFile(saveFilePath);
        } catch (error) {
            logger.error('保存失败', error);
        }
    };

    const saveToFile = async (filePath: string) => {
        try {
            const json = exportToJSON({ name: 'behavior-tree', description: '' });
            await invoke('write_behavior_tree_file', { filePath, content: json });
            logger.info('行为树已保存', filePath);

            setCurrentFilePath(filePath);
            setHasUnsavedChanges(false);
            isInitialMount.current = true;

            const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || '行为树';
            showToast(`${fileName} 已保存`, 'success');
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

            const files = await invoke<string[]>('scan_behavior_trees', { projectPath });
            setAvailableBTreeFiles(files);
        } catch (error) {
            logger.error('保存失败', error);
        }
    };

    const handleExportRuntime = () => {
        setIsExportDialogOpen(true);
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

            const data = exportToRuntimeAsset(
                { name: fileName, description: 'Runtime behavior tree asset' },
                format
            );

            await invoke('create_directory', { path: outputPath });

            if (format === 'binary') {
                await invoke('write_binary_file', { filePath, content: Array.from(data as Uint8Array) });
            } else {
                await invoke('write_file_content', { path: filePath, content: data as string });
            }

            logger.info(`运行时资产已导出 (${format})`, filePath);

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

    const handleCopyBehaviorTree = () => {
        const buildNodeTree = (nodeId: string, depth: number = 0): string => {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return '';

            const indent = '  '.repeat(depth);
            const childrenText = node.children.length > 0
                ? `\n${node.children.map((childId) => buildNodeTree(childId, depth + 1)).join('\n')}`
                : '';

            const propertiesText = Object.keys(node.data).length > 0
                ? ` [${Object.entries(node.data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')}]`
                : '';

            return `${indent}- ${node.template.displayName} (${node.template.type})${propertiesText}${childrenText}`;
        };

        const rootNode = nodes.find((n) => n.id === ROOT_NODE_ID);
        if (!rootNode) {
            showToast('未找到根节点', 'error');
            return;
        }

        const treeStructure = `
行为树结构
==========
文件: ${currentFilePath || '未保存'}
节点总数: ${nodes.length}
连接总数: ${connections.length}

节点树:
${buildNodeTree(ROOT_NODE_ID)}

黑板变量 (${Object.keys(blackboardVariables).length}个):
${Object.entries(blackboardVariables).map(([key, value]) => `  - ${key}: ${JSON.stringify(value)}`).join('\n') || '  无'}

全部节点详情:
${nodes.filter((n) => n.id !== ROOT_NODE_ID).map((node) => {
        const incoming = connections.filter((c) => c.to === node.id);
        const outgoing = connections.filter((c) => c.from === node.id);
        return `
[${node.template.displayName}]
  类型: ${node.template.type}
  分类: ${node.template.category}
  类名: ${node.template.className || '无'}
  ID: ${node.id}
  子节点: ${node.children.length}个
  输入连接: ${incoming.length}个${incoming.length > 0 ? '\n    ' + incoming.map((c) => {
    const fromNode = nodes.find((n) => n.id === c.from);
    return `← ${fromNode?.template.displayName || '未知'}`;
}).join('\n    ') : ''}
  输出连接: ${outgoing.length}个${outgoing.length > 0 ? '\n    ' + outgoing.map((c) => {
    const toNode = nodes.find((n) => n.id === c.to);
    return `→ ${toNode?.template.displayName || '未知'}`;
}).join('\n    ') : ''}
  属性: ${JSON.stringify(node.data, null, 4)}`;
    }).join('\n')}
        `.trim();

        navigator.clipboard.writeText(treeStructure).then(() => {
            showToast('行为树结构已复制到剪贴板', 'success');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = treeStructure;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('行为树结构已复制到剪贴板', 'success');
        });
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

                    await generateTypeScriptTypes(assetId, options.typeOutputPath);
                } catch (error) {
                    logger.error(`导出失败: ${assetId}`, error);
                }
            }

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

    const toggleFullscreen = () => {
        const newFullscreenState = !isFullscreen;
        setIsFullscreen(newFullscreenState);

        // 通知主界面切换全屏状态
        messageHub?.publish('editor:fullscreen', { fullscreen: newFullscreenState });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={`behavior-tree-editor-panel ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="behavior-tree-editor-toolbar">
                {/* 文件操作 */}
                <div className="toolbar-section">
                    <button onClick={handleOpen} className="toolbar-btn" title="打开">
                        <FolderOpen size={16} />
                    </button>
                    <button onClick={handleSave} className="toolbar-btn" title="保存">
                        <Save size={16} />
                    </button>
                    <button onClick={handleExportRuntime} className="toolbar-btn" title="导出运行时资产">
                        <Download size={16} />
                    </button>
                </div>

                <div className="toolbar-divider" />

                {/* 执行控制 */}
                <div className="toolbar-section">
                    {executionMode === 'idle' || executionMode === 'step' ? (
                        <button onClick={handlePlay} className="toolbar-btn btn-play" title="开始执行">
                            <Play size={16} />
                        </button>
                    ) : executionMode === 'paused' ? (
                        <button onClick={handlePlay} className="toolbar-btn btn-play" title="继续">
                            <Play size={16} />
                        </button>
                    ) : (
                        <button onClick={handlePause} className="toolbar-btn btn-pause" title="暂停">
                            <Pause size={16} />
                        </button>
                    )}
                    <button onClick={handleStop} className="toolbar-btn btn-stop" title="停止" disabled={executionMode === 'idle'}>
                        <Square size={16} />
                    </button>
                    <button onClick={handleStep} className="toolbar-btn btn-step" title="单步执行" disabled={executionMode === 'running'}>
                        <SkipForward size={16} />
                    </button>

                    <div className="speed-control">
                        <span className="speed-label">速率:</span>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={executionSpeed}
                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                            className="speed-slider"
                            title={`执行速率: ${executionSpeed.toFixed(1)}x`}
                        />
                        <span className="speed-value">{executionSpeed.toFixed(1)}x</span>
                    </div>
                </div>

                <div className="toolbar-divider" />

                {/* 视图控制 */}
                <div className="toolbar-section">
                    <button onClick={resetView} className="toolbar-btn" title="重置视图">
                        <Home size={16} />
                    </button>
                    <button onClick={toggleFullscreen} className="toolbar-btn" title={isFullscreen ? '退出全屏' : '全屏编辑'}>
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button onClick={() => setIsBlackboardOpen(!isBlackboardOpen)} className="toolbar-btn" title="黑板">
                        <Clipboard size={16} />
                    </button>
                    <button onClick={handleCopyBehaviorTree} className="toolbar-btn" title="复制整个行为树结构">
                        <Copy size={16} />
                    </button>
                </div>

                {/* 文件名 */}
                <div className="toolbar-section file-info">
                    <span className="file-name">
                        {currentFilePath
                            ? `${currentFilePath.split(/[\\/]/).pop()?.replace('.btree', '')}${hasUnsavedChanges ? ' *' : ''}`
                            : t('behaviorTree.title')
                        }
                    </span>
                </div>
            </div>

            <div className="behavior-tree-editor-content">
                <div className="editor-canvas-area">
                    <BehaviorTreeEditor
                        onNodeSelect={(node) => {
                            messageHub?.publish('behavior-tree:node-selected', { node });
                        }}
                        onNodeCreate={(_template, _position) => {
                            // Node created
                        }}
                        blackboardVariables={blackboardVariables}
                        projectPath={projectPath || propProjectPath || null}
                        showToolbar={false}
                    />
                </div>

                {isBlackboardOpen && (
                    <div className="blackboard-sidebar">
                        <div className="blackboard-header">
                            <span>{t('behaviorTree.blackboard')}</span>
                            <button onClick={() => setIsBlackboardOpen(false)} className="close-btn">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="blackboard-content">
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
                        </div>
                    </div>
                )}

                {!isBlackboardOpen && (
                    <button onClick={() => setIsBlackboardOpen(true)} className="blackboard-toggle-btn" title="显示黑板">
                        <ChevronLeft size={16} />
                    </button>
                )}
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
                onCancel={() => setIsSaveDialogOpen(false)}
            />
        </div>
    );
};
