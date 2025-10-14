import type { IService } from '@esengine/ecs-framework';
import { Injectable } from '@esengine/ecs-framework';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('LocaleService');

export type Locale = 'en' | 'zh';

export interface Translations {
    [key: string]: string | Translations;
}

/**
 * 国际化服务
 *
 * 管理编辑器的多语言支持
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
     * 注册语言包
     */
    public registerTranslations(locale: Locale, translations: Translations): void {
        this.translations.set(locale, translations);
        logger.info(`Registered translations for locale: ${locale}`);
    }

    /**
     * 获取当前语言
     */
    public getCurrentLocale(): Locale {
        return this.currentLocale;
    }

    /**
     * 设置当前语言
     */
    public setLocale(locale: Locale): void {
        if (!this.translations.has(locale)) {
            logger.warn(`Translations not found for locale: ${locale}`);
            return;
        }

        this.currentLocale = locale;
        this.saveLocale(locale);

        this.changeListeners.forEach(listener => listener(locale));

        logger.info(`Locale changed to: ${locale}`);
    }

    /**
     * 翻译文本
     *
     * @param key - 翻译键，支持点分隔的路径如 "menu.file.save"
     * @param fallback - 如果找不到翻译时的回退文本
     */
    public t(key: string, fallback?: string): string {
        const translations = this.translations.get(this.currentLocale);
        if (!translations) {
            return fallback || key;
        }

        const value = this.getNestedValue(translations, key);
        if (typeof value === 'string') {
            return value;
        }

        return fallback || key;
    }

    /**
     * 监听语言变化
     */
    public onChange(listener: (locale: Locale) => void): () => void {
        this.changeListeners.add(listener);

        return () => {
            this.changeListeners.delete(listener);
        };
    }

    /**
     * 获取嵌套对象的值
     */
    private getNestedValue(obj: Translations, path: string): string | Translations | undefined {
        const keys = path.split('.');
        let current: any = obj;

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
     */
    private loadSavedLocale(): Locale | null {
        try {
            const saved = localStorage.getItem('editor-locale');
            if (saved === 'en' || saved === 'zh') {
                return saved;
            }
        } catch (error) {
            logger.warn('Failed to load saved locale:', error);
        }
        return null;
    }

    /**
     * 保存语言设置到 localStorage
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
