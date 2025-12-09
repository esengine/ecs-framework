/**
 * Plugin i18n Infrastructure
 * 插件国际化基础设施
 *
 * Exports utilities for plugins to create their own locale systems
 * that integrate with the central LocaleService.
 *
 * 导出供插件创建自己的本地化系统的工具，
 * 这些系统会与中央 LocaleService 集成。
 */

export {
    createPluginLocale,
    createPluginTranslator,
    getCurrentLocale,
    type Translations,
    type PluginTranslationsBundle,
    type PluginLocaleHook
} from './createPluginLocale';
