/**
 * 排序层系统 - 控制渲染顺序
 * Sorting Layer System - Controls render order
 *
 * 提供排序层和层内排序功能，用于精确控制 2D 对象的渲染顺序。
 * Provides sorting layer and order-in-layer functionality for precise 2D rendering order control.
 *
 * @example
 * ```typescript
 * // 获取排序层管理器
 * const manager = SortingLayerManager.instance;
 *
 * // 获取层的全局顺序
 * const order = manager.getLayerOrder('UI'); // 200
 *
 * // 计算排序键（用于渲染排序）
 * const sortKey = manager.getSortKey('UI', 10); // 200 * 10000 + 10 = 2000010
 * ```
 */

import { createServiceToken } from './PluginServiceRegistry';

/**
 * 排序层配置
 * Sorting layer configuration
 */
export interface SortingLayerConfig {
    /** 层名称 | Layer name */
    name: string;
    /** 全局顺序（数值越大越靠前）| Global order (higher = rendered later/on top) */
    order: number;
    /**
     * 是否在屏幕空间渲染
     * Whether to render in screen space
     *
     * 屏幕空间层使用固定正交投影，不受世界相机影响。
     * Screen space layers use fixed orthographic projection, not affected by world camera.
     */
    bScreenSpace?: boolean;
}

/**
 * 可排序接口 - 所有可渲染组件应实现此接口
 * Sortable interface - All renderable components should implement this
 */
export interface ISortable {
    /** 排序层名称 | Sorting layer name */
    sortingLayer: string;
    /** 层内顺序 | Order within layer */
    orderInLayer: number;
}

/**
 * 默认排序层
 * Default sorting layers
 *
 * 渲染顺序（从后到前）：
 * Render order (back to front):
 *
 * 世界空间 | World Space:
 * - Background (-100): 背景
 * - Default (0): 默认游戏对象
 * - Foreground (100): 前景对象
 * - WorldOverlay (150): 世界空间特效（技能、伤害数字等）
 *
 * 屏幕空间 | Screen Space:
 * - UI (200): UI 元素
 * - ScreenOverlay (300): 屏幕空间特效（点击特效、Toast）
 * - Modal (400): 模态对话框、全屏遮罩
 */
export const DEFAULT_SORTING_LAYERS: SortingLayerConfig[] = [
    // 世界空间层 | World space layers
    { name: 'Background', order: -100 },
    { name: 'Default', order: 0 },
    { name: 'Foreground', order: 100 },
    { name: 'WorldOverlay', order: 150 },

    // 屏幕空间层 | Screen space layers
    { name: 'UI', order: 200, bScreenSpace: true },
    { name: 'ScreenOverlay', order: 300, bScreenSpace: true },
    { name: 'Modal', order: 400, bScreenSpace: true },
];

/**
 * 排序层名称常量
 * Sorting layer name constants
 */
export const SortingLayers = {
    Background: 'Background',
    Default: 'Default',
    Foreground: 'Foreground',
    WorldOverlay: 'WorldOverlay',
    UI: 'UI',
    ScreenOverlay: 'ScreenOverlay',
    Modal: 'Modal',
} as const;

export type SortingLayerName = typeof SortingLayers[keyof typeof SortingLayers] | string;

/**
 * 排序层管理器接口
 * Sorting layer manager interface
 */
export interface ISortingLayerManager {
    /**
     * 获取所有排序层
     * Get all sorting layers
     */
    getLayers(): readonly SortingLayerConfig[];

    /**
     * 获取层的全局顺序
     * Get layer's global order
     */
    getLayerOrder(layerName: string): number;

    /**
     * 计算排序键
     * Calculate sort key
     *
     * sortKey = layerOrder * 10000 + orderInLayer
     */
    getSortKey(layerName: string, orderInLayer: number): number;

    /**
     * 添加自定义层
     * Add custom layer
     */
    addLayer(name: string, order: number, bScreenSpace?: boolean): void;

    /**
     * 移除自定义层
     * Remove custom layer
     */
    removeLayer(name: string): boolean;

    /**
     * 获取层名称列表（按顺序）
     * Get layer names in order
     */
    getLayerNames(): string[];

    /**
     * 检查层是否为屏幕空间层
     * Check if layer is screen space
     */
    isScreenSpace(layerName: string): boolean;

    /**
     * 获取所有屏幕空间层名称
     * Get all screen space layer names
     */
    getScreenSpaceLayers(): string[];

    /**
     * 获取所有世界空间层名称
     * Get all world space layer names
     */
    getWorldSpaceLayers(): string[];
}

/**
 * 排序层管理器
 * Sorting Layer Manager
 *
 * 管理渲染排序层，提供统一的排序键计算。
 * Manages render sorting layers and provides unified sort key calculation.
 */
export class SortingLayerManager implements ISortingLayerManager {
    private static _instance: SortingLayerManager | null = null;

