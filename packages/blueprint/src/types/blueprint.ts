/**
 * Blueprint Asset Types
 * 蓝图资产类型
 */

import { BlueprintNode, BlueprintConnection } from './nodes';

/**
 * Variable scope determines lifetime and accessibility
 * 变量作用域决定生命周期和可访问性
 */
export type VariableScope =
    | 'local'     // Per-execution (每次执行)
    | 'instance'  // Per-entity (每个实体)
    | 'global';   // Shared across all (全局共享)

/**
 * Blueprint variable definition
 * 蓝图变量定义
 */
export interface BlueprintVariable {
    /** Variable name (变量名) */
    name: string;

    /** Variable type (变量类型) */
    type: string;

    /** Default value (默认值) */
    defaultValue: unknown;

    /** Variable scope (变量作用域) */
    scope: VariableScope;

    /** Category for organization (分类) */
    category?: string;

    /** Description tooltip (描述提示) */
    tooltip?: string;
}

/**
 * Blueprint asset metadata
 * 蓝图资产元数据
 */
export interface BlueprintMetadata {
    /** Blueprint name (蓝图名称) */
    name: string;

    /** Description (描述) */
    description?: string;

    /** Category for organization (分类) */
    category?: string;

    /** Author (作者) */
    author?: string;

    /** Creation timestamp (创建时间戳) */
    createdAt?: number;

    /** Last modified timestamp (最后修改时间戳) */
    modifiedAt?: number;
}

/**
 * Blueprint asset format - saved to .bp files
 * 蓝图资产格式 - 保存为 .bp 文件
 */
export interface BlueprintAsset {
    /** Format version (格式版本) */
    version: number;

    /** Asset type identifier (资产类型标识符) */
    type: 'blueprint';

    /** Metadata (元数据) */
    metadata: BlueprintMetadata;

    /** Variable definitions (变量定义) */
    variables: BlueprintVariable[];

    /** Node instances (节点实例) */
    nodes: BlueprintNode[];

    /** Connections between nodes (节点之间的连接) */
    connections: BlueprintConnection[];
}

/**
 * Creates an empty blueprint asset
 * 创建空的蓝图资产
 */
export function createEmptyBlueprint(name: string): BlueprintAsset {
    return {
        version: 1,
        type: 'blueprint',
        metadata: {
            name,
            createdAt: Date.now(),
            modifiedAt: Date.now()
        },
        variables: [],
        nodes: [],
        connections: []
    };
}

/**
 * Validates a blueprint asset structure
 * 验证蓝图资产结构
 */
export function validateBlueprintAsset(asset: unknown): asset is BlueprintAsset {
    if (!asset || typeof asset !== 'object') return false;

    const bp = asset as BlueprintAsset;

    return (
        typeof bp.version === 'number' &&
        bp.type === 'blueprint' &&
        typeof bp.metadata === 'object' &&
        Array.isArray(bp.variables) &&
        Array.isArray(bp.nodes) &&
        Array.isArray(bp.connections)
    );
}
