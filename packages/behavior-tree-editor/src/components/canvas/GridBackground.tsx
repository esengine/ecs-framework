import { React, useMemo } from '@esengine/editor-runtime';

interface GridBackgroundProps {
    canvasOffset: { x: number; y: number };
    canvasScale: number;
    width: number;
    height: number;
}

/**
 * 编辑器网格背景
 */
export const GridBackground: React.FC<GridBackgroundProps> = ({
    canvasOffset,
    canvasScale,
    width,
    height
}) => {
    const gridPattern = useMemo(() => {
        // 基础网格大小（未缩放）
        const baseGridSize = 20;
        const baseDotSize = 1.5;

        // 根据缩放级别调整网格大小
        const gridSize = baseGridSize * canvasScale;
        const dotSize = Math.max(baseDotSize, baseDotSize * canvasScale);

        // 计算网格偏移（考虑画布偏移）
        const offsetX = canvasOffset.x % gridSize;
        const offsetY = canvasOffset.y % gridSize;

        // 计算需要渲染的网格点数量
        const cols = Math.ceil(width / gridSize) + 2;
        const rows = Math.ceil(height / gridSize) + 2;

        const dots: Array<{ x: number; y: number }> = [];

        for (let i = -1; i < rows; i++) {
            for (let j = -1; j < cols; j++) {
                dots.push({
                    x: j * gridSize + offsetX,
                    y: i * gridSize + offsetY
                });
            }
        }

        return { dots, dotSize, gridSize };
    }, [canvasOffset, canvasScale, width, height]);

    // 大网格（每5个小格一个大格）
    const majorGridPattern = useMemo(() => {
        const majorGridSize = gridPattern.gridSize * 5;
        const offsetX = canvasOffset.x % majorGridSize;
        const offsetY = canvasOffset.y % majorGridSize;

        const lines: Array<{ type: 'h' | 'v'; pos: number }> = [];

        // 垂直线
        const vCols = Math.ceil(width / majorGridSize) + 2;
        for (let i = -1; i < vCols; i++) {
            lines.push({
                type: 'v',
                pos: i * majorGridSize + offsetX
            });
        }

        // 水平线
        const hRows = Math.ceil(height / majorGridSize) + 2;
        for (let i = -1; i < hRows; i++) {
            lines.push({
                type: 'h',
                pos: i * majorGridSize + offsetY
            });
        }

        return lines;
    }, [canvasOffset, canvasScale, width, height, gridPattern.gridSize]);

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}
        >
            {/* 主网格线 */}
            {majorGridPattern.map((line, idx) => (
                line.type === 'v' ? (
                    <line
                        key={`v-${idx}`}
                        x1={line.pos}
                        y1={0}
                        x2={line.pos}
                        y2={height}
                        stroke="rgba(255, 255, 255, 0.03)"
                        strokeWidth="1"
                    />
                ) : (
                    <line
                        key={`h-${idx}`}
                        x1={0}
                        y1={line.pos}
                        x2={width}
                        y2={line.pos}
                        stroke="rgba(255, 255, 255, 0.03)"
                        strokeWidth="1"
                    />
                )
            ))}

            {/* 点阵网格 */}
            {gridPattern.dots.map((dot, idx) => (
                <circle
                    key={idx}
                    cx={dot.x}
                    cy={dot.y}
                    r={gridPattern.dotSize}
                    fill="rgba(255, 255, 255, 0.15)"
                />
            ))}
        </svg>
    );
};
