import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';
import { ComponentTypeManager } from '../../../src/ECS/Utils/ComponentTypeManager';

class PositionComponent extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(public vx: number = 0, public vy: number = 0) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(public health: number = 100) {
        super();
    }
}

class MovementSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    
    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }

    public override onChanged(entity: Entity): void {
        if (this.matcher.isInterestedEntity(entity)) {
            if (!this.processedEntities.includes(entity)) {
                this.processedEntities.push(entity);
            }
        } else {
            const index = this.processedEntities.indexOf(entity);
            if (index !== -1) {
                this.processedEntities.splice(index, 1);
            }
        }
    }
}

class HealthSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    
    constructor() {
        super(Matcher.empty().all(HealthComponent).exclude(VelocityComponent));
    }

    public override onChanged(entity: Entity): void {
        if (this.matcher.isInterestedEntity(entity)) {
            if (!this.processedEntities.includes(entity)) {
                this.processedEntities.push(entity);
            }
        } else {
            const index = this.processedEntities.indexOf(entity);
            if (index !== -1) {
                this.processedEntities.splice(index, 1);
            }
        }
    }
}

class CombatSystem extends EntitySystem {
    public processedEntities: Entity[] = [];
    
    constructor() {
        super(Matcher.empty()
            .all(PositionComponent)
            .one(VelocityComponent, HealthComponent));
    }

    public override onChanged(entity: Entity): void {
        if (this.matcher.isInterestedEntity(entity)) {
            if (!this.processedEntities.includes(entity)) {
                this.processedEntities.push(entity);
            }
        } else {
            const index = this.processedEntities.indexOf(entity);
            if (index !== -1) {
                this.processedEntities.splice(index, 1);
            }
        }
    }
}

