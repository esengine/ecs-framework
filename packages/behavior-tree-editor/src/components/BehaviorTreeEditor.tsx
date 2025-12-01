import { React, useEffect, useMemo, useRef, useState, useCallback } from '@esengine/editor-runtime';
import { BlackboardValueType, type NodeTemplate } from '@esengine/behavior-tree';
import { useBehaviorTreeDataStore, BehaviorTreeNode, ROOT_NODE_ID } from '../stores';
import { useUIStore } from '../stores';
import { showToast as notificationShowToast } from '../services/NotificationService';
import { BlackboardValue } from '../domain/models/Blackboard';
import { GlobalBlackboardService } from '../application/services/GlobalBlackboardService';
import { BehaviorTreeCanvas } from './canvas/BehaviorTreeCanvas';
import { ConnectionLayer } from './connections/ConnectionLayer';
import { NodeFactory } from '../infrastructure/factories/NodeFactory';
import { TreeValidator } from '../domain/services/TreeValidator';
import { useNodeOperations } from '../hooks/useNodeOperations';
import { useConnectionOperations } from '../hooks/useConnectionOperations';
import { useCommandHistory } from '../hooks/useCommandHistory';
import { useNodeDrag } from '../hooks/useNodeDrag';
import { usePortConnection } from '../hooks/usePortConnection';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDropHandler } from '../hooks/useDropHandler';
import { useCanvasMouseEvents } from '../hooks/useCanvasMouseEvents';
import { useContextMenu } from '../hooks/useContextMenu';
import { useQuickCreateMenu } from '../hooks/useQuickCreateMenu';
import { EditorToolbar } from './toolbar/EditorToolbar';
import { QuickCreateMenu } from './menu/QuickCreateMenu';
import { NodeContextMenu } from './menu/NodeContextMenu';
import { BehaviorTreeNode as BehaviorTreeNodeComponent } from './nodes/BehaviorTreeNode';
import { BlackboardPanel } from './blackboard/BlackboardPanel';
import { getPortPosition as getPortPositionUtil } from '../utils/portUtils';
import { useExecutionController } from '../hooks/useExecutionController';
import { useNodeTracking } from '../hooks/useNodeTracking';
import { useEditorHandlers } from '../hooks/useEditorHandlers';
import { ICON_MAP, DEFAULT_EDITOR_CONFIG } from '../config/editorConstants';
import '../styles/BehaviorTreeNode.css';

type BlackboardVariables = Record<string, BlackboardValue>;

interface BehaviorTreeEditorProps {
    onNodeSelect?: (node: BehaviorTreeNode) => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    blackboardVariables?: BlackboardVariables;
    projectPath?: string | null;
    showToolbar?: boolean;
    showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
    currentFileName?: string;
    hasUnsavedChanges?: boolean;
    onSave?: () => void;
    onOpen?: () => void;
    onExport?: () => void;
    onCopyToClipboard?: () => void;
}

