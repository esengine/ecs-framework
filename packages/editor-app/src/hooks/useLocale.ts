import { useState, useEffect, useCallback, useMemo } from 'react';
import { Core } from '@esengine/ecs-framework';
import { LocaleService, type TranslationParams, type LocaleInfo, type Locale } from '@esengine/editor-core';

// Re-export Locale type for convenience | 重新导出 Locale 类型以便使用
export type { Locale } from '@esengine/editor-core';

/**
 * React Hook for internationalization
 * React 国际化 Hook
 *
 * 提供翻译函数、语言切换和语言变化监听。
 * Provides translation function, locale switching and locale change listening.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *     const { t, locale, changeLocale, supportedLocales } = useLocale();
 *
 *     return (
 *         <div>
 *             <h1>{t('app.title')}</h1>
 *             <p>{t('scene.savedSuccess', { name: 'MyScene' })}</p>
 *             <select value={locale} onChange={(e) => changeLocale(e.target.value as Locale)}>
 *                 {supportedLocales.map((loc) => (
 *                     <option key={loc.code} value={loc.code}>{loc.nativeName}</option>
 *                 ))}
 *             </select>
 *         </div>
 *     );
 * }
 * ```
 */
export function useLocale() {
    const localeService = useMemo(() => Core.services.resolve(LocaleService), []);
    const [locale, setLocale] = useState<Locale>(() => localeService.getCurrentLocale());

    useEffect(() => {
        const unsubscribe = localeService.onChange((newLocale) => {
            setLocale(newLocale);
        });

        return unsubscribe;
    }, [localeService]);

    /**
     * 翻译函数
     * Translation function
     *
     * @param key - 翻译键 | Translation key
     * @param params - 可选参数，用于替换 {{key}} | Optional params for {{key}} substitution
     * @param fallback - 回退文本 | Fallback text
     */
    const t = useCallback(
        (key: string, params?: TranslationParams, fallback?: string) => {
            return localeService.t(key, params, fallback);
        },
        [localeService]
    );

    /**
     * 切换语言
     * Change locale
     */
    const changeLocale = useCallback(
        (newLocale: Locale) => {
            localeService.setLocale(newLocale);
        },
        [localeService]
    );

    /**
     * 获取支持的语言列表
     * Get supported locales
     */
    const supportedLocales: readonly LocaleInfo[] = useMemo(() => {
        return localeService.getSupportedLocales();
    }, [localeService]);

    return {
        locale,
        t,
        changeLocale,
        supportedLocales
    };
}
