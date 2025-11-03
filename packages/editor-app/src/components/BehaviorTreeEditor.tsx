import React, { useState, useRef, useEffect } from 'react';
import { NodeTemplate, PropertyDefinition, NodeType, NodeTemplates } from '@esengine/behavior-tree';
import {
    TreePine, Play, Pause, Square, SkipForward, RotateCcw, Trash2,
    List, GitBranch, Layers, Shuffle,
    Repeat, CheckCircle, XCircle, CheckCheck, HelpCircle, Snowflake, Timer,
    Clock, FileText, Edit, Calculator, Code,
    Equal, Dices, Settings,
    Database, AlertTriangle, AlertCircle, Search, X,
    LucideIcon
} from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';
import { useBehaviorTreeStore, BehaviorTreeNode, Connection, ROOT_NODE_ID } from '../stores/behaviorTreeStore';
import { BehaviorTreeExecutor, ExecutionStatus, ExecutionLog } from '../utils/BehaviorTreeExecutor';
import { BehaviorTreeExecutionPanel } from './BehaviorTreeExecutionPanel';
import { useToast } from './Toast';
import { Node } from '../domain/models/Node';
import { Connection as ConnectionModel } from '../domain/models/Connection';
import { Position } from '../domain/value-objects/Position';
import { BlackboardValue } from '../domain/models/Blackboard';
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
 * 生成短位唯一ID
 * 使用时间戳和随机数组合，确保唯一性
 */
function generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${randomPart}`;
}

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
        triggerForceUpdate,
        sortChildrenByPosition,
        setBlackboardVariables,
        setInitialBlackboardVariables,
        setIsExecuting,
        initialBlackboardVariables,
        isExecuting
    } = useBehaviorTreeStore();

    // 右键菜单状态
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        nodeId: string | null;
    }>({
        visible: false,
        position: { x: 0, y: 0 },
        nodeId: null
    });

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
                setContextMenu({ ...contextMenu, visible: false });
            }
        };

        if (contextMenu.visible) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.visible]);

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    // 快速创建菜单状态
    const [quickCreateMenu, setQuickCreateMenu] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        searchText: string;
        selectedIndex: number;
        mode: 'create' | 'replace';
        replaceNodeId: string | null;
    }>({
        visible: false,
        position: { x: 0, y: 0 },
        searchText: '',
        selectedIndex: 0,
        mode: 'create',
        replaceNodeId: null
    });
    const selectedNodeRef = useRef<HTMLDivElement>(null);

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

    // 自动滚动到选中的节点
    useEffect(() => {
        if (quickCreateMenu.visible && selectedNodeRef.current) {
            selectedNodeRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [quickCreateMenu.selectedIndex, quickCreateMenu.visible]);

    // 选中的连线
    const [selectedConnection, setSelectedConnection] = useState<{from: string; to: string} | null>(null);

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
                    removeConnections((conn: Connection) =>
                        !(conn.from === selectedConnection.from && conn.to === selectedConnection.to)
                    );

                    // 同步更新父节点的children数组，移除被删除的子节点引用
                    setNodes(nodes.map((node: BehaviorTreeNode) => {
                        if (node.id === selectedConnection.from) {
                            const newChildren = Array.from(node.children).filter((childId: string) => childId !== selectedConnection.to);
                            return new Node(node.id, node.template, node.data, node.position, newChildren);
                        }
                        return node;
                    }));

                    setSelectedConnection(null);
                    return;
                }

                // 删除选中的节点
                if (selectedNodeIds.length > 0) {
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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, selectedConnection, removeNodes, removeConnections, setSelectedNodeIds]);

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

                const newNode = new Node(
                    `var_${variableData.variableName}_${generateUniqueId()}`,
                    variableTemplate,
                    {
                        nodeType: 'blackboard-variable',
                        variableName: variableData.variableName
                    },
                    new Position(position.x, position.y),
                    []
                );

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

            const template = JSON.parse(templateData) as NodeTemplate;

            const newNode = new Node(
                `node_${generateUniqueId()}`,
                template,
                { ...template.defaultConfig },
                new Position(position.x, position.y),
                []
            );

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

    const handleNodeContextMenu = (e: React.MouseEvent, node: BehaviorTreeNode) => {
        e.preventDefault();
        e.stopPropagation();

        // 不允许对Root节点右键
        if (node.id === ROOT_NODE_ID) {
            return;
        }

        setContextMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY },
            nodeId: node.id
        });
    };

    const handleReplaceNode = (newTemplate: NodeTemplate) => {
        const nodeToReplace = nodes.find((n) => n.id === quickCreateMenu.replaceNodeId);
        if (!nodeToReplace) return;

        // 如果行为树正在执行，先停止
        if (executionMode !== 'idle') {
            handleStop();
        }

        // 合并数据：新模板的默认配置 + 保留旧节点中同名属性的值
        const newData = { ...newTemplate.defaultConfig };

        // 获取新模板的属性名列表
        const newPropertyNames = new Set(newTemplate.properties.map((p) => p.name));

        // 遍历旧节点的 data，保留新模板中也存在的属性
        for (const [key, value] of Object.entries(nodeToReplace.data)) {
            // 跳过节点类型相关的字段
            if (key === 'nodeType' || key === 'compositeType' || key === 'decoratorType' ||
                key === 'actionType' || key === 'conditionType') {
                continue;
            }

            // 如果新模板也有这个属性，保留旧值（包括绑定信息）
            if (newPropertyNames.has(key)) {
                newData[key] = value;
            }
        }

        // 创建新节点，保留原节点的位置和连接
        const newNode = new Node(
            nodeToReplace.id,
            newTemplate,
            newData,
            nodeToReplace.position,
            Array.from(nodeToReplace.children)
        );

        // 替换节点
        setNodes(nodes.map((n) => n.id === newNode.id ? newNode : n));

        // 删除所有指向该节点的属性连接，让用户重新连接
        const updatedConnections = connections.filter((conn) =>
            !(conn.connectionType === 'property' && conn.to === newNode.id)
        );
        setConnections(updatedConnections);

        // 关闭快速创建菜单
        setQuickCreateMenu({
            visible: false,
            position: { x: 0, y: 0 },
            searchText: '',
            selectedIndex: 0,
            mode: 'create',
            replaceNodeId: null
        });

        // 显示提示
        showToast?.(`已将节点替换为 ${newTemplate.displayName}`, 'success');
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        // 只允许左键拖动节点
        if (e.button !== 0) return;

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
                startPositions.set(id, { x: n.position.x, y: n.position.y });
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

            // 拖动结束后，自动排序子节点
            setTimeout(() => {
                sortChildrenByPosition();
            }, 0);
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

            setConnections([
                ...connections,
                new ConnectionModel(
                    actualFrom,
                    actualTo,
                    'property',
                    actualFromProperty || undefined,
                    actualToProperty || undefined
                )
            ]);
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

            setConnections([
                ...connections,
                new ConnectionModel(actualFrom, actualTo, 'node')
            ]);

            // 更新节点的 children
            setNodes(nodes.map((node: BehaviorTreeNode) =>
                node.id === actualFrom
                    ? new Node(node.id, node.template, node.data, node.position, [...node.children, actualTo])
                    : node
            ));

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

    const handleQuickCreateNode = (template: NodeTemplate) => {
        // 如果是替换模式，直接调用替换函数
        if (quickCreateMenu.mode === 'replace') {
            handleReplaceNode(template);
            return;
        }

        // 创建模式：需要连接
        if (!connectingFrom) {
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
            return;
        }

        const posX = (quickCreateMenu.position.x - rect.left - canvasOffset.x) / canvasScale;
        const posY = (quickCreateMenu.position.y - rect.top - canvasOffset.y) / canvasScale;

        const newNode = new Node(
            `node_${generateUniqueId()}`,
            template,
            { ...template.defaultConfig },
            new Position(posX, posY),
            []
        );

        const fromNode = nodes.find((n: BehaviorTreeNode) => n.id === connectingFrom);
        if (fromNode) {
            if (connectingFromProperty) {
                // 属性连接
                setConnections([
                    ...connections,
                    new ConnectionModel(
                        connectingFrom,
                        newNode.id,
                        'property',
                        connectingFromProperty,
                        undefined
                    )
                ]);
                setNodes([...nodes, newNode]);
            } else {
                // 节点连接：需要同时更新 connections 和父节点的 children
                setConnections([
                    ...connections,
                    new ConnectionModel(connectingFrom, newNode.id, 'node')
                ]);

                // 更新父节点的 children 数组
                setNodes([
                    ...nodes.map((node: BehaviorTreeNode) =>
                        node.id === connectingFrom
                            ? new Node(node.id, node.template, node.data, node.position, [...node.children, newNode.id])
                            : node
                    ),
                    newNode
                ]);
            }
        } else {
            setNodes([...nodes, newNode]);
        }

        setQuickCreateMenu({
            visible: false,
            position: { x: 0, y: 0 },
            searchText: '',
            selectedIndex: 0,
            mode: 'create',
            replaceNodeId: null
        });
        clearConnecting();

        onNodeCreate?.(template, { x: posX, y: posY });
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

    const handleStep = async () => {
        setExecutionMode('step');
    };

    const handleReset = () => {
        handleStop();

        if (executorRef.current) {
            executorRef.current.cleanup();
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
                        width: '100%',
                        height: '100%',
                        backgroundImage: `
                            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
                        backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
                        position: 'relative',
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
                            pointerEvents: 'auto',
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

                                // 默认颜色和宽度（会被DOM操作动态更新）
                                const color = conn.connectionType === 'property' ? '#9c27b0' : '#0e639c';
                                const strokeWidth = 2;

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

                                const isSelected = selectedConnection?.from === conn.from && selectedConnection?.to === conn.to;

                                return (
                                    <path
                                        key={index}
                                        data-connection-id={`${conn.from}-${conn.to}`}
                                        data-connection-type={conn.connectionType || 'node'}
                                        d={pathD}
                                        stroke={isSelected ? '#FFD700' : color}
                                        strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                                        fill="none"
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedConnection({ from: conn.from, to: conn.to });
                                            setSelectedNodeIds([]);
                                        }}
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
                            const isRoot = node.id === ROOT_NODE_ID;
                            const isBlackboardVariable = node.data.nodeType === 'blackboard-variable';
                            const isSelected = selectedNodeIds.includes(node.id);

                            // 如果节点正在拖动，使用临时位置
                            const isBeingDragged = dragStartPositions.has(node.id);
                            const posX = node.position.x + (isBeingDragged ? dragDelta.dx : 0);
                            const posY = node.position.y + (isBeingDragged ? dragDelta.dy : 0);

                            const isUncommitted = uncommittedNodeIds.has(node.id);
                            const nodeClasses = [
                                'bt-node',
                                isSelected && 'selected',
                                isRoot && 'root',
                                isUncommitted && 'uncommitted'
                            ].filter(Boolean).join(' ');

                            return (
                                <div
                                    key={node.id}
                                    data-node-id={node.id}
                                    className={nodeClasses}
                                    onClick={(e) => handleNodeClick(e, node)}
                                    onContextMenu={(e) => handleNodeContextMenu(e, node)}
                                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                    onMouseUp={(e) => handleNodeMouseUpForConnection(e, node.id)}
                                    style={{
                                        left: posX,
                                        top: posY,
                                        transform: 'translate(-50%, -50%)',
                                        cursor: isRoot ? 'default' : (draggingNodeId === node.id ? 'grabbing' : 'grab'),
                                        transition: draggingNodeId === node.id ? 'none' : 'all 0.2s',
                                        zIndex: isRoot ? 50 : (draggingNodeId === node.id ? 100 : (isSelected ? 10 : 1))
                                    }}
                                >
                                    {isBlackboardVariable ? (
                                        (() => {
                                            const varName = node.data.variableName as string;
                                            const currentValue = blackboardVariables[varName];
                                            const initialValue = initialBlackboardVariables[varName];
                                            const isModified = isExecuting && JSON.stringify(currentValue) !== JSON.stringify(initialValue);

                                            return (
                                                <>
                                                    <div className="bt-node-header blackboard">
                                                        <Database size={16} className="bt-node-header-icon" />
                                                        <div className="bt-node-header-title">
                                                            {varName || 'Variable'}
                                                        </div>
                                                        {isModified && (
                                                            <span style={{
                                                                fontSize: '9px',
                                                                color: '#ffbb00',
                                                                backgroundColor: 'rgba(255, 187, 0, 0.2)',
                                                                padding: '2px 4px',
                                                                borderRadius: '2px',
                                                                marginLeft: '4px'
                                                            }}>
                                                    运行时
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="bt-node-body">
                                                        <div
                                                            className="bt-node-blackboard-value"
                                                            style={{
                                                                backgroundColor: isModified ? 'rgba(255, 187, 0, 0.15)' : 'transparent',
                                                                border: isModified ? '1px solid rgba(255, 187, 0, 0.3)' : 'none',
                                                                borderRadius: '2px',
                                                                padding: '2px 4px'
                                                            }}
                                                            title={isModified ? `初始值: ${JSON.stringify(initialValue)}\n当前值: ${JSON.stringify(currentValue)}` : undefined}
                                                        >
                                                            {JSON.stringify(currentValue)}
                                                        </div>
                                                    </div>
                                                    <div
                                                        data-port="true"
                                                        data-node-id={node.id}
                                                        data-port-type="variable-output"
                                                        onMouseDown={(e) => handlePortMouseDown(e, node.id, '__value__')}
                                                        onMouseUp={(e) => handlePortMouseUp(e, node.id, '__value__')}
                                                        className="bt-node-port bt-node-port-variable-output"
                                                        title="Output"
                                                    />
                                                </>
                                            );
                                        })()
                                    ) : (
                                        <>
                                            {/* 标题栏 - 带渐变 */}
                                            <div className={`bt-node-header ${isRoot ? 'root' : (node.template.type || 'action')}`}>
                                                {isRoot ? (
                                                    <TreePine size={16} className="bt-node-header-icon" />
                                                ) : (
                                                    node.template.icon && (() => {
                                                        const IconComponent = iconMap[node.template.icon];
                                                        return IconComponent ? (
                                                            <IconComponent size={16} className="bt-node-header-icon" />
                                                        ) : (
                                                            <span className="bt-node-header-icon">{node.template.icon}</span>
                                                        );
                                                    })()
                                                )}
                                                <div className="bt-node-header-title">
                                                    <div>{isRoot ? 'ROOT' : node.template.displayName}</div>
                                                    <div className="bt-node-id" title={node.id}>
                                            #{node.id}
                                                    </div>
                                                </div>
                                                {/* 缺失执行器警告 */}
                                                {!isRoot && node.template.className && executorRef.current && !executorRef.current.hasExecutor(node.template.className) && (
                                                    <div
                                                        className="bt-node-missing-executor-warning"
                                                        style={{
                                                            marginLeft: 'auto',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            cursor: 'help',
                                                            pointerEvents: 'auto',
                                                            position: 'relative'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <AlertCircle
                                                            size={14}
                                                            style={{
                                                                color: '#f44336',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                        <div className="bt-node-missing-executor-tooltip">
                                                缺失执行器：找不到节点对应的执行器 "{node.template.className}"
                                                        </div>
                                                    </div>
                                                )}
                                                {/* 未生效节点警告 */}
                                                {isUncommitted && (
                                                    <div
                                                        className="bt-node-uncommitted-warning"
                                                        style={{
                                                            marginLeft: !isRoot && node.template.className && executorRef.current && !executorRef.current.hasExecutor(node.template.className) ? '4px' : 'auto',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            cursor: 'help',
                                                            pointerEvents: 'auto',
                                                            position: 'relative'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <AlertTriangle
                                                            size={14}
                                                            style={{
                                                                color: '#ff5722',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                        <div className="bt-node-uncommitted-tooltip">
                                                未生效节点：运行时添加的节点，需重新运行才能生效
                                                        </div>
                                                    </div>
                                                )}
                                                {/* 空节点警告图标 */}
                                                {!isRoot && !isUncommitted && node.template.type === 'composite' &&
                                     (node.template.requiresChildren === undefined || node.template.requiresChildren === true) &&
                                     !nodes.some((n) =>
                                         connections.some((c) => c.from === node.id && c.to === n.id)
                                     ) && (
                                                    <div
                                                        className="bt-node-empty-warning-container"
                                                        style={{
                                                            marginLeft: isUncommitted ? '4px' : 'auto',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            cursor: 'help',
                                                            pointerEvents: 'auto',
                                                            position: 'relative'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <AlertTriangle
                                                            size={14}
                                                            style={{
                                                                color: '#ff9800',
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                        <div className="bt-node-empty-warning-tooltip">
                                                空节点：没有子节点，执行时会直接跳过
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 节点主体 */}
                                            <div className="bt-node-body">
                                                {!isRoot && (
                                                    <div className="bt-node-category">
                                                        {node.template.category}
                                                    </div>
                                                )}

                                                {/* 属性列表 */}
                                                {node.template.properties.length > 0 && (
                                                    <div className="bt-node-properties">
                                                        {node.template.properties.map((prop: PropertyDefinition, idx: number) => {
                                                            const hasConnection = connections.some(
                                                                (conn: Connection) => conn.toProperty === prop.name && conn.to === node.id
                                                            );
                                                            const propValue = node.data[prop.name];

                                                            return (
                                                                <div key={idx} className="bt-node-property">
                                                                    <div
                                                                        data-port="true"
                                                                        data-node-id={node.id}
                                                                        data-property={prop.name}
                                                                        data-port-type="property-input"
                                                                        onMouseDown={(e) => handlePortMouseDown(e, node.id, prop.name)}
                                                                        onMouseUp={(e) => handlePortMouseUp(e, node.id, prop.name)}
                                                                        className={`bt-node-port bt-node-port-property ${hasConnection ? 'connected' : ''}`}
                                                                        title={prop.description || prop.name}
                                                                    />
                                                                    <span
                                                                        className="bt-node-property-label"
                                                                        title={prop.description}
                                                                    >
                                                                        {prop.name}:
                                                                    </span>
                                                                    {propValue !== undefined && (
                                                                        <span className="bt-node-property-value">
                                                                            {String(propValue)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 输入端口（顶部）- Root 节点不显示 */}
                                            {!isRoot && (
                                                <div
                                                    data-port="true"
                                                    data-node-id={node.id}
                                                    data-port-type="node-input"
                                                    onMouseDown={(e) => handlePortMouseDown(e, node.id)}
                                                    onMouseUp={(e) => handlePortMouseUp(e, node.id)}
                                                    className="bt-node-port bt-node-port-input"
                                                    title="Input"
                                                />
                                            )}

                                            {/* 输出端口（底部）- 只有组合节点和装饰器节点才显示，但不需要子节点的节点除外 */}
                                            {(node.template.type === 'composite' || node.template.type === 'decorator') &&
                                 (node.template.requiresChildren === undefined || node.template.requiresChildren === true) && (
                                                <div
                                                    data-port="true"
                                                    data-node-id={node.id}
                                                    data-port-type="node-output"
                                                    onMouseDown={(e) => handlePortMouseDown(e, node.id)}
                                                    onMouseUp={(e) => handlePortMouseUp(e, node.id)}
                                                    className="bt-node-port bt-node-port-output"
                                                    title="Output"
                                                />
                                            )}
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
                            padding: '8px',
                            backgroundColor: executionMode === 'running' ? '#2d2d2d' : '#4caf50',
                            border: 'none',
                            borderRadius: '4px',
                            color: executionMode === 'running' ? '#666' : '#fff',
                            cursor: executionMode === 'running' ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="运行 (Play)"
                    >
                        <Play size={16} />
                    </button>
                    <button
                        onClick={handlePause}
                        disabled={executionMode === 'idle'}
                        style={{
                            padding: '8px',
                            backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#ff9800',
                            border: 'none',
                            borderRadius: '4px',
                            color: executionMode === 'idle' ? '#666' : '#fff',
                            cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title={executionMode === 'paused' ? '继续' : '暂停'}
                    >
                        {executionMode === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button
                        onClick={handleStop}
                        disabled={executionMode === 'idle'}
                        style={{
                            padding: '8px',
                            backgroundColor: executionMode === 'idle' ? '#2d2d2d' : '#f44336',
                            border: 'none',
                            borderRadius: '4px',
                            color: executionMode === 'idle' ? '#666' : '#fff',
                            cursor: executionMode === 'idle' ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="停止"
                    >
                        <Square size={16} />
                    </button>
                    <button
                        onClick={handleStep}
                        disabled={executionMode !== 'idle' && executionMode !== 'paused'}
                        style={{
                            padding: '8px',
                            backgroundColor: (executionMode !== 'idle' && executionMode !== 'paused') ? '#2d2d2d' : '#2196f3',
                            border: 'none',
                            borderRadius: '4px',
                            color: (executionMode !== 'idle' && executionMode !== 'paused') ? '#666' : '#fff',
                            cursor: (executionMode !== 'idle' && executionMode !== 'paused') ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="单步执行"
                    >
                        <SkipForward size={16} />
                    </button>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '8px',
                            backgroundColor: '#9e9e9e',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="重置"
                    >
                        <RotateCcw size={16} />
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
                        onClick={async () => {
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

                {/* 快速创建菜单 */}
                {quickCreateMenu.visible && (() => {
                    const allTemplates = NodeTemplates.getAllTemplates();
                    const searchText = quickCreateMenu.searchText.toLowerCase();
                    const filteredTemplates = searchText
                        ? allTemplates.filter((t: NodeTemplate) => {
                            const className = t.className || '';
                            return t.displayName.toLowerCase().includes(searchText) ||
                               t.description.toLowerCase().includes(searchText) ||
                               t.category.toLowerCase().includes(searchText) ||
                               className.toLowerCase().includes(searchText);
                        })
                        : allTemplates;

                    return (
                        <>
                            <style>{`
                            .quick-create-menu-list::-webkit-scrollbar {
                                width: 8px;
                            }
                            .quick-create-menu-list::-webkit-scrollbar-track {
                                background: #1e1e1e;
                            }
                            .quick-create-menu-list::-webkit-scrollbar-thumb {
                                background: #3c3c3c;
                                border-radius: 4px;
                            }
                            .quick-create-menu-list::-webkit-scrollbar-thumb:hover {
                                background: #4c4c4c;
                            }
                        `}</style>
                            <div
                                style={{
                                    position: 'fixed',
                                    left: `${quickCreateMenu.position.x}px`,
                                    top: `${quickCreateMenu.position.y}px`,
                                    width: '300px',
                                    maxHeight: '400px',
                                    backgroundColor: '#2d2d2d',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                    zIndex: 1000,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div style={{
                                    padding: '12px',
                                    borderBottom: '1px solid #3c3c3c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Search size={16} style={{ color: '#999', flexShrink: 0 }} />
                                    <input
                                        type="text"
                                        placeholder="搜索节点..."
                                        autoFocus
                                        value={quickCreateMenu.searchText}
                                        onChange={(e) => setQuickCreateMenu({
                                            ...quickCreateMenu,
                                            searchText: e.target.value,
                                            selectedIndex: 0
                                        })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setQuickCreateMenu({
                                                    visible: false,
                                                    position: { x: 0, y: 0 },
                                                    searchText: '',
                                                    selectedIndex: 0,
                                                    mode: 'create',
                                                    replaceNodeId: null
                                                });
                                                clearConnecting();
                                            } else if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setQuickCreateMenu({
                                                    ...quickCreateMenu,
                                                    selectedIndex: Math.min(quickCreateMenu.selectedIndex + 1, filteredTemplates.length - 1)
                                                });
                                            } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setQuickCreateMenu({
                                                    ...quickCreateMenu,
                                                    selectedIndex: Math.max(quickCreateMenu.selectedIndex - 1, 0)
                                                });
                                            } else if (e.key === 'Enter' && filteredTemplates.length > 0) {
                                                e.preventDefault();
                                                const selectedTemplate = filteredTemplates[quickCreateMenu.selectedIndex];
                                                if (selectedTemplate) {
                                                    handleQuickCreateNode(selectedTemplate);
                                                }
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            color: '#ccc',
                                            fontSize: '14px',
                                            padding: '4px'
                                        }}
                                    />
                                    <button
                                        onClick={() => {
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
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#999',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div
                                    className="quick-create-menu-list"
                                    style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '8px'
                                    }}
                                >
                                    {filteredTemplates.length === 0 ? (
                                        <div style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            color: '#666',
                                            fontSize: '12px'
                                        }}>
                                    未找到匹配的节点
                                        </div>
                                    ) : (
                                        filteredTemplates.map((template: NodeTemplate, index: number) => {
                                            const IconComponent = template.icon ? iconMap[template.icon] : null;
                                            const className = template.className || '';
                                            const isSelected = index === quickCreateMenu.selectedIndex;
                                            return (
                                                <div
                                                    key={index}
                                                    ref={isSelected ? selectedNodeRef : null}
                                                    onClick={() => handleQuickCreateNode(template)}
                                                    onMouseEnter={() => {
                                                        setQuickCreateMenu({
                                                            ...quickCreateMenu,
                                                            selectedIndex: index
                                                        });
                                                    }}
                                                    style={{
                                                        padding: '8px 12px',
                                                        marginBottom: '4px',
                                                        backgroundColor: isSelected ? '#0e639c' : '#1e1e1e',
                                                        borderLeft: `3px solid ${template.color || '#666'}`,
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        transform: isSelected ? 'translateX(2px)' : 'translateX(0)'
                                                    }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {IconComponent && (
                                                            <IconComponent size={14} style={{ color: template.color || '#999', flexShrink: 0 }} />
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                color: '#ccc',
                                                                fontSize: '13px',
                                                                fontWeight: '500',
                                                                marginBottom: '2px'
                                                            }}>
                                                                {template.displayName}
                                                            </div>
                                                            {className && (
                                                                <div style={{
                                                                    color: '#666',
                                                                    fontSize: '10px',
                                                                    fontFamily: 'Consolas, Monaco, monospace',
                                                                    opacity: 0.8
                                                                }}>
                                                                    {className}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#999',
                                                        lineHeight: '1.4',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {template.description}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '10px',
                                                        color: '#666'
                                                    }}>
                                                        {template.category}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    );
                })()}

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
            {contextMenu.visible && (
                <div
                    style={{
                        position: 'fixed',
                        left: contextMenu.position.x,
                        top: contextMenu.position.y,
                        backgroundColor: '#2d2d30',
                        border: '1px solid #454545',
                        borderRadius: '4px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                        zIndex: 10000,
                        minWidth: '150px',
                        padding: '4px 0'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        onClick={() => {
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
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            color: '#cccccc',
                            fontSize: '13px',
                            transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#094771'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        替换节点
                    </div>
                </div>
            )}
        </div>
    );
};
