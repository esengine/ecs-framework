/**
 * Settings Window - 设置窗口
 * 重新设计以匹配编辑器设计稿
 */

import { useState, useEffect, useMemo } from 'react';
import {
    X,
    Search,
    Settings as SettingsIcon,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { SettingsService } from '../services/SettingsService';
import { SettingsRegistry, SettingCategory, SettingDescriptor, ProjectService, PluginManager, IPluginManager, ModuleManifest } from '@esengine/editor-core';
import { PluginListSetting } from './PluginListSetting';
import { ModuleListSetting } from './ModuleListSetting';
import '../styles/SettingsWindow.css';

interface SettingsWindowProps {
    onClose: () => void;
    settingsRegistry: SettingsRegistry;
    initialCategoryId?: string;
}

// 主分类结构
interface MainCategory {
    id: string;
    title: string;
    subCategories: SettingCategory[];
}

export function SettingsWindow({ onClose, settingsRegistry, initialCategoryId }: SettingsWindowProps) {
    const [categories, setCategories] = useState<SettingCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId || null);
    const [values, setValues] = useState<Map<string, any>>(new Map());
    const [errors, setErrors] = useState<Map<string, string>>(new Map());
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [expandedMainCategories, setExpandedMainCategories] = useState<Set<string>>(new Set(['通用']));

    // 将分类组织成主分类和子分类
    const mainCategories = useMemo((): MainCategory[] => {
        const categoryMap = new Map<string, SettingCategory[]>();

        // 定义主分类映射
        const mainCategoryMapping: Record<string, string> = {
            'appearance': '通用',
            'general': '通用',
            'project': '通用',
            'plugins': '通用',
            'editor': '通用',
            'physics': '全局',
            'rendering': '全局',
            'audio': '全局',
            'world': '世界分区',
            'local': '世界分区（本地）',
            'performance': '性能'
        };

        categories.forEach((cat) => {
            const mainCatName = mainCategoryMapping[cat.id] || '其他';
            if (!categoryMap.has(mainCatName)) {
                categoryMap.set(mainCatName, []);
            }
            categoryMap.get(mainCatName)!.push(cat);
        });

        // 定义固定的主分类顺序
        const orderedMainCategories = [
            '通用',
            '全局',
            '世界分区',
            '世界分区（本地）',
            '性能',
            '其他'
        ];

        return orderedMainCategories
            .filter((name) => categoryMap.has(name))
            .map((name) => ({
                id: name,
                title: name,
                subCategories: categoryMap.get(name)!
            }));
    }, [categories]);

    // 获取显示的子分类标题
    const subCategoryTitle = useMemo(() => {
        if (!selectedCategoryId) return '';
        const cat = categories.find((c) => c.id === selectedCategoryId);
        return cat?.title || '';
    }, [categories, selectedCategoryId]);

    // 获取主分类标题
    const mainCategoryTitle = useMemo(() => {
        for (const main of mainCategories) {
            if (main.subCategories.some((sub) => sub.id === selectedCategoryId)) {
                return main.title;
            }
        }
        return '';
    }, [mainCategories, selectedCategoryId]);

    useEffect(() => {
        const allCategories = settingsRegistry.getAllCategories();
        setCategories(allCategories);

        // 默认展开所有section
        const allSectionIds = new Set<string>();
        allCategories.forEach((cat) => {
            cat.sections.forEach((section) => {
                allSectionIds.add(`${cat.id}-${section.id}`);
            });
        });
        setExpandedSections(allSectionIds);

        if (allCategories.length > 0 && !selectedCategoryId) {
            if (initialCategoryId && allCategories.some((c) => c.id === initialCategoryId)) {
                setSelectedCategoryId(initialCategoryId);
            } else {
                const firstCategory = allCategories[0];
                if (firstCategory) {
                    setSelectedCategoryId(firstCategory.id);
                }
            }
        }

        const settings = SettingsService.getInstance();
        const projectService = Core.services.tryResolve<ProjectService>(ProjectService);
        const allSettings = settingsRegistry.getAllSettings();
        const initialValues = new Map<string, any>();

        for (const [key, descriptor] of allSettings.entries()) {
            if (key.startsWith('project.') && projectService) {
                if (key === 'project.uiDesignResolution.width') {
                    const resolution = projectService.getUIDesignResolution();
                    initialValues.set(key, resolution.width);
                } else if (key === 'project.uiDesignResolution.height') {
                    const resolution = projectService.getUIDesignResolution();
                    initialValues.set(key, resolution.height);
                } else if (key === 'project.uiDesignResolution.preset') {
                    const resolution = projectService.getUIDesignResolution();
                    initialValues.set(key, `${resolution.width}x${resolution.height}`);
                } else if (key === 'project.disabledModules') {
                    // Load disabled modules from ProjectService
                    initialValues.set(key, projectService.getDisabledModules());
                } else {
                    initialValues.set(key, descriptor.defaultValue);
                }
            } else {
                const value = settings.get(key, descriptor.defaultValue);
                initialValues.set(key, value);
                if (key.startsWith('profiler.')) {
                    console.log(`[SettingsWindow] Loading ${key}: stored=${settings.get(key, undefined)}, default=${descriptor.defaultValue}, using=${value}`);
                }
            }
        }

        console.log('[SettingsWindow] Initial values for profiler:',
            Array.from(initialValues.entries()).filter(([k]) => k.startsWith('profiler.')));
        setValues(initialValues);
    }, [settingsRegistry, initialCategoryId]);

    const handleValueChange = (key: string, value: any, descriptor: SettingDescriptor) => {
        const newValues = new Map(values);
        newValues.set(key, value);
        setValues(newValues);

        const newErrors = new Map(errors);
        if (!settingsRegistry.validateSetting(descriptor, value)) {
            newErrors.set(key, descriptor.validator?.errorMessage || '无效值');
            setErrors(newErrors);
            return; // 验证失败，不保存
        } else {
            newErrors.delete(key);
        }
        setErrors(newErrors);

        // 实时保存设置
        const settings = SettingsService.getInstance();
        if (!key.startsWith('project.')) {
            settings.set(key, value);
            console.log(`[SettingsWindow] Saved ${key}:`, value);

            // 触发设置变更事件
            window.dispatchEvent(new CustomEvent('settings:changed', {
                detail: { [key]: value }
            }));
        }
    };

    const handleSave = async () => {
        if (errors.size > 0) {
            return;
        }

        const settings = SettingsService.getInstance();
        const projectService = Core.services.tryResolve<ProjectService>(ProjectService);
        const changedSettings: Record<string, any> = {};

        let uiResolutionChanged = false;
        let newWidth = 1920;
        let newHeight = 1080;
        let disabledModulesChanged = false;
        let newDisabledModules: string[] = [];

        for (const [key, value] of values.entries()) {
            if (key.startsWith('project.') && projectService) {
                if (key === 'project.uiDesignResolution.width') {
                    newWidth = value;
                    uiResolutionChanged = true;
                } else if (key === 'project.uiDesignResolution.height') {
                    newHeight = value;
                    uiResolutionChanged = true;
                } else if (key === 'project.uiDesignResolution.preset') {
                    const [w, h] = value.split('x').map(Number);
                    if (w && h) {
                        newWidth = w;
                        newHeight = h;
                        uiResolutionChanged = true;
                    }
                } else if (key === 'project.disabledModules') {
                    newDisabledModules = value as string[];
                    disabledModulesChanged = true;
                }
                changedSettings[key] = value;
            } else {
                settings.set(key, value);
                changedSettings[key] = value;
            }
        }

        if (uiResolutionChanged && projectService) {
            await projectService.setUIDesignResolution({ width: newWidth, height: newHeight });
        }

        if (disabledModulesChanged && projectService) {
            await projectService.setDisabledModules(newDisabledModules);
        }

        console.log('[SettingsWindow] Saving settings, changedSettings:', changedSettings);
        window.dispatchEvent(new CustomEvent('settings:changed', {
            detail: changedSettings
        }));

        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const handleResetToDefault = () => {
        const allSettings = settingsRegistry.getAllSettings();
        const defaultValues = new Map<string, any>();
        for (const [key, descriptor] of allSettings.entries()) {
            defaultValues.set(key, descriptor.defaultValue);
        }
        setValues(defaultValues);
    };

    const handleExport = () => {
        const exportData: Record<string, any> = {};
        for (const [key, value] of values.entries()) {
            exportData[key] = value;
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'editor-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                const newValues = new Map(values);
                for (const [key, value] of Object.entries(importData)) {
                    newValues.set(key, value);
                }
                setValues(newValues);
            } catch (err) {
                console.error('Failed to import settings:', err);
            }
        };
        input.click();
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const toggleMainCategory = (categoryId: string) => {
        setExpandedMainCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const renderSettingInput = (setting: SettingDescriptor) => {
        const value = values.get(setting.key) ?? setting.defaultValue;
        const error = errors.get(setting.key);

        switch (setting.type) {
            case 'boolean':
                return (
                    <div className="settings-row">
                        <div className="settings-row-label">
                            {setting.description && (
                                <ChevronRight size={12} className="settings-row-expand" />
                            )}
                            <span>{setting.label}</span>
                        </div>
                        <div className="settings-row-value">
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={value}
                                onChange={(e) => handleValueChange(setting.key, e.target.checked, setting)}
                            />
                        </div>
                    </div>
                );

            case 'number':
                return (
                    <div className="settings-row">
                        <div className="settings-row-label">
                            {setting.description && (
                                <ChevronRight size={12} className="settings-row-expand" />
                            )}
                            <span>{setting.label}</span>
                        </div>
                        <div className="settings-row-value">
                            <input
                                type="number"
                                className={`settings-number-input ${error ? 'error' : ''}`}
                                value={value}
                                onChange={(e) => handleValueChange(setting.key, parseInt(e.target.value) || 0, setting)}
                                placeholder={setting.placeholder}
                                min={setting.min}
                                max={setting.max}
                                step={setting.step}
                            />
                        </div>
                    </div>
                );

            case 'string':
                return (
                    <div className="settings-row">
                        <div className="settings-row-label">
                            {setting.description && (
                                <ChevronRight size={12} className="settings-row-expand" />
                            )}
                            <span>{setting.label}</span>
                        </div>
                        <div className="settings-row-value">
                            <input
                                type="text"
                                className={`settings-text-input ${error ? 'error' : ''}`}
                                value={value}
                                onChange={(e) => handleValueChange(setting.key, e.target.value, setting)}
                                placeholder={setting.placeholder}
                            />
                        </div>
                    </div>
                );

            case 'select':
                return (
                    <div className="settings-row">
                        <div className="settings-row-label">
                            {setting.description && (
                                <ChevronRight size={12} className="settings-row-expand" />
                            )}
                            <span>{setting.label}</span>
                        </div>
                        <div className="settings-row-value">
                            <select
                                className={`settings-select ${error ? 'error' : ''}`}
                                value={value}
                                onChange={(e) => {
                                    const option = setting.options?.find((opt) => String(opt.value) === e.target.value);
                                    if (option) {
                                        handleValueChange(setting.key, option.value, setting);
                                    }
                                }}
                            >
                                {setting.options?.map((option) => (
                                    <option key={String(option.value)} value={String(option.value)}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            case 'range':
                return (
                    <div className="settings-row">
                        <div className="settings-row-label">
                            {setting.description && (
                                <ChevronRight size={12} className="settings-row-expand" />
                            )}
                            <span>{setting.label}</span>
                        </div>
                        <div className="settings-row-value">
                            <input
                                type="range"
                                className="settings-range"
                                value={value}
                                onChange={(e) => handleValueChange(setting.key, parseFloat(e.target.value), setting)}
                                min={setting.min}
                                max={setting.max}
                                step={setting.step}
                            />
                            <span className="settings-range-value">{value}</span>
                        </div>
                    </div>
                );

            case 'color':
                return (
                    <div className="settings-row">
                        <div className="settings-row-label">
                            {setting.description && (
                                <ChevronRight size={12} className="settings-row-expand" />
                            )}
                            <span>{setting.label}</span>
                        </div>
                        <div className="settings-row-value">
                            <div className="settings-color-bar" style={{ backgroundColor: value }}>
                                <input
                                    type="color"
                                    className="settings-color-input"
                                    value={value}
                                    onChange={(e) => handleValueChange(setting.key, e.target.value, setting)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'pluginList': {
                const pluginManager = Core.services.tryResolve<PluginManager>(IPluginManager);
                if (!pluginManager) {
                    return (
                        <div className="settings-row">
                            <p className="settings-error">PluginManager 不可用</p>
                        </div>
                    );
                }
                return (
                    <div className="settings-plugin-list">
                        <PluginListSetting pluginManager={pluginManager} />
                    </div>
                );
            }

            case 'collisionMatrix': {
                const CustomRenderer = setting.customRenderer as React.ComponentType<any> | undefined;
                if (CustomRenderer) {
                    return (
                        <div className="settings-custom-renderer">
                            <CustomRenderer />
                        </div>
                    );
                }
                return (
                    <div className="settings-row">
                        <p className="settings-hint">碰撞矩阵编辑器未配置</p>
                    </div>
                );
            }

            case 'moduleList': {
                // Get module data from setting's custom props
                // 从设置的自定义属性获取模块数据
                const moduleData = setting as SettingDescriptor & {
                    modules?: ModuleManifest[];
                    getModules?: () => ModuleManifest[];
                    useBlacklist?: boolean;
                    validateDisable?: (moduleId: string) => Promise<{ canDisable: boolean; reason?: string }>;
                };
                const moduleValue = value as string[] || [];

                return (
                    <div className="settings-module-list">
                        <ModuleListSetting
                            modules={moduleData.modules}
                            getModules={moduleData.getModules}
                            value={moduleValue}
                            onModulesChange={(newValue) => handleValueChange(setting.key, newValue, setting)}
                            useBlacklist={moduleData.useBlacklist}
                            validateDisable={moduleData.validateDisable}
                        />
                    </div>
                );
            }

            default:
                return null;
        }
    };

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

    return (
        <div className="settings-overlay" onClick={handleCancel}>
            <div className="settings-window-new" onClick={(e) => e.stopPropagation()}>
                {/* Left Sidebar */}
                <div className="settings-sidebar-new">
                    <div className="settings-sidebar-header">
                        <SettingsIcon size={16} />
                        <span>编辑器偏好设置</span>
                        <button className="settings-sidebar-close" onClick={handleCancel}>
                            <X size={14} />
                        </button>
                    </div>

                    <div className="settings-sidebar-search">
                        <span>所有设置</span>
                    </div>

                    <div className="settings-sidebar-categories">
                        {mainCategories.map((mainCat) => (
                            <div key={mainCat.id} className="settings-main-category">
                                <div
                                    className="settings-main-category-header"
                                    onClick={() => toggleMainCategory(mainCat.id)}
                                >
                                    {expandedMainCategories.has(mainCat.id) ? (
                                        <ChevronDown size={12} />
                                    ) : (
                                        <ChevronRight size={12} />
                                    )}
                                    <span>{mainCat.title}</span>
                                </div>

                                {expandedMainCategories.has(mainCat.id) && (
                                    <div className="settings-sub-categories">
                                        {mainCat.subCategories.map((subCat) => (
                                            <button
                                                key={subCat.id}
                                                className={`settings-sub-category ${selectedCategoryId === subCat.id ? 'active' : ''}`}
                                                onClick={() => setSelectedCategoryId(subCat.id)}
                                            >
                                                {subCat.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Content */}
                <div className="settings-content-new">
                    {/* Top Header */}
                    <div className="settings-content-header">
                        <div className="settings-search-bar">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="搜索"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="settings-header-actions">
                            <button className="settings-icon-btn" title="设置">
                                <SettingsIcon size={14} />
                            </button>
                            <button className="settings-action-btn" onClick={handleExport}>
                                导出......
                            </button>
                            <button className="settings-action-btn" onClick={handleImport}>
                                导入......
                            </button>
                        </div>
                    </div>

                    {/* Category Title */}
                    <div className="settings-category-title-bar">
                        <div className="settings-category-breadcrumb">
                            <ChevronDown size={14} />
                            <span className="settings-breadcrumb-main">{mainCategoryTitle}</span>
                            <span className="settings-breadcrumb-separator">-</span>
                            <span className="settings-breadcrumb-sub">{subCategoryTitle}</span>
                        </div>
                        {selectedCategory?.description && (
                            <p className="settings-category-desc">{selectedCategory.description}</p>
                        )}
                        <div className="settings-category-actions">
                            <button className="settings-category-action-btn" onClick={handleResetToDefault}>
                                设置为默认值
                            </button>
                            <button className="settings-category-action-btn" onClick={handleExport}>
                                导出......
                            </button>
                            <button className="settings-category-action-btn" onClick={handleImport}>
                                导入......
                            </button>
                            <button className="settings-category-action-btn" onClick={handleResetToDefault}>
                                重置为默认
                            </button>
                        </div>
                    </div>

                    {/* Settings Content */}
                    <div className="settings-sections-container">
                        {selectedCategory && selectedCategory.sections.map((section) => {
                            const sectionKey = `${selectedCategory.id}-${section.id}`;
                            const isExpanded = expandedSections.has(sectionKey);

                            return (
                                <div key={section.id} className="settings-section-new">
                                    <div
                                        className="settings-section-header-new"
                                        onClick={() => toggleSection(sectionKey)}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown size={12} />
                                        ) : (
                                            <ChevronRight size={12} />
                                        )}
                                        <span>{section.title}</span>
                                    </div>

                                    {isExpanded && (
                                        <div className="settings-section-content-new">
                                            {section.settings.map((setting) => (
                                                <div key={setting.key}>
                                                    {renderSettingInput(setting)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!selectedCategory && (
                            <div className="settings-empty-new">
                                <SettingsIcon size={48} />
                                <p>请选择一个设置分类</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
