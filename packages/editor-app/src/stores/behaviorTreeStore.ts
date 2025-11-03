import { create } from 'zustand';
import { NodeTemplate, NodeTemplates, EditorFormatConverter, BehaviorTreeAssetSerializer, NodeType } from '@esengine/behavior-tree';
import { Node } from '../domain/models/Node';
import { Connection } from '../domain/models/Connection';
import { Blackboard, BlackboardValue } from '../domain/models/Blackboard';
import { Position } from '../domain/value-objects/Position';

/**
 * 行为树 Store 状态接口
 */
interface BehaviorTreeState {
    nodes: Node[];
    connections: Connection[];
    blackboard: Blackboard;
    blackboardVariables: Record<string, BlackboardValue>;
    initialBlackboardVariables: Record<string, BlackboardValue>;
    selectedNodeIds: string[];
    draggingNodeId: string | null;
    dragStartPositions: Map<string, { x: number; y: number }>;
    isDraggingNode: boolean;

    isExecuting: boolean;

    canvasOffset: { x: number; y: number };
    canvasScale: number;
    isPanning: boolean;
    panStart: { x: number; y: number };

    connectingFrom: string | null;
    connectingFromProperty: string | null;
    connectingToPos: { x: number; y: number } | null;

    isBoxSelecting: boolean;
    boxSelectStart: { x: number; y: number } | null;
    boxSelectEnd: { x: number; y: number } | null;

    dragDelta: { dx: number; dy: number };

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

    setSelectedNodeIds: (nodeIds: string[]) => void;
    toggleNodeSelection: (nodeId: string) => void;
    clearSelection: () => void;

    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => void;
    stopDragging: () => void;
    setIsDraggingNode: (isDragging: boolean) => void;

    setCanvasOffset: (offset: { x: number; y: number }) => void;
    setCanvasScale: (scale: number) => void;
    setIsPanning: (isPanning: boolean) => void;
    setPanStart: (panStart: { x: number; y: number }) => void;
    resetView: () => void;

    setConnectingFrom: (nodeId: string | null) => void;
    setConnectingFromProperty: (propertyName: string | null) => void;
    setConnectingToPos: (pos: { x: number; y: number } | null) => void;
    clearConnecting: () => void;

    setIsBoxSelecting: (isSelecting: boolean) => void;
    setBoxSelectStart: (pos: { x: number; y: number } | null) => void;
    setBoxSelectEnd: (pos: { x: number; y: number } | null) => void;
    clearBoxSelect: () => void;

    setDragDelta: (delta: { dx: number; dy: number }) => void;

    triggerForceUpdate: () => void;

    setBlackboard: (blackboard: Blackboard) => void;
    updateBlackboardVariable: (name: string, value: BlackboardValue) => void;
    setBlackboardVariables: (variables: Record<string, BlackboardValue>) => void;
    setInitialBlackboardVariables: (variables: Record<string, BlackboardValue>) => void;
    setIsExecuting: (isExecuting: boolean) => void;

    sortChildrenByPosition: () => void;

    exportToJSON: (metadata: { name: string; description: string }) => string;
    importFromJSON: (json: string) => void;

    exportToRuntimeAsset: (
        metadata: { name: string; description: string },
        format: 'json' | 'binary'
    ) => string | Uint8Array;

    reset: () => void;
}

const ROOT_NODE_ID = 'root-node';

/**
 * 创建根节点模板
 */
const createRootNodeTemplate = (): NodeTemplate => ({
    type: NodeType.Composite,
    displayName: '根节点',
    category: '根节点',
    icon: 'TreePine',
    description: '行为树根节点',
    color: '#FFD700',
    defaultConfig: {
        nodeType: 'root'
    },
    properties: []
});

/**
 * 创建初始根节点
 */
const createInitialRootNode = (): Node => {
    const template = createRootNodeTemplate();
    const position = new Position(400, 100);
    return new Node(ROOT_NODE_ID, template, { nodeType: 'root' }, position, []);
};

/**
 * 行为树 Store
 */
