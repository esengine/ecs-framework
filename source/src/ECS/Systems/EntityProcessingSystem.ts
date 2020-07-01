///<reference path="./EntitySystem.ts" />
/**
 * 基本实体处理系统。将其用作处理具有特定组件的许多实体的基础
 */
abstract class EntityProcessingSystem extends EntitySystem {
    constructor(matcher: Matcher) {
        super(matcher);
    }

   
    /**
     * 处理特定的实体 
     * @param entity 
     */
    public abstract processEntity(entity: Entity);

    public lateProcessEntity(entity: Entity) {

    }

    /**
     * 遍历这个系统的所有实体并逐个处理它们
     * @param entities 
     */
    protected process(entities: Entity[]) {
        entities.forEach(entity => this.processEntity(entity));
    }

    protected lateProcess(entities: Entity[]) {
        entities.forEach(entity => this.lateProcessEntity(entity));
    }
}