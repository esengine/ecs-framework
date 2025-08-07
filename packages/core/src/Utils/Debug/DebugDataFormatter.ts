import { Component } from '../../ECS/Component';

/**
 * 调试数据格式化工具
 */
export class DebugDataFormatter {
    /**
     * 格式化属性值
     */
    public static formatPropertyValue(value: any, depth: number = 0): any {
        // 防止无限递归，限制最大深度
        if (depth > 5) {
            return value?.toString() || 'null';
        }

        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                // 对于数组，总是返回完整数组，让前端决定如何显示
                return value.map(item => this.formatPropertyValue(item, depth + 1));
            } else {
                // 通用对象处理：提取所有可枚举属性，不限制数量
                try {
                    const keys = Object.keys(value);
                    if (keys.length === 0) {
                        return {};
                    }
                    
                    const result: any = {};
                    keys.forEach(key => {
                        const propValue = value[key];
                        // 避免循环引用和函数属性
                        if (propValue !== value && typeof propValue !== 'function') {
                            try {
                                result[key] = this.formatPropertyValue(propValue, depth + 1);
                            } catch (error) {
                                // 如果属性访问失败，记录错误信息
                                result[key] = `[访问失败: ${error instanceof Error ? error.message : String(error)}]`;
                            }
                        }
                    });
                    return result;
                } catch (error) {
                    return `[对象解析失败: ${error instanceof Error ? error.message : String(error)}]`;
                }
            }
        }
        return value;
    }

    /**
     * 提取组件详细信息
     */
    public static extractComponentDetails(components: Component[]): Array<{
        typeName: string;
        properties: Record<string, any>;
    }> {
        return components.map((component: Component) => {
            const componentDetail = {
                typeName: component.constructor.name,
                properties: {} as Record<string, any>
            };

            // 安全地提取组件属性
            try {
                const propertyKeys = Object.keys(component);
                propertyKeys.forEach(propertyKey => {
                    // 跳过私有属性和实体引用，避免循环引用
                    if (!propertyKey.startsWith('_') && propertyKey !== 'entity') {
                        const propertyValue = (component as any)[propertyKey];
                        if (propertyValue !== undefined && propertyValue !== null) {
                            componentDetail.properties[propertyKey] = this.formatPropertyValue(propertyValue);
                        }
                    }
                });
            } catch (error) {
                componentDetail.properties['_extractionError'] = '属性提取失败';
            }

            return componentDetail;
        });
    }

    /**
     * 计算对象大小
     */
    public static calculateObjectSize(obj: any, excludeKeys: string[] = []): number {
        if (!obj || typeof obj !== 'object') return 0;
        
        let size = 0;
        const visited = new WeakSet();
        
        const calculate = (item: any): number => {
            if (!item || typeof item !== 'object' || visited.has(item)) return 0;
            visited.add(item);
            
            let itemSize = 0;
            
            try {
                for (const key in item) {
                    if (excludeKeys.includes(key)) continue;
                    
                    const value = item[key];
                    itemSize += key.length * 2; // key size
                    
                    if (typeof value === 'string') {
                        itemSize += value.length * 2;
                    } else if (typeof value === 'number') {
                        itemSize += 8;
                    } else if (typeof value === 'boolean') {
                        itemSize += 4;
                    } else if (typeof value === 'object' && value !== null) {
                        itemSize += calculate(value);
                    }
                }
            } catch (error) {
                // 忽略无法访问的属性
            }
            
            return itemSize;
        };
        
        return calculate(obj);
    }
}