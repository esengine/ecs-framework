import { EntityDataCollector } from '../../../src/Utils/Debug/EntityDataCollector';
import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { HierarchySystem } from '../../../src/ECS/Systems/HierarchySystem';
import { HierarchyComponent } from '../../../src/ECS/Components/HierarchyComponent';
import { ECSComponent } from '../../../src/ECS/Decorators';

@ECSComponent('EDC_Position')
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('EDC_Velocity')
class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
}

@ECSComponent('EDC_ComponentWithPrivate')
class ComponentWithPrivate extends Component {
    public publicValue: number = 1;
    private _privateValue: number = 2;
}

@ECSComponent('EDC_ComponentWithNested')
class ComponentWithNested extends Component {
    public nested = { value: 42 };
}

@ECSComponent('EDC_ComponentWithArray')
class ComponentWithArray extends Component {
    public items = [{ id: 1 }, { id: 2 }];
}

@ECSComponent('EDC_ComponentWithLongString')
class ComponentWithLongString extends Component {
    public longText = 'x'.repeat(300);
}

@ECSComponent('EDC_ComponentWithLargeArray')
class ComponentWithLargeArray extends Component {
    public items = Array.from({ length: 20 }, (_, i) => i);
}

describe('EntityDataCollector', () => {
    let collector: EntityDataCollector;
    let scene: Scene;

    beforeEach(() => {
        collector = new EntityDataCollector();
        scene = new Scene({ name: 'TestScene' });
    });

    afterEach(() => {
        scene.end();
    });

    describe('collectEntityData', () => {
        test('should return empty data when scene is null', () => {
            const data = collector.collectEntityData(null);

            expect(data.totalEntities).toBe(0);
            expect(data.activeEntities).toBe(0);
            expect(data.pendingAdd).toBe(0);
            expect(data.pendingRemove).toBe(0);
            expect(data.entitiesPerArchetype).toEqual([]);
            expect(data.topEntitiesByComponents).toEqual([]);
        });

        test('should return empty data when scene is undefined', () => {
            const data = collector.collectEntityData(undefined);

            expect(data.totalEntities).toBe(0);
            expect(data.activeEntities).toBe(0);
        });

        test('should collect entity data from scene', () => {
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new PositionComponent(10, 20));

            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new VelocityComponent());

            const data = collector.collectEntityData(scene);

            expect(data.totalEntities).toBe(2);
            expect(data.activeEntities).toBeGreaterThanOrEqual(0);
        });

        test('should collect archetype distribution', () => {
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new PositionComponent());

            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new PositionComponent());

            const entity3 = scene.createEntity('Entity3');
            entity3.addComponent(new VelocityComponent());

            const data = collector.collectEntityData(scene);

            expect(data.entitiesPerArchetype.length).toBeGreaterThan(0);
        });
    });

    describe('getRawEntityList', () => {
        test('should return empty array when scene is null', () => {
            const list = collector.getRawEntityList(null);
            expect(list).toEqual([]);
        });

        test('should return raw entity list from scene', () => {
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new PositionComponent(10, 20));
            entity1.tag = 0x01;

            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new VelocityComponent());

            const list = collector.getRawEntityList(scene);

            expect(list.length).toBe(2);
            expect(list[0].name).toBe('Entity1');
            expect(list[0].componentCount).toBe(1);
            expect(list[0].tag).toBe(0x01);
        });

        test('should include hierarchy information', () => {
            const hierarchySystem = new HierarchySystem();
            scene.addSystem(hierarchySystem);

            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            hierarchySystem.setParent(child, parent);

            const list = collector.getRawEntityList(scene);
            const childInfo = list.find(e => e.name === 'Child');

            expect(childInfo).toBeDefined();
            expect(childInfo!.parentId).toBe(parent.id);
            expect(childInfo!.depth).toBe(1);
        });
    });

    describe('getEntityDetails', () => {
        test('should return null when scene is null', () => {
            const details = collector.getEntityDetails(1, null);
            expect(details).toBeNull();
        });

        test('should return null when entity not found', () => {
            const details = collector.getEntityDetails(9999, scene);
            expect(details).toBeNull();
        });

        test('should return entity details', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new PositionComponent(100, 200));
            entity.tag = 42;

            const details = collector.getEntityDetails(entity.id, scene);

            expect(details).not.toBeNull();
            expect(details.componentCount).toBe(1);
            expect(details.scene).toBeDefined();
        });

        test('should handle errors gracefully', () => {
            const details = collector.getEntityDetails(-1, scene);
            expect(details).toBeNull();
        });
    });

    describe('collectEntityDataWithMemory', () => {
        test('should return empty data when scene is null', () => {
            const data = collector.collectEntityDataWithMemory(null);

            expect(data.totalEntities).toBe(0);
            expect(data.entityHierarchy).toEqual([]);
            expect(data.entityDetailsMap).toEqual({});
        });

        test('should collect entity data with memory information', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(10, 20));

            const data = collector.collectEntityDataWithMemory(scene);

            expect(data.totalEntities).toBe(1);
            expect(data.topEntitiesByComponents.length).toBeGreaterThan(0);
        });

        test('should include entity details map', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent());

            const data = collector.collectEntityDataWithMemory(scene);

            expect(data.entityDetailsMap).toBeDefined();
            expect(data.entityDetailsMap![entity.id]).toBeDefined();
        });

        test('should build entity hierarchy tree', () => {
            const hierarchySystem = new HierarchySystem();
            scene.addSystem(hierarchySystem);

            const root = scene.createEntity('Root');
            root.addComponent(new HierarchyComponent());

            const child = scene.createEntity('Child');
            hierarchySystem.setParent(child, root);

            const data = collector.collectEntityDataWithMemory(scene);

            expect(data.entityHierarchy).toBeDefined();
            expect(data.entityHierarchy!.length).toBe(1);
            expect(data.entityHierarchy![0].name).toBe('Root');
        });
    });

    describe('estimateEntityMemoryUsage', () => {
        test('should estimate memory for entity', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(10, 20));

            const memory = collector.estimateEntityMemoryUsage(entity);

            expect(memory).toBeGreaterThanOrEqual(0);
            expect(typeof memory).toBe('number');
        });

        test('should return 0 for invalid entity', () => {
            const memory = collector.estimateEntityMemoryUsage(null);
            expect(memory).toBe(0);
        });

        test('should handle errors and return 0', () => {
            const badEntity = { components: null };
            const memory = collector.estimateEntityMemoryUsage(badEntity);
            expect(memory).toBeGreaterThanOrEqual(0);
        });
    });

    describe('calculateObjectSize', () => {
        test('should return 0 for null/undefined', () => {
            expect(collector.calculateObjectSize(null)).toBe(0);
            expect(collector.calculateObjectSize(undefined)).toBe(0);
        });

        test('should calculate size for simple object', () => {
            const obj = { x: 10, y: 20, name: 'test' };
            const size = collector.calculateObjectSize(obj);

            expect(size).toBeGreaterThan(0);
        });

        test('should respect exclude keys', () => {
            const obj = { x: 10, excluded: 'large string'.repeat(100) };
            const sizeWithExclude = collector.calculateObjectSize(obj, ['excluded']);
            const sizeWithoutExclude = collector.calculateObjectSize(obj);

            expect(sizeWithExclude).toBeLessThan(sizeWithoutExclude);
        });

        test('should handle nested objects with limited depth', () => {
            const obj = {
                level1: {
                    level2: {
                        level3: {
                            value: 42
                        }
                    }
                }
            };

            const size = collector.calculateObjectSize(obj);
            expect(size).toBeGreaterThan(0);
        });
    });

    describe('extractComponentDetails', () => {
        test('should extract component details', () => {
            const component = new PositionComponent(100, 200);
            const details = collector.extractComponentDetails([component]);

            expect(details.length).toBe(1);
            expect(details[0].typeName).toBe('EDC_Position');
            expect(details[0].properties.x).toBe(100);
            expect(details[0].properties.y).toBe(200);
        });

        test('should handle empty components array', () => {
            const details = collector.extractComponentDetails([]);
            expect(details).toEqual([]);
        });

        test('should skip private properties', () => {
            const component = new ComponentWithPrivate();
            const details = collector.extractComponentDetails([component]);

            expect(details[0].properties.publicValue).toBe(1);
            expect(details[0].properties._privateValue).toBeUndefined();
        });
    });

    describe('getComponentProperties', () => {
        test('should return empty object when scene is null', () => {
            const props = collector.getComponentProperties(1, 0, null);
            expect(props).toEqual({});
        });

        test('should return empty object when entity not found', () => {
            const props = collector.getComponentProperties(9999, 0, scene);
            expect(props).toEqual({});
        });

        test('should return empty object when component index is out of bounds', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent());

            const props = collector.getComponentProperties(entity.id, 99, scene);
            expect(props).toEqual({});
        });

        test('should return component properties', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent(50, 75));

            const props = collector.getComponentProperties(entity.id, 0, scene);

            expect(props.x).toBe(50);
            expect(props.y).toBe(75);
        });
    });

    describe('expandLazyObject', () => {
        test('should return null when scene is null', () => {
            const result = collector.expandLazyObject(1, 0, 'path', null);
            expect(result).toBeNull();
        });

        test('should return null when entity not found', () => {
            const result = collector.expandLazyObject(9999, 0, 'path', scene);
            expect(result).toBeNull();
        });

        test('should return null when component index is out of bounds', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new PositionComponent());

            const result = collector.expandLazyObject(entity.id, 99, '', scene);
            expect(result).toBeNull();
        });

        test('should expand object at path', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new ComponentWithNested());

            const result = collector.expandLazyObject(entity.id, 0, 'nested', scene);

            expect(result).toBeDefined();
            expect(result.value).toBe(42);
        });

        test('should handle array index in path', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new ComponentWithArray());

            const result = collector.expandLazyObject(entity.id, 0, 'items[1]', scene);

            expect(result).toBeDefined();
            expect(result.id).toBe(2);
        });
    });

    describe('edge cases', () => {
        test('should handle scene without entities buffer', () => {
            const mockScene = {
                entities: null,
                getSystem: () => null
            };

            const data = collector.collectEntityData(mockScene as any);
            expect(data.totalEntities).toBe(0);
        });

        test('should handle entity with long string properties', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new ComponentWithLongString());

            const details = collector.extractComponentDetails(entity.components);

            expect(details[0].properties.longText).toContain('[长字符串:');
        });

        test('should handle entity with large arrays', () => {
            const entity = scene.createEntity('Entity');
            entity.addComponent(new ComponentWithLargeArray());

            const details = collector.extractComponentDetails(entity.components);

            expect(details[0].properties.items).toBeDefined();
            expect(details[0].properties.items._isLazyArray).toBe(true);
            expect(details[0].properties.items._arrayLength).toBe(20);
        });
    });
});
