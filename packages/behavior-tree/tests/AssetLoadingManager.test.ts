import { World, Scene, Entity } from '@esengine/ecs-framework';
import { AssetLoadingManager } from '../src/Services/AssetLoadingManager';
import {
    LoadingState,
    TimeoutError,
    CircularDependencyError,
    EntityDestroyedError
} from '../src/Services/AssetLoadingTypes';

describe('AssetLoadingManager', () => {
    let manager: AssetLoadingManager;
    let world: World;
    let scene: Scene;
    let parentEntity: Entity;

    beforeEach(() => {
        manager = new AssetLoadingManager();
        world = new World();
        scene = world.createScene('test');
        parentEntity = scene.createEntity('parent');
    });

    afterEach(() => {
        manager.dispose();
        parentEntity.destroy();
    });

    describe('基本加载功能', () => {
        test('成功加载资产', async () => {
            const mockEntity = scene.createEntity('loaded');

            const loader = jest.fn().mockResolvedValue(mockEntity);

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader
            );

            expect(handle.getState()).toBe(LoadingState.Loading);

            const result = await handle.promise;

            expect(result).toBe(mockEntity);
            expect(handle.getState()).toBe(LoadingState.Loaded);
            expect(loader).toHaveBeenCalledTimes(1);
        });

        test('加载失败', async () => {
            const mockError = new Error('Load failed');
            const loader = jest.fn().mockRejectedValue(mockError);

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader,
                { maxRetries: 0 }
            );

            await expect(handle.promise).rejects.toThrow('Load failed');
            expect(handle.getState()).toBe(LoadingState.Failed);
            expect(handle.getError()).toBe(mockError);
        });
    });

    describe('超时机制', () => {
        test('加载超时', async () => {
            const loader = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 10000))
            );

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader,
                { timeoutMs: 100, maxRetries: 0 }
            );

            await expect(handle.promise).rejects.toThrow(TimeoutError);
            expect(handle.getState()).toBe(LoadingState.Timeout);
        });

        test('超时前完成', async () => {
            const mockEntity = scene.createEntity('loaded');

            const loader = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve(mockEntity), 50))
            );

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader,
                { timeoutMs: 200 }
            );

            const result = await handle.promise;

            expect(result).toBe(mockEntity);
            expect(handle.getState()).toBe(LoadingState.Loaded);
        });
    });

    describe('重试机制', () => {
        test('失败后自动重试', async () => {
            const mockEntity = scene.createEntity('loaded');
            let attemptCount = 0;

            const loader = jest.fn().mockImplementation(() => {
                attemptCount++;
                if (attemptCount < 3) {
                    return Promise.reject(new Error('Temporary error'));
                }
                return Promise.resolve(mockEntity);
            });

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader,
                { maxRetries: 3 }
            );

            const result = await handle.promise;

            expect(result).toBe(mockEntity);
            expect(loader).toHaveBeenCalledTimes(3);
            expect(handle.getState()).toBe(LoadingState.Loaded);
        });

        test('重试次数用尽后失败', async () => {
            const loader = jest.fn().mockRejectedValue(new Error('Persistent error'));

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader,
                { maxRetries: 2 }
            );

            await expect(handle.promise).rejects.toThrow('Persistent error');
            expect(loader).toHaveBeenCalledTimes(3); // 初始 + 2次重试
            expect(handle.getState()).toBe(LoadingState.Failed);
        });
    });

    describe('循环引用检测', () => {
        test('检测直接循环引用', () => {
            const loader = jest.fn().mockResolvedValue(scene.createEntity('loaded'));

            // 先加载 assetA
            const handleA = manager.startLoading(
                'assetA',
                parentEntity,
                loader,
                { parentAssetId: undefined }
            );

            expect(handleA.getState()).toBe(LoadingState.Loading);

            // 尝试在 assetA 的上下文中加载 assetB
            // assetB 又尝试加载 assetA（循环）
            expect(() => {
                manager.startLoading(
                    'assetB',
                    parentEntity,
                    loader,
                    { parentAssetId: 'assetB' }  // assetB 的父是 assetB（自我循环）
                );
            }).toThrow(CircularDependencyError);
        });

        test('不误报非循环引用', () => {
            const loader = jest.fn().mockResolvedValue(scene.createEntity('loaded'));

            // assetA 加载 assetB（正常）
            const handleA = manager.startLoading(
                'assetA',
                parentEntity,
                loader
            );

            // assetB 加载 assetC（正常，不是循环）
            expect(() => {
                manager.startLoading(
                    'assetC',
                    parentEntity,
                    loader,
                    { parentAssetId: 'assetB' }
                );
            }).not.toThrow();
        });
    });

    describe('实体生命周期安全', () => {
        test('实体销毁后取消加载', async () => {
            const loader = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 100))
            );

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader
            );

            // 销毁实体
            parentEntity.destroy();

            // 等待一小段时间让检测生效
            await new Promise(resolve => setTimeout(resolve, 50));

            await expect(handle.promise).rejects.toThrow(EntityDestroyedError);
            expect(handle.getState()).toBe(LoadingState.Cancelled);
        });
    });

    describe('状态查询', () => {
        test('获取加载进度', async () => {
            const mockEntity = scene.createEntity('loaded');

            const loader = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve(mockEntity), 100))
            );

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader
            );

            const progress = handle.getProgress();

            expect(progress.state).toBe(LoadingState.Loading);
            expect(progress.elapsedMs).toBeGreaterThanOrEqual(0);
            expect(progress.retryCount).toBe(0);
            expect(progress.maxRetries).toBe(3);

            await handle.promise;
        });

        test('获取统计信息', () => {
            const loader = jest.fn().mockResolvedValue(scene.createEntity('loaded'));

            manager.startLoading('asset1', parentEntity, loader);
            manager.startLoading('asset2', parentEntity, loader);

            const stats = manager.getStats();

            expect(stats.totalTasks).toBe(2);
            expect(stats.loadingTasks).toBe(2);
        });

        test('获取正在加载的资产列表', () => {
            const loader = jest.fn().mockResolvedValue(scene.createEntity('loaded'));

            manager.startLoading('asset1', parentEntity, loader);
            manager.startLoading('asset2', parentEntity, loader);

            const loadingAssets = manager.getLoadingAssets();

            expect(loadingAssets).toContain('asset1');
            expect(loadingAssets).toContain('asset2');
            expect(loadingAssets.length).toBe(2);
        });
    });

    describe('任务管理', () => {
        test('取消加载任务', () => {
            const loader = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 1000))
            );

            const handle = manager.startLoading(
                'test-asset',
                parentEntity,
                loader
            );

            expect(handle.getState()).toBe(LoadingState.Loading);

            handle.cancel();

            expect(handle.getState()).toBe(LoadingState.Cancelled);
        });

        test('清空所有任务', async () => {
            const loader = jest.fn().mockResolvedValue(scene.createEntity('loaded'));

            manager.startLoading('asset1', parentEntity, loader);
            manager.startLoading('asset2', parentEntity, loader);

            expect(manager.getLoadingAssets().length).toBe(2);

            manager.clear();

            expect(manager.getLoadingAssets().length).toBe(0);
        });

        test('复用已存在的加载任务', () => {
            const loader = jest.fn().mockResolvedValue(scene.createEntity('loaded'));

            const handle1 = manager.startLoading('test-asset', parentEntity, loader);
            const handle2 = manager.startLoading('test-asset', parentEntity, loader);

            // 应该返回同一个任务
            expect(handle1.assetId).toBe(handle2.assetId);
            expect(loader).toHaveBeenCalledTimes(1); // 只加载一次
        });
    });
});
