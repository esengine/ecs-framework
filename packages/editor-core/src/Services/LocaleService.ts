import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('LocaleService');

/**
 * 支持的语言类型
 * Supported locale types
 *
 * - en: English
 * - zh: 简体中文 (Simplified Chinese)
 * - es: Español (Spanish)
 */
export type Locale = 'en' | 'zh' | 'es';

/**
 * 语言显示信息
 * Locale display information
 */
export interface LocaleInfo {
    code: Locale;
    name: string;
    nativeName: string;
}

/**
 * 支持的语言列表
 * List of supported locales
 */
export const SUPPORTED_LOCALES: readonly LocaleInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh', name: 'Chinese', nativeName: '简体中文' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' }
] as const;

/**
 * 翻译值类型
 * Translation value type
 */
export interface Translations {
    [key: string]: string | Translations;
}

/**
 * 插件翻译包
 * Plugin translation bundle
 *
 * 用于插件注册自己的翻译
 * Used for plugins to register their own translations
 */
export interface PluginTranslations {
    en: Translations;
    zh: Translations;
    es?: Translations;
}

/**
 * 翻译参数类型
 * Translation parameters type
 */
export type TranslationParams = Record<string, string | number>;

/**
 * 国际化服务
 * Internationalization service
 *
 * 管理编辑器的多语言支持，提供翻译、语言切换和事件通知功能。
 * Manages editor's multi-language support, provides translation, locale switching and event notification.
 *
 * @example
 * ```typescript
 * // 获取服务 | Get service
 * const localeService = Core.services.resolve(LocaleService);
 *
 * // 翻译文本 | Translate text
 * localeService.t('common.save'); // "Save" or "保存"
 *
 * // 带参数的翻译 | Translation with parameters
 * localeService.t('scene.savedSuccess', { name: 'MyScene' }); // "Scene saved: MyScene"
 *
 * // 切换语言 | Switch locale
 * localeService.setLocale('zh');
 *
 * // 插件注册翻译 | Plugin register translations
 * localeService.extendTranslations('behaviorTree', {
 *     en: { title: 'Behavior Tree Editor', ... },
 *     zh: { title: '行为树编辑器', ... }
 * });
 * ```
 */
@Injectable()
export class LocaleService implements IService {
    private currentLocale: Locale = 'en';
    private translations: Map<Locale, Translations> = new Map();
    private changeListeners: Set<(locale: Locale) => void> = new Set();

    constructor() {
        const savedLocale = this.loadSavedLocale();
        if (savedLocale) {
            this.currentLocale = savedLocale;
        }
    }

    /**
     * 注册核心语言包（覆盖式）
     * Register core translations (overwrites existing)
     *
     * 用于编辑器核心初始化时注册基础翻译
     * Used for editor core to register base translations during initialization
     *
     * @param locale - 语言代码 | Locale code
     * @param translations - 翻译对象 | Translation object
     */
    public registerTranslations(locale: Locale, translations: Translations): void {
        this.translations.set(locale, translations);
        logger.info(`Registered translations for locale: ${locale}`);
    }

    /**
     * 扩展语言包（合并式）
     * Extend translations (merges with existing)
     *
     * 用于插件注册自己的翻译，会合并到现有翻译中
     * Used for plugins to register their translations, merges with existing
     *
     * @param namespace - 命名空间，如 'behaviorTree' | Namespace, e.g. 'behaviorTree'
     * @param pluginTranslations - 插件翻译包 | Plugin translation bundle
     *
     * @example
     * ```typescript
     * // 在插件的 editorModule.install() 中调用
     * // Call in plugin's editorModule.install()
     * localeService.extendTranslations('behaviorTree', {
     *     en: {
     *         title: 'Behavior Tree Editor',
     *         nodePalette: 'Node Palette',
     *         // ...
     *     },
     *     zh: {
     *         title: '行为树编辑器',
     *         nodePalette: '节点面板',
     *         // ...
     *     }
     * });
     *
     * // 然后在组件中使用
     * // Then use in components
     * t('behaviorTree.title') // "Behavior Tree Editor" or "行为树编辑器"
     * ```
     */
    public extendTranslations(namespace: string, pluginTranslations: PluginTranslations): void {
        const locales: Locale[] = ['en', 'zh', 'es'];

        for (const locale of locales) {
            const existing = this.translations.get(locale) || {};
            const pluginTrans = pluginTranslations[locale];

            if (pluginTrans) {
                // 深度合并到命名空间下 | Deep merge under namespace
                const merged = {
                    ...existing,
                    [namespace]: this.deepMerge(
                        (existing[namespace] as Translations) || {},
                        pluginTrans
                    )
                };
                this.translations.set(locale, merged);
            }
        }

        logger.info(`Extended translations for namespace: ${namespace}`);
    }

