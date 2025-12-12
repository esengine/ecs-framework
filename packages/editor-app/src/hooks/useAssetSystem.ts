/**
 * Asset system integration hook
 * 资产系统集成Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    AssetManager,
    AssetGUID,
    IAssetLoadProgress,
    AssetReference,
    EngineIntegration
} from '@esengine/asset-system';

/**
 * Asset system hook
 * 资产系统Hook
 */
export function useAssetSystem() {
    const [assetManager, setAssetManager] = useState<AssetManager | null>(null);
    const [engineIntegration, setEngineIntegration] = useState<EngineIntegration | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState<IAssetLoadProgress | null>(null);
    const loadingCountRef = useRef(0);

    /**
     * Initialize asset system
     * 初始化资产系统
     */
    useEffect(() => {
        // 创建资产管理器 / Create asset manager
        const manager = new AssetManager();

        setAssetManager(manager);

        // 创建引擎集成 / Create engine integration
        const integration = new EngineIntegration(manager);
        setEngineIntegration(integration);

        return () => {
            if (assetManager) {
                assetManager.dispose();
            }
        };
    }, []);

    /**
     * Load asset by path
     * 通过路径加载资产
     */
    const loadAssetByPath = useCallback(async <T = unknown>(path: string): Promise<T | null> => {
        if (!assetManager) return null;

        try {
            loadingCountRef.current++;
            setIsLoading(true);

            const result = await assetManager.loadAssetByPath<T>(path, {
                onProgress: (progress) => {
                    setLoadProgress({
                        currentAsset: path,
                        loadedCount: Math.floor(progress * 100),
                        totalCount: 100,
                        loadedBytes: 0,
                        totalBytes: 0,
                        progress
                    });
                }
            });

            return result.asset;
        } catch (error) {
            console.error(`Failed to load asset at ${path}:`, error);
            return null;
        } finally {
            loadingCountRef.current--;
            if (loadingCountRef.current === 0) {
                setIsLoading(false);
                setLoadProgress(null);
            }
        }
    }, [assetManager]);

    /**
     * 通过路径为精灵组件加载纹理（用户脚本使用）
     * Load texture for sprite component by path (for user scripts)
     */
    const loadTextureForSprite = useCallback(async (path: string): Promise<number> => {
        if (!engineIntegration) return 0;

        try {
            return await engineIntegration.loadTextureForComponent(path);
        } catch (error) {
            console.error(`Failed to load texture ${path}:`, error);
            return 0;
        }
    }, [engineIntegration]);

    /**
     * 通过 GUID 为精灵组件加载纹理（内部引用使用）
     * Load texture for sprite component by GUID (for internal references)
     */
    const loadTextureByGuid = useCallback(async (guid: string): Promise<number> => {
        if (!engineIntegration) return 0;

        try {
            return await engineIntegration.loadTextureByGuid(guid);
        } catch (error) {
            console.error(`Failed to load texture by GUID ${guid}:`, error);
            return 0;
        }
    }, [engineIntegration]);

    /**
     * Create asset reference
     * 创建资产引用
     */
    const createAssetReference = useCallback((guid: AssetGUID): AssetReference | null => {
        if (!assetManager) return null;
        return new AssetReference(guid, assetManager);
    }, [assetManager]);

    /**
     * Unload unused assets
     * 卸载未使用的资产
     */
    const unloadUnusedAssets = useCallback(() => {
        if (!assetManager) return;
        assetManager.unloadUnusedAssets();
    }, [assetManager]);


    /**
     * Get statistics
     * 获取统计信息
     */
    const getStatistics = useCallback(() => {
        if (!assetManager) {
            return { loadedCount: 0, loadQueue: 0, failedCount: 0 };
        }
        return assetManager.getStatistics();
    }, [assetManager]);

    return {
        assetManager,
        engineIntegration,
        isLoading,
        loadProgress,
        loadAssetByPath,
        loadTextureForSprite,
        loadTextureByGuid,
        createAssetReference,
        unloadUnusedAssets,
        getStatistics
    };
}

/**
 * Asset reference hook
 * 资产引用Hook
 */
export function useAssetReference<T = unknown>(
    reference: AssetReference<T> | null,
    autoLoad = false
) {
    const [asset, setAsset] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // 自动加载 / Auto load
    useEffect(() => {
        if (autoLoad && reference) {
            loadAsset();
        }
    }, [reference, autoLoad]);

    /**
     * Load asset
     * 加载资产
     */
    const loadAsset = useCallback(async () => {
        if (!reference) return;

        try {
            setIsLoading(true);
            setError(null);
            const loadedAsset = await reference.loadAsync();
            setAsset(loadedAsset);
        } catch (err) {
            setError(err as Error);
            console.error('Failed to load asset reference:', err);
        } finally {
            setIsLoading(false);
        }
    }, [reference]);

    /**
     * Release asset
     * 释放资产
     */
    const release = useCallback(() => {
        if (!reference) return;
        reference.release();
        setAsset(null);
    }, [reference]);

    // 清理 / Cleanup
    useEffect(() => {
        return () => {
            if (reference && reference.isLoaded) {
                reference.release();
            }
        };
    }, [reference]);

    return {
        asset,
        isLoading,
        error,
        load: loadAsset,
        release
    };
}
