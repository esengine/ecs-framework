import React, { useEffect, useMemo } from 'react';
import { NodeTemplate } from '@esengine/behavior-tree';
import { RotateCcw } from 'lucide-react';
import { useBehaviorTreeStore, BehaviorTreeNode, ROOT_NODE_ID } from '../stores/behaviorTreeStore';
import { useUIStore } from '../application/state/UIStore';
import { useToast } from './Toast';
import { BlackboardValue } from '../domain/models/Blackboard';
import { BehaviorTreeCanvas } from '../presentation/components/behavior-tree/canvas/BehaviorTreeCanvas';
import { ConnectionLayer } from '../presentation/components/behavior-tree/connections/ConnectionLayer';
import { NodeFactory } from '../infrastructure/factories/NodeFactory';
import { BehaviorTreeValidator } from '../infrastructure/validation/BehaviorTreeValidator';
import { useNodeOperations } from '../presentation/hooks/useNodeOperations';
import { useConnectionOperations } from '../presentation/hooks/useConnectionOperations';
import { useCommandHistory } from '../presentation/hooks/useCommandHistory';
import { useNodeDrag } from '../presentation/hooks/useNodeDrag';
import { usePortConnection } from '../presentation/hooks/usePortConnection';
import { useKeyboardShortcuts } from '../presentation/hooks/useKeyboardShortcuts';
import { useDropHandler } from '../presentation/hooks/useDropHandler';
import { useCanvasMouseEvents } from '../presentation/hooks/useCanvasMouseEvents';
import { useContextMenu } from '../application/hooks/useContextMenu';
import { useQuickCreateMenu } from '../application/hooks/useQuickCreateMenu';
import { EditorToolbar } from '../presentation/components/toolbar/EditorToolbar';
import { QuickCreateMenu } from '../presentation/components/menu/QuickCreateMenu';
import { NodeContextMenu } from '../presentation/components/menu/NodeContextMenu';
import { BehaviorTreeNode as BehaviorTreeNodeComponent } from '../presentation/components/behavior-tree/nodes/BehaviorTreeNode';
import { getPortPosition as getPortPositionUtil } from '../presentation/utils/portUtils';
import { useExecutionController } from '../presentation/hooks/useExecutionController';
import { useNodeTracking } from '../presentation/hooks/useNodeTracking';
import { useEditorState } from '../presentation/hooks/useEditorState';
import { useEditorHandlers } from '../presentation/hooks/useEditorHandlers';
import { ICON_MAP, ROOT_NODE_TEMPLATE, DEFAULT_EDITOR_CONFIG } from '../presentation/config/editorConstants';
import '../styles/BehaviorTreeNode.css';

type BlackboardVariables = Record<string, BlackboardValue>;

interface BehaviorTreeEditorProps {
    onNodeSelect?: (node: BehaviorTreeNode) => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    blackboardVariables?: BlackboardVariables;
    projectPath?: string | null;
    showToolbar?: boolean;
}

export const BehaviorTreeEditor: React.FC<BehaviorTreeEditorProps> = ({
    onNodeSelect,
    onNodeCreate,
    blackboardVariables = {},
    projectPath = null,
    showToolbar = true
}) => {
    const { showToast } = useToast();

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
        isExecuting,
        saveNodesDataSnapshot,
        restoreNodesData,
        nodeExecutionStatuses,
        nodeExecutionOrders
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
    const { contextMenu, setContextMenu, handleNodeContextMenu, handleCanvasContextMenu, closeContextMenu } = useContextMenu();

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

    const {
        canvasRef,
        stopExecutionRef,
        executorRef,
        selectedConnection,
        setSelectedConnection
    } = useEditorState();

    const {
        executionMode,
        executionLogs,
        executionSpeed,
        tickCount,
        handlePlay,
        handlePause,
        handleStop,
        handleStep,
        handleReset,
        handleSpeedChange,
        setExecutionLogs,
        controller
    } = useExecutionController({
        rootNodeId: ROOT_NODE_ID,
        projectPath,
        blackboardVariables,
        nodes,
        connections,
        initialBlackboardVariables,
        onBlackboardUpdate: setBlackboardVariables,
        onInitialBlackboardSave: setInitialBlackboardVariables,
        onExecutingChange: setIsExecuting,
        onSaveNodesDataSnapshot: saveNodesDataSnapshot,
        onRestoreNodesData: restoreNodesData
    });

    executorRef.current = controller['executor'] || null;

    const { uncommittedNodeIds } = useNodeTracking({
        nodes,
        executionMode
    });

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
        connectingToPos,
        isBoxSelecting,
        boxSelectStart,
        boxSelectEnd,
        nodes,
        selectedNodeIds,
        quickCreateMenu,
        setConnectingToPos,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        setSelectedNodeIds,
        setSelectedConnection,
        setQuickCreateMenu,
        clearConnecting,
        clearBoxSelect,
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
        setNodes,
        setConnections,
        resetView,
        triggerForceUpdate,
        onNodeSelect,
        rootNodeId: ROOT_NODE_ID,
        rootNodeTemplate: ROOT_NODE_TEMPLATE
    });

    const getPortPosition = (nodeId: string, propertyName?: string, portType: 'input' | 'output' = 'output') =>
        getPortPositionUtil(canvasRef, canvasOffset, canvasScale, nodes, nodeId, propertyName, portType);

    stopExecutionRef.current = handleStop;


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
                    config={DEFAULT_EDITOR_CONFIG}
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
                    onContextMenu={handleCanvasContextMenu}
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
                        const executionStatus = nodeExecutionStatuses.get(node.id);
                        const executionOrder = nodeExecutionOrders.get(node.id);

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
                                executionStatus={executionStatus}
                                executionOrder={executionOrder}
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
                {showToolbar && (
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
                )}

                {/* 快速创建菜单 */}
                <QuickCreateMenu
                    visible={quickCreateMenu.visible}
                    position={quickCreateMenu.position}
                    searchText={quickCreateMenu.searchText}
                    selectedIndex={quickCreateMenu.selectedIndex}
                    mode={quickCreateMenu.mode}
                    iconMap={ICON_MAP}
                    onSearchChange={(text) => setQuickCreateMenu(prev => ({
                        ...prev,
                        searchText: text
                    }))}
                    onIndexChange={(index) => setQuickCreateMenu(prev => ({
                        ...prev,
                        selectedIndex: index
                    }))}
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
                onDeleteNode={() => {
                    if (contextMenu.nodeId) {
                        nodeOperations.deleteNode(contextMenu.nodeId);
                        setContextMenu({ ...contextMenu, visible: false });
                    }
                }}
                onCreateNode={() => {
                    setQuickCreateMenu({
                        visible: true,
                        position: contextMenu.position,
                        searchText: '',
                        selectedIndex: 0,
                        mode: 'create',
                        replaceNodeId: null
                    });
                    setContextMenu({ ...contextMenu, visible: false });
                }}
            />
        </div>
    );
};