export const useBehaviorTreeStore = create<BehaviorTreeState>((set, get) => ({
    nodes: [createInitialRootNode()],
    connections: [],
    blackboard: new Blackboard(),
    blackboardVariables: {},
    initialBlackboardVariables: {},
    selectedNodeIds: [],
    draggingNodeId: null,
    dragStartPositions: new Map(),
    isDraggingNode: false,

    isExecuting: false,

    canvasOffset: { x: 0, y: 0 },
    canvasScale: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },

    connectingFrom: null,
    connectingFromProperty: null,
    connectingToPos: null,

    isBoxSelecting: false,
    boxSelectStart: null,
    boxSelectEnd: null,

    dragDelta: { dx: 0, dy: 0 },

    forceUpdateCounter: 0,

    setNodes: (nodes: Node[]) => set({ nodes }),

    updateNodes: (updater: (nodes: Node[]) => Node[]) => set((state: BehaviorTreeState) => ({
        nodes: updater(state.nodes)
    })),

    addNode: (node: Node) => set((state: BehaviorTreeState) => ({
        nodes: [...state.nodes, node]
    })),

    removeNodes: (nodeIds: string[]) => set((state: BehaviorTreeState) => {
        const nodesToDelete = new Set<string>(nodeIds);

        const remainingNodes = state.nodes
            .filter((n: Node) => !nodesToDelete.has(n.id))
            .map((n: Node) => {
                const newChildren = Array.from(n.children).filter(childId => !nodesToDelete.has(childId));
                if (newChildren.length !== n.children.length) {
                    return new Node(n.id, n.template, n.data, n.position, newChildren);
                }
                return n;
            });

        return { nodes: remainingNodes };
    }),

    updateNodePosition: (nodeId: string, position: { x: number; y: number }) => set((state: BehaviorTreeState) => ({
        nodes: state.nodes.map((n: Node) =>
            n.id === nodeId ? new Node(n.id, n.template, n.data, new Position(position.x, position.y), Array.from(n.children)) : n
        )
    })),

    updateNodesPosition: (updates: Map<string, { x: number; y: number }>) => set((state: BehaviorTreeState) => ({
        nodes: state.nodes.map((node: Node) => {
            const newPos = updates.get(node.id);
            return newPos ? new Node(node.id, node.template, node.data, new Position(newPos.x, newPos.y), Array.from(node.children)) : node;
        })
    })),

    updateNodeData: (nodeId: string, data: Record<string, unknown>) => set((state: BehaviorTreeState) => ({
        nodes: state.nodes.map((n: Node) =>
            n.id === nodeId ? new Node(n.id, n.template, data, n.position, Array.from(n.children)) : n
        )
    })),

    setConnections: (connections: Connection[]) => set({ connections }),

    addConnection: (connection: Connection) => set((state: BehaviorTreeState) => ({
        connections: [...state.connections, connection]
    })),

    removeConnections: (filter: (conn: Connection) => boolean) => set((state: BehaviorTreeState) => ({
        connections: state.connections.filter(filter)
    })),

    setSelectedNodeIds: (nodeIds: string[]) => set({ selectedNodeIds: nodeIds }),

    toggleNodeSelection: (nodeId: string) => set((state: BehaviorTreeState) => ({
        selectedNodeIds: state.selectedNodeIds.includes(nodeId)
            ? state.selectedNodeIds.filter((id: string) => id !== nodeId)
            : [...state.selectedNodeIds, nodeId]
    })),

    clearSelection: () => set({ selectedNodeIds: [] }),

    startDragging: (nodeId: string, startPositions: Map<string, { x: number; y: number }>) => set({
        draggingNodeId: nodeId,
        dragStartPositions: startPositions
    }),

    stopDragging: () => set({ draggingNodeId: null }),

    setIsDraggingNode: (isDragging: boolean) => set({ isDraggingNode: isDragging }),

    setCanvasOffset: (offset: { x: number; y: number }) => set({ canvasOffset: offset }),

    setCanvasScale: (scale: number) => set({ canvasScale: scale }),

    setIsPanning: (isPanning: boolean) => set({ isPanning }),

    setPanStart: (panStart: { x: number; y: number }) => set({ panStart }),

    resetView: () => set({ canvasOffset: { x: 0, y: 0 }, canvasScale: 1 }),

    setConnectingFrom: (nodeId: string | null) => set({ connectingFrom: nodeId }),

    setConnectingFromProperty: (propertyName: string | null) => set({ connectingFromProperty: propertyName }),

    setConnectingToPos: (pos: { x: number; y: number } | null) => set({ connectingToPos: pos }),

    clearConnecting: () => set({
        connectingFrom: null,
        connectingFromProperty: null,
        connectingToPos: null
    }),

    setIsBoxSelecting: (isSelecting: boolean) => set({ isBoxSelecting: isSelecting }),

    setBoxSelectStart: (pos: { x: number; y: number } | null) => set({ boxSelectStart: pos }),

    setBoxSelectEnd: (pos: { x: number; y: number } | null) => set({ boxSelectEnd: pos }),

    clearBoxSelect: () => set({
        isBoxSelecting: false,
        boxSelectStart: null,
        boxSelectEnd: null
    }),

    setDragDelta: (delta: { dx: number; dy: number }) => set({ dragDelta: delta }),

    triggerForceUpdate: () => set((state: BehaviorTreeState) => ({ forceUpdateCounter: state.forceUpdateCounter + 1 })),

    setBlackboard: (blackboard: Blackboard) => set({
        blackboard,
        blackboardVariables: blackboard.toObject()
    }),

    updateBlackboardVariable: (name: string, value: BlackboardValue) => set((state: BehaviorTreeState) => {
        const newBlackboard = Blackboard.fromObject(state.blackboard.toObject());
        newBlackboard.setValue(name, value);
        return {
            blackboard: newBlackboard,
            blackboardVariables: newBlackboard.toObject()
        };
    }),

    setBlackboardVariables: (variables: Record<string, BlackboardValue>) => set((state: BehaviorTreeState) => {
        const newBlackboard = Blackboard.fromObject(variables);
        return {
            blackboard: newBlackboard,
            blackboardVariables: variables
        };
    }),

    setInitialBlackboardVariables: (variables: Record<string, BlackboardValue>) => set({
        initialBlackboardVariables: variables
    }),

    setIsExecuting: (isExecuting: boolean) => set({ isExecuting }),

    sortChildrenByPosition: () => set((state: BehaviorTreeState) => {
        const nodeMap = new Map<string, Node>();
        state.nodes.forEach((node) => nodeMap.set(node.id, node));

        const sortedNodes = state.nodes.map((node) => {
            if (node.children.length <= 1) {
                return node;
            }

            const sortedChildren = Array.from(node.children).sort((a, b) => {
                const nodeA = nodeMap.get(a);
                const nodeB = nodeMap.get(b);
                if (!nodeA || !nodeB) return 0;
                return nodeA.position.x - nodeB.position.x;
            });

            return new Node(node.id, node.template, node.data, node.position, sortedChildren);
        });

        return { nodes: sortedNodes };
    }),

    exportToJSON: (metadata: { name: string; description: string }) => {
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
            nodes: state.nodes.map(n => n.toObject()),
            connections: state.connections.map(c => c.toObject()),
            blackboard: state.blackboard.toObject(),
            canvasState: {
                offset: state.canvasOffset,
                scale: state.canvasScale
            }
        };
        return JSON.stringify(data, null, 2);
    },

    importFromJSON: (json: string) => {
        const data = JSON.parse(json);
        const blackboardData = data.blackboard || {};

        const loadedNodes: Node[] = (data.nodes || []).map((nodeObj: any) => {
            if (nodeObj.id === ROOT_NODE_ID) {
                return createInitialRootNode();
            }

            const className = nodeObj.template?.className;
            let template = nodeObj.template;

            if (className) {
                const allTemplates = NodeTemplates.getAllTemplates();
                const latestTemplate = allTemplates.find((t) => t.className === className);
                if (latestTemplate) {
                    template = latestTemplate;
                }
            }

            const position = new Position(nodeObj.position.x, nodeObj.position.y);
            return new Node(nodeObj.id, template, nodeObj.data, position, nodeObj.children || []);
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

        set({
            nodes: loadedNodes,
            connections: loadedConnections,
            blackboard: loadedBlackboard,
            blackboardVariables: blackboardData,
            initialBlackboardVariables: blackboardData,
            canvasOffset: data.canvasState?.offset || { x: 0, y: 0 },
            canvasScale: data.canvasState?.scale || 1
        });
    },

    exportToRuntimeAsset: (
        metadata: { name: string; description: string },
        format: 'json' | 'binary'
    ) => {
        const state = get();

        const editorFormat = {
            version: '1.0.0',
            metadata: {
                name: metadata.name,
                description: metadata.description,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            },
            nodes: state.nodes.map(n => n.toObject()),
            connections: state.connections.map(c => c.toObject()),
            blackboard: state.blackboard.toObject()
        };

        const asset = EditorFormatConverter.toAsset(editorFormat, metadata);

        return BehaviorTreeAssetSerializer.serialize(asset, {
            format,
            pretty: format === 'json',
            validate: true
        });
    },

    reset: () => set({
        nodes: [createInitialRootNode()],
        connections: [],
        blackboard: new Blackboard(),
        blackboardVariables: {},
        initialBlackboardVariables: {},
        selectedNodeIds: [],
        draggingNodeId: null,
        dragStartPositions: new Map(),
        isDraggingNode: false,
        isExecuting: false,
        canvasOffset: { x: 0, y: 0 },
        canvasScale: 1,
        isPanning: false,
        panStart: { x: 0, y: 0 },
        connectingFrom: null,
        connectingFromProperty: null,
        connectingToPos: null,
        isBoxSelecting: false,
        boxSelectStart: null,
        boxSelectEnd: null,
        dragDelta: { dx: 0, dy: 0 },
        forceUpdateCounter: 0
    })
}));

export { ROOT_NODE_ID };
export type { Node as BehaviorTreeNode };
export type { Connection };
