import { Component, createLogger } from '@esengine/ecs-framework';
import { SerializedData } from './SerializationTypes';
import { 
    TsrpcComponentMetadata,
    TsrpcFieldMetadata,
    TsrpcSerializationStats,
    TsrpcSerializable
} from './TsrpcTypes';
import {
    TsrpcRegistry,
    isTsrpcSerializable,
    getTsrpcMetadata,
    validateTsrpcComponent
} from './TsrpcDecorators';

const logger = createLogger('TsrpcSerializer');
export class TsrpcSerializer {
    private static _instance: TsrpcSerializer | null = null;
    private _registry: TsrpcRegistry;
    private _stats: TsrpcSerializationStats;
    
    constructor() {
        this._registry = TsrpcRegistry.getInstance();
        this._stats = {
            serializeCount: 0,
            deserializeCount: 0,
            totalSerializeTime: 0,
            totalDeserializeTime: 0,
            averageSerializedSize: 0,
            errorCount: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    
    public static getInstance(): TsrpcSerializer {
        if (!TsrpcSerializer._instance) {
            TsrpcSerializer._instance = new TsrpcSerializer();
        }
        return TsrpcSerializer._instance;
    }
    
    public serialize(component: Component): SerializedData | null {
        if (!isTsrpcSerializable(component)) return null;
        
        const metadata = getTsrpcMetadata(component.constructor);
        if (!metadata) return null;
        
        try {
            const data = this.extractSerializableData(component, metadata);
            const jsonString = JSON.stringify(data);
            const serialized = new TextEncoder().encode(jsonString);
            
            this._stats.serializeCount++;
            this._stats.averageSerializedSize = 
                (this._stats.averageSerializedSize * (this._stats.serializeCount - 1) + serialized.length) 
                / this._stats.serializeCount;
            
            return {
                type: 'tsrpc',
                componentType: metadata.componentType,
                data: serialized,
                size: serialized.length,
                schema: metadata.componentType,
                version: metadata.version
            };
        } catch (error) {
            this._stats.errorCount++;
            return null;
        }
    }
    
    public deserialize<T extends Component>(
        serializedData: SerializedData,
        ComponentClass?: new (...args: any[]) => T
    ): T | null {
        if (serializedData.type !== 'tsrpc') return null;
        
        let metadata: TsrpcComponentMetadata | undefined;
        if (ComponentClass) {
            metadata = getTsrpcMetadata(ComponentClass);
        } else {
            metadata = this._registry.getByName(serializedData.componentType);
        }
        
        if (!metadata) return null;
        
        try {
            const jsonString = new TextDecoder().decode(serializedData.data as Uint8Array);
            const data = JSON.parse(jsonString);
            
            const component = new metadata.constructor();
            this.applySerializableData(component as T, data, metadata);
            this._stats.deserializeCount++;
            
            return component as T;
        } catch (error) {
            this._stats.errorCount++;
            return null;
        }
    }
    
    
    private extractSerializableData(component: Component, metadata: TsrpcComponentMetadata): any {
        const data: any = {};
        for (const [fieldName, fieldMetadata] of metadata.fields) {
            const value = (component as any)[fieldName];
            if (value !== undefined || fieldMetadata.typeInfo.isOptional) {
                data[fieldName] = this.processFieldValue(value, fieldMetadata);
            }
        }
        return data;
    }
    
    private applySerializableData(component: Component, data: any, metadata: TsrpcComponentMetadata): void {
        for (const [fieldName, fieldMetadata] of metadata.fields) {
            if (fieldName in data) {
                const value = this.processFieldValue(data[fieldName], fieldMetadata, true);
                (component as any)[fieldName] = value;
            }
        }
        
        if (this.isTsrpcSerializableInstance(component)) {
            component.applyTsrpcData(data);
        }
    }
    
    private processFieldValue(value: any, fieldMetadata: TsrpcFieldMetadata, isDeserializing = false): any {
        if (value === null || value === undefined) return value;
        
        const { typeInfo } = fieldMetadata;
        
        if (['boolean', 'number', 'string'].includes(typeInfo.typeName)) {
            return value;
        }
        
        if (typeInfo.typeName === 'date') {
            return isDeserializing ? new Date(value) : value.toISOString();
        }
        
        if (typeInfo.isArray && Array.isArray(value)) {
            return value.map(item => this.processFieldValue(item, fieldMetadata, isDeserializing));
        }
        
        if (typeInfo.typeName === 'object' && typeof value === 'object') {
            return isDeserializing ? structuredClone(value) : value;
        }
        
        return value;
    }
    
    private isTsrpcSerializableInstance(component: any): component is TsrpcSerializable {
        return typeof component.getTsrpcData === 'function' &&
               typeof component.applyTsrpcData === 'function';
    }
    
    public getStats(): TsrpcSerializationStats {
        return { ...this._stats };
    }
    
    public resetStats(): void {
        this._stats = {
            serializeCount: 0,
            deserializeCount: 0,
            totalSerializeTime: 0,
            totalDeserializeTime: 0,
            averageSerializedSize: 0,
            errorCount: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    
    public getSupportedTypes(): string[] {
        return this._registry.getAllComponents().map(comp => comp.componentType);
    }
}

export const tsrpcSerializer = TsrpcSerializer.getInstance();