import { EntitySerializer, SerializedEntity } from '../../../src/ECS/Serialization/EntitySerializer';
import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { HierarchySystem } from '../../../src/ECS/Systems/HierarchySystem';
import { HierarchyComponent } from '../../../src/ECS/Components/HierarchyComponent';
import { ECSComponent } from '../../../src/ECS/Decorators';
import { ComponentRegistry, ComponentType } from '../../../src/ECS/Core/ComponentStorage';
import { Serializable, Serialize } from '../../../src/ECS/Serialization';

@ECSComponent('EntitySerTest_Position')
@Serializable({ version: 1 })
class PositionComponent extends Component {
    @Serialize()
    public x: number = 0;

    @Serialize()
    public y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('EntitySerTest_Velocity')
@Serializable({ version: 1 })
class VelocityComponent extends Component {
    @Serialize()
    public vx: number = 0;

    @Serialize()
    public vy: number = 0;
}

describe('EntitySerializer', () => {
    let scene: Scene;
    let hierarchySystem: HierarchySystem;
    let componentRegistry: Map<string, ComponentType>;

    beforeEach(() => {
        ComponentRegistry.reset();
        ComponentRegistry.register(PositionComponent);
        ComponentRegistry.register(VelocityComponent);
        ComponentRegistry.register(HierarchyComponent);

        scene = new Scene({ name: 'EntitySerializerTestScene' });
        hierarchySystem = new HierarchySystem();
        scene.addSystem(hierarchySystem);

        componentRegistry = ComponentRegistry.getAllComponentNames() as Map<string, ComponentType>;
    });

    afterEach(() => {
        scene.end();
    });

    describe('serialize', () => {
        test('should serialize basic entity properties', () => {
            const entity = scene.createEntity('TestEntity');
            entity.tag = 42;
            entity.active = false;
            entity.enabled = false;
            entity.updateOrder = 10;

            const serialized = EntitySerializer.serialize(entity, false);

            expect(serialized.id).toBe(entity.id);
            expect(serialized.name).toBe('TestEntity');
            expect(serialized.tag).toBe(42);
            expect(serialized.active).toBe(false);
            expect(serialized.enabled).toBe(false);
            expect(serialized.updateOrder).toBe(10);
        });

        test('should serialize entity with components', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(100, 200));
            entity.addComponent(new VelocityComponent());

            const serialized = EntitySerializer.serialize(entity, false);

            expect(serialized.components.length).toBe(2);
        });

        test('should serialize entity without children when includeChildren is false', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');
            hierarchySystem.setParent(child, parent);

            const serialized = EntitySerializer.serialize(parent, false, hierarchySystem);

            expect(serialized.children).toEqual([]);
        });

        test('should serialize entity with children when includeChildren is true', () => {
            const parent = scene.createEntity('Parent');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');

            hierarchySystem.setParent(child1, parent);
            hierarchySystem.setParent(child2, parent);

            const serialized = EntitySerializer.serialize(parent, true, hierarchySystem);

            expect(serialized.children.length).toBe(2);
            expect(serialized.children.some(c => c.name === 'Child1')).toBe(true);
            expect(serialized.children.some(c => c.name === 'Child2')).toBe(true);
        });

        test('should serialize nested hierarchy', () => {
            const root = scene.createEntity('Root');
            const child = scene.createEntity('Child');
            const grandchild = scene.createEntity('Grandchild');

            hierarchySystem.setParent(child, root);
            hierarchySystem.setParent(grandchild, child);

            const serialized = EntitySerializer.serialize(root, true, hierarchySystem);

            expect(serialized.children.length).toBe(1);
            expect(serialized.children[0].name).toBe('Child');
            expect(serialized.children[0].children.length).toBe(1);
            expect(serialized.children[0].children[0].name).toBe('Grandchild');
        });

        test('should include parentId in serialized data', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');
            hierarchySystem.setParent(child, parent);

            const serializedChild = EntitySerializer.serialize(child, false, hierarchySystem);

            expect(serializedChild.parentId).toBe(parent.id);
        });
    });

    describe('deserialize', () => {
        test('should deserialize basic entity properties', () => {
            const serialized: SerializedEntity = {
                id: 999,
                name: 'DeserializedEntity',
                tag: 77,
                active: false,
                enabled: false,
                updateOrder: 5,
                components: [],
                children: []
            };

            let nextId = 1;
            const entity = EntitySerializer.deserialize(
                serialized,
                componentRegistry,
                () => nextId++,
                false
            );

            expect(entity.name).toBe('DeserializedEntity');
            expect(entity.tag).toBe(77);
            expect(entity.active).toBe(false);
            expect(entity.enabled).toBe(false);
            expect(entity.updateOrder).toBe(5);
        });

        test('should preserve IDs when preserveIds is true', () => {
            const serialized: SerializedEntity = {
                id: 999,
                name: 'Entity',
                tag: 0,
                active: true,
                enabled: true,
                updateOrder: 0,
                components: [],
                children: []
            };

            const entity = EntitySerializer.deserialize(
                serialized,
                componentRegistry,
                () => 1,
                true
            );

            expect(entity.id).toBe(999);
        });

        test('should generate new IDs when preserveIds is false', () => {
            const serialized: SerializedEntity = {
                id: 999,
                name: 'Entity',
                tag: 0,
                active: true,
                enabled: true,
                updateOrder: 0,
                components: [],
                children: []
            };

            let nextId = 100;
            const entity = EntitySerializer.deserialize(
                serialized,
                componentRegistry,
                () => nextId++,
                false
            );

            expect(entity.id).toBe(100);
        });

        test('should deserialize components', () => {
            const serialized: SerializedEntity = {
                id: 1,
                name: 'Entity',
                tag: 0,
                active: true,
                enabled: true,
                updateOrder: 0,
                components: [
                    { type: 'EntitySerTest_Position', version: 1, data: { x: 100, y: 200 } }
                ],
                children: []
            };

            const entity = EntitySerializer.deserialize(
                serialized,
                componentRegistry,
                () => 1,
                true,
                scene
            );

            expect(entity.hasComponent(PositionComponent)).toBe(true);
            const pos = entity.getComponent(PositionComponent)!;
            expect(pos.x).toBe(100);
            expect(pos.y).toBe(200);
        });

        test('should deserialize children with hierarchy relationships', () => {
            const serialized: SerializedEntity = {
                id: 1,
                name: 'Parent',
                tag: 0,
                active: true,
                enabled: true,
                updateOrder: 0,
                components: [],
                children: [
                    {
                        id: 2,
                        name: 'Child',
                        tag: 0,
                        active: true,
                        enabled: true,
                        updateOrder: 0,
                        components: [],
                        children: []
                    }
                ]
            };

            let nextId = 10;
            const allEntities = new Map<number, Entity>();
            const entity = EntitySerializer.deserialize(
                serialized,
                componentRegistry,
                () => nextId++,
                false,
                scene,
                hierarchySystem,
                allEntities
            );

            expect(allEntities.size).toBe(2);

            const children = hierarchySystem.getChildren(entity);
            expect(children.length).toBe(1);
            expect(children[0].name).toBe('Child');
        });
    });

    describe('serializeEntities', () => {
        test('should serialize multiple entities', () => {
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');

            const serialized = EntitySerializer.serializeEntities([entity1, entity2], false);

            expect(serialized.length).toBe(2);
        });

        test('should only serialize root entities when includeChildren is true', () => {
            const root = scene.createEntity('Root');
            const child = scene.createEntity('Child');
            hierarchySystem.setParent(child, root);

            const serialized = EntitySerializer.serializeEntities(
                [root, child],
                true,
                hierarchySystem
            );

            // Should only have root (child is serialized inside root)
            expect(serialized.length).toBe(1);
            expect(serialized[0].name).toBe('Root');
            expect(serialized[0].children.length).toBe(1);
        });
    });

    describe('deserializeEntities', () => {
        test('should deserialize multiple entities', () => {
            const serializedEntities: SerializedEntity[] = [
                {
                    id: 1,
                    name: 'Entity1',
                    tag: 0,
                    active: true,
                    enabled: true,
                    updateOrder: 0,
                    components: [],
                    children: []
                },
                {
                    id: 2,
                    name: 'Entity2',
                    tag: 0,
                    active: true,
                    enabled: true,
                    updateOrder: 0,
                    components: [],
                    children: []
                }
            ];

            let nextId = 100;
            const { rootEntities, allEntities } = EntitySerializer.deserializeEntities(
                serializedEntities,
                componentRegistry,
                () => nextId++,
                false,
                scene
            );

            expect(rootEntities.length).toBe(2);
            expect(allEntities.size).toBe(2);
        });

        test('should deserialize entities with nested hierarchy', () => {
            const serializedEntities: SerializedEntity[] = [
                {
                    id: 1,
                    name: 'Root',
                    tag: 0,
                    active: true,
                    enabled: true,
                    updateOrder: 0,
                    components: [],
                    children: [
                        {
                            id: 2,
                            name: 'Child',
                            tag: 0,
                            active: true,
                            enabled: true,
                            updateOrder: 0,
                            components: [],
                            children: [
                                {
                                    id: 3,
                                    name: 'Grandchild',
                                    tag: 0,
                                    active: true,
                                    enabled: true,
                                    updateOrder: 0,
                                    components: [],
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ];

            let nextId = 10;
            const { rootEntities, allEntities } = EntitySerializer.deserializeEntities(
                serializedEntities,
                componentRegistry,
                () => nextId++,
                false,
                scene,
                hierarchySystem
            );

            expect(rootEntities.length).toBe(1);
            expect(allEntities.size).toBe(3);
        });
    });

    describe('clone', () => {
        test('should clone entity with new ID', () => {
            const original = scene.createEntity('Original');
            original.tag = 99;
            original.addComponent(new PositionComponent(50, 100));

            let nextId = 1000;
            const cloned = EntitySerializer.clone(
                original,
                componentRegistry,
                () => nextId++
            );

            expect(cloned.id).not.toBe(original.id);
            expect(cloned.name).toBe('Original');
            expect(cloned.tag).toBe(99);
            expect(cloned.hasComponent(PositionComponent)).toBe(true);

            const clonedPos = cloned.getComponent(PositionComponent)!;
            expect(clonedPos.x).toBe(50);
            expect(clonedPos.y).toBe(100);
        });

        test('should clone entity with children', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');
            hierarchySystem.setParent(child, parent);

            let nextId = 1000;
            const cloned = EntitySerializer.clone(
                parent,
                componentRegistry,
                () => nextId++
            );

            expect(cloned.name).toBe('Parent');
            // Note: Cloned entity won't have hierarchy relationships without hierarchySystem
        });
    });

    describe('edge cases', () => {
        test('should handle entity with no components', () => {
            const entity = scene.createEntity('Empty');
            const serialized = EntitySerializer.serialize(entity, false);

            expect(serialized.components).toEqual([]);
        });

        test('should handle entity with no hierarchy component', () => {
            const entity = new Entity('Standalone', 999);
            const serialized = EntitySerializer.serialize(entity, true);

            expect(serialized.children).toEqual([]);
            expect(serialized.parentId).toBeUndefined();
        });

        test('should handle default values in serialization', () => {
            const entity = scene.createEntity('Default');

            const serialized = EntitySerializer.serialize(entity, false);

            expect(serialized.active).toBe(true);
            expect(serialized.enabled).toBe(true);
            expect(serialized.updateOrder).toBe(0);
        });
    });
});
