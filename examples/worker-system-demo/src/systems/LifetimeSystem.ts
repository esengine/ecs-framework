import { EntitySystem, Matcher, Entity, ECSSystem, Time } from '@esengine/ecs-framework';
import { Lifetime } from '../components';

@ECSSystem('LifetimeSystem')
export class LifetimeSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(Lifetime));
    }

    protected override process(entities: readonly Entity[]): void {
        const entitiesToRemove: Entity[] = [];

        for (const entity of entities) {
            const lifetime = entity.getComponent(Lifetime)!;

            // 更新年龄
            lifetime.currentAge += Time.deltaTime;

            // 检查是否需要销毁
            if (lifetime.isDead()) {
                entitiesToRemove.push(entity);
            }
        }

        // 销毁过期的实体
        for (const entity of entitiesToRemove) {
            entity.destroy();
        }
    }
}