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
import { useBlackboard } from './useBlackboard';
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
        getRootNode,
        computed(() => blackboard.blackboardVariables.value.reduce((map, variable) => {
            map.set(variable.name, variable);
            return map;
        }, new Map()))
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
    
    // Blackboard功能
    const blackboard = useBlackboard();
    
    // Blackboard常驻侧边面板状态
    const blackboardSidebarState = reactive({
        collapsed: false,
        transparent: true
    });
    
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
        updateConnections: connectionManager.updateConnections,
        blackboardOperations: {
            getBlackboardVariables: () => blackboard.blackboardVariables.value,
            loadBlackboardVariables: (variables: any[]) => {
                blackboard.loadBlackboardFromArray(variables);
            },
            clearBlackboard: blackboard.clearBlackboard
        }
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

    // Blackboard拖拽相关功能
    const isBlackboardDroppable = (prop: any): boolean => {
        return prop && (prop.type === 'string' || prop.type === 'number' || prop.type === 'boolean');
    };

    const isBlackboardReference = (value: string): boolean => {
        return typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    };

    const handleBlackboardDrop = (event: DragEvent, propertyKey: string) => {
        event.preventDefault();
        event.stopPropagation();
        
        try {
            const blackboardData = event.dataTransfer?.getData('application/blackboard-variable');
            
            if (!blackboardData) {
                return;
            }
            
            const variable = JSON.parse(blackboardData);
            
            // 检查当前是否在编辑条件节点
            if (appState.selectedConditionNodeId.value) {
                // 条件节点：直接更新装饰器的属性
                const decoratorNode = appState.getNodeByIdLocal(appState.selectedConditionNodeId.value);
                if (decoratorNode) {
                    const referenceValue = `{{${variable.name}}}`;
                    
                    if (!decoratorNode.properties) {
                        decoratorNode.properties = {};
                    }
                    decoratorNode.properties[propertyKey] = referenceValue;
                    
                    // 强制触发响应式更新
                    const nodeIndex = appState.treeNodes.value.findIndex(n => n.id === decoratorNode.id);
                    if (nodeIndex > -1) {
                        const newNodes = [...appState.treeNodes.value];
                        newNodes[nodeIndex] = { ...decoratorNode };
                        appState.treeNodes.value = newNodes;
                    }
                }
            } else {
                // 普通节点：使用原来的逻辑
                const activeNode = computedProps.activeNode.value;
                
                if (!activeNode || !activeNode.properties) {
                    return;
                }
                
                const property = activeNode.properties[propertyKey];
                
                if (!property) {
                    return;
                }
                
                // 设置Blackboard引用
                const referenceValue = `{{${variable.name}}}`;
                nodeOps.updateNodeProperty(`properties.${propertyKey}.value`, referenceValue);
            }
            
        } catch (error) {
            console.error('处理Blackboard拖拽失败:', error);
        }
    };

    const handleBlackboardDragOver = (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        const hasBlackboardData = event.dataTransfer?.types.includes('application/blackboard-variable');
        
        if (hasBlackboardData) {
            event.dataTransfer!.dropEffect = 'copy';
            const element = event.currentTarget as HTMLElement;
            element.classList.add('drag-over');
        }
    };

    const handleBlackboardDragLeave = (event: DragEvent) => {
        const element = event.currentTarget as HTMLElement;
        element.classList.remove('drag-over');
    };

    const clearBlackboardReference = (propertyKey: string) => {
        // 检查当前是否在编辑条件节点
        if (appState.selectedConditionNodeId.value) {
            // 条件节点：直接清除装饰器的属性
            const decoratorNode = appState.getNodeByIdLocal(appState.selectedConditionNodeId.value);
            if (decoratorNode && decoratorNode.properties) {
                decoratorNode.properties[propertyKey] = '';
                
                // 强制触发响应式更新
                const nodeIndex = appState.treeNodes.value.findIndex(n => n.id === decoratorNode.id);
                if (nodeIndex > -1) {
                    const newNodes = [...appState.treeNodes.value];
                    newNodes[nodeIndex] = { ...decoratorNode };
                    appState.treeNodes.value = newNodes;
                }
            }
        } else {
            // 普通节点：使用原来的逻辑
            nodeOps.updateNodeProperty(`properties.${propertyKey}.value`, '');
        }
    };

    // 节点类型识别相关方法
    const getOriginalNodeName = (nodeType: string): string => {
        const template = appState.nodeTemplates.value.find(t => t.type === nodeType);
        return template?.name || nodeType;
    };

    const getNodeTemplate = (nodeType: string) => {
        return appState.nodeTemplates.value.find(t => t.type === nodeType);
    };

    const getNodeCategory = (nodeType: string): string => {
        const template = getNodeTemplate(nodeType);
        if (!template) return 'unknown';
        
        const category = template.category || 'unknown';
        const categoryMap: Record<string, string> = {
            'root': '根节点',
            'composite': '组合',
            'decorator': '装饰器',
            'action': '动作',
            'condition': '条件',
            'ecs': 'ECS'
        };
        
        return categoryMap[category] || category;
    };

    const isNodeNameCustomized = (node: any): boolean => {
        if (!node) return false;
        const originalName = getOriginalNodeName(node.type);
        return node.name !== originalName;
    };

    const resetNodeToOriginalName = () => {
        if (!appState.selectedNodeId.value) return;
        
        const selectedNode = appState.getNodeByIdLocal(appState.selectedNodeId.value);
        if (!selectedNode) return;
        
        const originalName = getOriginalNodeName(selectedNode.type);
        nodeOps.updateNodeProperty('name', originalName);
        
        console.log(`节点名称已重置为原始名称: ${originalName}`);
    };

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

    // 紧凑子树布局算法 - 体现行为树的层次结构
    const autoLayout = () => {
        if (appState.treeNodes.value.length === 0) {
            return;
        }
        
        // 找到根节点
        const rootNode = appState.treeNodes.value.find(node => 
            !appState.treeNodes.value.some(otherNode => 
                otherNode.children?.includes(node.id)
            )
        );
        
        if (!rootNode) {
            console.warn('未找到根节点，无法进行自动布局');
            return;
        }
        
        // 计算节点尺寸
        const getNodeSize = (node: any) => {
            let width = 180;
            let height = 100;
            
            // 根据节点类型调整基础尺寸
            switch (node.category || node.type) {
                case 'root':
                    width = 200; height = 70;
                    break;
                case 'composite':
                    width = 160; height = 90;
                    break;
                case 'decorator':
                    width = 140; height = 80;
                    break;
                case 'action':
                    width = 180; height = 100;
                    break;
                case 'condition':
                    width = 150; height = 85;
                    break;
            }
            
            // 根据属性数量动态调整
            if (node.properties) {
                const propertyCount = Object.keys(node.properties).length;
                height += propertyCount * 20;
            }
            
            // 根据名称长度调整宽度
            if (node.name) {
                const nameWidth = node.name.length * 8 + 40;
                width = Math.max(width, nameWidth);
            }
            
            return { width, height };
        };
        
        // 紧凑子树布局核心算法
        const layoutSubtree = (node: any, parentX = 0, parentY = 0, depth = 0): { width: number, height: number } => {
            const nodeSize = getNodeSize(node);
            
            // 如果是叶子节点，直接返回自身尺寸
            if (!node.children || node.children.length === 0) {
                node.x = parentX;
                node.y = parentY;
                return { width: nodeSize.width, height: nodeSize.height };
            }
            
            // 递归布局所有子节点，收集子树信息
            const childSubtrees: Array<{ node: any, width: number, height: number }> = [];
            let totalChildrenWidth = 0;
            let maxChildHeight = 0;
            
            const childY = parentY + nodeSize.height + 60; // 子节点距离父节点的垂直间距
            const siblingSpacing = 40; // 同级子节点间的水平间距
            
            // 先计算每个子树的尺寸
            node.children.forEach((childId: string) => {
                const childNode = appState.treeNodes.value.find(n => n.id === childId);
                if (childNode) {
                    const subtreeInfo = layoutSubtree(childNode, 0, childY, depth + 1);
                    childSubtrees.push({ node: childNode, ...subtreeInfo });
                    totalChildrenWidth += subtreeInfo.width;
                    maxChildHeight = Math.max(maxChildHeight, subtreeInfo.height);
                }
            });
            
            // 添加子节点间的间距
            if (childSubtrees.length > 1) {
                totalChildrenWidth += (childSubtrees.length - 1) * siblingSpacing;
            }
            
            // 计算父节点的最终位置（在子节点的中心上方）
            const subtreeWidth = Math.max(nodeSize.width, totalChildrenWidth);
            node.x = parentX + subtreeWidth / 2 - nodeSize.width / 2;
            node.y = parentY;
            
            // 布局子节点（以父节点为中心分布）
            let currentX = parentX + subtreeWidth / 2 - totalChildrenWidth / 2;
            
            childSubtrees.forEach(({ node: childNode, width: childWidth }) => {
                // 将子节点定位到其子树的中心
                const childCenterOffset = childWidth / 2;
                childNode.x = currentX + childCenterOffset - getNodeSize(childNode).width / 2;
                
                // 递归调整子树中所有节点的位置
                adjustSubtreePosition(childNode, currentX, childY);
                
                currentX += childWidth + siblingSpacing;
            });
            
            // 返回整个子树的尺寸
            const subtreeHeight = nodeSize.height + 60 + maxChildHeight;
            return { width: subtreeWidth, height: subtreeHeight };
        };
        
        // 递归调整子树位置
        const adjustSubtreePosition = (node: any, baseX: number, baseY: number) => {
            const nodeSize = getNodeSize(node);
            
            if (!node.children || node.children.length === 0) {
                return;
            }
            
            // 计算子节点的总宽度
            let totalChildrenWidth = 0;
            const siblingSpacing = 40;
            
            node.children.forEach((childId: string) => {
                const childNode = appState.treeNodes.value.find(n => n.id === childId);
                if (childNode) {
                    const childSubtreeWidth = calculateSubtreeWidth(childNode);
                    totalChildrenWidth += childSubtreeWidth;
                }
            });
            
            if (node.children.length > 1) {
                totalChildrenWidth += (node.children.length - 1) * siblingSpacing;
            }
            
            // 重新定位子节点
            let currentX = baseX + Math.max(nodeSize.width, totalChildrenWidth) / 2 - totalChildrenWidth / 2;
            const childY = baseY + nodeSize.height + 60;
            
            node.children.forEach((childId: string) => {
                const childNode = appState.treeNodes.value.find(n => n.id === childId);
                if (childNode) {
                    const childSubtreeWidth = calculateSubtreeWidth(childNode);
                    const childCenterOffset = childSubtreeWidth / 2;
                    childNode.x = currentX + childCenterOffset - getNodeSize(childNode).width / 2;
                    childNode.y = childY;
                    
                    adjustSubtreePosition(childNode, currentX, childY);
                    currentX += childSubtreeWidth + siblingSpacing;
                }
            });
        };
        
        // 计算子树宽度
        const calculateSubtreeWidth = (node: any): number => {
            const nodeSize = getNodeSize(node);
            
            if (!node.children || node.children.length === 0) {
                return nodeSize.width;
            }
            
            let totalChildrenWidth = 0;
            const siblingSpacing = 40;
            
            node.children.forEach((childId: string) => {
                const childNode = appState.treeNodes.value.find(n => n.id === childId);
                if (childNode) {
                    totalChildrenWidth += calculateSubtreeWidth(childNode);
                }
            });
            
            if (node.children.length > 1) {
                totalChildrenWidth += (node.children.length - 1) * siblingSpacing;
            }
            
            return Math.max(nodeSize.width, totalChildrenWidth);
        };
        
        // 开始布局 - 从根节点开始
        const startX = 400; // 画布中心X
        const startY = 50;  // 顶部留白
        
        const treeInfo = layoutSubtree(rootNode, startX, startY);
        
        // 处理孤立节点
        const connectedNodeIds = new Set<string>();
        const collectConnectedNodes = (node: any) => {
            connectedNodeIds.add(node.id);
            if (node.children) {
                node.children.forEach((childId: string) => {
                    const childNode = appState.treeNodes.value.find(n => n.id === childId);
                    if (childNode) {
                        collectConnectedNodes(childNode);
                    }
                });
            }
        };
        collectConnectedNodes(rootNode);
        
        const orphanNodes = appState.treeNodes.value.filter(node => !connectedNodeIds.has(node.id));
        if (orphanNodes.length > 0) {
            const orphanY = startY + treeInfo.height + 100;
            orphanNodes.forEach((node, index) => {
                node.x = startX + (index - orphanNodes.length / 2) * 200;
                node.y = orphanY + Math.floor(index / 5) * 120;
            });
        }
        
        // 强制更新连接线
        const forceUpdateConnections = () => {
            connectionManager.updateConnections();
            
            nextTick(() => {
                connectionManager.updateConnections();
                
                setTimeout(() => {
                    connectionManager.updateConnections();
                }, 150);
            });
        };
        
        forceUpdateConnections();
        
        console.log(`紧凑子树布局完成：${appState.treeNodes.value.length} 个节点已重新排列`);
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

    // 保存到文件 - 使用Cocos Creator扩展API提供保存路径选择
    const saveToFile = async () => {
        try {
            const code = computedProps.exportedCode();
            const format = appState.exportFormat.value;
            const extension = format === 'json' ? '.json' : '.ts';
            const fileType = format === 'json' ? 'JSON配置文件' : 'TypeScript文件';
            
            // 使用Cocos Creator的文件保存对话框
            const result = await Editor.Dialog.save({
                title: `保存${fileType}`,
                filters: [
                    { 
                        name: fileType, 
                        extensions: extension === '.json' ? ['json'] : ['ts'] 
                    },
                    { 
                        name: '所有文件', 
                        extensions: ['*'] 
                    }
                ]
            });
            
            if (result.canceled || !result.filePath) {
                return; // 用户取消了保存
            }
            
            // 写入文件
            const fs = require('fs-extra');
            await fs.writeFile(result.filePath, code, 'utf8');
            
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
                max-width: 400px;
                word-wrap: break-word;
            `;
            
            const path = require('path');
            const fileName = path.basename(result.filePath);
            toast.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">✅ 文件保存成功</div>
                <div style="font-size: 12px; opacity: 0.9;">文件名: ${fileName}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">路径: ${result.filePath}</div>
            `;
            
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
            }, 4000);
            
        } catch (error: any) {
            console.error('保存文件失败:', error);
            
            // 显示错误消息
            const errorToast = document.createElement('div');
            errorToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: #f56565;
                color: white;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                z-index: 10001;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 400px;
                word-wrap: break-word;
            `;
            errorToast.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">❌ 保存失败</div>
                <div style="font-size: 12px;">${error?.message || error}</div>
            `;
            
            document.body.appendChild(errorToast);
            
            setTimeout(() => {
                errorToast.style.opacity = '1';
                errorToast.style.transform = 'translateX(0)';
            }, 10);
            
            setTimeout(() => {
                errorToast.style.opacity = '0';
                errorToast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(errorToast)) {
                        document.body.removeChild(errorToast);
                    }
                }, 300);
            }, 5000);
        }
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
            if (conditionAttachment.dragState.isDraggingCondition) {
                setTimeout(() => {
                    conditionAttachment.resetDragState();
                }, 100);
            }
        };

        const handleGlobalDragOver = (event: DragEvent) => {
            // 静默处理拖拽悬停
        };

        const handleGlobalDrop = (event: DragEvent) => {
            // 静默处理拖拽放置
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
        ...blackboard,
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
        selectNode: (nodeId: string) => {
            appState.selectedNodeId.value = nodeId;
            appState.selectedConditionNodeId.value = null;
        },
        selectConditionNode: (decoratorNode: any) => {
            appState.selectedNodeId.value = null;
            appState.selectedConditionNodeId.value = decoratorNode.id;
        },
        updateNodeProperty: (path: string, value: any) => {
            if (appState.selectedConditionNodeId.value) {
                // 条件节点的属性更新 - 需要同步到装饰器
                const decoratorNode = appState.getNodeByIdLocal(appState.selectedConditionNodeId.value);
                if (decoratorNode) {
                    // 解析路径，例如 "properties.variableName.value" -> "variableName"
                    const pathParts = path.split('.');
                    if (pathParts[0] === 'properties' && pathParts[2] === 'value') {
                        const propertyName = pathParts[1];
                        
                        // 直接更新装饰器的属性
                        if (!decoratorNode.properties) {
                            decoratorNode.properties = {};
                        }
                        decoratorNode.properties[propertyName] = value;
                        
                        // 强制触发响应式更新
                        const nodeIndex = appState.treeNodes.value.findIndex(n => n.id === decoratorNode.id);
                        if (nodeIndex > -1) {
                            const newNodes = [...appState.treeNodes.value];
                            newNodes[nodeIndex] = { ...decoratorNode };
                            appState.treeNodes.value = newNodes;
                        }
                    }
                }
            } else {
                // 普通节点属性更新
                nodeOps.updateNodeProperty(path, value);
            }
        },
        conditionDragState: conditionAttachment.dragState,
        startConditionDrag: conditionAttachment.startConditionDrag,
        handleDecoratorDragOver: conditionAttachment.handleDecoratorDragOver,
        handleDecoratorDragLeave: conditionAttachment.handleDecoratorDragLeave,
        attachConditionToDecorator: conditionAttachment.attachConditionToDecorator,
        getConditionDisplayText: conditionAttachment.getConditionDisplayText,
        getConditionProperties: conditionAttachment.getConditionProperties,
        removeConditionFromDecorator: conditionAttachment.removeConditionFromDecorator,
        canAcceptCondition: conditionAttachment.canAcceptCondition,
        resetDragState: conditionAttachment.resetDragState,
        toggleConditionExpanded: conditionAttachment.toggleConditionExpanded,
        
        handleCanvasDrop: (event: DragEvent) => {
            if (conditionAttachment.handleCanvasDrop(event)) {
                return;
            }
            nodeOps.onCanvasDrop(event);
        },
        
        handleConditionNodeDragStart: (event: DragEvent, template: any) => {
            if (template.isDraggableCondition) {
                conditionAttachment.startConditionDrag(event, template);
            } else {
                nodeOps.onNodeDragStart(event, template);
            }
        },
        
        handleNodeDrop: (event: DragEvent, node: any) => {
            if (node.type === 'conditional-decorator') {
                event.preventDefault();
                event.stopPropagation();
                return conditionAttachment.attachConditionToDecorator(event, node);
            }
        },
        
        handleNodeDragOver: (event: DragEvent, node: any) => {
            if (node.type === 'conditional-decorator') {
                event.preventDefault();
                event.stopPropagation();
                return conditionAttachment.handleDecoratorDragOver(event, node);
            }
        },
        
        handleNodeDragLeave: (event: DragEvent, node: any) => {
            if (node.type === 'conditional-decorator') {
                conditionAttachment.handleDecoratorDragLeave(node);
            }
        },
        isBlackboardDroppable,
        isBlackboardReference,
        handleBlackboardDrop,
        handleBlackboardDragOver,
        handleBlackboardDragLeave,
        clearBlackboardReference,
        
        // 节点类型识别方法
        getOriginalNodeName,
        getNodeTemplate,
        getNodeCategory,
        isNodeNameCustomized,
        resetNodeToOriginalName,
        
        blackboardCollapsed: computed({
            get: () => blackboardSidebarState.collapsed,
            set: (value: boolean) => blackboardSidebarState.collapsed = value
        }),
        blackboardTransparent: computed({
            get: () => blackboardSidebarState.transparent,
            set: (value: boolean) => blackboardSidebarState.transparent = value
        })
    };
} 