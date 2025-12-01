/**
 * Blueprint Canvas - Main canvas for editing blueprints using NodeEditor
 * 蓝图画布 - 使用 NodeEditor 编辑蓝图的主画布
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    NodeEditor,
    Graph,
    GraphNode,
    Position,
    Connection,
    NodeContextMenu,
    ConfirmDialog,
    type NodeTemplate,
    type NodeCategory,
    type PinCategory
} from '@esengine/node-editor';
import { useBlueprintEditorStore } from '../stores/blueprintEditorStore';
import { NodeRegistry } from '@esengine/blueprint';
import type { BlueprintNode, BlueprintConnection, BlueprintNodeTemplate, BlueprintPinDefinition } from '@esengine/blueprint';

interface ContextMenuState {
    isOpen: boolean;
    screenPosition: { x: number; y: number };
    canvasPosition: Position;
}

interface DeleteDialogState {
    isOpen: boolean;
    nodeId: string;
    nodeTitle: string;
}

/**
 * Map blueprint pin type to node-editor PinCategory
 */
function mapPinCategory(type: string): PinCategory {
    switch (type) {
        case 'exec':
            return 'exec';
        case 'boolean':
        case 'bool':
            return 'bool';
        case 'integer':
        case 'int':
            return 'int';
        case 'float':
        case 'number':
            return 'float';
        case 'string':
            return 'string';
        case 'vector2':
            return 'vector2';
        case 'vector3':
            return 'vector3';
        case 'vector4':
            return 'vector4';
        case 'color':
            return 'color';
        case 'object':
        case 'reference':
            return 'object';
        case 'array':
            return 'array';
        case 'struct':
            return 'struct';
        case 'enum':
            return 'enum';
        default:
            return 'any';
    }
}

/**
 * Map blueprint category to node-editor NodeCategory
 */
function mapNodeCategory(category?: string): NodeCategory {
    switch (category) {
        case 'event':
            return 'event';
        case 'function':
            return 'function';
        case 'pure':
            return 'pure';
        case 'flow':
            return 'flow';
        case 'variable':
            return 'variable';
        case 'literal':
            return 'literal';
        case 'comment':
            return 'comment';
        default:
            return 'function';
    }
}

/**
 * Convert blueprint node template to node-editor template
 */
function convertNodeTemplate(bpTemplate: BlueprintNodeTemplate): NodeTemplate {
    return {
        id: bpTemplate.type,
        title: bpTemplate.title,
        category: mapNodeCategory(bpTemplate.category),
        icon: bpTemplate.icon,
        inputPins: bpTemplate.inputs.map((p: BlueprintPinDefinition) => ({
            name: p.name,
            displayName: p.displayName || p.name,
            category: mapPinCategory(p.type),
            defaultValue: p.defaultValue
        })),
        outputPins: bpTemplate.outputs.map((p: BlueprintPinDefinition) => ({
            name: p.name,
            displayName: p.displayName || p.name,
            category: mapPinCategory(p.type)
        }))
    };
}

/**
 * Convert blueprint node to graph node
 */
function convertToGraphNode(node: BlueprintNode): GraphNode | null {
    const bpTemplate = NodeRegistry.instance.getTemplate(node.type);
    if (!bpTemplate) return null;

    const template = convertNodeTemplate(bpTemplate);
    return new GraphNode(
        node.id,
        template,
        new Position(node.position.x, node.position.y),
        node.data
    );
}

/**
 * Convert blueprint connection to graph connection
 */
function convertToGraphConnection(
    conn: BlueprintConnection,
    nodes: BlueprintNode[],
    graphNodes: GraphNode[]
): Connection | null {
    const fromNode = nodes.find(n => n.id === conn.fromNodeId);
    const toNode = nodes.find(n => n.id === conn.toNodeId);
    if (!fromNode || !toNode) return null;

    const fromTemplate = NodeRegistry.instance.getTemplate(fromNode.type);
    if (!fromTemplate) return null;

    const fromPin = fromTemplate.outputs.find(p => p.name === conn.fromPin);
    if (!fromPin) return null;

    // Find graph nodes to get the actual pin IDs
    const fromGraphNode = graphNodes.find(n => n.id === conn.fromNodeId);
    const toGraphNode = graphNodes.find(n => n.id === conn.toNodeId);
    if (!fromGraphNode || !toGraphNode) return null;

    // Find pins by name
    const fromGraphPin = fromGraphNode.outputPins.find(p => p.name === conn.fromPin);
    const toGraphPin = toGraphNode.inputPins.find(p => p.name === conn.toPin);
    if (!fromGraphPin || !toGraphPin) return null;

    return new Connection(
        conn.id,
        conn.fromNodeId,
        fromGraphPin.id,
        conn.toNodeId,
        toGraphPin.id,
        mapPinCategory(fromPin.type)
    );
}

/**
 * Blueprint Canvas Component using NodeEditor
 */
