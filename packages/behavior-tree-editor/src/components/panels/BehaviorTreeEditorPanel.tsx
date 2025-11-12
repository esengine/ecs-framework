import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Save, FolderOpen, Home } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open, message } from '@tauri-apps/plugin-dialog';
import { createLogger } from '@esengine/ecs-framework';
import { BehaviorTreeCanvas } from '../canvas/BehaviorTreeCanvas';
import { useTreeStore } from '../../stores/useTreeStore';
import { behaviorTreeFileService } from '../../services/BehaviorTreeFileService';
import './BehaviorTreeEditorPanel.css';

const logger = createLogger('BehaviorTreeEditorPanel');

interface BehaviorTreeEditorPanelProps {
    projectPath?: string | null;
}

export const BehaviorTreeEditorPanel: React.FC<BehaviorTreeEditorPanelProps> = ({ projectPath: propProjectPath }) => {
    const {
        isOpen,
        pendingFilePath,
        setPendingFilePath,
        nodes,
        connections,
        exportToJSON,
        blackboardVariables
    } = useTreeStore();

    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [projectPath, setProjectPath] = useState<string>('');
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [canvasScale, setCanvasScale] = useState(1);
    const processingFileRef = useRef<string | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        const initProject = async () => {
            if (propProjectPath) {
                setProjectPath(propProjectPath);
                localStorage.setItem('ecs-project-path', propProjectPath);
            } else {
                const savedPath = localStorage.getItem('ecs-project-path');
                if (savedPath) {
                    setProjectPath(savedPath);
                }
            }
        };
        initProject();
    }, [propProjectPath]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setHasUnsavedChanges(true);
    }, [nodes, blackboardVariables]);

    const loadFile = useCallback(async (filePath: string) => {
        const result = await behaviorTreeFileService.loadFile(filePath);

        if (result.success && result.fileName) {
            setCurrentFilePath(filePath);
            setHasUnsavedChanges(false);
            isInitialMount.current = true;
            logger.info(`已打开 ${result.fileName}`);
        } else if (result.error) {
            logger.error(`加载失败: ${result.error}`);
        }
    }, []);

    useLayoutEffect(() => {
        if (!pendingFilePath) return;

        if (processingFileRef.current === pendingFilePath) {
            return;
        }

        processingFileRef.current = pendingFilePath;

        loadFile(pendingFilePath).then(() => {
            setPendingFilePath(null);
            processingFileRef.current = null;
        });
    }, [pendingFilePath, loadFile, setPendingFilePath]);

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
                    logger.info(`已打开 ${result.fileName}`);
                } else if (result.error) {
                    logger.error(`加载失败: ${result.error}`);
                }
            }
        } catch (error) {
            logger.error('加载失败', error);
        }
    };

    const handleSave = async () => {
        try {
            const saveFilePath = currentFilePath;

            if (!saveFilePath) {
                if (!projectPath) {
                    logger.error('未设置项目路径，无法保存行为树');
                    await message('请先打开项目', { title: '错误', kind: 'error' });
                    return;
                }
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
            logger.info(`${fileName} 已保存`);
        } catch (error) {
            logger.error('保存失败', error);
            throw error;
        }
    };

    const resetView = () => {
        setCanvasOffset({ x: 0, y: 0 });
        setCanvasScale(1);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="behavior-tree-editor-panel">
            <div className="behavior-tree-editor-toolbar">
                <div className="toolbar-section">
                    <button onClick={handleOpen} className="toolbar-btn" title="打开">
                        <FolderOpen size={16} />
                    </button>
                    <button onClick={handleSave} className="toolbar-btn" title="保存">
                        <Save size={16} />
                    </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-section">
                    <button onClick={resetView} className="toolbar-btn" title="重置视图">
                        <Home size={16} />
                    </button>
                </div>

                <div className="toolbar-section file-info">
                    <span className="file-name">
                        {currentFilePath
                            ? `${currentFilePath.split(/[\\/]/).pop()?.replace('.btree', '')}${hasUnsavedChanges ? ' *' : ''}`
                            : '行为树编辑器'
                        }
                    </span>
                </div>
            </div>

            <div className="behavior-tree-editor-content">
                <div className="editor-canvas-area">
                    <BehaviorTreeCanvas
                        config={{
                            showGrid: true,
                            gridSize: 20,
                            snapToGrid: false
                        }}
                    >
                        <div style={{ padding: '20px', color: '#ccc' }}>
                            <p>行为树编辑器 - 当前节点数: {nodes.length}</p>
                            <p>当前连接数: {connections.length}</p>
                            {currentFilePath && <p>文件: {currentFilePath}</p>}
                        </div>
                    </BehaviorTreeCanvas>
                </div>
            </div>
        </div>
    );
};
