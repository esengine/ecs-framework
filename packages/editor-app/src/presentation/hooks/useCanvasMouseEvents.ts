import { RefObject } from 'react';
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
        clearBoxSelect
    } = params;

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

        if (isBoxSelecting && boxSelectStart) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const canvasX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
            const canvasY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
            setBoxSelectEnd({ x: canvasX, y: canvasY });
        }
    };

    const handleCanvasMouseUp = (e: React.MouseEvent) => {
        if (quickCreateMenu.visible) {
            return;
        }

        if (connectingFrom && connectingToPos) {
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

        if (isBoxSelecting && boxSelectStart && boxSelectEnd) {
            const minX = Math.min(boxSelectStart.x, boxSelectEnd.x);
            const maxX = Math.max(boxSelectStart.x, boxSelectEnd.x);
            const minY = Math.min(boxSelectStart.y, boxSelectEnd.y);
            const maxY = Math.max(boxSelectStart.y, boxSelectEnd.y);

            const selectedInBox = nodes
                .filter((node: BehaviorTreeNode) => {
                    if (node.id === ROOT_NODE_ID) return false;

                    const nodeElement = canvasRef.current?.querySelector(`[data-node-id="${node.id}"]`);
                    if (!nodeElement) {
                        return node.position.x >= minX && node.position.x <= maxX &&
                               node.position.y >= minY && node.position.y <= maxY;
                    }

                    const rect = nodeElement.getBoundingClientRect();
                    const canvasRect = canvasRef.current!.getBoundingClientRect();

                    const nodeLeft = (rect.left - canvasRect.left - canvasOffset.x) / canvasScale;
                    const nodeRight = (rect.right - canvasRect.left - canvasOffset.x) / canvasScale;
                    const nodeTop = (rect.top - canvasRect.top - canvasOffset.y) / canvasScale;
                    const nodeBottom = (rect.bottom - canvasRect.top - canvasOffset.y) / canvasScale;

                    return nodeRight > minX && nodeLeft < maxX && nodeBottom > minY && nodeTop < maxY;
                })
                .map((node: BehaviorTreeNode) => node.id);

            if (e.ctrlKey || e.metaKey) {
                const newSet = new Set([...selectedNodeIds, ...selectedInBox]);
                setSelectedNodeIds(Array.from(newSet));
            } else {
                setSelectedNodeIds(selectedInBox);
            }
        }

        clearBoxSelect();
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
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
