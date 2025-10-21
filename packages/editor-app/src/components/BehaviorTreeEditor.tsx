import React, { useState, useRef, useEffect } from 'react';
import { NodeTemplate, PropertyDefinition } from '@esengine/behavior-tree';
import {
    TreePine, Play, Pause, Square, SkipForward, RotateCcw, Trash2,
    List, GitBranch, Layers, Shuffle,
    Repeat, CheckCircle, XCircle, CheckCheck, HelpCircle, Snowflake, Timer,
    Clock, FileText, Edit, Calculator, Code,
    Equal, Dices, Settings,
    Database,
    LucideIcon
} from 'lucide-react';
import { useBehaviorTreeStore, BehaviorTreeNode, Connection } from '../stores/behaviorTreeStore';

type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';
type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';

interface BehaviorTreeEditorProps {
    onNodeSelect?: (node: BehaviorTreeNode) => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    blackboardVariables?: Record<string, any>;
}

/**
 * 图标映射表
 *
 * 将图标名称映射到对应的lucide-react组件
 */
const iconMap: Record<string, LucideIcon> = {
    List,
    GitBranch,
    Layers,
    Shuffle,
    RotateCcw,
    Repeat,
    CheckCircle,
    XCircle,
    CheckCheck,
    HelpCircle,
    Snowflake,
    Timer,
    Clock,
    FileText,
    Edit,
    Calculator,
    Code,
    Equal,
    Dices,
    Settings,
    Database
};

/**
 * 行为树编辑器主组件
 *
 * 提供可视化的行为树编辑画布
 */
const ROOT_NODE_ID = 'root-node';

