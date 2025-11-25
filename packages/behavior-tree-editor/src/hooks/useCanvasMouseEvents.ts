import { type RefObject, useEffect, useRef, React } from '@esengine/editor-runtime';
import { BehaviorTreeNode, ROOT_NODE_ID } from '../stores';

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
    connectingFromProperty: string | null;
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
        connectingFromProperty,
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
    const canvasOffsetRef = useRef(canvasOffset);
    const canvasScaleRef = useRef(canvasScale);
    const nodesRef = useRef(nodes);
    const selectedNodeIdsRef = useRef(selectedNodeIds);

    useEffect(() => {
        isBoxSelectingRef.current = isBoxSelecting;
        boxSelectStartRef.current = boxSelectStart;
        canvasOffsetRef.current = canvasOffset;
        canvasScaleRef.current = canvasScale;
        nodesRef.current = nodes;
        selectedNodeIdsRef.current = selectedNodeIds;
    }, [isBoxSelecting, boxSelectStart, canvasOffset, canvasScale, nodes, selectedNodeIds]);

    useEffect(() => {
        if (!isBoxSelecting) return;

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isBoxSelectingRef.current || !boxSelectStartRef.current) return;

            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const canvasX = (e.clientX - rect.left - canvasOffsetRef.current.x) / canvasScaleRef.current;
            const canvasY = (e.clientY - rect.top - canvasOffsetRef.current.y) / canvasScaleRef.current;
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

            const selectedInBox = nodesRef.current
                .filter((node: BehaviorTreeNode) => {
                    if (node.id === ROOT_NODE_ID) return false;

                    const nodeElement = canvasRef.current?.querySelector(`[data-node-id="${node.id}"]`);
                    if (!nodeElement) {
                        return node.position.x >= minX && node.position.x <= maxX &&
                               node.position.y >= minY && node.position.y <= maxY;
                    }

                    const nodeRect = nodeElement.getBoundingClientRect();
                    const canvasRect = canvasRef.current!.getBoundingClientRect();

                    const nodeLeft = (nodeRect.left - canvasRect.left - canvasOffsetRef.current.x) / canvasScaleRef.current;
                    const nodeRight = (nodeRect.right - canvasRect.left - canvasOffsetRef.current.x) / canvasScaleRef.current;
                    const nodeTop = (nodeRect.top - canvasRect.top - canvasOffsetRef.current.y) / canvasScaleRef.current;
                    const nodeBottom = (nodeRect.bottom - canvasRect.top - canvasOffsetRef.current.y) / canvasScaleRef.current;

                    return nodeRight > minX && nodeLeft < maxX && nodeBottom > minY && nodeTop < maxY;
                })
                .map((node: BehaviorTreeNode) => node.id);

            if (e.ctrlKey || e.metaKey) {
                const newSet = new Set([...selectedNodeIdsRef.current, ...selectedInBox]);
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
    }, [isBoxSelecting, boxSelectStart, boxSelectEnd, canvasRef, setBoxSelectEnd, setSelectedNodeIds, clearBoxSelect]);

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

        const target = e.target as HTMLElement;
        const isPort = target.closest('[data-port="true"]');
        if (isPort) {
            return;
        }

        if (connectingFrom && connectingToPos) {
            // 如果是属性连接，不允许创建新节点
            if (connectingFromProperty) {
                showToast?.(
                    '属性连接必须连接到现有节点的属性端口',
                    'warning'
                );
                clearConnecting();
                setConnectingToPos(null);
                return;
            }

            const sourceNode = nodes.find((n) => n.id === connectingFrom);
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
