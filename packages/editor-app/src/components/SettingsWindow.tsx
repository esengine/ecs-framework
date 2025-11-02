import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { SettingsService } from '../services/SettingsService';
import { SettingsRegistry, SettingCategory, SettingDescriptor } from '@esengine/editor-core';
import '../styles/SettingsWindow.css';

interface SettingsWindowProps {
  onClose: () => void;
  settingsRegistry: SettingsRegistry;
}

export function SettingsWindow({ onClose, settingsRegistry }: SettingsWindowProps) {
    const [categories, setCategories] = useState<SettingCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [values, setValues] = useState<Map<string, any>>(new Map());
    const [errors, setErrors] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        const allCategories = settingsRegistry.getAllCategories();
        setCategories(allCategories);

        if (allCategories.length > 0 && !selectedCategoryId) {
            const firstCategory = allCategories[0];
            if (firstCategory) {
                setSelectedCategoryId(firstCategory.id);
            }
        }

        const settings = SettingsService.getInstance();
        const allSettings = settingsRegistry.getAllSettings();
        const initialValues = new Map<string, any>();

        for (const [key, descriptor] of allSettings.entries()) {
            const value = settings.get(key, descriptor.defaultValue);
            initialValues.set(key, value);
        }

        setValues(initialValues);
    }, [settingsRegistry, selectedCategoryId]);

    const handleValueChange = (key: string, value: any, descriptor: SettingDescriptor) => {
        const newValues = new Map(values);
        newValues.set(key, value);
        setValues(newValues);

        const newErrors = new Map(errors);
        if (!settingsRegistry.validateSetting(descriptor, value)) {
            newErrors.set(key, descriptor.validator?.errorMessage || 'Invalid value');
        } else {
            newErrors.delete(key);
        }
        setErrors(newErrors);
    };

    const handleSave = () => {
        if (errors.size > 0) {
            return;
        }

        const settings = SettingsService.getInstance();
        const changedSettings: Record<string, any> = {};

        for (const [key, value] of values.entries()) {
            settings.set(key, value);
            changedSettings[key] = value;
        }

        window.dispatchEvent(new CustomEvent('settings:changed', {
            detail: changedSettings
        }));

        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const renderSettingInput = (setting: SettingDescriptor) => {
        const value = values.get(setting.key) ?? setting.defaultValue;
        const error = errors.get(setting.key);

        switch (setting.type) {
            case 'boolean':
                return (
                    <div className="settings-field">
                        <label className="settings-label settings-label-checkbox">
                            <input
                                type="checkbox"
                                className="settings-checkbox"
                                checked={value}
                                onChange={(e) => handleValueChange(setting.key, e.target.checked, setting)}
                            />
                            <span>{setting.label}</span>
                            {setting.description && (
                                <span className="settings-hint">{setting.description}</span>
                            )}
                        </label>
                        {error && <span className="settings-error">{error}</span>}
                    </div>
                );

            case 'number':
                return (
                    <div className="settings-field">
                        <label className="settings-label">
                            {setting.label}
                            {setting.description && (
                                <span className="settings-hint">{setting.description}</span>
                            )}
                        </label>
                        <input
                            type="number"
                            className={`settings-input ${error ? 'settings-input-error' : ''}`}
                            value={value}
                            onChange={(e) => handleValueChange(setting.key, parseInt(e.target.value) || 0, setting)}
                            placeholder={setting.placeholder}
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                        />
                        {error && <span className="settings-error">{error}</span>}
                    </div>
                );

            case 'string':
                return (
                    <div className="settings-field">
                        <label className="settings-label">
                            {setting.label}
                            {setting.description && (
                                <span className="settings-hint">{setting.description}</span>
                            )}
                        </label>
                        <input
                            type="text"
                            className={`settings-input ${error ? 'settings-input-error' : ''}`}
                            value={value}
                            onChange={(e) => handleValueChange(setting.key, e.target.value, setting)}
                            placeholder={setting.placeholder}
                        />
                        {error && <span className="settings-error">{error}</span>}
                    </div>
                );

            case 'select':
                return (
                    <div className="settings-field">
                        <label className="settings-label">
                            {setting.label}
                            {setting.description && (
                                <span className="settings-hint">{setting.description}</span>
                            )}
                        </label>
                        <select
                            className={`settings-select ${error ? 'settings-input-error' : ''}`}
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
                        {error && <span className="settings-error">{error}</span>}
                    </div>
                );

            case 'range':
                return (
                    <div className="settings-field">
                        <label className="settings-label">
                            {setting.label}
                            {setting.description && (
                                <span className="settings-hint">{setting.description}</span>
                            )}
                        </label>
                        <div className="settings-range-wrapper">
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
                        {error && <span className="settings-error">{error}</span>}
                    </div>
                );

            case 'color':
                return (
                    <div className="settings-field">
                        <label className="settings-label">
                            {setting.label}
                            {setting.description && (
                                <span className="settings-hint">{setting.description}</span>
                            )}
                        </label>
                        <input
                            type="color"
                            className="settings-color-input"
                            value={value}
                            onChange={(e) => handleValueChange(setting.key, e.target.value, setting)}
                        />
                        {error && <span className="settings-error">{error}</span>}
                    </div>
                );

            default:
                return null;
        }
    };

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

    return (
        <div className="settings-overlay">
            <div className="settings-window">
                <div className="settings-header">
                    <div className="settings-title">
                        <SettingsIcon size={18} />
                        <h2>设置</h2>
                    </div>
                    <button className="settings-close-btn" onClick={handleCancel}>
                        <X size={18} />
                    </button>
                </div>

                <div className="settings-body">
                    <div className="settings-sidebar">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`settings-category-btn ${selectedCategoryId === category.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategoryId(category.id)}
                            >
                                <span className="settings-category-title">{category.title}</span>
                                {category.description && (
                                    <span className="settings-category-desc">{category.description}</span>
                                )}
                                <ChevronRight size={14} className="settings-category-arrow" />
                            </button>
                        ))}
                    </div>

                    <div className="settings-content">
                        {selectedCategory && selectedCategory.sections.map((section) => (
                            <div key={section.id} className="settings-section">
                                <h3 className="settings-section-title">{section.title}</h3>
                                {section.description && (
                                    <p className="settings-section-description">{section.description}</p>
                                )}
                                {section.settings.map((setting) => (
                                    <div key={setting.key}>
                                        {renderSettingInput(setting)}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {!selectedCategory && (
                            <div className="settings-empty">
                                <SettingsIcon size={48} />
                                <p>请选择一个设置分类</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="settings-footer">
                    <button className="settings-btn settings-btn-cancel" onClick={handleCancel}>
            取消
                    </button>
                    <button
                        className="settings-btn settings-btn-save"
                        onClick={handleSave}
                        disabled={errors.size > 0}
                    >
            保存
                    </button>
                </div>
            </div>
        </div>
    );
}
