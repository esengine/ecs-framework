export enum BlackboardValueType {
    // 基础类型
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',

    // 数学类型
    Vector2 = 'vector2',
    Vector3 = 'vector3',
    Vector4 = 'vector4',
    Quaternion = 'quaternion',
    Color = 'color',

    // 引用类型
    GameObject = 'gameObject',
    Transform = 'transform',
    Component = 'component',
    AssetReference = 'assetReference',

    // 集合类型
    Array = 'array',
    Map = 'map',

    // 高级类型
    Enum = 'enum',
    Struct = 'struct',
    Function = 'function',

    // 游戏特定类型
    EntityId = 'entityId',
    NodePath = 'nodePath',
    ResourcePath = 'resourcePath',
    AnimationState = 'animationState',
    AudioClip = 'audioClip',
    Material = 'material',
    Texture = 'texture'
}

export interface Vector2 {
    x: number;
    y: number;
}

export interface Vector3 extends Vector2 {
    z: number;
}

export interface Vector4 extends Vector3 {
    w: number;
}

export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface BlackboardTypeDefinition {
    type: BlackboardValueType;
    displayName: string;
    category: 'basic' | 'math' | 'reference' | 'collection' | 'advanced' | 'game';
    defaultValue: any;
    editorComponent?: string;  // 自定义编辑器组件
    validator?: (value: any) => boolean;
    converter?: (value: any) => any;
}

export const BlackboardTypes: Record<BlackboardValueType, BlackboardTypeDefinition> = {
    [BlackboardValueType.String]: {
        type: BlackboardValueType.String,
        displayName: '字符串',
        category: 'basic',
        defaultValue: '',
        validator: (v) => typeof v === 'string'
    },
    [BlackboardValueType.Number]: {
        type: BlackboardValueType.Number,
        displayName: '数字',
        category: 'basic',
        defaultValue: 0,
        validator: (v) => typeof v === 'number'
    },
    [BlackboardValueType.Boolean]: {
        type: BlackboardValueType.Boolean,
        displayName: '布尔值',
        category: 'basic',
        defaultValue: false,
        validator: (v) => typeof v === 'boolean'
    },
    [BlackboardValueType.Vector2]: {
        type: BlackboardValueType.Vector2,
        displayName: '二维向量',
        category: 'math',
        defaultValue: { x: 0, y: 0 },
        editorComponent: 'Vector2Editor',
        validator: (v) => v && typeof v.x === 'number' && typeof v.y === 'number'
    },
    [BlackboardValueType.Vector3]: {
        type: BlackboardValueType.Vector3,
        displayName: '三维向量',
        category: 'math',
        defaultValue: { x: 0, y: 0, z: 0 },
        editorComponent: 'Vector3Editor',
        validator: (v) => v && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.z === 'number'
    },
    [BlackboardValueType.Color]: {
        type: BlackboardValueType.Color,
        displayName: '颜色',
        category: 'math',
        defaultValue: { r: 1, g: 1, b: 1, a: 1 },
        editorComponent: 'ColorEditor',
        validator: (v) => v && typeof v.r === 'number' && typeof v.g === 'number' && typeof v.b === 'number' && typeof v.a === 'number'
    },
    [BlackboardValueType.GameObject]: {
        type: BlackboardValueType.GameObject,
        displayName: '游戏对象',
        category: 'reference',
        defaultValue: null,
        editorComponent: 'GameObjectPicker'
    },
    [BlackboardValueType.Transform]: {
        type: BlackboardValueType.Transform,
        displayName: '变换组件',
        category: 'reference',
        defaultValue: null,
        editorComponent: 'ComponentPicker'
    },
    [BlackboardValueType.AssetReference]: {
        type: BlackboardValueType.AssetReference,
        displayName: '资源引用',
        category: 'reference',
        defaultValue: null,
        editorComponent: 'AssetPicker'
    },
    [BlackboardValueType.EntityId]: {
        type: BlackboardValueType.EntityId,
        displayName: '实体ID',
        category: 'game',
        defaultValue: -1,
        validator: (v) => typeof v === 'number' && v >= -1
    },
    [BlackboardValueType.ResourcePath]: {
        type: BlackboardValueType.ResourcePath,
        displayName: '资源路径',
        category: 'game',
        defaultValue: '',
        editorComponent: 'AssetPathPicker'
    },
    [BlackboardValueType.Array]: {
        type: BlackboardValueType.Array,
        displayName: '数组',
        category: 'collection',
        defaultValue: [],
        editorComponent: 'ArrayEditor'
    },
    [BlackboardValueType.Map]: {
        type: BlackboardValueType.Map,
        displayName: '映射表',
        category: 'collection',
        defaultValue: {},
        editorComponent: 'MapEditor'
    },
    [BlackboardValueType.Enum]: {
        type: BlackboardValueType.Enum,
        displayName: '枚举',
        category: 'advanced',
        defaultValue: '',
        editorComponent: 'EnumPicker'
    },
    [BlackboardValueType.AnimationState]: {
        type: BlackboardValueType.AnimationState,
        displayName: '动画状态',
        category: 'game',
        defaultValue: '',
        editorComponent: 'AnimationStatePicker'
    },
    [BlackboardValueType.AudioClip]: {
        type: BlackboardValueType.AudioClip,
        displayName: '音频片段',
        category: 'game',
        defaultValue: null,
        editorComponent: 'AudioClipPicker'
    },
    [BlackboardValueType.Material]: {
        type: BlackboardValueType.Material,
        displayName: '材质',
        category: 'game',
        defaultValue: null,
        editorComponent: 'MaterialPicker'
    },
    [BlackboardValueType.Texture]: {
        type: BlackboardValueType.Texture,
        displayName: '纹理',
        category: 'game',
        defaultValue: null,
        editorComponent: 'TexturePicker'
    },
    [BlackboardValueType.Vector4]: {
        type: BlackboardValueType.Vector4,
        displayName: '四维向量',
        category: 'math',
        defaultValue: { x: 0, y: 0, z: 0, w: 0 },
        editorComponent: 'Vector4Editor'
    },
    [BlackboardValueType.Quaternion]: {
        type: BlackboardValueType.Quaternion,
        displayName: '四元数',
        category: 'math',
        defaultValue: { x: 0, y: 0, z: 0, w: 1 },
        editorComponent: 'QuaternionEditor'
    },
    [BlackboardValueType.Component]: {
        type: BlackboardValueType.Component,
        displayName: '组件',
        category: 'reference',
        defaultValue: null,
        editorComponent: 'ComponentPicker'
    },
    [BlackboardValueType.Struct]: {
        type: BlackboardValueType.Struct,
        displayName: '结构体',
        category: 'advanced',
        defaultValue: {},
        editorComponent: 'StructEditor'
    },
    [BlackboardValueType.Function]: {
        type: BlackboardValueType.Function,
        displayName: '函数',
        category: 'advanced',
        defaultValue: null,
        editorComponent: 'FunctionPicker'
    },
    [BlackboardValueType.NodePath]: {
        type: BlackboardValueType.NodePath,
        displayName: '节点路径',
        category: 'game',
        defaultValue: '',
        editorComponent: 'NodePathPicker'
    }
};
