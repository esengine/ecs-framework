import {
    React,
    useState,
    useCallback,
    type IInspectorProvider,
    type InspectorContext,
    MessageHub,
    FieldEditorRegistry,
    type FieldEditorContext,
    PluginAPI,
} from '@esengine/editor-runtime';
import { Node as BehaviorTreeNode } from '../domain/models/Node';
import type { PropertyDefinition } from '@esengine/behavior-tree';

/**
 * 节点属性编辑器组件
 */
interface PropertyEditorProps {
    property: PropertyDefinition;
    value: any;
    onChange: (name: string, value: any) => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({ property, value, onChange }) => {
    const handleChange = useCallback((newValue: any) => {
        onChange(property.name, newValue);
    }, [property.name, onChange]);

    const renderInput = () => {
        // 特殊处理 treeAssetId 字段使用 asset 编辑器
        if (property.name === 'treeAssetId') {
            // 使用 ServiceContainer.resolve 直接获取类注册的服务
            // Use ServiceContainer.resolve to get class-registered service directly
            const fieldRegistry = PluginAPI.services.resolve(FieldEditorRegistry);
            const assetEditor = fieldRegistry.getEditor('asset');

            if (assetEditor) {
                const context: FieldEditorContext = {
                    readonly: false,
                    metadata: {
                        fileExtension: '.btree',
                        placeholder: '拖拽或选择行为树文件'
                    }
                };

                return assetEditor.render({
                    label: '',
                    value: value ?? property.defaultValue ?? null,
                    onChange: handleChange,
                    context
                });
            }
        }

        // 检查是否有特定的字段编辑器类型
        if (property.fieldEditor) {
            // 使用 ServiceContainer.resolve 直接获取类注册的服务
            // Use ServiceContainer.resolve to get class-registered service directly
            const fieldRegistry = PluginAPI.services.resolve(FieldEditorRegistry);
            const editor = fieldRegistry.getEditor(property.fieldEditor.type);

            if (editor) {
                const context: FieldEditorContext = {
                    readonly: false,
                    metadata: property.fieldEditor.options
                };

                return editor.render({
                    label: '',
                    value: value ?? property.defaultValue,
                    onChange: handleChange,
                    context
                });
            }
        }

        switch (property.type) {
            case 'number':
                return (
                    <input
                        type="number"
                        value={value ?? property.defaultValue ?? 0}
                        min={property.min}
                        max={property.max}
                        step={property.step || 1}
                        onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
                        style={{
                            width: '100%',
                            padding: '4px 8px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '3px',
                            color: '#e0e0e0',
                            fontSize: '12px'
                        }}
                    />
                );

            case 'boolean':
                return (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                            type="checkbox"
                            checked={value ?? property.defaultValue ?? false}
                            onChange={(e) => handleChange(e.target.checked)}
                        />
                        <span style={{ fontSize: '11px', color: value ? '#4ade80' : '#888' }}>
                            {value ? '是' : '否'}
                        </span>
                    </label>
                );

            case 'select':
                return (
                    <select
                        value={value ?? property.defaultValue ?? ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '4px 8px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '3px',
                            color: '#e0e0e0',
                            fontSize: '12px'
                        }}
                    >
                        {property.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'code':
                return (
                    <textarea
                        value={value ?? property.defaultValue ?? ''}
                        onChange={(e) => handleChange(e.target.value)}
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            backgroundColor: '#1e1e1e',
                            border: '1px solid #444',
                            borderRadius: '3px',
                            color: '#d4d4d4',
                            fontSize: '11px',
                            fontFamily: 'Consolas, Monaco, monospace',
                            resize: 'vertical'
                        }}
                    />
                );

            case 'string':
            default:
                return (
                    <input
                        type="text"
                        value={value ?? property.defaultValue ?? ''}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '4px 8px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '3px',
                            color: '#e0e0e0',
                            fontSize: '12px'
                        }}
                    />
                );
        }
    };

    return (
        <div className="property-field" style={{
            marginBottom: '6px',
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            alignItems: 'center',
            gap: '8px'
        }}>
            <label
                className="property-label"
                style={{
                    fontSize: '11px',
                    color: '#999',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}
                title={property.description || property.label || property.name}
            >
                {property.label || property.name}
                {property.required && <span style={{ color: '#f87171', marginLeft: '2px' }}>*</span>}
            </label>
            {renderInput()}
        </div>
    );
};

