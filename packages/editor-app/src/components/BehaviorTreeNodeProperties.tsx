import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeTemplate, PropertyDefinition } from '@esengine/behavior-tree';
import {
    List, GitBranch, Layers, Shuffle,
    RotateCcw, Repeat, CheckCircle, XCircle, CheckCheck, HelpCircle, Snowflake, Timer,
    Clock, FileText, Edit, Calculator, Code,
    Equal, Dices, Settings, Database, FolderOpen, TreePine,
    LucideIcon
} from 'lucide-react';
import { AssetPickerDialog } from './AssetPickerDialog';

const iconMap: Record<string, LucideIcon> = {
    List, GitBranch, Layers, Shuffle,
    RotateCcw, Repeat, CheckCircle, XCircle, CheckCheck, HelpCircle, Snowflake, Timer,
    Clock, FileText, Edit, Calculator, Code,
    Equal, Dices, Settings, Database, TreePine
};

interface BehaviorTreeNodePropertiesProps {
    selectedNode?: {
        template: NodeTemplate;
        data: Record<string, any>;
    };
    onPropertyChange?: (propertyName: string, value: any) => void;
    projectPath?: string | null;
}

/**
 * 行为树节点属性编辑器
 *
 * 根据节点模板动态生成属性编辑界面
 */
