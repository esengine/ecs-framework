import 'reflect-metadata';
import { Component, createLogger } from '@esengine/ecs-framework';
import { 
    SyncFieldOptions, 
    TsrpcSerializableOptions, 
    TsrpcFieldMetadata, 
    TsrpcComponentMetadata,
    TsrpcSupportedTypes 
} from './TsrpcTypes';

const logger = createLogger('TsrpcDecorators');

const TSRPC_COMPONENT_KEY = Symbol('tsrpc:component');
const TSRPC_FIELDS_KEY = Symbol('tsrpc:fields');
const TSRPC_SERIALIZABLE_KEY = Symbol('tsrpc:serializable');

export class TsrpcRegistry {
    private static _instance: TsrpcRegistry | null = null;
    private _components: Map<string, TsrpcComponentMetadata> = new Map();
    private _constructors: Map<Function, TsrpcComponentMetadata> = new Map();
    
    public static getInstance(): TsrpcRegistry {
        if (!TsrpcRegistry._instance) {
            TsrpcRegistry._instance = new TsrpcRegistry();
        }
        return TsrpcRegistry._instance;
    }
    
    public register(metadata: TsrpcComponentMetadata): void {
        this._components.set(metadata.componentType, metadata);
        this._constructors.set(metadata.constructor, metadata);
    }
    
    public getByName(componentType: string): TsrpcComponentMetadata | undefined {
        return this._components.get(componentType);
    }
    
    public getByConstructor(constructor: Function): TsrpcComponentMetadata | undefined {
        return this._constructors.get(constructor);
    }
    
    public getAllComponents(): TsrpcComponentMetadata[] {
        return Array.from(this._components.values());
    }
    
    public isRegistered(constructor: Function): boolean {
        return this._constructors.has(constructor);
    }
    
    public clear(): void {
        this._components.clear();
        this._constructors.clear();
    }
}

function getTypeInfo(target: any, propertyKey: string) {
    const designType = Reflect.getMetadata('design:type', target, propertyKey);
    
    if (!designType) {
        return { typeName: 'unknown', isArray: false, isOptional: false, isUnion: false };
    }
    
    const typeName = designType.name || designType.toString();
    
    return {
        typeName: typeName.toLowerCase(),
        isArray: designType === Array || typeName === 'Array',
        isOptional: false,
        isUnion: false,
        unionTypes: [],
        genericTypes: []
    };
}

function createTypeChecker(typeInfo: any): (value: any) => boolean {
    return (value: any): boolean => {
        if (value === null || value === undefined) {
            return typeInfo.isOptional;
        }
        
        switch (typeInfo.typeName) {
            case 'boolean': return typeof value === 'boolean';
            case 'number': return typeof value === 'number' && !isNaN(value);
            case 'string': return typeof value === 'string';
            case 'array': return Array.isArray(value);
            case 'object': return typeof value === 'object' && !Array.isArray(value);
            case 'date': return value instanceof Date;
            default: return true;
        }
    };
}

export function SyncField(options: SyncFieldOptions = {}): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        if (typeof propertyKey !== 'string') {
            throw new Error('SyncField只支持字符串属性名');
        }
        
        const existingFields: Map<string, TsrpcFieldMetadata> = 
            Reflect.getMetadata(TSRPC_FIELDS_KEY, target.constructor) || new Map();
        
        const typeInfo = getTypeInfo(target, propertyKey);
        
        const fieldMetadata: TsrpcFieldMetadata = {
            propertyKey,
            options: { priority: 'normal', authorityOnly: false, throttle: 0, delta: false, ...options },
            typeInfo,
            typeChecker: createTypeChecker(typeInfo),
            fieldIndex: existingFields.size
        };
        
        existingFields.set(propertyKey, fieldMetadata);
        Reflect.defineMetadata(TSRPC_FIELDS_KEY, existingFields, target.constructor);
    };
}

export function TsrpcSerializable(options: TsrpcSerializableOptions = {}): ClassDecorator {
    return (constructor: any) => {
        Reflect.defineMetadata(TSRPC_SERIALIZABLE_KEY, true, constructor);
        
        const fields: Map<string, TsrpcFieldMetadata> = 
            Reflect.getMetadata(TSRPC_FIELDS_KEY, constructor) || new Map();
        
        const componentMetadata: TsrpcComponentMetadata = {
            componentType: options.name || constructor.name,
            options: { version: 1, validation: false, compression: false, strategy: 'auto', ...options },
            fields,
            constructor,
            version: options.version || 1,
            createdAt: Date.now()
        };
        
        Reflect.defineMetadata(TSRPC_COMPONENT_KEY, componentMetadata, constructor);
        
        const registry = TsrpcRegistry.getInstance();
        registry.register(componentMetadata);
    };
}

export function isTsrpcSerializable(component: any): boolean {
    return Reflect.getMetadata(TSRPC_SERIALIZABLE_KEY, component.constructor) === true;
}

export function getTsrpcMetadata(constructor: Function): TsrpcComponentMetadata | undefined {
    return Reflect.getMetadata(TSRPC_COMPONENT_KEY, constructor);
}

export function getTsrpcFields(constructor: Function): Map<string, TsrpcFieldMetadata> {
    return Reflect.getMetadata(TSRPC_FIELDS_KEY, constructor) || new Map();
}

export function getTsrpcName(component: any): string | undefined {
    const metadata = getTsrpcMetadata(component.constructor);
    return metadata?.componentType;
}

export const TsrpcString = (options: SyncFieldOptions = {}) => SyncField(options);
export const TsrpcNumber = (options: SyncFieldOptions = {}) => SyncField(options);
export const TsrpcBoolean = (options: SyncFieldOptions = {}) => SyncField(options);
export const TsrpcDate = (options: SyncFieldOptions = {}) => SyncField(options);
export const TsrpcArray = (options: SyncFieldOptions = {}) => SyncField({ ...options, delta: true });
export const TsrpcObject = (options: SyncFieldOptions = {}) => SyncField({ ...options, delta: true });
export const TsrpcCritical = (options: SyncFieldOptions = {}) => SyncField({ ...options, priority: 'critical' });
export const TsrpcAuthority = (options: SyncFieldOptions = {}) => SyncField({ ...options, authorityOnly: true });

export function validateTsrpcComponent(component: Component): boolean {
    const metadata = getTsrpcMetadata(component.constructor);
    if (!metadata) return false;
    
    for (const [fieldName, fieldMetadata] of metadata.fields) {
        const value = (component as any)[fieldName];
        if (fieldMetadata.typeChecker && !fieldMetadata.typeChecker(value)) {
            return false;
        }
    }
    return true;
}

export function AutoSync(target: any): any {
    return target;
}