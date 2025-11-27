import { React, useState, Icons } from '@esengine/editor-runtime';

const { Clipboard, Edit2, Trash2, ChevronDown, ChevronRight, Globe, GripVertical, ChevronLeft, Plus, Copy } = Icons;

type SimpleBlackboardType = 'number' | 'string' | 'boolean' | 'object';

interface BlackboardPanelProps {
    variables: Record<string, any>;
    initialVariables?: Record<string, any>;
    globalVariables?: Record<string, any>;
    onVariableChange: (key: string, value: any) => void;
    onVariableAdd: (key: string, value: any, type: SimpleBlackboardType) => void;
    onVariableDelete: (key: string) => void;
    onVariableRename?: (oldKey: string, newKey: string) => void;
    onGlobalVariableChange?: (key: string, value: any) => void;
    onGlobalVariableAdd?: (key: string, value: any, type: SimpleBlackboardType) => void;
    onGlobalVariableDelete?: (key: string) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

/**
 * 黑板面板组件 - 内嵌在编辑器侧边
 * 支持本地变量和全局变量的管理
 */
export const BlackboardPanel: React.FC<BlackboardPanelProps> = ({
    variables,
    initialVariables,
    globalVariables,
    onVariableChange,
    onVariableAdd,
    onVariableDelete,
    onVariableRename,
    onGlobalVariableChange,
    onGlobalVariableAdd,
    onGlobalVariableDelete,
    isCollapsed = false,
    onToggleCollapse
}) => {
    const [viewMode, setViewMode] = useState<'local' | 'global'>('local');
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newType, setNewType] = useState<SimpleBlackboardType>('string');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingNewKey, setEditingNewKey] = useState('');
    const [editValue, setEditValue] = useState('');
    const [editType, setEditType] = useState<SimpleBlackboardType>('string');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const isModified = (key: string): boolean => {
        if (!initialVariables || viewMode !== 'local') return false;
        return JSON.stringify(variables[key]) !== JSON.stringify(initialVariables[key]);
    };

    const handleAddVariable = () => {
        if (!newKey.trim()) return;

        let parsedValue: any = newValue;
        if (newType === 'number') {
            parsedValue = parseFloat(newValue) || 0;
        } else if (newType === 'boolean') {
            parsedValue = newValue === 'true';
        } else if (newType === 'object') {
            try {
                parsedValue = JSON.parse(newValue);
            } catch {
                parsedValue = {};
            }
        }

        if (viewMode === 'global' && onGlobalVariableAdd) {
            onGlobalVariableAdd(newKey, parsedValue, newType);
        } else {
            onVariableAdd(newKey, parsedValue, newType);
        }

        setNewKey('');
        setNewValue('');
        setIsAdding(false);
    };

    const handleStartEdit = (key: string, value: any) => {
        setEditingKey(key);
        setEditingNewKey(key);
        const currentType = getVariableType(value);
        setEditType(currentType);
        setEditValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
    };

    const handleSaveEdit = (key: string) => {
        const newKey = editingNewKey.trim();
        if (!newKey) return;

        let parsedValue: any = editValue;
        if (editType === 'number') {
            parsedValue = parseFloat(editValue) || 0;
        } else if (editType === 'boolean') {
            parsedValue = editValue === 'true' || editValue === '1';
        } else if (editType === 'object') {
            try {
                parsedValue = JSON.parse(editValue);
            } catch {
                return;
            }
        }

        if (viewMode === 'global' && onGlobalVariableChange) {
            if (newKey !== key && onGlobalVariableDelete) {
                onGlobalVariableDelete(key);
            }
            onGlobalVariableChange(newKey, parsedValue);
        } else {
            if (newKey !== key && onVariableRename) {
                onVariableRename(key, newKey);
            }
            onVariableChange(newKey, parsedValue);
        }

        setEditingKey(null);
    };

    const toggleGroup = (groupName: string) => {
        setCollapsedGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupName)) {
                newSet.delete(groupName);
            } else {
                newSet.add(groupName);
            }
            return newSet;
        });
    };

    const getVariableType = (value: any): SimpleBlackboardType => {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'object') return 'object';
        return 'string';
    };

    const currentVariables = viewMode === 'global' ? (globalVariables || {}) : variables;
    const variableEntries = Object.entries(currentVariables);
    const currentOnDelete = viewMode === 'global' ? onGlobalVariableDelete : onVariableDelete;

    const groupedVariables: Record<string, Array<{ fullKey: string; varName: string; value: any }>> = variableEntries.reduce((groups, [key, value]) => {
        const parts = key.split('.');
        const groupName = (parts.length > 1 && parts[0]) ? parts[0] : 'default';
        const varName = parts.length > 1 ? parts.slice(1).join('.') : key;

        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push({ fullKey: key, varName, value });
        return groups;
    }, {} as Record<string, Array<{ fullKey: string; varName: string; value: any }>>);

    const groupNames = Object.keys(groupedVariables).sort((a, b) => {
        if (a === 'default') return 1;
        if (b === 'default') return -1;
        return a.localeCompare(b);
    });

    // 复制变量到剪贴板
    const handleCopyVariable = (key: string, value: any) => {
        const text = `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
        navigator.clipboard.writeText(text);
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e1e1e',
            color: '#cccccc',
            borderLeft: '1px solid #333',
            transition: 'width 0.2s ease'
        }}>
            {/* 标题栏 */}
            <div style={{
                padding: '10px 12px',
                backgroundColor: '#252525',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#ccc'
                }}>
                    <Clipboard size={14} />
                    {!isCollapsed && <span>Blackboard</span>}
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    {!isCollapsed && (
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#1e1e1e',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => setViewMode('local')}
                                style={{
                                    padding: '3px 8px',
                                    backgroundColor: viewMode === 'local' ? '#007acc' : 'transparent',
                                    border: 'none',
                                    color: viewMode === 'local' ? '#fff' : '#888',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    if (viewMode !== 'local') {
                                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (viewMode !== 'local') {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <Clipboard size={11} />
                                Local
                            </button>
                            <button
                                onClick={() => setViewMode('global')}
                                style={{
                                    padding: '3px 8px',
                                    backgroundColor: viewMode === 'global' ? '#007acc' : 'transparent',
                                    border: 'none',
                                    color: viewMode === 'global' ? '#fff' : '#888',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    if (viewMode !== 'global') {
                                        e.currentTarget.style.backgroundColor = '#2a2a2a';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (viewMode !== 'global') {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <Globe size={11} />
                                Global
                            </button>
                        </div>
                    )}
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            style={{
                                padding: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '2px',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#3c3c3c';
                                e.currentTarget.style.color = '#ccc';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#888';
                            }}
                            title={isCollapsed ? 'Expand' : 'Collapse'}
                        >
                            <ChevronLeft size={14} style={{
                                transform: isCollapsed ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                            }} />
                        </button>
                    )}
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* 工具栏 */}
                    <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#222',
                        borderBottom: '1px solid #333',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{
                            flex: 1,
                            fontSize: '10px',
                            color: '#888'
                        }}>
                            {viewMode === 'local' ? '当前行为树的本地变量' : '所有行为树共享的全局变量'}
                        </div>
                        <button
                            onClick={() => setIsAdding(true)}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: '#007acc',
                                border: 'none',
                                borderRadius: '3px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#005a9e'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007acc'}
                        >
                            <Plus size={12} />
                            Add
                        </button>
                    </div>

                    {/* 变量列表 */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px'
                    }}>
                        {variableEntries.length === 0 && !isAdding && (
                            <div style={{
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '12px',
                                padding: '20px'
                            }}>
                        No variables yet
                            </div>
                        )}

                        {/* 添加新变量表单 */}
                        {isAdding && (
                            <div style={{
                                marginBottom: '10px',
                                padding: '10px',
                                backgroundColor: '#2d2d2d',
                                borderRadius: '4px',
                                border: '1px solid #3c3c3c'
                            }}>
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Name</div>
                                <input
                                    type="text"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    placeholder="variable.name"
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        marginBottom: '8px',
                                        backgroundColor: '#1e1e1e',
                                        border: '1px solid #3c3c3c',
                                        borderRadius: '3px',
                                        color: '#9cdcfe',
                                        fontSize: '12px',
                                        fontFamily: 'monospace'
                                    }}
                                    autoFocus
                                />
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Type</div>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as SimpleBlackboardType)}
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        marginBottom: '8px',
                                        backgroundColor: '#1e1e1e',
                                        border: '1px solid #3c3c3c',
                                        borderRadius: '3px',
                                        color: '#cccccc',
                                        fontSize: '12px'
                                    }}
                                >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="object">Object (JSON)</option>
                                </select>
                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Value</div>
                                <textarea
                                    placeholder={
                                        newType === 'object' ? '{"key": "value"}' :
                                            newType === 'boolean' ? 'true or false' :
                                                newType === 'number' ? '0' : 'value'
                                    }
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: newType === 'object' ? '80px' : '30px',
                                        padding: '6px',
                                        marginBottom: '8px',
                                        backgroundColor: '#1e1e1e',
                                        border: '1px solid #3c3c3c',
                                        borderRadius: '3px',
                                        color: '#cccccc',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={handleAddVariable}
                                        style={{
                                            flex: 1,
                                            padding: '6px',
                                            backgroundColor: '#0e639c',
                                            border: 'none',
                                            borderRadius: '3px',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                Create
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewKey('');
                                            setNewValue('');
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '6px',
                                            backgroundColor: '#3c3c3c',
                                            border: 'none',
                                            borderRadius: '3px',
                                            color: '#ccc',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 分组显示变量 */}
                        {groupNames.map((groupName) => {
                            const isGroupCollapsed = collapsedGroups.has(groupName);
                            const groupVars = groupedVariables[groupName];
                            if (!groupVars) return null;

                            return (
                                <div key={groupName} style={{ marginBottom: '8px' }}>
                                    {groupName !== 'default' && (
                                        <div
                                            onClick={() => toggleGroup(groupName)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '4px 6px',
                                                backgroundColor: '#252525',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                marginBottom: '4px',
                                                userSelect: 'none'
                                            }}
                                        >
                                            {isGroupCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                color: '#888'
                                            }}>
                                                {groupName} ({groupVars.length})
                                            </span>
                                        </div>
                                    )}

                                    {!isGroupCollapsed && groupVars.map(({ fullKey: key, varName, value }) => {
                                        const type = getVariableType(value);
                                        const isEditing = editingKey === key;

                                        const handleDragStart = (e: React.DragEvent) => {
                                            const variableData = {
                                                variableName: key,
                                                variableValue: value,
                                                variableType: type
                                            };
                                            e.dataTransfer.setData('application/blackboard-variable', JSON.stringify(variableData));
                                            e.dataTransfer.effectAllowed = 'copy';
                                        };

                                        const typeColor =
                                    type === 'number' ? '#4ec9b0' :
                                        type === 'boolean' ? '#569cd6' :
                                            type === 'object' ? '#ce9178' : '#d4d4d4';

                                        const displayValue = type === 'object' ?
                                            JSON.stringify(value) :
                                            String(value);

                                        const truncatedValue = displayValue.length > 30 ?
                                            displayValue.substring(0, 30) + '...' :
                                            displayValue;

                                        return (
                                            <div
                                                key={key}
                                                draggable={!isEditing}
                                                onDragStart={handleDragStart}
                                                style={{
                                                    marginBottom: '6px',
                                                    padding: '6px 8px',
                                                    backgroundColor: '#2d2d2d',
                                                    borderRadius: '3px',
                                                    borderLeft: `3px solid ${typeColor}`,
                                                    cursor: isEditing ? 'default' : 'grab'
                                                }}
                                            >
                                                {isEditing ? (
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Name</div>
                                                        <input
                                                            type="text"
                                                            value={editingNewKey}
                                                            onChange={(e) => setEditingNewKey(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '4px',
                                                                marginBottom: '4px',
                                                                backgroundColor: '#1e1e1e',
                                                                border: '1px solid #3c3c3c',
                                                                borderRadius: '2px',
                                                                color: '#9cdcfe',
                                                                fontSize: '11px',
                                                                fontFamily: 'monospace'
                                                            }}
                                                        />
                                                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Type</div>
                                                        <select
                                                            value={editType}
                                                            onChange={(e) => setEditType(e.target.value as SimpleBlackboardType)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '4px',
                                                                marginBottom: '4px',
                                                                backgroundColor: '#1e1e1e',
                                                                border: '1px solid #3c3c3c',
                                                                borderRadius: '2px',
                                                                color: '#cccccc',
                                                                fontSize: '10px'
                                                            }}
                                                        >
                                                            <option value="string">String</option>
                                                            <option value="number">Number</option>
                                                            <option value="boolean">Boolean</option>
                                                            <option value="object">Object (JSON)</option>
                                                        </select>
                                                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Value</div>
                                                        <textarea
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                minHeight: editType === 'object' ? '60px' : '24px',
                                                                padding: '4px',
                                                                backgroundColor: '#1e1e1e',
                                                                border: '1px solid #0e639c',
                                                                borderRadius: '2px',
                                                                color: '#cccccc',
                                                                fontSize: '11px',
                                                                fontFamily: 'monospace',
                                                                resize: 'vertical',
                                                                marginBottom: '4px'
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button
                                                                onClick={() => handleSaveEdit(key)}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '3px 8px',
                                                                    backgroundColor: '#0e639c',
                                                                    border: 'none',
                                                                    borderRadius: '2px',
                                                                    color: '#fff',
                                                                    cursor: 'pointer',
                                                                    fontSize: '10px'
                                                                }}
                                                            >
                                                        Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingKey(null)}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '3px 8px',
                                                                    backgroundColor: '#3c3c3c',
                                                                    border: 'none',
                                                                    borderRadius: '2px',
                                                                    color: '#ccc',
                                                                    cursor: 'pointer',
                                                                    fontSize: '10px'
                                                                }}
                                                            >
                                                        Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: '11px',
                                                                color: '#9cdcfe',
                                                                fontWeight: 'bold',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <GripVertical size={10} style={{ opacity: 0.3, flexShrink: 0 }} />
                                                                {varName}
                                                                <span style={{
                                                                    color: '#666',
                                                                    fontWeight: 'normal',
                                                                    fontSize: '10px'
                                                                }}>({type})</span>
                                                                {isModified(key) && (
                                                                    <span style={{
                                                                        fontSize: '9px',
                                                                        color: '#ff9800',
                                                                        fontWeight: 'bold'
                                                                    }}>*</span>
                                                                )}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '10px',
                                                                color: '#888',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                fontFamily: 'monospace'
                                                            }}>
                                                                {truncatedValue}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                            <button
                                                                onClick={() => handleCopyVariable(key, value)}
                                                                style={{
                                                                    padding: '4px',
                                                                    backgroundColor: 'transparent',
                                                                    border: 'none',
                                                                    color: '#888',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '2px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#3c3c3c';
                                                                    e.currentTarget.style.color = '#ccc';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.color = '#888';
                                                                }}
                                                                title="Copy"
                                                            >
                                                                <Copy size={11} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStartEdit(key, value)}
                                                                style={{
                                                                    padding: '4px',
                                                                    backgroundColor: 'transparent',
                                                                    border: 'none',
                                                                    color: '#888',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '2px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#3c3c3c';
                                                                    e.currentTarget.style.color = '#ccc';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.color = '#888';
                                                                }}
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={11} />
                                                            </button>
                                                            <button
                                                                onClick={() => currentOnDelete && currentOnDelete(key)}
                                                                style={{
                                                                    padding: '4px',
                                                                    backgroundColor: 'transparent',
                                                                    border: 'none',
                                                                    color: '#888',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '2px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#5a1a1a';
                                                                    e.currentTarget.style.color = '#f48771';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.color = '#888';
                                                                }}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {/* 底部信息栏 */}
                    <div style={{
                        padding: '8px 12px',
                        borderTop: '1px solid #333',
                        fontSize: '11px',
                        color: '#666',
                        backgroundColor: '#252525'
                    }}>
                        {viewMode === 'local' ? 'Local' : 'Global'}: {variableEntries.length} variable{variableEntries.length !== 1 ? 's' : ''}
                    </div>
                </>
            )}

            {/* 滚动条样式 */}
            <style>{`
                .blackboard-scrollable::-webkit-scrollbar {
                    width: 8px;
                }
                .blackboard-scrollable::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }
                .blackboard-scrollable::-webkit-scrollbar-thumb {
                    background: #3c3c3c;
                    border-radius: 4px;
                }
                .blackboard-scrollable::-webkit-scrollbar-thumb:hover {
                    background: #4c4c4c;
                }
            `}</style>
        </div>
    );
};
