import React, { useMemo } from 'react';
import { Connection } from '../../domain/models/Connection';
import { PinCategory } from '../../domain/value-objects/PinType';
import { Position } from '../../domain/value-objects/Position';

export interface ConnectionLineProps {
    /** Connection data (连接数据) */
    connection: Connection;

    /** Start position (起点位置) */
    from: Position;

    /** End position (终点位置) */
    to: Position;

    /** Whether the connection is selected (连接是否被选中) */
    isSelected?: boolean;

    /** Whether to show flow animation for exec connections (是否显示执行连接的流动动画) */
    animated?: boolean;

    /** Click handler (点击处理) */
    onClick?: (connectionId: string, e: React.MouseEvent) => void;

    /** Context menu handler (右键菜单处理) */
    onContextMenu?: (connectionId: string, e: React.MouseEvent) => void;
}

/**
 * Calculates bezier curve control points for smooth connection
 * 计算平滑连接的贝塞尔曲线控制点
 */
function calculateBezierPath(from: Position, to: Position): string {
    const dx = to.x - from.x;

    // Calculate control point offset based on distance
    // 根据距离计算控制点偏移
    const curvature = Math.min(Math.abs(dx) * 0.5, 150);

    // Horizontal bezier curve (水平贝塞尔曲线)
    const cp1x = from.x + curvature;
    const cp1y = from.y;
    const cp2x = to.x - curvature;
    const cp2y = to.y;

    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

/**
 * ConnectionLine - SVG bezier curve connection between pins
 * ConnectionLine - 引脚之间的 SVG 贝塞尔曲线连接
 */
export const ConnectionLine: React.FC<ConnectionLineProps> = ({
    connection,
    from,
    to,
    isSelected = false,
    animated = false,
    onClick,
    onContextMenu
}) => {
    const pathD = useMemo(() => calculateBezierPath(from, to), [from, to]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(connection.id, e);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(connection.id, e);
    };

    const classNames = useMemo(() => {
        const classes = ['ne-connection', connection.category];
        if (isSelected) classes.push('selected');
        if (animated && connection.isExec) classes.push('animated');
        return classes.join(' ');
    }, [connection.category, connection.isExec, isSelected, animated]);

    return (
        <g>
            {/* Hit area for easier selection (更容易选择的点击区域) */}
            <path
                className="ne-connection-hit"
                d={pathD}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            />
            {/* Glow effect (发光效果) */}
            <path
                className={`ne-connection-glow ${connection.category}`}
                d={pathD}
            />
            {/* Main connection line (主连接线) */}
            <path
                className={classNames}
                d={pathD}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            />
        </g>
    );
};

export interface ConnectionPreviewProps {
    /** Start position (起点位置) */
    from: Position;

    /** End position (current mouse position) (终点位置，当前鼠标位置) */
    to: Position;

    /** Pin category for coloring (引脚类型用于着色) */
    category: PinCategory;

    /** Whether the target is valid (目标是否有效) */
    isValid?: boolean;
}

/**
 * ConnectionPreview - Preview line shown while dragging a connection
 * ConnectionPreview - 拖拽连接时显示的预览线
 */
export const ConnectionPreview: React.FC<ConnectionPreviewProps> = ({
    from,
    to,
    category,
    isValid
}) => {
    const pathD = useMemo(() => calculateBezierPath(from, to), [from, to]);

    const classNames = useMemo(() => {
        const classes = ['ne-connection-preview', category];
        if (isValid === true) classes.push('valid');
        if (isValid === false) classes.push('invalid');
        return classes.join(' ');
    }, [category, isValid]);

    return (
        <path
            className={classNames}
            d={pathD}
        />
    );
};

export interface ConnectionLayerProps {
    /** All connections to render (要渲染的所有连接) */
    connections: Connection[];

    /** Function to get pin position by ID (通过ID获取引脚位置的函数) */
    getPinPosition: (pinId: string) => Position | undefined;

    /** Currently selected connection IDs (当前选中的连接ID) */
    selectedConnectionIds?: Set<string>;

    /** Whether to animate exec connections (是否动画化执行连接) */
    animateExec?: boolean;

    /** Preview connection while dragging (拖拽时的预览连接) */
    preview?: {
        from: Position;
        to: Position;
        category: PinCategory;
        isValid?: boolean;
    };

    /** Connection click handler (连接点击处理) */
    onConnectionClick?: (connectionId: string, e: React.MouseEvent) => void;

    /** Connection context menu handler (连接右键菜单处理) */
    onConnectionContextMenu?: (connectionId: string, e: React.MouseEvent) => void;
}

/**
 * ConnectionLayer - SVG layer containing all connection lines
 * ConnectionLayer - 包含所有连接线的 SVG 层
 */
export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
    connections,
    getPinPosition,
    selectedConnectionIds,
    animateExec = false,
    preview,
    onConnectionClick,
    onConnectionContextMenu
}) => {
    return (
        <svg className="ne-connection-layer">
            {/* Render all connections (渲染所有连接) */}
            {connections.map(connection => {
                const from = getPinPosition(connection.fromPinId);
                const to = getPinPosition(connection.toPinId);

                if (!from || !to) return null;

                return (
                    <ConnectionLine
                        key={connection.id}
                        connection={connection}
                        from={from}
                        to={to}
                        isSelected={selectedConnectionIds?.has(connection.id)}
                        animated={animateExec}
                        onClick={onConnectionClick}
                        onContextMenu={onConnectionContextMenu}
                    />
                );
            })}

            {/* Render preview connection (渲染预览连接) */}
            {preview && (
                <ConnectionPreview
                    from={preview.from}
                    to={preview.to}
                    category={preview.category}
                    isValid={preview.isValid}
                />
            )}
        </svg>
    );
};

export default ConnectionLine;
