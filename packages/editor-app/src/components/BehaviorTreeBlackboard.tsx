import { useState } from 'react';
import { Clipboard, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface BlackboardVariable {
    key: string;
    value: any;
    type: 'number' | 'string' | 'boolean' | 'object';
}

interface BehaviorTreeBlackboardProps {
    variables: Record<string, any>;
    onVariableChange: (key: string, value: any) => void;
    onVariableAdd: (key: string, value: any, type: BlackboardVariable['type']) => void;
    onVariableDelete: (key: string) => void;
    onVariableRename?: (oldKey: string, newKey: string) => void;
}

/**
 * 行为树黑板变量面板
 *
 * 用于管理和调试行为树运行时的黑板变量
 */
export const BehaviorTreeBlackboard: React.FC<BehaviorTreeBlackboardProps> = ({
    variables,
    onVariableChange,
    onVariableAdd,
    onVariableDelete,
    onVariableRename
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newType, setNewType] = useState<BlackboardVariable['type']>('string');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingNewKey, setEditingNewKey] = useState('');
    const [editValue, setEditValue] = useState('');
    const [editType, setEditType] = useState<BlackboardVariable['type']>('string');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

        onVariableAdd(newKey, parsedValue, newType);
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

        if (newKey !== key && onVariableRename) {
            onVariableRename(key, newKey);
        }
        onVariableChange(newKey, parsedValue);
        setEditingKey(null);
    };

    const toggleGroup = (groupName: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupName)) {
                newSet.delete(groupName);
            } else {
                newSet.add(groupName);
            }
            return newSet;
        });
    };

    const getVariableType = (value: any): BlackboardVariable['type'] => {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'object') return 'object';
        return 'string';
    };

    const variableEntries = Object.entries(variables);

    const groupedVariables: Record<string, Array<{ fullKey: string; varName: string; value: any }>> = variableEntries.reduce((groups, [key, value]) => {
        const parts = key.split('.');
        const groupName = (parts.length > 1 && parts[0]) ? parts[0] : 'default';
        const varName = parts.length > 1 ? parts.slice(1).join('.') : key;

        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        const group = groups[groupName];
        if (group) {
            group.push({ fullKey: key, varName, value });
        }
        return groups;
    }, {} as Record<string, Array<{ fullKey: string; varName: string; value: any }>>);

    const groupNames = Object.keys(groupedVariables).sort((a, b) => {
        if (a === 'default') return 1;
        if (b === 'default') return -1;
        return a.localeCompare(b);
    });

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e1e1e',
            color: '#cccccc'
        }}>
            <style>{`
                .blackboard-list::-webkit-scrollbar {
                    width: 8px;
                }
                .blackboard-list::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }
                .blackboard-list::-webkit-scrollbar-thumb {
                    background: #3c3c3c;
                    border-radius: 4px;
                }
                .blackboard-list::-webkit-scrollbar-thumb:hover {
                    background: #4c4c4c;
                }
            `}</style>

            {/* 标题栏 */}
            <div style={{
                padding: '12px 15px',
                backgroundColor: '#2d2d2d',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Clipboard size={16} />
                    <span>Blackboard</span>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    style={{
                        padding: '4px 10px',
                        backgroundColor: '#0e639c',
                        border: 'none',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    + Add
                </button>
            </div>

            {/* 变量列表 */}
            <div className="blackboard-list" style={{
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
                        No variables yet. Click "Add" to create one.
                    </div>
                )}

                {groupNames.map(groupName => {
                    const isCollapsed = collapsedGroups.has(groupName);
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
                                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: '#888'
                                    }}>
                                        {groupName} ({groupVars.length})
                                    </span>
                                </div>
                            )}

                            {!isCollapsed && groupVars.map(({ fullKey: key, varName, value }) => {
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
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#666',
                                        marginBottom: '4px'
                                    }}>
                                        Name
                                    </div>
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
                                        placeholder="Variable name (e.g., player.health)"
                                    />
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#666',
                                        marginBottom: '4px'
                                    }}>
                                        Type
                                    </div>
                                    <select
                                        value={editType}
                                        onChange={(e) => setEditType(e.target.value as BlackboardVariable['type'])}
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
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#666',
                                        marginBottom: '4px'
                                    }}>
                                        Value
                                    </div>
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
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {varName} <span style={{
                                                color: '#666',
                                                fontWeight: 'normal',
                                                fontSize: '10px'
                                            }}>({type})</span>
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            fontFamily: 'monospace',
                                            color: typeColor,
                                            marginTop: '2px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }} title={displayValue}>
                                            {truncatedValue}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '2px',
                                        flexShrink: 0
                                    }}>
                                        <button
                                            onClick={() => handleStartEdit(key, value)}
                                            style={{
                                                padding: '2px',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#ccc',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Edit"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={() => onVariableDelete(key)}
                                            style={{
                                                padding: '2px',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#f44336',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
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

                {/* 添加新变量表单 */}
                {isAdding && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#2d2d2d',
                        borderRadius: '4px',
                        borderLeft: '3px solid #0e639c'
                    }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            marginBottom: '10px',
                            color: '#9cdcfe'
                        }}>
                            New Variable
                        </div>

                        <input
                            type="text"
                            placeholder="Variable name"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
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
                        />

                        <select
                            value={newType}
                            onChange={(e) => setNewType(e.target.value as BlackboardVariable['type'])}
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
                                    padding: '6px 12px',
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
                                    padding: '6px 12px',
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
            </div>

            {/* 底部信息 */}
            <div style={{
                padding: '8px 15px',
                borderTop: '1px solid #333',
                fontSize: '11px',
                color: '#666',
                backgroundColor: '#2d2d2d'
            }}>
                {variableEntries.length} variable{variableEntries.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};
