import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useAppState } from './useAppState';
import { useComputedProperties } from './useComputedProperties';
import { useNodeOperations } from './useNodeOperations';
import { useCodeGeneration } from './useCodeGeneration';
import { useInstallation } from './useInstallation';
import { useFileOperations } from './useFileOperations';
import { useConnectionManager } from './useConnectionManager';
import { useCanvasManager } from './useCanvasManager';
import { useNodeDisplay } from './useNodeDisplay';
import { useConditionAttachment } from './useConditionAttachment';
import { validateTree as validateTreeStructure } from '../utils/nodeUtils';

/**
 * 主要的行为树编辑器组合功能
 */
export function useBehaviorTreeEditor() {
    // Vue Refs for DOM elements
    const canvasAreaRef = ref<HTMLElement | null>(null);
    const svgRef = ref<SVGElement | null>(null);
    
    // 获取其他组合功能
    const appState = useAppState();
    
    // 临时根节点获取函数
    const getRootNode = () => {
        return appState.treeNodes.value.find(node => 
            !appState.treeNodes.value.some(otherNode => 
                otherNode.children?.includes(node.id)
            )
        ) || null;
    };
    
    const codeGen = useCodeGeneration(
        appState.treeNodes,
        appState.nodeTemplates,
        appState.getNodeByIdLocal,
        getRootNode
    );
    
    const computedProps = useComputedProperties(
        appState.nodeTemplates,
        appState.nodeSearchText,
        appState.treeNodes,
        appState.selectedNodeId,
        appState.selectedConditionNodeId,
        appState.checkingStatus,
        appState.isInstalling,
        appState.isInstalled,
        appState.version,
        appState.exportFormat,
        appState.panX,
        appState.panY,
        appState.zoomLevel,
        appState.getNodeByIdLocal,
        {
            generateConfigJSON: codeGen.generateConfigJSON,
            generateTypeScriptCode: codeGen.generateTypeScriptCode
        }
    );
    
    const nodeOps = useNodeOperations(
        appState.treeNodes,
        appState.selectedNodeId,
        appState.connections,
        appState.panX,
        appState.panY,
        appState.zoomLevel,
        appState.getNodeByIdLocal,
        () => connectionManager.updateConnections()
    );
    
    const installation = useInstallation(
        appState.checkingStatus,
        appState.isInstalled,
        appState.version,
        appState.isInstalling
    );
    
    const connectionState = reactive({
        isConnecting: false,
        startNodeId: null as string | null,
        startPortType: null as 'input' | 'output' | null,
        tempPath: '',
        currentMousePos: null as { x: number, y: number } | null,
        startPortPos: null as { x: number, y: number } | null,
        hoveredPort: null as { nodeId: string, portType: 'input' | 'output' } | null
    });

    const connectionManager = useConnectionManager(
        appState.treeNodes,
        appState.connections,
        connectionState,
        canvasAreaRef,
        svgRef,
        appState.panX,
        appState.panY,
        appState.zoomLevel
    );

    const fileOps = useFileOperations({
        treeNodes: appState.treeNodes,
        selectedNodeId: appState.selectedNodeId,
        connections: appState.connections,
        tempConnection: appState.tempConnection,
        showExportModal: appState.showExportModal,
        codeGeneration: codeGen,
        updateConnections: connectionManager.updateConnections
    });

    const canvasManager = useCanvasManager(
        appState.panX,
        appState.panY,
        appState.zoomLevel,
        appState.treeNodes,
        appState.selectedNodeId,
        canvasAreaRef,
        connectionManager.updateConnections
    );

    const nodeDisplay = useNodeDisplay();

    const conditionAttachment = useConditionAttachment(
        appState.treeNodes,
        appState.getNodeByIdLocal
    );

    const dragState = reactive({
        isDragging: false,
        dragNode: null as any,
        dragElement: null as HTMLElement | null,
        dragOffset: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 },
        updateCounter: 0
    });

    const startNodeDrag = (event: MouseEvent, node: any) => {
        event.stopPropagation();
        event.preventDefault();
        
        dragState.isDragging = true;
        dragState.dragNode = node;
        dragState.startPosition = { x: event.clientX, y: event.clientY };
        
        dragState.dragElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
        if (dragState.dragElement) {
            dragState.dragElement.classList.add('dragging');
        }
        
        dragState.dragOffset = {
            x: node.x,
            y: node.y
        };
        
        document.addEventListener('mousemove', onNodeDrag);
        document.addEventListener('mouseup', onNodeDragEnd);
    };

    const onNodeDrag = (event: MouseEvent) => {
        if (!dragState.isDragging || !dragState.dragNode) return;
        
        const deltaX = (event.clientX - dragState.startPosition.x) / appState.zoomLevel.value;
        const deltaY = (event.clientY - dragState.startPosition.y) / appState.zoomLevel.value;
        
        dragState.dragNode.x = dragState.dragOffset.x + deltaX;
        dragState.dragNode.y = dragState.dragOffset.y + deltaY;
        
        connectionManager.updateConnections();
    };

    const onNodeDragEnd = (event: MouseEvent) => {
        if (!dragState.isDragging) return;
        
        if (dragState.dragElement) {
            dragState.dragElement.classList.remove('dragging');
        }
        
        dragState.isDragging = false;
        dragState.dragNode = null;
        dragState.dragElement = null;
        
        document.removeEventListener('mousemove', onNodeDrag);
        document.removeEventListener('mouseup', onNodeDragEnd);
        
        connectionManager.updateConnections();
        dragState.updateCounter = 0;
    };

    const handleInstall = () => {
        installation.handleInstall();
    };

    // 自动布局功能
    const autoLayout = () => {
        if (appState.treeNodes.value.length === 0) {
            return;
        }
        
        const rootNode = appState.treeNodes.value.find(node => 
            !appState.treeNodes.value.some(otherNode => 
                otherNode.children?.includes(node.id)
            )
        );
        
        if (!rootNode) {
            return;
        }
        
        const levelNodes: { [level: number]: any[] } = {};
        const visited = new Set<string>();
        
        const queue = [{ node: rootNode, level: 0 }];
        
        while (queue.length > 0) {
            const { node, level } = queue.shift()!;
            
            if (visited.has(node.id)) continue;
            visited.add(node.id);
            
            if (!levelNodes[level]) {
                levelNodes[level] = [];
            }
            levelNodes[level].push(node);
            
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach((childId: string) => {
                    const childNode = appState.treeNodes.value.find(n => n.id === childId);
                    if (childNode && !visited.has(childId)) {
                        queue.push({ node: childNode, level: level + 1 });
                    }
                });
            }
        }
        
        const nodeWidth = 200;
        const nodeHeight = 150;
        const startX = 400;
        const startY = 100;
        
        Object.keys(levelNodes).forEach(levelStr => {
            const level = parseInt(levelStr);
            const nodes = levelNodes[level];
            const totalWidth = (nodes.length - 1) * nodeWidth;
            const offsetX = -totalWidth / 2;
            
            nodes.forEach((node, index) => {
                node.x = startX + offsetX + index * nodeWidth;
                node.y = startY + level * nodeHeight;
            });
        });
        
        setTimeout(() => {
            connectionManager.updateConnections();
        }, 100);
    };

    // 验证树结构
    const validateTree = () => {
        // 使用改进的验证函数
        const validationResult = validateTreeStructure(appState.treeNodes.value);
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!validationResult.isValid) {
            errors.push(validationResult.message);
        }
        
        // 检查孤立节点（除了根节点）
        appState.treeNodes.value.forEach(node => {
            if (node.type !== 'root') {
                const hasParent = appState.treeNodes.value.some(otherNode => 
                    otherNode.children?.includes(node.id)
                );
                const hasChildren = node.children && node.children.length > 0;
                
                if (!hasParent && !hasChildren && appState.treeNodes.value.length > 1) {
                    warnings.push(`节点 "${node.name}" 是孤立节点`);
                }
            }
        });
        
        // 检查连接完整性
        appState.connections.value.forEach(conn => {
            const sourceNode = appState.treeNodes.value.find(n => n.id === conn.sourceId);
            const targetNode = appState.treeNodes.value.find(n => n.id === conn.targetId);
            
            if (!sourceNode) {
                errors.push(`连接 ${conn.id} 的源节点不存在`);
            }
            if (!targetNode) {
                errors.push(`连接 ${conn.id} 的目标节点不存在`);
            }
        });
        
        // 检查节点类型一致性
        appState.treeNodes.value.forEach(node => {
            if (node.type === 'root' && node.parent) {
                errors.push(`根节点 "${node.name}" 不应该有父节点`);
            }
            
            // 检查装饰器节点的限制
            if (node.type.includes('decorator') || node.type.includes('Decorator')) {
                if (node.children.length > 1) {
                    warnings.push(`装饰器节点 "${node.name}" 建议只连接一个子节点，当前有 ${node.children.length} 个`);
                }
            }
        });
        
        let message = '🔍 树结构验证完成！\n\n';
        
        if (errors.length > 0) {
            message += `❌ 错误 (${errors.length}):\n${errors.map(e => `• ${e}`).join('\n')}\n\n`;
        }
        
        if (warnings.length > 0) {
            message += `⚠️ 警告 (${warnings.length}):\n${warnings.map(w => `• ${w}`).join('\n')}\n\n`;
        }
        
        if (errors.length === 0 && warnings.length === 0) {
            message += '✅ 没有发现问题！树结构完全符合行为树规范。';
        } else if (errors.length === 0) {
            message += '✅ 树结构基本有效，但有一些建议优化的地方。';
        }
        
        alert(message);
    };

    // 清除所有连接线
    const clearAllConnections = () => {
        if (appState.connections.value.length === 0) {
            alert('当前没有连接线需要清除！');
            return;
        }
        
        if (confirm(`确定要清除所有 ${appState.connections.value.length} 条连接线吗？此操作不可撤销。`)) {
            // 清除所有节点的父子关系
            appState.treeNodes.value.forEach(node => {
                node.parent = undefined;
                node.children = [];
            });
            
            // 清空连接数组
            appState.connections.value = [];
            
            alert('已清除所有连接线！');
        }
    };

    // 复制到剪贴板
    const copyToClipboard = async () => {
        try {
            const code = computedProps.exportedCode();
            await navigator.clipboard.writeText(code);
            
            // 显示成功消息
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: #4caf50;
                color: white;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                z-index: 10001;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            toast.textContent = '已复制到剪贴板！';
            
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
            }, 2000);
        } catch (error) {
            alert('复制到剪贴板失败: ' + error);
        }
    };

    // 保存到文件
    const saveToFile = () => {
        const code = computedProps.exportedCode();
        const format = appState.exportFormat.value;
        const extension = format === 'json' ? '.json' : '.ts';
        const mimeType = format === 'json' ? 'application/json' : 'text/typescript';
        
        // 创建文件并下载
        const blob = new Blob([code], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `behavior_tree_config${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        // 显示成功消息
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: #4caf50;
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        toast.textContent = `文件已保存: behavior_tree_config${extension}`;
        
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



    onMounted(() => {
        // 自动检查安装状态
        installation.checkInstallStatus();
        
        const appContainer = document.querySelector('#behavior-tree-app');
        if (appContainer) {
            (appContainer as any).loadFileContent = fileOps.loadFileContent;
            (appContainer as any).showError = (errorMessage: string) => {
                alert('文件加载失败: ' + errorMessage);
            };
        }
        
        const handleLoadBehaviorTreeFile = (event: CustomEvent) => {
            fileOps.loadFileContent(event.detail);
        };
        
        const handleFileLoadError = (event: CustomEvent) => {
            console.error('[BehaviorTreeEditor] DOM事件错误:', event.detail);
            alert('文件加载失败: ' + event.detail.error);
        };
        
        // 键盘快捷键处理
        const handleKeydown = (event: KeyboardEvent) => {
            // Delete键删除选中的节点
            if (event.key === 'Delete' && appState.selectedNodeId.value) {
                event.preventDefault();
                nodeOps.deleteNode(appState.selectedNodeId.value);
            }
            // Escape键取消连接
            if (event.key === 'Escape' && connectionState.isConnecting) {
                event.preventDefault();
                connectionManager.cancelConnection();
            }
            // Escape键取消条件拖拽
            if (event.key === 'Escape' && conditionAttachment.dragState.isDraggingCondition) {
                event.preventDefault();
                conditionAttachment.resetDragState();
            }
        };

        // 全局拖拽结束处理
        const handleGlobalDragEnd = (event: DragEvent) => {
            console.log('🔚 全局拖拽结束，是否正在拖拽条件:', conditionAttachment.dragState.isDraggingCondition);
            if (conditionAttachment.dragState.isDraggingCondition) {
                setTimeout(() => {
                    console.log('⏰ 延迟重置拖拽状态');
                    conditionAttachment.resetDragState();
                }, 100); // 延迟重置，确保drop事件先执行
            }
        };

        // 全局拖拽监听器用于调试
        const handleGlobalDragOver = (event: DragEvent) => {
            if (conditionAttachment.dragState.isDraggingCondition) {
                console.log('🌐 全局dragover，鼠标位置:', event.clientX, event.clientY, '目标:', event.target);
            }
        };

        const handleGlobalDrop = (event: DragEvent) => {
            if (conditionAttachment.dragState.isDraggingCondition) {
                console.log('🌐 全局drop事件，目标:', event.target, '位置:', event.clientX, event.clientY);
            }
        };
        
        document.addEventListener('load-behavior-tree-file', handleLoadBehaviorTreeFile as EventListener);
        document.addEventListener('file-load-error', handleFileLoadError as EventListener);
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('dragend', handleGlobalDragEnd);
        document.addEventListener('dragover', handleGlobalDragOver);
        document.addEventListener('drop', handleGlobalDrop);
        
        onUnmounted(() => {
            document.removeEventListener('load-behavior-tree-file', handleLoadBehaviorTreeFile as EventListener);
            document.removeEventListener('file-load-error', handleFileLoadError as EventListener);
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('dragend', handleGlobalDragEnd);
            document.removeEventListener('dragover', handleGlobalDragOver);
            document.removeEventListener('drop', handleGlobalDrop);
            
            // 清理暴露的方法
            if (appContainer) {
                delete (appContainer as any).loadFileContent;
                delete (appContainer as any).showError;
            }
        });
    });

    onUnmounted(() => {
        document.removeEventListener('mousemove', onNodeDrag);
        document.removeEventListener('mouseup', onNodeDragEnd);
    });

    return {
        canvasAreaRef,
        svgRef,
        ...appState,
        ...computedProps,
        ...nodeOps,
        ...fileOps,
        ...codeGen,
        ...installation,
        handleInstall,
        connectionState,
        ...connectionManager,
        ...canvasManager,
        ...nodeDisplay,
        startNodeDrag,
        dragState,
        autoLayout,
        validateTree,
        clearAllConnections,
        copyToClipboard,
        saveToFile,
        // 节点选择相关
        selectNode: (nodeId: string) => {
            // 选中普通节点时，取消条件节点的选中
            appState.selectedNodeId.value = nodeId;
            appState.selectedConditionNodeId.value = null;
            console.log('🎯 选中节点:', nodeId);
        },
        selectConditionNode: (decoratorNode: any) => {
            // 选中条件节点时，取消装饰器节点的选中
            appState.selectedNodeId.value = null;
            appState.selectedConditionNodeId.value = decoratorNode.id;
            console.log('📝 选中条件节点进行编辑:', decoratorNode.attachedCondition?.name);
        },
        // 统一的属性更新方法（支持普通节点和条件节点）
        updateNodeProperty: (path: string, value: any) => {
            // 如果选中的是条件节点，更新装饰器节点的属性
            if (appState.selectedConditionNodeId.value) {
                const decoratorNode = appState.getNodeByIdLocal(appState.selectedConditionNodeId.value);
                if (decoratorNode) {
                    // 使用通用方法更新属性
                    const keys = path.split('.');
                    let current: any = decoratorNode;
                    
                    // 导航到目标属性的父对象
                    for (let i = 0; i < keys.length - 1; i++) {
                        const key = keys[i];
                        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
                            current[key] = {};
                        }
                        current = current[key];
                    }
                    
                    // 设置最终值
                    const finalKey = keys[keys.length - 1];
                    current[finalKey] = value;
                    
                    console.log('📝 更新条件属性:', path, '=', value);
                }
            } else {
                // 普通节点属性更新
                nodeOps.updateNodeProperty(path, value);
            }
        },
        // 条件吸附功能
        conditionDragState: conditionAttachment.dragState,
        startConditionDrag: conditionAttachment.startConditionDrag,
        handleDecoratorDragOver: conditionAttachment.handleDecoratorDragOver,
        handleDecoratorDragLeave: conditionAttachment.handleDecoratorDragLeave,
        attachConditionToDecorator: conditionAttachment.attachConditionToDecorator,
        getConditionDisplayText: conditionAttachment.getConditionDisplayText,
        removeConditionFromDecorator: conditionAttachment.removeConditionFromDecorator,
        canAcceptCondition: conditionAttachment.canAcceptCondition,
        resetDragState: conditionAttachment.resetDragState,
        // 合并的画布拖拽处理
        handleCanvasDrop: (event: DragEvent) => {
            // 先尝试条件拖拽处理
            if (conditionAttachment.handleCanvasDrop(event)) {
                return; // 如果是条件拖拽，直接返回
            }
            // 否则使用正常的节点拖拽处理
            nodeOps.onCanvasDrop(event);
        },
        // 条件节点拖拽处理
        handleConditionNodeDragStart: (event: DragEvent, template: any) => {
            console.log('🎯 条件节点拖拽事件:', template.name, template.isDraggableCondition);
            if (template.isDraggableCondition) {
                conditionAttachment.startConditionDrag(event, template);
            } else {
                nodeOps.onNodeDragStart(event, template);
            }
        },
        // 节点拖拽事件处理
        handleNodeDrop: (event: DragEvent, node: any) => {
            console.log('📦 节点拖拽放置:', node.name, node.type, 'isDraggingCondition:', conditionAttachment.dragState.isDraggingCondition);
            if (node.type === 'conditional-decorator') {
                event.preventDefault();
                event.stopPropagation();
                return conditionAttachment.attachConditionToDecorator(event, node);
            }
        },
        handleNodeDragOver: (event: DragEvent, node: any) => {
            console.log('🔄 节点拖拽悬停:', node.name, node.type, 'isDraggingCondition:', conditionAttachment.dragState.isDraggingCondition);
            if (node.type === 'conditional-decorator') {
                event.preventDefault();
                event.stopPropagation();
                return conditionAttachment.handleDecoratorDragOver(event, node);
            }
        },
        handleNodeDragLeave: (event: DragEvent, node: any) => {
            console.log('🔙 节点拖拽离开:', node.name, node.type);
            if (node.type === 'conditional-decorator') {
                conditionAttachment.handleDecoratorDragLeave(node);
            }
        }
    };
} 