    /**
     * 深度合并两个翻译对象
     * Deep merge two translation objects
     */
    private deepMerge(target: Translations, source: Translations): Translations {
        const result: Translations = { ...target };

        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (
                typeof sourceValue === 'object' &&
                sourceValue !== null &&
                typeof targetValue === 'object' &&
                targetValue !== null
            ) {
                result[key] = this.deepMerge(
                    targetValue as Translations,
                    sourceValue as Translations
                );
            } else {
                result[key] = sourceValue;
            }
        }

        return result;
    }

    /**
     * 获取当前语言
     * Get current locale
     */
    public getCurrentLocale(): Locale {
        return this.currentLocale;
    }

    /**
     * 获取支持的语言列表
     * Get list of supported locales
     */
    public getSupportedLocales(): readonly LocaleInfo[] {
        return SUPPORTED_LOCALES;
    }

    /**
     * 设置当前语言
     * Set current locale
     *
     * @param locale - 目标语言代码 | Target locale code
     */
    public setLocale(locale: Locale): void {
        if (!this.translations.has(locale)) {
            logger.warn(`Translations not found for locale: ${locale}`);
            return;
        }

        this.currentLocale = locale;
        this.saveLocale(locale);

        this.changeListeners.forEach((listener) => listener(locale));

        logger.info(`Locale changed to: ${locale}`);
    }

    /**
     * 翻译文本
     * Translate text
     *
     * @param key - 翻译键，支持点分隔的路径 | Translation key, supports dot-separated paths
     * @param params - 可选的参数对象，用于替换模板中的占位符 {{key}} | Optional params for placeholder substitution
     * @param fallback - 如果找不到翻译时的回退文本 | Fallback text if translation not found
     *
     * @example
     * ```typescript
     * // 简单翻译 | Simple translation
     * t('common.save') // "Save"
     *
     * // 带参数替换 | With parameter substitution
     * t('scene.savedSuccess', { name: 'MyScene' }) // "Scene saved: MyScene"
     *
     * // 插件翻译 | Plugin translation
     * t('behaviorTree.title') // "Behavior Tree Editor"
     *
     * // 带回退文本 | With fallback
     * t('unknown.key', undefined, 'Default Text') // "Default Text"
     * ```
     */
    public t(key: string, params?: TranslationParams, fallback?: string): string {
        const translations = this.translations.get(this.currentLocale);
        if (!translations) {
            return fallback || key;
        }

        const value = this.getNestedValue(translations, key);
        if (typeof value === 'string') {
            // 支持参数替换 {{key}} | Support parameter substitution {{key}}
            if (params) {
                return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
                    return String(params[paramKey] ?? `{{${paramKey}}}`);
                });
            }
            return value;
        }

        return fallback || key;
    }

    /**
     * 监听语言变化
     * Listen to locale changes
     *
     * @param listener - 回调函数 | Callback function
     * @returns 取消订阅函数 | Unsubscribe function
     */
    public onChange(listener: (locale: Locale) => void): () => void {
        this.changeListeners.add(listener);

        return () => {
            this.changeListeners.delete(listener);
        };
    }

    /**
     * 检查翻译键是否存在
     * Check if a translation key exists
     *
     * @param key - 翻译键 | Translation key
     * @param locale - 可选的语言代码，默认使用当前语言 | Optional locale, defaults to current
     */
    public hasKey(key: string, locale?: Locale): boolean {
        const targetLocale = locale || this.currentLocale;
        const translations = this.translations.get(targetLocale);
        if (!translations) {
            return false;
        }
        const value = this.getNestedValue(translations, key);
        return typeof value === 'string';
    }

    /**
     * 获取嵌套对象的值
     * Get nested object value
     */
    private getNestedValue(obj: Translations, path: string): string | Translations | undefined {
        const keys = path.split('.');
        let current: string | Translations | undefined = obj;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * 从 localStorage 加载保存的语言设置
     * Load saved locale from localStorage
     */
    private loadSavedLocale(): Locale | null {
        try {
            const saved = localStorage.getItem('editor-locale');
            if (saved === 'en' || saved === 'zh' || saved === 'es') {
                return saved;
            }
        } catch (error) {
            logger.warn('Failed to load saved locale:', error);
        }
        return null;
    }

    /**
     * 保存语言设置到 localStorage
     * Save locale to localStorage
     */
    private saveLocale(locale: Locale): void {
        try {
            localStorage.setItem('editor-locale', locale);
        } catch (error) {
            logger.warn('Failed to save locale:', error);
        }
    }

    public dispose(): void {
        this.translations.clear();
        this.changeListeners.clear();
        logger.info('LocaleService disposed');
    }
}