export const BehaviorTreeNodeProperties: React.FC<BehaviorTreeNodePropertiesProps> = ({
    selectedNode,
    onPropertyChange,
    projectPath
}) => {
    const { t } = useTranslation();
    const [assetPickerOpen, setAssetPickerOpen] = useState(false);
    const [assetPickerProperty, setAssetPickerProperty] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [localValues, setLocalValues] = useState<Record<string, any>>({});

    // 当节点切换时，清空本地状态
    React.useEffect(() => {
        setLocalValues({});
    }, [selectedNode?.template.className]);

    if (!selectedNode) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
                fontSize: '14px'
            }}>
                {t('behaviorTree.noNodeSelected')}
            </div>
        );
    }

    const { template, data } = selectedNode;

    const handleChange = (propName: string, value: any) => {
        if (!isComposing) {
            onPropertyChange?.(propName, value);
        }
    };

    const handleInputChange = (propName: string, value: any) => {
        setLocalValues(prev => ({ ...prev, [propName]: value }));
        if (!isComposing) {
            onPropertyChange?.(propName, value);
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = (propName: string, value: any) => {
        setIsComposing(false);
        onPropertyChange?.(propName, value);
    };

    const renderProperty = (prop: PropertyDefinition) => {
        const propName = prop.name;
        const hasLocalValue = propName in localValues;
        const value = hasLocalValue ? localValues[propName] : (data[prop.name] ?? prop.defaultValue);

        switch (prop.type) {
            case 'string':
            case 'variable':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleInputChange(propName, e.target.value)}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={(e) => handleCompositionEnd(propName, (e.target as HTMLInputElement).value)}
                        onBlur={(e) => onPropertyChange?.(propName, e.target.value)}
                        placeholder={prop.description}
                        style={{
                            width: '100%',
                            padding: '6px',
                            backgroundColor: '#3c3c3c',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#cccccc',
                            fontSize: '13px'
                        }}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => handleChange(prop.name, parseFloat(e.target.value))}
                        min={prop.min}
                        max={prop.max}
                        step={prop.step || 1}
                        placeholder={prop.description}
                        style={{
                            width: '100%',
                            padding: '6px',
                            backgroundColor: '#3c3c3c',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#cccccc',
                            fontSize: '13px'
                        }}
                    />
                );

            case 'boolean':
                return (
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={value || false}
                            onChange={(e) => handleChange(prop.name, e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        <span style={{ fontSize: '13px' }}>{prop.description || '启用'}</span>
                    </label>
                );

            case 'select':
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => handleChange(prop.name, e.target.value)}
                        style={{
                            width: '100%',
                            padding: '6px',
                            backgroundColor: '#3c3c3c',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#cccccc',
                            fontSize: '13px'
                        }}
                    >
                        <option value="">请选择...</option>
                        {prop.options?.map((opt, idx) => (
                            <option key={idx} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'code':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleInputChange(propName, e.target.value)}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={(e) => handleCompositionEnd(propName, (e.target as HTMLTextAreaElement).value)}
                        onBlur={(e) => onPropertyChange?.(propName, e.target.value)}
                        placeholder={prop.description}
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '6px',
                            backgroundColor: '#3c3c3c',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#cccccc',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            resize: 'vertical'
                        }}
                    />
                );

            case 'blackboard':
                return (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleInputChange(propName, e.target.value)}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={(e) => handleCompositionEnd(propName, (e.target as HTMLInputElement).value)}
                            onBlur={(e) => onPropertyChange?.(propName, e.target.value)}
                            placeholder="黑板变量名"
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: '#3c3c3c',
                                border: '1px solid #555',
                                borderRadius: '3px',
                                color: '#cccccc',
                                fontSize: '13px'
                            }}
                        />
                        <button
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#0e639c',
                                border: 'none',
                                borderRadius: '3px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            选择
                        </button>
                    </div>
                );

            case 'asset':
                return (
                    <div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input
                                type="text"
                                value={value || ''}
                                onChange={(e) => handleChange(prop.name, e.target.value)}
                                placeholder={prop.description || '资产ID'}
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    backgroundColor: '#3c3c3c',
                                    border: '1px solid #555',
                                    borderRadius: '3px',
                                    color: '#cccccc',
                                    fontSize: '13px'
                                }}
                            />
                            <button
                                onClick={() => {
                                    setAssetPickerProperty(prop.name);
                                    setAssetPickerOpen(true);
                                }}
                                disabled={!projectPath}
                                title={!projectPath ? '请先打开项目' : '浏览资产'}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: projectPath ? '#0e639c' : '#555',
                                    border: 'none',
                                    borderRadius: '3px',
                                    color: '#fff',
                                    cursor: projectPath ? 'pointer' : 'not-allowed',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <FolderOpen size={14} />
                                浏览
                            </button>
                        </div>
                        {!projectPath && (
                            <div style={{
                                marginTop: '5px',
                                fontSize: '11px',
                                color: '#f48771',
                                lineHeight: '1.4'
                            }}>
                                ⚠️ 请先在编辑器中打开项目，才能使用资产浏览器
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{
            height: '100%',
            backgroundColor: '#1e1e1e',
            color: '#cccccc',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 节点信息 */}
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #333'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px'
                }}>
                    {template.icon && (() => {
                        const IconComponent = iconMap[template.icon];
                        return IconComponent ? (
                            <IconComponent
                                size={24}
                                color={template.color || '#cccccc'}
                                style={{ marginRight: '10px' }}
                            />
                        ) : (
                            <span style={{ marginRight: '10px', fontSize: '24px' }}>
                                {template.icon}
                            </span>
                        );
                    })()}
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>{template.displayName}</h3>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                            {template.category}
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.5' }}>
                    {template.description}
                </div>
            </div>

            {/* 属性列表 */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '15px'
            }}>
                {template.properties.length === 0 ? (
                    <div style={{ color: '#666', fontSize: '13px', textAlign: 'center', paddingTop: '20px' }}>
                        {t('behaviorTree.noConfigurableProperties')}
                    </div>
                ) : (
                    template.properties.map((prop, index) => (
                        <div key={index} style={{ marginBottom: '20px' }}>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#cccccc',
                                    cursor: prop.description ? 'help' : 'default'
                                }}
                                title={prop.description}
                            >
                                {prop.label}
                                {prop.required && (
                                    <span style={{ color: '#f48771', marginLeft: '4px' }}>*</span>
                                )}
                            </label>
                            {renderProperty(prop)}
                        </div>
                    ))
                )}
            </div>

            {/* 资产选择器对话框 */}
            {assetPickerOpen && projectPath && assetPickerProperty && (
                <AssetPickerDialog
                    projectPath={projectPath}
                    fileExtension="btree"
                    assetBasePath=".ecs/behaviors"
                    locale={t('locale') === 'zh' ? 'zh' : 'en'}
                    onSelect={(assetId) => {
                        // AssetPickerDialog 返回 assetId（不含扩展名，相对于 .ecs/behaviors 的路径）
                        handleChange(assetPickerProperty, assetId);
                        setAssetPickerOpen(false);
                        setAssetPickerProperty(null);
                    }}
                    onClose={() => {
                        setAssetPickerOpen(false);
                        setAssetPickerProperty(null);
                    }}
                />
            )}
        </div>
    );
};
