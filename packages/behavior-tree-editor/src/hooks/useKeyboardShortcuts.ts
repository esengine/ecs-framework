import { useEffect } from '@esengine/editor-runtime';
import { Connection, ROOT_NODE_ID } from '../stores';
import { useNodeOperations } from './useNodeOperations';
import { useConnectionOperations } from './useConnectionOperations';

interface UseKeyboardShortcutsParams {
    selectedNodeIds: string[];
    selectedConnection: { from: string; to: string } | null;
    connections: Connection[];
    nodeOperations: ReturnType<typeof useNodeOperations>;
    connectionOperations: ReturnType<typeof useConnectionOperations>;
    setSelectedNodeIds: (ids: string[]) => void;
    setSelectedConnection: (connection: { from: string; to: string } | null) => void;
}

export function useKeyboardShortcuts(params: UseKeyboardShortcutsParams) {
    const {
        selectedNodeIds,
        selectedConnection,
        connections,
        nodeOperations,
        connectionOperations,
        setSelectedNodeIds,
        setSelectedConnection
    } = params;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isEditingText = activeElement instanceof HTMLInputElement ||
                                 activeElement instanceof HTMLTextAreaElement ||
                                 activeElement instanceof HTMLSelectElement ||
                                 (activeElement as HTMLElement)?.isContentEditable;

            if (isEditingText) {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();

                if (selectedConnection) {
                    const conn = connections.find(
                        (c: Connection) => c.from === selectedConnection.from && c.to === selectedConnection.to
                    );
                    if (conn) {
                        connectionOperations.removeConnection(
                            conn.from,
                            conn.to,
                            conn.fromProperty,
                            conn.toProperty
                        );
                    }

                    setSelectedConnection(null);
                    return;
                }

                if (selectedNodeIds.length > 0) {
                    const nodesToDelete = selectedNodeIds.filter((id: string) => id !== ROOT_NODE_ID);
                    if (nodesToDelete.length > 0) {
                        nodeOperations.deleteNodes(nodesToDelete);
                        setSelectedNodeIds([]);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, selectedConnection, nodeOperations, connectionOperations, connections, setSelectedNodeIds, setSelectedConnection]);
}
