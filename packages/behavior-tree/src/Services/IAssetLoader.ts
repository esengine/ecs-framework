import { BehaviorTreeAsset } from '../Serialization/BehaviorTreeAsset';

/**
 * 资产加载器接口
 *
 * 提供可扩展的资产加载机制，允许用户自定义资产加载逻辑。
 * 支持从文件系统、网络、数据库、自定义打包格式等加载资产。
 *
 * @example
 * ```typescript
 * // 使用默认的文件系统加载器
 * const loader = new FileSystemAssetLoader({
 *     basePath: 'assets/behavior-trees',
 *     format: 'json'
 * });
 * core.services.registerInstance(FileSystemAssetLoader, loader);
 *
 * // 或实现自定义加载器
 * class NetworkAssetLoader implements IAssetLoader {
 *     async loadBehaviorTree(assetId: string): Promise<BehaviorTreeAsset> {
 *         const response = await fetch(`/api/assets/${assetId}`);
 *         return response.json();
 *     }
 *
 *     async exists(assetId: string): Promise<boolean> {
 *         const response = await fetch(`/api/assets/${assetId}/exists`);
 *         return response.json();
 *     }
 * }
 * core.services.registerInstance(FileSystemAssetLoader, new NetworkAssetLoader());
 * ```
 */
export interface IAssetLoader {
    /**
     * 加载行为树资产
     *
     * @param assetId 资产逻辑ID，例如 'patrol' 或 'ai/patrol'
     * @returns 行为树资产对象
     * @throws 如果资产不存在或加载失败
     */
    loadBehaviorTree(assetId: string): Promise<BehaviorTreeAsset>;

    /**
     * 检查资产是否存在
     *
     * @param assetId 资产逻辑ID
     * @returns 资产是否存在
     */
    exists(assetId: string): Promise<boolean>;

    /**
     * 预加载资产（可选）
     *
     * 用于提前加载资产到缓存，减少运行时延迟
     *
     * @param assetIds 要预加载的资产ID列表
     */
    preload?(assetIds: string[]): Promise<void>;

    /**
     * 卸载资产（可选）
     *
     * 释放资产占用的内存
     *
     * @param assetId 资产ID
     */
    unload?(assetId: string): void;
}
