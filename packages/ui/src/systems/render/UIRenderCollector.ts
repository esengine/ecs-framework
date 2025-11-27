/**
 * UI Render Collector - Shared service for collecting UI render primitives
 * UI 渲染收集器 - 用于收集 UI 渲染原语的共享服务
 *
 * This collector is used by all UI render systems to submit render data.
 * 此收集器被所有 UI 渲染系统用于提交渲染数据。
 */

/**
 * A single render primitive (rectangle with optional texture)
 * 单个渲染原语（可选带纹理的矩形）
 *
 * Coordinate system (same as Sprite rendering):
 * - x, y: Anchor/origin position of the rectangle
 * - width, height: Pixel dimensions
 * - pivotX, pivotY: Where the anchor point is on the rectangle (0-1)
 *   - (0, 0) = x,y is top-left corner
 *   - (0.5, 0.5) = x,y is center
 *   - (1, 1) = x,y is bottom-right corner
 *
 * For UI elements (UITransform), x,y is always top-left corner,
 * so pivotX=0, pivotY=0 should be used.
 *
 * 坐标系统（与 Sprite 渲染相同）：
 * - x, y: 矩形的锚点/原点位置
 * - width, height: 像素尺寸
 * - pivotX, pivotY: 锚点在矩形上的位置（0-1）
 *   - (0, 0) = x,y 是左上角
 *   - (0.5, 0.5) = x,y 是中心
 *   - (1, 1) = x,y 是右下角
 *
 * 对于 UI 元素（UITransform），x,y 始终是左上角，
 * 因此应使用 pivotX=0, pivotY=0。
 */
export interface UIRenderPrimitive {
    /** X position (anchor point) | X 坐标（锚点位置） */
    x: number;
    /** Y position (anchor point) | Y 坐标（锚点位置） */
    y: number;
    /** Width in pixels | 宽度（像素） */
    width: number;
    /** Height in pixels | 高度（像素） */
    height: number;
    /** Rotation in radians | 旋转角度（弧度） */
    rotation: number;
    /** Pivot/Origin X (0-1, 0=left, 0.5=center, 1=right) | 锚点 X (0-1, 0=左, 0.5=中心, 1=右) */
    pivotX: number;
    /** Pivot/Origin Y (0-1, 0=top, 0.5=center, 1=bottom) | 锚点 Y (0-1, 0=上, 0.5=中心, 1=下) */
    pivotY: number;
    /** Packed color (0xAABBGGRR) | 打包颜色 */
    color: number;
    /** Sort order (lower = rendered first/behind) | 排序顺序 */
    sortOrder: number;
    /** Optional texture ID | 可选纹理 ID */
    textureId?: number;
    /** Optional texture path | 可选纹理路径 */
    texturePath?: string;
    /** UV coordinates [u0, v0, u1, v1] | UV 坐标 */
    uv?: [number, number, number, number];
}

/**
 * Provider render data format (compatible with EngineRenderSystem)
 * 提供者渲染数据格式（兼容 EngineRenderSystem）
 */
export interface ProviderRenderData {
    transforms: Float32Array;
    textureIds: Uint32Array;
    uvs: Float32Array;
    colors: Uint32Array;
    tileCount: number;
    sortingOrder: number;
    texturePath?: string;
}

/**
 * UI Render Collector
 * UI 渲染收集器
 *
 * Collects render primitives from all UI render systems and converts them
 * to the format expected by EngineRenderSystem.
 * 从所有 UI 渲染系统收集渲染原语，并转换为 EngineRenderSystem 期望的格式。
 */
export class UIRenderCollector {
    private primitives: UIRenderPrimitive[] = [];
    private sortedCache: ProviderRenderData[] | null = null;

    /**
     * Clear all collected primitives (call at start of frame)
     * 清除所有收集的原语（在帧开始时调用）
     */
    clear(): void {
        this.primitives.length = 0;
        this.sortedCache = null;
    }

