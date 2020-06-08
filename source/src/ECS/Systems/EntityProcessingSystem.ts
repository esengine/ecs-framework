///<reference path="./EntitySystem.ts" />
/**
 * 基本实体处理系统。将其用作处理具有特定组件的许多实体的基础
 */
abstract class EntityProcessingSystem extends EntitySystem {
    constructor(matcher: Matcher) {
        super(matcher);
    }

    public abstract processEntity(entity: Entity);

    public lateProcessEntity(entity: Entity) {

    }

    protected process(entities: Entity[]) {
        entities.forEach(entity => this.processEntity(entity));
    }

    protected lateProcess(entities: Entity[]) {
        entities.forEach(entity => this.lateProcessEntity(entity));
    }
}