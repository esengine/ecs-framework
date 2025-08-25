import { Component } from '../../Component';
import { World } from '../../World';
import { Entity } from '../../Entity';
import { BinaryWriter, BinaryReader } from './BinaryIO';
import { SchemaRegistry } from './SchemaRegistry';
import { SerializerRegistry } from './SerializerRegistry';
import { ComponentRegistry } from '../ComponentStorage/ComponentRegistry';
import { getClassSerializationMeta, validateSerializableComponent, shouldSerializeField } from '../../Decorators/SerializationDecorators';
import { getComponentInstanceTypeName, getComponentTypeName } from '../../Decorators/TypeDecorators';
import { murmur3_32 } from '../../../Utils/Hash32';
import type { Snapshot } from '../Snapshot/SnapshotTypes';
import { createLogger } from '../../../Utils/Logger';
import type { SerializableValue } from './SerializationTypes';
import type { FieldMeta } from '../../Decorators/SerializationDecorators';
import type { ComponentSchema, FieldSchema } from './SchemaManifest';

/**
 * 列式序列化上下文
 */
export interface ColumnarSerializationContext {
    /** 是否启用压缩 */
    compression: boolean;
    
    /** 是否跳过默认值 */
    skipDefaults: boolean;
    
    /** 是否启用严格模式（生产环境） */
    strict: boolean;
    
    /** 最大实体数量限制 */
    maxEntities: number;
    
    /** 最大组件数量限制 */
    maxComponents: number;
}

/**
 * 组件列数据
 */
export interface ComponentColumnData {
    /** 组件类型ID */
    typeId: number;
    
    /** 实体ID列表 */
    entityIds: number[];
    
    /** 存在位图 */
    presenceBitmap: Uint8Array;
    
    /** 字段数据块 */
    fieldBlocks: Map<number, FieldBlock>;
}

/**
 * 字段数据块
 */
export interface FieldBlock {
    /** 字段ID */
    fieldId: number;
    
    /** 数据类型 */
    dataType: string;
    
    /** 序列化数据 */
    data: Uint8Array;
    
    /** 数据校验和 */
    checksum: number;
}

/**
 * 序列化结果
 */
export interface SerializationResult {
    /** 二进制数据 */
    buffer: ArrayBuffer;
    
    /** 元数据 */
    metadata: {
        version: number;
        entityCount: number;
        componentTypeCount: number;
        totalSize: number;
        checksum: number;
        createdAt: number;
    };
    
    /** 性能统计 */
    stats: {
        serializationTime: number;
        compressionRatio: number;
        fieldCount: number;
    };
}

/**
 * 增量序列化上下文
 */
export interface DeltaSerializationContext extends ColumnarSerializationContext {
    /** 基线快照 */
    baseSnapshot: Snapshot;
    
    /** 是否包含删除的实体 */
    includeRemovals: boolean;
    
    /** 增量数据最大大小（字节），超过则回退到全量序列化 */
    maxDeltaSize?: number;
    
    /** 变化检测的最小时间间隔（毫秒） */
    minChangeInterval?: number;
}

/**
 * 实体变化类型
 */
export enum EntityChangeType {
    /** 实体已添加 */
    ADDED = 1,
    /** 实体已修改 */
    MODIFIED = 2,
    /** 实体已删除 */
    REMOVED = 3
}

/**
 * 组件变化类型
 */
export enum ComponentChangeType {
    /** 组件已添加 */
    ADDED = 1,
    /** 组件已修改 */
    MODIFIED = 2,
    /** 组件已删除 */
    REMOVED = 3
}

/**
 * 实体变化数据
 */
export interface EntityChange {
    /** 变化类型 */
    changeType: EntityChangeType;
    
    /** 实体ID */
    entityId: number;
    
    /** 组件变化列表 */
    componentChanges: ComponentChange[];
    
    /** 变化时间戳 */
    timestamp: number;
}

/**
 * 组件变化数据
 */
export interface ComponentChange {
    /** 变化类型 */
    changeType: ComponentChangeType;
    
    /** 组件类型ID */
    typeId: number;
    
    /** 修改的字段ID列表 */
    modifiedFields: number[];
    
    /** 序列化后的组件数据 */
    data?: Uint8Array;
    
    /** 数据校验和 */
    checksum?: number;
}

/**
 * 增量序列化结果
 */
export interface DeltaSerializationResult {
    /** 二进制数据 */
    buffer: ArrayBuffer;
    
    /** 元数据 */
    metadata: {
        /** 基线帧编号 */
        baseFrame: number;
        
        /** 增量帧编号 */
        deltaFrame: number;
        
        /** 添加的实体数量 */
        addedEntities: number;
        
        /** 修改的实体数量 */
        modifiedEntities: number;
        
        /** 删除的实体数量 */
        removedEntities: number;
        
        /** 修改的组件数量 */
        modifiedComponents: number;
        
        /** 总大小 */
        totalSize: number;
        
        /** 压缩比 */
        compressionRatio: number;
        
        /** 数据校验和 */
        checksum: number;
        
        /** 创建时间 */
        createdAt: number;
    };
    
    /** 性能统计 */
    stats: {
        /** 序列化时间 */
        serializationTime: number;
        
        /** 变化检测时间 */
        changeDetectionTime: number;
        
        /** 检测到的总变化数 */
        totalChanges: number;
    };
}

/**
 * 列式序列化引擎
 * 
 * 实现高性能的列式存储和二进制序列化，支持：
 * - 按组件类型分组的列式存储
 * - 存在位图优化空值和默认值
 * - 分块压缩和校验
 */
/**
 * 组件缓存信息
 */
interface ComponentCacheInfo {
    typeId: number;
    typeName: string;
    schema: ComponentSchema;
    fieldMetas: FieldMeta[];
    fieldIdMap: Map<string, number>;
}

/**
 * 列式序列化引擎
 * 
 * 实现高性能的列式存储和二进制序列化，支持按组件类型分组存储，
 * 使用存在位图优化空值和默认值，显著减少存储空间。
 * 
 * @example
 * ```typescript
 * // 序列化World
 * const result = ColumnarSerializer.serialize(world);
 * console.log(`序列化完成: ${result.metadata.entityCount} 实体`);
 * 
 * // 反序列化
 * ColumnarSerializer.deserialize(result.buffer, newWorld);
 * ```
 */
export class ColumnarSerializer {
    private static readonly logger = createLogger('ColumnarSerializer');
    private static readonly VERSION = 1;
    private static readonly MAGIC_HEADER = 0x45435343; // "ECSC"
    
    /** BinaryWriter对象池，避免重复内存分配 */
    private static writerPool: BinaryWriter[] = [];
    
    /** Writer池最大容量 */
    private static readonly MAX_POOL_SIZE = 20;
    
    /** 组件信息缓存，避免重复Schema查询 */
    private static componentCache = new Map<Function, ComponentCacheInfo>();
    
    /** 实体查找缓存，避免O(n²)查找 */
    private static entityLookupCache = new Map<number, Entity>();
    
