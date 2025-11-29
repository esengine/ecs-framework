import React, { useRef, useCallback, useState, useMemo } from 'react';
import { Graph } from '../../domain/models/Graph';
import { GraphNode, NodeTemplate } from '../../domain/models/GraphNode';
import { Connection } from '../../domain/models/Connection';
import { Pin } from '../../domain/models/Pin';
import { Position } from '../../domain/value-objects/Position';
import { GraphCanvas } from '../canvas/GraphCanvas';
import { MemoizedGraphNodeComponent, NodeExecutionState } from '../nodes/GraphNodeComponent';
import { ConnectionLayer } from '../connections/ConnectionLine';

/**
 * Node execution states map
 * 节点执行状态映射
 */
export type NodeExecutionStates = Map<string, NodeExecutionState>;

export interface NodeEditorProps {
    /** Graph data (图数据) */
    graph: Graph;

    /** Available node templates (可用的节点模板) */
    templates?: NodeTemplate[];

    /** Currently selected node IDs (当前选中的节点ID) */
    selectedNodeIds?: Set<string>;

    /** Currently selected connection IDs (当前选中的连接ID) */
    selectedConnectionIds?: Set<string>;

    /** Node execution states for visual feedback (节点执行状态用于视觉反馈) */
    executionStates?: NodeExecutionStates;

    /** Whether to animate exec connections (是否动画化执行连接) */
    animateExecConnections?: boolean;

    /** Read-only mode (只读模式) */
    readOnly?: boolean;

    /** Icon renderer (图标渲染器) */
    renderIcon?: (iconName: string) => React.ReactNode;

    /** Graph change callback (图变化回调) */
    onGraphChange?: (graph: Graph) => void;

    /** Selection change callback (选择变化回调) */
    onSelectionChange?: (nodeIds: Set<string>, connectionIds: Set<string>) => void;

    /** Node double click callback (节点双击回调) */
    onNodeDoubleClick?: (node: GraphNode) => void;

    /** Canvas context menu callback (画布右键菜单回调) */
    onCanvasContextMenu?: (position: Position, e: React.MouseEvent) => void;

    /** Node context menu callback (节点右键菜单回调) */
    onNodeContextMenu?: (node: GraphNode, e: React.MouseEvent) => void;

    /** Connection context menu callback (连接右键菜单回调) */
    onConnectionContextMenu?: (connection: Connection, e: React.MouseEvent) => void;
}

/**
 * Dragging state for node movement
 * 节点移动的拖拽状态
 */
interface DragState {
    nodeIds: string[];
    startPositions: Map<string, Position>;
    startMouse: Position;
}

/**
 * Connection dragging state
 * 连接拖拽状态
 */
interface ConnectionDragState {
    fromPin: Pin;
    fromPosition: Position;
    currentPosition: Position;
    targetPin?: Pin;
    isValid?: boolean;
}

/**
 * NodeEditor - Complete node graph editor component
 * NodeEditor - 完整的节点图编辑器组件
 */