export const BlueprintCanvas: React.FC = () => {
    const {
        blueprint,
        selectedNodeIds,
        selectNodes,
        updateNodePosition,
        addNode,
        addConnection,
        removeNode,
        removeConnection
    } = useBlueprintEditorStore();

    const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        isOpen: false,
        screenPosition: { x: 0, y: 0 },
        canvasPosition: new Position(0, 0)
    });
    const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
        isOpen: false,
        nodeId: '',
        nodeTitle: ''
    });

    // Convert blueprint to Graph
    const graph = useMemo(() => {
        if (!blueprint) return Graph.empty('blueprint', 'Blueprint');

        const graphNodes: GraphNode[] = [];
        for (const node of blueprint.nodes) {
            const graphNode = convertToGraphNode(node);
            if (graphNode) {
                graphNodes.push(graphNode);
            }
        }

        const graphConnections: Connection[] = [];
        for (const conn of blueprint.connections) {
            const graphConn = convertToGraphConnection(conn, blueprint.nodes, graphNodes);
            if (graphConn) {
                graphConnections.push(graphConn);
            }
        }

        // 安全访问 metadata.name，兼容旧格式文件
        const blueprintName = blueprint.metadata?.name || (blueprint as any).name || 'Blueprint';
        return new Graph('blueprint', blueprintName, graphNodes, graphConnections);
    }, [blueprint]);

    // Handle graph changes
    const handleGraphChange = useCallback((newGraph: Graph) => {
        if (!blueprint) return;

        // Update node positions
        for (const graphNode of newGraph.nodes) {
            const oldNode = blueprint.nodes.find(n => n.id === graphNode.id);
            if (oldNode) {
                if (oldNode.position.x !== graphNode.position.x || oldNode.position.y !== graphNode.position.y) {
                    updateNodePosition(graphNode.id, graphNode.position.x, graphNode.position.y);
                }
            }
        }

        // Handle new connections
        for (const graphConn of newGraph.connections) {
            const exists = blueprint.connections.some(c => c.id === graphConn.id);
            if (!exists) {
                // Extract pin names from graph connection
                const fromNode = newGraph.getNode(graphConn.fromNodeId);
                const toNode = newGraph.getNode(graphConn.toNodeId);
                if (fromNode && toNode) {
                    const fromPin = fromNode.outputPins.find(p => p.id === graphConn.fromPinId);
                    const toPin = toNode.inputPins.find(p => p.id === graphConn.toPinId);
                    if (fromPin && toPin) {
                        addConnection({
                            id: graphConn.id,
                            fromNodeId: graphConn.fromNodeId,
                            fromPin: fromPin.name,
                            toNodeId: graphConn.toNodeId,
                            toPin: toPin.name
                        });
                    }
                }
            }
        }

        // Handle removed connections
        for (const oldConn of blueprint.connections) {
            const exists = newGraph.connections.some(c => c.id === oldConn.id);
            if (!exists) {
                removeConnection(oldConn.id);
            }
        }
    }, [blueprint, updateNodePosition, addConnection, removeConnection]);

    // Handle selection changes
    const handleSelectionChange = useCallback((nodeIds: Set<string>, connectionIds: Set<string>) => {
        selectNodes(Array.from(nodeIds));
        setSelectedConnections(connectionIds);
    }, [selectNodes]);

    // Handle canvas context menu - open node selection menu
    const handleCanvasContextMenu = useCallback((position: Position, e: React.MouseEvent) => {
        setContextMenu({
            isOpen: true,
            screenPosition: { x: e.clientX, y: e.clientY },
            canvasPosition: position
        });
    }, []);

    // Handle template selection from context menu
    const handleSelectTemplate = useCallback((template: NodeTemplate, position: Position) => {
        addNode({
            id: '',
            type: template.id,
            position: { x: position.x, y: position.y },
            data: {}
        });
    }, [addNode]);

    // Close context menu
    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Handle node context menu
    const handleNodeContextMenu = useCallback((node: GraphNode, e: React.MouseEvent) => {
        e.preventDefault();
        setDeleteDialog({
            isOpen: true,
            nodeId: node.id,
            nodeTitle: node.title
        });
    }, []);

    // Handle delete confirmation
    const handleConfirmDelete = useCallback(() => {
        if (deleteDialog.nodeId) {
            removeNode(deleteDialog.nodeId);
        }
        setDeleteDialog({ isOpen: false, nodeId: '', nodeTitle: '' });
    }, [deleteDialog.nodeId, removeNode]);

    // Handle delete cancel
    const handleCancelDelete = useCallback(() => {
        setDeleteDialog({ isOpen: false, nodeId: '', nodeTitle: '' });
    }, []);

    // Get available templates
    const templates = useMemo(() => {
        const allTemplates = NodeRegistry.instance.getAllTemplates();
        return allTemplates.map(t => convertNodeTemplate(t));
    }, []);

    if (!blueprint) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a2e',
                color: '#666'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>No blueprint loaded</p>
                    <p style={{ fontSize: '12px', opacity: 0.7 }}>Create a new blueprint or open an existing one</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <NodeEditor
                graph={graph}
                templates={templates}
                selectedNodeIds={new Set(selectedNodeIds)}
                selectedConnectionIds={selectedConnections}
                onGraphChange={handleGraphChange}
                onSelectionChange={handleSelectionChange}
                onCanvasContextMenu={handleCanvasContextMenu}
                onNodeContextMenu={handleNodeContextMenu}
            />
            <NodeContextMenu
                isOpen={contextMenu.isOpen}
                position={contextMenu.screenPosition}
                canvasPosition={contextMenu.canvasPosition}
                templates={templates}
                onSelectTemplate={handleSelectTemplate}
                onClose={handleCloseContextMenu}
            />
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Delete Node"
                message={`Are you sure you want to delete "${deleteDialog.nodeTitle}"?`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
};
