export class SettingsService {
  private static instance: SettingsService;
  private settings: Map<string, any> = new Map();
  private storageKey = 'editor-settings';

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.settings = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('[SettingsService] Failed to load settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      const data = Object.fromEntries(this.settings);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[SettingsService] Failed to save settings:', error);
    }
  }

  public get<T>(key: string, defaultValue: T): T {
    if (this.settings.has(key)) {
      return this.settings.get(key) as T;
    }
    return defaultValue;
  }

  public set<T>(key: string, value: T): void {
    this.settings.set(key, value);
    this.saveSettings();
  }

  public has(key: string): boolean {
    return this.settings.has(key);
  }

  public delete(key: string): void {
    this.settings.delete(key);
    this.saveSettings();
  }

  public clear(): void {
    this.settings.clear();
    this.saveSettings();
  }

  public getAll(): Record<string, any> {
    return Object.fromEntries(this.settings);
  }
}
