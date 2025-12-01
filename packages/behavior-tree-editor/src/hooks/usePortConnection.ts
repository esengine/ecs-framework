import { type RefObject, React } from '@esengine/editor-runtime';
import { BehaviorTreeNode, Connection, ROOT_NODE_ID, useUIStore } from '../stores';
import type { PropertyDefinition } from '@esengine/behavior-tree';
import { useConnectionOperations } from './useConnectionOperations';

interface UsePortConnectionParams {
    canvasRef: RefObject<HTMLDivElement>;
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    nodes: BehaviorTreeNode[];
    connections: Connection[];
    connectingFrom: string | null;
    connectingFromProperty: string | null;
    connectionOperations: ReturnType<typeof useConnectionOperations>;
    setConnectingFrom: (nodeId: string | null) => void;
    setConnectingFromProperty: (propertyName: string | null) => void;
    clearConnecting: () => void;
    sortChildrenByPosition: () => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function usePortConnection(params: UsePortConnectionParams) {
    const {
        canvasRef,
        nodes,
        connections,
        connectionOperations,
        setConnectingFrom,
        setConnectingFromProperty,
        clearConnecting,
        sortChildrenByPosition,
        showToast
    } = params;

    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, propertyName?: string) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const portType = target.getAttribute('data-port-type');

        setConnectingFrom(nodeId);
        setConnectingFromProperty(propertyName || null);

        if (canvasRef.current) {
            canvasRef.current.setAttribute('data-connecting-from-port-type', portType || '');
        }
    };

    const handlePortMouseUp = (e: React.MouseEvent, nodeId: string, propertyName?: string) => {
        e.stopPropagation();

        // 从 store 读取最新状态避免闭包陷阱
        const currentConnectingFrom = useUIStore.getState().connectingFrom;
        const currentConnectingFromProperty = useUIStore.getState().connectingFromProperty;

        if (!currentConnectingFrom) {
            clearConnecting();
            return;
        }

        if (currentConnectingFrom === nodeId) {
            showToast?.('不能将节点连接到自己', 'warning');
            clearConnecting();
            return;
        }

        const target = e.currentTarget as HTMLElement;
        const toPortType = target.getAttribute('data-port-type');
        const fromPortType = canvasRef.current?.getAttribute('data-connecting-from-port-type');

        let actualFrom = currentConnectingFrom;
        let actualTo = nodeId;
        let actualFromProperty = currentConnectingFromProperty;
        let actualToProperty = propertyName;

        const needReverse =
            (fromPortType === 'node-input' || fromPortType === 'property-input') &&
            (toPortType === 'node-output' || toPortType === 'variable-output');

        if (needReverse) {
            actualFrom = nodeId;
            actualTo = currentConnectingFrom;
            actualFromProperty = propertyName || null;
            actualToProperty = currentConnectingFromProperty ?? undefined;
        }

        if (actualFromProperty || actualToProperty) {
            const existingConnection = connections.find(
                (conn: Connection) =>
                    (conn.from === actualFrom && conn.to === actualTo &&
                     conn.fromProperty === actualFromProperty && conn.toProperty === actualToProperty) ||
                    (conn.from === actualTo && conn.to === actualFrom &&
                     conn.fromProperty === actualToProperty && conn.toProperty === actualFromProperty)
            );

            if (existingConnection) {
                showToast?.('该连接已存在', 'warning');
                clearConnecting();
                return;
            }

            const toNode = nodes.find((n: BehaviorTreeNode) => n.id === actualTo);
            if (toNode && actualToProperty) {
                const targetProperty = toNode.template.properties.find(
                    (p: PropertyDefinition) => p.name === actualToProperty
                );

                if (!targetProperty?.allowMultipleConnections) {
                    const existingPropertyConnection = connections.find(
                        (conn: Connection) =>
                            conn.connectionType === 'property' &&
                            conn.to === actualTo &&
                            conn.toProperty === actualToProperty
                    );

                    if (existingPropertyConnection) {
                        showToast?.('该属性已有连接，请先删除现有连接', 'warning');
                        clearConnecting();
                        return;
                    }
                }
            }

            try {
                connectionOperations.addConnection(
                    actualFrom,
                    actualTo,
                    'property',
                    actualFromProperty || undefined,
                    actualToProperty || undefined
                );
            } catch (error) {
                showToast?.(error instanceof Error ? error.message : '添加连接失败', 'error');
                clearConnecting();
                return;
            }
        } else {
            if (actualFrom === ROOT_NODE_ID) {
                const rootNode = nodes.find((n: BehaviorTreeNode) => n.id === ROOT_NODE_ID);
                if (rootNode && rootNode.children.length > 0) {
                    showToast?.('根节点只能连接一个子节点', 'warning');
                    clearConnecting();
                    return;
                }
            }

            const existingConnection = connections.find(
                (conn: Connection) =>
                    (conn.from === actualFrom && conn.to === actualTo && conn.connectionType === 'node') ||
                    (conn.from === actualTo && conn.to === actualFrom && conn.connectionType === 'node')
            );

            if (existingConnection) {
                showToast?.('该连接已存在', 'warning');
                clearConnecting();
                return;
            }

            try {
                connectionOperations.addConnection(actualFrom, actualTo, 'node');

                setTimeout(() => {
                    sortChildrenByPosition();
                }, 0);
            } catch (error) {
                showToast?.(error instanceof Error ? error.message : '添加连接失败', 'error');
                clearConnecting();
                return;
            }
        }

        clearConnecting();
    };

    const handleNodeMouseUpForConnection = (e: React.MouseEvent, nodeId: string) => {
        const currentConnectingFrom = useUIStore.getState().connectingFrom;
        if (currentConnectingFrom && currentConnectingFrom !== nodeId) {
            handlePortMouseUp(e, nodeId);
        }
    };

    return {
        handlePortMouseDown,
        handlePortMouseUp,
        handleNodeMouseUpForConnection
    };
}