export const BehaviorTreeEditor: React.FC<BehaviorTreeEditorProps> = ({
    onNodeSelect,
    onNodeCreate,
    blackboardVariables = {}
}) => {
    // 创建固定的 Root 节点
    const rootNodeTemplate: NodeTemplate = {
        type: 'composite' as any,
        displayName: '根节点',
        category: '根节点',
        icon: '🌳',
        description: '行为树根节点',
        color: '#FFD700',
        defaultConfig: {
            nodeType: 'root'
        },
        properties: []
    };

    // 使用 zustand store
    const {
        nodes,
        connections,
        selectedNodeIds,
        draggingNodeId,
        dragStartPositions,
        isDraggingNode,
        canvasOffset,
        canvasScale,
        isPanning,
        panStart,
        connectingFrom,
        connectingFromProperty,
        connectingToPos,
        isBoxSelecting,
        boxSelectStart,
        boxSelectEnd,
        dragDelta,
        forceUpdateCounter,
        setNodes,
        setConnections,
        setSelectedNodeIds,
        updateNodesPosition,
        removeNodes,
        removeConnections,
        startDragging,
        stopDragging,
        setIsDraggingNode,
        setCanvasOffset,
        setCanvasScale,
        setIsPanning,
        setPanStart,
        resetView,
        setConnectingFrom,
        setConnectingFromProperty,
        setConnectingToPos,
        clearConnecting,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        clearBoxSelect,
        setDragDelta,
        triggerForceUpdate
    } = useBehaviorTreeStore();

    // 初始化根节点
    useEffect(() => {
        if (nodes.length === 0) {
            setNodes([{
                id: ROOT_NODE_ID,
                template: rootNodeTemplate,
                data: { nodeType: 'root' },
                position: { x: 400, y: 100 },
                children: []
            }]);
        }
    }, []);

    // 组件挂载和连线变化时强制更新，确保连线能正确渲染
    useEffect(() => {
        if (nodes.length > 0 || connections.length > 0) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    triggerForceUpdate();
                });
            });
        }
    }, [nodes.length, connections.length]);

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    // 运行状态
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('idle');
    const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, NodeExecutionStatus>>({});
    const [executionHistory, setExecutionHistory] = useState<string[]>([]);
    const executionTimerRef = useRef<number | null>(null);
    const executionModeRef = useRef<ExecutionMode>('idle');
    const [tickCount, setTickCount] = useState(0);

    // 键盘事件监听 - 删除选中节点
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 检查焦点是否在可编辑元素上
            const activeElement = document.activeElement;
            const isEditingText = activeElement instanceof HTMLInputElement ||
                                 activeElement instanceof HTMLTextAreaElement ||
                                 activeElement instanceof HTMLSelectElement ||
                                 (activeElement as HTMLElement)?.isContentEditable;

            // 如果正在编辑文本，不执行删除节点操作
            if (isEditingText) {
                return;
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0) {
                // 不能删除 Root 节点
                const nodesToDelete = selectedNodeIds.filter((id: string) => id !== ROOT_NODE_ID);
                if (nodesToDelete.length > 0) {
                    // 删除节点
                    removeNodes(nodesToDelete);
                    // 删除相关连接
                    removeConnections((conn: Connection) =>
                        !nodesToDelete.includes(conn.from) && !nodesToDelete.includes(conn.to)
                    );
                    // 清空选择
                    setSelectedNodeIds([]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, removeNodes, removeConnections, setSelectedNodeIds]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        try {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            // 将鼠标坐标转换为画布坐标系
            const position = {
                x: (e.clientX - rect.left - canvasOffset.x) / canvasScale,
                y: (e.clientY - rect.top - canvasOffset.y) / canvasScale
            };

            // 检查是否是黑板变量
            const blackboardVariableData = e.dataTransfer.getData('application/blackboard-variable');
            if (blackboardVariableData) {
                const variableData = JSON.parse(blackboardVariableData);

                // 创建黑板变量节点
                const variableTemplate: NodeTemplate = {
                    type: 'action' as any,
                    displayName: variableData.variableName,
                    category: 'Blackboard Variable',
                    icon: 'Database',
                    description: `Blackboard variable: ${variableData.variableName}`,
                    color: '#9c27b0',
                    defaultConfig: {
                        nodeType: 'blackboard-variable',
                        variableName: variableData.variableName
                    },
                    properties: [
                        {
                            name: 'variableName',
                            label: '变量名',
                            type: 'variable',
                            defaultValue: variableData.variableName,
                            description: '黑板变量的名称',
                            required: true
                        }
                    ]
                };

                const newNode: BehaviorTreeNode = {
                    id: `var_${variableData.variableName}_${Date.now()}`,
                    template: variableTemplate,
                    data: {
                        nodeType: 'blackboard-variable',
                        variableName: variableData.variableName
                    },
                    position,
                    children: []
                };

                setNodes([...nodes, newNode]);
                return;
            }

            // 处理普通节点
            let templateData = e.dataTransfer.getData('application/behavior-tree-node');
            if (!templateData) {
                templateData = e.dataTransfer.getData('text/plain');
            }
            if (!templateData) {
                return;
            }

            const template: NodeTemplate = JSON.parse(templateData);

            const newNode: BehaviorTreeNode = {
                id: `node_${Date.now()}`,
                template,
                data: { ...template.defaultConfig },
                position,
                children: []
            };

            setNodes([...nodes, newNode]);
            onNodeCreate?.(template, position);
        } catch (error) {
            console.error('Failed to create node:', error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragging) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleNodeClick = (e: React.MouseEvent, node: BehaviorTreeNode) => {
        // 如果刚刚在拖动，不处理点击事件
        if (isDraggingNode) {
            return;
        }

        // Ctrl/Cmd + 点击：多选/取消选择
        if (e.ctrlKey || e.metaKey) {
            if (selectedNodeIds.includes(node.id)) {
                // 取消选择
                setSelectedNodeIds(selectedNodeIds.filter((id: string) => id !== node.id));
            } else {
                // 添加到选择
                setSelectedNodeIds([...selectedNodeIds, node.id]);
            }
        } else {
            // 普通点击：单选
            setSelectedNodeIds([node.id]);
        }
        onNodeSelect?.(node);
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        // Root 节点不能拖动
        if (nodeId === ROOT_NODE_ID) return;

        // 检查是否点击的是端口
        const target = e.target as HTMLElement;
        if (target.getAttribute('data-port')) {
            return;
        }

        e.stopPropagation();

        // 阻止框选
        setIsBoxSelecting(false);
        setBoxSelectStart(null);
        setBoxSelectEnd(null);
        const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
        if (!node) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 将鼠标坐标转换为画布坐标系
        const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

        // 确定要拖动的节点列表
        let nodesToDrag: string[];
        if (selectedNodeIds.includes(nodeId)) {
            // 如果拖动的节点已经在选中列表中，拖动所有选中的节点
            nodesToDrag = selectedNodeIds;
        } else {
            // 如果拖动的节点不在选中列表中，只拖动这一个节点，并选中它
            nodesToDrag = [nodeId];
            setSelectedNodeIds([nodeId]);
        }

        // 记录所有要拖动节点的起始位置
        const startPositions = new Map<string, { x: number; y: number }>();
        nodesToDrag.forEach((id: string) => {
            const n = nodes.find((node: BehaviorTreeNode) => node.id === id);
            if (n) {
                startPositions.set(id, { ...n.position });
            }
        });

        // 使用 store 的 startDragging
        startDragging(nodeId, startPositions);
        setDragOffset({
            x: canvasX - node.position.x,
            y: canvasY - node.position.y
        });
    };

    const handleNodeMouseMove = (e: React.MouseEvent) => {
        if (!draggingNodeId) return;

        // 标记正在拖动（只在第一次调用）
        if (!isDraggingNode) {
            setIsDraggingNode(true);
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 将鼠标坐标转换为画布坐标系
        const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;

        // 计算拖动的节点的位移
        const draggedNodeStartPos = dragStartPositions.get(draggingNodeId);
        if (!draggedNodeStartPos) return;

        const deltaX = newX - draggedNodeStartPos.x;
        const deltaY = newY - draggedNodeStartPos.y;

        // 只更新偏移量，所有节点会在同一次渲染中更新
        setDragDelta({ dx: deltaX, dy: deltaY });
    };

    const handleNodeMouseUp = () => {
        if (!draggingNodeId) return;

        // 将临时位置同步到 zustand store
        if (dragDelta.dx !== 0 || dragDelta.dy !== 0) {
            const updates = new Map<string, { x: number; y: number }>();
            dragStartPositions.forEach((startPos: { x: number; y: number }, nodeId: string) => {
                updates.set(nodeId, {
                    x: startPos.x + dragDelta.dx,
                    y: startPos.y + dragDelta.dy
                });
            });
            updateNodesPosition(updates);
        }

        // 重置偏移量
        setDragDelta({ dx: 0, dy: 0 });

        // 停止拖动
        stopDragging();

        // 延迟清除拖动标志，确保 onClick 能够检测到拖动状态
        setTimeout(() => {
            setIsDraggingNode(false);
        }, 10);
    };

    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, propertyName?: string) => {
        e.stopPropagation();
        setConnectingFrom(nodeId);
        setConnectingFromProperty(propertyName || null);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        // 处理连接线拖拽
        if (connectingFrom && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            // 将鼠标坐标转换为画布坐标系
            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
            setConnectingToPos({
                x: canvasX,
                y: canvasY
            });
        }

        // 处理画布平移
        if (isPanning) {
            setCanvasOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }

        // 处理框选
        if (isBoxSelecting && boxSelectStart) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
            setBoxSelectEnd({ x: canvasX, y: canvasY });
        }
    };

    const handlePortMouseUp = (e: React.MouseEvent, nodeId: string, propertyName?: string) => {
        e.stopPropagation();
        if (connectingFrom && connectingFrom !== nodeId) {
            // 属性级别的连接
            if (connectingFromProperty || propertyName) {
                // 检查是否已经存在属性连接
                const existingConnection = connections.find(
                    (conn: Connection) => conn.from === connectingFrom &&
                           conn.to === nodeId &&
                           conn.fromProperty === connectingFromProperty &&
                           conn.toProperty === propertyName
                );
                if (!existingConnection) {
                    setConnections([...connections, {
                        from: connectingFrom,
                        to: nodeId,
                        fromProperty: connectingFromProperty || undefined,
                        toProperty: propertyName || undefined,
                        connectionType: 'property'
                    }]);
                }
            } else {
                // 节点级别的连接
                // Root 节点只能有一个子节点
                if (connectingFrom === ROOT_NODE_ID) {
                    const rootNode = nodes.find((n: BehaviorTreeNode) => n.id === ROOT_NODE_ID);
                    if (rootNode && rootNode.children.length > 0) {
                        alert('根节点只能连接一个子节点');
                        clearConnecting();
                        return;
                    }
                }

                // 检查是否已经存在连接
                const existingConnection = connections.find(
                    (conn: Connection) => conn.from === connectingFrom && conn.to === nodeId && conn.connectionType === 'node'
                );
                if (!existingConnection) {
                    setConnections([...connections, {
                        from: connectingFrom,
                        to: nodeId,
                        connectionType: 'node'
                    }]);
                    // 更新节点的 children
                    setNodes(nodes.map((node: BehaviorTreeNode) =>
                        node.id === connectingFrom
                            ? { ...node, children: [...node.children, nodeId] }
                            : node
                    ));
                }
            }
        }
        clearConnecting();
    };

    const handleCanvasMouseUp = (e: React.MouseEvent) => {
        clearConnecting();
        setIsPanning(false);

        // 完成框选
        if (isBoxSelecting && boxSelectStart && boxSelectEnd) {
            // 计算框选矩形
            const minX = Math.min(boxSelectStart.x, boxSelectEnd.x);
            const maxX = Math.max(boxSelectStart.x, boxSelectEnd.x);
            const minY = Math.min(boxSelectStart.y, boxSelectEnd.y);
            const maxY = Math.max(boxSelectStart.y, boxSelectEnd.y);

            // 检测哪些节点在框选区域内
            const selectedInBox = nodes
                .filter((node: BehaviorTreeNode) => {
                    // Root 节点不参与框选
                    if (node.id === ROOT_NODE_ID) return false;

                    // 检查节点中心点是否在框选矩形内
                    const nodeX = node.position.x;
                    const nodeY = node.position.y;
                    return nodeX >= minX && nodeX <= maxX && nodeY >= minY && nodeY <= maxY;
                })
                .map((node: BehaviorTreeNode) => node.id);

            // 根据是否按下 Ctrl/Cmd 决定是添加选择还是替换选择
            if (e.ctrlKey || e.metaKey) {
                // 添加到现有选择
                const newSet = new Set([...selectedNodeIds, ...selectedInBox]);
                setSelectedNodeIds(Array.from(newSet));
            } else {
                // 替换选择
                setSelectedNodeIds(selectedInBox);
            }
        }

        // 清理框选状态
        clearBoxSelect();
    };

    // 画布缩放
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(3, canvasScale * delta));
        setCanvasScale(newScale);

        // 强制更新连接线位置
        requestAnimationFrame(() => {
            triggerForceUpdate();
        });
    };

    // 画布平移和框选
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // 中键或 Alt+左键：平移
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
        } else if (e.button === 0 && !e.altKey) {
            // 左键：开始框选
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

            setIsBoxSelecting(true);
            setBoxSelectStart({ x: canvasX, y: canvasY });
            setBoxSelectEnd({ x: canvasX, y: canvasY });

            // 如果不是 Ctrl/Cmd，清空当前选择
            if (!e.ctrlKey && !e.metaKey) {
                setSelectedNodeIds([]);
            }
        }
    };

    // 重置视图
    const handleResetView = () => {
        resetView();
    };

    // 从DOM获取引脚的实际位置（画布坐标系）
    // portType: 'input' | 'output' - 只用于节点连接，属性连接不需要指定
    const getPortPosition = (nodeId: string, propertyName?: string, portType: 'input' | 'output' = 'output'): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        let selector: string;
        if (propertyName) {
            // 属性引脚
            selector = `[data-node-id="${nodeId}"][data-property="${propertyName}"]`;
        } else {
            // 节点的端口
            const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
            if (!node) return null;

            // 黑板变量节点的右侧输出引脚
            if (node.data.nodeType === 'blackboard-variable') {
                selector = `[data-node-id="${nodeId}"][data-port-type="variable-output"]`;
            } else {
                // 普通节点的端口
                if (portType === 'input') {
                    // 顶部输入端口
                    selector = `[data-node-id="${nodeId}"][data-port-type="node-input"]`;
                } else {
                    // 底部输出端口
                    selector = `[data-node-id="${nodeId}"][data-port-type="node-output"]`;
                }
            }
        }

        const portElement = canvas.querySelector(selector) as HTMLElement;
        if (!portElement) return null;

        const rect = portElement.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        // 计算画布坐标系中的位置（考虑缩放和平移）
        const x = (rect.left + rect.width / 2 - canvasRect.left - canvasOffset.x) / canvasScale;
        const y = (rect.top + rect.height / 2 - canvasRect.top - canvasOffset.y) / canvasScale;

        return { x, y };
    };

    // 估算节点的总高度
    const estimateNodeHeight = (node: BehaviorTreeNode): number => {
        const isBlackboard = node.data.nodeType === 'blackboard-variable';

        if (isBlackboard) {
            // 黑板变量节点结构简单
            // padding: 12px * 2
            // 标题 + 值显示区域
            return 24 + 18 + 30; // 约72px
        }

        // 普通节点
        const paddingVertical = 12 * 2; // padding top + bottom
        const titleArea = 18 + 6; // icon + marginBottom
        const categoryArea = 13;
        const bottomPortSpace = 16; // 底部端口需要的空间

        let propsArea = 0;
        if (node.template.properties.length > 0) {
            const propContainerHeader = 8 + 8 + 1; // marginTop + paddingTop + borderTop
            const eachPropHeight = 22; // height 18px + marginBottom 4px
            propsArea = propContainerHeader + (node.template.properties.length * eachPropHeight);
        }

        return paddingVertical + titleArea + categoryArea + propsArea + bottomPortSpace;
    };

    // 计算属性引脚的Y坐标偏移（从节点中心算起）
    const getPropertyPinYOffset = (node: BehaviorTreeNode, propertyIndex: number): number => {
        // 从节点顶部开始的距离：
        const paddingTop = 12;
        const titleArea = 18 + 6; // icon高度 + marginBottom
        const categoryArea = 13;
        const propContainerMarginTop = 8;
        const propContainerPaddingTop = 8;
        const propContainerBorderTop = 1;
        const eachPropHeight = 22; // height 18px + marginBottom 4px
        const pinOffsetInRow = 9; // top 3px + 半个引脚 6px

        const offsetFromTop = paddingTop + titleArea + categoryArea +
                             propContainerMarginTop + propContainerPaddingTop + propContainerBorderTop +
                             (propertyIndex * eachPropHeight) + pinOffsetInRow;

        // 节点高度的一半
        const nodeHalfHeight = estimateNodeHeight(node) / 2;

        // 从节点中心到引脚的偏移 = 从顶部的距离 - 节点高度的一半
        return offsetFromTop - nodeHalfHeight;
    };

    // 运行控制函数
    const simulateNodeExecution = async (nodeId: string): Promise<NodeExecutionStatus> => {
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
        setExecutionHistory(prev => [...prev, `执行中: ${nodes.find((n: BehaviorTreeNode) => n.id === nodeId)?.template.displayName}`]);

        await new Promise(resolve => setTimeout(resolve, 800));

        const node = nodes.find((n: BehaviorTreeNode) => n.id === nodeId);
        if (!node) return 'failure';

        let status: NodeExecutionStatus = 'success';

        // Root 节点直接执行子节点
        if (nodeId === ROOT_NODE_ID) {
            if (node.children.length > 0 && node.children[0]) {
                status = await simulateNodeExecution(node.children[0]);
            }
            setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: status }));
            return status;
        }

        if (node.template.type === 'condition') {
            const checkKey = node.data.checkKey as string;
            const checkValue = node.data.checkValue;
            const actualValue = blackboardVariables[checkKey];
            status = actualValue === checkValue ? 'success' : 'failure';
        } else if (node.template.type === 'action') {
            status = Math.random() > 0.3 ? 'success' : 'failure';
        } else if (node.template.type === 'composite') {
            if (node.data.compositeType === 'sequence') {
                for (const childId of node.children) {
                    const childStatus = await simulateNodeExecution(childId);
                    if (childStatus === 'failure') {
                        status = 'failure';
                        break;
                    }
                }
            } else if (node.data.compositeType === 'selector') {
                status = 'failure';
                for (const childId of node.children) {
                    const childStatus = await simulateNodeExecution(childId);
                    if (childStatus === 'success') {
                        status = 'success';
                        break;
                    }
                }
            } else {
                for (const childId of node.children) {
                    await simulateNodeExecution(childId);
                }
            }
        } else if (node.template.type === 'decorator') {
            if (node.children.length > 0 && node.children[0]) {
                status = await simulateNodeExecution(node.children[0]);
            }
        }

        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: status }));
        const statusText = status === 'success' ? '成功' : status === 'failure' ? '失败' : status;
        setExecutionHistory(prev => [...prev, `${node.template.displayName}: ${statusText}`]);
        return status;
    };

    const handlePlay = async () => {
        if (executionModeRef.current === 'running') return;

        executionModeRef.current = 'running';
        setExecutionMode('running');
        setNodeExecutionStatus({});
        setExecutionHistory(['从根节点开始执行...']);
        setTickCount(0);

        let currentTick = 0;
        const runLoop = async () => {
            while (executionModeRef.current === 'running') {
                currentTick++;
                setTickCount(currentTick);
                setExecutionHistory(prev => [...prev, `\n--- 第 ${currentTick} 帧 ---`]);

                setNodeExecutionStatus({});

                await simulateNodeExecution(ROOT_NODE_ID);

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setExecutionHistory(prev => [...prev, `执行停止，共 ${currentTick} 帧`]);
        };

        runLoop();
    };

    const handlePause = async () => {
        if (executionModeRef.current === 'running') {
            executionModeRef.current = 'paused';
            setExecutionMode('paused');
            setExecutionHistory(prev => [...prev, '执行已暂停']);
        } else if (executionModeRef.current === 'paused') {
            executionModeRef.current = 'running';
            setExecutionMode('running');
            setExecutionHistory(prev => [...prev, '执行已恢复']);

            let currentTick = tickCount;
            const runLoop = async () => {
                while (executionModeRef.current === 'running') {
                    currentTick++;
                    setTickCount(currentTick);
                    setExecutionHistory(prev => [...prev, `\n--- 第 ${currentTick} 帧 ---`]);

                    setNodeExecutionStatus({});

                    await simulateNodeExecution(ROOT_NODE_ID);

                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                setExecutionHistory(prev => [...prev, `执行停止，共 ${currentTick} 帧`]);
            };

            runLoop();
        }
    };

    const handleStop = () => {
        executionModeRef.current = 'idle';
        setExecutionMode('idle');
        setNodeExecutionStatus({});
        setExecutionHistory([]);
        setTickCount(0);
        if (executionTimerRef.current) {
            clearInterval(executionTimerRef.current);
            executionTimerRef.current = null;
        }
    };

    const handleStep = async () => {
        setExecutionMode('step');
    };

    const handleReset = () => {
        handleStop();
        setExecutionHistory(['重置到初始状态']);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            flex: 1,
            backgroundColor: '#1e1e1e',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.02);
                    }
                }
            `}</style>
            {/* 画布 */}
            <div
                ref={canvasRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={(e) => {
                    handleNodeMouseMove(e);
                    handleCanvasMouseMove(e);
                }}
                onMouseUp={(e) => {
                    handleNodeMouseUp();
                    handleCanvasMouseUp(e);
                }}
                onMouseLeave={(e) => {
                    handleNodeMouseUp();
                    handleCanvasMouseUp(e);
                }}
                style={{
                    flex: 1,
                    width: '100%',
                    backgroundImage: `
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
                    backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
                    position: 'relative',
                    minHeight: 0,
                    overflow: 'hidden',
                    cursor: isPanning ? 'grabbing' : (draggingNodeId ? 'grabbing' : (connectingFrom ? 'crosshair' : 'default'))
                }}
            >
                {/* 内容容器 - 应用变换 */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                    transformOrigin: '0 0',
                    position: 'relative'
                }}>
                {/* SVG 连接线层 */}
                <svg style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '10000px',
                    height: '10000px',
                    pointerEvents: 'none',
                    zIndex: 0,
                    overflow: 'visible'
                }}>
                    {/* 已有的连接 */}
                    {connections.map((conn: Connection, index: number) => {
                        const fromNode = nodes.find((n: BehaviorTreeNode) => n.id === conn.from);
                        const toNode = nodes.find((n: BehaviorTreeNode) => n.id === conn.to);
                        if (!fromNode || !toNode) return null;

                        let x1, y1, x2, y2;
                        let pathD: string;
                        const color = conn.connectionType === 'property' ? '#9c27b0' : '#0e639c';

                        if (conn.connectionType === 'property') {
                            // 属性连接：从DOM获取实际引脚位置
                            const fromPos = getPortPosition(conn.from);
                            const toPos = getPortPosition(conn.to, conn.toProperty);

                            if (!fromPos || !toPos) {
                                // 如果DOM还没渲染，跳过这条连接线
                                return null;
                            }

                            x1 = fromPos.x;
                            y1 = fromPos.y;
                            x2 = toPos.x;
                            y2 = toPos.y;

                            // 使用水平贝塞尔曲线
                            const controlX1 = x1 + (x2 - x1) * 0.5;
                            const controlX2 = x1 + (x2 - x1) * 0.5;
                            pathD = `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
                        } else {
                            // 节点连接：也使用DOM获取端口位置
                            const fromPos = getPortPosition(conn.from, undefined, 'output');
                            const toPos = getPortPosition(conn.to, undefined, 'input');

                            if (!fromPos || !toPos) {
                                // 如果DOM还没渲染，跳过这条连接线
                                return null;
                            }

                            x1 = fromPos.x;
                            y1 = fromPos.y;
                            x2 = toPos.x;
                            y2 = toPos.y;

                            // 使用垂直贝塞尔曲线
                            const controlY = y1 + (y2 - y1) * 0.5;
                            pathD = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
                        }

                        return (
                            <path
                                key={index}
                                d={pathD}
                                stroke={color}
                                strokeWidth="2"
                                fill="none"
                            />
                        );
                    })}
                    {/* 正在拖拽的连接线 */}
                    {connectingFrom && connectingToPos && (() => {
                        const fromNode = nodes.find((n: BehaviorTreeNode) => n.id === connectingFrom);
                        if (!fromNode) return null;

                        let x1, y1;
                        let pathD: string;
                        const x2 = connectingToPos.x;
                        const y2 = connectingToPos.y;

                        // 判断是否是属性连接
                        const isPropertyConnection = !!connectingFromProperty;
                        const fromIsBlackboard = fromNode.data.nodeType === 'blackboard-variable';
                        const color = isPropertyConnection ? '#9c27b0' : '#0e639c';

                        if (isPropertyConnection && fromIsBlackboard) {
                            // 黑板变量节点的右侧输出引脚
                            x1 = fromNode.position.x + 75;
                            y1 = fromNode.position.y;

                            // 使用水平贝塞尔曲线
                            const controlX1 = x1 + (x2 - x1) * 0.5;
                            const controlX2 = x1 + (x2 - x1) * 0.5;
                            pathD = `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
                        } else {
                            // 节点连接：从底部输出端口
                            x1 = fromNode.position.x;
                            y1 = fromNode.position.y + 30;

                            const controlY = y1 + (y2 - y1) * 0.5;
                            pathD = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
                        }

                        return (
                            <path
                                d={pathD}
                                stroke={color}
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="5,5"
                            />
                        );
                    })()}
                </svg>


                {/* 框选矩形 */}
                {isBoxSelecting && boxSelectStart && boxSelectEnd && (() => {
                    const minX = Math.min(boxSelectStart.x, boxSelectEnd.x);
                    const maxX = Math.max(boxSelectStart.x, boxSelectEnd.x);
                    const minY = Math.min(boxSelectStart.y, boxSelectEnd.y);
                    const maxY = Math.max(boxSelectStart.y, boxSelectEnd.y);
                    const width = maxX - minX;
                    const height = maxY - minY;

                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${minX}px`,
                            top: `${minY}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            backgroundColor: 'rgba(14, 99, 156, 0.15)',
                            border: '2px solid rgba(14, 99, 156, 0.6)',
                            borderRadius: '4px',
                            pointerEvents: 'none',
                            zIndex: 999
                        }} />
                    );
                })()}

                {/* 节点列表 */}
                {nodes.map((node: BehaviorTreeNode) => {
                    const executionStatus = nodeExecutionStatus[node.id] || 'idle';
                    const isRoot = node.id === ROOT_NODE_ID;
                    const isBlackboardVariable = node.data.nodeType === 'blackboard-variable';
                    const isSelected = selectedNodeIds.includes(node.id);
                    const getStatusColor = () => {
                        if (isSelected) return '#0e639c';
                        switch (executionStatus) {
                            case 'running': return '#ffa726';
                            case 'success': return '#4caf50';
                            case 'failure': return '#f44336';
                            default: return isRoot ? '#FFD700' : (isBlackboardVariable ? '#9c27b0' : '#444');
                        }
                    };
                    const statusColor = getStatusColor();

                    // 如果节点正在拖动，使用临时位置
                    const isBeingDragged = dragStartPositions.has(node.id);
                    const posX = node.position.x + (isBeingDragged ? dragDelta.dx : 0);
                    const posY = node.position.y + (isBeingDragged ? dragDelta.dy : 0);

                    return (
                    <div
                        key={node.id}
                        onClick={(e) => handleNodeClick(e, node)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{
                            position: 'absolute',
                            left: posX,
                            top: posY,
                            transform: 'translate(-50%, -50%)',
                            minWidth: '150px',
                            padding: '12px',
                            backgroundColor: isRoot ? '#3d3d1e' : '#2d2d2d',
                            borderTop: `2px solid ${statusColor}`,
                            borderRight: `2px solid ${statusColor}`,
                            borderBottom: `2px solid ${statusColor}`,
                            borderLeft: `4px solid ${isRoot ? '#FFD700' : (node.template.color || '#666')}`,
                            borderRadius: '6px',
                            cursor: isRoot ? 'default' : (draggingNodeId === node.id ? 'grabbing' : 'grab'),
                            boxShadow: executionStatus === 'running'
                                ? `0 0 20px ${statusColor}`
                                : (isSelected ? '0 0 15px rgba(14, 99, 156, 0.5)' : (isRoot ? '0 4px 12px rgba(255, 215, 0, 0.3)' : '0 2px 8px rgba(0,0,0,0.3)')),
                            transition: draggingNodeId === node.id ? 'none' : 'all 0.2s',
                            zIndex: isRoot ? 50 : (draggingNodeId === node.id ? 100 : (isSelected ? 10 : 1)),
                            userSelect: 'none',
                            opacity: executionStatus === 'running' ? 0.9 : 1,
                            animation: executionStatus === 'running' ? 'pulse 1s infinite' : 'none'
                        }}
                    >
                        {isBlackboardVariable ? (
                            // 黑板变量节点的渲染
                            <>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '6px'
                                }}>
                                    <Database size={18} color="#9c27b0" style={{ marginRight: '8px' }} />
                                    <strong style={{
                                        fontSize: '14px',
                                        color: '#9c27b0'
                                    }}>
                                        {node.data.variableName || 'Variable'}
                                    </strong>
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#999',
                                    marginTop: '4px',
                                    padding: '4px 8px',
                                    backgroundColor: '#333',
                                    borderRadius: '3px'
                                }}>
                                    {JSON.stringify(blackboardVariables[node.data.variableName])}
                                </div>
                                {/* 输出引脚 - 右侧 */}
                                <div
                                    data-port="true"
                                    data-node-id={node.id}
                                    data-port-type="variable-output"
                                    onMouseDown={(e) => handlePortMouseDown(e, node.id, '__value__')}
                                    style={{
                                        position: 'absolute',
                                        right: '-8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#9c27b0',
                                        border: '2px solid #1e1e1e',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                    title="Output"
                                />
                            </>
                        ) : (
                            // 普通节点的渲染
                            <>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '6px'
                                }}>
                                    {isRoot ? (
                                        <TreePine size={18} color="#FFD700" style={{ marginRight: '8px' }} />
                                    ) : (
                                        node.template.icon && (() => {
                                            const IconComponent = iconMap[node.template.icon];
                                            return IconComponent ? (
                                                <IconComponent
                                                    size={18}
                                                    color={node.template.color || '#cccccc'}
                                                    style={{ marginRight: '8px' }}
                                                />
                                            ) : (
                                                <span style={{ marginRight: '8px', fontSize: '18px' }}>
                                                    {node.template.icon}
                                                </span>
                                            );
                                        })()
                                    )}
                                    <strong style={{
                                        fontSize: '14px',
                                        color: isRoot ? '#FFD700' : '#cccccc'
                                    }}>
                                        {isRoot ? 'ROOT' : node.template.displayName}
                                    </strong>
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#666'
                                }}>
                                    {node.template.category}
                                </div>

                                {/* 属性引脚列表 */}
                                {node.template.properties.length > 0 && (
                                    <div style={{
                                        marginTop: '8px',
                                        paddingTop: '8px',
                                        borderTop: '1px solid #444',
                                        fontSize: '11px'
                                    }}>
                                        {node.template.properties.map((prop: PropertyDefinition, idx: number) => {
                                            // 检查该属性是否已有连接
                                            const hasConnection = connections.some(
                                                (conn: Connection) => conn.toProperty === prop.name && conn.to === node.id
                                            );

                                            return (
                                                <div key={idx} style={{
                                                    position: 'relative',
                                                    marginBottom: '4px',
                                                    paddingLeft: '8px',
                                                    height: '18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: '#999'
                                                }}>
                                                    {/* 属性输入引脚 */}
                                                    <div
                                                        data-port="true"
                                                        data-node-id={node.id}
                                                        data-property={prop.name}
                                                        data-port-type="property-input"
                                                        onMouseUp={(e) => handlePortMouseUp(e, node.id, prop.name)}
                                                        style={{
                                                            position: 'absolute',
                                                            left: '-8px',
                                                            top: '3px',
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '50%',
                                                            backgroundColor: hasConnection ? '#4caf50' : '#666',
                                                            border: '2px solid #1e1e1e',
                                                            cursor: 'pointer',
                                                            zIndex: 10
                                                        }}
                                                        title={`Input: ${prop.label}`}
                                                    />
                                                    <span style={{ fontSize: '11px' }}>{prop.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* 输入端口（顶部）- Root 节点不显示 */}
                                {!isRoot && (
                                    <div
                                        data-port="true"
                                        data-node-id={node.id}
                                        data-port-type="node-input"
                                        onMouseUp={(e) => handlePortMouseUp(e, node.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            backgroundColor: '#0e639c',
                                            border: '2px solid #1e1e1e',
                                            cursor: 'pointer',
                                            zIndex: 10
                                        }}
                                        title="Input"
                                    />
                                )}

                                {/* 输出端口（底部） */}
                                <div
                                    data-port="true"
                                    data-node-id={node.id}
                                    data-port-type="node-output"
                                    onMouseDown={(e) => handlePortMouseDown(e, node.id)}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-8px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        backgroundColor: '#0e639c',
                                        border: '2px solid #1e1e1e',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                    title="Output"
                                />
                            </>
                        )}
                    </div>
                    );
                })}

                </div>

            {/* 拖拽提示 - 相对于画布视口 */}
            {isDragging && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '20px 40px',
                    backgroundColor: 'rgba(14, 99, 156, 0.2)',
                    border: '2px dashed #0e639c',
                    borderRadius: '8px',
                    color: '#0e639c',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    zIndex: 1000
                }}>
                    释放以创建节点
                </div>
            )}

            {/* 空状态提示 - 相对于画布视口 */}
            {nodes.length === 1 && !isDragging && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '14px',
                    pointerEvents: 'none'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>👇</div>
                    <div style={{ marginBottom: '10px' }}>从左侧拖拽节点到 Root 下方开始创建行为树</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                        先连接 Root 节点与第一个节点
                    </div>
                </div>
            )}
            </div>

            {/* 运行控制工具栏 */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'rgba(45, 45, 45, 0.95)',
                padding: '8px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 100
            }}>
                <button
                    onClick={handlePlay}
                    disabled={executionMode === 'running'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: executionMode === 'running' ? '#2d2d2d' : '#4caf50',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'running' ? '#666' : '#fff',
                        cursor: executionMode === 'running' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="运行"
                >
                    <Play size={16} />
                    Play
                </button>
                <button
                    onClick={handlePause}
                    disabled={executionMode === 'idle'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#ff9800',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'idle' ? '#666' : '#fff',
                        cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="暂停/继续"
                >
                    {executionMode === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                    {executionMode === 'paused' ? '继续' : '暂停'}
                </button>
                <button
                    onClick={handleStop}
                    disabled={executionMode === 'idle'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#f44336',
                        border: 'none',
                        borderRadius: '4px',
                        color: executionMode === 'idle' ? '#666' : '#fff',
                        cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="停止"
                >
                    <Square size={16} />
                    停止
                </button>
                <button
                    onClick={handleStep}
                    disabled={executionMode !== 'idle' && executionMode !== 'paused'}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: (executionMode !== 'idle' && executionMode !== 'paused') ? '#2d2d2d' : '#2196f3',
                        border: 'none',
                        borderRadius: '4px',
                        color: (executionMode !== 'idle' && executionMode !== 'paused') ? '#666' : '#fff',
                        cursor: (executionMode !== 'idle' && executionMode !== 'paused') ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="步进"
                >
                    <SkipForward size={16} />
                    单步
                </button>
                <button
                    onClick={handleReset}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#9e9e9e',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="重置"
                >
                    <RotateCcw size={16} />
                    重置
                </button>

                {/* 分隔符 */}
                <div style={{
                    width: '1px',
                    backgroundColor: '#666',
                    margin: '4px 0'
                }} />

                {/* 编辑按钮 */}
                <button
                    onClick={handleResetView}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#3c3c3c',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#cccccc',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="重置视图 (滚轮缩放, Alt+拖动平移)"
                >
                    <RotateCcw size={14} />
                    View
                </button>
                <button
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#3c3c3c',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#cccccc',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="清空画布"
                    onClick={() => {
                        if (confirm('确定要清空画布吗？')) {
                            setNodes([
                                {
                                    id: ROOT_NODE_ID,
                                    template: rootNodeTemplate,
                                    data: { nodeType: 'root' },
                                    position: { x: 400, y: 100 },
                                    children: []
                                }
                            ]);
                            setConnections([]);
                            setSelectedNodeIds([]);
                        }
                    }}
                >
                    <Trash2 size={14} />
                    清空
                </button>

                {/* 状态指示器 */}
                <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ccc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                            executionMode === 'running' ? '#4caf50' :
                            executionMode === 'paused' ? '#ff9800' : '#666'
                    }} />
                    {executionMode === 'idle' ? 'Idle' :
                     executionMode === 'running' ? 'Running' :
                     executionMode === 'paused' ? 'Paused' : 'Step'}
                </div>
            </div>

            {/* 状态栏 */}
            <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                padding: '8px 15px',
                backgroundColor: 'rgba(45, 45, 45, 0.95)',
                borderTop: '1px solid #333',
                fontSize: '12px',
                color: '#999',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <div>节点数: {nodes.length}</div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {executionMode === 'running' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RotateCcw size={14} />
                            Tick: {tickCount}
                        </div>
                    )}
                    <div>{selectedNodeIds.length > 0 ? `已选择 ${selectedNodeIds.length} 个节点` : '未选择节点'}</div>
                </div>
            </div>
        </div>
    );
};
