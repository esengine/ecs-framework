import React, { useMemo } from 'react';
import { ConnectionViewData } from '../../types';
import { Node } from '../../domain/models/Node';

/**
 * 连线渲染器属性
 */
interface ConnectionRendererProps {
    /**
     * 连接视图数据
     */
    connectionData: ConnectionViewData;

    /**
     * 源节点
     */
    fromNode: Node;

    /**
     * 目标节点
     */
    toNode: Node;

    /**
     * 获取端口位置的函数
     */
    getPortPosition: (nodeId: string, propertyName?: string, portType?: 'input' | 'output') => { x: number; y: number } | null;

    /**
     * 连线点击事件
     */
    onClick?: (e: React.MouseEvent, fromId: string, toId: string) => void;

    /**
     * 连线右键事件
     */
    onContextMenu?: (e: React.MouseEvent, fromId: string, toId: string) => void;
}

/**
 * 连线渲染器
 * 使用贝塞尔曲线渲染节点间的连接
 */
export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
    connectionData,
    fromNode,
    toNode,
    getPortPosition,
    onClick,
    onContextMenu
}) => {
    const { connection, isSelected } = connectionData;

    const pathData = useMemo(() => {
        let fromPos, toPos;

        if (connection.connectionType === 'property') {
            // 属性连接：从DOM获取实际引脚位置
            fromPos = getPortPosition(connection.from);
            toPos = getPortPosition(connection.to, connection.toProperty);
        } else {
            // 节点连接：使用DOM获取端口位置
            fromPos = getPortPosition(connection.from, undefined, 'output');
            toPos = getPortPosition(connection.to, undefined, 'input');
        }

        if (!fromPos || !toPos) {
            // 如果DOM还没渲染，返回null
            return null;
        }

        const x1 = fromPos.x;
        const y1 = fromPos.y;
        const x2 = toPos.x;
        const y2 = toPos.y;

        let pathD: string;

        if (connection.connectionType === 'property') {
            // 属性连接使用水平贝塞尔曲线
            const controlX1 = x1 + (x2 - x1) * 0.5;
            const controlX2 = x1 + (x2 - x1) * 0.5;
            pathD = `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
        } else {
            // 节点连接使用垂直贝塞尔曲线
            const controlY = y1 + (y2 - y1) * 0.5;
            pathD = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
        }

        return {
            path: pathD,
            midX: (x1 + x2) / 2,
            midY: (y1 + y2) / 2
        };
    }, [connection, fromNode, toNode, getPortPosition]);

    const color = connection.connectionType === 'property' ? '#9c27b0' : '#0e639c';
    const strokeColor = isSelected ? '#FFD700' : color;
    const strokeWidth = isSelected ? 4 : 2;
    const markerId = `arrowhead-${connection.from}-${connection.to}`;

    if (!pathData) {
        // DOM还没渲染完成，跳过此连接
        return null;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(e, connection.from, connection.to);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        onContextMenu?.(e, connection.from, connection.to);
    };

    return (
        <g
            className="connection"
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            style={{ cursor: 'pointer' }}
            data-connection-from={connection.from}
            data-connection-to={connection.to}
        >
            {/* 透明的宽线条，用于更容易点击 */}
            <path
                d={pathData.path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
            />

            {/* 箭头标记定义 */}
            <defs>
                <marker
                    id={markerId}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <polygon
                        points="0 0, 10 3, 0 6"
                        fill={strokeColor}
                    />
                </marker>
            </defs>

            {/* 实际显示的线条 */}
            <path
                d={pathData.path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                markerEnd={`url(#${markerId})`}
            />

            {/* 选中时显示的中点 */}
            {isSelected && (
                <circle
                    cx={pathData.midX}
                    cy={pathData.midY}
                    r="5"
                    fill={strokeColor}
                    stroke="#1a1a1a"
                    strokeWidth="2"
                />
            )}
        </g>
    );
};
