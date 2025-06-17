import { Ref, ref, watch } from 'vue';
import { TreeNode, Connection } from '../types';

/**
 * 文件操作管理
 */
export function useFileOperations(
    treeNodes: Ref<TreeNode[]>,
    selectedNodeId: Ref<string | null>,
    connections: Ref<Connection[]>,
    tempConnection: Ref<{ path: string }>,
    showExportModal: Ref<boolean>,
    codeGeneration?: {
        createTreeFromConfig: (config: any) => TreeNode[];
    },
    updateConnections?: () => void
) {
    // 跟踪未保存状态
    const hasUnsavedChanges = ref(false);
    const lastSavedState = ref<string>('');
    const currentFileName = ref('');
    
    // 监听树结构变化来更新未保存状态
    const updateUnsavedStatus = () => {
        const currentState = JSON.stringify({
            nodes: treeNodes.value,
            connections: connections.value
        });
        hasUnsavedChanges.value = currentState !== lastSavedState.value;
    };
    
    // 监听变化
    watch([treeNodes, connections], updateUnsavedStatus, { deep: true });
    
    // 标记为已保存
    const markAsSaved = () => {
        const currentState = JSON.stringify({
            nodes: treeNodes.value,
            connections: connections.value
        });
        lastSavedState.value = currentState;
        hasUnsavedChanges.value = false;
    };
    
    // 检查是否需要保存的通用方法
    const checkUnsavedChanges = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!hasUnsavedChanges.value) {
                resolve(true);
                return;
            }
            
            const result = confirm(
                '当前行为树有未保存的更改，是否要保存？\n\n' +
                '点击"确定"保存更改\n' +
                '点击"取消"丢弃更改\n' +
                '点击"X"取消操作'
            );
            
            if (result) {
                // 用户选择保存
                saveBehaviorTree().then(() => {
                    resolve(true);
                }).catch(() => {
                    resolve(false);
                });
            } else {
                // 用户选择丢弃更改
                resolve(true);
            }
        });
    };
    
    // 导出行为树数据
    const exportBehaviorTreeData = () => {
        return {
            nodes: treeNodes.value,
            connections: connections.value,
            metadata: {
                name: currentFileName.value || 'untitled',
                created: new Date().toISOString(),
                version: '1.0'
            }
        };
    };
    
    // 工具栏操作
    const newBehaviorTree = async () => {
        const canProceed = await checkUnsavedChanges();
        if (canProceed) {
        treeNodes.value = [];
        selectedNodeId.value = null;
        connections.value = [];
        tempConnection.value.path = '';
            currentFileName.value = '';
            markAsSaved(); // 新建后标记为已保存状态
        }
    };

    // 保存行为树
    const saveBehaviorTree = async (): Promise<boolean> => {
        console.log('=== 开始保存行为树 ===');
        
        try {
            const data = exportBehaviorTreeData();
            const jsonString = JSON.stringify(data, null, 2);
            console.log('数据准备完成，JSON长度:', jsonString.length);
            
            // 使用 HTML input 替代 prompt（因为 prompt 在 Cocos Creator 扩展中不支持）
            const fileName = await getFileNameFromUser();
            if (!fileName) {
                console.log('❌ 用户取消了保存操作');
                return false;
            }
            
            console.log('✓ 用户输入文件名:', fileName);
            
            // 检测是否在Cocos Creator环境中
            if (typeof Editor !== 'undefined' && typeof (window as any).sendToMain === 'function') {
                console.log('✓ 使用Cocos Creator保存方式');
                
                try {
                    (window as any).sendToMain('create-behavior-tree-from-editor', {
                        fileName: fileName + '.json',
                        content: jsonString,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log('✓ 保存消息已发送到主进程');
                    
                    // 更新当前文件名并标记为已保存
                    currentFileName.value = fileName;
                    markAsSaved();
                    
                    // 用户反馈
                    showMessage(`保存成功！文件名: ${fileName}.json`, 'success');
                    
                    console.log('✅ 保存操作完成');
                    return true;
                } catch (sendError) {
                    console.error('❌ 发送消息时出错:', sendError);
                    showMessage('保存失败: ' + sendError, 'error');
                    return false;
                }
            } else {
                console.log('✓ 使用浏览器下载保存方式');
                
                // 在浏览器环境中使用下载方式
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // 标记为已保存
                currentFileName.value = fileName;
                markAsSaved();
                
                console.log('✅ 文件下载保存成功');
                return true;
            }
        } catch (error) {
            console.error('❌ 保存过程中发生错误:', error);
            showMessage('保存失败: ' + error, 'error');
            return false;
        }
    };

    // 使用 HTML input 获取文件名（替代 prompt）
    const getFileNameFromUser = (): Promise<string | null> => {
        return new Promise((resolve) => {
            // 创建模态对话框
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
            
            // 聚焦并选中文本
            input.focus();
            input.select();
            
            // 事件处理
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
            
            // 回车键保存
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

    // 显示消息提示
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
        
        // 动画显示
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // 3秒后自动消失
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

    // 生成当前行为树的配置
    const generateCurrentConfig = () => {
        if (treeNodes.value.length === 0) return null;
        
        const rootNode = treeNodes.value.find(node => 
            !treeNodes.value.some(otherNode => 
                otherNode.children?.includes(node.id)
            )
        );
        
        if (!rootNode) return null;
        
        return {
            version: "1.0.0",
            type: "behavior-tree",
            metadata: {
                createdAt: new Date().toISOString(),
                nodeCount: treeNodes.value.length
            },
            tree: generateNodeConfig(rootNode)
        };
    };
    
    // 简化的节点配置生成（用于文件保存）
    const generateNodeConfig = (node: TreeNode): any => {
        const config: any = {
            id: node.id,
            type: node.type,
            namespace: getNodeNamespace(node.type),
            properties: {}
        };
        
        // 处理节点属性
        if (node.properties) {
            Object.entries(node.properties).forEach(([key, prop]) => {
                if (prop.value !== undefined && prop.value !== '') {
                    config.properties[key] = {
                        type: prop.type,
                        value: prop.value
                    };
                }
            });
        }
        
        // 处理子节点
        if (node.children && node.children.length > 0) {
            config.children = node.children
                .map(childId => treeNodes.value.find(n => n.id === childId))
                .filter(Boolean)
                .map(child => generateNodeConfig(child!));
        }
        
        return config;
    };
    
    // 获取节点命名空间
    const getNodeNamespace = (nodeType: string): string => {
        // ECS节点
        if (['has-component', 'add-component', 'remove-component', 'modify-component', 
             'has-tag', 'is-active', 'wait-time', 'destroy-entity'].includes(nodeType)) {
            return 'ecs-integration/behaviors';
        }
        
        // 复合节点
        if (['sequence', 'selector', 'parallel', 'parallel-selector', 
             'random-selector', 'random-sequence'].includes(nodeType)) {
            return 'behaviourTree/composites';
        }
        
        // 装饰器
        if (['repeater', 'inverter', 'always-fail', 'always-succeed', 
             'until-fail', 'until-success'].includes(nodeType)) {
            return 'behaviourTree/decorators';
        }
        
        // 动作节点
        if (['execute-action', 'log-action', 'wait-action'].includes(nodeType)) {
            return 'behaviourTree/actions';
        }
        
        // 条件节点
        if (['execute-conditional'].includes(nodeType)) {
            return 'behaviourTree/conditionals';
        }
        
        return 'behaviourTree';
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
                            connections.value = [];
                            tempConnection.value.path = '';
                            markAsSaved(); // 加载后标记为已保存状态
                            console.log('行为树配置加载成功');
                            if (updateConnections) {
                                updateConnections();
                            }
                        } else {
                            console.error('代码生成器未初始化');
                            alert('代码生成器未初始化');
                        }
                    } catch (error) {
                        console.error('加载行为树配置失败:', error);
                        alert('配置文件格式错误');
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

    const copyToClipboard = () => {
        // TODO: 实现复制到剪贴板功能
        console.log('复制到剪贴板');
    };

    const saveToFile = () => {
        // TODO: 实现保存到文件功能
        console.log('保存到文件');
    };

    // 验证相关
    const autoLayout = () => {
        // TODO: 实现自动布局功能
        console.log('自动布局');
    };

    const validateTree = () => {
        // TODO: 实现树验证功能
        console.log('验证树结构');
    };

    return {
        newBehaviorTree,
        saveBehaviorTree,
        loadBehaviorTree,
        exportConfig,
        copyToClipboard,
        saveToFile,
        autoLayout,
        validateTree,
        hasUnsavedChanges,
        markAsSaved
    };
} 