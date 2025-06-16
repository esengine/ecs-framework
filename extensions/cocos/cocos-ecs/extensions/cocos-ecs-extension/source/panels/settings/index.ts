import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent, ref, onMounted, reactive } from 'vue';
import * as fs from 'fs';
import * as path from 'path';

const panelDataMap = new WeakMap<any, App>();

/**
 * ECS框架设置配置接口
 */
interface ECSSettings {
    // 代码生成设置
    codeGeneration: {
        template: 'typescript' | 'javascript';
        useStrictMode: boolean;
        generateComments: boolean;
        generateImports: boolean;
        componentSuffix: string;
        systemSuffix: string;
        indentStyle: 'spaces' | 'tabs';
        indentSize: number;
    };
    
    // 性能监控设置
    performance: {
        enableMonitoring: boolean;
        warningThreshold: number; // 执行时间警告阈值(ms)
        criticalThreshold: number; // 执行时间严重阈值(ms)
        memoryWarningMB: number; // 内存警告阈值(MB)
        memoryCriticalMB: number; // 内存严重阈值(MB)
        maxRecentSamples: number; // 性能采样数量
        enableFpsMonitoring: boolean;
        targetFps: number;
    };
    
    // 调试设置
    debugging: {
        enableDebugMode: boolean;
        showEntityCount: boolean;
        showSystemExecutionTime: boolean;
        enablePerformanceWarnings: boolean;
        logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
        enableDetailedLogs: boolean;
    };
    
    // 编辑器集成
    editor: {
        autoRefreshAssets: boolean;
        showWelcomePanelOnStartup: boolean;
        enableAutoUpdates: boolean;
        updateChannel: 'stable' | 'beta' | 'alpha';
        enableNotifications: boolean;
    };
    
    // 项目模板设置
    template: {
        defaultEntityName: string;
        defaultComponentName: string;
        defaultSystemName: string;
        createExampleFiles: boolean;
        includeDocumentation: boolean;
        useFactoryPattern: boolean;
    };
    
    // 事件系统设置
    events: {
        enableEventSystem: boolean;
        defaultEventPriority: number;
        enableAsyncEvents: boolean;
        enableEventBatching: boolean;
        batchSize: number;
        batchDelay: number; // ms
        maxEventListeners: number;
    };
}

/**
 * 默认设置
 */
const defaultSettings: ECSSettings = {
    codeGeneration: {
        template: 'typescript',
        useStrictMode: true,
        generateComments: true,
        generateImports: true,
        componentSuffix: 'Component',
        systemSuffix: 'System',
        indentStyle: 'spaces',
        indentSize: 4
    },
    performance: {
        enableMonitoring: true,
        warningThreshold: 16.67, // 60fps
        criticalThreshold: 33.33, // 30fps
        memoryWarningMB: 100,
        memoryCriticalMB: 200,
        maxRecentSamples: 60,
        enableFpsMonitoring: true,
        targetFps: 60
    },
    debugging: {
        enableDebugMode: true,
        showEntityCount: true,
        showSystemExecutionTime: true,
        enablePerformanceWarnings: true,
        logLevel: 'info',
        enableDetailedLogs: false
    },
    editor: {
        autoRefreshAssets: true,
        showWelcomePanelOnStartup: true,
        enableAutoUpdates: false,
        updateChannel: 'stable',
        enableNotifications: true
    },
    template: {
        defaultEntityName: 'GameEntity',
        defaultComponentName: 'CustomComponent',
        defaultSystemName: 'CustomSystem',
        createExampleFiles: true,
        includeDocumentation: true,
        useFactoryPattern: true
    },
    events: {
        enableEventSystem: true,
        defaultEventPriority: 0,
        enableAsyncEvents: true,
        enableEventBatching: false,
        batchSize: 10,
        batchDelay: 16,
        maxEventListeners: 100
    }
};

/**
 * 获取设置文件路径
 */
function getSettingsPath(): string {
    const projectPath = Editor.Project.path;
    return path.join(projectPath, '.ecs-framework-settings.json');
}

/**
 * 加载设置
 */
function loadSettings(): ECSSettings {
    try {
        const settingsPath = getSettingsPath();
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf-8');
            const loadedSettings = JSON.parse(data);
            // 合并默认设置，确保所有字段都存在
            return deepMerge(defaultSettings, loadedSettings);
        }
    } catch (error) {
        console.warn('Failed to load ECS settings:', error);
    }
    return JSON.parse(JSON.stringify(defaultSettings));
}

/**
 * 保存设置
 */
function saveSettings(settings: ECSSettings): boolean {
    try {
        const settingsPath = getSettingsPath();
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Failed to save ECS settings:', error);
        return false;
    }
}

