import React, { useCallback, useMemo } from 'react';
import { GraphNode } from '../../domain/models/GraphNode';
import { Pin } from '../../domain/models/Pin';
import { Connection } from '../../domain/models/Connection';
import { PinRow } from '../pins/NodePin';

/**
 * Node execution state for visual feedback
 * 节点执行状态用于视觉反馈
 */
export type NodeExecutionState = 'idle' | 'running' | 'success' | 'error';

export interface GraphNodeComponentProps {
    node: GraphNode;
    isSelected: boolean;
    isDragging: boolean;
    dragOffset?: { x: number; y: number };
    executionState?: NodeExecutionState;
    connections: Connection[];
    draggingFromPin?: Pin;
    renderIcon?: (iconName: string) => React.ReactNode;
    onSelect?: (nodeId: string, additive: boolean) => void;
    onDragStart?: (nodeId: string, e: React.MouseEvent) => void;
    onContextMenu?: (nodeId: string, e: React.MouseEvent) => void;
    onPinMouseDown?: (e: React.MouseEvent, pin: Pin) => void;
    onPinMouseUp?: (e: React.MouseEvent, pin: Pin) => void;
    onPinMouseEnter?: (pin: Pin) => void;
    onPinMouseLeave?: (pin: Pin) => void;
    onPinValueChange?: (nodeId: string, pinId: string, value: unknown) => void;
    onToggleCollapse?: (nodeId: string) => void;
}

/**
 * GraphNodeComponent - Visual representation of a graph node
 */
