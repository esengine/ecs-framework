/**
 * Module List Setting Component.
 * 模块列表设置组件。
 *
 * Renders a list of engine modules with checkboxes to enable/disable.
 * 渲染引擎模块列表，带复选框以启用/禁用。
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Package, AlertCircle } from 'lucide-react';
import type { ModuleManifest, ModuleCategory } from '@esengine/editor-core';
import './styles/ModuleListSetting.css';

/**
 * Module entry with enabled state.
 * 带启用状态的模块条目。
 */
interface ModuleEntry extends ModuleManifest {
    enabled: boolean;
    canDisable: boolean;
    disableReason?: string;
}

/**
 * Props for ModuleListSetting.
 */
interface ModuleListSettingProps {
    /** Module manifests (static) | 模块清单列表（静态） */
    modules?: ModuleManifest[];
    /** Function to get modules dynamically (sizes from module.json) | 动态获取模块的函数（大小来自 module.json） */
    getModules?: () => ModuleManifest[];
    /**
     * Module IDs list. Meaning depends on useBlacklist.
     * 模块 ID 列表。含义取决于 useBlacklist。
     * - useBlacklist=false: enabled modules (whitelist)
     * - useBlacklist=true: disabled modules (blacklist)
     */
    value: string[];
    /** Callback when modules change | 模块变更回调 */
    onModulesChange: (moduleIds: string[]) => void;
    /**
     * Use blacklist mode: value contains disabled modules instead of enabled.
     * 使用黑名单模式：value 包含禁用的模块而不是启用的。
     * Default: false (whitelist mode)
     */
    useBlacklist?: boolean;
    /** Validate if module can be disabled | 验证模块是否可禁用 */
    validateDisable?: (moduleId: string) => Promise<{ canDisable: boolean; reason?: string }>;
}

/**
 * Format bytes to human readable string.
 */
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Module List Setting Component.
 * 模块列表设置组件。
 */