describe('Matcher时序集成测试', () => {
    let scene: Scene;
    let movementSystem: MovementSystem;
    let healthSystem: HealthSystem;
    let combatSystem: CombatSystem;

    beforeEach(() => {
        ComponentTypeManager.instance.reset();
        scene = new Scene();
        movementSystem = new MovementSystem();
        healthSystem = new HealthSystem();
        combatSystem = new CombatSystem();
    });

    describe('先添加实体，再添加系统', () => {
        test('MovementSystem应该正确过滤实体', () => {
            // 创建各种类型的实体
            const movingEntity = scene.createEntity('MovingEntity');
            movingEntity.addComponent(new PositionComponent(10, 20));
            movingEntity.addComponent(new VelocityComponent(1, 1));

            const staticEntity = scene.createEntity('StaticEntity');
            staticEntity.addComponent(new PositionComponent(30, 40));

            const healthEntity = scene.createEntity('HealthEntity');
            healthEntity.addComponent(new HealthComponent(80));

            const complexEntity = scene.createEntity('ComplexEntity');
            complexEntity.addComponent(new PositionComponent(50, 60));
            complexEntity.addComponent(new VelocityComponent(2, 2));
            complexEntity.addComponent(new HealthComponent(120));

            // 添加系统 - 应该发现已存在的匹配实体
            scene.addEntityProcessor(movementSystem);

            // MovementSystem需要Position + Velocity
            expect(movementSystem.processedEntities).toHaveLength(2);
            expect(movementSystem.processedEntities).toContain(movingEntity);
            expect(movementSystem.processedEntities).toContain(complexEntity);
            expect(movementSystem.processedEntities).not.toContain(staticEntity);
            expect(movementSystem.processedEntities).not.toContain(healthEntity);
        });

        test('HealthSystem应该正确过滤实体', () => {
            // 创建实体
            const healthOnlyEntity = scene.createEntity('HealthOnly');
            healthOnlyEntity.addComponent(new HealthComponent(100));

            const movingHealthEntity = scene.createEntity('MovingHealth');
            movingHealthEntity.addComponent(new HealthComponent(80));
            movingHealthEntity.addComponent(new VelocityComponent(1, 1));

            const positionHealthEntity = scene.createEntity('PositionHealth');
            positionHealthEntity.addComponent(new PositionComponent(10, 20));
            positionHealthEntity.addComponent(new HealthComponent(90));

            // 添加系统
            scene.addEntityProcessor(healthSystem);

            // HealthSystem需要Health但不要Velocity
            expect(healthSystem.processedEntities).toHaveLength(2);
            expect(healthSystem.processedEntities).toContain(healthOnlyEntity);
            expect(healthSystem.processedEntities).toContain(positionHealthEntity);
            expect(healthSystem.processedEntities).not.toContain(movingHealthEntity); // 被exclude排除
        });

        test('CombatSystem复杂匹配应该正确工作', () => {
            // 创建实体
            const warriorEntity = scene.createEntity('Warrior');
            warriorEntity.addComponent(new PositionComponent(10, 20));
            warriorEntity.addComponent(new VelocityComponent(1, 1));

            const guardEntity = scene.createEntity('Guard');
            guardEntity.addComponent(new PositionComponent(30, 40));
            guardEntity.addComponent(new HealthComponent(100));

            const archerEntity = scene.createEntity('Archer');
            archerEntity.addComponent(new PositionComponent(50, 60));
            archerEntity.addComponent(new VelocityComponent(2, 2));
            archerEntity.addComponent(new HealthComponent(80));

            const structureEntity = scene.createEntity('Structure');
            structureEntity.addComponent(new PositionComponent(70, 80));

            // 添加系统
            scene.addEntityProcessor(combatSystem);

            // CombatSystem需要Position + (Velocity OR Health)
            expect(combatSystem.processedEntities).toHaveLength(3);
            expect(combatSystem.processedEntities).toContain(warriorEntity);    // Position + Velocity
            expect(combatSystem.processedEntities).toContain(guardEntity);      // Position + Health
            expect(combatSystem.processedEntities).toContain(archerEntity);     // Position + Both
            expect(combatSystem.processedEntities).not.toContain(structureEntity); // 只有Position
        });
    });

    describe('先添加系统，再添加实体', () => {
        test('系统应该动态发现新添加的实体', () => {
            // 先添加系统
            scene.addEntityProcessor(movementSystem);
            scene.addEntityProcessor(healthSystem);
            scene.addEntityProcessor(combatSystem);

            expect(movementSystem.processedEntities).toHaveLength(0);
            expect(healthSystem.processedEntities).toHaveLength(0);
            expect(combatSystem.processedEntities).toHaveLength(0);

            // 添加匹配MovementSystem的实体
            const movingEntity = scene.createEntity('MovingEntity');
            movingEntity.addComponent(new PositionComponent(10, 20));
            movingEntity.addComponent(new VelocityComponent(1, 1));

            expect(movementSystem.processedEntities).toHaveLength(1);
            expect(movementSystem.processedEntities).toContain(movingEntity);
            expect(combatSystem.processedEntities).toContain(movingEntity); // 也匹配CombatSystem

            // 添加只匹配HealthSystem的实体
            const healthEntity = scene.createEntity('HealthEntity');
            healthEntity.addComponent(new HealthComponent(100));

            expect(healthSystem.processedEntities).toHaveLength(1);
            expect(healthSystem.processedEntities).toContain(healthEntity);
            expect(movementSystem.processedEntities).toHaveLength(1); // 不变

            // 添加匹配CombatSystem但不匹配其他的实体
            const guardEntity = scene.createEntity('GuardEntity');
            guardEntity.addComponent(new PositionComponent(30, 40));
            guardEntity.addComponent(new HealthComponent(120));

            expect(combatSystem.processedEntities).toHaveLength(2);
            expect(combatSystem.processedEntities).toContain(guardEntity);
            expect(movementSystem.processedEntities).toHaveLength(1); // 不变
            expect(healthSystem.processedEntities).toHaveLength(2); // 增加
        });
    });

    describe('混合时序和动态组件变化', () => {
        test('实体组件的动态添加移除应该正确更新所有系统', () => {
            // 先添加一些系统
            scene.addEntityProcessor(movementSystem);

            // 创建一个只有位置的实体
            const entity = scene.createEntity('DynamicEntity');
            entity.addComponent(new PositionComponent(10, 20));

            expect(movementSystem.processedEntities).toHaveLength(0); // 缺少Velocity

            // 后添加健康系统
            scene.addEntityProcessor(healthSystem);
            expect(healthSystem.processedEntities).toHaveLength(0); // 实体没有Health

            // 添加速度组件 - 应该被MovementSystem发现
            entity.addComponent(new VelocityComponent(1, 1));
            expect(movementSystem.processedEntities).toHaveLength(1);
            expect(movementSystem.processedEntities).toContain(entity);

            // 添加战斗系统
            scene.addEntityProcessor(combatSystem);
            expect(combatSystem.processedEntities).toContain(entity); // Position + Velocity

            // 添加健康组件
            entity.addComponent(new HealthComponent(100));
            expect(healthSystem.processedEntities).toHaveLength(0); // 被Velocity排除
            expect(combatSystem.processedEntities).toContain(entity); // 仍然匹配

            // 移除速度组件
            const velocityComponent = entity.getComponent(VelocityComponent);
            if (velocityComponent) {
                entity.removeComponent(velocityComponent);
            }

            expect(movementSystem.processedEntities).toHaveLength(0); // 不再匹配
            expect(healthSystem.processedEntities).toContain(entity); // 现在匹配了
            expect(combatSystem.processedEntities).toContain(entity); // Position + Health
        });
    });

    describe('场景生命周期测试', () => {
        test('场景begin()后系统过滤仍然正常工作', () => {
            // 添加实体和系统
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new PositionComponent(10, 20));
            entity1.addComponent(new VelocityComponent(1, 1));

            scene.addEntityProcessor(movementSystem);

            expect(movementSystem.processedEntities).toContain(entity1);

            // 调用场景begin
            scene.begin();

            // 添加新实体应该仍然正常工作
            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new PositionComponent(30, 40));
            entity2.addComponent(new VelocityComponent(2, 2));

            expect(movementSystem.processedEntities).toHaveLength(2);
            expect(movementSystem.processedEntities).toContain(entity2);

            // 动态添加系统也应该正常工作
            scene.addEntityProcessor(healthSystem);
            
            const healthEntity = scene.createEntity('HealthEntity');
            healthEntity.addComponent(new HealthComponent(100));
            
            expect(healthSystem.processedEntities).toContain(healthEntity);
        });
    });
});