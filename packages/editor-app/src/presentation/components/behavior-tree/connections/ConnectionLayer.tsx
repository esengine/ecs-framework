import React, { useMemo } from 'react';
import { ConnectionRenderer } from './ConnectionRenderer';
import { ConnectionViewData } from '../../../types';
import { Node } from '../../../../domain/models/Node';
import { Connection } from '../../../../domain/models/Connection';

/**
 * 连线层属性
 */
interface ConnectionLayerProps {
    /**
     * 所有连接
     */
    connections: Connection[];

    /**
     * 所有节点（用于查找位置）
     */
    nodes: Node[];

    /**
     * 选中的连接
     */
    selectedConnection?: { from: string; to: string } | null;

    /**
     * 连线点击事件
     */
    onConnectionClick?: (e: React.MouseEvent, fromId: string, toId: string) => void;

    /**
     * 连线右键事件
     */
    onConnectionContextMenu?: (e: React.MouseEvent, fromId: string, toId: string) => void;
}

/**
 * 连线层
 * 管理所有连线的渲染
 */
export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
    connections,
    nodes,
    selectedConnection,
    onConnectionClick,
    onConnectionContextMenu
}) => {
    const nodeMap = useMemo(() => {
        return new Map(nodes.map(node => [node.id, node]));
    }, [nodes]);

    const connectionViewData = useMemo(() => {
        return connections
            .map(connection => {
                const fromNode = nodeMap.get(connection.from);
                const toNode = nodeMap.get(connection.to);

                if (!fromNode || !toNode) {
                    return null;
                }

                const isSelected = selectedConnection?.from === connection.from &&
                                 selectedConnection?.to === connection.to;

                const viewData: ConnectionViewData = {
                    connection,
                    isSelected
                };

                return { viewData, fromNode, toNode };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [connections, nodeMap, selectedConnection]);

    if (connectionViewData.length === 0) {
        return null;
    }

    return (
        <svg
            className="connection-layer"
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'visible'
            }}
        >
            <g style={{ pointerEvents: 'auto' }}>
                {connectionViewData.map(({ viewData, fromNode, toNode }) => (
                    <ConnectionRenderer
                        key={`${viewData.connection.from}-${viewData.connection.to}`}
                        connectionData={viewData}
                        fromNode={fromNode}
                        toNode={toNode}
                        onClick={onConnectionClick}
                        onContextMenu={onConnectionContextMenu}
                    />
                ))}
            </g>
        </svg>
    );
};
