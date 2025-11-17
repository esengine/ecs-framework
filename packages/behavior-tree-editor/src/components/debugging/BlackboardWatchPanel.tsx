import React, { useState } from 'react';
import { Eye, Edit3, History, RefreshCw } from 'lucide-react';
import { BlackboardValue } from '../../domain/models/Blackboard';
import { DraggablePanel } from '../common/DraggablePanel';

interface BlackboardVariable {
    name: string;
    value: BlackboardValue;
    type: string;
    isModified: boolean;
    initialValue?: BlackboardValue;
}

interface BlackboardWatchPanelProps {
    isVisible: boolean;
    variables: Record<string, BlackboardValue>;
    initialVariables: Record<string, BlackboardValue>;
    onClose: () => void;
    onUpdateVariable: (name: string, value: BlackboardValue) => void;
    onResetVariable: (name: string) => void;
    onResetAll: () => void;
}

/**
 * 黑板变量监视器面板
 * 实时显示和修改黑板变量
 */
export const BlackboardWatchPanel: React.FC<BlackboardWatchPanelProps> = ({
    isVisible,
    variables,
    initialVariables,
    onClose,
    onUpdateVariable,
    onResetVariable,
    onResetAll
}) => {
    const [editingVar, setEditingVar] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [filter, setFilter] = useState('');

    if (!isVisible) return null;

    // 转换为变量列表
    const variableList: BlackboardVariable[] = Object.entries(variables).map(([name, value]) => ({
        name,
        value,
        type: typeof value,
        isModified: JSON.stringify(value) !== JSON.stringify(initialVariables[name]),
        initialValue: initialVariables[name]
    }));

    // 过滤变量
    const filteredVariables = filter
        ? variableList.filter((v) => v.name.toLowerCase().includes(filter.toLowerCase()))
        : variableList;

    const handleStartEdit = (name: string, value: BlackboardValue) => {
        setEditingVar(name);
        setEditValue(JSON.stringify(value));
    };

    const handleSaveEdit = () => {
        if (!editingVar) return;

        try {
            const parsedValue = JSON.parse(editValue);
            onUpdateVariable(editingVar, parsedValue);
            setEditingVar(null);
            setEditValue('');
        } catch (error) {
            alert('无效的JSON值');
        }
    };

    const handleCancelEdit = () => {
        setEditingVar(null);
        setEditValue('');
    };

    const modifiedCount = variableList.filter((v) => v.isModified).length;

    const titleBadge = modifiedCount > 0 && (
        <span style={{
            fontSize: '10px',
            color: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.2)',
            padding: '2px 6px',
            borderRadius: '3px'
        }}>
            {modifiedCount} 个变更
        </span>
    );

    const headerActions = modifiedCount > 0 && (
        <button
            onClick={onResetAll}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
                padding: '4px 8px',
                backgroundColor: '#3c3c3c',
                border: 'none',
                borderRadius: '4px',
                color: '#ccc',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}
            title="重置所有变量"
        >
            <RefreshCw size={12} />
            重置
        </button>
    );

    const footer = (
        <div style={{
            padding: '8px 12px',
            fontSize: '11px',
            color: '#999',
            display: 'flex',
            justifyContent: 'space-between'
        }}>
            <span>总共 {variableList.length} 个变量</span>
            {modifiedCount > 0 && (
                <span style={{ color: '#ff9800' }}>
                    {modifiedCount} 个已修改
                </span>
            )}
        </div>
    );

    return (
        <DraggablePanel
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>黑板监视器</span>
                    {titleBadge}
                </div>
            }
            icon={<Eye size={18} color="#9c27b0" />}
            isVisible={isVisible}
            onClose={onClose}
            width={400}
            maxHeight={600}
            initialPosition={{ x: window.innerWidth - 440, y: 100 }}
            headerActions={headerActions}
            footer={footer}
        >
            {/* 搜索框 */}
            <div style={{ padding: '12px 12px 0', borderBottom: '1px solid #3f3f3f' }}>
                <input
                    type="text"
                    placeholder="搜索变量..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e1e1e',
                        border: '1px solid #3f3f3f',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        marginBottom: '12px'
                    }}
                />
            </div>

            {/* 变量列表 */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px'
            }}>
                {filteredVariables.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#666',
                        padding: '40px 20px',
                        fontSize: '12px'
                    }}>
                        {filter ? '未找到匹配的变量' : '暂无黑板变量'}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        {filteredVariables.map((variable) => (
                            <VariableItem
                                key={variable.name}
                                variable={variable}
                                isEditing={editingVar === variable.name}
                                editValue={editValue}
                                onStartEdit={handleStartEdit}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={handleCancelEdit}
                                onEditValueChange={setEditValue}
                                onReset={onResetVariable}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DraggablePanel>
    );
};

interface VariableItemProps {
    variable: BlackboardVariable;
    isEditing: boolean;
    editValue: string;
    onStartEdit: (name: string, value: BlackboardValue) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditValueChange: (value: string) => void;
    onReset: (name: string) => void;
}

const VariableItem: React.FC<VariableItemProps> = ({
    variable,
    isEditing,
    editValue,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditValueChange,
    onReset
}) => {
    const valueStr = JSON.stringify(variable.value);
    const initialValueStr = variable.initialValue ? JSON.stringify(variable.initialValue) : undefined;

    return (
        <div style={{
            padding: '10px',
            backgroundColor: variable.isModified ? 'rgba(255, 152, 0, 0.1)' : '#252525',
            border: `1px solid ${variable.isModified ? '#ff9800' : '#3f3f3f'}`,
            borderRadius: '6px'
        }}>
            {/* 变量名和类型 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#fff',
                        fontFamily: 'monospace'
                    }}>
                        {variable.name}
                    </span>
                    <span style={{
                        fontSize: '10px',
                        color: '#666',
                        backgroundColor: '#1e1e1e',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontFamily: 'monospace'
                    }}>
                        {variable.type}
                    </span>
                    {variable.isModified && (
                        <span style={{
                            fontSize: '10px',
                            color: '#ff9800',
                            backgroundColor: 'rgba(255, 152, 0, 0.2)',
                            padding: '2px 6px',
                            borderRadius: '3px'
                        }}>
                            已修改
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    {!isEditing && (
                        <>
                            <button
                                onClick={() => onStartEdit(variable.name, variable.value)}
                                style={{
                                    padding: '4px',
                                    backgroundColor: '#3c3c3c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ccc',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="编辑"
                            >
                                <Edit3 size={12} />
                            </button>
                            {variable.isModified && (
                                <button
                                    onClick={() => onReset(variable.name)}
                                    style={{
                                        padding: '4px',
                                        backgroundColor: '#3c3c3c',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: '#ccc',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title="重置为初始值"
                                >
                                    <RefreshCw size={12} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 值显示/编辑 */}
            {isEditing ? (
                <div>
                    <textarea
                        value={editValue}
                        onChange={(e) => onEditValueChange(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '6px',
                            backgroundColor: '#1e1e1e',
                            border: '1px solid #3f3f3f',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            resize: 'vertical',
                            marginBottom: '6px'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={onSaveEdit}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: '#4caf50',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                        >
                            保存
                        </button>
                        <button
                            onClick={onCancelEdit}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: '#3c3c3c',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ccc',
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                        >
                            取消
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{
                        padding: '6px 8px',
                        backgroundColor: '#1e1e1e',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#4caf50',
                        wordBreak: 'break-all',
                        maxHeight: '100px',
                        overflowY: 'auto'
                    }}>
                        {valueStr}
                    </div>

                    {variable.isModified && initialValueStr && (
                        <div style={{
                            marginTop: '6px',
                            padding: '6px 8px',
                            backgroundColor: '#1e1e1e',
                            borderRadius: '4px',
                            border: '1px dashed #3f3f3f'
                        }}>
                            <div style={{
                                fontSize: '10px',
                                color: '#666',
                                marginBottom: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <History size={10} />
                                初始值:
                            </div>
                            <div style={{
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                color: '#999',
                                wordBreak: 'break-all'
                            }}>
                                {initialValueStr}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
