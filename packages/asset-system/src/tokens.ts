/**
 * Asset System 服务令牌
 * Asset System service tokens
 *
 * 定义 asset-system 模块导出的服务令牌和接口。
 * Defines service tokens and interfaces exported by asset-system module.
 *
 * @example
 * ```typescript
 * // 消费方导入 Token | Consumer imports Token
 * import { AssetManagerToken, type IAssetManager } from '@esengine/asset-system';
 *
 * // 获取服务 | Get service
 * const assetManager = context.services.get(AssetManagerToken);
 * ```
 */

import { createServiceToken } from '@esengine/engine-core';
import type { IAssetManager } from './interfaces/IAssetManager';
import type { IPrefabService } from './interfaces/IPrefabAsset';

// 重新导出接口方便使用 | Re-export interface for convenience
export type { IAssetManager } from './interfaces/IAssetManager';
export type { IAssetLoadResult } from './types/AssetTypes';
export type { IPrefabService, IPrefabAsset, IPrefabData, IPrefabMetadata } from './interfaces/IPrefabAsset';

/**
 * 资产管理器服务令牌
 * Asset manager service token
 *
 * 用于注册和获取资产管理器服务。
 * For registering and getting asset manager service.
 */
export const AssetManagerToken = createServiceToken<IAssetManager>('assetManager');

/**
 * 预制体服务令牌
 * Prefab service token
 *
 * 用于注册和获取预制体服务。
 * For registering and getting prefab service.
 */
export const PrefabServiceToken = createServiceToken<IPrefabService>('prefabService');