export const GraphNodeComponent: React.FC<GraphNodeComponentProps> = ({
    node,
    isSelected,
    isDragging,
    dragOffset,
    executionState = 'idle',
    connections,
    draggingFromPin,
    renderIcon,
    onSelect,
    onDragStart,
    onContextMenu,
    onPinMouseDown,
    onPinMouseUp,
    onPinMouseEnter,
    onPinMouseLeave,
    onPinValueChange,
    onToggleCollapse
}) => {
    const posX = node.position.x + (isDragging && dragOffset ? dragOffset.x : 0);
    const posY = node.position.y + (isDragging && dragOffset ? dragOffset.y : 0);

    const isPinConnected = useCallback((pinId: string): boolean => {
        return connections.some(c => c.fromPinId === pinId || c.toPinId === pinId);
    }, [connections]);

    const isPinCompatible = useCallback((pin: Pin): boolean => {
        if (!draggingFromPin) return false;
        return draggingFromPin.canConnectTo(pin);
    }, [draggingFromPin]);

    const classNames = useMemo(() => {
        const classes = ['ne-node'];
        if (isSelected) classes.push('selected');
        if (isDragging) classes.push('dragging');
        if (node.isCollapsed) classes.push('collapsed');
        if (node.category === 'comment') classes.push('comment');
        if (executionState !== 'idle') classes.push(executionState);
        return classes.join(' ');
    }, [isSelected, isDragging, node.isCollapsed, node.category, executionState]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const additive = e.ctrlKey || e.metaKey;
        onSelect?.(node.id, additive);
        onDragStart?.(node.id, e);
    }, [node.id, onSelect, onDragStart]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(node.id, e);
    }, [node.id, onContextMenu]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleCollapse?.(node.id);
    }, [node.id, onToggleCollapse]);

    const handlePinValueChange = useCallback((pinId: string, value: unknown) => {
        onPinValueChange?.(node.id, pinId, value);
    }, [node.id, onPinValueChange]);

    const headerStyle = node.headerColor
        ? { background: `linear-gradient(180deg, ${node.headerColor} 0%, ${adjustColor(node.headerColor, -30)} 100%)` }
        : undefined;

    // Separate exec pins from data pins
    const inputExecPins = node.inputPins.filter(p => p.isExec && !p.hidden);
    const inputDataPins = node.inputPins.filter(p => !p.isExec && !p.hidden);
    const outputExecPins = node.outputPins.filter(p => p.isExec && !p.hidden);
    const outputDataPins = node.outputPins.filter(p => !p.isExec && !p.hidden);

    // For event nodes, show first exec output in header
    const headerExecPin = node.category === 'event' && outputExecPins.length > 0 ? outputExecPins[0] : null;
    const remainingOutputExecPins = headerExecPin ? outputExecPins.slice(1) : outputExecPins;

    return (
        <div
            className={classNames}
            data-node-id={node.id}
            style={{
                left: posX,
                top: posY,
                zIndex: isDragging ? 100 : isSelected ? 10 : 1
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
        >
            {/* Header */}
            <div
                className={`ne-node-header ${node.category}`}
                style={headerStyle}
            >
                {/* Diamond icon for event nodes, or custom icon */}
                <span className="ne-node-header-icon">
                    {node.icon && renderIcon ? renderIcon(node.icon) : null}
                </span>

                <span className="ne-node-header-title">
                    {node.title}
                    {node.subtitle && (
                        <span className="ne-node-header-subtitle">
                            {node.subtitle}
                        </span>
                    )}
                </span>

                {/* Exec output pin in header for event nodes */}
                {headerExecPin && (
                    <div
                        className={`ne-node-header-exec ${isPinConnected(headerExecPin.id) ? 'connected' : ''}`}
                        data-pin-id={headerExecPin.id}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            onPinMouseDown?.(e, headerExecPin);
                        }}
                        onMouseUp={(e) => onPinMouseUp?.(e, headerExecPin)}
                        onMouseEnter={() => onPinMouseEnter?.(headerExecPin)}
                        onMouseLeave={() => onPinMouseLeave?.(headerExecPin)}
                        title="Execution Output"
                    />
                )}
            </div>

            {/* Body */}
            {!node.isCollapsed && (
                <div className="ne-node-body">
                    <div className="ne-node-content">
                        {/* Input exec pins */}
                        {inputExecPins.map(pin => (
                            <PinRow
                                key={pin.id}
                                pin={pin}
                                isConnected={isPinConnected(pin.id)}
                                isCompatible={isPinCompatible(pin)}
                                isDropTarget={draggingFromPin?.canConnectTo(pin)}
                                showLabel={true}
                                showValue={false}
                                onMouseDown={onPinMouseDown}
                                onMouseUp={onPinMouseUp}
                                onMouseEnter={onPinMouseEnter}
                                onMouseLeave={onPinMouseLeave}
                            />
                        ))}

                        {/* Input data pins */}
                        {inputDataPins.map(pin => (
                            <PinRow
                                key={pin.id}
                                pin={pin}
                                isConnected={isPinConnected(pin.id)}
                                isCompatible={isPinCompatible(pin)}
                                isDropTarget={draggingFromPin?.canConnectTo(pin)}
                                showLabel={true}
                                showValue={true}
                                value={node.data[pin.name]}
                                onMouseDown={onPinMouseDown}
                                onMouseUp={onPinMouseUp}
                                onMouseEnter={onPinMouseEnter}
                                onMouseLeave={onPinMouseLeave}
                                onValueChange={handlePinValueChange}
                            />
                        ))}

                        {/* Output data pins */}
                        {outputDataPins.map(pin => (
                            <PinRow
                                key={pin.id}
                                pin={pin}
                                isConnected={isPinConnected(pin.id)}
                                isCompatible={isPinCompatible(pin)}
                                isDraggingFrom={draggingFromPin?.id === pin.id}
                                showLabel={true}
                                showValue={false}
                                onMouseDown={onPinMouseDown}
                                onMouseUp={onPinMouseUp}
                                onMouseEnter={onPinMouseEnter}
                                onMouseLeave={onPinMouseLeave}
                            />
                        ))}

                        {/* Remaining exec output pins */}
                        {remainingOutputExecPins.map(pin => (
                            <PinRow
                                key={pin.id}
                                pin={pin}
                                isConnected={isPinConnected(pin.id)}
                                isCompatible={isPinCompatible(pin)}
                                isDraggingFrom={draggingFromPin?.id === pin.id}
                                showLabel={true}
                                showValue={false}
                                onMouseDown={onPinMouseDown}
                                onMouseUp={onPinMouseUp}
                                onMouseEnter={onPinMouseEnter}
                                onMouseLeave={onPinMouseLeave}
                            />
                        ))}
                    </div>

                    {node.comment && (
                        <div className="ne-node-comment">
                            {node.comment}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export const MemoizedGraphNodeComponent = React.memo(GraphNodeComponent, (prev, next) => {
    if (prev.node.id !== next.node.id) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.isDragging !== next.isDragging) return false;
    if (prev.executionState !== next.executionState) return false;
    if (prev.node.isCollapsed !== next.node.isCollapsed) return false;
    if (!prev.node.position.equals(next.node.position)) return false;
    if (next.isDragging) {
        if (prev.dragOffset?.x !== next.dragOffset?.x ||
            prev.dragOffset?.y !== next.dragOffset?.y) {
            return false;
        }
    }
    if (prev.draggingFromPin !== next.draggingFromPin) return false;
    if (JSON.stringify(prev.node.data) !== JSON.stringify(next.node.data)) return false;
    return true;
});

export default GraphNodeComponent;
