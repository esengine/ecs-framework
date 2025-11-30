import { React, useMemo } from '@esengine/editor-runtime';
import { ConnectionRenderer } from './ConnectionRenderer';
import { ConnectionViewData } from '../../types';
import { Node } from '../../domain/models/Node';
import { Connection } from '../../domain/models/Connection';

interface ConnectionLayerProps {
    connections: Connection[];
    nodes: Node[];
    selectedConnection?: { from: string; to: string } | null;
    getPortPosition: (nodeId: string, propertyName?: string, portType?: 'input' | 'output') => { x: number; y: number } | null;
    onConnectionClick?: (e: React.MouseEvent, fromId: string, toId: string) => void;
    onConnectionContextMenu?: (e: React.MouseEvent, fromId: string, toId: string) => void;
    /** 用于强制刷新连线（当 canvasScale 等变化时） */
    /** Used to force refresh connections (when canvasScale etc. changes) */
    refreshKey?: number;
}
export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
    connections,
    nodes,
    selectedConnection,
    getPortPosition,
    onConnectionClick,
    onConnectionContextMenu
}) => {
    const nodeMap = useMemo(() => {
        return new Map(nodes.map((node) => [node.id, node]));
    }, [nodes]);

    const connectionViewData = useMemo(() => {
        return connections
            .map((connection) => {
                const fromNode = nodeMap.get(connection.from);
                const toNode = nodeMap.get(connection.to);

                if (!fromNode || !toNode) {
                    return null;
                }

                return { connection, fromNode, toNode };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [connections, nodeMap]);

    const isConnectionSelected = (connection: { from: string; to: string }) => {
        return selectedConnection?.from === connection.from &&
               selectedConnection?.to === connection.to;
    };

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
                overflow: 'visible',
                zIndex: 0
            }}
        >
            <g style={{ pointerEvents: 'auto' }}>
                {connectionViewData.map(({ connection, fromNode, toNode }) => {
                    const viewData: ConnectionViewData = {
                        connection,
                        isSelected: isConnectionSelected(connection)
                    };
                    return (
                        <ConnectionRenderer
                            key={`${connection.from}-${connection.to}`}
                            connectionData={viewData}
                            fromNode={fromNode}
                            toNode={toNode}
                            getPortPosition={getPortPosition}
                            onClick={onConnectionClick}
                            onContextMenu={onConnectionContextMenu}
                        />
                    );
                })}
            </g>
        </svg>
    );
};
