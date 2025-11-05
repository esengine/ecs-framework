import { create } from 'zustand';
import { Node } from '../domain/models/Node';
import { Connection } from '../domain/models/Connection';
import { Blackboard, BlackboardValue } from '../domain/models/Blackboard';
import { Position } from '../domain/value-objects/Position';
import { BehaviorTree } from '../domain/models/BehaviorTree';
import { EditorFormatConverter, BehaviorTreeAssetSerializer } from '@esengine/behavior-tree';
import { useBehaviorTreeDataStore } from '../application/state/BehaviorTreeDataStore';

interface TreeState {
    isOpen: boolean;
    pendingFilePath: string | null;
    nodes: Node[];
    connections: Connection[];
    blackboard: Blackboard;
    blackboardVariables: Record<string, BlackboardValue>;
    initialBlackboardVariables: Record<string, BlackboardValue>;
    initialNodesData: Map<string, Record<string, unknown>>;
    forceUpdateCounter: number;

    setNodes: (nodes: Node[]) => void;
    updateNodes: (updater: (nodes: Node[]) => Node[]) => void;
    addNode: (node: Node) => void;
    removeNodes: (nodeIds: string[]) => void;
    updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
    updateNodesPosition: (updates: Map<string, { x: number; y: number }>) => void;
    updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;

    setConnections: (connections: Connection[]) => void;
    addConnection: (connection: Connection) => void;
    removeConnections: (filter: (conn: Connection) => boolean) => void;

    setBlackboard: (blackboard: Blackboard) => void;
    updateBlackboardVariable: (name: string, value: BlackboardValue) => void;
    setBlackboardVariables: (variables: Record<string, BlackboardValue>) => void;
    setInitialBlackboardVariables: (variables: Record<string, BlackboardValue>) => void;

    saveNodesDataSnapshot: () => void;
    restoreNodesData: () => void;

    sortChildrenByPosition: () => void;
    triggerForceUpdate: () => void;

    exportToJSON: (metadata: { name: string; description: string }) => string;
    importFromJSON: (json: string) => void;
    exportToRuntimeAsset: (
        metadata: { name: string; description: string },
        format: 'json' | 'binary'
    ) => string | Uint8Array;

    setIsOpen: (isOpen: boolean) => void;
    setPendingFilePath: (filePath: string | null) => void;
    reset: () => void;
}

