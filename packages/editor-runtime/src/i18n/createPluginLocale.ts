/**
 * Plugin Locale Factory
 * 插件国际化工厂
 *
 * Provides utilities for plugins to create their own locale hooks
 * that integrate with the central LocaleService.
 *
 * 为插件提供创建本地化 hook 的工具函数，
 * 这些 hook 会与中央 LocaleService 集成。
 */
import { useState, useEffect, useCallback } from 'react';
import { LocaleService, type Locale, type TranslationParams } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';

/**
 * Translation object structure
 * 翻译对象结构
 */
export type Translations = {
    [key: string]: string | Translations;
};

/**
 * Plugin translations bundle
 * 插件翻译包
 */
export interface PluginTranslationsBundle<T extends Translations = Translations> {
    en: T;
    zh: T;
    es?: T;
}

/**
 * Return type of usePluginLocale hook
 * usePluginLocale hook 的返回类型
 */
export interface PluginLocaleHook {
    /** Translation function | 翻译函数 */
    t: (key: string, params?: TranslationParams) => string;
    /** Current locale | 当前语言 */
    locale: Locale;
}

/**
 * Get nested value from object by dot-separated path
 * 通过点分隔路径从对象获取嵌套值
 */
function getNestedValue(obj: Translations, key: string): string | undefined {
    const keys = key.split('.');
    let current: unknown = obj;

    for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
            current = (current as Record<string, unknown>)[k];
        } else {
            return undefined;
        }
    }

    return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolate parameters into translation string
 * 将参数插入翻译字符串
 */
function interpolate(text: string, params?: TranslationParams): string {
    if (!params) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = params[key];
        return value !== undefined ? String(value) : `{{${key}}}`;
    });
}

/**
 * Creates a locale hook for a plugin with its own translations
 * 为插件创建一个带有自己翻译的 locale hook
 *
 * This factory creates a React hook that:
 * 1. Syncs with the central LocaleService for locale changes
 * 2. Uses plugin-specific translations
 * 3. Falls back to English if translation not found
 *
 * 这个工厂创建一个 React hook，它会：
 * 1. 与中央 LocaleService 同步语言变化
 * 2. 使用插件特定的翻译
 * 3. 如果找不到翻译则回退到英语
 *
 * @param translations - Plugin translations bundle | 插件翻译包
 * @returns A React hook for accessing translations | 用于访问翻译的 React hook
 *
 * @example
 * ```typescript
 * // In your plugin's hooks folder:
 * // 在你的插件 hooks 文件夹中：
 * import { createPluginLocale } from '@esengine/editor-runtime';
 * import { en, zh, es } from '../locales';
 *
 * export const useTilemapLocale = createPluginLocale({ en, zh, es });
 *
 * // In your components:
 * // 在你的组件中：
 * const { t, locale } = useTilemapLocale();
 * return <button>{t('toolbar.save')}</button>;
 * ```
 */
export function createPluginLocale<T extends Translations>(
    translations: PluginTranslationsBundle<T>
): () => PluginLocaleHook {
    const allTranslations = {
        en: translations.en,
        zh: translations.zh,
        es: translations.es || translations.en // Fallback to English if no Spanish
    };

    return function usePluginLocale(): PluginLocaleHook {
        const [locale, setLocale] = useState<Locale>('en');

        useEffect(() => {
            // Try to get LocaleService and sync with it
            // 尝试获取 LocaleService 并与之同步
            try {
                const localeService = Core.services.tryResolve(LocaleService);
                if (localeService) {
                    setLocale(localeService.getCurrentLocale());

                    // Subscribe to locale changes
                    // 订阅语言变化
                    return localeService.onChange((newLocale) => {
                        setLocale(newLocale);
                    });
                }
            } catch {
                // LocaleService not available, use default
                // LocaleService 不可用，使用默认值
            }
        }, []);

        const t = useCallback((key: string, params?: TranslationParams): string => {
            const currentTranslations = allTranslations[locale] || allTranslations.en;
            const value = getNestedValue(currentTranslations as Translations, key);

            if (value) {
                return interpolate(value, params);
            }

            // Fallback to English if current locale doesn't have the key
            // 如果当前语言没有该键，回退到英语
            if (locale !== 'en') {
                const enValue = getNestedValue(allTranslations.en as Translations, key);
                if (enValue) {
                    return interpolate(enValue, params);
                }
            }

            // Return key itself as last resort
            // 最后返回键本身
            return key;
        }, [locale]);

        return { t, locale };
    };
}

/**
 * Creates a non-React translation function for a plugin
 * 为插件创建一个非 React 翻译函数
 *
 * Use this for translating in non-React contexts (services, utilities, etc.)
 * 在非 React 上下文（服务、工具类等）中使用此函数进行翻译
 *
 * @param translations - Plugin translations bundle | 插件翻译包
 * @returns A translation function | 翻译函数
 *
 * @example
 * ```typescript
 * // Create translator
 * // 创建翻译器
 * const translate = createPluginTranslator({ en, zh, es });
 *
 * // Use in non-React code
 * // 在非 React 代码中使用
 * const message = translate('errors.notFound', 'en');
 * ```
 */
export function createPluginTranslator<T extends Translations>(
    translations: PluginTranslationsBundle<T>
): (key: string, locale?: Locale, params?: TranslationParams) => string {
    const allTranslations = {
        en: translations.en,
        zh: translations.zh,
        es: translations.es || translations.en
    };

    return function translate(
        key: string,
        locale: Locale = 'en',
        params?: TranslationParams
    ): string {
        const currentTranslations = allTranslations[locale] || allTranslations.en;
        const value = getNestedValue(currentTranslations as Translations, key);

        if (value) {
            return interpolate(value, params);
        }

        if (locale !== 'en') {
            const enValue = getNestedValue(allTranslations.en as Translations, key);
            if (enValue) {
                return interpolate(enValue, params);
            }
        }

        return key;
    };
}

/**
 * Gets the current locale from LocaleService
 * 从 LocaleService 获取当前语言
 *
 * Use this in non-React contexts where you need the current locale
 * 在需要当前语言的非 React 上下文中使用
 *
 * @returns Current locale or 'en' as default | 当前语言或默认 'en'
 */
export function getCurrentLocale(): Locale {
    try {
        const localeService = Core.services.tryResolve(LocaleService);
        if (localeService) {
            return localeService.getCurrentLocale();
        }
    } catch {
        // LocaleService not available
    }
    return 'en';
}