export const NodeEditor: React.FC<NodeEditorProps> = ({
    graph,
    // templates is reserved for future node palette feature
    // templates 保留用于未来的节点面板功能
    templates: _templates = [],
    selectedNodeIds = new Set(),
    selectedConnectionIds = new Set(),
    executionStates,
    animateExecConnections = false,
    readOnly = false,
    renderIcon,
    onGraphChange,
    onSelectionChange,
    // onNodeDoubleClick is reserved for future double-click handling
    // onNodeDoubleClick 保留用于未来的双击处理
    onNodeDoubleClick: _onNodeDoubleClick,
    onCanvasContextMenu,
    onNodeContextMenu,
    onConnectionContextMenu
}) => {
    // Silence unused variable warnings (消除未使用变量警告)
    void _templates;
    void _onNodeDoubleClick;
    const containerRef = useRef<HTMLDivElement>(null);

    // Canvas transform state - use ref to always have latest values
    // 画布变换状态 - 使用 ref 保证总是能获取最新值
    const transformRef = useRef({ pan: Position.ZERO, zoom: 1 });

    // Callbacks for GraphCanvas to sync transform state
    const handlePanChange = useCallback((newPan: Position) => {
        transformRef.current.pan = newPan;
    }, []);

    const handleZoomChange = useCallback((newZoom: number) => {
        transformRef.current.zoom = newZoom;
    }, []);

    // Local state for dragging (拖拽的本地状态)
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
    const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);

    /**
     * Converts screen coordinates to canvas coordinates
     * 将屏幕坐标转换为画布坐标
     * 使用 ref 中的最新值，避免闭包捕获旧状态
     */
    const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
        if (!containerRef.current) return new Position(screenX, screenY);
        const rect = containerRef.current.getBoundingClientRect();
        const { pan, zoom } = transformRef.current;
        const x = (screenX - rect.left - pan.x) / zoom;
        const y = (screenY - rect.top - pan.y) / zoom;
        return new Position(x, y);
    }, []);

    /**
     * Gets pin position in canvas coordinates
     * 获取引脚在画布坐标系中的位置
     *
     * 直接从节点位置和引脚在节点内的相对位置计算，不依赖 DOM 测量
     */
    const getPinPosition = useCallback((pinId: string): Position | undefined => {
        // Find the pin element and its parent node
        const pinElement = containerRef.current?.querySelector(`[data-pin-id="${pinId}"]`) as HTMLElement;
        if (!pinElement) return undefined;

        const nodeElement = pinElement.closest('[data-node-id]') as HTMLElement;
        if (!nodeElement) return undefined;

        const nodeId = nodeElement.getAttribute('data-node-id');
        if (!nodeId) return undefined;

        const node = graph.getNode(nodeId);
        if (!node) return undefined;

        // Get pin position relative to node element (in unscaled pixels)
        const nodeRect = nodeElement.getBoundingClientRect();
        const pinRect = pinElement.getBoundingClientRect();

        // Calculate relative position within the node (accounting for zoom)
        const { zoom } = transformRef.current;
        const relativeX = (pinRect.left + pinRect.width / 2 - nodeRect.left) / zoom;
        const relativeY = (pinRect.top + pinRect.height / 2 - nodeRect.top) / zoom;

        // Final position = node position + relative position
        return new Position(
            node.position.x + relativeX,
            node.position.y + relativeY
        );
    }, [graph]);

    /**
     * Handles node selection
     * 处理节点选择
     */
    const handleNodeSelect = useCallback((nodeId: string, additive: boolean) => {
        if (readOnly) return;

        const newSelection = new Set(selectedNodeIds);

        if (additive) {
            if (newSelection.has(nodeId)) {
                newSelection.delete(nodeId);
            } else {
                newSelection.add(nodeId);
            }
        } else {
            newSelection.clear();
            newSelection.add(nodeId);
        }

        onSelectionChange?.(newSelection, new Set());
    }, [selectedNodeIds, readOnly, onSelectionChange]);

    /**
     * Handles node drag start
     * 处理节点拖拽开始
     */
    const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
        if (readOnly) return;

        // Get all nodes to drag (selected or just this one)
        // 获取要拖拽的所有节点（选中的或仅此节点）
        const nodesToDrag = selectedNodeIds.has(nodeId)
            ? Array.from(selectedNodeIds)
            : [nodeId];

        // Store starting positions (存储起始位置)
        const startPositions = new Map<string, Position>();
        nodesToDrag.forEach(id => {
            const node = graph.getNode(id);
            if (node) {
                startPositions.set(id, node.position);
            }
        });

        const mousePos = screenToCanvas(e.clientX, e.clientY);

        setDragState({
            nodeIds: nodesToDrag,
            startPositions,
            startMouse: mousePos
        });
    }, [graph, selectedNodeIds, readOnly, screenToCanvas]);

    /**
     * Handles mouse move for dragging
     * 处理拖拽的鼠标移动
     */
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const mousePos = screenToCanvas(e.clientX, e.clientY);

        // Node dragging (节点拖拽)
        if (dragState) {
            const dx = mousePos.x - dragState.startMouse.x;
            const dy = mousePos.y - dragState.startMouse.y;

            let newGraph = graph;
            dragState.nodeIds.forEach(nodeId => {
                const startPos = dragState.startPositions.get(nodeId);
                if (startPos) {
                    const newPos = new Position(startPos.x + dx, startPos.y + dy);
                    newGraph = newGraph.moveNode(nodeId, newPos);
                }
            });

            onGraphChange?.(newGraph);
        }

        // Connection dragging (连接拖拽)
        if (connectionDrag) {
            const isValid = hoveredPin ? connectionDrag.fromPin.canConnectTo(hoveredPin) : undefined;

            setConnectionDrag(prev => prev ? {
                ...prev,
                currentPosition: mousePos,
                targetPin: hoveredPin ?? undefined,
                isValid
            } : null);
        }
    }, [graph, dragState, connectionDrag, hoveredPin, screenToCanvas, onGraphChange]);

    /**
     * Handles mouse up to end dragging
     * 处理鼠标释放结束拖拽
     */
    const handleMouseUp = useCallback(() => {
        // End node dragging (结束节点拖拽)
        if (dragState) {
            setDragState(null);
        }

        // End connection dragging (结束连接拖拽)
        if (connectionDrag) {
            // Use hoveredPin directly instead of relying on async state update
            const targetPin = hoveredPin;

            if (targetPin && connectionDrag.fromPin.canConnectTo(targetPin)) {
                // Create connection (创建连接)
                const fromPin = connectionDrag.fromPin;
                const toPin = targetPin;

                // Determine direction (确定方向)
                const [outputPin, inputPin] = fromPin.isOutput
                    ? [fromPin, toPin]
                    : [toPin, fromPin];

                const connection = new Connection(
                    Connection.createId(outputPin.id, inputPin.id),
                    outputPin.nodeId,
                    outputPin.id,
                    inputPin.nodeId,
                    inputPin.id,
                    outputPin.category
                );

                try {
                    const newGraph = graph.addConnection(connection);
                    onGraphChange?.(newGraph);
                } catch (error) {
                    console.error('Failed to create connection:', error);
                }
            }

            setConnectionDrag(null);
        }
    }, [graph, dragState, connectionDrag, hoveredPin, onGraphChange]);

    /**
     * Handles pin mouse down
     * 处理引脚鼠标按下
     */
    const handlePinMouseDown = useCallback((e: React.MouseEvent, pin: Pin) => {
        if (readOnly) return;
        e.stopPropagation();

        const position = getPinPosition(pin.id);
        if (position) {
            setConnectionDrag({
                fromPin: pin,
                fromPosition: position,
                currentPosition: position
            });
        }
    }, [readOnly, getPinPosition]);

    /**
     * Handles pin mouse up
     * 处理引脚鼠标释放
     */
    const handlePinMouseUp = useCallback((_e: React.MouseEvent, pin: Pin) => {
        if (connectionDrag && connectionDrag.fromPin.canConnectTo(pin)) {
            const fromPin = connectionDrag.fromPin;
            const toPin = pin;

            const [outputPin, inputPin] = fromPin.isOutput
                ? [fromPin, toPin]
                : [toPin, fromPin];

            const connection = new Connection(
                Connection.createId(outputPin.id, inputPin.id),
                outputPin.nodeId,
                outputPin.id,
                inputPin.nodeId,
                inputPin.id,
                outputPin.category
            );

            try {
                const newGraph = graph.addConnection(connection);
                onGraphChange?.(newGraph);
            } catch (error) {
                console.error('Failed to create connection:', error);
            }

            setConnectionDrag(null);
        }
    }, [connectionDrag, graph, onGraphChange]);

    /**
     * Handles pin hover
     * 处理引脚悬停
     */
    const handlePinMouseEnter = useCallback((pin: Pin) => {
        setHoveredPin(pin);
    }, []);

    const handlePinMouseLeave = useCallback(() => {
        setHoveredPin(null);
    }, []);

    /**
     * Handles node context menu
     * 处理节点右键菜单
     */
    const handleNodeContextMenu = useCallback((nodeId: string, e: React.MouseEvent) => {
        const node = graph.getNode(nodeId);
        if (node) {
            onNodeContextMenu?.(node, e);
        }
    }, [graph, onNodeContextMenu]);

    /**
     * Handles connection click
     * 处理连接点击
     */
    const handleConnectionClick = useCallback((connectionId: string, e: React.MouseEvent) => {
        if (readOnly) return;

        const newSelection = new Set<string>();
        if (e.ctrlKey || e.metaKey) {
            if (selectedConnectionIds.has(connectionId)) {
                selectedConnectionIds.forEach(id => {
                    if (id !== connectionId) newSelection.add(id);
                });
            } else {
                selectedConnectionIds.forEach(id => newSelection.add(id));
                newSelection.add(connectionId);
            }
        } else {
            newSelection.add(connectionId);
        }

        onSelectionChange?.(new Set(), newSelection);
    }, [selectedConnectionIds, readOnly, onSelectionChange]);

    /**
     * Handles connection context menu
     * 处理连接右键菜单
     */
    const handleConnectionContextMenu = useCallback((connectionId: string, e: React.MouseEvent) => {
        const connection = graph.connections.find(c => c.id === connectionId);
        if (connection) {
            onConnectionContextMenu?.(connection, e);
        }
    }, [graph, onConnectionContextMenu]);

    /**
     * Handles canvas click to deselect
     * 处理画布点击取消选择
     */
    const handleCanvasClick = useCallback((_position: Position, _e: React.MouseEvent) => {
        if (!readOnly) {
            onSelectionChange?.(new Set(), new Set());
        }
    }, [readOnly, onSelectionChange]);

    /**
     * Handles canvas context menu
     * 处理画布右键菜单
     */
    const handleCanvasContextMenu = useCallback((position: Position, e: React.MouseEvent) => {
        onCanvasContextMenu?.(position, e);
    }, [onCanvasContextMenu]);

    /**
     * Handles pin value change
     * 处理引脚值变化
     */
    const handlePinValueChange = useCallback((nodeId: string, pinId: string, value: unknown) => {
        if (readOnly) return;

        const node = graph.getNode(nodeId);
        if (node) {
            // Find pin name from pin id
            // 从引脚ID查找引脚名称
            const pin = node.getPin(pinId);
            if (pin) {
                const newData = { ...node.data, [pin.name]: value };
                const newGraph = graph.updateNode(nodeId, n => n.updateData(newData));
                onGraphChange?.(newGraph);
            }
        }
    }, [graph, readOnly, onGraphChange]);

    /**
     * Handles node collapse toggle
     * 处理节点折叠切换
     */
    const handleToggleCollapse = useCallback((nodeId: string) => {
        const newGraph = graph.updateNode(nodeId, n => n.toggleCollapse());
        onGraphChange?.(newGraph);
    }, [graph, onGraphChange]);

    // Build connection preview for drag state
    // 为拖拽状态构建连接预览
    const connectionPreview = useMemo(() => {
        if (!connectionDrag) return undefined;

        return {
            from: connectionDrag.fromPosition,
            to: connectionDrag.currentPosition,
            category: connectionDrag.fromPin.category,
            isValid: connectionDrag.isValid
        };
    }, [connectionDrag]);

    return (
        <div
            ref={containerRef}
            className="ne-editor"
            style={{ width: '100%', height: '100%' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <GraphCanvas
                onClick={handleCanvasClick}
                onContextMenu={handleCanvasContextMenu}
                onPanChange={handlePanChange}
                onZoomChange={handleZoomChange}
            >
                {/* Connection layer (连接层) */}
                <ConnectionLayer
                    connections={graph.connections}
                    getPinPosition={getPinPosition}
                    selectedConnectionIds={selectedConnectionIds}
                    animateExec={animateExecConnections}
                    preview={connectionPreview}
                    onConnectionClick={handleConnectionClick}
                    onConnectionContextMenu={handleConnectionContextMenu}
                />

                {/* Nodes (节点) */}
                {graph.nodes.map(node => (
                    <MemoizedGraphNodeComponent
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeIds.has(node.id)}
                        isDragging={dragState?.nodeIds.includes(node.id) ?? false}
                        executionState={executionStates?.get(node.id)}
                        connections={graph.connections}
                        draggingFromPin={connectionDrag?.fromPin}
                        renderIcon={renderIcon}
                        onSelect={handleNodeSelect}
                        onDragStart={handleNodeDragStart}
                        onContextMenu={handleNodeContextMenu}
                        onPinMouseDown={handlePinMouseDown}
                        onPinMouseUp={handlePinMouseUp}
                        onPinMouseEnter={handlePinMouseEnter}
                        onPinMouseLeave={handlePinMouseLeave}
                        onPinValueChange={handlePinValueChange}
                        onToggleCollapse={handleToggleCollapse}
                    />
                ))}
            </GraphCanvas>
        </div>
    );
};

export default NodeEditor;
