import { ComponentSchema, FieldDataType, FieldSchema, ComponentRegistry } from './SchemaManifest';
import { murmur3_32 } from '../../../Utils/Hash32';
import { createLogger } from '../../../Utils/Logger';

/**
 * Schema注册表
 * 
 * 管理组件和字段的Schema定义，基于组件名和字段名自动生成稳定的hash ID用于序列化。
 * 提供简单的API，无需手动管理复杂的ID分配和外部配置文件。
 * 
 * @example
 * ```typescript
 * // 自动初始化
 * SchemaRegistry.init();
 * 
 * // 注册组件Schema
 * SchemaRegistry.registerComponent('HealthComponent', {
 *     health: { dataType: 'number' },
 *     maxHealth: { dataType: 'number' }
 * });
 * 
 * // 获取组件ID
 * const componentId = SchemaRegistry.getComponentId('HealthComponent');
 * const fieldId = SchemaRegistry.getFieldId('HealthComponent', 'health');
 * ```
 */
export class SchemaRegistry {
    private static registry: ComponentRegistry = { components: {} };
    private static componentIdCache = new Map<string, number>();
    private static fieldIdCache = new Map<string, number>();
    private static readonly logger = createLogger('SchemaRegistry');
    private static initialized = false;
    
    /**
     * 初始化Schema注册表
     * 
     * @param existingRegistry 可选的已有注册表数据
     */
    static init(existingRegistry?: ComponentRegistry): void {
        if (existingRegistry) {
            this.registry = existingRegistry;
            this.rebuildCache();
        } else {
            this.registry = { components: {} };
            this.componentIdCache.clear();
            this.fieldIdCache.clear();
        }
        
        this.initialized = true;
        this.logger.info('Schema注册表已初始化');
    }
    
    /**
     * 检查是否已初始化
     */
    static isInitialized(): boolean {
        return this.initialized;
    }
    
    /**
     * 重置注册表
     */
    static reset(): void {
        this.registry = { components: {} };
        this.componentIdCache.clear();
        this.fieldIdCache.clear();
        this.initialized = false;
    }
    
    /**
     * 导出当前注册表为JSON字符串
     */
    static exportRegistry(): string {
        return JSON.stringify(this.registry, null, 2);
    }
    
    /**
     * 从JSON字符串加载注册表
     * 
     * @param jsonString JSON格式的注册表数据
     */
    static loadFromJSON(jsonString: string): void {
        try {
            const registry = JSON.parse(jsonString) as ComponentRegistry;
            this.init(registry);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`解析注册表JSON失败: ${errorMessage}`);
        }
    }
    
    /**
     * 重建ID缓存
     */
    private static rebuildCache(): void {
        this.componentIdCache.clear();
        this.fieldIdCache.clear();
        
        for (const [componentName, schema] of Object.entries(this.registry.components)) {
            this.componentIdCache.set(componentName, this.hashString(componentName));
            
            for (const fieldName of Object.keys(schema.fields)) {
                const fieldKey = `${componentName}.${fieldName}`;
                this.fieldIdCache.set(fieldKey, this.hashString(fieldKey));
            }
        }
    }
    
    /**
     * 生成稳定的hash ID
     */
    private static hashString(str: string): number {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        return murmur3_32(bytes, 0);
    }
    
    /**
     * 获取组件的hash ID
     * 
     * @param componentName 组件名称
     */
    static getComponentId(componentName: string): number {
        if (!componentName || typeof componentName !== 'string') {
            throw new Error('组件名称不能为空且必须是字符串');
        }
        
        if (!this.componentIdCache.has(componentName)) {
            const id = this.hashString(componentName);
            this.componentIdCache.set(componentName, id);
            return id;
        }
        return this.componentIdCache.get(componentName)!;
    }
    
    /**
     * 获取字段的hash ID
     * 
     * @param componentName 组件名称
     * @param fieldName 字段名称
     */
    static getFieldId(componentName: string, fieldName: string): number {
        if (!componentName || typeof componentName !== 'string') {
            throw new Error('组件名称不能为空且必须是字符串');
        }
        if (!fieldName || typeof fieldName !== 'string') {
            throw new Error('字段名称不能为空且必须是字符串');
        }
        
        const fieldKey = `${componentName}.${fieldName}`;
        if (!this.fieldIdCache.has(fieldKey)) {
            const id = this.hashString(fieldKey);
            this.fieldIdCache.set(fieldKey, id);
            return id;
        }
        return this.fieldIdCache.get(fieldKey)!;
    }
    
    /**
     * 注册组件Schema
     * 
     * @param componentName 组件名称
     * @param fields 字段定义
     */
    static registerComponent(componentName: string, fields: Record<string, Partial<FieldSchema>>): void {
        if (!componentName || typeof componentName !== 'string') {
            throw new Error('组件名称不能为空且必须是字符串');
        }
        
        if (!this.initialized) {
            this.init();
        }
        
        const componentFields: Record<string, FieldSchema> = {};
        for (const [fieldName, fieldInfo] of Object.entries(fields)) {
            componentFields[fieldName] = {
                name: fieldName,
                dataType: fieldInfo.dataType || 'custom',
                defaultValue: fieldInfo.defaultValue,
                nullable: fieldInfo.nullable,
                serializationOptions: fieldInfo.serializationOptions
            };
        }
        
        const componentSchema: ComponentSchema = {
            name: componentName,
            fields: componentFields
        };
        
        this.registry.components[componentName] = componentSchema;
        
        this.componentIdCache.set(componentName, this.hashString(componentName));
        for (const fieldName of Object.keys(componentFields)) {
            const fieldKey = `${componentName}.${fieldName}`;
            this.fieldIdCache.set(fieldKey, this.hashString(fieldKey));
        }
        
        this.logger.debug(`已注册组件: ${componentName}`);
    }
    
    /**
     * 获取组件Schema
     * 
     * @param componentName 组件名称
     */
    static getComponentSchema(componentName: string): ComponentSchema | null {
        return this.registry.components[componentName] || null;
    }
    
    /**
     * 获取所有已注册的组件名称
     */
    static getAllComponentNames(): string[] {
        return Object.keys(this.registry.components);
    }
    
    /**
     * 检查组件是否已注册
     * 
     * @param componentName 组件名称
     */
    static hasComponent(componentName: string): boolean {
        return componentName in this.registry.components;
    }
    
    /**
     * 获取调试信息
     */
    static getDebugInfo(): {
        componentCount: number;
        totalFieldCount: number;
        componentIds: Record<string, number>;
        fieldIds: Record<string, number>;
    } {
        const componentIds: Record<string, number> = {};
        const fieldIds: Record<string, number> = {};
        let totalFieldCount = 0;
        
        for (const componentName of Object.keys(this.registry.components)) {
            componentIds[componentName] = this.getComponentId(componentName);
            
            const schema = this.registry.components[componentName];
            totalFieldCount += Object.keys(schema.fields).length;
            
            for (const fieldName of Object.keys(schema.fields)) {
                const fieldKey = `${componentName}.${fieldName}`;
                fieldIds[fieldKey] = this.getFieldId(componentName, fieldName);
            }
        }
        
        return {
            componentCount: Object.keys(this.registry.components).length,
            totalFieldCount,
            componentIds,
            fieldIds
        };
    }
}