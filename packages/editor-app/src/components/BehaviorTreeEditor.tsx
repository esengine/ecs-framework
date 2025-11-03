import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NodeTemplate, PropertyDefinition, NodeType } from '@esengine/behavior-tree';
import {
    TreePine, RotateCcw,
    List, GitBranch, Layers, Shuffle,
    Repeat, CheckCircle, XCircle, CheckCheck, HelpCircle, Snowflake, Timer,
    Clock, FileText, Edit, Calculator, Code,
    Equal, Dices, Settings,
    Database, AlertTriangle, AlertCircle,
    LucideIcon
} from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';
import { useBehaviorTreeStore, BehaviorTreeNode, Connection, ROOT_NODE_ID } from '../stores/behaviorTreeStore';
import { useUIStore } from '../application/state/UIStore';
import { BehaviorTreeExecutor, ExecutionStatus, ExecutionLog } from '../utils/BehaviorTreeExecutor';
import { BehaviorTreeExecutionPanel } from './BehaviorTreeExecutionPanel';
import { useToast } from './Toast';
import { Node } from '../domain/models/Node';
import { Position } from '../domain/value-objects/Position';
import { BlackboardValue } from '../domain/models/Blackboard';
import { BehaviorTreeCanvas } from '../presentation/components/behavior-tree/canvas/BehaviorTreeCanvas';
import { ConnectionLayer } from '../presentation/components/behavior-tree/connections/ConnectionLayer';
import { EditorConfig } from '../presentation/types';
import { NodeFactory } from '../infrastructure/factories/NodeFactory';
import { BehaviorTreeValidator } from '../infrastructure/validation/BehaviorTreeValidator';
import { useNodeOperations } from '../presentation/hooks/useNodeOperations';
import { useConnectionOperations } from '../presentation/hooks/useConnectionOperations';
import { useCommandHistory } from '../presentation/hooks/useCommandHistory';
import { useNodeDrag } from '../presentation/hooks/useNodeDrag';
import { useContextMenu } from '../application/hooks/useContextMenu';
import { useQuickCreateMenu } from '../application/hooks/useQuickCreateMenu';
import { EditorToolbar } from '../presentation/components/toolbar/EditorToolbar';
import { QuickCreateMenu } from '../presentation/components/menu/QuickCreateMenu';
import { NodeContextMenu } from '../presentation/components/menu/NodeContextMenu';
import { BehaviorTreeNode as BehaviorTreeNodeComponent } from '../presentation/components/behavior-tree/nodes/BehaviorTreeNode';
import '../styles/BehaviorTreeNode.css';

type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';
type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';

type BlackboardVariables = Record<string, BlackboardValue>;

interface DraggedVariableData {
    variableName: string;
}

interface BehaviorTreeEditorProps {
    onNodeSelect?: (node: BehaviorTreeNode) => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    blackboardVariables?: BlackboardVariables;
    projectPath?: string | null;
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
    Database,
    TreePine
};

/**
 * 行为树编辑器主组件
 *
 * 提供可视化的行为树编辑画布
 */
