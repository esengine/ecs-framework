/**
 * UI 模块服务令牌
 * UI module service tokens
 */

import { createServiceToken } from '@esengine/engine-core';
import type { UILayoutSystem } from './systems/UILayoutSystem';
import type { UIInputSystem } from './systems/UIInputSystem';
import type { UIRenderDataProvider } from './systems/UIRenderDataProvider';
import type { UITextRenderSystem } from './systems/render';

// ============================================================================
// UI 模块导出的令牌 | Tokens exported by UI module
// ============================================================================

/**
 * UI 布局系统令牌
 * UI layout system token
 */
export const UILayoutSystemToken = createServiceToken<UILayoutSystem>('uiLayoutSystem');

/**
 * UI 输入系统令牌
 * UI input system token
 */
export const UIInputSystemToken = createServiceToken<UIInputSystem>('uiInputSystem');

/**
 * UI 渲染数据提供者令牌
 * UI render data provider token
 */
export const UIRenderProviderToken = createServiceToken<UIRenderDataProvider>('uiRenderProvider');

/**
 * UI 文本渲染系统令牌
 * UI text render system token
 */
export const UITextRenderSystemToken = createServiceToken<UITextRenderSystem>('uiTextRenderSystem');
