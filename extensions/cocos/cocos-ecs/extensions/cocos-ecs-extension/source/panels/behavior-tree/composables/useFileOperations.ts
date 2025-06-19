import { Ref, ref, watch } from 'vue';
import { TreeNode, Connection } from '../types';

interface FileOperationOptions {
    treeNodes: Ref<TreeNode[]>;
    selectedNodeId: Ref<string | null>;
    connections: Ref<Connection[]>;
    tempConnection: Ref<{ path: string }>;
    showExportModal: Ref<boolean>;
    codeGeneration?: {
        createTreeFromConfig: (config: any) => TreeNode[];
    };
    updateConnections?: () => void;
    blackboardOperations?: {
        getBlackboardVariables: () => any[];
        loadBlackboardVariables: (variables: any[]) => void;
        clearBlackboard: () => void;
    };
}

interface FileData {
    nodes: TreeNode[];
    connections: Connection[];
    blackboard?: any[];
    metadata: {
        name: string;
        created: string;
        version: string;
    };
}

export function useFileOperations(options: FileOperationOptions) {
    const {
        treeNodes,
        selectedNodeId,
        connections,
        tempConnection,
        showExportModal,
        codeGeneration,
        updateConnections,
        blackboardOperations
    } = options;

    const hasUnsavedChanges = ref(false);
    const lastSavedState = ref<string>('');
    const currentFileName = ref('');
    const currentFilePath = ref('');

    const updateUnsavedStatus = () => {
        const currentState = JSON.stringify({
            nodes: treeNodes.value,
            connections: connections.value
        });
        hasUnsavedChanges.value = currentState !== lastSavedState.value;
    };

    watch([treeNodes, connections], updateUnsavedStatus, { deep: true });

    const markAsSaved = () => {
        const currentState = JSON.stringify({
            nodes: treeNodes.value,
            connections: connections.value
        });
        lastSavedState.value = currentState;
        hasUnsavedChanges.value = false;
    };

    const setCurrentFile = (fileName: string, filePath: string = '') => {
        currentFileName.value = fileName;
        currentFilePath.value = filePath;
        markAsSaved();
    };

    const clearCurrentFile = () => {
        currentFileName.value = '';
        currentFilePath.value = '';
    };

    const exportBehaviorTreeData = (): FileData => {
        const data: FileData = {
            nodes: treeNodes.value,
            connections: connections.value,
            metadata: {
                name: currentFileName.value || 'untitled',
                created: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        // 包含黑板数据
        if (blackboardOperations) {
            const blackboardVariables = blackboardOperations.getBlackboardVariables();
            if (blackboardVariables.length > 0) {
                data.blackboard = blackboardVariables;
            }
        }
        
        return data;
    };

    const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    };

    const sendToMain = (message: string, data: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            try {
                Editor.Message.request('cocos-ecs-extension', message, data)
                    .then((result) => {
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    };

    const checkUnsavedChanges = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!hasUnsavedChanges.value) {
                resolve(true);
                return;
            }
            
            const result = confirm(
                '当前行为树有未保存的更改，是否要保存？\n\n' +
                '点击"确定"保存更改\n' +
                '点击"取消"丢弃更改'
            );
            
            if (result) {
                saveBehaviorTree().then(() => {
                    resolve(true);
                }).catch(() => {
                    resolve(false);
                });
            } else {
                resolve(true);
            }
        });
    };

    const newBehaviorTree = async () => {
        const canProceed = await checkUnsavedChanges();
        if (canProceed) {
            treeNodes.value = [];
            selectedNodeId.value = null;
            connections.value = [];
            tempConnection.value.path = '';
            
            // 清空黑板
            if (blackboardOperations) {
                blackboardOperations.clearBlackboard();
            }
            
            clearCurrentFile();
            markAsSaved();
        }
    };

    const saveBehaviorTree = async (): Promise<boolean> => {
        if (currentFilePath.value) {
            return await saveToCurrentFile();
        } else {
            return await saveAsBehaviorTree();
        }
    };

    const saveToCurrentFile = async (): Promise<boolean> => {
        if (!currentFilePath.value) {
            return await saveAsBehaviorTree();
        }
        
        try {
            const data = exportBehaviorTreeData();
            const jsonString = JSON.stringify(data, null, 2);
            
            await sendToMain('overwrite-behavior-tree-file', {
                filePath: currentFilePath.value,
                content: jsonString
            });
            
            markAsSaved();
            showMessage('保存成功！');
            return true;
        } catch (error) {
            showMessage('保存失败: ' + error, 'error');
            return false;
        }
    };

    const saveAsBehaviorTree = async (): Promise<boolean> => {
        try {
            const data = exportBehaviorTreeData();
            const jsonString = JSON.stringify(data, null, 2);
            
            const result = await Editor.Dialog.save({
                title: '保存行为树文件',
                filters: [
                    { name: '行为树文件', extensions: ['bt.json', 'json'] },
                    { name: '所有文件', extensions: ['*'] }
                ]
            });
            
            if (result.canceled || !result.filePath) {
                return false;
            }
            
            const fs = require('fs-extra');
            await fs.writeFile(result.filePath, jsonString);
            
            const path = require('path');
            const fileName = path.basename(result.filePath, path.extname(result.filePath));
            setCurrentFile(fileName, result.filePath);
            showMessage(`保存成功！文件: ${result.filePath}`);
            
            return true;
        } catch (error) {
            showMessage('另存为失败: ' + error, 'error');
            return false;
        }
    };

    const saveToFile = async (fileName: string, jsonString: string): Promise<boolean> => {
        try {
            await sendToMain('create-behavior-tree-from-editor', {
                fileName: fileName + '.json',
                content: jsonString
            });
            
            setCurrentFile(fileName, `assets/${fileName}.bt.json`);
            showMessage(`保存成功！文件名: ${fileName}.json`);
            return true;
        } catch (error) {
            showMessage('保存失败: ' + error, 'error');
            return false;
        }
    };

    const getFileNameFromUser = (): Promise<string | null> => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: #2d2d2d;
                color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                min-width: 300px;
            `;
            
            dialog.innerHTML = `
                <h3 style="margin: 0 0 15px 0; color: #ffffff;">保存行为树</h3>
                <p style="margin: 0 0 15px 0; color: #cccccc;">请输入文件名（不含扩展名）:</p>
                <input type="text" id="filename-input" value="${currentFileName.value || 'behavior_tree'}" 
                       style="width: 100%; padding: 8px; border: 1px solid #555; background: #1a1a1a; color: #ffffff; border-radius: 4px; margin-bottom: 15px;">
                <div style="text-align: right;">
                    <button id="cancel-btn" style="padding: 8px 16px; margin-right: 8px; background: #555; color: #fff; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                    <button id="save-btn" style="padding: 8px 16px; background: #007acc; color: #fff; border: none; border-radius: 4px; cursor: pointer;">保存</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            const input = dialog.querySelector('#filename-input') as HTMLInputElement;
            const saveBtn = dialog.querySelector('#save-btn') as HTMLButtonElement;
            const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLButtonElement;
            
            input.focus();
            input.select();
            
            const cleanup = () => {
                document.body.removeChild(overlay);
            };
            
            saveBtn.onclick = () => {
                const fileName = input.value.trim();
                cleanup();
                resolve(fileName || null);
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                resolve(null);
            };
            
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    const fileName = input.value.trim();
                    cleanup();
                    resolve(fileName || null);
                } else if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                }
            };
        });
    };

    const loadFileContent = (fileData: any, filePath: string = '') => {
        try {
            if (!fileData) {
                return;
            }
            
            let parsedData = fileData;
            
            if (fileData.rawContent) {
                try {
                    parsedData = JSON.parse(fileData.rawContent);
                } catch (e) {
                    parsedData = {
                        nodes: [],
                        connections: []
                    };
                }
            }
            
            if (parsedData.nodes && Array.isArray(parsedData.nodes)) {
                treeNodes.value = parsedData.nodes.map((node: any) => ({
                    ...node,
                    x: node.x || 0,
                    y: node.y || 0,
                    children: node.children || [],
                    properties: node.properties || {},
                    canHaveChildren: node.canHaveChildren !== false,
                    canHaveParent: node.canHaveParent !== false,
                    hasError: node.hasError || false
                }));
            } else if (parsedData.tree) {
                const treeNode = parsedData.tree;
                const nodes = [treeNode];
                
                const extractNodes = (node: any): any[] => {
                    const allNodes = [node];
                    if (node.children && Array.isArray(node.children)) {
                        node.children.forEach((child: any) => {
                            if (typeof child === 'object') {
                                allNodes.push(...extractNodes(child));
                            }
                        });
                    }
                    return allNodes;
                };
                
                const allNodes = extractNodes(treeNode);
                treeNodes.value = allNodes.map((node: any, index: number) => ({
                    ...node,
                    x: node.x || (300 + index * 150),
                    y: node.y || (100 + Math.floor(index / 3) * 200),
                    children: Array.isArray(node.children) 
                        ? node.children.filter((child: any) => typeof child === 'string')
                        : [],
                    properties: node.properties || {},
                    canHaveChildren: true,
                    canHaveParent: node.id !== 'root',
                    hasError: false
                }));
            } else {
                treeNodes.value = [];
            }
            
            if (parsedData.connections && Array.isArray(parsedData.connections)) {
                connections.value = parsedData.connections.map((conn: any) => ({
                    id: conn.id || Math.random().toString(36).substr(2, 9),
                    sourceId: conn.sourceId,
                    targetId: conn.targetId,
                    path: conn.path || '',
                    active: conn.active || false
                }));
            } else {
                connections.value = [];
            }
            
            if (fileData._fileInfo) {
                const fileName = fileData._fileInfo.fileName || 'untitled';
                const fullPath = fileData._fileInfo.filePath || filePath;
                setCurrentFile(fileName, fullPath);
            } else if (parsedData.metadata?.name) {
                setCurrentFile(parsedData.metadata.name, filePath);
            } else {
                setCurrentFile('untitled', filePath);
            }
            
            // 加载黑板数据
            if (blackboardOperations && parsedData.blackboard && Array.isArray(parsedData.blackboard)) {
                blackboardOperations.loadBlackboardVariables(parsedData.blackboard);
            }
            
            selectedNodeId.value = null;
            tempConnection.value.path = '';
            
            if (updateConnections) {
                setTimeout(() => {
                    updateConnections();
                }, 100);
            }
            
        } catch (error) {
            console.error('文件加载失败:', error);
            showMessage('文件加载失败: ' + error, 'error');
            treeNodes.value = [];
            connections.value = [];
            selectedNodeId.value = null;
            setCurrentFile('untitled', '');
        }
    };

    const loadBehaviorTree = async () => {
        const canProceed = await checkUnsavedChanges();
        if (!canProceed) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.bt';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const configText = event.target?.result as string;
                        const config = JSON.parse(configText);
                        
                        if (codeGeneration) {
                            const newNodes = codeGeneration.createTreeFromConfig(config);
                            treeNodes.value = newNodes;
                            selectedNodeId.value = null;
                            
                            if (config.connections && Array.isArray(config.connections)) {
                                connections.value = config.connections.map((conn: any) => ({
                                    id: conn.id,
                                    sourceId: conn.sourceId,
                                    targetId: conn.targetId,
                                    path: conn.path || '',
                                    active: conn.active || false
                                }));
                            } else {
                                connections.value = [];
                            }
                            
                            tempConnection.value.path = '';
                            
                            // 加载黑板数据
                            if (blackboardOperations && config.blackboard && Array.isArray(config.blackboard)) {
                                blackboardOperations.loadBlackboardVariables(config.blackboard);
                            }
                            
                            const fileName = file.name.replace(/\.(json|bt)$/, '');
                            setCurrentFile(fileName, '');
                            
                            setTimeout(() => {
                                if (updateConnections) {
                                    updateConnections();
                                }
                            }, 100);
                        } else {
                            showMessage('代码生成器未初始化', 'error');
                        }
                    } catch (error) {
                        showMessage('配置文件格式错误', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const exportConfig = () => {
        showExportModal.value = true;
    };

    return {
        newBehaviorTree,
        saveBehaviorTree,
        saveAsBehaviorTree,
        loadBehaviorTree,
        loadFileContent,
        exportConfig,
        hasUnsavedChanges,
        markAsSaved,
        setCurrentFile,
        clearCurrentFile,
        currentFileName,
        currentFilePath
    };
} 