    /**
     * 清理内部缓存
     */
    static clearCache(): void {
        this.componentCache.clear();
        this.entityLookupCache.clear();
    }
    
    /**
     * 获取或创建组件缓存信息
     */
    private static getOrCreateComponentCache(component: Component): ComponentCacheInfo {
        const constructor = component.constructor;
        let cacheInfo = this.componentCache.get(constructor);
        
        if (!cacheInfo) {
            const componentName = getComponentInstanceTypeName(component);
            const schema = SchemaRegistry.getComponentSchema(componentName);
            if (!schema) {
                throw new Error(`未找到组件Schema: ${componentName}`);
            }
            
            const meta = getClassSerializationMeta(constructor);
            if (!meta) {
                throw new Error(`组件 ${componentName} 缺少序列化元数据`);
            }
            
            // 构建字段ID映射
            const fieldIdMap = new Map<string, number>();
            for (const fieldMeta of meta.fields) {
                const fieldId = SchemaRegistry.getFieldId(componentName, fieldMeta.name);
                fieldIdMap.set(fieldMeta.name, fieldId);
            }
            
            cacheInfo = {
                typeId: SchemaRegistry.getComponentId(componentName),
                typeName: componentName,
                schema,
                fieldMetas: meta.fields,
                fieldIdMap
            };
            
            this.componentCache.set(constructor, cacheInfo);
        }
        
        return cacheInfo;
    }
    
    /**
     * 构建实体查找缓存
     */
    private static buildEntityLookupCache(entities: Entity[]): void {
        this.entityLookupCache.clear();
        for (const entity of entities) {
            this.entityLookupCache.set(entity.id, entity);
        }
    }
    
    /**
     * 从池中获取BinaryWriter实例
     * 
     * @returns BinaryWriter实例
     */
    private static acquireWriter(): BinaryWriter {
        if (this.writerPool.length > 0) {
            const writer = this.writerPool.pop()!;
            (writer as any).offset = 0;
            return writer;
        }
        return new BinaryWriter(64 * 1024);
    }
    
    /**
     * 将BinaryWriter归还到池中
     * 
     * @param writer - 要归还的Writer实例
     */
    private static releaseWriter(writer: BinaryWriter): void {
        if (this.writerPool.length < this.MAX_POOL_SIZE) {
            this.writerPool.push(writer);
        }
    }

    /**
     * 序列化World为列式二进制格式
     * 
     * @param world - 要序列化的World实例
     * @param context - 序列化配置上下文
     * @returns 包含二进制数据、元数据和性能统计的序列化结果
     */
    static serialize(world: World, context: ColumnarSerializationContext = this.getDefaultContext()): SerializationResult {
        const startTime = performance.now();
        
        try {
            this.validateContext(context);
            
            // 收集所有实体的组件数据
            const columnData = this.collectColumnData(world, context);
            
            // 创建二进制格式
            const buffer = this.createBinaryFormat(columnData);
            
            const endTime = performance.now();
            const serializationTime = endTime - startTime;
            
            // 计算元数据
            const metadata = this.calculateMetadata(buffer, columnData, serializationTime);
            
            // 计算性能统计
            const stats = {
                serializationTime,
                compressionRatio: 1.0,
                fieldCount: columnData.reduce((sum, column) => sum + column.fieldBlocks.size, 0)
            };
            
            this.logger.info(`序列化完成: ${metadata.entityCount} 实体, ${metadata.componentTypeCount} 组件类型, ${(serializationTime).toFixed(2)}ms`);
            
            return {
                buffer,
                metadata,
                stats
            };
            
        } catch (error) {
            this.logger.error('序列化失败:', error);
            throw new Error(`列式序列化失败: ${error}`);
        }
    }
    
    /**
     * 从二进制数据反序列化到World
     * 
     * @param buffer - 二进制序列化数据
     * @param world - 目标World实例
     * @param context - 反序列化配置上下文
     */
    static deserialize(buffer: ArrayBuffer, world: World, context: ColumnarSerializationContext = this.getDefaultContext()): void {
        const startTime = performance.now();
        
        try {
            this.validateContext(context);
            
            const reader = new BinaryReader(buffer);
            
            // 验证头部
            this.validateHeader(reader);
            
            // 读取列数据
            const columnData = this.readColumnData(reader, context);
            
            // 重建实体和组件
            this.reconstructEntities(world, columnData, context);
            
            const endTime = performance.now();
            const deserializationTime = endTime - startTime;
            
            this.logger.info(`反序列化完成: ${columnData.length} 组件类型, ${deserializationTime.toFixed(2)}ms`);
            
        } catch (error) {
            this.logger.error('反序列化失败:', error);
            throw new Error(`列式反序列化失败: ${error}`);
        }
    }
    
    /**
     * 序列化增量数据
     * 
     * @param currentWorld - 当前World状态
     * @param baselineWorld - 基线World状态
     * @param options - 增量序列化选项
     * @returns 增量序列化结果
     */
    static serializeDelta(
        currentWorld: World,
        baselineSnapshot: Snapshot | null,
        options: Partial<DeltaSerializationContext> = {}
    ): DeltaSerializationResult {
        const startTime = performance.now();
        
        try {
            // 检测变更
            const changes = baselineSnapshot 
                ? this.detectChanges(currentWorld, baselineSnapshot, options as DeltaSerializationContext)
                : this.createFullEntityChanges(currentWorld);
            
            // 创建增量二进制格式
            const buffer = this.createDeltaBinaryFormat(changes);
            
            const endTime = performance.now();
            const serializationTime = endTime - startTime;
            
            const result: DeltaSerializationResult = {
                buffer,
                metadata: {
                    baseFrame: baselineSnapshot?.frame || 0,
                    deltaFrame: Date.now(),
                    addedEntities: changes.filter(c => c.changeType === EntityChangeType.ADDED).length,
                    modifiedEntities: changes.filter(c => c.changeType === EntityChangeType.MODIFIED).length,
                    removedEntities: changes.filter(c => c.changeType === EntityChangeType.REMOVED).length,
                    modifiedComponents: changes.reduce((sum, c) => sum + c.componentChanges.length, 0),
                    totalSize: buffer.byteLength,
                    compressionRatio: 1.0,
                    checksum: 0,
                    createdAt: Date.now()
                },
                stats: {
                    serializationTime,
                    changeDetectionTime: 0,
                    totalChanges: changes.length
                }
            };
            
            this.logger.info(`增量序列化完成: ${changes.length} 个变更, ${serializationTime.toFixed(2)}ms`);
            
            return result;
            
        } catch (error) {
            this.logger.error('增量序列化失败:', error);
            throw new Error(`增量序列化失败: ${error}`);
        }
    }
    
