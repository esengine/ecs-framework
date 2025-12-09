/**
 * Material Editor Locale Hook
 * 材质编辑器语言钩子
 *
 * 提供材质编辑器专用的翻译功能
 */
import { useState, useEffect, useCallback } from 'react';
import { Core } from '@esengine/ecs-framework';
import { LocaleService } from '@esengine/editor-core';
import { en, zh, es } from '../locales';

type Locale = 'en' | 'zh' | 'es';
type TranslationParams = Record<string, string | number>;

const translations = { en, zh, es } as const;

/**
 * 获取嵌套对象的值
 * Get nested object value by dot notation key
 */
function getNestedValue(obj: Record<string, unknown>, key: string): string | undefined {
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
 * 替换参数占位符
 * Replace parameter placeholders in string
 */
function interpolate(text: string, params?: TranslationParams): string {
    if (!params) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = params[key];
        return value !== undefined ? String(value) : `{{${key}}}`;
    });
}

/**
 * 尝试从 LocaleService 获取当前语言
 * Try to get current locale from LocaleService
 */
function tryGetLocaleFromService(): Locale | null {
    try {
        // 尝试动态获取 LocaleService
        const localeService = Core.services.tryResolve(LocaleService);

        if (localeService?.getCurrentLocale) {
            return localeService.getCurrentLocale() as Locale;
        }
    } catch {
        // LocaleService 不可用
    }
    return null;
}

/**
 * 订阅语言变化
 * Subscribe to locale changes
 */
function subscribeToLocaleChanges(callback: (locale: Locale) => void): (() => void) | undefined {
    try {
        const localeService = Core.services.tryResolve(LocaleService);

        if (localeService?.onChange) {
            return localeService.onChange((newLocale) => {
                callback(newLocale as Locale);
            });
        }
    } catch {
        // LocaleService 不可用
    }
    return undefined;
}

/**
 * Hook for accessing material editor translations
 * 访问材质编辑器翻译的 Hook
 *
 * @example
 * ```tsx
 * const { t, locale } = useMaterialLocale();
 * return <button title={t('panel.saveTooltip')}>{t('panel.save')}</button>;
 * ```
 */
export function useMaterialLocale() {
    const [locale, setLocale] = useState<Locale>(() => {
        return tryGetLocaleFromService() || 'en';
    });

    useEffect(() => {
        // 初始化时获取当前语言
        const currentLocale = tryGetLocaleFromService();
        if (currentLocale) {
            setLocale(currentLocale);
        }

        // 订阅语言变化
        const unsubscribe = subscribeToLocaleChanges((newLocale) => {
            setLocale(newLocale);
        });

        return () => {
            unsubscribe?.();
        };
    }, []);

    /**
     * 翻译函数
     * Translation function
     *
     * @param key - 翻译键，如 'panel.save'
     * @param params - 插值参数
     * @param fallback - 回退文本
     */
    const t = useCallback((key: string, params?: TranslationParams, fallback?: string): string => {
        const currentTranslations = translations[locale] || translations.en;
        const value = getNestedValue(currentTranslations as Record<string, unknown>, key);

        if (value) {
            return interpolate(value, params);
        }

        // 如果当前语言没有，尝试英文
        if (locale !== 'en') {
            const enValue = getNestedValue(translations.en as Record<string, unknown>, key);
            if (enValue) {
                return interpolate(enValue, params);
            }
        }

        // 返回 fallback 或 key 本身
        return fallback || key;
    }, [locale]);

    return { t, locale, setLocale };
}

/**
 * 非 React 环境下的翻译函数
 * Translation function for non-React context
 */
export function translateMaterial(key: string, locale: Locale = 'en', params?: TranslationParams): string {
    const currentTranslations = translations[locale] || translations.en;
    const value = getNestedValue(currentTranslations as Record<string, unknown>, key);

    if (value) {
        return interpolate(value, params);
    }

    if (locale !== 'en') {
        const enValue = getNestedValue(translations.en as Record<string, unknown>, key);
        if (enValue) {
            return interpolate(enValue, params);
        }
    }

    return key;
}