export const BehaviorTreeEditor: React.FC<BehaviorTreeEditorProps> = ({
    onNodeSelect,
    onNodeCreate,
    blackboardVariables = {},
    projectPath = null
}) => {
    const { showToast } = useToast();

    // 编辑器配置
    const editorConfig: EditorConfig = {
        enableSnapping: false,
        gridSize: 20,
        minZoom: 0.1,
        maxZoom: 3,
        showGrid: true,
        showMinimap: false
    };

    // 创建固定的 Root 节点
    const rootNodeTemplate: NodeTemplate = {
        type: NodeType.Composite,
        displayName: '根节点',
        category: '根节点',
        icon: 'TreePine',
        description: '行为树根节点',
        color: '#FFD700',
        defaultConfig: {
            nodeType: 'root'
        },
        properties: []
    };

    // 数据 store（行为树数据）
    const {
        nodes,
        connections,
        connectingFrom,
        connectingFromProperty,
        connectingToPos,
        isBoxSelecting,
        boxSelectStart,
        boxSelectEnd,
        setNodes,
        setConnections,
        setConnectingFrom,
        setConnectingFromProperty,
        setConnectingToPos,
        clearConnecting,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        clearBoxSelect,
        triggerForceUpdate,
        sortChildrenByPosition,
        setBlackboardVariables,
        setInitialBlackboardVariables,
        setIsExecuting,
        initialBlackboardVariables,
        isExecuting
    } = useBehaviorTreeStore();

    // UI store（选中、拖拽、画布状态）
    const {
        selectedNodeIds,
        draggingNodeId,
        dragStartPositions,
        isDraggingNode,
        canvasOffset,
        canvasScale,
        dragDelta,
        setSelectedNodeIds,
        startDragging,
        stopDragging,
        setIsDraggingNode,
        resetView,
        setDragDelta
    } = useUIStore();

    // 依赖注入 - 基础设施
    const nodeFactory = useMemo(() => new NodeFactory(), []);
    const validator = useMemo(() => new BehaviorTreeValidator(), []);

    // 命令历史管理（创建 CommandManager）
    const { commandManager, canUndo, canRedo, undo, redo } = useCommandHistory();

    // 应用层 hooks（使用统一的 commandManager）
    const nodeOperations = useNodeOperations(nodeFactory, validator, commandManager);
    const connectionOperations = useConnectionOperations(validator, commandManager);

    // 右键菜单
    const { contextMenu, setContextMenu, handleNodeContextMenu, closeContextMenu } = useContextMenu();

    // 初始化executor用于检查执行器是否存在
    useEffect(() => {
        if (!executorRef.current) {
            executorRef.current = new BehaviorTreeExecutor();
        }

        return () => {
            if (executorRef.current) {
                executorRef.current.destroy();
                executorRef.current = null;
            }
        };
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

    // 点击其他地方关闭右键菜单
    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) {
                closeContextMenu();
            }
        };

        if (contextMenu.visible) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.visible, closeContextMenu]);

    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    //  创建一个停止执行的 ref，稍后会被赋值
    const stopExecutionRef = useRef<(() => void) | null>(null);

    // 运行状态
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('idle');
    const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
    const [executionSpeed, setExecutionSpeed] = useState<number>(1.0);
    const [tickCount, setTickCount] = useState(0);
    const executionModeRef = useRef<ExecutionMode>('idle');
    const executorRef = useRef<BehaviorTreeExecutor | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastTickTimeRef = useRef<number>(0);
    const executionSpeedRef = useRef<number>(1.0);
    const statusTimersRef = useRef<Map<string, number>>(new Map());
    // 保存设计时的初始黑板变量值（用于保存和停止后还原）
    const initialBlackboardVariablesRef = useRef<BlackboardVariables>({});

    // 跟踪运行时添加的节点（在运行中未生效的节点）
    const [uncommittedNodeIds, setUncommittedNodeIds] = useState<Set<string>>(new Set());
    const activeNodeIdsRef = useRef<Set<string>>(new Set());

    // 选中的连线
    const [selectedConnection, setSelectedConnection] = useState<{from: string; to: string} | null>(null);

    // 快速创建菜单
    const {
        quickCreateMenu,
        setQuickCreateMenu,
        handleQuickCreateNode
    } = useQuickCreateMenu({
        nodeOperations,
        connectionOperations,
        canvasRef,
        canvasOffset,
        canvasScale,
        connectingFrom,
        connectingFromProperty,
        clearConnecting,
        nodes,
        setNodes,
        connections,
        executionMode,
        onStop: () => stopExecutionRef.current?.(),
        onNodeCreate,
        showToast
    });

    // 节点拖拽
    const {
        handleNodeMouseDown,
        handleNodeMouseMove,
        handleNodeMouseUp,
        dragOffset
    } = useNodeDrag({
        canvasRef,
        canvasOffset,
        canvasScale,
        nodes,
        selectedNodeIds,
        draggingNodeId,
        dragStartPositions,
        isDraggingNode,
        dragDelta,
        nodeOperations,
        setSelectedNodeIds,
        startDragging,
        stopDragging,
        setIsDraggingNode,
        setDragDelta,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        sortChildrenByPosition
    });

    // 缓存DOM元素引用和上一次的状态
    const domCacheRef = useRef<{
        nodes: Map<string, Element>;
        connections: Map<string, Element>;
        lastNodeStatus: Map<string, NodeExecutionStatus>;
    }>({
        nodes: new Map(),
        connections: new Map(),
        lastNodeStatus: new Map()
    });

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

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();

                // 优先删除选中的连线
                if (selectedConnection) {
                    // 删除连接
                    const conn = connections.find(
                        (c: Connection) => c.from === selectedConnection.from && c.to === selectedConnection.to
                    );
                    if (conn) {
                        connectionOperations.removeConnection(
                            conn.from,
                            conn.to,
                            conn.fromProperty,
                            conn.toProperty
                        );
                    }

                    setSelectedConnection(null);
                    return;
                }

                // 删除选中的节点
                if (selectedNodeIds.length > 0) {
                    // 不能删除 Root 节点
                    const nodesToDelete = selectedNodeIds.filter((id: string) => id !== ROOT_NODE_ID);
                    if (nodesToDelete.length > 0) {
                        // 删除节点（会自动删除相关连接）
                        nodeOperations.deleteNodes(nodesToDelete);
                        // 清空选择
                        setSelectedNodeIds([]);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, selectedConnection, nodeOperations, connectionOperations, connections, setSelectedNodeIds]);

    // 监听节点变化，跟踪运行时添加的节点
    useEffect(() => {
        if (executionMode === 'idle') {
            // 重新运行时清空未提交节点列表
            setUncommittedNodeIds(new Set());
            // 记录当前所有节点ID
            activeNodeIdsRef.current = new Set(nodes.map((n) => n.id));
        } else if (executionMode === 'running' || executionMode === 'paused') {
            // 检测新增的节点
            const currentNodeIds = new Set(nodes.map((n) => n.id));
            const newNodeIds = new Set<string>();

            currentNodeIds.forEach((id) => {
                if (!activeNodeIdsRef.current.has(id)) {
                    newNodeIds.add(id);
                }
            });

            if (newNodeIds.size > 0) {
                setUncommittedNodeIds((prev) => new Set([...prev, ...newNodeIds]));
            }
        }
    }, [nodes, executionMode]);

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
                const variableData = JSON.parse(blackboardVariableData) as DraggedVariableData;

                // 创建黑板变量节点
                const variableTemplate: NodeTemplate = {
                    type: NodeType.Action,
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

                nodeOperations.createNode(
                    variableTemplate,
                    new Position(position.x, position.y),
                    {
                        nodeType: 'blackboard-variable',
                        variableName: variableData.variableName
                    }
                );
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

            const template = JSON.parse(templateData) as NodeTemplate;

            nodeOperations.createNode(
                template,
                new Position(position.x, position.y),
                template.defaultConfig
            );

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


    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, propertyName?: string) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const portType = target.getAttribute('data-port-type');

        setConnectingFrom(nodeId);
        setConnectingFromProperty(propertyName || null);

        // 存储起点引脚类型到 DOM 属性，供 mouseUp 使用
        if (canvasRef.current) {
            canvasRef.current.setAttribute('data-connecting-from-port-type', portType || '');
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        // 处理连接线拖拽（如果快速创建菜单显示了，不更新预览连接线）
        if (connectingFrom && canvasRef.current && !quickCreateMenu.visible) {
            const rect = canvasRef.current.getBoundingClientRect();
            // 将鼠标坐标转换为画布坐标系
            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
            setConnectingToPos({
                x: canvasX,
                y: canvasY
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
        if (!connectingFrom) {
            clearConnecting();
            return;
        }

        // 禁止连接到自己
        if (connectingFrom === nodeId) {
            showToast('不能将节点连接到自己', 'warning');
            clearConnecting();
            return;
        }

        const target = e.currentTarget as HTMLElement;
        const toPortType = target.getAttribute('data-port-type');
        const fromPortType = canvasRef.current?.getAttribute('data-connecting-from-port-type');

        // 智能判断连接方向
        let actualFrom = connectingFrom;
        let actualTo = nodeId;
        let actualFromProperty = connectingFromProperty;
        let actualToProperty = propertyName;

        // 判断是否需要反转方向
        const needReverse =
            (fromPortType === 'node-input' || fromPortType === 'property-input') &&
            (toPortType === 'node-output' || toPortType === 'variable-output');

        if (needReverse) {
            // 反转连接方向
            actualFrom = nodeId;
            actualTo = connectingFrom;
            actualFromProperty = propertyName || null;
            actualToProperty = connectingFromProperty ?? undefined;
        }

        // 属性级别的连接
        if (actualFromProperty || actualToProperty) {
            // 检查是否已经存在相同的属性连接
            const existingConnection = connections.find(
                (conn: Connection) =>
                    (conn.from === actualFrom && conn.to === actualTo &&
                     conn.fromProperty === actualFromProperty && conn.toProperty === actualToProperty) ||
                    (conn.from === actualTo && conn.to === actualFrom &&
                     conn.fromProperty === actualToProperty && conn.toProperty === actualFromProperty)
            );

            if (existingConnection) {
                showToast('该连接已存在', 'warning');
                clearConnecting();
                return;
            }

            // 检查目标属性是否允许多个连接
            const toNode = nodes.find((n: BehaviorTreeNode) => n.id === actualTo);
            if (toNode && actualToProperty) {
                const targetProperty = toNode.template.properties.find(
                    (p: PropertyDefinition) => p.name === actualToProperty
                );

                // 如果属性不允许多个连接（默认行为）
                if (!targetProperty?.allowMultipleConnections) {
                    // 检查是否已有连接到该属性
                    const existingPropertyConnection = connections.find(
                        (conn: Connection) =>
                            conn.connectionType === 'property' &&
                            conn.to === actualTo &&
                            conn.toProperty === actualToProperty
                    );

                    if (existingPropertyConnection) {
                        showToast('该属性已有连接，请先删除现有连接', 'warning');
                        clearConnecting();
                        return;
                    }
                }
            }

            connectionOperations.addConnection(
                actualFrom,
                actualTo,
                'property',
                actualFromProperty || undefined,
                actualToProperty || undefined
            );
        } else {
            // 节点级别的连接
            // Root 节点只能有一个子节点
            if (actualFrom === ROOT_NODE_ID) {
                const rootNode = nodes.find((n: BehaviorTreeNode) => n.id === ROOT_NODE_ID);
                if (rootNode && rootNode.children.length > 0) {
                    showToast('根节点只能连接一个子节点', 'warning');
                    clearConnecting();
                    return;
                }
            }

            // 检查是否已经存在相同的节点连接
            const existingConnection = connections.find(
                (conn: Connection) =>
                    (conn.from === actualFrom && conn.to === actualTo && conn.connectionType === 'node') ||
                    (conn.from === actualTo && conn.to === actualFrom && conn.connectionType === 'node')
            );

            if (existingConnection) {
                showToast('该连接已存在', 'warning');
                clearConnecting();
                return;
            }

            connectionOperations.addConnection(actualFrom, actualTo, 'node');

            // 创建连接后，自动排序子节点
            setTimeout(() => {
                sortChildrenByPosition();
            }, 0);
        }

        clearConnecting();
    };

    const handleNodeMouseUpForConnection = (e: React.MouseEvent, nodeId: string) => {
        // 如果正在连接，尝试自动连接到这个节点
        if (connectingFrom && connectingFrom !== nodeId) {
            // 直接调用 handlePortMouseUp 来完成连接
            handlePortMouseUp(e, nodeId);
        }
    };

    const handleCanvasMouseUp = (e: React.MouseEvent) => {
        // 如果快速创建菜单已经显示，不要清除连接状态
        if (quickCreateMenu.visible) {
            return;
        }

        // 如果正在连接，显示快速创建菜单
        if (connectingFrom && connectingToPos) {
            setQuickCreateMenu({
                visible: true,
                position: {
                    x: e.clientX,
                    y: e.clientY
                },
                searchText: '',
                selectedIndex: 0,
                mode: 'create',
                replaceNodeId: null
            });
            // 清除预览连接线，但保留 connectingFrom 用于创建连接
            setConnectingToPos(null);
            return;
        }

        clearConnecting();

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

                    // 从 DOM 获取节点的实际尺寸
                    const nodeElement = canvasRef.current?.querySelector(`[data-node-id="${node.id}"]`);
                    if (!nodeElement) {
                        // 如果找不到元素，回退到中心点检查
                        return node.position.x >= minX && node.position.x <= maxX &&
                               node.position.y >= minY && node.position.y <= maxY;
                    }

                    const rect = nodeElement.getBoundingClientRect();
                    const canvasRect = canvasRef.current!.getBoundingClientRect();

                    // 将 DOM 坐标转换为画布坐标
                    const nodeLeft = (rect.left - canvasRect.left - canvasOffset.x) / canvasScale;
                    const nodeRight = (rect.right - canvasRect.left - canvasOffset.x) / canvasScale;
                    const nodeTop = (rect.top - canvasRect.top - canvasOffset.y) / canvasScale;
                    const nodeBottom = (rect.bottom - canvasRect.top - canvasOffset.y) / canvasScale;

                    // 检查矩形是否重叠
                    return nodeRight > minX && nodeLeft < maxX && nodeBottom > minY && nodeTop < maxY;
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

    // 画布框选
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && !e.altKey) {
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
                setSelectedConnection(null);
            }
        }
    };

    // 重置视图
    const handleResetView = () => {
        resetView();
        // 强制更新连线位置
        requestAnimationFrame(() => {
            triggerForceUpdate();
        });
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

    // 执行状态回调（直接操作DOM，不触发React重渲染）
    const handleExecutionStatusUpdate = (
        statuses: ExecutionStatus[],
        logs: ExecutionLog[],
        runtimeBlackboardVars?: BlackboardVariables
    ): void => {
        // 更新执行日志
        setExecutionLogs([...logs]);

        // 同步运行时黑板变量到 store（无论运行还是暂停都同步）
        if (runtimeBlackboardVars) {
            setBlackboardVariables(runtimeBlackboardVars);
        }

        const cache = domCacheRef.current;
        const statusMap: Record<string, NodeExecutionStatus> = {};

        // 直接操作DOM来更新节点样式，避免重渲染
        statuses.forEach((s) => {
            statusMap[s.nodeId] = s.status;

            // 检查状态是否真的变化了
            const lastStatus = cache.lastNodeStatus.get(s.nodeId);
            if (lastStatus === s.status) {
                return; // 状态未变化，跳过
            }
            cache.lastNodeStatus.set(s.nodeId, s.status);

            // 获取或缓存节点DOM
            let nodeElement = cache.nodes.get(s.nodeId);
            if (!nodeElement) {
                nodeElement = document.querySelector(`[data-node-id="${s.nodeId}"]`) || undefined;
                if (nodeElement) {
                    cache.nodes.set(s.nodeId, nodeElement);
                } else {
                    return;
                }
            }

            // 移除所有状态类
            nodeElement.classList.remove('running', 'success', 'failure', 'executed');

            // 添加当前状态类
            if (s.status === 'running') {
                nodeElement.classList.add('running');
            } else if (s.status === 'success') {
                nodeElement.classList.add('success');

                // 清除之前的定时器
                const existingTimer = statusTimersRef.current.get(s.nodeId);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                // 2秒后移除success状态，添加executed标记
                const timer = window.setTimeout(() => {
                    nodeElement!.classList.remove('success');
                    nodeElement!.classList.add('executed');
                    statusTimersRef.current.delete(s.nodeId);
                }, 2000);

                statusTimersRef.current.set(s.nodeId, timer);
            } else if (s.status === 'failure') {
                nodeElement.classList.add('failure');

                // 清除之前的定时器
                const existingTimer = statusTimersRef.current.get(s.nodeId);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                // 2秒后移除failure状态
                const timer = window.setTimeout(() => {
                    nodeElement!.classList.remove('failure');
                    statusTimersRef.current.delete(s.nodeId);
                }, 2000);

                statusTimersRef.current.set(s.nodeId, timer);
            }
        });

        // 更新连线颜色（直接操作DOM）
        updateConnectionStyles(statusMap);
    };

    // 更新连线样式（直接操作DOM，缓存查询）
    const updateConnectionStyles = (statusMap: Record<string, NodeExecutionStatus>): void => {
        const cache = domCacheRef.current;

        connections.forEach((conn) => {
            const connKey = `${conn.from}-${conn.to}`;

            // 获取或缓存连线DOM
            let pathElement = cache.connections.get(connKey);
            if (!pathElement) {
                pathElement = document.querySelector(`[data-connection-id="${connKey}"]`) || undefined;
                if (pathElement) {
                    cache.connections.set(connKey, pathElement);
                } else {
                    return;
                }
            }

            const fromStatus = statusMap[conn.from];
            const toStatus = statusMap[conn.to];
            const isActive = fromStatus === 'running' || toStatus === 'running';

            if (conn.connectionType === 'property') {
                pathElement.setAttribute('stroke', '#9c27b0');
                pathElement.setAttribute('stroke-width', '2');
            } else if (isActive) {
                pathElement.setAttribute('stroke', '#ffa726');
                pathElement.setAttribute('stroke-width', '3');
            } else {
                // 获取或缓存节点DOM
                let fromElement = cache.nodes.get(conn.from);
                if (!fromElement) {
                    fromElement = document.querySelector(`[data-node-id="${conn.from}"]`) || undefined;
                    if (fromElement) cache.nodes.set(conn.from, fromElement);
                }

                let toElement = cache.nodes.get(conn.to);
                if (!toElement) {
                    toElement = document.querySelector(`[data-node-id="${conn.to}"]`) || undefined;
                    if (toElement) cache.nodes.set(conn.to, toElement);
                }

                const isExecuted = fromElement?.classList.contains('executed') &&
                                 toElement?.classList.contains('executed');

                if (isExecuted) {
                    pathElement.setAttribute('stroke', '#4caf50');
                    pathElement.setAttribute('stroke-width', '2.5');
                } else {
                    pathElement.setAttribute('stroke', '#0e639c');
                    pathElement.setAttribute('stroke-width', '2');
                }
            }
        });
    };

    // Tick 循环（基于时间间隔）
    const tickLoop = (currentTime: number): void => {
        if (executionModeRef.current !== 'running') {
            return;
        }

        if (!executorRef.current) {
            return;
        }

        // 根据速度计算 tick 间隔（毫秒）
        // 速度 1.0 = 每秒60次tick (16.67ms)
        // 速度 0.5 = 每秒30次tick (33.33ms)
        // 速度 0.1 = 每秒6次tick (166.67ms)
        const baseTickInterval = 16.67; // 基础间隔 (60 fps)
        const tickInterval = baseTickInterval / executionSpeedRef.current;

        // 检查是否到了执行下一个tick的时间
        if (lastTickTimeRef.current === 0 || (currentTime - lastTickTimeRef.current) >= tickInterval) {
            const deltaTime = 0.016; // 固定的 deltaTime

            // 执行tick但不触发重渲染
            executorRef.current.tick(deltaTime);

            // 更新 tick 计数显示
            setTickCount(executorRef.current.getTickCount());

            lastTickTimeRef.current = currentTime;
        }

        // 继续循环（保持60fps）
        animationFrameRef.current = requestAnimationFrame(tickLoop);
    };

    // 速度变化处理
    const handleSpeedChange = (speed: number) => {
        setExecutionSpeed(speed);
        executionSpeedRef.current = speed;
    };

    const handlePlay = () => {
        if (executionModeRef.current === 'running') return;

        // 保存设计时的初始黑板变量值
        const initialVars = JSON.parse(JSON.stringify(blackboardVariables || {}));
        initialBlackboardVariablesRef.current = initialVars;
        setInitialBlackboardVariables(initialVars);
        setIsExecuting(true);

        executionModeRef.current = 'running';
        setExecutionMode('running');
        setTickCount(0);
        lastTickTimeRef.current = 0;

        if (!executorRef.current) {
            executorRef.current = new BehaviorTreeExecutor();
        }

        executorRef.current.buildTree(
            nodes,
            ROOT_NODE_ID,
            blackboardVariables || {},
            connections,
            handleExecutionStatusUpdate,
            projectPath
        );

        executorRef.current.start();

        animationFrameRef.current = requestAnimationFrame(tickLoop);
    };

    const handlePause = () => {
        if (executionModeRef.current === 'running') {
            executionModeRef.current = 'paused';
            setExecutionMode('paused');

            if (executorRef.current) {
                executorRef.current.pause();
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        } else if (executionModeRef.current === 'paused') {
            executionModeRef.current = 'running';
            setExecutionMode('running');
            lastTickTimeRef.current = 0;

            if (executorRef.current) {
                executorRef.current.resume();
            }

            animationFrameRef.current = requestAnimationFrame(tickLoop);
        }
    };

    const handleStop = () => {
        executionModeRef.current = 'idle';
        setExecutionMode('idle');
        setTickCount(0);
        lastTickTimeRef.current = 0;

        // 清除所有状态定时器
        statusTimersRef.current.forEach((timer) => clearTimeout(timer));
        statusTimersRef.current.clear();

        // 清除DOM缓存
        const cache = domCacheRef.current;
        cache.lastNodeStatus.clear();

        // 使用缓存来移除节点状态类
        cache.nodes.forEach((node) => {
            node.classList.remove('running', 'success', 'failure', 'executed');
        });

        // 使用缓存来重置连线样式
        cache.connections.forEach((path, _connKey) => {
            const connectionType = path.getAttribute('data-connection-type');
            if (connectionType === 'property') {
                path.setAttribute('stroke', '#9c27b0');
            } else {
                path.setAttribute('stroke', '#0e639c');
            }
            path.setAttribute('stroke-width', '2');
        });

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (executorRef.current) {
            executorRef.current.stop();

            // 停止后，还原到运行前保存的初始黑板变量值
            setBlackboardVariables(initialBlackboardVariablesRef.current);
            setIsExecuting(false);
        }
    };

    // 设置停止执行的 ref，供 useQuickCreateMenu Hook 使用
    stopExecutionRef.current = handleStop;

    const handleStep = async () => {
        setExecutionMode('step');
    };

    const handleReset = () => {
        handleStop();

        if (executorRef.current) {
            executorRef.current.cleanup();
        }
    };

    const handleClearCanvas = async () => {
        const confirmed = await ask('确定要清空画布吗？此操作不可撤销。', {
            title: '清空画布',
            kind: 'warning'
        });

        if (confirmed) {
            setNodes([
                new Node(
                    ROOT_NODE_ID,
                    rootNodeTemplate,
                    { nodeType: 'root' },
                    new Position(400, 100),
                    []
                )
            ]);
            setConnections([]);
            setSelectedNodeIds([]);
        }
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (executorRef.current) {
                executorRef.current.destroy();
            }
        };
    }, []);

    // 监听黑板变量变化，同步到执行器
    useEffect(() => {
        if (!executorRef.current || executionMode === 'idle') {
            return;
        }

        // 获取执行器中的当前黑板变量
        const executorVars = executorRef.current.getBlackboardVariables();

        // 检查是否有变化
        Object.entries(blackboardVariables).forEach(([key, value]) => {
            if (executorVars[key] !== value) {
                executorRef.current?.updateBlackboardVariable(key, value);
            }
        });
    }, [blackboardVariables, executionMode]);

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

            {/* 画布区域容器 */}
            <div style={{
                flex: 1,
                position: 'relative',
                minHeight: 0,
                overflow: 'hidden'
            }}>
                {/* 画布 */}
                <BehaviorTreeCanvas
                    ref={canvasRef}
                    config={editorConfig}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
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
                >
                        {/* 连接线层 */}
                        <ConnectionLayer
                            connections={connections}
                            nodes={nodes}
                            selectedConnection={selectedConnection}
                            getPortPosition={getPortPosition}
                            onConnectionClick={(e, fromId, toId) => {
                                setSelectedConnection({ from: fromId, to: toId });
                                setSelectedNodeIds([]);
                            }}
                        />

                        {/* 正在拖拽的连接线预览 */}
                        <svg style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '10000px',
                            height: '10000px',
                            pointerEvents: 'none',
                            zIndex: 1,
                            overflow: 'visible'
                        }}>
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
                                        style={{ pointerEvents: 'none' }}
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
                            const isSelected = selectedNodeIds.includes(node.id);
                            const isBeingDragged = dragStartPositions.has(node.id);

                            return (
                                <BehaviorTreeNodeComponent
                                    key={node.id}
                                    node={node}
                                    isSelected={isSelected}
                                    isBeingDragged={isBeingDragged}
                                    dragDelta={dragDelta}
                                    uncommittedNodeIds={uncommittedNodeIds}
                                    blackboardVariables={blackboardVariables}
                                    initialBlackboardVariables={initialBlackboardVariables}
                                    isExecuting={isExecuting}
                                    connections={connections}
                                    nodes={nodes}
                                    executorRef={executorRef}
                                    iconMap={iconMap}
                                    draggingNodeId={draggingNodeId}
                                    onNodeClick={handleNodeClick}
                                    onContextMenu={handleNodeContextMenu}
                                    onNodeMouseDown={handleNodeMouseDown}
                                    onNodeMouseUpForConnection={handleNodeMouseUpForConnection}
                                    onPortMouseDown={handlePortMouseDown}
                                    onPortMouseUp={handlePortMouseUp}
                                />
                            );
                        })}

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
                </BehaviorTreeCanvas>

                {/* 运行控制工具栏 */}
                <EditorToolbar
                    executionMode={executionMode}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onStop={handleStop}
                    onStep={handleStep}
                    onReset={handleReset}
                    onUndo={undo}
                    onRedo={redo}
                    onResetView={handleResetView}
                    onClearCanvas={handleClearCanvas}
                />

                {/* 快速创建菜单 */}
                <QuickCreateMenu
                    visible={quickCreateMenu.visible}
                    position={quickCreateMenu.position}
                    searchText={quickCreateMenu.searchText}
                    selectedIndex={quickCreateMenu.selectedIndex}
                    mode={quickCreateMenu.mode}
                    iconMap={iconMap}
                    onSearchChange={(text) => setQuickCreateMenu({
                        ...quickCreateMenu,
                        searchText: text
                    })}
                    onIndexChange={(index) => setQuickCreateMenu({
                        ...quickCreateMenu,
                        selectedIndex: index
                    })}
                    onNodeSelect={handleQuickCreateNode}
                    onClose={() => {
                        setQuickCreateMenu({
                            visible: false,
                            position: { x: 0, y: 0 },
                            searchText: '',
                            selectedIndex: 0,
                            mode: 'create',
                            replaceNodeId: null
                        });
                        clearConnecting();
                    }}
                />

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

            {/* 执行面板 */}
            <div style={{
                height: '250px',
                borderTop: '1px solid #333'
            }}>
                <BehaviorTreeExecutionPanel
                    logs={executionLogs}
                    onClearLogs={() => setExecutionLogs([])}
                    isRunning={executionMode === 'running'}
                    tickCount={tickCount}
                    executionSpeed={executionSpeed}
                    onSpeedChange={handleSpeedChange}
                />
            </div>

            {/* 右键菜单 */}
            <NodeContextMenu
                visible={contextMenu.visible}
                position={contextMenu.position}
                nodeId={contextMenu.nodeId}
                onReplaceNode={() => {
                    setQuickCreateMenu({
                        visible: true,
                        position: contextMenu.position,
                        searchText: '',
                        selectedIndex: 0,
                        mode: 'replace',
                        replaceNodeId: contextMenu.nodeId
                    });
                    setContextMenu({ ...contextMenu, visible: false });
                }}
            />
        </div>
    );
};