    private _layers: Map<string, SortingLayerConfig> = new Map();
    private _sortedLayers: SortingLayerConfig[] = [];

    /**
     * 获取单例实例
     * Get singleton instance
     */
    static get instance(): SortingLayerManager {
        if (!SortingLayerManager._instance) {
            SortingLayerManager._instance = new SortingLayerManager();
        }
        return SortingLayerManager._instance;
    }

    constructor(layers?: SortingLayerConfig[]) {
        const initialLayers = layers ?? DEFAULT_SORTING_LAYERS;
        for (const layer of initialLayers) {
            this._layers.set(layer.name, layer);
        }
        this._updateSortedLayers();
    }

    /**
     * 获取所有排序层（按顺序）
     * Get all sorting layers (in order)
     */
    getLayers(): readonly SortingLayerConfig[] {
        return this._sortedLayers;
    }

    /**
     * 获取层的全局顺序
     * Get layer's global order
     *
     * @param layerName 层名称 | Layer name
     * @returns 全局顺序，未找到返回 0 | Global order, returns 0 if not found
     */
    getLayerOrder(layerName: string): number {
        return this._layers.get(layerName)?.order ?? 0;
    }

    /**
     * 计算排序键
     * Calculate sort key
     *
     * 用于渲染排序，数值越大越后渲染（显示在上面）。
     * Used for render sorting, higher value = rendered later (on top).
     *
     * @param layerName 层名称 | Layer name
     * @param orderInLayer 层内顺序 | Order within layer
     * @returns 排序键 | Sort key
     */
    getSortKey(layerName: string, orderInLayer: number): number {
        const layerOrder = this.getLayerOrder(layerName);
        // 使用 10000 作为乘数，允许 -9999 到 9999 的 orderInLayer
        // Use 10000 as multiplier, allows orderInLayer from -9999 to 9999
        return layerOrder * 10000 + orderInLayer;
    }

    /**
     * 添加自定义层
     * Add custom layer
     *
     * @param name 层名称 | Layer name
     * @param order 全局顺序 | Global order
     * @param bScreenSpace 是否为屏幕空间层 | Whether screen space layer
     */
    addLayer(name: string, order: number, bScreenSpace: boolean = false): void {
        this._layers.set(name, { name, order, bScreenSpace });
        this._updateSortedLayers();
    }

    /**
     * 移除自定义层
     * Remove custom layer
     *
     * 注意：不能移除默认层。
     * Note: Cannot remove default layers.
     *
     * @param name 层名称 | Layer name
     * @returns 是否成功移除 | Whether successfully removed
     */
    removeLayer(name: string): boolean {
        // 检查是否为默认层 | Check if default layer
        if (DEFAULT_SORTING_LAYERS.some(l => l.name === name)) {
            console.warn(`[SortingLayerManager] Cannot remove default layer: ${name}`);
            return false;
        }

        const result = this._layers.delete(name);
        if (result) {
            this._updateSortedLayers();
        }
        return result;
    }

    /**
     * 获取层名称列表（按顺序）
     * Get layer names in order
     */
    getLayerNames(): string[] {
        return this._sortedLayers.map(l => l.name);
    }

    /**
     * 检查层是否存在
     * Check if layer exists
     */
    hasLayer(name: string): boolean {
        return this._layers.has(name);
    }

    /**
     * 检查层是否为屏幕空间层
     * Check if layer is screen space
     *
     * @param layerName 层名称 | Layer name
     * @returns 是否为屏幕空间层，未找到返回 false | Whether screen space, returns false if not found
     */
    isScreenSpace(layerName: string): boolean {
        return this._layers.get(layerName)?.bScreenSpace ?? false;
    }

    /**
     * 获取所有屏幕空间层名称
     * Get all screen space layer names
     */
    getScreenSpaceLayers(): string[] {
        return this._sortedLayers
            .filter(l => l.bScreenSpace)
            .map(l => l.name);
    }

    /**
     * 获取所有世界空间层名称
     * Get all world space layer names
     */
    getWorldSpaceLayers(): string[] {
        return this._sortedLayers
            .filter(l => !l.bScreenSpace)
            .map(l => l.name);
    }

    /**
     * 重置为默认层
     * Reset to default layers
     */
    reset(): void {
        this._layers.clear();
        for (const layer of DEFAULT_SORTING_LAYERS) {
            this._layers.set(layer.name, layer);
        }
        this._updateSortedLayers();
    }

    /**
     * 更新排序后的层列表
     * Update sorted layer list
     */
    private _updateSortedLayers(): void {
        this._sortedLayers = Array.from(this._layers.values())
            .sort((a, b) => a.order - b.order);
    }
}

/**
 * 排序层管理器服务令牌
 * Sorting layer manager service token
 */
export const SortingLayerManagerToken = createServiceToken<ISortingLayerManager>('sortingLayerManager');

/**
 * 全局排序层管理器实例
 * Global sorting layer manager instance
 */
export const sortingLayerManager = SortingLayerManager.instance;
