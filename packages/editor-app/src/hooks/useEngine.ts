/**
 * React hook for using the Rust game engine.
 * 使用Rust游戏引擎的React钩子。
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { EngineService } from '../services/EngineService';

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
    createSprite: (name: string, options?: {
        x?: number;
        y?: number;
        textureId?: number;
        width?: number;
        height?: number;
    }) => void;
    loadTexture: (id: number, url: string) => void;
}

/**
 * Hook for managing engine lifecycle in React components.
 * 用于在React组件中管理引擎生命周期的钩子。
 *
 * @param canvasId - Canvas element ID | Canvas元素ID
 * @param autoInit - Whether to auto-initialize | 是否自动初始化
 */
export function useEngine(canvasId: string, autoInit = true): UseEngineReturn {
    const engineRef = useRef<EngineService>(EngineService.getInstance());
    const statsIntervalRef = useRef<number | null>(null);

    const [state, setState] = useState<EngineState>({
        initialized: false,
        running: false,
        fps: 0,
        drawCalls: 0,
        spriteCount: 0,
        error: null
    });

    // Initialize engine | 初始化引擎
    useEffect(() => {
        if (!autoInit) return;

        const init = async () => {
            try {
                await engineRef.current.initialize(canvasId);
                setState(prev => ({ ...prev, initialized: true, error: null }));

                // Start stats update interval | 启动统计更新间隔
                statsIntervalRef.current = window.setInterval(() => {
                    const stats = engineRef.current.getStats();
                    setState(prev => ({
                        ...prev,
                        fps: stats.fps,
                        drawCalls: stats.drawCalls,
                        spriteCount: stats.spriteCount
                    }));
                }, 100);
            } catch (error) {
                console.error('Failed to initialize engine | 引擎初始化失败:', error);
                setState(prev => ({
                    ...prev,
                    error: error instanceof Error ? error.message : String(error)
                }));
            }
        };

        init();

        return () => {
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
            engineRef.current.dispose();
        };
    }, [canvasId, autoInit]);

    // Start engine | 启动引擎
    const start = useCallback(() => {
        engineRef.current.start();
        setState(prev => ({ ...prev, running: true }));
    }, []);

    // Stop engine | 停止引擎
    const stop = useCallback(() => {
        engineRef.current.stop();
        setState(prev => ({ ...prev, running: false }));
    }, []);

    // Create sprite entity | 创建精灵实体
    const createSprite = useCallback((name: string, options?: {
        x?: number;
        y?: number;
        textureId?: number;
        width?: number;
        height?: number;
    }) => {
        engineRef.current.createSpriteEntity(name, options);
    }, []);

    // Load texture | 加载纹理
    const loadTexture = useCallback((id: number, url: string) => {
        engineRef.current.loadTexture(id, url);
    }, []);

    return {
        state,
        start,
        stop,
        createSprite,
        loadTexture
    };
}

export default useEngine;
