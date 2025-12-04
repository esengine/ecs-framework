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

    public getRecentProjects(): string[] {
        return this.get<string[]>('recentProjects', []);
    }

    public addRecentProject(projectPath: string): void {
        // 规范化路径，防止双重转义 | Normalize path to prevent double escaping
        const normalizedPath = projectPath.replace(/\\\\/g, '\\');
        const recentProjects = this.getRecentProjects();
        const filtered = recentProjects.filter((p) => p !== normalizedPath);
        const updated = [normalizedPath, ...filtered].slice(0, 10);
        this.set('recentProjects', updated);
    }

    public removeRecentProject(projectPath: string): void {
        const recentProjects = this.getRecentProjects();
        const filtered = recentProjects.filter((p) => p !== projectPath);
        this.set('recentProjects', filtered);
    }

    public clearRecentProjects(): void {
        this.set('recentProjects', []);
    }

    // ==================== Script Editor Settings ====================

    /**
     * 支持的脚本编辑器类型
     * Supported script editor types
     */
    public static readonly SCRIPT_EDITORS = [
        { id: 'system', name: 'System Default', nameZh: '系统默认', command: '' },
        { id: 'vscode', name: 'Visual Studio Code', nameZh: 'Visual Studio Code', command: 'code' },
        { id: 'cursor', name: 'Cursor', nameZh: 'Cursor', command: 'cursor' },
        { id: 'webstorm', name: 'WebStorm', nameZh: 'WebStorm', command: 'webstorm' },
        { id: 'sublime', name: 'Sublime Text', nameZh: 'Sublime Text', command: 'subl' },
        { id: 'custom', name: 'Custom', nameZh: '自定义', command: '' }
    ];

    /**
     * 获取脚本编辑器设置
     * Get script editor setting
     */
    public getScriptEditor(): string {
        return this.get<string>('editor.scriptEditor', 'system');
    }

    /**
     * 设置脚本编辑器
     * Set script editor
     */
    public setScriptEditor(editorId: string): void {
        this.set('editor.scriptEditor', editorId);
    }

    /**
     * 获取自定义脚本编辑器命令
     * Get custom script editor command
     */
    public getCustomScriptEditorCommand(): string {
        return this.get<string>('editor.customScriptEditorCommand', '');
    }

    /**
     * 设置自定义脚本编辑器命令
     * Set custom script editor command
     */
    public setCustomScriptEditorCommand(command: string): void {
        this.set('editor.customScriptEditorCommand', command);
    }

    /**
     * 获取当前脚本编辑器的命令
     * Get current script editor command
     */
    public getScriptEditorCommand(): string {
        const editorId = this.getScriptEditor();
        if (editorId === 'custom') {
            return this.getCustomScriptEditorCommand();
        }
        const editor = SettingsService.SCRIPT_EDITORS.find(e => e.id === editorId);
        return editor?.command || '';
    }
}
