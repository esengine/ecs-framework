import { Injectable, IService } from '@esengine/ecs-framework';

export type SettingType = 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range';

export interface SettingOption {
  label: string;
  value: any;
}

export interface SettingValidator {
  validate: (value: any) => boolean;
  errorMessage: string;
}

export interface SettingDescriptor {
  key: string;
  label: string;
  type: SettingType;
  defaultValue: any;
  description?: string;
  placeholder?: string;
  options?: SettingOption[];
  validator?: SettingValidator;
  min?: number;
  max?: number;
  step?: number;
}

export interface SettingSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  settings: SettingDescriptor[];
}

export interface SettingCategory {
  id: string;
  title: string;
  description?: string;
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

    const existingIndex = category.sections.findIndex(s => s.id === section.id);
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

    let section = category.sections.find(s => s.id === sectionId);
    if (!section) {
      section = {
        id: sectionId,
        title: sectionId,
        settings: []
      };
      category.sections.push(section);
    }

    const existingIndex = section.settings.findIndex(s => s.key === setting.key);
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
      category.sections = category.sections.filter(s => s.id !== sectionId);
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

    const section = category.sections.find(s => s.id === sectionId);
    if (!section) return undefined;

    return section.settings.find(s => s.key === key);
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
        return setting.options.some(opt => opt.value === value);

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
