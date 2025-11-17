import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { NodeTemplate, NodeTemplates } from '@esengine/behavior-tree';
import { getBehaviorTreeEditorViewModel } from '../viewmodels';
import { showToast as notificationShowToast } from '../services/NotificationService';
import { BlackboardValue } from '../domain/models/Blackboard';
import { BehaviorTreeCanvas } from './canvas/BehaviorTreeCanvas';
import { ConnectionLayer } from './connections/ConnectionLayer';
import { EditorToolbar } from './toolbar/EditorToolbar';
import { QuickCreateMenu } from './menu/QuickCreateMenu';
import { NodeContextMenu } from './menu/NodeContextMenu';
import { BehaviorTreeNode as BehaviorTreeNodeComponent } from './nodes/BehaviorTreeNode';
import { BlackboardPanel } from './blackboard/BlackboardPanel';
import { getPortPosition as getPortPositionUtil } from '../utils/portUtils';
import { Node } from '../domain/models/Node';
import { Position } from '../domain/value-objects/Position';
import { ICON_MAP, DEFAULT_EDITOR_CONFIG } from '../config/editorConstants';
import '../styles/BehaviorTreeNode.css';

interface QuickCreateMenuState {
    visible: boolean;
    position: { x: number; y: number };
    searchText: string;
    selectedIndex: number;
    mode: 'create' | 'replace';
    targetNodeId?: string;
}

interface ContextMenuState {
    visible: boolean;
    position: { x: number; y: number };
    nodeId: string | null;
}

interface BehaviorTreeEditorProps {
    onNodeSelect?: (node: Node) => void;
    onNodeCreate?: (template: NodeTemplate, position: { x: number; y: number }) => void;
    projectPath?: string | null;
    showToolbar?: boolean;
    showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const BehaviorTreeEditorMobX = observer<BehaviorTreeEditorProps>(({
    onNodeSelect,
    onNodeCreate,
    projectPath = null,
    showToolbar = true,
    showToast: showToastProp
}) => {
    const vm = getBehaviorTreeEditorViewModel();
    const showToast = showToastProp || notificationShowToast;
    const canvasRef = useRef<HTMLDivElement>(null);
    const executorRef = useRef(null);
    const justFinishedBoxSelectRef = useRef(false);

    const [contextMenu, setContextMenu] = React.useState<ContextMenuState>({
        visible: false,
        position: { x: 0, y: 0 },
        nodeId: null
    });

    const [quickCreateMenu, setQuickCreateMenu] = React.useState<QuickCreateMenuState>({
        visible: false,
        position: { x: 0, y: 0 },
        searchText: '',
        selectedIndex: 0,
        mode: 'create'
    });

    useEffect(() => {
        vm.canvasElement = canvasRef.current;
    }, [vm]);

    useEffect(() => {
        const dispose = reaction(
            () => vm.isBoxSelecting,
            (isSelecting) => {
                if (!isSelecting && justFinishedBoxSelectRef.current) {
                    setTimeout(() => {
                        justFinishedBoxSelectRef.current = false;
                    }, 0);
                } else if (isSelecting) {
                    justFinishedBoxSelectRef.current = true;
                }
            }
        );
        return () => dispose();
    }, [vm]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    vm.undo();
                } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
                    e.preventDefault();
                    vm.redo();
                }
            }
            if (e.key === 'Delete' && vm.hasSelection) {
                e.preventDefault();
                vm.deleteSelectedNodes();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [vm]);