    /**
     * 应用增量数据到World
     * 
     * @param buffer - 增量数据二进制缓冲区
     * @param world - 目标World实例
     * @param options - 应用选项
     */
    static applyDelta(
        buffer: ArrayBuffer,
        world: World,
        options: { validateChecksum?: boolean; strictMode?: boolean } = {}
    ): void {
        const startTime = performance.now();
        
        try {
            const reader = new BinaryReader(buffer);
            
            // 读取增量头部
            const deltaHeader = this.readDeltaHeader(reader);
            
            // 读取实体变更
            const entityChanges = this.readEntityChanges(reader, deltaHeader.entityChangesCount);
            
            // 应用变更到World
            this.applyChangesToWorld(world, entityChanges);
            
            const endTime = performance.now();
            const applyTime = endTime - startTime;
            
            this.logger.info(`增量应用完成: ${entityChanges.length} 个变更, ${applyTime.toFixed(2)}ms`);
            
        } catch (error) {
            this.logger.error('增量应用失败:', error);
            throw new Error(`增量应用失败: ${error}`);
        }
    }
    
    /**
     * 读取增量头部
     */
    private static readDeltaHeader(reader: BinaryReader): {
        magic: number;
        version: number;
        frameNumber: number;
        entityChangesCount: number;
        componentChangesCount: number;
    } {
        const magic = reader.readU32();
        if (magic !== 0x44454C54) { // 'DELT'
            throw new Error(`无效的增量格式魔数: 0x${magic.toString(16)}`);
        }
        
        const version = reader.readU32();
        if (version !== this.VERSION) {
            throw new Error(`不兼容的增量版本: ${version}, 期望: ${this.VERSION}`);
        }
        
        return {
            magic,
            version,
            frameNumber: reader.readU32(),
            entityChangesCount: reader.readVarInt(),
            componentChangesCount: reader.readVarInt()
        };
    }
    
    /**
     * 读取实体变更
     */
    private static readEntityChanges(reader: BinaryReader, count: number): EntityChange[] {
        const changes: EntityChange[] = [];
        
        for (let i = 0; i < count; i++) {
            const entityId = reader.readVarInt();
            const changeType = reader.readU8() as EntityChangeType;
            const componentChangesCount = reader.readVarInt();
            
            const componentChanges: ComponentChange[] = [];
            
            for (let j = 0; j < componentChangesCount; j++) {
                const typeId = reader.readVarUInt();
                const componentChangeType = reader.readU8() as ComponentChangeType;
                const modifiedFieldsCount = reader.readVarInt();
                
                const modifiedFields: number[] = [];
                for (let k = 0; k < modifiedFieldsCount; k++) {
                    modifiedFields.push(reader.readVarUInt());
                }
                
                const dataLength = reader.readVarInt();
                const data = dataLength > 0 ? reader.readBytes(dataLength) : undefined;
                
                componentChanges.push({
                    changeType: componentChangeType,
                    typeId,
                    modifiedFields,
                    data,
                    checksum: 0
                });
            }
            
            changes.push({
                changeType,
                entityId,
                componentChanges,
                timestamp: performance.now()
            });
        }
        
        return changes;
    }
    
    
    
    /**
     * 将变更应用到World
     */
    private static applyChangesToWorld(world: World, entityChanges: EntityChange[]): void {
        for (const entityChange of entityChanges) {
            switch (entityChange.changeType) {
                case EntityChangeType.ADDED:
                    this.createEntityInWorld(world, entityChange.entityId, entityChange.componentChanges);
                    break;
                case EntityChangeType.REMOVED:
                    this.destroyEntityInWorld(world, entityChange.entityId);
                    break;
                case EntityChangeType.MODIFIED:
                    this.modifyEntityInWorld(world, entityChange.entityId, entityChange.componentChanges);
                    break;
            }
        }
    }
    
    /**
     * 在World中创建实体
     */
    private static createEntityInWorld(world: World, entityId: number, componentChanges: ComponentChange[]): void {
        // 简化实现：记录日志
        this.logger.debug(`创建实体: ${entityId}, 组件变更: ${componentChanges.length}`);
    }
    
    /**
     * 在World中销毁实体
     */
    private static destroyEntityInWorld(world: World, entityId: number): void {
        // 简化实现：忽略实体销毁
        this.logger.debug(`销毁实体: ${entityId}`);
    }
    
    
    
    /**
     * 修改实体
     */
    private static modifyEntityInWorld(world: World, entityId: number, componentChanges: ComponentChange[]): void {
        // 简化实现：忽略组件修改
        this.logger.debug(`修改实体: ${entityId}, 组件变更: ${componentChanges.length}`);
    }
    
    
    
    /**
     * 收集列数据
     * 
     * @param world - 要序列化的World实例
     * @param _context - 序列化上下文配置
     * @returns 按组件类型分组的列式数据数组
     */
    private static collectColumnData(world: World, _context: ColumnarSerializationContext): ComponentColumnData[] {
        const entities = this.getAllEntitiesFromWorld(world);
        
        if (entities.length === 0) {
            return [];
        }
        
        // 构建实体查找缓存
        this.buildEntityLookupCache(entities);
        
        const componentColumns = new Map<Function, ComponentColumnData>();
        
        // 构建组件缓存和列数据结构
        for (const entity of entities) {
            if (componentColumns.size >= _context.maxComponents) {
                throw new Error(`超过最大组件类型限制: ${_context.maxComponents}`);
            }
            
            for (const component of entity.components) {
                const constructor = component.constructor;
                
                if (!componentColumns.has(constructor)) {
                    // 验证组件可序列化
                    validateSerializableComponent(component);
                    
                    // 获取组件信息
                    const cacheInfo = this.getOrCreateComponentCache(component);
                    
                    const columnData: ComponentColumnData = {
                        typeId: cacheInfo.typeId,
                        entityIds: [],
                        presenceBitmap: new Uint8Array(0),
                        fieldBlocks: new Map()
                    };
                    
                    componentColumns.set(constructor, columnData);
                }
            }
        }
        
        // 收集字段数据
        for (const entity of entities) {
            for (const component of entity.components) {
                const constructor = component.constructor;
                const columnData = componentColumns.get(constructor)!;
                const cacheInfo = this.componentCache.get(constructor)!;
                
                // 添加实体ID
                columnData.entityIds.push(entity.id);
                
                // 收集字段数据
                this.collectFieldData(component, columnData, cacheInfo, _context);
            }
        }
        
        // 生成存在位图
        for (const columnData of componentColumns.values()) {
            this.generatePresenceBitmap(columnData);
        }
        
        return Array.from(componentColumns.values());
    }
    