    /**
     * Add a rectangle primitive
     * 添加矩形原语
     */
    addRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color: number,
        alpha: number,
        sortOrder: number,
        options?: {
            rotation?: number;
            pivotX?: number;
            pivotY?: number;
            textureId?: number;
            texturePath?: string;
            uv?: [number, number, number, number];
        }
    ): void {
        // Pack color with alpha: 0xAABBGGRR
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        const a = Math.round(alpha * 255);
        const packedColor = ((a & 0xFF) << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF);

        this.primitives.push({
            x,
            y,
            width,
            height,
            rotation: options?.rotation ?? 0,
            pivotX: options?.pivotX ?? 0,
            pivotY: options?.pivotY ?? 0,
            color: packedColor,
            sortOrder,
            textureId: options?.textureId,
            texturePath: options?.texturePath,
            uv: options?.uv
        });

        this.sortedCache = null;
    }

    /**
     * Add a primitive with pre-calculated world transform
     * 添加带预计算世界变换的原语
     */
    addPrimitive(primitive: UIRenderPrimitive): void {
        this.primitives.push(primitive);
        this.sortedCache = null;
    }

    /**
     * Get render data in the format expected by EngineRenderSystem
     * 获取 EngineRenderSystem 期望格式的渲染数据
     */
    getRenderData(): readonly ProviderRenderData[] {
        if (this.sortedCache) {
            return this.sortedCache;
        }

        if (this.primitives.length === 0) {
            this.sortedCache = [];
            return this.sortedCache;
        }

        // Sort by sortOrder
        // 按 sortOrder 排序
        this.primitives.sort((a, b) => a.sortOrder - b.sortOrder);

        // Group by texture (primitives with same texture can be batched)
        // 按纹理分组（相同纹理的原语可以批处理）
        const groups = new Map<string, UIRenderPrimitive[]>();

        for (const prim of this.primitives) {
            // Use texture path or 'solid' for solid color rects
            const key = prim.texturePath ?? (prim.textureId?.toString() ?? 'solid');
            let group = groups.get(key);
            if (!group) {
                group = [];
                groups.set(key, group);
            }
            group.push(prim);
        }

        // Convert groups to ProviderRenderData
        // 将分组转换为 ProviderRenderData
        const result: ProviderRenderData[] = [];

        for (const [key, prims] of groups) {
            const count = prims.length;
            const transforms = new Float32Array(count * 7);
            const textureIds = new Uint32Array(count);
            const uvs = new Float32Array(count * 4);
            const colors = new Uint32Array(count);

            for (let i = 0; i < count; i++) {
                const p = prims[i];
                const tOffset = i * 7;
                const uvOffset = i * 4;

                // Transform format compatible with EngineRenderSystem:
                // [x, y, rotation, scaleX(width), scaleY(height), originX(pivotX), originY(pivotY)]
                // Note: EngineRenderSystem uses scaleX/scaleY as pixel dimensions, not scale factors
                // 变换格式（兼容 EngineRenderSystem）：
                // [x, y, rotation, scaleX(宽度), scaleY(高度), originX(pivotX), originY(pivotY)]
                // 注意：EngineRenderSystem 使用 scaleX/scaleY 作为像素尺寸，而不是缩放因子
                transforms[tOffset] = p.x;
                transforms[tOffset + 1] = p.y;
                transforms[tOffset + 2] = p.rotation;
                transforms[tOffset + 3] = p.width;      // maps to scaleX (pixel width)
                transforms[tOffset + 4] = p.height;     // maps to scaleY (pixel height)
                transforms[tOffset + 5] = p.pivotX;     // maps to originX
                transforms[tOffset + 6] = p.pivotY;     // maps to originY

                textureIds[i] = p.textureId ?? 0;

                // UV
                if (p.uv) {
                    uvs[uvOffset] = p.uv[0];
                    uvs[uvOffset + 1] = p.uv[1];
                    uvs[uvOffset + 2] = p.uv[2];
                    uvs[uvOffset + 3] = p.uv[3];
                } else {
                    uvs[uvOffset] = 0;
                    uvs[uvOffset + 1] = 0;
                    uvs[uvOffset + 2] = 1;
                    uvs[uvOffset + 3] = 1;
                }

                colors[i] = p.color;
            }

            // Use the minimum sortOrder from the group as the batch sortingOrder
            const minSortOrder = Math.min(...prims.map(p => p.sortOrder));

            const renderData: ProviderRenderData = {
                transforms,
                textureIds,
                uvs,
                colors,
                tileCount: count,
                sortingOrder: minSortOrder
            };

            // Add texture path if not solid color
            if (key !== 'solid' && isNaN(parseInt(key))) {
                renderData.texturePath = key;
            }

            result.push(renderData);
        }

        // Sort result by sortingOrder
        result.sort((a, b) => a.sortingOrder - b.sortingOrder);

        this.sortedCache = result;
        return result;
    }

    /**
     * Get the number of primitives collected
     * 获取收集的原语数量
     */
    get count(): number {
        return this.primitives.length;
    }

    /**
     * Check if collector is empty
     * 检查收集器是否为空
     */
    get isEmpty(): boolean {
        return this.primitives.length === 0;
    }
}

// Global singleton instance
// 全局单例实例
let globalCollector: UIRenderCollector | null = null;

// Cache invalidation callbacks
// 缓存失效回调
type CacheInvalidationCallback = () => void;
const cacheInvalidationCallbacks: CacheInvalidationCallback[] = [];

/**
 * Get the global UI render collector instance
 * 获取全局 UI 渲染收集器实例
 */
export function getUIRenderCollector(): UIRenderCollector {
    if (!globalCollector) {
        globalCollector = new UIRenderCollector();
    }
    return globalCollector;
}

/**
 * Reset the global collector (for testing or cleanup)
 * 重置全局收集器（用于测试或清理）
 */
export function resetUIRenderCollector(): void {
    globalCollector = null;
}

/**
 * Register a cache invalidation callback
 * 注册缓存失效回调
 *
 * UI render systems can register their cache clearing functions here.
 * When invalidateUIRenderCaches() is called, all registered callbacks will be invoked.
 *
 * UI 渲染系统可以在这里注册它们的缓存清除函数。
 * 当调用 invalidateUIRenderCaches() 时，所有注册的回调将被调用。
 */
export function registerCacheInvalidationCallback(callback: CacheInvalidationCallback): void {
    if (!cacheInvalidationCallbacks.includes(callback)) {
        cacheInvalidationCallbacks.push(callback);
    }
}

/**
 * Unregister a cache invalidation callback
 * 取消注册缓存失效回调
 */
export function unregisterCacheInvalidationCallback(callback: CacheInvalidationCallback): void {
    const index = cacheInvalidationCallbacks.indexOf(callback);
    if (index >= 0) {
        cacheInvalidationCallbacks.splice(index, 1);
    }
}

/**
 * Invalidate all UI render caches
 * 使所有 UI 渲染缓存失效
 *
 * Call this when the scene is restored or when caches need to be cleared.
 * 在场景恢复或需要清除缓存时调用此函数。
 */
export function invalidateUIRenderCaches(): void {
    for (const callback of cacheInvalidationCallbacks) {
        try {
            callback();
        } catch (e) {
            console.error('Error invalidating UI render cache:', e);
        }
    }
}
