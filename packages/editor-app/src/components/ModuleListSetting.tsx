import { useState, useEffect, useRef } from 'react';
import { ModuleRegistry, type ModuleDescriptor, type ModuleCategory } from '@esengine/ecs-framework';
import * as LucideIcons from 'lucide-react';
import { Package, Check, AlertCircle, Loader } from 'lucide-react';
import '../styles/ModuleListSetting.css';

function ModuleIcon({ iconName, size = 16 }: { iconName?: string; size?: number }) {
    if (!iconName) {
        return <Package size={size} />;
    }
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
        return <Package size={size} />;
    }
    return <IconComponent size={size} />;
}

interface ModuleInfo extends ModuleDescriptor {
    enabled: boolean;
}

interface ModuleListSettingProps {
    value: string[];
    onChange: (enabledModules: string[]) => void;
}

const categoryLabels: Record<ModuleCategory, string> = {
    core: '核心',
    rendering: '渲染',
    ui: 'UI',
    ai: 'AI',
    physics: '物理',
    audio: '音频',
    networking: '网络',
    tools: '工具'
};

export function ModuleListSetting({ value, onChange }: ModuleListSettingProps) {
    const [modules, setModules] = useState<ModuleInfo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pollIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const loadModules = () => {
            const allModules = ModuleRegistry.getModules();
            if (allModules.length > 0) {
                const moduleInfos: ModuleInfo[] = allModules.map(m => ({
                    ...m,
                    enabled: m.isCore || value.includes(m.id)
                }));
                setModules(moduleInfos);
                setIsLoading(false);

                // 模块已加载，停止轮询
                if (pollIntervalRef.current !== null) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
            }
        };

        // 首次尝试加载
        loadModules();

        // 如果模块还未加载，启动轮询（每500ms检查一次，最多30秒）
        if (ModuleRegistry.getModules().length === 0) {
            let attempts = 0;
            const maxAttempts = 60; // 30秒

            pollIntervalRef.current = window.setInterval(() => {
                attempts++;
                loadModules();

                if (attempts >= maxAttempts && pollIntervalRef.current !== null) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    setIsLoading(false);
                }
            }, 500);
        }

        return () => {
            if (pollIntervalRef.current !== null) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [value]);

    const handleToggle = (moduleId: string) => {
        const module = modules.find(m => m.id === moduleId);
        if (!module || module.isCore) return;

        const newEnabled = !module.enabled;

        // 检查依赖
        if (newEnabled) {
            const deps = module.dependencies || [];
            const missingDeps = deps.filter(depId => {
                const dep = modules.find(m => m.id === depId);
                return dep && !dep.enabled;
            });

            if (missingDeps.length > 0) {
                setError(`需要先启用依赖模块: ${missingDeps.join(', ')}`);
                setTimeout(() => setError(null), 3000);
                return;
            }
        } else {
            // 检查是否有其他模块依赖此模块
            const dependents = modules.filter(m =>
                m.enabled && m.dependencies?.includes(moduleId)
            );

            if (dependents.length > 0) {
                setError(`以下模块依赖此模块: ${dependents.map(m => m.name).join(', ')}`);
                setTimeout(() => setError(null), 3000);
                return;
            }
        }

        setError(null);

        const newEnabledModules = newEnabled
            ? [...value, moduleId]
            : value.filter(id => id !== moduleId);

        onChange(newEnabledModules);
    };

    // 按类别分组
    const groupedModules = modules.reduce((acc, module) => {
        const category = module.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(module);
        return acc;
    }, {} as Record<ModuleCategory, ModuleInfo[]>);

    return (
        <div className="module-list-setting">
            {error && (
                <div className="module-list-error">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}

            {Object.entries(groupedModules).map(([category, categoryModules]) => (
                <div key={category} className="module-category">
                    <div className="module-category-header">
                        {categoryLabels[category as ModuleCategory] || category}
                    </div>
                    <div className="module-list">
                        {categoryModules.map(module => (
                            <div
                                key={module.id}
                                className={`module-item ${module.enabled ? 'enabled' : ''} ${module.isCore ? 'core' : ''}`}
                                onClick={() => handleToggle(module.id)}
                            >
                                <div className="module-checkbox">
                                    {module.enabled && <Check size={12} />}
                                </div>
                                <div className="module-icon">
                                    <ModuleIcon iconName={module.icon} size={18} />
                                </div>
                                <div className="module-info">
                                    <div className="module-name">
                                        {module.name}
                                        {module.isCore && <span className="module-badge">核心</span>}
                                    </div>
                                    <div className="module-description">{module.description}</div>
                                    {module.dependencies && module.dependencies.length > 0 && (
                                        <div className="module-deps">
                                            依赖: {module.dependencies.join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="module-version">{module.version}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {modules.length === 0 && isLoading && (
                <div className="module-list-empty">
                    <Loader size={32} className="module-list-spinner" />
                    <p>正在加载模块...</p>
                </div>
            )}

            {modules.length === 0 && !isLoading && (
                <div className="module-list-empty">
                    <Package size={32} />
                    <p>没有可用的模块</p>
                    <p className="module-list-hint">请确保引擎已初始化</p>
                </div>
            )}
        </div>
    );
}