    const screenToCanvas = (screenX: number, screenY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (screenX - rect.left - vm.canvasOffset.x) / vm.canvasScale,
            y: (screenY - rect.top - vm.canvasOffset.y) / vm.canvasScale
        };
    };

    const handleCanvasClick = () => {
        if (!vm.isDraggingNode && !vm.isBoxSelecting && !justFinishedBoxSelectRef.current) {
            vm.clearSelection();
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleCanvasContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY },
            nodeId: null
        });
    };

    const handleCanvasDoubleClick = (e: React.MouseEvent) => {
        const pos = screenToCanvas(e.clientX, e.clientY);
        setQuickCreateMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY },
            searchText: '',
            selectedIndex: 0,
            mode: 'create'
        });
    };

    const handleNodeClick = (e: React.MouseEvent, node: Node) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
            vm.toggleNodeSelection(node.id);
        } else {
            vm.selectNode(node.id);
        }
        if (onNodeSelect) {
            onNodeSelect(node);
        }
    };

    const handleNodeContextMenu = (e: React.MouseEvent, node: Node) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            position: { x: e.clientX, y: e.clientY },
            nodeId: node.id
        });
    };

    const handleNodeMouseDown = (e: React.MouseEvent, node: Node) => {
        if (e.button !== 0) return;
        e.stopPropagation();

        const startPositions = new Map<string, { x: number; y: number }>();
        const nodesToDrag = vm.selectedNodeIds.includes(node.id)
            ? vm.selectedNodeIds
            : [node.id];

        nodesToDrag.forEach(id => {
            const n = vm.nodes.find(nd => nd.id === id);
            if (n) {
                startPositions.set(id, { x: n.position.x, y: n.position.y });
            }
        });

        if (!vm.selectedNodeIds.includes(node.id)) {
            vm.selectNode(node.id);
        }

        vm.startDragging(node.id, startPositions);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (vm.isDraggingNode && vm.draggingNodeId) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            const startPos = vm.dragStartPositions.get(vm.draggingNodeId);
            if (startPos) {
                const node = vm.nodes.find(n => n.id === vm.draggingNodeId);
                if (node) {
                    const dx = pos.x - startPos.x - (node.position.x - startPos.x);
                    const dy = pos.y - startPos.y - (node.position.y - startPos.y);
                    vm.updateDragDelta(dx, dy);
                }
            }
        }

        if (vm.isConnecting && vm.connectingFrom) {
            vm.updateConnectingPosition(e.clientX, e.clientY);
        }

        if (vm.isBoxSelecting) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            vm.updateBoxSelect(pos.x, pos.y);
        }
    };

    const handleCanvasMouseUp = () => {
        if (vm.isDraggingNode) {
            const moves: Array<{ nodeId: string; position: Position }> = [];
            vm.dragStartPositions.forEach((startPos, nodeId) => {
                const newX = startPos.x + vm.dragDelta.dx;
                const newY = startPos.y + vm.dragDelta.dy;
                moves.push({ nodeId, position: new Position(newX, newY) });
            });
            if (moves.length > 0 && (vm.dragDelta.dx !== 0 || vm.dragDelta.dy !== 0)) {
                vm.moveNodes(moves);
            }
            vm.stopDragging();
        }

        if (vm.isBoxSelecting && vm.boxSelectStart && vm.boxSelectEnd) {
            const minX = Math.min(vm.boxSelectStart.x, vm.boxSelectEnd.x);
            const maxX = Math.max(vm.boxSelectStart.x, vm.boxSelectEnd.x);
            const minY = Math.min(vm.boxSelectStart.y, vm.boxSelectEnd.y);
            const maxY = Math.max(vm.boxSelectStart.y, vm.boxSelectEnd.y);

            const selectedIds = vm.nodes
                .filter(node => {
                    const nodeX = node.position.x;
                    const nodeY = node.position.y;
                    return nodeX >= minX && nodeX <= maxX && nodeY >= minY && nodeY <= maxY;
                })
                .map(node => node.id);

            vm.selectNodes(selectedIds);
            vm.endBoxSelect();
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            vm.startPanning(e.clientX, e.clientY);
        } else if (e.button === 0 && !vm.isConnecting) {
            const pos = screenToCanvas(e.clientX, e.clientY);
            vm.startBoxSelect(pos.x, pos.y);
        }
    };

    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, propertyName?: string) => {
        e.stopPropagation();
        vm.startConnecting(nodeId, propertyName);
    };

    const handlePortMouseUp = (e: React.MouseEvent, nodeId: string, propertyName?: string) => {
        e.stopPropagation();
        if (vm.isConnecting && vm.connectingFrom && vm.connectingFrom !== nodeId) {
            try {
                vm.addConnection(vm.connectingFrom, nodeId);
                vm.sortChildrenByPosition();
                showToast('连接创建成功', 'success');
            } catch (error) {
                showToast((error as Error).message, 'error');
            }
        }
        vm.clearConnecting();
    };

    const handleQuickCreateNode = (template: NodeTemplate) => {
        const pos = screenToCanvas(quickCreateMenu.position.x, quickCreateMenu.position.y);
        const node = vm.createNode(template, new Position(pos.x, pos.y));
        if (onNodeCreate) {
            onNodeCreate(template, pos);
        }
        setQuickCreateMenu(prev => ({ ...prev, visible: false }));
        showToast(`创建节点: ${template.displayName}`, 'success');
    };

    const handleBlackboardVariableAdd = (key: string, value: BlackboardValue) => {
        vm.setBlackboardVariables({ ...vm.blackboardVariables, [key]: value });
    };

    const handleBlackboardVariableChange = (key: string, value: BlackboardValue) => {
        vm.updateBlackboardVariable(key, value);
    };

    const handleBlackboardVariableDelete = (key: string) => {
        const newVariables = { ...vm.blackboardVariables };
        delete newVariables[key];
        vm.setBlackboardVariables(newVariables);
    };

    const handleBlackboardVariableRename = (oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        const newVariables = { ...vm.blackboardVariables };
        newVariables[newKey] = newVariables[oldKey];
        delete newVariables[oldKey];
        vm.setBlackboardVariables(newVariables);
    };

    const getPortPosition = (nodeId: string, propertyName?: string, portType: 'input' | 'output' = 'output') =>
        getPortPositionUtil(
            canvasRef,
            vm.canvasOffset,
            vm.canvasScale,
            vm.nodes as Node[],
            nodeId,
            propertyName,
            portType,
            vm.draggingNodeId,
            vm.dragDelta,
            vm.selectedNodeIds
        );

    return (
        <div style={{
            width: '100%',
            height: '100%',
            flex: 1,
            backgroundColor: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {showToolbar && (
                <EditorToolbar
                    executionMode="idle"
                    canUndo={vm.canUndo}
                    canRedo={vm.canRedo}
                    onPlay={() => {}}
                    onPause={() => {}}
                    onStop={() => {}}
                    onStep={() => {}}
                    onReset={() => {}}
                    onUndo={() => vm.undo()}
                    onRedo={() => vm.redo()}
                    onResetView={() => vm.resetView()}
                />
            )}

            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <BehaviorTreeCanvas
                        ref={canvasRef}
                        config={DEFAULT_EDITOR_CONFIG}
                        onClick={handleCanvasClick}
                        onContextMenu={handleCanvasContextMenu}
                        onDoubleClick={handleCanvasDoubleClick}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseUp={handleCanvasMouseUp}
                        onDrop={() => {}}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={() => {}}
                        onDragLeave={() => {}}
                    >
                        <ConnectionLayer
                            connections={vm.connections as any}
                            nodes={vm.nodes as any}
                            selectedConnection={vm.selectedConnection}
                            getPortPosition={getPortPosition}
                            onConnectionClick={(e, fromId, toId) => {
                                vm.selectConnection(fromId, toId);
                            }}
                        />

                        {vm.isConnecting && vm.connectingFrom && vm.connectingToPos && (() => {
                            const fromPos = getPortPosition(vm.connectingFrom, vm.connectingFromProperty || undefined);
                            if (!fromPos) return null;
                            const controlY = fromPos.y + (vm.connectingToPos.y - fromPos.y) * 0.5;
                            const pathD = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x} ${controlY}, ${vm.connectingToPos.x} ${controlY}, ${vm.connectingToPos.x} ${vm.connectingToPos.y}`;
                            return (
                                <svg style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                    overflow: 'visible',
                                    zIndex: 150
                                }}>
                                    <path d={pathD} stroke="#00bcd4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                </svg>
                            );
                        })()}

                        {vm.nodes.map((node) => (
                            <BehaviorTreeNodeComponent
                                key={node.id}
                                node={node as any}
                                isSelected={vm.selectedNodeIds.includes(node.id)}
                                isBeingDragged={vm.selectedNodeIds.includes(node.id) && vm.isDraggingNode}
                                dragDelta={vm.dragDelta}
                                uncommittedNodeIds={new Set<string>()}
                                blackboardVariables={vm.blackboardVariables}
                                initialBlackboardVariables={vm.initialBlackboardVariables}
                                isExecuting={vm.isExecuting}
                                executionStatus={vm.nodeExecutionStatuses.get(node.id)}
                                executionOrder={vm.nodeExecutionOrders.get(node.id)}
                                connections={vm.connections as any}
                                nodes={vm.nodes as any}
                                executorRef={executorRef}
                                iconMap={ICON_MAP}
                                draggingNodeId={vm.draggingNodeId}
                                onNodeClick={handleNodeClick}
                                onContextMenu={(e) => handleNodeContextMenu(e, node)}
                                onNodeMouseDown={(e) => handleNodeMouseDown(e, node)}
                                onNodeMouseUpForConnection={() => {}}
                                onPortMouseDown={(e, propertyName) => handlePortMouseDown(e, node.id, propertyName)}
                                onPortMouseUp={(e, propertyName) => handlePortMouseUp(e, node.id, propertyName)}
                            />
                        ))}
                    </BehaviorTreeCanvas>

                    {vm.isBoxSelecting && vm.boxSelectStart && vm.boxSelectEnd && canvasRef.current && (() => {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const minX = Math.min(vm.boxSelectStart.x, vm.boxSelectEnd.x);
                        const minY = Math.min(vm.boxSelectStart.y, vm.boxSelectEnd.y);
                        const maxX = Math.max(vm.boxSelectStart.x, vm.boxSelectEnd.x);
                        const maxY = Math.max(vm.boxSelectStart.y, vm.boxSelectEnd.y);

                        return (
                            <div style={{
                                position: 'fixed',
                                left: rect.left + minX * vm.canvasScale + vm.canvasOffset.x,
                                top: rect.top + minY * vm.canvasScale + vm.canvasOffset.y,
                                width: (maxX - minX) * vm.canvasScale,
                                height: (maxY - minY) * vm.canvasScale,
                                border: '1px dashed #4a90e2',
                                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                pointerEvents: 'none',
                                zIndex: 9999
                            }} />
                        );
                    })()}

                    <NodeContextMenu
                        visible={contextMenu.visible}
                        position={contextMenu.position}
                        nodeId={contextMenu.nodeId}
                        isBlackboardVariable={false}
                        onReplaceNode={() => {
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                        onDeleteNode={() => {
                            if (contextMenu.nodeId) {
                                vm.deleteNode(contextMenu.nodeId);
                            }
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                        onCreateNode={() => {
                            setQuickCreateMenu({
                                visible: true,
                                position: contextMenu.position,
                                searchText: '',
                                selectedIndex: 0,
                                mode: 'create'
                            });
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                    />

                    <QuickCreateMenu
                        visible={quickCreateMenu.visible}
                        position={quickCreateMenu.position}
                        searchText={quickCreateMenu.searchText}
                        selectedIndex={quickCreateMenu.selectedIndex}
                        mode={quickCreateMenu.mode}
                        iconMap={ICON_MAP}
                        onSearchChange={(text) => setQuickCreateMenu(prev => ({ ...prev, searchText: text }))}
                        onIndexChange={(index) => setQuickCreateMenu(prev => ({ ...prev, selectedIndex: index }))}
                        onNodeSelect={handleQuickCreateNode}
                        onClose={() => setQuickCreateMenu(prev => ({ ...prev, visible: false }))}
                    />
                </div>

                <div style={{
                    width: vm.blackboardCollapsed ? '48px' : '300px',
                    flexShrink: 0,
                    transition: 'width 0.2s ease'
                }}>
                    <BlackboardPanel
                        variables={vm.blackboardVariables}
                        initialVariables={vm.initialBlackboardVariables}
                        globalVariables={{}}
                        onVariableAdd={handleBlackboardVariableAdd}
                        onVariableChange={handleBlackboardVariableChange}
                        onVariableDelete={handleBlackboardVariableDelete}
                        onVariableRename={handleBlackboardVariableRename}
                        onGlobalVariableChange={() => {}}
                        onGlobalVariableAdd={() => {}}
                        onGlobalVariableDelete={() => {}}
                        isCollapsed={vm.blackboardCollapsed}
                        onToggleCollapse={() => vm.toggleBlackboardCollapsed()}
                    />
                </div>
            </div>
        </div>
    );
});
