/**
 * 节点显示管理功能
 */
export function useNodeDisplay() {
    
    // 检查节点是否有可见属性
    const hasVisibleProperties = (node: any) => {
        if (!node.properties) return false;
        return Object.keys(getVisibleProperties(node)).length > 0;
    };

    // 获取可见属性
    const getVisibleProperties = (node: any) => {
        if (!node.properties) return {};
        
        const visibleProps: any = {};
        for (const [key, prop] of Object.entries(node.properties)) {
            if (shouldShowProperty(prop as any, key)) {
                visibleProps[key] = prop;
            }
        }
        return visibleProps;
    };

    // 判断属性是否应该显示
    const shouldShowProperty = (prop: any, key: string) => {
        // 总是显示这些重要属性
        const alwaysShow = ['abortType', 'repeatCount', 'priority'];
        if (alwaysShow.includes(key)) {
            return true;
        }
        
        // 对于其他属性，只在非默认值时显示
        if (prop.type === 'string' && prop.value && prop.value.trim() !== '') {
            return true;
        }
        if (prop.type === 'number' && prop.value !== 0 && prop.value !== -1) {
            return true;
        }
        if (prop.type === 'boolean' && prop.value === true) {
            return true;
        }
        if (prop.type === 'select' && prop.value !== 'None' && prop.value !== '') {
            return true;
        }
        if (prop.type === 'code' && prop.value && prop.value.trim() !== '' && prop.value !== '(context) => true') {
            return true;
        }
        
        return false;
    };

    // 格式化属性值显示
    const formatPropertyValue = (prop: any) => {
        switch (prop.type) {
            case 'boolean':
                return prop.value ? '✓' : '✗';
            case 'number':
                return prop.value.toString();
            case 'select':
                return prop.value;
            case 'string':
                return prop.value.length > 15 ? prop.value.substring(0, 15) + '...' : prop.value;
            case 'code':
                const code = prop.value || '';
                if (code.length > 20) {
                    // 尝试提取函数体的关键部分
                    const bodyMatch = code.match(/=>\s*(.+)/) || code.match(/{\s*(.+?)\s*}/);
                    if (bodyMatch) {
                        const body = bodyMatch[1].trim();
                        return body.length > 15 ? body.substring(0, 15) + '...' : body;
                    }
                    return code.substring(0, 20) + '...';
                }
                return code;
            default:
                return prop.value?.toString() || '';
        }
    };

    return {
        hasVisibleProperties,
        getVisibleProperties,
        formatPropertyValue
    };
} 