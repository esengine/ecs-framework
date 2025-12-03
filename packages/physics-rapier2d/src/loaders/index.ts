/**
 * Rapier2D 加载器
 *
 * 提供跨平台的 Rapier2D 物理引擎加载支持
 */

export { Rapier2DLoaderConfig } from './Rapier2DLoaderConfig';
export { WebRapier2DLoader } from './WebRapier2DLoader';
export { WeChatRapier2DLoader } from './WeChatRapier2DLoader';

import { PlatformType, WasmLibraryLoaderFactory } from '@esengine/platform-common';
import { Rapier2DLoaderConfig } from './Rapier2DLoaderConfig';
import { WebRapier2DLoader } from './WebRapier2DLoader';
import { WeChatRapier2DLoader } from './WeChatRapier2DLoader';

/**
 * 注册 Rapier2D 加载器到工厂
 *
 * 在模块加载时自动执行
 */
export function registerRapier2DLoaders(): void {
    // Web 平台加载器
    WasmLibraryLoaderFactory.registerLoader(
        'rapier2d',
        PlatformType.Web,
        () => new WebRapier2DLoader(Rapier2DLoaderConfig)
    );

    // 微信小游戏平台加载器
    WasmLibraryLoaderFactory.registerLoader(
        'rapier2d',
        PlatformType.WeChatMiniGame,
        () => new WeChatRapier2DLoader(Rapier2DLoaderConfig)
    );

    // 其他小游戏平台可以复用微信加载器（API 类似）
    // 如果需要特殊处理，可以创建专门的加载器
    WasmLibraryLoaderFactory.registerLoader(
        'rapier2d',
        PlatformType.ByteDanceMiniGame,
        () => new WeChatRapier2DLoader(Rapier2DLoaderConfig)
    );

    WasmLibraryLoaderFactory.registerLoader(
        'rapier2d',
        PlatformType.AlipayMiniGame,
        () => new WeChatRapier2DLoader(Rapier2DLoaderConfig)
    );

    WasmLibraryLoaderFactory.registerLoader(
        'rapier2d',
        PlatformType.BaiduMiniGame,
        () => new WeChatRapier2DLoader(Rapier2DLoaderConfig)
    );
}

// 模块加载时自动注册
registerRapier2DLoaders();
