import { useState, RefObject } from 'react';
import { NodeTemplate } from '@esengine/behavior-tree';
import { Node } from '../domain/models/Node';
import { Connection } from '../domain/models/Connection';
import { Position } from '../domain/value-objects/Position';
import { useNodeOperations } from './useNodeOperations';
import { useConnectionOperations } from './useConnectionOperations';

type BehaviorTreeNode = Node;

interface QuickCreateMenuState {
    visible: boolean;
    position: { x: number; y: number };
    searchText: string;
    selectedIndex: number;
    mode: 'create' | 'replace';
    replaceNodeId: string | null;
}

type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';

interface UseQuickCreateMenuParams {
    nodeOperations: ReturnType<typeof useNodeOperations>;
    connectionOperations: ReturnType<typeof useConnectionOperations>;
    canvasRef: RefObject<HTMLDivElement>;
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    connectingFrom: string | null;
    connectingFromProperty: string | null;
    clearConnecting: () => void;
    nodes: BehaviorTreeNode[];
    setNodes: (nodes: BehaviorTreeNode[]) => void;
    connections: Connection[];
    executionMode: ExecutionMode;
    onStop: () => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useQuickCreateMenu(params: UseQuickCreateMenuParams) {
    const {
        nodeOperations,
        connectionOperations,
        canvasRef,
        canvasOffset,
        canvasScale,
        connectingFrom,
        connectingFromProperty,
        clearConnecting,
        nodes,
        setNodes,
        connections,
        executionMode,
        onStop,
        onNodeCreate,
        showToast
    } = params;

    const [quickCreateMenu, setQuickCreateMenu] = useState<QuickCreateMenuState>({
        visible: false,
        position: { x: 0, y: 0 },
        searchText: '',
        selectedIndex: 0,
        mode: 'create',
        replaceNodeId: null
    });

    const handleReplaceNode = (newTemplate: NodeTemplate) => {
        const nodeToReplace = nodes.find((n) => n.id === quickCreateMenu.replaceNodeId);
        if (!nodeToReplace) return;

        if (executionMode !== 'idle') {
            onStop();
        }

        const newData = { ...newTemplate.defaultConfig };
        const newPropertyNames = new Set(newTemplate.properties.map((p) => p.name));

        for (const [key, value] of Object.entries(nodeToReplace.data)) {
            if (key === 'nodeType' || key === 'compositeType' || key === 'decoratorType' ||
                key === 'actionType' || key === 'conditionType') {
                continue;
            }

            if (newPropertyNames.has(key)) {
                newData[key] = value;
            }
        }

        const newNode = new Node(
            nodeToReplace.id,
            newTemplate,
            newData,
            nodeToReplace.position,
            Array.from(nodeToReplace.children)
        );

        setNodes(nodes.map((n) => n.id === newNode.id ? newNode : n));

        const propertyConnections = connections.filter((conn) =>
            conn.connectionType === 'property' && conn.to === newNode.id
        );
        propertyConnections.forEach((conn) => {
            connectionOperations.removeConnection(
                conn.from,
                conn.to,
                conn.fromProperty,
                conn.toProperty
            );
        });

        closeQuickCreateMenu();
        showToast?.(`已将节点替换为 ${newTemplate.displayName}`, 'success');
    };

    const handleQuickCreateNode = (template: NodeTemplate) => {
        if (quickCreateMenu.mode === 'replace') {
            handleReplaceNode(template);
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
            return;
        }

        const posX = (quickCreateMenu.position.x - rect.left - canvasOffset.x) / canvasScale;
        const posY = (quickCreateMenu.position.y - rect.top - canvasOffset.y) / canvasScale;

        const newNode = nodeOperations.createNode(
            template,
            new Position(posX, posY),
            template.defaultConfig
        );

        if (connectingFrom) {
            const fromNode = nodes.find((n: BehaviorTreeNode) => n.id === connectingFrom);
            if (fromNode) {
                if (connectingFromProperty) {
                    connectionOperations.addConnection(
                        connectingFrom,
                        newNode.id,
                        'property',
                        connectingFromProperty,
                        undefined
                    );
                } else {
                    connectionOperations.addConnection(connectingFrom, newNode.id, 'node');
                }
            }
        }

        closeQuickCreateMenu();
        onNodeCreate?.(template, { x: posX, y: posY });
    };

    const openQuickCreateMenu = (
        position: { x: number; y: number },
        mode: 'create' | 'replace',
        replaceNodeId?: string | null
    ) => {
        setQuickCreateMenu({
            visible: true,
            position,
            searchText: '',
            selectedIndex: 0,
            mode,
            replaceNodeId: replaceNodeId || null
        });
    };

    const closeQuickCreateMenu = () => {
        setQuickCreateMenu({
            visible: false,
            position: { x: 0, y: 0 },
            searchText: '',
            selectedIndex: 0,
            mode: 'create',
            replaceNodeId: null
        });
        clearConnecting();
    };

    return {
        quickCreateMenu,
        setQuickCreateMenu,
        handleQuickCreateNode,
        handleReplaceNode,
        openQuickCreateMenu,
        closeQuickCreateMenu
    };
}