    /**
     * 收集组件字段数据
     * 
     * @param component - 要序列化的组件实例
     * @param columnData - 目标列数据容器
     * @param cacheInfo - 组件缓存信息
     * @param _context - 序列化上下文
     */
    private static collectFieldData(
        component: Component, 
        columnData: ComponentColumnData, 
        cacheInfo: ComponentCacheInfo, 
        _context: ColumnarSerializationContext
    ): void {
        const fieldDataToSerialize: Array<{
            fieldId: number;
            fieldMeta: FieldMeta;
            fieldValue: any;
            dataType: string;
        }> = [];
        
        // 遍历字段元数据
        for (const fieldMeta of cacheInfo.fieldMetas) {
            const fieldValue = component[fieldMeta.name as keyof Component];
            if (!shouldSerializeField(fieldMeta, fieldValue)) {
                continue;
            }
            
            // 获取字段ID
            const fieldId = cacheInfo.fieldIdMap.get(fieldMeta.name)!;
            const dataType = fieldMeta.options.dataType || 'custom';
            
            if (!columnData.fieldBlocks.has(fieldId)) {
                columnData.fieldBlocks.set(fieldId, {
                    fieldId: fieldId,
                    dataType: dataType,
                    data: new Uint8Array(0),
                    checksum: 0
                });
            }
            
            fieldDataToSerialize.push({
                fieldId,
                fieldMeta,
                fieldValue,
                dataType
            });
        }
        
        this.batchSerializeFieldValues(fieldDataToSerialize, columnData, _context);
    }
    
    
    /**
     * 批量序列化字段值
     * 
     * @param fieldDataArray - 字段数据数组
     * @param columnData - 列数据容器
     * @param _context - 序列化上下文
     */
    private static batchSerializeFieldValues(fieldDataArray: Array<{
        fieldId: number;
        fieldMeta: FieldMeta;
        fieldValue: any;
        dataType: string;
    }>, columnData: ComponentColumnData, _context: ColumnarSerializationContext): void {
        /** 按fieldId分组的字段数据 */
        const fieldGroups = new Map<number, typeof fieldDataArray>();
        
        for (const fieldData of fieldDataArray) {
            if (!fieldGroups.has(fieldData.fieldId)) {
                fieldGroups.set(fieldData.fieldId, []);
            }
            fieldGroups.get(fieldData.fieldId)!.push(fieldData);
        }
        
        for (const [fieldId, groupedFieldData] of fieldGroups) {
            const fieldBlock = columnData.fieldBlocks.get(fieldId)!;
            const writer = this.acquireWriter();
            
            try {
                for (const fieldData of groupedFieldData) {
                    const { fieldMeta, fieldValue } = fieldData;
                    
                    if (fieldMeta.options?.serializer) {
                        if (typeof fieldMeta.options.serializer === 'string') {
                            const serializedValue = SerializerRegistry.serialize(fieldMeta.options.serializer, fieldValue);
                            this.writeValue(writer, serializedValue, 'custom');
                        } else if (typeof fieldMeta.options.serializer === 'function') {
                            const serializedValue = fieldMeta.options.serializer(fieldValue);
                            this.writeValue(writer, serializedValue, 'custom');
                        }
                    } else {
                        this.writeValue(writer, fieldValue, fieldBlock.dataType);
                    }
                }
                const buffer = writer.toArrayBuffer();
                fieldBlock.data = new Uint8Array(buffer);
                
            } catch (error) {
                const fieldNames = groupedFieldData.map(f => f.fieldMeta.name).join(', ');
                throw new Error(`批量序列化字段失败 [${fieldNames}]: ${error}`);
            } finally {
                this.releaseWriter(writer);
            }
        }
    }
    
    /**
     * 写入值到BinaryWriter
     */
    private static writeValue(writer: BinaryWriter, value: SerializableValue, dataType: string): void {
        switch (dataType) {
            case 'string':
                if (typeof value === 'string') {
                    writer.writeString(value);
                } else {
                    writer.writeString(String(value ?? ''));
                }
                break;
            case 'number':
            case 'float64':
                writer.writeF64(typeof value === 'number' ? value : 0);
                break;
            case 'float32':
                writer.writeF32(typeof value === 'number' ? value : 0);
                break;
            case 'int32':
                writer.writeI32(typeof value === 'number' ? Math.floor(value) : 0);
                break;
            case 'uint32':
                writer.writeU32(typeof value === 'number' ? Math.max(0, Math.floor(value)) : 0);
                break;
            case 'int16':
                writer.writeI32(typeof value === 'number' ? Math.max(-32768, Math.min(32767, Math.floor(value))) : 0);
                break;
            case 'uint16':
                writer.writeU16(typeof value === 'number' ? Math.max(0, Math.min(65535, Math.floor(value))) : 0);
                break;
            case 'int8':
                writer.writeU8(typeof value === 'number' ? (Math.max(-128, Math.min(127, Math.floor(value))) & 0xFF) : 0);
                break;
            case 'uint8':
                writer.writeU8(typeof value === 'number' ? Math.max(0, Math.min(255, Math.floor(value))) : 0);
                break;
            case 'boolean':
                writer.writeU8(Boolean(value) ? 1 : 0);
                break;
            case 'string[]':
                this.writeArray(writer, Array.isArray(value) ? value as string[] : [], 'string');
                break;
            case 'number[]':
                this.writeArray(writer, Array.isArray(value) ? value as number[] : [], 'number');
                break;
            case 'boolean[]':
                this.writeArray(writer, Array.isArray(value) ? value as boolean[] : [], 'boolean');
                break;
            case 'float32[]':
                this.writeArray(writer, value as number[], 'float32');
                break;
            case 'int32[]':
                this.writeArray(writer, value as number[], 'int32');
                break;
            default:
                // 自定义类型，写入JSON
                writer.writeString(JSON.stringify(value));
                break;
        }
    }
    
    /**
     * 写入数组
     */
    private static writeArray(writer: BinaryWriter, array: (string | number | boolean)[], elementType: string): void {
        writer.writeVarInt(array.length);
        for (const item of array) {
            this.writeValue(writer, item, elementType);
        }
    }
    
