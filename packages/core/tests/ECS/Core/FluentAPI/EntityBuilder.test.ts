import { EntityBuilder } from '../../../../src/ECS/Core/FluentAPI/EntityBuilder';
import { Scene } from '../../../../src/ECS/Scene';
import { Component } from '../../../../src/ECS/Component';
import { HierarchySystem } from '../../../../src/ECS/Systems/HierarchySystem';
import { ECSComponent } from '../../../../src/ECS/Decorators';

@ECSComponent('BuilderTestPosition')
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('BuilderTestVelocity')
class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
}

@ECSComponent('BuilderTestHealth')
class HealthComponent extends Component {
    public current: number = 100;
    public max: number = 100;
}

// Helper function to create EntityBuilder
function createBuilder(scene: Scene): EntityBuilder {
    return new EntityBuilder(scene, scene.componentStorageManager);
}

describe('EntityBuilder', () => {
    let scene: Scene;
    let hierarchySystem: HierarchySystem;

    beforeEach(() => {
        scene = new Scene({ name: 'BuilderTestScene' });
        hierarchySystem = new HierarchySystem();
        scene.addSystem(hierarchySystem);
    });

    afterEach(() => {
        scene.end();
    });

    describe('basic building', () => {
        test('should create entity with name', () => {
            const builder = createBuilder(scene);
            const entity = builder.named('TestEntity').build();

            expect(entity.name).toBe('TestEntity');
        });

        test('should create entity with tag', () => {
            const builder = createBuilder(scene);
            const entity = builder.tagged(0x100).build();

            expect(entity.tag).toBe(0x100);
        });

        test('should support chaining name and tag', () => {
            const entity = createBuilder(scene)
                .named('ChainedEntity')
                .tagged(0x200)
                .build();

            expect(entity.name).toBe('ChainedEntity');
            expect(entity.tag).toBe(0x200);
        });
    });

    describe('component management', () => {
        test('should add single component with .with()', () => {
            const entity = createBuilder(scene)
                .with(new PositionComponent(10, 20))
                .build();

            const pos = entity.getComponent(PositionComponent);
            expect(pos).not.toBeNull();
            expect(pos!.x).toBe(10);
            expect(pos!.y).toBe(20);
        });

        test('should add multiple components with .withComponents()', () => {
            const entity = createBuilder(scene)
                .withComponents(
                    new PositionComponent(5, 10),
                    new VelocityComponent(),
                    new HealthComponent()
                )
                .build();

            expect(entity.hasComponent(PositionComponent)).toBe(true);
            expect(entity.hasComponent(VelocityComponent)).toBe(true);
            expect(entity.hasComponent(HealthComponent)).toBe(true);
        });

        test('should conditionally add component with .withIf()', () => {
            const shouldAdd = true;
            const shouldNotAdd = false;

            const entity = createBuilder(scene)
                .withIf(shouldAdd, new PositionComponent())
                .withIf(shouldNotAdd, new VelocityComponent())
                .build();

            expect(entity.hasComponent(PositionComponent)).toBe(true);
            expect(entity.hasComponent(VelocityComponent)).toBe(false);
        });

        test('should add component using factory with .withFactory()', () => {
            const entity = createBuilder(scene)
                .withFactory(() => new PositionComponent(100, 200))
                .build();

            const pos = entity.getComponent(PositionComponent);
            expect(pos).not.toBeNull();
            expect(pos!.x).toBe(100);
            expect(pos!.y).toBe(200);
        });

        test('should configure existing component with .configure()', () => {
            const entity = createBuilder(scene)
                .with(new PositionComponent(0, 0))
                .configure(PositionComponent, (pos: PositionComponent) => {
                    pos.x = 999;
                    pos.y = 888;
                })
                .build();

            const pos = entity.getComponent(PositionComponent);
            expect(pos!.x).toBe(999);
            expect(pos!.y).toBe(888);
        });

        test('.configure() should do nothing if component does not exist', () => {
            const entity = createBuilder(scene)
                .configure(PositionComponent, (pos: PositionComponent) => {
                    pos.x = 100;
                })
                .build();

            expect(entity.hasComponent(PositionComponent)).toBe(false);
        });
    });

    describe('entity state', () => {
        test('should set enabled state', () => {
            const disabledEntity = createBuilder(scene)
                .enabled(false)
                .build();

            const enabledEntity = createBuilder(scene)
                .enabled(true)
                .build();

            expect(disabledEntity.enabled).toBe(false);
            expect(enabledEntity.enabled).toBe(true);
        });

        test('should set active state', () => {
            const inactiveEntity = createBuilder(scene)
                .active(false)
                .build();

            const activeEntity = createBuilder(scene)
                .active(true)
                .build();

            expect(inactiveEntity.active).toBe(false);
            expect(activeEntity.active).toBe(true);
        });
    });

    describe('hierarchy building', () => {
        test('should call withChild method', () => {
            const childBuilder = createBuilder(scene).named('Child');
            const builder = createBuilder(scene)
                .named('Parent')
                .withChild(childBuilder);

            // withChild returns the builder for chaining
            expect(builder).toBeInstanceOf(EntityBuilder);
        });

        test('should call withChildren method', () => {
            const child1Builder = createBuilder(scene).named('Child1');
            const child2Builder = createBuilder(scene).named('Child2');

            const builder = createBuilder(scene)
                .named('Parent')
                .withChildren(child1Builder, child2Builder);

            // withChildren returns the builder for chaining
            expect(builder).toBeInstanceOf(EntityBuilder);
        });

        test('should call withChildFactory method', () => {
            const builder = createBuilder(scene)
                .named('Parent')
                .with(new PositionComponent(100, 100))
                .withChildFactory((parentEntity) => {
                    return createBuilder(scene)
                        .named('ChildFromFactory')
                        .with(new PositionComponent(10, 20));
                });

            // withChildFactory returns the builder for chaining
            expect(builder).toBeInstanceOf(EntityBuilder);
        });

        test('should call withChildIf method', () => {
            const shouldAdd = true;
            const shouldNotAdd = false;

            const child1Builder = createBuilder(scene).named('Child1');
            const builder1 = createBuilder(scene)
                .named('Parent')
                .withChildIf(shouldAdd, child1Builder);

            expect(builder1).toBeInstanceOf(EntityBuilder);

            const child2Builder = createBuilder(scene).named('Child2');
            const builder2 = createBuilder(scene)
                .named('Parent2')
                .withChildIf(shouldNotAdd, child2Builder);

            expect(builder2).toBeInstanceOf(EntityBuilder);
        });
    });

    describe('spawning and cloning', () => {
        test('should spawn entity to scene with .spawn()', () => {
            const initialCount = scene.entities.count;

            const entity = createBuilder(scene)
                .named('SpawnedEntity')
                .with(new PositionComponent())
                .spawn();

            expect(scene.entities.count).toBe(initialCount + 1);
            expect(scene.findEntityById(entity.id)).toBe(entity);
        });

        test('.build() should not add to scene automatically', () => {
            const initialCount = scene.entities.count;

            createBuilder(scene)
                .named('BuiltEntity')
                .build();

            expect(scene.entities.count).toBe(initialCount);
        });

        test('should clone builder', () => {
            const builder = createBuilder(scene)
                .named('OriginalEntity')
                .tagged(0x50);

            const clonedBuilder = builder.clone();

            expect(clonedBuilder).not.toBe(builder);
            expect(clonedBuilder).toBeInstanceOf(EntityBuilder);
        });
    });

    describe('complex building scenarios', () => {
        test('should build complete entity with all options', () => {
            const entity = createBuilder(scene)
                .named('CompleteEntity')
                .tagged(0x100)
                .with(new PositionComponent(50, 75))
                .with(new VelocityComponent())
                .withFactory(() => new HealthComponent())
                .configure(HealthComponent, (h: HealthComponent) => {
                    h.current = 80;
                    h.max = 100;
                })
                .enabled(true)
                .active(true)
                .build();

            expect(entity.name).toBe('CompleteEntity');
            expect(entity.tag).toBe(0x100);
            expect(entity.enabled).toBe(true);
            expect(entity.active).toBe(true);

            expect(entity.hasComponent(PositionComponent)).toBe(true);
            expect(entity.hasComponent(VelocityComponent)).toBe(true);
            expect(entity.hasComponent(HealthComponent)).toBe(true);

            const health = entity.getComponent(HealthComponent);
            expect(health!.current).toBe(80);
            expect(health!.max).toBe(100);
        });

        test('should support complex chaining', () => {
            const builder = createBuilder(scene)
                .named('Root')
                .with(new PositionComponent(1, 1));

            // Add child builder chain
            const childBuilder = createBuilder(scene)
                .named('Child')
                .with(new PositionComponent(2, 2));

            // Chain withChild
            builder.withChild(childBuilder);

            // Build and spawn
            const root = builder.spawn();

            expect(root.name).toBe('Root');
            expect(root.hasComponent(PositionComponent)).toBe(true);
        });
    });
});
