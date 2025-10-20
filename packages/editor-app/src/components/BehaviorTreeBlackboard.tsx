import { useState } from 'react';
import { Clipboard } from 'lucide-react';

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
    onVariableDelete
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newType, setNewType] = useState<BlackboardVariable['type']>('string');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

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
        setEditValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
    };

    const handleSaveEdit = (key: string, type: BlackboardVariable['type']) => {
        let parsedValue: any = editValue;
        if (type === 'number') {
            parsedValue = parseFloat(editValue) || 0;
        } else if (type === 'boolean') {
            parsedValue = editValue === 'true';
        } else if (type === 'object') {
            try {
                parsedValue = JSON.parse(editValue);
            } catch {
                return;
            }
        }

        onVariableChange(key, parsedValue);
        setEditingKey(null);
    };

    const getVariableType = (value: any): BlackboardVariable['type'] => {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'object') return 'object';
        return 'string';
    };

    const variableEntries = Object.entries(variables);

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

                {variableEntries.map(([key, value]) => {
                    const type = getVariableType(value);
                    const isEditing = editingKey === key;

                    return (
                        <div
                            key={key}
                            style={{
                                marginBottom: '10px',
                                padding: '10px',
                                backgroundColor: '#2d2d2d',
                                borderRadius: '4px',
                                borderLeft: `3px solid ${
                                    type === 'number' ? '#4ec9b0' :
                                    type === 'boolean' ? '#569cd6' :
                                    type === 'object' ? '#ce9178' : '#d4d4d4'
                                }`
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '6px'
                            }}>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: '#9cdcfe'
                                }}>
                                    {key}
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {!isEditing && (
                                        <button
                                            onClick={() => handleStartEdit(key, value)}
                                            style={{
                                                padding: '3px 8px',
                                                backgroundColor: '#3c3c3c',
                                                border: 'none',
                                                borderRadius: '2px',
                                                color: '#ccc',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onVariableDelete(key)}
                                        style={{
                                            padding: '3px 8px',
                                            backgroundColor: '#f44336',
                                            border: 'none',
                                            borderRadius: '2px',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: '11px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                fontSize: '11px',
                                color: '#666',
                                marginBottom: '6px'
                            }}>
                                Type: {type}
                            </div>

                            {isEditing ? (
                                <div>
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: type === 'object' ? '80px' : '30px',
                                            padding: '6px',
                                            backgroundColor: '#1e1e1e',
                                            border: '1px solid #0e639c',
                                            borderRadius: '3px',
                                            color: '#cccccc',
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            resize: 'vertical',
                                            marginBottom: '6px'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => handleSaveEdit(key, type)}
                                            style={{
                                                padding: '4px 12px',
                                                backgroundColor: '#0e639c',
                                                border: 'none',
                                                borderRadius: '3px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingKey(null)}
                                            style={{
                                                padding: '4px 12px',
                                                backgroundColor: '#3c3c3c',
                                                border: 'none',
                                                borderRadius: '3px',
                                                color: '#ccc',
                                                cursor: 'pointer',
                                                fontSize: '11px'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '6px',
                                    backgroundColor: '#1e1e1e',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    color: type === 'number' ? '#4ec9b0' :
                                          type === 'boolean' ? '#569cd6' :
                                          type === 'object' ? '#ce9178' : '#d4d4d4',
                                    wordBreak: 'break-all'
                                }}>
                                    {type === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </div>
                            )}
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
