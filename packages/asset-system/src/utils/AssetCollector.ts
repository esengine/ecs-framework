/**
 * 通用资产收集器
 * Generic Asset Collector
 *
 * 从序列化的场景数据中自动收集资产引用。
 * 支持基于字段名模式和 Property 元数据两种识别方式。
 *
 * Automatically collects asset references from serialized scene data.
 * Supports both field name pattern matching and Property metadata recognition.
 */

/**
 * 场景资产引用信息（用于构建时收集）
 * Scene asset reference info (for build-time collection)
 */
export interface SceneAssetRef {
    /** 资产 GUID | Asset GUID */
    guid: string;
    /** 来源组件类型 | Source component type */
    componentType: string;
    /** 来源字段名 | Source field name */
    fieldName: string;
    /** 实体名称（可选）| Entity name (optional) */
    entityName?: string;
}

/**
 * 资产字段模式配置
 * Asset field pattern configuration
 */
export interface AssetFieldPattern {
    /** 字段名模式（正则表达式）| Field name pattern (regex) */
    pattern: RegExp;
    /** 字段类型（用于分类）| Field type (for categorization) */
    type?: string;
}

/**
 * 默认资产字段模式
 * Default asset field patterns
 *
 * 这些模式用于识别常见的资产引用字段
 * These patterns are used to identify common asset reference fields
 */
export const DEFAULT_ASSET_PATTERNS: AssetFieldPattern[] = [
    // GUID 类字段 | GUID-like fields
    { pattern: /^.*[Gg]uid$/, type: 'guid' },
    { pattern: /^.*[Aa]sset[Ii]d$/, type: 'guid' },
    { pattern: /^.*[Aa]ssetGuid$/, type: 'guid' },

    // 纹理/贴图字段 | Texture fields
    { pattern: /^texture$/, type: 'texture' },
    { pattern: /^.*[Tt]exture[Pp]ath$/, type: 'texture' },

    // 音频字段 | Audio fields
    { pattern: /^clip$/, type: 'audio' },
    { pattern: /^.*[Aa]udio[Pp]ath$/, type: 'audio' },

    // 通用路径字段 | Generic path fields
    { pattern: /^.*[Pp]ath$/, type: 'path' },
];

/**
 * 检查值是否像 GUID
 * Check if value looks like a GUID
 */
function isGuidLike(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    // GUID 格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // 或者简单的包含连字符的长字符串
    return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) ||
           (value.includes('-') && value.length >= 30 && value.length <= 40);
}

/**
 * 从组件数据中收集资产引用
 * Collect asset references from component data
 */
function collectFromComponentData(
    componentType: string,
    data: Record<string, unknown>,
    patterns: AssetFieldPattern[],
    entityName?: string
): SceneAssetRef[] {
    const references: SceneAssetRef[] = [];

    for (const [fieldName, value] of Object.entries(data)) {
        // 检查是否匹配任何资产字段模式
        // Check if matches any asset field pattern
        const matchesPattern = patterns.some(p => p.pattern.test(fieldName));

        if (matchesPattern) {
            // 处理单个值 | Handle single value
            if (isGuidLike(value)) {
                references.push({
                    guid: value,
                    componentType,
                    fieldName,
                    entityName
                });
            }
            // 处理数组 | Handle array
            else if (Array.isArray(value)) {
                for (const item of value) {
                    if (isGuidLike(item)) {
                        references.push({
                            guid: item,
                            componentType,
                            fieldName,
                            entityName
                        });
                    }
                }
            }
        }

        // 特殊处理已知的数组字段（如 particleAssets）
        // Special handling for known array fields (like particleAssets)
        if (fieldName === 'particleAssets' && Array.isArray(value)) {
            for (const item of value) {
                if (isGuidLike(item)) {
                    references.push({
                        guid: item,
                        componentType,
                        fieldName,
                        entityName
                    });
                }
            }
        }
    }

    return references;
}

/**
 * 实体类型定义（支持嵌套 children）
 * Entity type definition (supports nested children)
 */
interface EntityData {
    name?: string;
    components?: Array<{ type: string; data?: Record<string, unknown> }>;
    children?: EntityData[];
}

/**
 * 递归处理实体及其子实体
 * Recursively process entity and its children
 */
function collectFromEntity(
    entity: EntityData,
    patterns: AssetFieldPattern[],
    references: SceneAssetRef[]
): void {
    const entityName = entity.name;

    // 处理当前实体的组件 | Process current entity's components
    if (entity.components) {
        for (const component of entity.components) {
            if (!component.data) continue;

            const componentRefs = collectFromComponentData(
                component.type,
                component.data,
                patterns,
                entityName
            );

            references.push(...componentRefs);
        }
    }

    // 递归处理子实体 | Recursively process children
    if (entity.children && Array.isArray(entity.children)) {
        for (const child of entity.children) {
            collectFromEntity(child, patterns, references);
        }
    }
}

/**
 * 从序列化的场景数据中收集所有资产引用
 * Collect all asset references from serialized scene data
 *
 * @param sceneData 序列化的场景数据（JSON 对象）| Serialized scene data (JSON object)
 * @param patterns 资产字段模式（可选，默认使用内置模式）| Asset field patterns (optional, defaults to built-in patterns)
 * @returns 资产引用列表 | List of asset references
 *
 * @example
 * ```typescript
 * const sceneData = JSON.parse(sceneJson);
 * const references = collectAssetReferences(sceneData);
 * for (const ref of references) {
 *     console.log(`Found asset ${ref.guid} in ${ref.componentType}.${ref.fieldName}`);
 * }
 * ```
 */
export function collectAssetReferences(
    sceneData: { entities?: EntityData[] },
    patterns: AssetFieldPattern[] = DEFAULT_ASSET_PATTERNS
): SceneAssetRef[] {
    const references: SceneAssetRef[] = [];

    if (!sceneData.entities) {
        return references;
    }

    // 遍历顶层实体，递归处理嵌套的子实体
    // Iterate top-level entities, recursively process nested children
    for (const entity of sceneData.entities) {
        collectFromEntity(entity, patterns, references);
    }

    return references;
}

/**
 * 从资产引用列表中提取唯一的 GUID 集合
 * Extract unique GUID set from asset references
 */
export function extractUniqueGuids(references: SceneAssetRef[]): Set<string> {
    return new Set(references.map(ref => ref.guid));
}

/**
 * 按组件类型分组资产引用
 * Group asset references by component type
 */
export function groupByComponentType(references: SceneAssetRef[]): Map<string, SceneAssetRef[]> {
    const groups = new Map<string, SceneAssetRef[]>();

    for (const ref of references) {
        const existing = groups.get(ref.componentType) || [];
        existing.push(ref);
        groups.set(ref.componentType, existing);
    }

    return groups;
}
