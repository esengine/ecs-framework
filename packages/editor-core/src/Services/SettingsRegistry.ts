import { Injectable, IService } from '@esengine/ecs-framework';

export type SettingType = 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range' | 'pluginList' | 'collisionMatrix' | 'moduleList';

/**
 * Localizable text - can be a plain string or a translation key (prefixed with '$')
 * 可本地化文本 - 可以是普通字符串或翻译键（以 '$' 为前缀）
 *
 * @example
 * // Plain text (not recommended for user-facing strings)
 * title: 'Appearance'
 *
 * // Translation key (recommended)
 * title: '$pluginSettings.appearance.title'
 */
export type LocalizableText = string;

/**
 * Check if text is a translation key (starts with '$')
 * 检查文本是否为翻译键（以 '$' 开头）
 */
export function isTranslationKey(text: string): boolean {
    return text.startsWith('$');
}

/**
 * Get the actual translation key (without '$' prefix)
 * 获取实际的翻译键（去掉 '$' 前缀）
 */
export function getTranslationKey(text: string): string {
    return text.startsWith('$') ? text.slice(1) : text;
}

export interface SettingOption {
  label: LocalizableText;
  value: any;
}

export interface SettingValidator {
  validate: (value: any) => boolean;
  errorMessage: LocalizableText;
}

export interface SettingDescriptor {
  key: string;
  /** Label text or translation key (prefixed with '$') | 标签文本或翻译键（以 '$' 为前缀） */
  label: LocalizableText;
  type: SettingType;
  defaultValue: any;
  /** Description text or translation key (prefixed with '$') | 描述文本或翻译键（以 '$' 为前缀） */
  description?: LocalizableText;
  /** Placeholder text or translation key (prefixed with '$') | 占位符文本或翻译键（以 '$' 为前缀） */
  placeholder?: LocalizableText;
  options?: SettingOption[];
  validator?: SettingValidator;
  min?: number;
  max?: number;
  step?: number;
  /**
   * Custom renderer component (for complex types like collisionMatrix)
   * 自定义渲染器组件（用于 collisionMatrix 等复杂类型）
   */
  customRenderer?: React.ComponentType<any>;
}

export interface SettingSection {
  id: string;
  /** Title text or translation key (prefixed with '$') | 标题文本或翻译键（以 '$' 为前缀） */
  title: LocalizableText;
  /** Description text or translation key (prefixed with '$') | 描述文本或翻译键（以 '$' 为前缀） */
  description?: LocalizableText;
  icon?: string;
  settings: SettingDescriptor[];
}

export interface SettingCategory {
  id: string;
  /** Title text or translation key (prefixed with '$') | 标题文本或翻译键（以 '$' 为前缀） */
  title: LocalizableText;
  /** Description text or translation key (prefixed with '$') | 描述文本或翻译键（以 '$' 为前缀） */
  description?: LocalizableText;
  sections: SettingSection[];
}

@Injectable()
export class SettingsRegistry implements IService {
    private categories: Map<string, SettingCategory> = new Map();

    public dispose(): void {
        this.categories.clear();
    }

    public registerCategory(category: SettingCategory): void {
        if (this.categories.has(category.id)) {
            console.warn(`[SettingsRegistry] Category ${category.id} already registered, overwriting`);
        }
        console.log(`[SettingsRegistry] Registering category: ${category.id} (${category.title}), sections: ${category.sections.map(s => s.id).join(', ')}`);
        this.categories.set(category.id, category);
    }

    public registerSection(categoryId: string, section: SettingSection): void {
        let category = this.categories.get(categoryId);

        if (!category) {
            category = {
                id: categoryId,
                title: categoryId,
                sections: []
            };
            this.categories.set(categoryId, category);
        }

        const existingIndex = category.sections.findIndex((s) => s.id === section.id);
        if (existingIndex >= 0) {
            category.sections[existingIndex] = section;
            console.warn(`[SettingsRegistry] Section ${section.id} in category ${categoryId} already exists, overwriting`);
        } else {
            category.sections.push(section);
        }
    }

    public registerSetting(categoryId: string, sectionId: string, setting: SettingDescriptor): void {
        let category = this.categories.get(categoryId);

        if (!category) {
            category = {
                id: categoryId,
                title: categoryId,
                sections: []
            };
            this.categories.set(categoryId, category);
        }

        let section = category.sections.find((s) => s.id === sectionId);
        if (!section) {
            section = {
                id: sectionId,
                title: sectionId,
                settings: []
            };
            category.sections.push(section);
        }

        const existingIndex = section.settings.findIndex((s) => s.key === setting.key);
        if (existingIndex >= 0) {
            section.settings[existingIndex] = setting;
            console.warn(`[SettingsRegistry] Setting ${setting.key} in section ${sectionId} already exists, overwriting`);
        } else {
            section.settings.push(setting);
        }
    }

    public unregisterCategory(categoryId: string): void {
        this.categories.delete(categoryId);
    }

    public unregisterSection(categoryId: string, sectionId: string): void {
        const category = this.categories.get(categoryId);
        if (category) {
            category.sections = category.sections.filter((s) => s.id !== sectionId);
            if (category.sections.length === 0) {
                this.categories.delete(categoryId);
            }
        }
    }

    public getCategory(categoryId: string): SettingCategory | undefined {
        return this.categories.get(categoryId);
    }

    public getAllCategories(): SettingCategory[] {
        return Array.from(this.categories.values());
    }

    public getSetting(categoryId: string, sectionId: string, key: string): SettingDescriptor | undefined {
        const category = this.categories.get(categoryId);
        if (!category) return undefined;

        const section = category.sections.find((s) => s.id === sectionId);
        if (!section) return undefined;

        return section.settings.find((s) => s.key === key);
    }

    public getAllSettings(): Map<string, SettingDescriptor> {
        const allSettings = new Map<string, SettingDescriptor>();

        for (const category of this.categories.values()) {
            for (const section of category.sections) {
                for (const setting of section.settings) {
                    allSettings.set(setting.key, setting);
                }
            }
        }

        return allSettings;
    }

    public validateSetting(setting: SettingDescriptor, value: any): boolean {
        if (setting.validator) {
            return setting.validator.validate(value);
        }

        switch (setting.type) {
            case 'number':
                if (typeof value !== 'number') return false;
                if (setting.min !== undefined && value < setting.min) return false;
                if (setting.max !== undefined && value > setting.max) return false;
                return true;

            case 'boolean':
                return typeof value === 'boolean';

            case 'string':
                return typeof value === 'string';

            case 'select':
                if (!setting.options) return false;
                return setting.options.some((opt) => opt.value === value);

            case 'range':
                if (typeof value !== 'number') return false;
                if (setting.min !== undefined && value < setting.min) return false;
                if (setting.max !== undefined && value > setting.max) return false;
                return true;

            case 'color':
                return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);

            default:
                return true;
        }
    }
}