/**
 * 深度合并对象
 */
function deepMerge(target: any, source: any): any {
    if (source === null || typeof source !== 'object') return source;
    if (target === null || typeof target !== 'object') return source;
    
    const result = { ...target };
    
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    
    return result;
}

/**
 * 重置为默认设置
 */
function resetToDefaults(): ECSSettings {
    return JSON.parse(JSON.stringify(defaultSettings));
}

module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('ECS Settings Panel Show'); },
        hide() { console.log('ECS Settings Panel Hide'); },
    },
    template: `<div id="app"></div>`,
    style: readFileSync(join(__dirname, '../../../static/style/settings/index.css'), 'utf-8'),
    $: {
        app: '#app',
    },
    ready() {
        if (this.$.app) {
            // 不要直接设置HTML内容，让Vue来处理
            const app = createApp(defineComponent({
                setup() {
                    const settings = reactive(loadSettings());
                    const isDirty = ref(false);
                    const saving = ref(false);
                    const lastSaved = ref('');
                    
                    // 监听设置变化
                    const markDirty = () => {
                        isDirty.value = true;
                    };
                    
                    // 保存设置
                    const saveCurrentSettings = async () => {
                        saving.value = true;
                        try {
                            const success = saveSettings(settings);
                            if (success) {
                                isDirty.value = false;
                                lastSaved.value = new Date().toLocaleTimeString();
                                
                                // 通知主进程设置已更新
                                Editor.Message.send('cocos-ecs-extension', 'settings-updated', settings);
                                
                                Editor.Dialog.info('设置保存', {
                                    detail: '✅ ECS框架设置已成功保存！',
                                });
                            } else {
                                Editor.Dialog.error('保存失败', {
                                    detail: '❌ 保存设置时发生错误，请检查文件权限。',
                                });
                            }
                        } catch (error) {
                            console.error('Save settings error:', error);
                            Editor.Dialog.error('保存失败', {
                                detail: `❌ 保存设置时发生错误：\n\n${error}`,
                            });
                        } finally {
                            saving.value = false;
                        }
                    };
                    
                    // 重置设置
                    const resetSettings = () => {
                        Editor.Dialog.warn('重置设置', {
                            detail: '⚠️  您确定要重置所有设置为默认值吗？\n\n此操作无法撤销。',
                            buttons: ['重置', '取消'],
                        }).then((result: any) => {
                            if (result.response === 0) {
                                const defaults = resetToDefaults();
                                Object.assign(settings, defaults);
                                isDirty.value = true;
                                
                                Editor.Dialog.info('设置重置', {
                                    detail: '✅ 设置已重置为默认值，请点击保存按钮确认更改。',
                                });
                            }
                        });
                    };
                    
                    // 导出设置
                    const exportSettings = () => {
                        try {
                            const dataStr = JSON.stringify(settings, null, 2);
                            const blob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            
                            // 创建下载链接
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'ecs-framework-settings.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            Editor.Dialog.info('导出成功', {
                                detail: '✅ 设置已导出到下载文件夹。',
                            });
                        } catch (error) {
                            console.error('Export settings error:', error);
                            Editor.Dialog.error('导出失败', {
                                detail: `❌ 导出设置时发生错误：\n\n${error}`,
                            });
                        }
                    };
                    
                    // 导入设置
                    const importSettings = () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.style.display = 'none';
                        
                        input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                try {
                                    const importedSettings = JSON.parse(event.target?.result as string);
                                    const mergedSettings = deepMerge(defaultSettings, importedSettings);
                                    Object.assign(settings, mergedSettings);
                                    isDirty.value = true;
                                    
                                    Editor.Dialog.info('导入成功', {
                                        detail: '✅ 设置已导入，请检查并保存。',
                                    });
                                } catch (error) {
                                    console.error('Import settings error:', error);
                                    Editor.Dialog.error('导入失败', {
                                        detail: `❌ 导入设置文件时发生错误：\n\n${error}\n\n请确保文件格式正确。`,
                                    });
                                }
                            };
                            reader.readAsText(file);
                        };
                        
                        document.body.appendChild(input);
                        input.click();
                        document.body.removeChild(input);
                    };
                    
                    return {
                        settings,
                        isDirty,
                        saving,
                        lastSaved,
                        markDirty,
                        saveCurrentSettings,
                        resetSettings,
                        exportSettings,
                        importSettings
                    };
                },
                template: readFileSync(join(__dirname, '../../../static/template/settings/index.html'), 'utf-8'),
            }));

            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
            panelDataMap.delete(this);
        }
    },
}); 