export const BehaviorTreeEditor: React.FC<BehaviorTreeEditorProps> = ({
    onNodeSelect,
    onNodeCreate,
    blackboardVariables = {},
    projectPath = null,
    showToolbar = true,
    showToast: showToastProp,
    currentFileName,
    hasUnsavedChanges = false,
    onSave,
    onOpen,
    onExport,
    onCopyToClipboard
}) => {
    // 使用传入的 showToast 或回退到 NotificationService
    const showToast = showToastProp || notificationShowToast;

    // 数据 store（行为树数据 - 唯一数据源）
    const {
        canvasOffset,
        canvasScale,
        triggerForceUpdate,
        sortChildrenByPosition,
        setBlackboardVariables,
        setInitialBlackboardVariables,
        setIsExecuting,
        initialBlackboardVariables,
        isExecuting,
        saveNodesDataSnapshot,
        restoreNodesData,
        nodeExecutionStatuses,
        nodeExecutionOrders,
        resetView
    } = useBehaviorTreeDataStore();

    // 使用缓存的节点和连接数组（store 中已经优化，只在 tree 真正变化时更新）
    const nodes = useBehaviorTreeDataStore((state) => state.cachedNodes);
    const connections = useBehaviorTreeDataStore((state) => state.cachedConnections);

    // UI store（UI 交互状态）
    const {
        selectedNodeIds,
        selectedConnection,
        draggingNodeId,
        dragStartPositions,
        isDraggingNode,
        dragDelta,
        connectingFrom,
        connectingFromProperty,
        connectingToPos,
        isBoxSelecting,
        boxSelectStart,
        boxSelectEnd,
        setSelectedNodeIds,
        setSelectedConnection,
        startDragging,
        stopDragging,
        setIsDraggingNode,
        setDragDelta,
        setConnectingFrom,
        setConnectingFromProperty,
        setConnectingToPos,
        clearConnecting,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        clearBoxSelect
    } = useUIStore();

    const canvasRef = useRef<HTMLDivElement>(null);
    const stopExecutionRef = useRef<(() => void) | null>(null);
    const justFinishedBoxSelectRef = useRef(false);
    const [blackboardCollapsed, setBlackboardCollapsed] = useState(false);
    const [globalVariables, setGlobalVariables] = useState<Record<string, BlackboardValue>>({});

    const updateVariable = useBehaviorTreeDataStore((state) => state.updateBlackboardVariable);

    const globalBlackboardService = useMemo(() => GlobalBlackboardService.getInstance(), []);

    useEffect(() => {
        if (projectPath) {
            globalBlackboardService.setProjectPath(projectPath);
            setGlobalVariables(globalBlackboardService.getVariablesMap());
        }

        const unsubscribe = globalBlackboardService.onChange(() => {
            setGlobalVariables(globalBlackboardService.getVariablesMap());
        });

        return () => unsubscribe();
    }, [globalBlackboardService, projectPath]);

    const handleGlobalVariableAdd = useCallback((key: string, value: any, type: string) => {
        try {
            let bbType: BlackboardValueType;
            switch (type) {
                case 'number':
                    bbType = BlackboardValueType.Number;
                    break;
                case 'boolean':
                    bbType = BlackboardValueType.Boolean;
                    break;
                case 'object':
                    bbType = BlackboardValueType.Object;
                    break;
                default:
                    bbType = BlackboardValueType.String;
            }

            globalBlackboardService.addVariable({ key, type: bbType, defaultValue: value });
            showToast(`全局变量 "${key}" 已添加`, 'success');
        } catch (error) {
            showToast(`添加全局变量失败: ${error}`, 'error');
        }
    }, [globalBlackboardService, showToast]);

    const handleGlobalVariableChange = useCallback((key: string, value: any) => {
        try {
            globalBlackboardService.updateVariable(key, { defaultValue: value });
        } catch (error) {
            showToast(`更新全局变量失败: ${error}`, 'error');
        }
    }, [globalBlackboardService, showToast]);

    const handleGlobalVariableDelete = useCallback((key: string) => {
        try {
            globalBlackboardService.deleteVariable(key);
            showToast(`全局变量 "${key}" 已删除`, 'success');
        } catch (error) {
            showToast(`删除全局变量失败: ${error}`, 'error');
        }
    }, [globalBlackboardService, showToast]);

    // 监听框选状态变化，当框选结束时设置标记
    useEffect(() => {
        if (!isBoxSelecting && justFinishedBoxSelectRef.current) {
            // 框选刚结束，在下一个事件循环清除标记
            setTimeout(() => {
                justFinishedBoxSelectRef.current = false;
            }, 0);
        } else if (isBoxSelecting) {
            // 正在框选
            justFinishedBoxSelectRef.current = true;
        }
    }, [isBoxSelecting]);

    // Node factory
    const nodeFactory = useMemo(() => new NodeFactory(), []);

    // 验证器
    const validator = useMemo(() => new TreeValidator(), []);

    // 命令历史
    const { commandManager, canUndo, canRedo, undo, redo } = useCommandHistory();

    // 节点操作
    const nodeOperations = useNodeOperations(
        nodeFactory,
        commandManager
    );

    // 连接操作
    const connectionOperations = useConnectionOperations(
        validator,
        commandManager
    );

    // 上下文菜单
    const contextMenu = useContextMenu();

    // 执行控制器
    const {
        executionMode,
        executionSpeed,
        handlePlay,
        handlePause,
        handleStop,
        handleStep,
        handleSpeedChange,
        controller
    } = useExecutionController({
        rootNodeId: ROOT_NODE_ID,
        projectPath: projectPath || '',
        blackboardVariables,
        nodes,
        connections,
        initialBlackboardVariables,
        onBlackboardUpdate: setBlackboardVariables,
        onInitialBlackboardSave: setInitialBlackboardVariables,
        onExecutingChange: setIsExecuting,
        onSaveNodesDataSnapshot: saveNodesDataSnapshot,
        onRestoreNodesData: restoreNodesData,
        sortChildrenByPosition
    });

    const executorRef = useRef(null);
    const { uncommittedNodeIds } = useNodeTracking({ nodes, executionMode });

    // 快速创建菜单
    const quickCreateMenu = useQuickCreateMenu({
        nodeOperations,
        connectionOperations,
        canvasRef,
        canvasOffset,
        canvasScale,
        connectingFrom,
        connectingFromProperty,
        clearConnecting,
        nodes,
        connections,
        executionMode,
        onStop: () => stopExecutionRef.current?.(),
        onNodeCreate,
        showToast
    });

    const {
        handleNodeClick,
        handleResetView,
        handleClearCanvas
    } = useEditorHandlers({
        isDraggingNode,
        selectedNodeIds,
        setSelectedNodeIds,
        resetView,
        resetTree: useBehaviorTreeDataStore.getState().reset,
        triggerForceUpdate,
        onNodeSelect
    });

    // 添加缺少的处理函数
    const handleCanvasClick = (e: React.MouseEvent) => {
        // 如果正在框选或者刚刚结束框选，不要清空选择
        // 因为 click 事件会在 mouseup 之后触发，会清空框选的结果
        if (!isDraggingNode && !isBoxSelecting && !justFinishedBoxSelectRef.current) {
            setSelectedNodeIds([]);
            setSelectedConnection(null);
        }
        // 关闭右键菜单
        contextMenu.closeContextMenu();
    };

    const handleCanvasContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        contextMenu.handleCanvasContextMenu(e);
    };

    const handleNodeContextMenu = (e: React.MouseEvent, node: BehaviorTreeNode) => {
        e.preventDefault();
        contextMenu.handleNodeContextMenu(e, node);
    };

    const handleConnectionClick = (e: React.MouseEvent, fromId: string, toId: string) => {
        setSelectedConnection({ from: fromId, to: toId });
        setSelectedNodeIds([]);
    };

    const handleCanvasDoubleClick = (e: React.MouseEvent) => {
        quickCreateMenu.openQuickCreateMenu(
            { x: e.clientX, y: e.clientY },
            'create'
        );
    };

    // 黑板变量管理
    const handleBlackboardVariableAdd = (key: string, value: any) => {
        const newVariables = { ...blackboardVariables, [key]: value };
        setBlackboardVariables(newVariables);
    };

    const handleBlackboardVariableChange = (key: string, value: any) => {
        const newVariables = { ...blackboardVariables, [key]: value };
        setBlackboardVariables(newVariables);
    };

    const handleBlackboardVariableDelete = (key: string) => {
        const newVariables = { ...blackboardVariables };
        delete newVariables[key];
        setBlackboardVariables(newVariables);
    };

    const handleResetBlackboardVariable = (name: string) => {
        const initialValue = initialBlackboardVariables[name];
        if (initialValue !== undefined) {
            updateVariable(name, initialValue);
        }
    };

    const handleResetAllBlackboardVariables = () => {
        setBlackboardVariables(initialBlackboardVariables);
    };

    const handleBlackboardVariableRename = (oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        const newVariables = { ...blackboardVariables };
        newVariables[newKey] = newVariables[oldKey];
        delete newVariables[oldKey];
        setBlackboardVariables(newVariables);
    };

    // 节点拖拽
    const {
        handleNodeMouseDown,
        handleNodeMouseMove,
        handleNodeMouseUp
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

    // 端口连接
    const {
        handlePortMouseDown,
        handlePortMouseUp,
        handleNodeMouseUpForConnection
    } = usePortConnection({
        canvasRef,
        canvasOffset,
        canvasScale,
        nodes,
        connections,
        connectingFrom,
        connectingFromProperty,
        connectionOperations,
        setConnectingFrom,
        setConnectingFromProperty,
        clearConnecting,
        sortChildrenByPosition,
        showToast
    });

    // 键盘快捷键
    useKeyboardShortcuts({
        selectedNodeIds,
        selectedConnection,
        connections,
        nodeOperations,
        connectionOperations,
        setSelectedNodeIds,
        setSelectedConnection
    });

    // 拖放处理
    const {
        isDragging,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handleDragEnter
    } = useDropHandler({
        canvasRef,
        canvasOffset,
        canvasScale,
        nodeOperations,
        onNodeCreate
    });

    // 画布鼠标事件
    const {
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasMouseDown
    } = useCanvasMouseEvents({
        canvasRef,
        canvasOffset,
        canvasScale,
        connectingFrom,
        connectingFromProperty,
        connectingToPos,
        isBoxSelecting,
        boxSelectStart,
        boxSelectEnd,
        nodes,
        selectedNodeIds,
        quickCreateMenu: quickCreateMenu.quickCreateMenu,
        setConnectingToPos,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        setSelectedNodeIds,
        setSelectedConnection,
        setQuickCreateMenu: quickCreateMenu.setQuickCreateMenu,
        clearConnecting,
        clearBoxSelect,
        showToast
    });

    const handleCombinedMouseMove = (e: React.MouseEvent) => {
        handleCanvasMouseMove(e);
        handleNodeMouseMove(e);
    };

    const handleCombinedMouseUp = (e: React.MouseEvent) => {
        handleCanvasMouseUp(e);
        handleNodeMouseUp();
    };

    // 使用 useCallback 包装 getPortPosition，确保在 canvasScale/canvasOffset 变化时更新
    // Use useCallback to wrap getPortPosition to ensure updates when canvasScale/canvasOffset changes
    const getPortPosition = useCallback(
        (nodeId: string, propertyName?: string, portType: 'input' | 'output' = 'output') =>
            getPortPositionUtil(canvasRef, canvasOffset, canvasScale, nodes, nodeId, propertyName, portType, draggingNodeId, dragDelta, selectedNodeIds),
        [canvasOffset, canvasScale, nodes, draggingNodeId, dragDelta, selectedNodeIds]
    );

    stopExecutionRef.current = handleStop;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            flex: 1,
            backgroundColor: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {showToolbar && (
                <EditorToolbar
                    executionMode={executionMode}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onStop={handleStop}
                    onStep={handleStep}
                    onReset={handleStop}
                    onUndo={undo}
                    onRedo={redo}
                    onResetView={handleResetView}
                    onSave={onSave}
                    onOpen={onOpen}
                    onExport={onExport}
                    onCopyToClipboard={onCopyToClipboard}
                />
            )}

            {/* 主内容区：画布 + 黑板面板 */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* 画布区域 */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden'
                }}>

                    <BehaviorTreeCanvas
                        ref={canvasRef}
                        config={DEFAULT_EDITOR_CONFIG}
                        onClick={handleCanvasClick}
                        onContextMenu={handleCanvasContextMenu}
                        onDoubleClick={handleCanvasDoubleClick}
                        onMouseMove={handleCombinedMouseMove}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseUp={handleCombinedMouseUp}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
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
                        {connectingFrom && connectingToPos && (
                            <svg style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                overflow: 'visible',
                                zIndex: 150
                            }}>
                                {(() => {
                                    // 获取正在连接的端口类型
                                    const fromPortType = canvasRef.current?.getAttribute('data-connecting-from-port-type') || '';

                                    // 根据端口类型判断是从输入还是输出端口开始
                                    let portType: 'input' | 'output' = 'output';
                                    if (fromPortType === 'node-input' || fromPortType === 'property-input') {
                                        portType = 'input';
                                    }

                                    const fromPos = getPortPosition(
                                        connectingFrom,
                                        connectingFromProperty || undefined,
                                        portType
                                    );
                                    if (!fromPos) return null;

                                    const isPropertyConnection = !!connectingFromProperty;
                                    const x1 = fromPos.x;
                                    const y1 = fromPos.y;
                                    const x2 = connectingToPos.x;
                                    const y2 = connectingToPos.y;

                                    // 使用贝塞尔曲线渲染
                                    let pathD: string;
                                    if (isPropertyConnection) {
                                        // 属性连接使用水平贝塞尔曲线
                                        const controlX1 = x1 + (x2 - x1) * 0.5;
                                        const controlX2 = x1 + (x2 - x1) * 0.5;
                                        pathD = `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
                                    } else {
                                        // 节点连接使用垂直贝塞尔曲线
                                        const controlY = y1 + (y2 - y1) * 0.5;
                                        pathD = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
                                    }

                                    return (
                                        <path
                                            d={pathD}
                                            stroke={isPropertyConnection ? '#ab47bc' : '#00bcd4'}
                                            strokeWidth="2.5"
                                            fill="none"
                                            strokeDasharray={isPropertyConnection ? '5,5' : 'none'}
                                            strokeLinecap="round"
                                        />
                                    );
                                })()}
                            </svg>
                        )}

                        {/* 节点层 */}
                        {nodes.map((node: BehaviorTreeNode) => (
                            <BehaviorTreeNodeComponent
                                key={node.id}
                                node={node}
                                isSelected={selectedNodeIds.includes(node.id)}
                                isBeingDragged={draggingNodeId === node.id}
                                dragDelta={dragDelta}
                                uncommittedNodeIds={uncommittedNodeIds}
                                blackboardVariables={blackboardVariables}
                                initialBlackboardVariables={initialBlackboardVariables}
                                isExecuting={isExecuting}
                                executionStatus={nodeExecutionStatuses.get(node.id)}
                                executionOrder={nodeExecutionOrders.get(node.id)}
                                connections={connections}
                                nodes={nodes}
                                executorRef={executorRef}
                                iconMap={ICON_MAP}
                                draggingNodeId={draggingNodeId}
                                onNodeClick={handleNodeClick}
                                onContextMenu={handleNodeContextMenu}
                                onNodeMouseDown={handleNodeMouseDown}
                                onNodeMouseUpForConnection={handleNodeMouseUpForConnection}
                                onPortMouseDown={handlePortMouseDown}
                                onPortMouseUp={handlePortMouseUp}
                            />
                        ))}
                    </BehaviorTreeCanvas>

                    {/* 框选区域 - 在画布外层，这样才能显示在节点上方 */}
                    {isBoxSelecting && boxSelectStart && boxSelectEnd && canvasRef.current && (() => {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const minX = Math.min(boxSelectStart.x, boxSelectEnd.x);
                        const minY = Math.min(boxSelectStart.y, boxSelectEnd.y);
                        const maxX = Math.max(boxSelectStart.x, boxSelectEnd.x);
                        const maxY = Math.max(boxSelectStart.y, boxSelectEnd.y);

                        return (
                            <div style={{
                                position: 'fixed',
                                left: rect.left + minX * canvasScale + canvasOffset.x,
                                top: rect.top + minY * canvasScale + canvasOffset.y,
                                width: (maxX - minX) * canvasScale,
                                height: (maxY - minY) * canvasScale,
                                border: '1px dashed #4a90e2',
                                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                pointerEvents: 'none',
                                zIndex: 9999
                            }} />
                        );
                    })()}

                    {/* 右键菜单 */}
                    <NodeContextMenu
                        visible={contextMenu.contextMenu.visible}
                        position={contextMenu.contextMenu.position}
                        nodeId={contextMenu.contextMenu.nodeId}
                        isBlackboardVariable={contextMenu.contextMenu.nodeId ? nodes.find((n) => n.id === contextMenu.contextMenu.nodeId)?.data.nodeType === 'blackboard-variable' : false}
                        onReplaceNode={() => {
                            if (contextMenu.contextMenu.nodeId) {
                                quickCreateMenu.openQuickCreateMenu(
                                    contextMenu.contextMenu.position,
                                    'replace',
                                    contextMenu.contextMenu.nodeId
                                );
                            }
                            contextMenu.closeContextMenu();
                        }}
                        onDeleteNode={() => {
                            if (contextMenu.contextMenu.nodeId) {
                                nodeOperations.deleteNode(contextMenu.contextMenu.nodeId);
                            }
                            contextMenu.closeContextMenu();
                        }}
                        onCreateNode={() => {
                            quickCreateMenu.openQuickCreateMenu(
                                contextMenu.contextMenu.position,
                                'create'
                            );
                            contextMenu.closeContextMenu();
                        }}
                    />

                    {/* 快速创建菜单 */}
                    <QuickCreateMenu
                        visible={quickCreateMenu.quickCreateMenu.visible}
                        position={quickCreateMenu.quickCreateMenu.position}
                        searchText={quickCreateMenu.quickCreateMenu.searchText}
                        selectedIndex={quickCreateMenu.quickCreateMenu.selectedIndex}
                        mode={quickCreateMenu.quickCreateMenu.mode}
                        iconMap={ICON_MAP}
                        onSearchChange={(text) => quickCreateMenu.setQuickCreateMenu((prev) => ({ ...prev, searchText: text }))}
                        onIndexChange={(index) => quickCreateMenu.setQuickCreateMenu((prev) => ({ ...prev, selectedIndex: index }))}
                        onNodeSelect={(template) => {
                            if (quickCreateMenu.quickCreateMenu.mode === 'create') {
                                quickCreateMenu.handleQuickCreateNode(template);
                            } else {
                                quickCreateMenu.handleReplaceNode(template);
                            }
                        }}
                        onClose={() => quickCreateMenu.setQuickCreateMenu((prev) => ({ ...prev, visible: false }))}
                    />

                </div>

                {/* 黑板面板（侧边栏） */}
                <div style={{
                    width: blackboardCollapsed ? '48px' : '300px',
                    flexShrink: 0,
                    transition: 'width 0.2s ease'
                }}>
                    <BlackboardPanel
                        variables={blackboardVariables}
                        initialVariables={initialBlackboardVariables}
                        globalVariables={globalVariables}
                        onVariableAdd={handleBlackboardVariableAdd}
                        onVariableChange={handleBlackboardVariableChange}
                        onVariableDelete={handleBlackboardVariableDelete}
                        onVariableRename={handleBlackboardVariableRename}
                        onGlobalVariableChange={handleGlobalVariableChange}
                        onGlobalVariableAdd={handleGlobalVariableAdd}
                        onGlobalVariableDelete={handleGlobalVariableDelete}
                        isCollapsed={blackboardCollapsed}
                        onToggleCollapse={() => setBlackboardCollapsed(!blackboardCollapsed)}
                    />
                </div>
            </div>
        </div>
    );
};
