import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NodeTemplate } from '@esengine/behavior-tree';
import { RotateCcw } from 'lucide-react';
import { useBehaviorTreeDataStore, BehaviorTreeNode, ROOT_NODE_ID } from '../stores';
import { useUIStore } from '../stores';
import { showToast as notificationShowToast } from '../services/NotificationService';
import { BlackboardValue } from '../domain/models/Blackboard';
import { BehaviorTreeCanvas } from './canvas/BehaviorTreeCanvas';
import { ConnectionLayer } from './connections/ConnectionLayer';
import { NodeFactory } from '../factories/NodeFactory';
import { BehaviorTreeValidator } from '../validation/BehaviorTreeValidator';
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
import { getPortPosition as getPortPositionUtil } from '../utils/portUtils';
import { useExecutionController } from '../hooks/useExecutionController';
import { useNodeTracking } from '../hooks/useNodeTracking';
import { useEditorHandlers } from '../hooks/useEditorHandlers';
import { ICON_MAP, ROOT_NODE_TEMPLATE, DEFAULT_EDITOR_CONFIG } from '../config/editorConstants';
import '../styles/BehaviorTreeNode.css';

type BlackboardVariables = Record<string, BlackboardValue>;

interface BehaviorTreeEditorProps {
    onNodeSelect?: (node: BehaviorTreeNode) => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    blackboardVariables?: BlackboardVariables;
    projectPath?: string | null;
    showToolbar?: boolean;
    showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const BehaviorTreeEditor: React.FC<BehaviorTreeEditorProps> = ({
    onNodeSelect,
    onNodeCreate,
    blackboardVariables = {},
    projectPath = null,
    showToolbar = true,
    showToast: showToastProp
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
    const nodes = useBehaviorTreeDataStore(state => state.cachedNodes);
    const connections = useBehaviorTreeDataStore(state => state.cachedConnections);

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

    // Node factory
    const nodeFactory = useMemo(() => new NodeFactory(), []);

    // 验证器
    const validator = useMemo(() => new BehaviorTreeValidator(), []);

    // 命令历史
    const { commandManager, canUndo, canRedo, undo, redo } = useCommandHistory();

    // 节点操作
    const nodeOperations = useNodeOperations(
        nodeFactory,
        validator,
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
        handleSpeedChange
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
        onRestoreNodesData: restoreNodesData
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
        if (!isDraggingNode) {
            setSelectedNodeIds([]);
            setSelectedConnection(null);
        }
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

    const getPortPosition = (nodeId: string, propertyName?: string, portType: 'input' | 'output' = 'output') =>
        getPortPositionUtil(canvasRef, canvasOffset, canvasScale, nodes, nodeId, propertyName, portType, draggingNodeId, dragDelta, selectedNodeIds);

    stopExecutionRef.current = handleStop;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            flex: 1,
            backgroundColor: '#1e1e1e',
            position: 'relative'
        }}>
            {showToolbar && (
                <EditorToolbar
                    executionMode={executionMode}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onStop={handleStop}
                    onStep={handleStep}
                    onReset={handleStop}
                    onUndo={undo}
                    onRedo={redo}
                    onResetView={handleResetView}
                    onClearCanvas={handleClearCanvas}
                />
            )}

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
                        overflow: 'visible'
                    }}>
                        {(() => {
                            const fromPos = getPortPosition(
                                connectingFrom,
                                connectingFromProperty || undefined,
                                connectingFromProperty ? 'output' : 'output'
                            );
                            if (!fromPos) return null;

                            const isPropertyConnection = !!connectingFromProperty;
                            return (
                                <path
                                    d={`M ${fromPos.x} ${fromPos.y} L ${connectingToPos.x} ${connectingToPos.y}`}
                                    stroke={isPropertyConnection ? '#FFD700' : '#4a90e2'}
                                    strokeWidth="2"
                                    fill="none"
                                    strokeDasharray={isPropertyConnection ? '5,5' : 'none'}
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

                {/* 框选区域 */}
                {isBoxSelecting && boxSelectStart && boxSelectEnd && (
                    <div style={{
                        position: 'absolute',
                        left: Math.min(boxSelectStart.x, boxSelectEnd.x),
                        top: Math.min(boxSelectStart.y, boxSelectEnd.y),
                        width: Math.abs(boxSelectEnd.x - boxSelectStart.x),
                        height: Math.abs(boxSelectEnd.y - boxSelectStart.y),
                        border: '1px dashed #4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        pointerEvents: 'none'
                    }} />
                )}
            </BehaviorTreeCanvas>

            {/* 右键菜单 */}
            <NodeContextMenu
                visible={contextMenu.contextMenu.visible}
                position={contextMenu.contextMenu.position}
                nodeId={contextMenu.contextMenu.nodeId}
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
                onSearchChange={(text) => quickCreateMenu.setQuickCreateMenu(prev => ({ ...prev, searchText: text }))}
                onIndexChange={(index) => quickCreateMenu.setQuickCreateMenu(prev => ({ ...prev, selectedIndex: index }))}
                onNodeSelect={(template) => {
                    if (quickCreateMenu.quickCreateMenu.mode === 'create') {
                        quickCreateMenu.handleQuickCreateNode(template);
                    } else {
                        quickCreateMenu.handleReplaceNode(template);
                    }
                }}
                onClose={() => quickCreateMenu.setQuickCreateMenu(prev => ({ ...prev, visible: false }))}
            />
        </div>
    );
};