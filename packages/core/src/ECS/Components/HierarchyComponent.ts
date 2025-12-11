import { Component } from '../Component';
import { ECSComponent } from '../Decorators';
import { Serializable, Serialize } from '../Serialization/SerializationDecorators';

/**
 * 层级关系组件 - 用于建立实体间的父子关系
 *
 * 只有需要层级关系的实体才添加此组件，遵循 ECS 组合原则。
 * 层级操作应通过 HierarchySystem 进行，而非直接修改此组件。
 *
 * @example
 * ```typescript
 * // 通过 HierarchySystem 设置父子关系
 * const hierarchySystem = scene.getSystem(HierarchySystem);
 * hierarchySystem.setParent(childEntity, parentEntity);
 *
 * // 查询层级信息
 * const parent = hierarchySystem.getParent(entity);
 * const children = hierarchySystem.getChildren(entity);
 * ```
 */
@ECSComponent('Hierarchy', { editor: { hideInInspector: true } })
@Serializable({ version: 1, typeId: 'Hierarchy' })
export class HierarchyComponent extends Component {
    /**
     * 父实体 ID
     * null 表示根实体（无父级）
     */
    @Serialize()
    public parentId: number | null = null;

    /**
     * 子实体 ID 列表
     * 顺序即为子级的排列顺序
     */
    @Serialize()
    public childIds: number[] = [];

    /**
     * 在层级中的深度
     * 根实体深度为 0，由 HierarchySystem 维护
     */
    public depth: number = 0;

    /**
     * 层级中是否激活
     * 考虑所有祖先的激活状态，由 HierarchySystem 维护
     */
    public bActiveInHierarchy: boolean = true;

    /**
     * 层级缓存是否脏
     * 用于优化缓存更新
     */
    public bCacheDirty: boolean = true;
}
