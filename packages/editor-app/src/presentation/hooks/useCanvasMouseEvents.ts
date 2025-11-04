import { RefObject, useEffect, useRef } from 'react';
import { BehaviorTreeNode, ROOT_NODE_ID } from '../../stores/behaviorTreeStore';

interface QuickCreateMenuState {
    visible: boolean;
    position: { x: number; y: number };
    searchText: string;
    selectedIndex: number;
    mode: 'create' | 'replace';
    replaceNodeId: string | null;
}

interface UseCanvasMouseEventsParams {
    canvasRef: RefObject<HTMLDivElement>;
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    connectingFrom: string | null;
    connectingToPos: { x: number; y: number } | null;
    isBoxSelecting: boolean;
    boxSelectStart: { x: number; y: number } | null;
    boxSelectEnd: { x: number; y: number } | null;
    nodes: BehaviorTreeNode[];
    selectedNodeIds: string[];
    quickCreateMenu: QuickCreateMenuState;
    setConnectingToPos: (pos: { x: number; y: number } | null) => void;
    setIsBoxSelecting: (isSelecting: boolean) => void;
    setBoxSelectStart: (pos: { x: number; y: number } | null) => void;
    setBoxSelectEnd: (pos: { x: number; y: number } | null) => void;
    setSelectedNodeIds: (ids: string[]) => void;
    setSelectedConnection: (connection: { from: string; to: string } | null) => void;
    setQuickCreateMenu: (menu: QuickCreateMenuState) => void;
    clearConnecting: () => void;
    clearBoxSelect: () => void;
    showToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
}

export function useCanvasMouseEvents(params: UseCanvasMouseEventsParams) {
    const {
        canvasRef,
        canvasOffset,
        canvasScale,
        connectingFrom,
        connectingToPos,
        isBoxSelecting,
        boxSelectStart,
        boxSelectEnd,
        nodes,
        selectedNodeIds,
        quickCreateMenu,
        setConnectingToPos,
        setIsBoxSelecting,
        setBoxSelectStart,
        setBoxSelectEnd,
        setSelectedNodeIds,
        setSelectedConnection,
        setQuickCreateMenu,
        clearConnecting,
        clearBoxSelect,
        showToast
    } = params;

    const isBoxSelectingRef = useRef(isBoxSelecting);
    const boxSelectStartRef = useRef(boxSelectStart);

    useEffect(() => {
        isBoxSelectingRef.current = isBoxSelecting;
        boxSelectStartRef.current = boxSelectStart;
    }, [isBoxSelecting, boxSelectStart]);

    useEffect(() => {
        if (!isBoxSelecting) return;

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isBoxSelectingRef.current || !boxSelectStartRef.current) return;

            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
            setBoxSelectEnd({ x: canvasX, y: canvasY });
        };

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (!isBoxSelectingRef.current || !boxSelectStartRef.current || !boxSelectEnd) return;

            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) {
                clearBoxSelect();
                return;
            }

            const minX = Math.min(boxSelectStartRef.current.x, boxSelectEnd.x);
            const maxX = Math.max(boxSelectStartRef.current.x, boxSelectEnd.x);
            const minY = Math.min(boxSelectStartRef.current.y, boxSelectEnd.y);
            const maxY = Math.max(boxSelectStartRef.current.y, boxSelectEnd.y);

            const selectedInBox = nodes
                .filter((node: BehaviorTreeNode) => {
                    if (node.id === ROOT_NODE_ID) return false;

                    const nodeElement = canvasRef.current?.querySelector(`[data-node-id="${node.id}"]`);
                    if (!nodeElement) {
                        return node.position.x >= minX && node.position.x <= maxX &&
                               node.position.y >= minY && node.position.y <= maxY;
                    }

                    const nodeRect = nodeElement.getBoundingClientRect();
                    const canvasRect = canvasRef.current!.getBoundingClientRect();

                    const nodeLeft = (nodeRect.left - canvasRect.left - canvasOffset.x) / canvasScale;
                    const nodeRight = (nodeRect.right - canvasRect.left - canvasOffset.x) / canvasScale;
                    const nodeTop = (nodeRect.top - canvasRect.top - canvasOffset.y) / canvasScale;
                    const nodeBottom = (nodeRect.bottom - canvasRect.top - canvasOffset.y) / canvasScale;

                    return nodeRight > minX && nodeLeft < maxX && nodeBottom > minY && nodeTop < maxY;
                })
                .map((node: BehaviorTreeNode) => node.id);

            if (e.ctrlKey || e.metaKey) {
                const newSet = new Set([...selectedNodeIds, ...selectedInBox]);
                setSelectedNodeIds(Array.from(newSet));
            } else {
                setSelectedNodeIds(selectedInBox);
            }

            clearBoxSelect();
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isBoxSelecting, boxSelectStart, boxSelectEnd, nodes, selectedNodeIds, canvasRef, canvasOffset, canvasScale, setBoxSelectEnd, setSelectedNodeIds, clearBoxSelect]);

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (connectingFrom && canvasRef.current && !quickCreateMenu.visible) {
            const rect = canvasRef.current.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
            setConnectingToPos({
                x: canvasX,
                y: canvasY
            });
        }
    };

    const handleCanvasMouseUp = (e: React.MouseEvent) => {
        if (quickCreateMenu.visible) {
            return;
        }

        if (connectingFrom && connectingToPos) {
            const sourceNode = nodes.find(n => n.id === connectingFrom);
            if (sourceNode && !sourceNode.canAddChild()) {
                const maxChildren = sourceNode.template.maxChildren ?? Infinity;
                showToast?.(
                    `节点"${sourceNode.template.displayName}"已达到最大子节点数 ${maxChildren}`,
                    'warning'
                );
                clearConnecting();
                setConnectingToPos(null);
                return;
            }

            setQuickCreateMenu({
                visible: true,
                position: {
                    x: e.clientX,
                    y: e.clientY
                },
                searchText: '',
                selectedIndex: 0,
                mode: 'create',
                replaceNodeId: null
            });
            setConnectingToPos(null);
            return;
        }

        clearConnecting();
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (quickCreateMenu.visible) {
            setQuickCreateMenu({
                visible: false,
                position: { x: 0, y: 0 },
                searchText: '',
                selectedIndex: 0,
                mode: 'create',
                replaceNodeId: null
            });
            return;
        }

        if (e.button === 0 && !e.altKey) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;

            setIsBoxSelecting(true);
            setBoxSelectStart({ x: canvasX, y: canvasY });
            setBoxSelectEnd({ x: canvasX, y: canvasY });

            if (!e.ctrlKey && !e.metaKey) {
                setSelectedNodeIds([]);
                setSelectedConnection(null);
            }
        }
    };

    return {
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasMouseDown
    };
}
