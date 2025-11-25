import { useCallback, useMemo, React } from '@esengine/editor-runtime';
import { useBehaviorTreeDataStore, useUIStore } from '../stores';

/**
 * 画布交互 Hook
 * 封装画布的缩放、平移等交互逻辑
 */
export function useCanvasInteraction() {
    // 从数据 store 获取画布状态
    const canvasOffset = useBehaviorTreeDataStore((state) => state.canvasOffset);
    const canvasScale = useBehaviorTreeDataStore((state) => state.canvasScale);
    const setCanvasOffset = useBehaviorTreeDataStore((state) => state.setCanvasOffset);
    const setCanvasScale = useBehaviorTreeDataStore((state) => state.setCanvasScale);
    const resetView = useBehaviorTreeDataStore((state) => state.resetView);

    // 从 UI store 获取平移状态
    const isPanning = useUIStore((state) => state.isPanning);
    const panStart = useUIStore((state) => state.panStart);
    const setIsPanning = useUIStore((state) => state.setIsPanning);
    const setPanStart = useUIStore((state) => state.setPanStart);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        const delta = e.deltaY;
        const scaleFactor = 1.1;

        if (delta < 0) {
            setCanvasScale(Math.min(canvasScale * scaleFactor, 3));
        } else {
            setCanvasScale(Math.max(canvasScale / scaleFactor, 0.1));
        }
    }, [canvasScale, setCanvasScale]);

    const startPanning = useCallback((clientX: number, clientY: number) => {
        setIsPanning(true);
        setPanStart({ x: clientX, y: clientY });
    }, [setIsPanning, setPanStart]);

    const updatePanning = useCallback((clientX: number, clientY: number) => {
        if (!isPanning) return;

        const dx = clientX - panStart.x;
        const dy = clientY - panStart.y;

        setCanvasOffset({
            x: canvasOffset.x + dx,
            y: canvasOffset.y + dy
        });

        setPanStart({ x: clientX, y: clientY });
    }, [isPanning, panStart, canvasOffset, setCanvasOffset, setPanStart]);

    const stopPanning = useCallback(() => {
        setIsPanning(false);
    }, [setIsPanning]);

    const zoomIn = useCallback(() => {
        setCanvasScale(Math.min(canvasScale * 1.2, 3));
    }, [canvasScale, setCanvasScale]);

    const zoomOut = useCallback(() => {
        setCanvasScale(Math.max(canvasScale / 1.2, 0.1));
    }, [canvasScale, setCanvasScale]);

    const zoomToFit = useCallback(() => {
        resetView();
    }, [resetView]);

    const screenToCanvas = useCallback((screenX: number, screenY: number) => {
        return {
            x: (screenX - canvasOffset.x) / canvasScale,
            y: (screenY - canvasOffset.y) / canvasScale
        };
    }, [canvasOffset, canvasScale]);

    const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
        return {
            x: canvasX * canvasScale + canvasOffset.x,
            y: canvasY * canvasScale + canvasOffset.y
        };
    }, [canvasOffset, canvasScale]);

    return useMemo(() => ({
        canvasOffset,
        canvasScale,
        isPanning,
        handleWheel,
        startPanning,
        updatePanning,
        stopPanning,
        zoomIn,
        zoomOut,
        zoomToFit,
        screenToCanvas,
        canvasToScreen
    }), [
        canvasOffset,
        canvasScale,
        isPanning,
        handleWheel,
        startPanning,
        updatePanning,
        stopPanning,
        zoomIn,
        zoomOut,
        zoomToFit,
        screenToCanvas,
        canvasToScreen
    ]);
}
