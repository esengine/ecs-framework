/**
 * 实体标签常量
 *
 * 用于标识特殊类型的实体，如文件夹、摄像机等。
 * 使用位掩码实现，支持多标签组合。
 *
 * @example
 * ```typescript
 * // 创建文件夹实体
 * entity.tag = EntityTags.FOLDER;
 *
 * // 检查是否是文件夹
 * if ((entity.tag & EntityTags.FOLDER) !== 0) {
 *     // 是文件夹
 * }
 *
 * // 组合多个标签
 * entity.tag = EntityTags.FOLDER | EntityTags.HIDDEN;
 * ```
 */
export const EntityTags = {
    /** 无标签 */
    NONE: 0x0000,

    /** 文件夹实体 - 用于场景层级中的组织分类 */
    FOLDER: 0x1000,

    /** 隐藏实体 - 在编辑器层级中不显示 */
    HIDDEN: 0x2000,

    /** 锁定实体 - 在编辑器中不可选择/编辑 */
    LOCKED: 0x4000,

    /** 编辑器专用实体 - 仅在编辑器中存在，不导出到运行时 */
    EDITOR_ONLY: 0x8000,

    /** 预制件实例 */
    PREFAB_INSTANCE: 0x0100,

    /** 预制件根节点 */
    PREFAB_ROOT: 0x0200
} as const;

export type EntityTagValue = (typeof EntityTags)[keyof typeof EntityTags];

/**
 * 检查实体是否具有指定标签
 *
 * @param entityTag - 实体的 tag 值
 * @param tag - 要检查的标签
 */
export function hasEntityTag(entityTag: number, tag: EntityTagValue): boolean {
    return (entityTag & tag) !== 0;
}

/**
 * 添加标签到实体
 *
 * @param entityTag - 当前 tag 值
 * @param tag - 要添加的标签
 */
export function addEntityTag(entityTag: number, tag: EntityTagValue): number {
    return entityTag | tag;
}

/**
 * 从实体移除标签
 *
 * @param entityTag - 当前 tag 值
 * @param tag - 要移除的标签
 */
export function removeEntityTag(entityTag: number, tag: EntityTagValue): number {
    return entityTag & ~tag;
}

/**
 * 检查实体是否是文件夹
 */
export function isFolder(entityTag: number): boolean {
    return hasEntityTag(entityTag, EntityTags.FOLDER);
}

/**
 * 检查实体是否隐藏
 */
export function isHidden(entityTag: number): boolean {
    return hasEntityTag(entityTag, EntityTags.HIDDEN);
}

/**
 * 检查实体是否锁定
 */
export function isLocked(entityTag: number): boolean {
    return hasEntityTag(entityTag, EntityTags.LOCKED);
}
