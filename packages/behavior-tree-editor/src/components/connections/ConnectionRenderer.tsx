import React, { useMemo } from 'react';
import { ConnectionViewData } from '../../types';
import { Node } from '../../domain/models/Node';

interface ConnectionRendererProps {
    connectionData: ConnectionViewData;
    fromNode: Node;
    toNode: Node;
    getPortPosition: (nodeId: string, propertyName?: string, portType?: 'input' | 'output') => { x: number; y: number } | null;
    onClick?: (e: React.MouseEvent, fromId: string, toId: string) => void;
    onContextMenu?: (e: React.MouseEvent, fromId: string, toId: string) => void;
}
const ConnectionRendererComponent: React.FC<ConnectionRendererProps> = ({
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
            // 属性连接：使用 fromProperty 和 toProperty
            fromPos = getPortPosition(connection.from, connection.fromProperty);
            toPos = getPortPosition(connection.to, connection.toProperty);
        } else {
            // 节点连接：使用输出和输入端口
            fromPos = getPortPosition(connection.from, undefined, 'output');
            toPos = getPortPosition(connection.to, undefined, 'input');
        }

        if (!fromPos || !toPos) {
            return null;
        }

        const x1 = fromPos.x;
        const y1 = fromPos.y;
        const x2 = toPos.x;
        const y2 = toPos.y;

        let pathD: string;

        if (connection.connectionType === 'property') {
            const controlX1 = x1 + (x2 - x1) * 0.5;
            const controlX2 = x1 + (x2 - x1) * 0.5;
            pathD = `M ${x1} ${y1} C ${controlX1} ${y1}, ${controlX2} ${y2}, ${x2} ${y2}`;
        } else {
            const controlY = y1 + (y2 - y1) * 0.5;
            pathD = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
        }

        return {
            path: pathD,
            midX: (x1 + x2) / 2,
            midY: (y1 + y2) / 2
        };
    }, [connection, fromNode, toNode, getPortPosition]);

    const isPropertyConnection = connection.connectionType === 'property';

    const color = isPropertyConnection ? '#ab47bc' : '#00bcd4';
    const glowColor = isPropertyConnection ? 'rgba(171, 71, 188, 0.6)' : 'rgba(0, 188, 212, 0.6)';
    const strokeColor = isSelected ? '#FFD700' : color;
    const strokeWidth = isSelected ? 3.5 : 2.5;

    const gradientId = `gradient-${connection.from}-${connection.to}`;

    if (!pathData) {
        return null;
    }

    const pathD = pathData.path;
    const endPosMatch = pathD.match(/C [0-9\-\.]+ [0-9\-\.]+, [0-9\-\.]+ [0-9\-\.]+, ([0-9\-\.]+) ([0-9\-\.]+)/);
    const endX = endPosMatch ? parseFloat(endPosMatch[1]) : 0;
    const endY = endPosMatch ? parseFloat(endPosMatch[2]) : 0;

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
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.8" />
                    <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0.8" />
                </linearGradient>
            </defs>

            <path
                d={pathData.path}
                fill="none"
                stroke="transparent"
                strokeWidth={24}
            />

            <path
                d={pathData.path}
                fill="none"
                stroke={glowColor}
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                opacity={isSelected ? 0.4 : 0.2}
            />

            <path
                d={pathData.path}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />

            <circle
                cx={endX}
                cy={endY}
                r="5"
                fill={strokeColor}
                stroke="rgba(0, 0, 0, 0.3)"
                strokeWidth="1"
            />

            {isSelected && (
                <>
                    <circle
                        cx={pathData.midX}
                        cy={pathData.midY}
                        r="8"
                        fill={strokeColor}
                        opacity="0.3"
                    />
                    <circle
                        cx={pathData.midX}
                        cy={pathData.midY}
                        r="5"
                        fill={strokeColor}
                        stroke="rgba(0, 0, 0, 0.5)"
                        strokeWidth="2"
                    />
                </>
            )}
        </g>
    );
};

export const ConnectionRenderer = ConnectionRendererComponent;
