/**
 * UV Coordinate Helper
 * UV 坐标辅助工具
 *
 * 引擎使用图像坐标系：
 * Engine uses image coordinate system:
 * - 原点 (0, 0) 在左上角 | Origin at top-left
 * - V 轴向下增长 | V-axis increases downward
 * - UV 格式：[u0, v0, u1, v1] 其中 v0 < v1
 */
export class UVHelper {
    /**
     * Calculate UV coordinates for a texture region
     * 计算纹理区域的 UV 坐标
     */
    static calculateUV(
        imageRect: { x: number; y: number; width: number; height: number },
        textureSize: { width: number; height: number }
    ): [number, number, number, number] {
        const { x, y, width, height } = imageRect;
        const { width: tw, height: th } = textureSize;

        return [
            x / tw,              // u0
            y / th,              // v0
            (x + width) / tw,    // u1
            (y + height) / th    // v1
        ];
    }

    /**
     * Calculate UV coordinates for a tile in a tileset
     * 计算 tileset 中某个 tile 的 UV 坐标
     */
    static calculateTileUV(
        tileIndex: number,
        tilesetInfo: {
            columns: number;
            tileWidth: number;
            tileHeight: number;
            imageWidth: number;
            imageHeight: number;
            margin?: number;
            spacing?: number;
        }
    ): [number, number, number, number] | null {
        if (tileIndex < 0) return null;

        const {
            columns,
            tileWidth,
            tileHeight,
            imageWidth,
            imageHeight,
            margin = 0,
            spacing = 0
        } = tilesetInfo;

        const col = tileIndex % columns;
        const row = Math.floor(tileIndex / columns);
        const x = margin + col * (tileWidth + spacing);
        const y = margin + row * (tileHeight + spacing);

        return this.calculateUV(
            { x, y, width: tileWidth, height: tileHeight },
            { width: imageWidth, height: imageHeight }
        );
    }

    static validateUV(uv: [number, number, number, number]): boolean {
        const [u0, v0, u1, v1] = uv;
        return u0 >= 0 && u0 <= 1 && u1 >= 0 && u1 <= 1 &&
               v0 >= 0 && v0 <= 1 && v1 >= 0 && v1 <= 1 &&
               u0 < u1 && v0 < v1;
    }

    static debugPrint(uv: [number, number, number, number], label?: string): void {
        const prefix = label ? `[${label}] ` : '';
        console.log(`${prefix}UV: [${uv.map(n => n.toFixed(4)).join(', ')}]`);
    }
}
