/**
 * React hook for using the Rust game engine.
 * 使用Rust游戏引擎的React钩子。
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, EntityStoreService } from '@esengine/editor-core';
import { EngineService } from '../services/EngineService';
import { EditorEngineSync } from '../services/EditorEngineSync';

// Module-level initialization tracking (outside React lifecycle)
// 模块级别的初始化追踪（在React生命周期外部）
let engineInitialized = false;
let engineInitializing = false;

/**
 * 重置引擎初始化状态（在项目关闭时调用）
 * Reset engine initialization state (called when project is closed)
 */
export function resetEngineState(): void {
    engineInitialized = false;
    engineInitializing = false;
}

export interface EngineState {
    initialized: boolean;
    running: boolean;
    fps: number;
    drawCalls: number;
    spriteCount: number;
    error: string | null;
}

export interface UseEngineReturn {
    state: EngineState;
    start: () => void;
    stop: () => void;
    step: () => void;
    createSprite: (name: string, options?: {
        x?: number;
        y?: number;
        textureId?: number;
        width?: number;
        height?: number;
    }) => void;
    loadTexture: (id: number, url: string) => void;
    viewportId: string;
}

export interface UseEngineOptions {
    viewportId: string;
    canvasId: string;
    showGrid?: boolean;
    showGizmos?: boolean;
    autoInit?: boolean;
}

/**
 * Initialize engine once at module level
 * 在模块级别初始化引擎一次
 */
async function initializeEngine(canvasId: string): Promise<void> {
    if (engineInitialized || engineInitializing) {
        return;
    }

    engineInitializing = true;

    try {
        const engine = EngineService.getInstance();
        await engine.initialize(canvasId);

        // Initialize sync service
        // 初始化同步服务
        try {
            const messageHub = Core.services.resolve(MessageHub);
            const entityStore = Core.services.resolve(EntityStoreService);
            if (messageHub && entityStore) {
                EditorEngineSync.getInstance().initialize(messageHub, entityStore);
            }
        } catch (syncError) {
            console.warn('Failed to initialize sync service | 同步服务初始化失败:', syncError);
        }

        engineInitialized = true;
    } finally {
        engineInitializing = false;
    }
}

/**
 * Hook for managing engine lifecycle in React components.
 * 用于在React组件中管理引擎生命周期的钩子。
 *
 * @param canvasId - Canvas element ID | Canvas元素ID
 * @param autoInit - Whether to auto-initialize | 是否自动初始化
 */
export function useEngine(canvasId: string, autoInit?: boolean): UseEngineReturn;
export function useEngine(options: UseEngineOptions): UseEngineReturn;
export function useEngine(
    canvasIdOrOptions: string | UseEngineOptions,
    autoInit?: boolean
): UseEngineReturn {
    // Parse options
    const options: UseEngineOptions = typeof canvasIdOrOptions === 'string'
        ? {
            viewportId: canvasIdOrOptions, // Use canvasId as viewportId for backward compatibility
            canvasId: canvasIdOrOptions,
            showGrid: true,
            showGizmos: true,
            autoInit
        }
        : {
            showGrid: true,
            showGizmos: true,
            autoInit: true,
            ...canvasIdOrOptions
        };

    const engineRef = useRef<EngineService>(EngineService.getInstance());
    const statsIntervalRef = useRef<number | null>(null);
    const viewportRegisteredRef = useRef(false);

    const [state, setState] = useState<EngineState>({
        initialized: engineInitialized,
        running: false,
        fps: 0,
        drawCalls: 0,
        spriteCount: 0,
        error: null
    });

    // Initialize engine and register viewport
    useEffect(() => {
        if (!options.autoInit) return;

        const init = async () => {
            try {
                // Initialize engine with primary canvas (first viewport)
                await initializeEngine(options.canvasId);
                setState((prev) => ({ ...prev, initialized: true, error: null }));

                // Register this viewport
                if (!viewportRegisteredRef.current) {
                    engineRef.current.registerViewport(options.viewportId, options.canvasId);
                    engineRef.current.setViewportConfig(
                        options.viewportId,
                        options.showGrid ?? true,
                        options.showGizmos ?? true
                    );
                    viewportRegisteredRef.current = true;
                }

                // Start stats update interval
                if (!statsIntervalRef.current) {
                    statsIntervalRef.current = window.setInterval(() => {
                        const stats = engineRef.current.getStats();
                        setState((prev) => ({
                            ...prev,
                            fps: stats.fps,
                            drawCalls: stats.drawCalls,
                            spriteCount: stats.spriteCount
                        }));
                    }, 100);
                }
            } catch (error) {
                console.error('Failed to initialize engine | 引擎初始化失败:', error);
                setState((prev) => ({
                    ...prev,
                    error: error instanceof Error ? error.message : String(error)
                }));
            }
        };

        init();

        return () => {
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
                statsIntervalRef.current = null;
            }
            // 注意：Viewport 现在是持久化的，不会被卸载，所以不需要 unregisterViewport
        };
    }, [options.canvasId, options.viewportId, options.autoInit, options.showGrid, options.showGizmos]);

    // Start engine
    const start = useCallback(() => {
        engineRef.current.start();
        setState((prev) => ({ ...prev, running: true }));
    }, []);

    // Stop engine
    const stop = useCallback(() => {
        engineRef.current.stop();
        setState((prev) => ({ ...prev, running: false }));
    }, []);

    // Step single frame (advance one frame when paused)
    const step = useCallback(() => {
        // Execute a single frame update via Core
        Core.update(1 / 60); // Use fixed 60fps timestep for step
    }, []);

    // Create sprite entity
    const createSprite = useCallback((name: string, options?: {
        x?: number;
        y?: number;
        textureId?: number;
        width?: number;
        height?: number;
    }) => {
        engineRef.current.createSpriteEntity(name, options);
    }, []);

    // Load texture
    const loadTexture = useCallback((id: number, url: string) => {
        engineRef.current.loadTexture(id, url);
    }, []);

    return {
        state,
        start,
        stop,
        step,
        createSprite,
        loadTexture,
        viewportId: options.viewportId
    };
}

export default useEngine;
