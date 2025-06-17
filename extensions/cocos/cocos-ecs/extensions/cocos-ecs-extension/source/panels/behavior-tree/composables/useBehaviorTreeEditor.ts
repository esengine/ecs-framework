import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import { useAppState } from './useAppState';
import { useComputedProperties } from './useComputedProperties';
import { useNodeOperations } from './useNodeOperations';
import { useCodeGeneration } from './useCodeGeneration';
import { useInstallation } from './useInstallation';
import { useFileOperations } from './useFileOperations';

/**
 * 主要的行为树编辑器组合功能
 */
export function useBehaviorTreeEditor() {
    // Vue Refs for DOM elements
    const canvasAreaRef = ref<HTMLElement | null>(null);
    const svgRef = ref<SVGElement | null>(null);
    
    // 获取其他组合功能
    const appState = useAppState();
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
        appState.getNodeByIdLocal
    );
    const nodeOps = useNodeOperations(
        appState.treeNodes,
        appState.selectedNodeId,
        appState.connections,
        appState.panX,
        appState.panY,
        appState.zoomLevel,
        appState.getNodeByIdLocal
    );
    const codeGen = useCodeGeneration(
        appState.treeNodes,
        appState.nodeTemplates,
        appState.getNodeByIdLocal,
        () => computedProps.rootNode() || null
    );
    const installation = useInstallation(
        appState.checkingStatus,
        appState.isInstalled,
        appState.version,
        appState.isInstalling
    );
    const fileOps = useFileOperations(
        appState.treeNodes,
        appState.selectedNodeId,
        appState.connections,
        appState.tempConnection,
        appState.showExportModal
    );

    // 连线状态管理 - 使用reactive代替复杂的状态管理
    const connectionState = reactive({
        isConnecting: false,
        startNodeId: null as string | null,
        startPortType: null as 'input' | 'output' | null,
        tempPath: '',
        currentMousePos: { x: 0, y: 0 },
        hoveredPort: null as { nodeId: string, portType: string } | null
    });

    // 连线方法
    const startConnection = (event: MouseEvent, nodeId: string, portType: 'input' | 'output') => {
        event.stopPropagation();
        event.preventDefault();
        
        connectionState.isConnecting = true;
        connectionState.startNodeId = nodeId;
        connectionState.startPortType = portType;
        
        const startPos = getPortPosition(nodeId, portType);
        if (startPos) {
            connectionState.currentMousePos = { x: event.clientX, y: event.clientY };
            
            (event.target as HTMLElement).setPointerCapture((event as any).pointerId || 1);
            
            document.addEventListener('pointermove', onConnectionDrag);
            document.addEventListener('pointerup', onConnectionEnd);
            document.addEventListener('pointercancel', onConnectionEnd);
        } else {
            cancelConnection();
        }
    };

    const onConnectionDrag = (event: MouseEvent) => {
        if (!connectionState.isConnecting || !connectionState.startNodeId) return;
        
        connectionState.currentMousePos = { x: event.clientX, y: event.clientY };
        
        const svgPos = clientToSVGCoordinates(event.clientX, event.clientY);
        const startNode = appState.treeNodes.value.find(n => n.id === connectionState.startNodeId);
        
        if (startNode && svgPos) {
            const nodeWidth = 150;
            const nodeHeight = 100;
            
            let startX: number, startY: number;
            
            if (connectionState.startPortType === 'output') {
                startX = startNode.x + nodeWidth / 2;
                startY = startNode.y + nodeHeight;
            } else {
                startX = startNode.x + nodeWidth / 2;
                startY = startNode.y;
            }
            
            const targetX = svgPos.x;
            const targetY = svgPos.y;
            const controlOffset = Math.abs(targetY - startY) * 0.5;
            
            let path: string;
            if (connectionState.startPortType === 'output') {
                path = `M ${startX} ${startY} C ${startX} ${startY + controlOffset} ${targetX} ${targetY - controlOffset} ${targetX} ${targetY}`;
            } else {
                path = `M ${startX} ${startY} C ${startX} ${startY - controlOffset} ${targetX} ${targetY + controlOffset} ${targetX} ${targetY}`;
            }
            
            connectionState.tempPath = path;
        }
    };

    const onConnectionEnd = (event: MouseEvent) => {
        if (!connectionState.isConnecting) return;
        
        const targetPort = findTargetPort(event.clientX, event.clientY);
        
        if (targetPort) {
            const { nodeId: targetNodeId, portType: targetPortType } = targetPort;
            
            if (canConnect(connectionState.startNodeId!, connectionState.startPortType!, targetNodeId, targetPortType)) {
                let parentId: string, childId: string;
                
                if (connectionState.startPortType === 'output') {
                    parentId = connectionState.startNodeId!;
                    childId = targetNodeId;
                } else {
                    parentId = targetNodeId;
                    childId = connectionState.startNodeId!;
                }
                
                createConnection(parentId, childId);
            }
        }
        
        cancelConnection();
    };

    const cancelConnection = () => {
        connectionState.isConnecting = false;
        connectionState.startNodeId = null;
        connectionState.startPortType = null;
        connectionState.tempPath = '';
        
        // 移除全局事件监听器
        document.removeEventListener('pointermove', onConnectionDrag);
        document.removeEventListener('pointerup', onConnectionEnd);
        document.removeEventListener('pointercancel', onConnectionEnd);
    };

    // 辅助函数：获取端口在SVG中的坐标（优化计算）
    const getPortPosition = (nodeId: string, portType: 'input' | 'output') => {
        const node = appState.treeNodes.value.find(n => n.id === nodeId);
        if (!node) return null;
        
        // 使用与连线算法一致的计算方式
        const nodeWidth = 150;
        const nodeHeight = 100;
        const nodeX = node.x + nodeWidth / 2; // 节点中心X
        
        let nodeY: number;
        if (portType === 'input') {
            nodeY = node.y; // 输入端口在顶部
        } else {
            nodeY = node.y + nodeHeight; // 输出端口在底部
        }
        
        return { x: nodeX, y: nodeY };
    };

    // 辅助函数：将客户端坐标转换为SVG坐标
    const clientToSVGCoordinates = (clientX: number, clientY: number) => {
        if (!svgRef.value) return null;
        
        const svg = svgRef.value as any; // 类型断言解决SVG方法问题
        const point = svg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        
        try {
            const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
            // 应用当前的缩放和平移
            return {
                x: (svgPoint.x - appState.panX.value) / appState.zoomLevel.value,
                y: (svgPoint.y - appState.panY.value) / appState.zoomLevel.value
            };
        } catch (e) {
            return null;
        }
    };

    // 辅助函数：查找目标端口
    const findTargetPort = (clientX: number, clientY: number) => {
        if (!canvasAreaRef.value) return null;
        
        // 方法1: 使用elementFromPoint
        const elementAtPoint = document.elementFromPoint(clientX, clientY);
        if (elementAtPoint?.classList.contains('port')) {
            return getPortInfo(elementAtPoint as HTMLElement);
        }
        
        // 方法2: 遍历所有端口，检查坐标
        const allPorts = canvasAreaRef.value.querySelectorAll('.port');
        for (const port of allPorts) {
            const rect = port.getBoundingClientRect();
            const margin = 10; // 增加容错范围
            
            if (clientX >= rect.left - margin && clientX <= rect.right + margin &&
                clientY >= rect.top - margin && clientY <= rect.bottom + margin) {
                return getPortInfo(port as HTMLElement);
            }
        }
        
        return null;
    };

    // 辅助函数：从端口元素获取端口信息
    const getPortInfo = (portElement: HTMLElement) => {
        const nodeElement = portElement.closest('.tree-node');
        if (!nodeElement) return null;
        
        const nodeId = nodeElement.getAttribute('data-node-id');
        const portType = portElement.classList.contains('port-input') ? 'input' : 'output';
        
        return nodeId ? { nodeId, portType } : null;
    };

    // 端口悬停处理
    const onPortHover = (nodeId: string, portType: 'input' | 'output') => {
        if (connectionState.isConnecting && connectionState.startNodeId !== nodeId) {
            connectionState.hoveredPort = { nodeId, portType };
            
            // 检查是否可以连接
            if (canConnect(connectionState.startNodeId!, connectionState.startPortType!, nodeId, portType)) {
                // 添加视觉反馈
                const portElement = document.querySelector(`[data-node-id="${nodeId}"] .port-${portType}`);
                if (portElement) {
                    portElement.classList.add('drag-target');
                }
            }
        }
    };

    const onPortLeave = () => {
        if (connectionState.isConnecting) {
            connectionState.hoveredPort = null;
            
            // 移除所有drag-target类
            const allPorts = document.querySelectorAll('.port.drag-target');
            allPorts.forEach(port => port.classList.remove('drag-target'));
        }
    };

    // 验证连接目标是否有效 - 排除自己的节点
    const isValidConnectionTarget = (nodeId: string, portType: 'input' | 'output') => {
        if (!connectionState.isConnecting || !connectionState.startNodeId || connectionState.startNodeId === nodeId) {
            return false;
        }
        
        return canConnect(connectionState.startNodeId, connectionState.startPortType!, nodeId, portType);
    };

    const canConnect = (sourceNodeId: string, sourcePortType: string, targetNodeId: string, targetPortType: string) => {
        if (sourceNodeId === targetNodeId) {
            return false;
        }
        
        if (sourcePortType === targetPortType) {
            return false;
        }
        
        let parentNodeId: string, childNodeId: string;
        
        if (sourcePortType === 'output') {
            parentNodeId = sourceNodeId;
            childNodeId = targetNodeId;
        } else {
            parentNodeId = targetNodeId;
            childNodeId = sourceNodeId;
        }
        
        const childNode = appState.treeNodes.value.find((n: any) => n.id === childNodeId);
        if (childNode && childNode.parent && childNode.parent !== parentNodeId) {
            return false;
        }
        
        const parentNode = appState.treeNodes.value.find((n: any) => n.id === parentNodeId);
        if (!parentNode || !parentNode.canHaveChildren) {
            return false;
        }
        
        if (!childNode || !childNode.canHaveParent) {
            return false;
        }
        
        if (wouldCreateCycle(parentNodeId, childNodeId)) {
            return false;
        }
        
        if (isDescendant(childNodeId, parentNodeId)) {
            return false;
        }
        
        return true;
    };

    const wouldCreateCycle = (parentId: string, childId: string) => {
        return isDescendant(parentId, childId);
    };
    
    const isDescendant = (ancestorId: string, descendantId: string): boolean => {
        const visited = new Set<string>();
        
        function checkPath(currentId: string): boolean {
            if (currentId === ancestorId) return true;
            if (visited.has(currentId)) return false;
            
            visited.add(currentId);
            
            const currentNode = appState.treeNodes.value.find((n: any) => n.id === currentId);
            if (currentNode?.children) {
                for (const childId of currentNode.children) {
                    if (checkPath(childId)) return true;
                }
            }
            
            return false;
        }
        
        return checkPath(descendantId);
    };

    const getAncestors = (nodeId: string): string[] => {
        const ancestors: string[] = [];
        let currentNode = appState.treeNodes.value.find((n: any) => n.id === nodeId);
        
        while (currentNode && currentNode.parent) {
            ancestors.push(currentNode.parent);
            const parentId = currentNode.parent;
            currentNode = appState.treeNodes.value.find((n: any) => n.id === parentId);
            
            if (ancestors.length > 100) break;
        }
        
        return ancestors;
    };

    const getDescendants = (nodeId: string): string[] => {
        const descendants: string[] = [];
        const visited = new Set<string>();
        
        function collectDescendants(currentId: string) {
            if (visited.has(currentId)) return;
            visited.add(currentId);
            
            const currentNode = appState.treeNodes.value.find((n: any) => n.id === currentId);
            if (currentNode?.children) {
                for (const childId of currentNode.children) {
                    descendants.push(childId);
                    collectDescendants(childId);
                }
            }
        }
        
        collectDescendants(nodeId);
        return descendants;
    };

    // 创建连接（支持双向连接）
    const createConnection = (parentId: string, childId: string) => {
        const parentNode = appState.treeNodes.value.find((n: any) => n.id === parentId);
        const childNode = appState.treeNodes.value.find((n: any) => n.id === childId);
        
        if (parentNode && childNode) {
            // 移除子节点之前的父节点关系
            if (childNode.parent) {
                const oldParent = appState.treeNodes.value.find((n: any) => n.id === childNode.parent);
                if (oldParent && oldParent.children) {
                    oldParent.children = oldParent.children.filter((id: string) => id !== childId);
                }
            }
            
            // 移除可能的重复连接
            appState.treeNodes.value.forEach((node: any) => {
                if (node.children) {
                    node.children = node.children.filter((id: string) => !(node.id === parentId && id === childId));
                }
            });
            
            // 添加新的父子关系
            if (!parentNode.children) {
                parentNode.children = [];
            }
            if (!parentNode.children.includes(childId)) {
                parentNode.children.push(childId);
            }
            
            // 设置子节点的父节点引用
            childNode.parent = parentId;
            
            // 更新连接线
            updateConnections();
        }
    };

    const updateConnections = () => {
        appState.connections.value.length = 0;
        
        appState.treeNodes.value.forEach((node: any) => {
            if (node.children) {
                node.children.forEach((childId: string) => {
                    const childNode = appState.treeNodes.value.find((n: any) => n.id === childId);
                    if (childNode) {
                        const parentPos = getPortPosition(node.id, 'output');
                        const childPos = getPortPosition(childId, 'input');
                        
                        if (parentPos && childPos) {
                            // 使用与临时连线相同的贝塞尔曲线算法
                            const controlOffset = Math.abs(childPos.y - parentPos.y) * 0.5;
                            const path = `M ${parentPos.x} ${parentPos.y} C ${parentPos.x} ${parentPos.y + controlOffset} ${childPos.x} ${childPos.y - controlOffset} ${childPos.x} ${childPos.y}`;
                            
                            appState.connections.value.push({
                                id: `${node.id}-${childId}`,
                                sourceId: node.id,
                                targetId: childId,
                                path: path,
                                active: false
                            });
                        }
                    }
                });
            }
        });
    };

    // 节点拖拽功能（移除防抖，实时更新）
    const startNodeDrag = (event: MouseEvent, node: any) => {
        // 阻止默认行为
        event.preventDefault();
        event.stopPropagation();
        
        // 设置拖拽状态
        appState.dragState.value.isDraggingNode = true;
        appState.dragState.value.dragNodeId = node.id;
        appState.dragState.value.dragStartX = event.clientX;
        appState.dragState.value.dragStartY = event.clientY;
        appState.dragState.value.dragNodeStartX = node.x;
        appState.dragState.value.dragNodeStartY = node.y;
        
        // 添加dragging类提升性能
        const nodeElement = event.currentTarget as HTMLElement;
        nodeElement.classList.add('dragging');
        
        // 添加全局事件监听（移除passive优化，确保实时性）
        document.addEventListener('mousemove', onNodeDrag);
        document.addEventListener('mouseup', onNodeDragEnd);
    };

    const onNodeDrag = (event: MouseEvent) => {
        if (!appState.dragState.value.isDraggingNode || !appState.dragState.value.dragNodeId) return;
        
        const deltaX = (event.clientX - appState.dragState.value.dragStartX) / appState.zoomLevel.value;
        const deltaY = (event.clientY - appState.dragState.value.dragStartY) / appState.zoomLevel.value;
        
        const node = appState.treeNodes.value.find((n: any) => n.id === appState.dragState.value.dragNodeId);
        if (node) {
            node.x = appState.dragState.value.dragNodeStartX + deltaX;
            node.y = appState.dragState.value.dragNodeStartY + deltaY;
            
            // 立即更新连接线，无防抖
            updateConnections();
        }
    };

    const onNodeDragEnd = (event: MouseEvent) => {
        if (appState.dragState.value.isDraggingNode) {
            // 移除dragging类
            const draggingNodes = document.querySelectorAll('.tree-node.dragging');
            draggingNodes.forEach(node => node.classList.remove('dragging'));
            
            appState.dragState.value.isDraggingNode = false;
            appState.dragState.value.dragNodeId = null;
            
            // 最终更新连接线
            updateConnections();
            
            // 移除全局事件监听
            document.removeEventListener('mousemove', onNodeDrag);
            document.removeEventListener('mouseup', onNodeDragEnd);
        }
    };

    // 画布操作功能
    const onCanvasWheel = (event: WheelEvent) => {
        event.preventDefault();
        
        const zoomSpeed = 0.1;
        const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newZoom = Math.max(0.1, Math.min(3, appState.zoomLevel.value + delta));
        
        appState.zoomLevel.value = newZoom;
    };

    const onCanvasMouseDown = (event: MouseEvent) => {
        // 只在空白区域开始画布拖拽
        if (event.target === event.currentTarget) {
            appState.dragState.value.isDraggingCanvas = true;
            appState.dragState.value.dragStartX = event.clientX;
            appState.dragState.value.dragStartY = event.clientY;
            
            document.addEventListener('mousemove', onCanvasMouseMove);
            document.addEventListener('mouseup', onCanvasMouseUp);
        }
    };

    const onCanvasMouseMove = (event: MouseEvent) => {
        if (appState.dragState.value.isDraggingCanvas) {
            const deltaX = event.clientX - appState.dragState.value.dragStartX;
            const deltaY = event.clientY - appState.dragState.value.dragStartY;
            
            appState.panX.value += deltaX;
            appState.panY.value += deltaY;
            
            appState.dragState.value.dragStartX = event.clientX;
            appState.dragState.value.dragStartY = event.clientY;
        }
    };

    const onCanvasMouseUp = (event: MouseEvent) => {
        if (appState.dragState.value.isDraggingCanvas) {
            appState.dragState.value.isDraggingCanvas = false;
            
            document.removeEventListener('mousemove', onCanvasMouseMove);
            document.removeEventListener('mouseup', onCanvasMouseUp);
        }
    };

    // 缩放控制
    const zoomIn = () => {
        appState.zoomLevel.value = Math.min(3, appState.zoomLevel.value + 0.1);
    };

    const zoomOut = () => {
        appState.zoomLevel.value = Math.max(0.1, appState.zoomLevel.value - 0.1);
    };

    const resetZoom = () => {
        appState.zoomLevel.value = 1;
    };

    const centerView = () => {
        appState.panX.value = 0;
        appState.panY.value = 0;
    };

    // 安装处理
    const handleInstall = () => {
        // 这里应该调用installation中的安装方法
    };

    // 生命周期管理
    onMounted(() => {
        // 初始化连接线
        nextTick(() => {
            updateConnections();
        });
    });

    onUnmounted(() => {
        // 清理事件监听器
        cancelConnection();
        document.removeEventListener('mousemove', onNodeDrag);
        document.removeEventListener('mouseup', onNodeDragEnd);
        document.removeEventListener('mousemove', onCanvasMouseMove);
        document.removeEventListener('mouseup', onCanvasMouseUp);
    });

    // 解构出所有需要的方法，避免命名冲突
    const {
        filteredCompositeNodes,
        filteredDecoratorNodes,
        filteredActionNodes,
        filteredConditionNodes,
        filteredECSNodes,
        selectedNode,
        rootNode,
        installStatusClass,
        installStatusText,
        validationResult,
        exportedCode,
        gridStyle
    } = computedProps;

    return {
        // DOM refs
        canvasAreaRef,
        svgRef,
        
        // 状态
        ...appState,
        connectionState,
        
        // 计算属性 - 显式导出，避免命名冲突
        filteredCompositeNodes,
        filteredDecoratorNodes,
        filteredActionNodes,
        filteredConditionNodes,
        filteredECSNodes,
        selectedNode,
        rootNode,
        installStatusClass,
        installStatusText,
        validationResult,
        exportedCode,
        gridStyle,
        
        // 连线方法
        startConnection,
        cancelConnection,
        updateConnections,
        onPortHover,
        onPortLeave,
        isValidConnectionTarget,
        
        // 节点拖拽
        startNodeDrag,
        
        // 画布操作
        onCanvasWheel,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
        
        // 缩放控制
        zoomIn,
        zoomOut,
        resetZoom,
        centerView,
        
        // 其他功能方法
        ...nodeOps,
        ...codeGen,
        ...installation,
        ...fileOps,
    };
} 