export const useTreeStore = create<TreeState>((set, get) => ({
    isOpen: false,
    pendingFilePath: null,
    nodes: [],
    connections: [],
    blackboard: new Blackboard(),
    blackboardVariables: {},
    initialBlackboardVariables: {},
    initialNodesData: new Map(),
    forceUpdateCounter: 0,

    setNodes: (nodes) => set({ nodes }),

    updateNodes: (updater) => set((state) => ({
        nodes: updater(state.nodes)
    })),

    addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node]
    })),

    removeNodes: (nodeIds) => set((state) => {
        const nodesToDelete = new Set<string>(nodeIds);

        const remainingNodes = state.nodes
            .filter((n) => !nodesToDelete.has(n.id))
            .map((n) => {
                const newChildren = Array.from(n.children).filter((childId) => !nodesToDelete.has(childId));
                if (newChildren.length !== n.children.length) {
                    return new Node(n.id, n.template, n.data, n.position, newChildren);
                }
                return n;
            });

        return { nodes: remainingNodes };
    }),

    updateNodePosition: (nodeId, position) => set((state) => ({
        nodes: state.nodes.map((n) =>
            n.id === nodeId
                ? new Node(n.id, n.template, n.data, new Position(position.x, position.y), Array.from(n.children))
                : n
        )
    })),

    updateNodesPosition: (updates) => set((state) => ({
        nodes: state.nodes.map((node) => {
            const newPos = updates.get(node.id);
            return newPos
                ? new Node(node.id, node.template, node.data, new Position(newPos.x, newPos.y), Array.from(node.children))
                : node;
        })
    })),

    updateNodeData: (nodeId, data) => set((state) => ({
        nodes: state.nodes.map((n) =>
            n.id === nodeId
                ? new Node(n.id, n.template, { ...n.data, ...data }, n.position, Array.from(n.children))
                : n
        )
    })),

    setConnections: (connections) => set({ connections }),

    addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection]
    })),

    removeConnections: (filter) => set((state) => ({
        connections: state.connections.filter((conn) => !filter(conn))
    })),

    setBlackboard: (blackboard) => set({ blackboard }),

    updateBlackboardVariable: (name, value) => set((state) => ({
        blackboardVariables: { ...state.blackboardVariables, [name]: value }
    })),

    setBlackboardVariables: (variables) => set({ blackboardVariables: variables }),
    setInitialBlackboardVariables: (variables) => set({ initialBlackboardVariables: variables }),

    saveNodesDataSnapshot: () => set((state) => {
        const snapshot = new Map<string, Record<string, unknown>>();
        state.nodes.forEach((node) => {
            snapshot.set(node.id, { ...node.data });
        });
        return { initialNodesData: snapshot };
    }),

    restoreNodesData: () => set((state) => {
        const restoredNodes = state.nodes.map((node) => {
            const initialData = state.initialNodesData.get(node.id);
            if (initialData) {
                return new Node(node.id, node.template, { ...initialData }, node.position, Array.from(node.children));
            }
            return node;
        });
        return { nodes: restoredNodes };
    }),

    sortChildrenByPosition: () => set((state) => {
        const sortedNodes = state.nodes.map((node) => {
            if (node.children.length === 0) return node;

            const childrenWithPositions = Array.from(node.children)
                .map((childId) => {
                    const childNode = state.nodes.find((n) => n.id === childId);
                    return childNode ? { id: childId, x: childNode.position.x } : null;
                })
                .filter((item): item is { id: string; x: number } => item !== null);

            childrenWithPositions.sort((a, b) => a.x - b.x);
            const sortedChildren = childrenWithPositions.map((item) => item.id);

            return new Node(node.id, node.template, node.data, node.position, sortedChildren);
        });

        return { nodes: sortedNodes };
    }),

    triggerForceUpdate: () => set((state) => ({
        forceUpdateCounter: state.forceUpdateCounter + 1
    })),

    exportToJSON: (metadata) => {
        const state = get();
        const now = new Date().toISOString();
        const data = {
            version: '1.0.0',
            metadata: {
                name: metadata.name,
                description: metadata.description,
                createdAt: now,
                modifiedAt: now
            },
            nodes: state.nodes.map((n) => n.toObject()),
            connections: state.connections.map((c) => c.toObject()),
            blackboard: state.blackboardVariables
        };
        return JSON.stringify(data, null, 2);
    },

    importFromJSON: (json) => {
        const data = JSON.parse(json);
        const blackboardData = data.blackboard || {};

        const loadedNodes: Node[] = (data.nodes || []).map((nodeObj: any) => {
            const position = new Position(nodeObj.position.x, nodeObj.position.y);
            return new Node(nodeObj.id, nodeObj.template, nodeObj.data, position, nodeObj.children || []);
        });

        const loadedConnections: Connection[] = (data.connections || []).map((connObj: any) => {
            return new Connection(
                connObj.from,
                connObj.to,
                connObj.connectionType || 'node',
                connObj.fromProperty,
                connObj.toProperty
            );
        });

        const loadedBlackboard = Blackboard.fromObject(blackboardData);

        const newTree = new BehaviorTree(loadedNodes, loadedConnections, loadedBlackboard, loadedNodes[0]?.id || '');
        useBehaviorTreeDataStore.getState().setTree(newTree);

        set({
            nodes: loadedNodes,
            connections: loadedConnections,
            blackboard: loadedBlackboard,
            blackboardVariables: blackboardData,
            initialBlackboardVariables: blackboardData
        });
    },

    exportToRuntimeAsset: (metadata, format) => {
        const state = get();

        const editorFormat = {
            version: '1.0.0',
            metadata: {
                name: metadata.name,
                description: metadata.description,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            },
            nodes: state.nodes.map((n) => n.toObject()),
            connections: state.connections.map((c) => c.toObject()),
            blackboard: state.blackboardVariables
        };

        const asset = EditorFormatConverter.toAsset(editorFormat, metadata);

        return BehaviorTreeAssetSerializer.serialize(asset, {
            format,
            pretty: format === 'json',
            validate: true
        });
    },

    setIsOpen: (isOpen) => set({ isOpen }),
    setPendingFilePath: (filePath) => set({ pendingFilePath: filePath }),

    reset: () => set({
        isOpen: false,
        pendingFilePath: null,
        nodes: [],
        connections: [],
        blackboard: new Blackboard(),
        blackboardVariables: {},
        initialBlackboardVariables: {},
        initialNodesData: new Map(),
        forceUpdateCounter: 0
    })
}));