/**
 * 节点属性面板组件
 */
interface NodePropertiesPanelProps {
    node: BehaviorTreeNode;
    onPropertyChange?: (nodeId: string, propertyName: string, value: any) => void;
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({ node, onPropertyChange }) => {
    const [localData, setLocalData] = useState<Record<string, any>>(node.data);

    const handlePropertyChange = useCallback((name: string, value: any) => {
        setLocalData((prev) => ({ ...prev, [name]: value }));
        onPropertyChange?.(node.id, name, value);
    }, [node.id, onPropertyChange]);

    const properties = node.template.properties || [];

    if (properties.length === 0) {
        return (
            <div style={{ padding: '12px', color: '#888', fontSize: '12px', textAlign: 'center' }}>
                该节点没有可配置的属性
            </div>
        );
    }

    return (
        <div style={{ padding: '4px 0' }}>
            {properties.map((prop) => (
                <PropertyEditor
                    key={prop.name}
                    property={prop}
                    value={localData[prop.name]}
                    onChange={handlePropertyChange}
                />
            ))}
        </div>
    );
};

/**
 * 行为树节点Inspector提供器
 * 为行为树节点提供检视面板
 */
export class BehaviorTreeNodeInspectorProvider implements IInspectorProvider<BehaviorTreeNode> {
    readonly id = 'behavior-tree-node-inspector';
    readonly name = '行为树节点检视器';
    readonly priority = 100;
    private messageHub?: MessageHub;

    setMessageHub(hub: MessageHub): void {
        this.messageHub = hub;
    }

    canHandle(target: unknown): target is BehaviorTreeNode {
        return target instanceof BehaviorTreeNode ||
            (typeof target === 'object' &&
                target !== null &&
                'template' in target &&
                'data' in target &&
                'position' in target &&
                'children' in target);
    }

    render(node: BehaviorTreeNode, context: InspectorContext): React.ReactElement {
        const handlePropertyChange = (nodeId: string, propertyName: string, value: any) => {
            if (this.messageHub) {
                this.messageHub.publish('behavior-tree:node-property-changed', {
                    nodeId,
                    propertyName,
                    value
                });
            }
        };

        return (
            <div className="entity-inspector">
                <div className="inspector-header">
                    <span className="entity-name">{node.template.displayName || '未命名节点'}</span>
                </div>

                <div className="inspector-content">
                    <div className="inspector-section">
                        <div className="section-title">基本信息</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr',
                            gap: '4px 8px',
                            fontSize: '11px'
                        }}>
                            <span style={{ color: '#888' }}>类型</span>
                            <span style={{ color: '#e0e0e0' }}>{node.template.type}</span>

                            <span style={{ color: '#888' }}>分类</span>
                            <span style={{ color: '#e0e0e0' }}>{node.template.category}</span>

                            {node.template.description && (
                                <>
                                    <span style={{ color: '#888' }}>描述</span>
                                    <span
                                        style={{
                                            color: '#999',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={node.template.description}
                                    >
                                        {node.template.description}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {node.template.properties && node.template.properties.length > 0 && (
                        <div className="inspector-section">
                            <div className="section-title">节点属性</div>
                            <NodePropertiesPanel
                                node={node}
                                onPropertyChange={handlePropertyChange}
                            />
                        </div>
                    )}

                    <div className="inspector-section">
                        <div className="section-title">调试信息</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr',
                            gap: '4px 8px',
                            fontSize: '11px'
                        }}>
                            <span style={{ color: '#888' }}>ID</span>
                            <span style={{
                                fontFamily: 'Consolas, Monaco, monospace',
                                color: '#666',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }} title={node.id}>
                                {node.id}
                            </span>

                            <span style={{ color: '#888' }}>位置</span>
                            <span style={{ color: '#999' }}>
                                ({node.position.x.toFixed(0)}, {node.position.y.toFixed(0)})
                            </span>

                            <span style={{ color: '#888' }}>子节点</span>
                            <span style={{ color: '#e0e0e0' }}>{node.children.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
