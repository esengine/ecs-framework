/**
 * Tilemap Editor Locale Hook
 * 瓦片地图编辑器语言钩子
 *
 * Uses the unified plugin i18n infrastructure from editor-runtime.
 * 使用 editor-runtime 的统一插件国际化基础设施。
 */
import {
    createPluginLocale,
    createPluginTranslator,
    getCurrentLocale
} from '@esengine/editor-runtime';
import { en, zh, es } from '../locales';
import type { Locale, TranslationParams } from '@esengine/editor-core';

// Create translations bundle
// 创建翻译包
const translations = { en, zh, es };

/**
 * Hook for accessing tilemap editor translations
 * 访问瓦片地图编辑器翻译的 Hook
 *
 * Uses the unified createPluginLocale factory from editor-runtime.
 * 使用 editor-runtime 的统一 createPluginLocale 工厂。
 *
 * @example
 * ```tsx
 * const { t, locale } = useTilemapLocale();
 * return <button title={t('toolbar.save')}>{t('toolbar.saveButton')}</button>;
 * ```
 */
export const useTilemapLocale = createPluginLocale(translations);

// Create non-React translator using the unified infrastructure
// 使用统一基础设施创建非 React 翻译器
const tilemapTranslator = createPluginTranslator(translations);

/**
 * Non-React translation function for tilemap editor
 * 瓦片地图编辑器的非 React 翻译函数
 *
 * Use this in services, utilities, and other non-React contexts.
 * 在服务、工具类和其他非 React 上下文中使用。
 *
 * @param key - Translation key | 翻译键
 * @param locale - Optional locale, defaults to current locale | 可选语言，默认使用当前语言
 * @param params - Optional interpolation parameters | 可选插值参数
 *
 * @example
 * ```typescript
 * // With explicit locale
 * translateTilemap('errors.notFound', 'zh');
 *
 * // With current locale (auto-detected)
 * translateTilemap('toolbar.save');
 *
 * // With parameters
 * translateTilemap('layers.layerCount', undefined, { count: 5 });
 * ```
 */
export function translateTilemap(
    key: string,
    locale?: Locale,
    params?: TranslationParams
): string {
    const targetLocale = locale || getCurrentLocale();
    return tilemapTranslator(key, targetLocale, params);
}

// Re-export for external use
// 重新导出供外部使用
export { getCurrentLocale } from '@esengine/editor-runtime';
