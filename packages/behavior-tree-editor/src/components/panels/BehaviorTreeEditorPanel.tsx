import {
    React,
    useState,
    useCallback,
    useEffect,
    createLogger,
    open,
    save,
    Icons,
    PluginAPI,
} from '@esengine/editor-runtime';
import { useBehaviorTreeDataStore } from '../../stores';
import { BehaviorTreeEditor } from '../BehaviorTreeEditor';
import { BehaviorTreeServiceToken } from '../../tokens';
import { showToast } from '../../services/NotificationService';
import { Node as BehaviorTreeNode } from '../../domain/models/Node';
import { BehaviorTree } from '../../domain/models/BehaviorTree';
import './BehaviorTreeEditorPanel.css';

const { FolderOpen } = Icons;

const logger = createLogger('BehaviorTreeEditorPanel');

/**
 * 行为树编辑器面板组件
 * 提供完整的行为树编辑功能，包括：
 * - 节点的创建、删除、移动
 * - 连接管理
 * - 黑板变量管理
 * - 文件保存和加载
 */
interface BehaviorTreeEditorPanelProps {
    /** 项目路径，用于文件系统操作 */
    projectPath?: string | null;
    /** 导出对话框打开回调 */
    onOpenExportDialog?: () => void;
    /** 获取可用文件列表回调 */
    onGetAvailableFiles?: () => string[];
}

