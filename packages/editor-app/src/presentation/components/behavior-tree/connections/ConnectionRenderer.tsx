import React, { useMemo } from 'react';
import { ConnectionViewData } from '../../../types';
import { Node } from '../../../../domain/models/Node';

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
    onClick,
    onContextMenu
}) => {
    const { connection, isSelected } = connectionData;

    const pathData = useMemo(() => {
        const fromPos = fromNode.position;
        const toPos = toNode.position;

        const startX = fromPos.x + 180;
        const startY = fromPos.y + 40;
        const endX = toPos.x;
        const endY = toPos.y + 40;

        const controlPointOffset = Math.abs(endX - startX) * 0.5;

        return {
            path: `M ${startX},${startY} C ${startX + controlPointOffset},${startY} ${endX - controlPointOffset},${endY} ${endX},${endY}`,
            midX: (startX + endX) / 2,
            midY: (startY + endY) / 2
        };
    }, [fromNode.position, toNode.position]);

    const strokeColor = isSelected ? '#ffa500' : '#4a9eff';
    const strokeWidth = isSelected ? 3 : 2;

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

            {/* 实际显示的线条 */}
            <path
                d={pathData.path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
            />

            {/* 箭头标记 */}
            <defs>
                <marker
                    id="arrowhead"
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
