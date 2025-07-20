/**
 * 实体比较器
 * 
 * 用于比较两个实体的优先级，首先按更新顺序比较，然后按ID比较。
 */
export class EntityComparer {
    /**
     * 比较两个实体
     * 
     * @param self - 第一个实体
     * @param other - 第二个实体
     * @returns 比较结果，负数表示self优先级更高，正数表示other优先级更高，0表示相等
     */
    public compare(self: Entity, other: Entity): number {
        let compare = self.updateOrder - other.updateOrder;
        if (compare == 0)
            compare = self.id - other.id;
        return compare;
    }
}

/**
 * 纯ID实体类
 * 
 * 重构后的实体类，仅作为ID容器使用，所有业务逻辑都迁移到专门的管理器中。
 * 这样的设计实现了真正的"纯ID Entity"模式，提高了系统的性能和可维护性。
 * 
 * 业务逻辑分离：
 * - 组件管理 -> ComponentManager
 * - 层次结构管理 -> HierarchyManager  
 * - 变换更新 -> TransformSystem
 * - 实体生命周期 -> EntityManager
 * 
 * @example
 * ```typescript
 * // 创建实体（通过EntityManager）
 * const entity = entityManager.createEntity("Player");
 * 
 * // 添加组件（通过ComponentManager）
 * const healthComponent = componentManager.addComponent(entity.id, new HealthComponent(100));
 * 
 * // 建立层次关系（通过HierarchyManager）
 * hierarchyManager.addChild(parent.id, child.id);
 * ```
 */
export class Entity {
    /**
     * 实体比较器实例
     */
    public static entityComparer: EntityComparer = new EntityComparer();
    
    /**
     * 实体唯一标识符
     * 
     * 在全局范围内唯一的32位数字标识符，包含索引和版本信息。
     * 使用IdentifierPool进行管理，支持版本控制防止悬垂引用。
     */
    public readonly id: number;
    
    /**
     * 实体名称
     * 
     * 用于标识和调试的友好名称，可选字段。
     */
    public name?: string;
    
    /**
     * 实体标签
     * 
     * 用于分类和查询的数字标签，默认为0。
     * 可以通过EntityManager进行标签查询。
     */
    public tag: number = 0;
    
    /**
     * 更新顺序
     * 
     * 控制实体在系统中的处理优先级，值越小优先级越高。
     */
    public updateOrder: number = 0;
    
    /**
     * 销毁状态标志
     * 
     * 标记实体是否已被销毁，由EntityManager管理。
     */
    public isDestroyed: boolean = false;
    
    /**
     * 构造函数
     * 
     * 创建一个纯ID实体实例。实体的创建应该通过EntityManager进行，
     * 以确保ID的唯一性和正确的生命周期管理。
     *
     * @param id 实体唯一标识符
     * @param name 实体名称（可选）
     */
    constructor(id: number, name?: string) {
        this.id = id;
        this.name = name;
    }
    
    /**
     * 设置实体标签
     * 
     * @param tag 新的标签值
     */
    public setTag(tag: number): void {
        this.tag = tag;
    }
    
    /**
     * 设置更新顺序
     * 
     * @param order 新的更新顺序值
     */
    public setUpdateOrder(order: number): void {
        this.updateOrder = order;
    }
    
    /**
     * 设置实体名称
     * 
     * @param name 新的名称
     */
    public setName(name: string): void {
        this.name = name;
    }
    
    /**
     * 标记实体为已销毁
     * 
     * 内部方法，应该由EntityManager调用
     * 
     * @internal
     */
    public markDestroyed(): void {
        this.isDestroyed = true;
    }
    
    /**
     * 比较实体
     * 
     * @param other 另一个实体
     * @returns 比较结果
     */
    public compareTo(other: Entity): number {
        return Entity.entityComparer.compare(this, other);
    }
    
    /**
     * 获取实体的字符串表示
     * 
     * @returns 实体的字符串描述
     */
    public toString(): string {
        const name = this.name ? this.name : `Entity_${this.id}`;
        return `Entity[${name}:${this.id}]`;
    }
    
    /**
     * 获取实体的调试信息
     * 
     * @returns 包含实体基本信息的对象
     */
    public getDebugInfo(): {
        id: number;
        name?: string;
        tag: number;
        updateOrder: number;
        isDestroyed: boolean;
    } {
        return {
            id: this.id,
            name: this.name,
            tag: this.tag,
            updateOrder: this.updateOrder,
            isDestroyed: this.isDestroyed
        };
    }
    
    /**
     * 检查两个实体是否相等
     * 
     * @param other 另一个实体
     * @returns 如果ID相同则返回true
     */
    public equals(other: Entity): boolean {
        return this.id === other.id;
    }
    
    /**
     * 获取实体的哈希码
     * 
     * @returns 实体ID作为哈希码
     */
    public hashCode(): number {
        return this.id;
    }
}