export const BehaviorTreeEditorPanel: React.FC<BehaviorTreeEditorPanelProps> = ({
    projectPath,
    onOpenExportDialog
    // onGetAvailableFiles - 保留用于未来的批量导出功能
}) => {
    const isOpen = useBehaviorTreeDataStore((state) => state.isOpen);
    const blackboardVariables = useBehaviorTreeDataStore((state) => state.blackboardVariables);

    // 文件状态管理
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [currentFileName, setCurrentFileName] = useState<string>('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');

    // 监听树的变化来检测未保存更改
    const tree = useBehaviorTreeDataStore((state) => state.tree);
    const storeFilePath = useBehaviorTreeDataStore((state) => state.currentFilePath);
    const storeFileName = useBehaviorTreeDataStore((state) => state.currentFileName);

    // 初始化时从 store 读取文件信息（解决时序问题）
    useEffect(() => {
        if (storeFilePath && !currentFilePath) {
            setCurrentFilePath(storeFilePath);
            setCurrentFileName(storeFileName);
            const loadedTree = useBehaviorTreeDataStore.getState().tree;
            setLastSavedSnapshot(JSON.stringify(loadedTree));
            setHasUnsavedChanges(false);
        }
    }, [storeFilePath, storeFileName, currentFilePath]);

    useEffect(() => {
        if (isOpen && lastSavedSnapshot) {
            const currentSnapshot = JSON.stringify(tree);
            setHasUnsavedChanges(currentSnapshot !== lastSavedSnapshot);
        }
    }, [tree, lastSavedSnapshot, isOpen]);

    useEffect(() => {
        // 检查 PluginAPI 是否可用
        if (!PluginAPI.isAvailable) {
            return;
        }

        let unsubscribeFileOpened: (() => void) | undefined;
        let unsubscribePropertyChanged: (() => void) | undefined;

        try {
            const messageHub = PluginAPI.messageHub;

            // 订阅文件打开事件
            unsubscribeFileOpened = messageHub.subscribe('behavior-tree:file-opened', (data: { filePath: string; fileName: string }) => {
                setCurrentFilePath(data.filePath);
                setCurrentFileName(data.fileName);
                const loadedTree = useBehaviorTreeDataStore.getState().tree;
                setLastSavedSnapshot(JSON.stringify(loadedTree));
                setHasUnsavedChanges(false);
            });

            // 订阅节点属性更改事件
            unsubscribePropertyChanged = messageHub.subscribe('behavior-tree:node-property-changed',
                (data: { nodeId: string; propertyName: string; value: any }) => {
                    const state = useBehaviorTreeDataStore.getState();
                    const node = state.getNode(data.nodeId);

                    if (node) {
                        const newData = { ...node.data, [data.propertyName]: data.value };

                        // 更新节点数据
                        const updatedNode = new BehaviorTreeNode(
                            node.id,
                            node.template,
                            newData,
                            node.position,
                            Array.from(node.children)
                        );

                        // 更新树
                        const nodes = state.getNodes().map((n) =>
                            n.id === data.nodeId ? updatedNode : n
                        );

                        const newTree = new BehaviorTree(
                            nodes,
                            state.getConnections(),
                            state.getBlackboard(),
                            state.getRootNodeId()
                        );

                        state.setTree(newTree);
                        setHasUnsavedChanges(true);

                        // 强制刷新画布
                        state.triggerForceUpdate();
                    }
                }
            );
        } catch (error) {
            logger.error('Failed to subscribe to events:', error);
        }

        return () => {
            unsubscribeFileOpened?.();
            unsubscribePropertyChanged?.();
        };
    }, [isOpen]);

    const handleNodeSelect = useCallback((node: BehaviorTreeNode) => {
        try {
            if (!PluginAPI.isAvailable) {
                return;
            }
            const messageHub = PluginAPI.messageHub;
            messageHub.publish('behavior-tree:node-selected', { data: node });
        } catch (error) {
            logger.error('Failed to publish node selection:', error);
        }
    }, []);

    const handleSave = useCallback(async () => {
        try {
            let filePath = currentFilePath;

            if (!filePath) {
                const selected = await save({
                    filters: [{ name: 'Behavior Tree', extensions: ['btree'] }],
                    defaultPath: projectPath || undefined,
                    title: '保存行为树'
                });

                if (!selected) return;
                filePath = selected;
            }

            const service = PluginAPI.resolve(BehaviorTreeServiceToken);
            await service.saveToFile(filePath);

            setCurrentFilePath(filePath);
            const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || 'Untitled';
            setCurrentFileName(fileName);
            setLastSavedSnapshot(JSON.stringify(tree));
            setHasUnsavedChanges(false);

            showToast(`文件已保存: ${fileName}.btree`, 'success');
        } catch (error) {
            logger.error('Failed to save file:', error);
            showToast(`保存失败: ${error}`, 'error');
        }
    }, [currentFilePath, projectPath, tree]);

    const handleOpen = useCallback(async () => {
        try {
            if (hasUnsavedChanges) {
                const confirmed = window.confirm('当前文件有未保存的更改，是否继续打开新文件？');
                if (!confirmed) return;
            }

            const selected = await open({
                filters: [{ name: 'Behavior Tree', extensions: ['btree'] }],
                multiple: false,
                directory: false,
                defaultPath: projectPath || undefined,
                title: '打开行为树'
            });

            if (!selected) return;

            const filePath = selected as string;
            const service = PluginAPI.resolve(BehaviorTreeServiceToken);
            await service.loadFromFile(filePath);

            setCurrentFilePath(filePath);
            const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || 'Untitled';
            setCurrentFileName(fileName);

            const loadedTree = useBehaviorTreeDataStore.getState().tree;
            setLastSavedSnapshot(JSON.stringify(loadedTree));
            setHasUnsavedChanges(false);

            showToast(`文件已打开: ${fileName}.btree`, 'success');
        } catch (error) {
            logger.error('Failed to open file:', error);
            showToast(`打开失败: ${error}`, 'error');
        }
    }, [hasUnsavedChanges, projectPath]);

    const handleExport = useCallback(() => {
        if (onOpenExportDialog) {
            onOpenExportDialog();
            return;
        }

        try {
            const messageHub = PluginAPI.messageHub;
            messageHub.publish('compiler:open-dialog', {
                compilerId: 'behavior-tree',
                currentFileName: currentFileName || undefined,
                projectPath: projectPath || undefined
            });
        } catch (error) {
            logger.error('Failed to open export dialog:', error);
            showToast(`无法打开导出对话框: ${error}`, 'error');
        }
    }, [onOpenExportDialog, currentFileName, projectPath]);

    const handleCopyToClipboard = useCallback(async () => {
        try {
            const store = useBehaviorTreeDataStore.getState();
            const metadata = { name: currentFileName || 'Untitled', description: '' };
            const jsonContent = store.exportToJSON(metadata);

            await navigator.clipboard.writeText(jsonContent);
            showToast('已复制到剪贴板', 'success');
        } catch (error) {
            logger.error('Failed to copy to clipboard:', error);
            showToast(`复制失败: ${error}`, 'error');
        }
    }, [currentFileName]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                handleOpen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handleOpen]);

    if (!isOpen) {
        return (
            <div className="behavior-tree-editor-empty">
                <div className="empty-state">
                    <FolderOpen size={48} />
                    <p>No behavior tree file opened</p>
                    <p className="hint">Double-click a .btree file to edit</p>
                    <button
                        onClick={handleOpen}
                        style={{
                            marginTop: '16px',
                            padding: '8px 16px',
                            backgroundColor: '#0e639c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FolderOpen size={16} />
                        打开文件
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="behavior-tree-editor-panel">
            <BehaviorTreeEditor
                blackboardVariables={blackboardVariables}
                projectPath={projectPath}
                showToolbar={true}
                currentFileName={currentFileName}
                hasUnsavedChanges={hasUnsavedChanges}
                onNodeSelect={handleNodeSelect}
                onSave={handleSave}
                onOpen={handleOpen}
                onExport={handleExport}
                onCopyToClipboard={handleCopyToClipboard}
            />
        </div>
    );
};