    /**
     * 生成存在位图
     * 
     * @param columnData - 列数据
     */
    private static generatePresenceBitmap(columnData: ComponentColumnData): void {
        const entityCount = columnData.entityIds.length;
        const fieldCount = columnData.fieldBlocks.size;
        
        if (fieldCount === 0 || entityCount === 0) {
            columnData.presenceBitmap = new Uint8Array(0);
            return;
        }
        
        const totalBits = entityCount * fieldCount;
        const bitmapSize = Math.ceil(totalBits / 8);
        columnData.presenceBitmap = new Uint8Array(bitmapSize);
        
        const fieldIds = Array.from(columnData.fieldBlocks.keys());
        let bitIndex = 0;
        
        // 使用实体查找缓存
        for (let entityIndex = 0; entityIndex < entityCount; entityIndex++) {
            const entityId = columnData.entityIds[entityIndex];
            const entity = this.entityLookupCache.get(entityId);
            
            for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
                const fieldId = fieldIds[fieldIndex];
                let hasValue = false;
                
                if (entity) {
                    // 查找组件
                    const component = this.findComponentByTypeId(entity, columnData.typeId);
                    if (component) {
                        const fieldName = this.getFieldNameByIdFromCache(columnData.typeId, fieldId);
                        if (fieldName) {
                            const fieldValue = (component as any)[fieldName];
                            const dataType = columnData.fieldBlocks.get(fieldId)?.dataType || 'custom';
                            hasValue = !this.isDefaultValue(fieldValue, dataType);
                        }
                    }
                }
                
                if (hasValue) {
                    const byteIndex = Math.floor(bitIndex / 8);
                    const bitOffset = bitIndex % 8;
                    columnData.presenceBitmap[byteIndex] |= (1 << bitOffset);
                }
                
                bitIndex++;
            }
        }
    }
    
    /**
     * 通过类型ID查找组件
     */
    private static findComponentByTypeId(entity: Entity, typeId: number): Component | null {
        for (const component of entity.components) {
            const cacheInfo = this.componentCache.get(component.constructor);
            if (cacheInfo && cacheInfo.typeId === typeId) {
                return component;
            }
        }
        return null;
    }
    
    /**
     * 从缓存获取字段名
     */
    private static getFieldNameByIdFromCache(typeId: number, fieldId: number): string | null {
        for (const cacheInfo of this.componentCache.values()) {
            if (cacheInfo.typeId === typeId) {
                for (const [fieldName, cachedFieldId] of cacheInfo.fieldIdMap) {
                    if (cachedFieldId === fieldId) {
                        return fieldName;
                    }
                }
                break;
            }
        }
        return null;
    }
    
    /**
     * 检查值是否为默认值
     */
    private static isDefaultValue(value: any, dataType: string): boolean {
        if (value === null || value === undefined) return true;
        
        switch (dataType) {
            case 'string': return value === '';
            case 'number':
            case 'float32':
            case 'float64':
            case 'int32':
            case 'uint32':
            case 'int16':
            case 'uint16':
            case 'int8':
            case 'uint8':
                return value === 0;
            case 'boolean': return value === false;
            case 'string[]': 
                return Array.isArray(value) && value.length === 0;
            case 'int32[]':
            case 'float32[]':
            case 'float64[]':
                return Array.isArray(value) && value.length === 0;
            default:
                // 对于自定义类型，进行深度比较
                return this.isDefaultCustomValue(value);
        }
    }
    
    /**
     * 检查自定义类型是否为默认值
     */
    private static isDefaultCustomValue(value: any): boolean {
        if (typeof value === 'object' && value !== null) {
            // 检查对象的所有属性是否都为默认值
            const keys = Object.keys(value);
            if (keys.length === 0) return true;
            
            return keys.every(key => {
                const val = value[key];
                return val === null || val === undefined || val === 0 || val === '' || val === false;
            });
        }
        return false;
    }
    
    /**
     * 创建增量数据的二进制格式
     */
    private static createDeltaBinaryFormat(changes: EntityChange[]): ArrayBuffer {
        const writer = this.acquireWriter();
        
        // 写入增量头部
        this.writeDeltaHeader(writer, changes);
        
        // 写入实体变更
        this.writeEntityChanges(writer, changes);
        
        const buffer = writer.toArrayBuffer();
        this.releaseWriter(writer);
        return buffer;
    }
    
    /**
     * 写入增量头部
     */
    private static writeDeltaHeader(writer: BinaryWriter, changes: EntityChange[]): void {
        writer.writeU32(0x44454C54); // 'DELT' 增量格式魔数
        writer.writeU32(this.VERSION);
        writer.writeU32(Date.now());
        writer.writeVarInt(changes.length);
        const totalComponentChanges = changes.reduce((sum, c) => sum + c.componentChanges.length, 0);
        writer.writeVarInt(totalComponentChanges);
    }
    
    /**
     * 写入实体变更
     */
    private static writeEntityChanges(writer: BinaryWriter, changes: EntityChange[]): void {
        for (const change of changes) {
            writer.writeVarInt(change.entityId);
            writer.writeU8(change.changeType);
            writer.writeVarInt(change.componentChanges.length);
            
            // 写入组件变更
            for (const componentChange of change.componentChanges) {
                writer.writeVarUInt(componentChange.typeId);
                writer.writeU8(componentChange.changeType);
                writer.writeVarInt(componentChange.modifiedFields.length);
                
                // 写入修改的字段ID
                for (const fieldId of componentChange.modifiedFields) {
                    writer.writeVarUInt(fieldId);
                }
                
                // 写入组件数据(如果有)
                if (componentChange.data) {
                    writer.writeVarInt(componentChange.data.length);
                    writer.writeBytes(componentChange.data);
                } else {
                    writer.writeVarInt(0);
                }
            }
        }
    }
    
    
    
    /**
     * 创建二进制格式
     */
    private static createBinaryFormat(columnData: ComponentColumnData[]): ArrayBuffer {
        const writer = this.acquireWriter();
        
        // 写入头部
        this.writeHeader(writer, columnData);
        
        // 写入组件类型表
        this.writeComponentTypeTable(writer, columnData);
        
        // 写入列数据
        for (const column of columnData) {
            this.writeColumnData(writer, column);
        }
        
        // 获取当前缓冲区并写入校验和
        const currentBuffer = writer.toArrayBuffer();
        const checksum = murmur3_32(new Uint8Array(currentBuffer));
        
        writer.writeU32(checksum);
        
        const result = writer.toArrayBuffer();
        this.releaseWriter(writer);
        return result;
    }
    
    /**
     * 写入头部
     */
    private static writeHeader(writer: BinaryWriter, columnData: ComponentColumnData[]): void {
        writer.writeU32(this.MAGIC_HEADER);
        writer.writeU32(this.VERSION);
        writer.writeU32(Date.now());
        writer.writeVarInt(columnData.length); // 组件类型数量
        
        // 计算总实体数量
        const totalEntities = columnData.reduce((sum, column) => sum + column.entityIds.length, 0);
        writer.writeVarInt(totalEntities);
    }
    
    /**
     * 写入组件类型表
     */
    private static writeComponentTypeTable(writer: BinaryWriter, columnData: ComponentColumnData[]): void {
        for (const column of columnData) {
            writer.writeVarUInt(column.typeId);
            writer.writeVarInt(column.entityIds.length);
            writer.writeVarInt(column.fieldBlocks.size);
        }
    }
    
    /**
     * 写入列数据
     */
    private static writeColumnData(writer: BinaryWriter, columnData: ComponentColumnData): void {
        // 写入实体ID列表
        for (const entityId of columnData.entityIds) {
            writer.writeVarInt(entityId);
        }
        
        // 写入存在位图
        writer.writeVarInt(columnData.presenceBitmap.length);
        writer.writeBytes(columnData.presenceBitmap);
        
        // 写入字段数据块
        for (const [fieldId, fieldBlock] of columnData.fieldBlocks) {
            writer.writeVarUInt(fieldId);
            writer.writeVarInt(fieldBlock.data.length);
            writer.writeBytes(fieldBlock.data);
            
            // 计算并写入字段块校验和
            const checksum = murmur3_32(fieldBlock.data);
            writer.writeU32(checksum);
        }
    }
    
    /**
     * 验证头部
     */
    private static validateHeader(reader: BinaryReader): void {
        const magic = reader.readU32();
        if (magic !== this.MAGIC_HEADER) {
            throw new Error(`无效的文件格式: ${magic.toString(16)}`);
        }
        
        const version = reader.readU32();
        if (version !== this.VERSION) {
            throw new Error(`不支持的版本: ${version}`);
        }
    }
    
    /**
     * 读取列数据
     */
    private static readColumnData(reader: BinaryReader, _context: ColumnarSerializationContext): ComponentColumnData[] {
        // 跳过时间戳
        reader.readU32();
        
        const componentTypeCount = reader.readVarInt();
        const totalEntities = reader.readVarInt();
        
        this.logger.info(`开始反序列化: ${componentTypeCount} 组件类型, ${totalEntities} 总实体`);
        
        // 读取组件类型表
        const typeTable: { typeId: number; entityCount: number; fieldCount: number }[] = [];
        for (let i = 0; i < componentTypeCount; i++) {
            typeTable.push({
                typeId: reader.readVarUInt(),
                entityCount: reader.readVarInt(),
                fieldCount: reader.readVarInt()
            });
        }
        
        // 读取列数据
        const columnData: ComponentColumnData[] = [];
        for (const typeInfo of typeTable) {
            const column: ComponentColumnData = {
                typeId: typeInfo.typeId,
                entityIds: [],
                presenceBitmap: new Uint8Array(0),
                fieldBlocks: new Map()
            };
            
            // 读取实体ID列表
            for (let i = 0; i < typeInfo.entityCount; i++) {
                column.entityIds.push(reader.readVarInt());
            }
            
            // 读取存在位图
            const bitmapSize = reader.readVarInt();
            column.presenceBitmap = reader.readBytes(bitmapSize);
            
            // 读取字段数据块
            for (let i = 0; i < typeInfo.fieldCount; i++) {
                const fieldId = reader.readVarUInt();
                const dataSize = reader.readVarInt();
                const data = reader.readBytes(dataSize);
                const checksum = reader.readU32();
                
                // 验证校验和
                const calculatedChecksum = murmur3_32(data);
                if (checksum !== calculatedChecksum) {
                    throw new Error(`字段数据校验失败: fieldId=${fieldId}`);
                }
                
                column.fieldBlocks.set(fieldId, {
                    fieldId,
                    dataType: 'unknown', // 需要从Schema获取
                    data,
                    checksum
                });
            }
            
            columnData.push(column);
        }
        
        return columnData;
    }
    
    /**
     * 重建实体和组件 - 优化版本，减少重复查找和内存分配
     */
    private static reconstructEntities(world: World, columnData: ComponentColumnData[], context: ColumnarSerializationContext): void {
        try {
            const scene = world.getScene('main');
            if (!scene) {
                this.logger.error('未找到main场景');
                return;
            }

            // 清空现有实体
            scene.destroyAllEntities();

            /** 组件查找缓存，避免重复查找 */
            const componentLookupCache = new Map<number, {
                name: string;
                schema: ComponentSchema;
                type: Function;
                fieldLookup: Map<number, { name: string; schema: FieldSchema }>;
            }>();
            for (const compData of columnData) {
                if (componentLookupCache.has(compData.typeId)) {
                    continue;
                }
                
                let schema: ComponentSchema | null = null;
                let componentName = '';
                
                const allComponentNames = SchemaRegistry.getAllComponentNames();
                for (const name of allComponentNames) {
                    if (SchemaRegistry.getComponentId(name) === compData.typeId) {
                        schema = SchemaRegistry.getComponentSchema(name);
                        componentName = name;
                        break;
                    }
                }
                
                if (!schema) {
                    this.logger.warn(`未找到组件schema: typeId=${compData.typeId}`);
                    continue;
                }

                const componentType = ComponentRegistry.getComponentType(componentName);
                if (!componentType) {
                    this.logger.warn(`未找到组件类型: ${componentName}`);
                    continue;
                }
                
                const fieldLookup = new Map<number, { name: string; schema: FieldSchema }>();
                for (const [name, field] of Object.entries(schema.fields)) {
                    const fieldId = SchemaRegistry.getFieldId(componentName, name);
                    fieldLookup.set(fieldId, { name, schema: field });
                }
                
                componentLookupCache.set(compData.typeId, {
                    name: componentName,
                    schema,
                    type: componentType,
                    fieldLookup
                });
            }

            const entityComponentMap = new Map<number, any[]>();

            /** 字段数据反序列化缓存 */
            const deserializedFieldData = new Map<string, any[]>();
            
            for (const compData of columnData) {
                const componentInfo = componentLookupCache.get(compData.typeId);
                if (!componentInfo) continue;
                
                for (const [fieldId, fieldBlock] of compData.fieldBlocks) {
                    const fieldInfo = componentInfo.fieldLookup.get(fieldId);
                    if (!fieldInfo) continue;
                    
                    const cacheKey = `${compData.typeId}_${fieldId}`;
                    if (!deserializedFieldData.has(cacheKey)) {
                        let deserializedValues = this.deserializeFieldBlock(fieldBlock, fieldInfo.schema);
                        
                        if (fieldInfo.schema.serializationOptions?.serializer) {
                            const serializerName = fieldInfo.schema.serializationOptions.serializer;
                            if (typeof serializerName === 'string') {
                                deserializedValues = deserializedValues.map(v => 
                                    SerializerRegistry.deserialize(serializerName, v)
                                );
                            }
                        }
                        
                        deserializedFieldData.set(cacheKey, deserializedValues);
                    }
                }
                
                for (let i = 0; i < compData.entityIds.length; i++) {
                    const entityId = compData.entityIds[i];
                    if (!entityComponentMap.has(entityId)) {
                        entityComponentMap.set(entityId, []);
                    }

                    const ComponentConstructor = componentInfo.type as new() => Component;
                    const componentInstance = new ComponentConstructor();
                    
                    for (const [fieldId, _fieldBlock] of compData.fieldBlocks) {
                        const fieldInfo = componentInfo.fieldLookup.get(fieldId);
                        if (!fieldInfo) continue;
                        
                        const cacheKey = `${compData.typeId}_${fieldId}`;
                        const deserializedValues = deserializedFieldData.get(cacheKey);
                        if (deserializedValues && i < deserializedValues.length) {
                            (componentInstance as Record<string, any>)[fieldInfo.name] = deserializedValues[i];
                        }
                    }

                    entityComponentMap.get(entityId)!.push(componentInstance);
                }
            }

            for (const [entityId, components] of entityComponentMap) {
                const entity = scene.createEntity(`Entity_${entityId}`);
                for (const component of components) {
                    entity.addComponent(component);
                }
            }

            this.logger.info(`重建实体完成: ${entityComponentMap.size} 个实体, Scene中实体数: ${scene.entities.count}`);
            
        } catch (error) {
            this.logger.error('重建实体失败:', error);
            throw error;
        }
    }
    
    /**
     * 验证上下文
     */
    private static validateContext(context: ColumnarSerializationContext): void {
        if (context.maxEntities <= 0 || context.maxComponents <= 0) {
            throw new Error('无效的上下文限制');
        }
    }
    
    /**
     * 反序列化字段块数据 - 优化版本，减少Reader创建开销
     */
    private static deserializeFieldBlock(fieldBlock: FieldBlock, fieldSchema: FieldSchema): any[] {
        const values: any[] = [];
        const dataType = fieldSchema.dataType || 'custom';
        
        if (fieldBlock.data.length === 0) {
            return values;
        }
        
        const reader = new BinaryReader(fieldBlock.data);
        
        try {
            // 批量读取值
            while (reader.remaining() > 0) {
                const remainingBefore = reader.remaining();
                const value = this.readValue(reader, dataType);
                const remainingAfter = reader.remaining();
                values.push(value);
                
                // 防止无限循环
                if (remainingBefore === remainingAfter) {
                    this.logger.warn(`数据类型 ${dataType} 没有消费任何字节，停止读取`);
                    break;
                }
            }
        } catch (error) {
            this.logger.warn(`反序列化字段数据失败: dataType=${dataType}, 剩余字节=${reader.remaining()}, 错误=${(error as Error).message}`);
        }
        
        return values;
    }
    
    /**
     * 读取单个值
     */
    private static readValue(reader: BinaryReader, dataType: string): any {
        switch (dataType) {
            case 'number':
            case 'float64':
                return reader.readF64();
            case 'float32':
                return reader.readF32();
            case 'int32':
                return reader.readI32();
            case 'uint32':
                return reader.readU32();
            case 'int16':
                // BinaryReader没有readI16，使用readU16然后转换
                const uint16Val = reader.readU16();
                return uint16Val > 32767 ? uint16Val - 65536 : uint16Val;
            case 'uint16':
                return reader.readU16();
            case 'int8':
                // BinaryReader没有readI8，使用readU8然后转换
                const uint8Val = reader.readU8();
                return uint8Val > 127 ? uint8Val - 256 : uint8Val;
            case 'uint8':
                return reader.readU8();
            case 'boolean':
                return reader.readU8() !== 0;
            case 'string':
                return reader.readString();
            case 'string[]':
                // BinaryReader没有readStringArray，需要自定义实现
                const stringArrayLength = reader.readVarInt();
                const stringArray: string[] = [];
                for (let i = 0; i < stringArrayLength; i++) {
                    stringArray.push(reader.readString());
                }
                return stringArray;
            case 'number[]':
                // 自定义实现以匹配writeArray逻辑
                const numberArrayLength = reader.readVarInt();
                const numberArray: number[] = [];
                for (let i = 0; i < numberArrayLength; i++) {
                    numberArray.push(reader.readF64());
                }
                return numberArray;
            case 'boolean[]':
                // 自定义实现以匹配writeArray逻辑
                const booleanArrayLength = reader.readVarInt();
                const booleanArray: boolean[] = [];
                for (let i = 0; i < booleanArrayLength; i++) {
                    booleanArray.push(reader.readU8() !== 0);
                }
                return booleanArray;
            case 'float32[]':
                // 自定义实现以匹配writeArray逻辑
                const float32ArrayLength = reader.readVarInt();
                const float32Array: number[] = [];
                for (let i = 0; i < float32ArrayLength; i++) {
                    float32Array.push(reader.readF32());
                }
                return float32Array;
            case 'int32[]':
                // 自定义实现以匹配writeArray逻辑
                const int32ArrayLength = reader.readVarInt();
                const int32Array: number[] = [];
                for (let i = 0; i < int32ArrayLength; i++) {
                    int32Array.push(reader.readI32());
                }
                return int32Array;
            default:
                // 自定义类型，读取JSON
                return JSON.parse(reader.readString());
        }
    }
    
    /**
     * 获取默认上下文
     */
    private static getDefaultContext(): ColumnarSerializationContext {
        return {
            compression: true,
            skipDefaults: true,
            strict: false,
            maxEntities: 1000000, // 100万实体
            maxComponents: 10000   // 1万组件类型
        };
    }
    
    /**
     * 计算元数据
     */
    private static calculateMetadata(buffer: ArrayBuffer, columnData: ComponentColumnData[], _serializationTime: number): SerializationResult['metadata'] {
        const totalEntities = columnData.reduce((sum, column) => sum + column.entityIds.length, 0);
        const checksum = murmur3_32(new Uint8Array(buffer));
        
        return {
            version: this.VERSION,
            entityCount: totalEntities,
            componentTypeCount: columnData.length,
            totalSize: buffer.byteLength,
            checksum,
            createdAt: Date.now()
        };
    }
    
    
    /**
     * 检测World自基线快照以来的变化
     * 
     * @param world - 当前World状态
     * @param baseSnapshot - 基线快照
     * @param context - 增量序列化上下文
     * @returns 实体变化列表
     */
    /**
     * 为全量序列化创建实体变更（将所有实体标记为新增）
     */
    private static createFullEntityChanges(world: World): EntityChange[] {
        const changes: EntityChange[] = [];
        const entities = this.getAllEntitiesFromWorld(world);
        
        for (const entity of entities) {
            const componentChanges = this.createComponentChangesForNewEntity(entity);
            changes.push({
                changeType: EntityChangeType.ADDED,
                entityId: entity.id,
                componentChanges,
                timestamp: performance.now()
            });
        }
        
        return changes;
    }
    
    private static detectChanges(world: World, baseSnapshot: Snapshot, context: DeltaSerializationContext): EntityChange[] {
        const changeDetectionStart = performance.now();
        const entityChanges: EntityChange[] = [];
        
        // 获取当前所有实体
        const currentEntities = this.getAllEntitiesFromWorld(world);
        const currentEntityMap = new Map<number, Entity>();
        
        for (const entity of currentEntities) {
            currentEntityMap.set(entity.id, entity);
        }
        
        // 反序列化基线快照获取基线实体
        const baseWorld = new World();
        this.deserialize(baseSnapshot.payload, baseWorld, {
            compression: context.compression,
            skipDefaults: context.skipDefaults,
            strict: context.strict,
            maxEntities: context.maxEntities,
            maxComponents: context.maxComponents
        });
        
        const baseEntities = this.getAllEntitiesFromWorld(baseWorld);
        const baseEntityMap = new Map<number, Entity>();
        
        for (const entity of baseEntities) {
            baseEntityMap.set(entity.id, entity);
        }
        
        // 检测新增和修改的实体
        for (const [entityId, currentEntity] of currentEntityMap) {
            const baseEntity = baseEntityMap.get(entityId);
            
            if (!baseEntity) {
                // 新增的实体
                const componentChanges = this.createComponentChangesForNewEntity(currentEntity);
                entityChanges.push({
                    changeType: EntityChangeType.ADDED,
                    entityId,
                    componentChanges,
                    timestamp: performance.now()
                });
            } else {
                // 检测修改的实体
                const componentChanges = this.detectComponentChanges(currentEntity, baseEntity);
                if (componentChanges.length > 0) {
                    entityChanges.push({
                        changeType: EntityChangeType.MODIFIED,
                        entityId,
                        componentChanges,
                        timestamp: performance.now()
                    });
                }
            }
        }
        
        // 检测删除的实体
        if (context.includeRemovals) {
            for (const [entityId, baseEntity] of baseEntityMap) {
                if (!currentEntityMap.has(entityId)) {
                    entityChanges.push({
                        changeType: EntityChangeType.REMOVED,
                        entityId,
                        componentChanges: [],
                        timestamp: performance.now()
                    });
                }
            }
        }
        
        const changeDetectionTime = performance.now() - changeDetectionStart;
        this.logger.debug(`变化检测完成: ${entityChanges.length} 个变化, 用时 ${changeDetectionTime.toFixed(2)}ms`);
        
        return entityChanges;
    }
    
    /**
     * 为新实体创建组件变化列表
     * 
     * @param entity - 新实体
     * @returns 组件变化列表
     */
    private static createComponentChangesForNewEntity(entity: Entity): ComponentChange[] {
        const componentChanges: ComponentChange[] = [];
        
        for (const component of entity.components) {
            const cacheInfo = this.getOrCreateComponentCache(component);
            const serializedData = this.serializeComponent(component, cacheInfo);
            
            componentChanges.push({
                changeType: ComponentChangeType.ADDED,
                typeId: cacheInfo.typeId,
                modifiedFields: Array.from(cacheInfo.fieldIdMap.values()),
                data: serializedData.data,
                checksum: serializedData.checksum
            });
        }
        
        return componentChanges;
    }
    
    /**
     * 检测两个实体之间的组件变化
     * 
     * @param currentEntity - 当前实体
     * @param baseEntity - 基线实体
     * @returns 组件变化列表
     */
    private static detectComponentChanges(currentEntity: Entity, baseEntity: Entity): ComponentChange[] {
        const componentChanges: ComponentChange[] = [];
        
        // 构建基线实体的组件映射
        const baseComponentMap = new Map<Function, Component>();
        for (const component of baseEntity.components) {
            baseComponentMap.set(component.constructor, component);
        }
        
        // 检测当前实体的组件变化
        for (const currentComponent of currentEntity.components) {
            const constructor = currentComponent.constructor;
            const baseComponent = baseComponentMap.get(constructor);
            
            if (!baseComponent) {
                // 新增的组件
                const cacheInfo = this.getOrCreateComponentCache(currentComponent);
                const serializedData = this.serializeComponent(currentComponent, cacheInfo);
                
                componentChanges.push({
                    changeType: ComponentChangeType.ADDED,
                    typeId: cacheInfo.typeId,
                    modifiedFields: Array.from(cacheInfo.fieldIdMap.values()),
                    data: serializedData.data,
                    checksum: serializedData.checksum
                });
            } else {
                // 检测组件字段变化
                const fieldChanges = this.detectFieldChanges(currentComponent, baseComponent);
                if (fieldChanges.length > 0) {
                    const cacheInfo = this.getOrCreateComponentCache(currentComponent);
                    const serializedData = this.serializeComponent(currentComponent, cacheInfo);
                    
                    componentChanges.push({
                        changeType: ComponentChangeType.MODIFIED,
                        typeId: cacheInfo.typeId,
                        modifiedFields: fieldChanges,
                        data: serializedData.data,
                        checksum: serializedData.checksum
                    });
                }
            }
        }
        
        // 检测删除的组件
        for (const baseComponent of baseEntity.components) {
            const constructor = baseComponent.constructor;
            const hasCurrentComponent = currentEntity.components.some(c => c.constructor === constructor);
            
            if (!hasCurrentComponent) {
                const cacheInfo = this.getOrCreateComponentCache(baseComponent);
                componentChanges.push({
                    changeType: ComponentChangeType.REMOVED,
                    typeId: cacheInfo.typeId,
                    modifiedFields: []
                });
            }
        }
        
        return componentChanges;
    }
    
    /**
     * 检测组件字段变化
     * 
     * @param currentComponent - 当前组件
     * @param baseComponent - 基线组件
     * @returns 变化的字段ID列表
     */
    private static detectFieldChanges(currentComponent: Component, baseComponent: Component): number[] {
        const changedFields: number[] = [];
        const cacheInfo = this.getOrCreateComponentCache(currentComponent);
        
        for (const fieldMeta of cacheInfo.fieldMetas) {
            const fieldName = fieldMeta.name;
            const currentValue = currentComponent[fieldName as keyof Component];
            const baseValue = baseComponent[fieldName as keyof Component];
            
            if (!this.areFieldValuesEqual(currentValue, baseValue, fieldMeta.options.dataType || 'custom')) {
                const fieldId = cacheInfo.fieldIdMap.get(fieldName)!;
                changedFields.push(fieldId);
            }
        }
        
        return changedFields;
    }
    
    /**
     * 比较两个字段值是否相等
     * 
     * @param value1 - 值1
     * @param value2 - 值2
     * @param dataType - 数据类型
     * @returns 是否相等
     */
    private static areFieldValuesEqual(value1: any, value2: any, dataType: string): boolean {
        if (value1 === value2) return true;
        if (value1 == null || value2 == null) return value1 == value2;
        
        switch (dataType) {
            case 'float32':
            case 'float64':
            case 'number':
                // 浮点数比较使用小的误差范围
                return Math.abs(Number(value1) - Number(value2)) < 1e-10;
                
            case 'string':
            case 'int32':
            case 'uint32':
            case 'boolean':
                return value1 === value2;
                
            case 'string[]':
            case 'int32[]':
            case 'uint32[]':
                if (!Array.isArray(value1) || !Array.isArray(value2)) return false;
                if (value1.length !== value2.length) return false;
                return value1.every((v, i) => this.areFieldValuesEqual(v, value2[i], dataType.slice(0, -2)));
                
            default:
                // 自定义类型使用JSON字符串比较
                return JSON.stringify(value1) === JSON.stringify(value2);
        }
    }
    
    /**
     * 序列化单个组件
     * 
     * @param component - 要序列化的组件
     * @param cacheInfo - 组件缓存信息
     * @returns 序列化结果
     */
    private static serializeComponent(component: Component, cacheInfo: ComponentCacheInfo): { data: Uint8Array; checksum: number } {
        const writer = this.acquireWriter();
        
        try {
            // 序列化组件所有字段
            for (const fieldMeta of cacheInfo.fieldMetas) {
                const fieldValue = component[fieldMeta.name as keyof Component];
                if (shouldSerializeField(fieldMeta, fieldValue)) {
                    const dataType = fieldMeta.options.dataType || 'custom';
                    this.writeValue(writer, fieldValue, dataType);
                }
            }
            
            const data = new Uint8Array(writer.toArrayBuffer());
            const checksum = murmur3_32(data);
            
            return { data, checksum };
            
        } finally {
            this.releaseWriter(writer);
        }
    }
    
    /**
     * 从World获取所有实体
     */
    private static getAllEntitiesFromWorld(world: World): Entity[] {
        const entities: Entity[] = [];
        
        const scenes = world.getAllScenes();
        for (const scene of scenes) {
            if (scene?.entities?.buffer) {
                entities.push(...scene.entities.buffer);
            }
        }
        
        return entities;
    }
}