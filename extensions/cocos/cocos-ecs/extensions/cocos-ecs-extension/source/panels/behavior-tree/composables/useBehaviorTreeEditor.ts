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
        const errors: string[] = [];
        const warnings: string[] = [];
        
        const rootNodes = appState.treeNodes.value.filter(node => 
            !appState.treeNodes.value.some(otherNode => 
                otherNode.children?.includes(node.id)
            )
        );
        
        if (rootNodes.length === 0) {
            errors.push('没有找到根节点');
        } else if (rootNodes.length > 1) {
            warnings.push(`找到多个根节点: ${rootNodes.map(n => n.name).join(', ')}`);
        }
        
        appState.treeNodes.value.forEach(node => {
            const hasParent = appState.treeNodes.value.some(otherNode => 
                otherNode.children?.includes(node.id)
            );
            const hasChildren = node.children && node.children.length > 0;
            
            if (!hasParent && !hasChildren && appState.treeNodes.value.length > 1) {
                warnings.push(`节点 "${node.name}" 是孤立节点`);
            }
        });
        
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
        
        let message = '树结构验证完成！\n\n';
        
        if (errors.length > 0) {
            message += `❌ 错误 (${errors.length}):\n${errors.map(e => `• ${e}`).join('\n')}\n\n`;
        }
        
        if (warnings.length > 0) {
            message += `⚠️ 警告 (${warnings.length}):\n${warnings.map(w => `• ${w}`).join('\n')}\n\n`;
        }
        
        if (errors.length === 0 && warnings.length === 0) {
            message += '✅ 没有发现问题！';
        }
        
        alert(message);
    };

    onMounted(() => {
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
        
        document.addEventListener('load-behavior-tree-file', handleLoadBehaviorTreeFile as EventListener);
        document.addEventListener('file-load-error', handleFileLoadError as EventListener);
        
        console.log('[BehaviorTreeEditor] 事件系统准备完成（直接方法调用 + DOM事件备用）');
        
        onUnmounted(() => {
            console.log('[BehaviorTreeEditor] 清理事件监听器');
            document.removeEventListener('load-behavior-tree-file', handleLoadBehaviorTreeFile as EventListener);
            document.removeEventListener('file-load-error', handleFileLoadError as EventListener);
            
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
        validateTree
    };
} 