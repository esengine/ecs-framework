import { ref, computed, reactive } from 'vue';

export interface BlackboardVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'vector2' | 'vector3' | 'object' | 'array';
    value: any;
    defaultValue: any;
    description?: string;
    group?: string;
    readOnly?: boolean;
    constraints?: {
        min?: number;
        max?: number;
        step?: number;
        allowedValues?: string[];
    };
}

export interface BlackboardModalData {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'vector2' | 'vector3' | 'object' | 'array';
    defaultValue: any;
    description: string;
    group: string;
    readOnly: boolean;
    constraints: {
        min?: number;
        max?: number;
        step?: number;
    };
    useAllowedValues: boolean;
    allowedValuesText: string;
}

export function useBlackboard() {
    const blackboardVariables = ref<Map<string, BlackboardVariable>>(new Map());
    const expandedGroups = ref<Set<string>>(new Set(['未分组']));
    const selectedVariable = ref<BlackboardVariable | null>(null);
    const showBlackboardModal = ref(false);
    const editingBlackboardVariable = ref<BlackboardVariable | null>(null);
    
    const blackboardModalData = reactive<BlackboardModalData>({
        name: '',
        type: 'string',
        defaultValue: '',
        description: '',
        group: '',
        readOnly: false,
        constraints: {},
        useAllowedValues: false,
        allowedValuesText: ''
    });

    const showAddVariableDialog = ref(false);
    const editingVariable = ref<BlackboardVariable | null>(null);
    const newVariable = reactive({
        name: '',
        type: 'string' as any,
        defaultValue: '' as any,
        defaultValueText: '',
        description: '',
        group: '',
        readonly: false,
        min: undefined as number | undefined,
        max: undefined as number | undefined,
        optionsText: ''
    });

    const showImportExportDialog = ref(false);
    const activeTab = ref('export');
    const exportData = computed(() => {
        const data = Array.from(blackboardVariables.value.values());
        return JSON.stringify(data, null, 2);
    });
    const importData = ref('');
    const clearBeforeImport = ref(false);

    const blackboardCollapsed = ref(false);
    const blackboardTransparent = ref(true);

    const blackboardVariablesArray = computed(() => {
        return Array.from(blackboardVariables.value.values());
    });

    const blackboardVariableGroups = computed(() => {
        const groups: Record<string, BlackboardVariable[]> = {};
        
        blackboardVariables.value.forEach(variable => {
            const groupName = variable.group || '未分组';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(variable);
        });
        
        const sortedGroups: Record<string, BlackboardVariable[]> = {};
        const groupNames = Object.keys(groups).sort((a, b) => {
            if (a === '未分组') return -1;
            if (b === '未分组') return 1;
            return a.localeCompare(b);
        });
        
        groupNames.forEach(groupName => {
            groups[groupName].sort((a, b) => a.name.localeCompare(b.name));
            sortedGroups[groupName] = groups[groupName];
        });
        
        return sortedGroups;
    });

    const groups = computed(() => {
        const groupSet = new Set<string>();
        blackboardVariables.value.forEach(variable => {
            groupSet.add(variable.group || '未分组');
        });
        return Array.from(groupSet);
    });

    const isValidVariable = computed(() => {
        return newVariable.name.trim().length > 0;
    });

    const groupedBlackboardVariables = () => {
        return Object.entries(blackboardVariableGroups.value);
    };

    const isGroupExpanded = (groupName: string): boolean => {
        return expandedGroups.value.has(groupName);
    };

    const toggleGroup = (groupName: string) => {
        if (expandedGroups.value.has(groupName)) {
            expandedGroups.value.delete(groupName);
        } else {
            expandedGroups.value.add(groupName);
        }
    };

    const getVariableTypeIcon = (type: string): string => {
        const iconMap: Record<string, string> = {
            string: '📝',
            number: '🔢',
            boolean: '☑️',
            vector2: '📐',
            vector3: '🧊',
            object: '📦',
            array: '📋'
        };
        return iconMap[type] || '❓';
    };

    const formatBlackboardValue = (variable: BlackboardVariable): string => {
        if (variable.value === null || variable.value === undefined) {
            return 'null';
        }
        
        switch (variable.type) {
            case 'boolean':
                return variable.value ? 'true' : 'false';
            case 'string':
                return `"${variable.value}"`;
            case 'number':
                return variable.value.toString();
            default:
                return String(variable.value);
        }
    };

    const hasVisibleConstraints = (variable: BlackboardVariable): boolean => {
        if (!variable.constraints) return false;
        
        return !!(
            variable.constraints.min !== undefined ||
            variable.constraints.max !== undefined ||
            variable.constraints.allowedValues?.length
        );
    };

    const formatConstraints = (constraints: BlackboardVariable['constraints']): string => {
        const parts: string[] = [];
        
        if (constraints?.min !== undefined) {
            parts.push(`最小: ${constraints.min}`);
        }
        if (constraints?.max !== undefined) {
            parts.push(`最大: ${constraints.max}`);
        }
        if (constraints?.allowedValues?.length) {
            parts.push(`可选: ${constraints.allowedValues.join(', ')}`);
        }
        
        return parts.join(', ');
    };

    const getTypeDisplayName = (type: string): string => {
        const typeMap: Record<string, string> = {
            string: 'STR',
            number: 'NUM',
            boolean: 'BOOL',
            vector2: 'VEC2',
            vector3: 'VEC3',
            object: 'OBJ',
            array: 'ARR'
        };
        return typeMap[type] || type.toUpperCase();
    };

    const getDisplayValue = (variable: BlackboardVariable): string => {
        if (variable.value === null || variable.value === undefined) {
            return 'null';
        }
        
        switch (variable.type) {
            case 'string':
                return String(variable.value);
            case 'number':
                return variable.value.toString();
            case 'boolean':
                return variable.value ? 'true' : 'false';
            case 'vector2':
                if (typeof variable.value === 'object' && variable.value.x !== undefined && variable.value.y !== undefined) {
                    return `(${variable.value.x}, ${variable.value.y})`;
                }
                return String(variable.value);
            case 'vector3':
                if (typeof variable.value === 'object' && variable.value.x !== undefined && variable.value.y !== undefined && variable.value.z !== undefined) {
                    return `(${variable.value.x}, ${variable.value.y}, ${variable.value.z})`;
                }
                return String(variable.value);
            case 'object':
            case 'array':
                try {
                    const jsonStr = JSON.stringify(variable.value);
                    return jsonStr.length > 20 ? jsonStr.substring(0, 17) + '...' : jsonStr;
                } catch {
                    return String(variable.value);
                }
            default:
                return String(variable.value);
        }
    };

    const onTypeChange = () => {
        switch (newVariable.type) {
            case 'string':
                newVariable.defaultValue = '';
                break;
            case 'number':
                newVariable.defaultValue = 0;
                break;
            case 'boolean':
                newVariable.defaultValue = false;
                break;
            case 'vector2':
                newVariable.defaultValue = { x: 0, y: 0 };
                break;
            case 'vector3':
                newVariable.defaultValue = { x: 0, y: 0, z: 0 };
                break;
            case 'object':
            case 'array':
                newVariable.defaultValue = '';
                newVariable.defaultValueText = '';
                break;
        }
    };

    const saveBlackboardVariable = () => {
        if (!blackboardModalData.name.trim()) {
            alert('请输入变量名称');
            return;
        }
        
        let finalValue = blackboardModalData.defaultValue;
        
        // 处理对象和数组类型的JSON格式
        if (blackboardModalData.type === 'object' || blackboardModalData.type === 'array') {
            try {
                if (typeof blackboardModalData.defaultValue === 'string') {
                    finalValue = blackboardModalData.defaultValue ? JSON.parse(blackboardModalData.defaultValue) : (blackboardModalData.type === 'array' ? [] : {});
                }
            } catch (error) {
                alert('JSON格式错误，请检查输入');
                return;
            }
        }
        
        const constraints: BlackboardVariable['constraints'] = {};
        if (blackboardModalData.constraints.min !== undefined) constraints.min = blackboardModalData.constraints.min;
        if (blackboardModalData.constraints.max !== undefined) constraints.max = blackboardModalData.constraints.max;
        if (blackboardModalData.constraints.step !== undefined) constraints.step = blackboardModalData.constraints.step;
        
        // 处理字符串的可选值列表
        if (blackboardModalData.useAllowedValues && blackboardModalData.allowedValuesText.trim()) {
            constraints.allowedValues = blackboardModalData.allowedValuesText
                .split('\n')
                .map(val => val.trim())
                .filter(val => val.length > 0);
        }
        
        const variable: BlackboardVariable = {
            name: blackboardModalData.name,
            type: blackboardModalData.type,
            value: finalValue,
            defaultValue: finalValue,
            description: blackboardModalData.description,
            group: blackboardModalData.group || undefined,
            readOnly: blackboardModalData.readOnly,
            constraints: Object.keys(constraints).length > 0 ? constraints : undefined
        };
        
        blackboardVariables.value.set(variable.name, variable);
        
        const groupName = variable.group || '未分组';
        expandedGroups.value.add(groupName);
        
        showBlackboardModal.value = false;
        editingBlackboardVariable.value = null;
        
        // 重置模态框数据
        Object.assign(blackboardModalData, {
            name: '',
            type: 'string',
            defaultValue: '',
            description: '',
            group: '',
            readOnly: false,
            constraints: {},
            useAllowedValues: false,
            allowedValuesText: ''
        });
    };

    const deleteBlackboardVariable = (variableName: string) => {
        if (confirm(`确定要删除变量 "${variableName}" 吗？`)) {
            blackboardVariables.value.delete(variableName);
        }
    };

    const updateBlackboardVariable = (variableName: string, newValue: any) => {
        const variable = blackboardVariables.value.get(variableName);
        if (!variable) return;
        
        if (variable.readOnly) {
            alert('该变量为只读，无法修改');
            return;
        }
        
        const updatedVariable = { ...variable, value: newValue };
        blackboardVariables.value.set(variableName, updatedVariable);
    };

    const selectVariable = (variable: BlackboardVariable) => {
        selectedVariable.value = variable;
    };

    const clearBlackboard = () => {
        if (confirm('确定要清空所有变量吗？此操作不可恢复。')) {
            blackboardVariables.value.clear();
            selectedVariable.value = null;
        }
    };

    const exportBlackboard = () => {
        const data = Array.from(blackboardVariables.value.values());
        const json = JSON.stringify(data, null, 2);
        
        try {
            navigator.clipboard.writeText(json);
            alert('Blackboard配置已复制到剪贴板');
        } catch (error) {
            console.error('复制失败:', error);
        }
    };

    const importBlackboard = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (!Array.isArray(data)) {
                        throw new Error('格式错误：期望数组格式');
                    }
                    
                    let importCount = 0;
                    data.forEach(varData => {
                        if (varData.name && varData.type) {
                            blackboardVariables.value.set(varData.name, varData);
                            importCount++;
                        }
                    });
                    
                    alert(`成功导入 ${importCount} 个变量`);
                } catch (error) {
                    alert('导入失败：' + (error as Error).message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    };

    const onVariableDragStart = (event: DragEvent, variable: BlackboardVariable) => {
        if (!event.dataTransfer) return;
        
        event.dataTransfer.setData('application/blackboard-variable', JSON.stringify({
            name: variable.name,
            type: variable.type,
            value: variable.value
        }));
        
        event.dataTransfer.effectAllowed = 'copy';
    };

    const removeBlackboardVariable = (variableName: string) => {
        deleteBlackboardVariable(variableName);
    };

    const editVariable = (variable: BlackboardVariable) => {
        editingBlackboardVariable.value = variable;
        
        Object.assign(blackboardModalData, {
            name: variable.name,
            type: variable.type,
            defaultValue: (variable.type === 'object' || variable.type === 'array') ? JSON.stringify(variable.value, null, 2) : variable.value,
            description: variable.description || '',
            group: variable.group || '',
            readOnly: variable.readOnly || false,
            constraints: {
                min: variable.constraints?.min,
                max: variable.constraints?.max,
                step: variable.constraints?.step
            },
            useAllowedValues: !!(variable.constraints?.allowedValues?.length),
            allowedValuesText: variable.constraints?.allowedValues?.join('\n') || ''
        });
        
        showBlackboardModal.value = true;
    };

    const onBlackboardDragStart = (event: DragEvent, variable: BlackboardVariable) => {
        onVariableDragStart(event, variable);
    };

    const closeAddVariableDialog = () => {
        showAddVariableDialog.value = false;
        editingVariable.value = null;
    };

    const saveVariable = () => {
        saveBlackboardVariable();
    };

    const closeImportExportDialog = () => {
        showImportExportDialog.value = false;
    };

    const copyExportData = () => {
        navigator.clipboard.writeText(exportData.value);
        alert('已复制到剪贴板');
    };

    const importVariables = () => {
        try {
            const data = JSON.parse(importData.value);
            if (!Array.isArray(data)) {
                throw new Error('格式错误：期望数组格式');
            }
            
            if (clearBeforeImport.value) {
                blackboardVariables.value.clear();
            }
            
            let importCount = 0;
            data.forEach((varData: any) => {
                if (varData.name && varData.type) {
                    blackboardVariables.value.set(varData.name, varData);
                    importCount++;
                }
            });
            
            alert(`成功导入 ${importCount} 个变量`);
            showImportExportDialog.value = false;
            importData.value = '';
        } catch (error) {
            alert('导入失败：' + (error as Error).message);
        }
    };

    const addBlackboardVariable = () => {
        Object.assign(newVariable, {
            name: '',
            type: 'string',
            defaultValue: '',
            defaultValueText: '',
            description: '',
            group: '',
            readonly: false,
            min: undefined,
            max: undefined,
            optionsText: ''
        });
        
        editingVariable.value = null;
        showAddVariableDialog.value = true;
    };

    return {
        blackboardVariables: blackboardVariablesArray,
        selectedVariable,
        showBlackboardModal,
        editingBlackboardVariable,
        blackboardModalData,
        expandedGroups,
        blackboardVariableGroups,
        
        showAddVariableDialog,
        editingVariable,
        newVariable,
        groups,
        showImportExportDialog,
        activeTab,
        exportData,
        importData,
        clearBeforeImport,
        isValidVariable,
        blackboardCollapsed,
        blackboardTransparent,
        
        groupedBlackboardVariables,
        isGroupExpanded,
        toggleGroup,
        getVariableTypeIcon,
        formatBlackboardValue,
        hasVisibleConstraints,
        formatConstraints,
        getTypeDisplayName,
        getDisplayValue,
        
        addBlackboardVariable,
        saveBlackboardVariable,
        deleteBlackboardVariable,
        removeBlackboardVariable,
        updateBlackboardVariable,
        editVariable,
        selectVariable,
        clearBlackboard,
        
        closeAddVariableDialog,
        saveVariable,
        onTypeChange,
        closeImportExportDialog,
        copyExportData,
        importVariables,
        
        exportBlackboard,
        importBlackboard,
        
        onBlackboardDragStart,
        
        editBlackboardVariable: editVariable,
        onBlackboardValueChange: (variable: BlackboardVariable) => {
            updateBlackboardVariable(variable.name, variable.value);
        }
    };
}