export const ModuleListSetting: React.FC<ModuleListSettingProps> = ({
    modules: staticModules,
    getModules,
    value,
    onModulesChange,
    useBlacklist = false,
    validateDisable
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core', 'Rendering']));
    const [validationError, setValidationError] = useState<{ moduleId: string; message: string } | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    // Get modules from function or static prop
    // 从函数或静态 prop 获取模块
    const modules = useMemo(() => {
        if (getModules) {
            return getModules();
        }
        return staticModules || [];
    }, [getModules, staticModules]);

    // Build module entries with enabled state | 构建带启用状态的模块条目
    // In blacklist mode: enabled = NOT in value list
    // In whitelist mode: enabled = IN value list
    const moduleEntries: ModuleEntry[] = useMemo(() => {
        return modules.map(mod => {
            let enabled: boolean;
            if (mod.isCore) {
                enabled = true; // Core modules always enabled
            } else if (useBlacklist) {
                enabled = !value.includes(mod.id); // Blacklist: NOT in list = enabled
            } else {
                enabled = value.includes(mod.id); // Whitelist: IN list = enabled
            }
            return {
                ...mod,
                enabled,
                canDisable: !mod.isCore,
                disableReason: mod.isCore ? 'Core module cannot be disabled' : undefined
            };
        });
    }, [modules, value, useBlacklist]);

    // Group by category | 按分类分组
    const groupedModules = useMemo(() => {
        const groups = new Map<string, ModuleEntry[]>();
        const categoryOrder: ModuleCategory[] = ['Core', 'Rendering', 'Physics', 'AI', 'Audio', 'Networking', 'Other'];

        // Initialize groups | 初始化分组
        for (const cat of categoryOrder) {
            groups.set(cat, []);
        }

        // Group modules | 分组模块
        for (const mod of moduleEntries) {
            const cat = mod.category || 'Other';
            if (!groups.has(cat)) {
                groups.set(cat, []);
            }
            groups.get(cat)!.push(mod);
        }

        // Filter empty groups | 过滤空分组
        const result = new Map<string, ModuleEntry[]>();
        for (const [cat, mods] of groups) {
            if (mods.length > 0) {
                result.set(cat, mods);
            }
        }

        return result;
    }, [moduleEntries]);

    // Calculate total size (JS + WASM) | 计算总大小（JS + WASM）
    const { totalJsSize, totalWasmSize, totalSize } = useMemo(() => {
        let js = 0;
        let wasm = 0;
        for (const m of moduleEntries) {
            if (m.enabled) {
                js += m.jsSize || 0;
                wasm += m.wasmSize || 0;
            }
        }
        return { totalJsSize: js, totalWasmSize: wasm, totalSize: js + wasm };
    }, [moduleEntries]);

    // Toggle category expansion | 切换分类展开
    const toggleCategory = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }, []);

    // Handle module toggle | 处理模块切换
    const handleModuleToggle = useCallback(async (module: ModuleEntry, enabled: boolean) => {
        if (module.isCore) return;

        // If disabling, validate first | 如果禁用，先验证
        if (!enabled && validateDisable) {
            setLoading(module.id);
            try {
                const result = await validateDisable(module.id);
                if (!result.canDisable) {
                    setValidationError({
                        moduleId: module.id,
                        message: result.reason || `Cannot disable ${module.displayName}`
                    });
                    setLoading(null);
                    return;
                }
            } finally {
                setLoading(null);
            }
        }

        // Update module list based on mode
        let newValue: string[];

        if (useBlacklist) {
            // Blacklist mode: value contains disabled modules
            if (enabled) {
                // Remove from blacklist (and also remove dependencies)
                const toRemove = new Set([module.id]);
                // Also enable dependencies if they were disabled
                for (const depId of module.dependencies) {
                    toRemove.add(depId);
                }
                newValue = value.filter(id => !toRemove.has(id));
            } else {
                // Add to blacklist
                newValue = [...value, module.id];
            }
        } else {
            // Whitelist mode: value contains enabled modules
            if (enabled) {
                // Add to whitelist (and dependencies)
                newValue = [...value];
                const toEnable = [module.id, ...module.dependencies];
                for (const id of toEnable) {
                    if (!newValue.includes(id)) {
                        newValue.push(id);
                    }
                }
            } else {
                // Remove from whitelist
                newValue = value.filter(id => id !== module.id);
            }
        }

        onModulesChange(newValue);
    }, [value, useBlacklist, onModulesChange, validateDisable]);

    return (
        <div className="module-list-setting">
            {/* Module categories | 模块分类 */}
            <div className="module-list-categories">
                {Array.from(groupedModules.entries()).map(([category, mods]) => (
                    <div key={category} className="module-category-group">
                        <div
                            className="module-category-header"
                            onClick={() => toggleCategory(category)}
                        >
                            {expandedCategories.has(category) ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                            <span className="module-category-name">{category}</span>
                            <span className="module-category-count">
                                {mods.filter(m => m.enabled).length}/{mods.length}
                            </span>
                        </div>

                        {expandedCategories.has(category) && (
                            <div className="module-category-items">
                                {mods.map(mod => (
                                    <div
                                        key={mod.id}
                                        className={`module-item ${mod.enabled ? 'enabled' : ''} ${loading === mod.id ? 'loading' : ''}`}
                                    >
                                        <label className="module-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={mod.enabled}
                                                disabled={mod.isCore || loading === mod.id}
                                                onChange={(e) => handleModuleToggle(mod, e.target.checked)}
                                            />
                                            <Package size={14} className="module-icon" />
                                            <span className="module-name">{mod.displayName}</span>
                                            {mod.isCore && (
                                                <span className="module-badge core">Core</span>
                                            )}
                                        </label>
                                        {(mod.jsSize || mod.wasmSize) ? (
                                            <span className="module-size">
                                                {mod.isCore ? '' : '+'}
                                                {formatBytes((mod.jsSize || 0) + (mod.wasmSize || 0))}
                                                {(mod.wasmSize ?? 0) > 0 && (
                                                    <span className="module-wasm-indicator" title="Includes WASM">⚡</span>
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Size footer | 大小页脚 */}
            <div className="module-list-footer">
                <span className="module-list-size-label">Runtime size:</span>
                <span className="module-list-size-value">
                    {formatBytes(totalSize)}
                    {totalWasmSize > 0 && (
                        <span className="module-size-breakdown">
                            (JS: {formatBytes(totalJsSize)} + WASM: {formatBytes(totalWasmSize)})
                        </span>
                    )}
                </span>
            </div>

            {/* Validation error toast | 验证错误提示 */}
            {validationError && (
                <div className="module-validation-error">
                    <AlertCircle size={14} />
                    <span>{validationError.message}</span>
                    <button onClick={() => setValidationError(null)}>Dismiss</button>
                </div>
            )}
        </div>
    );
};

export default ModuleListSetting;
