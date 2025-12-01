import { SceneSerializer } from '../../../src/ECS/Serialization/SceneSerializer';
import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { HierarchySystem } from '../../../src/ECS/Systems/HierarchySystem';
import { ECSComponent } from '../../../src/ECS/Decorators';
import { ComponentRegistry, ComponentType } from '../../../src/ECS/Core/ComponentStorage';
import { Serializable, Serialize } from '../../../src/ECS/Serialization';

@ECSComponent('SceneSerTest_Position')
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

@ECSComponent('SceneSerTest_Velocity')
@Serializable({ version: 1 })
class VelocityComponent extends Component {
    @Serialize()
    public vx: number = 0;

    @Serialize()
    public vy: number = 0;
}

describe('SceneSerializer', () => {
    let scene: Scene;
    let componentRegistry: Map<string, ComponentType>;

    beforeEach(() => {
        ComponentRegistry.reset();
        ComponentRegistry.register(PositionComponent);
        ComponentRegistry.register(VelocityComponent);

        scene = new Scene({ name: 'SceneSerializerTestScene' });

        componentRegistry = ComponentRegistry.getAllComponentNames() as Map<string, ComponentType>;
    });

    afterEach(() => {
        scene.end();
    });

    describe('serialize', () => {
        test('should serialize scene to JSON string', () => {
            scene.createEntity('Entity1').addComponent(new PositionComponent(10, 20));
            scene.createEntity('Entity2').addComponent(new VelocityComponent());

            const result = SceneSerializer.serialize(scene);

            expect(typeof result).toBe('string');
            const parsed = JSON.parse(result as string);
            expect(parsed.name).toBe('SceneSerializerTestScene');
            expect(parsed.entities.length).toBe(2);
        });

        test('should serialize scene to binary format', () => {
            scene.createEntity('Entity');

            const result = SceneSerializer.serialize(scene, { format: 'binary' });

            expect(result).toBeInstanceOf(Uint8Array);
        });

        test('should include metadata when requested', () => {
            scene.createEntity('Entity');

            const result = SceneSerializer.serialize(scene, { includeMetadata: true });
            const parsed = JSON.parse(result as string);

            expect(parsed.metadata).toBeDefined();
            expect(parsed.metadata.entityCount).toBe(1);
            expect(parsed.timestamp).toBeDefined();
        });

        test('should pretty print JSON when requested', () => {
            scene.createEntity('Entity');

            const result = SceneSerializer.serialize(scene, { pretty: true });

            expect(typeof result).toBe('string');
            expect((result as string).includes('\n')).toBe(true);
            expect((result as string).includes('  ')).toBe(true);
        });

        test('should serialize scene data', () => {
            scene.sceneData.set('level', 5);
            scene.sceneData.set('config', { difficulty: 'hard' });

            const result = SceneSerializer.serialize(scene);
            const parsed = JSON.parse(result as string);

            expect(parsed.sceneData).toBeDefined();
            expect(parsed.sceneData.level).toBe(5);
            expect(parsed.sceneData.config.difficulty).toBe('hard');
        });

        test('should serialize with component filter', () => {
            scene.createEntity('Entity1').addComponent(new PositionComponent());
            scene.createEntity('Entity2').addComponent(new VelocityComponent());

            const result = SceneSerializer.serialize(scene, {
                components: [PositionComponent]
            });
            const parsed = JSON.parse(result as string);

            // Only entities with PositionComponent should be included
            expect(parsed.entities.length).toBe(1);
        });
    });

    describe('deserialize', () => {
        test('should deserialize scene from JSON string', () => {
            scene.createEntity('Entity1').addComponent(new PositionComponent(100, 200));

            const serialized = SceneSerializer.serialize(scene);

            const newScene = new Scene({ name: 'NewScene' });
            SceneSerializer.deserialize(newScene, serialized, { componentRegistry });

            expect(newScene.entities.count).toBe(1);
            const entity = newScene.findEntity('Entity1');
            expect(entity).not.toBeNull();
            expect(entity!.hasComponent(PositionComponent)).toBe(true);

            const pos = entity!.getComponent(PositionComponent)!;
            expect(pos.x).toBe(100);
            expect(pos.y).toBe(200);

            newScene.end();
        });

        test('should deserialize scene from binary format', () => {
            scene.createEntity('BinaryEntity').addComponent(new PositionComponent(50, 75));

            const serialized = SceneSerializer.serialize(scene, { format: 'binary' });

            const newScene = new Scene({ name: 'NewScene' });
            SceneSerializer.deserialize(newScene, serialized, { componentRegistry });

            expect(newScene.entities.count).toBe(1);
            const entity = newScene.findEntity('BinaryEntity');
            expect(entity).not.toBeNull();

            newScene.end();
        });

        test('should replace existing entities with strategy replace', () => {
            scene.createEntity('Original');
            const serialized = SceneSerializer.serialize(scene);

            const targetScene = new Scene({ name: 'Target' });
            targetScene.createEntity('Existing1');
            targetScene.createEntity('Existing2');
            expect(targetScene.entities.count).toBe(2);

            SceneSerializer.deserialize(targetScene, serialized, {
                strategy: 'replace',
                componentRegistry
            });

            expect(targetScene.entities.count).toBe(1);
            expect(targetScene.findEntity('Original')).not.toBeNull();
            expect(targetScene.findEntity('Existing1')).toBeNull();

            targetScene.end();
        });

        test('should merge with existing entities with strategy merge', () => {
            scene.createEntity('FromSave');
            const serialized = SceneSerializer.serialize(scene);

            const targetScene = new Scene({ name: 'Target' });
            targetScene.createEntity('Existing');
            expect(targetScene.entities.count).toBe(1);

            SceneSerializer.deserialize(targetScene, serialized, {
                strategy: 'merge',
                componentRegistry
            });

            expect(targetScene.entities.count).toBe(2);
            expect(targetScene.findEntity('Existing')).not.toBeNull();
            expect(targetScene.findEntity('FromSave')).not.toBeNull();

            targetScene.end();
        });

        test('should restore scene data', () => {
            scene.sceneData.set('weather', 'sunny');
            scene.sceneData.set('time', 12.5);

            const serialized = SceneSerializer.serialize(scene);

            const newScene = new Scene({ name: 'NewScene' });
            SceneSerializer.deserialize(newScene, serialized, { componentRegistry });

            expect(newScene.sceneData.get('weather')).toBe('sunny');
            expect(newScene.sceneData.get('time')).toBe(12.5);

            newScene.end();
        });

        test('should call migration function when versions differ', () => {
            scene.createEntity('Entity');
            const serialized = SceneSerializer.serialize(scene);

            // Manually modify version
            const parsed = JSON.parse(serialized as string);
            parsed.version = 0;
            const modifiedSerialized = JSON.stringify(parsed);

            const migrationFn = jest.fn((oldVersion, newVersion, data) => {
                expect(oldVersion).toBe(0);
                return data;
            });

            const newScene = new Scene({ name: 'NewScene' });
            SceneSerializer.deserialize(newScene, modifiedSerialized, {
                componentRegistry,
                migration: migrationFn
            });

            expect(migrationFn).toHaveBeenCalled();

            newScene.end();
        });

        test('should throw on invalid JSON', () => {
            const newScene = new Scene({ name: 'NewScene' });

            expect(() => {
                SceneSerializer.deserialize(newScene, 'invalid json{{{', { componentRegistry });
            }).toThrow();

            newScene.end();
        });
    });

    describe('validate', () => {
        test('should validate correct save data', () => {
            scene.createEntity('Entity');
            const serialized = SceneSerializer.serialize(scene);

            const result = SceneSerializer.validate(serialized as string);

            expect(result.valid).toBe(true);
            expect(result.version).toBe(1);
        });

        test('should return errors for missing version', () => {
            const invalid = JSON.stringify({ entities: [], componentTypeRegistry: [] });

            const result = SceneSerializer.validate(invalid);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing version field');
        });

        test('should return errors for missing entities', () => {
            const invalid = JSON.stringify({ version: 1, componentTypeRegistry: [] });

            const result = SceneSerializer.validate(invalid);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing or invalid entities field');
        });

        test('should return errors for missing componentTypeRegistry', () => {
            const invalid = JSON.stringify({ version: 1, entities: [] });

            const result = SceneSerializer.validate(invalid);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing or invalid componentTypeRegistry field');
        });

        test('should handle JSON parse errors', () => {
            const result = SceneSerializer.validate('not valid json');

            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors![0]).toContain('JSON parse error');
        });
    });

    describe('getInfo', () => {
        test('should return info from save data', () => {
            scene.name = 'InfoTestScene';
            scene.createEntity('Entity1');
            scene.createEntity('Entity2');
            scene.createEntity('Entity3');

            const serialized = SceneSerializer.serialize(scene);
            const info = SceneSerializer.getInfo(serialized as string);

            expect(info).not.toBeNull();
            expect(info!.name).toBe('InfoTestScene');
            expect(info!.entityCount).toBe(3);
            expect(info!.version).toBe(1);
        });

        test('should return null for invalid data', () => {
            const info = SceneSerializer.getInfo('invalid');

            expect(info).toBeNull();
        });

        test('should include timestamp when present', () => {
            scene.createEntity('Entity');
            const serialized = SceneSerializer.serialize(scene, { includeMetadata: true });
            const info = SceneSerializer.getInfo(serialized as string);

            expect(info!.timestamp).toBeDefined();
        });
    });

    describe('scene data serialization', () => {
        test('should serialize Date objects', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            scene.sceneData.set('createdAt', date);

            const serialized = SceneSerializer.serialize(scene);
            const parsed = JSON.parse(serialized as string);

            expect(parsed.sceneData.createdAt.__type).toBe('Date');
        });

        test('should deserialize Date objects', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            scene.sceneData.set('createdAt', date);

            const serialized = SceneSerializer.serialize(scene);

            const newScene = new Scene({ name: 'NewScene' });
            SceneSerializer.deserialize(newScene, serialized, { componentRegistry });

            const restoredDate = newScene.sceneData.get('createdAt');
            expect(restoredDate).toBeInstanceOf(Date);
            expect(restoredDate.getTime()).toBe(date.getTime());

            newScene.end();
        });

        test('should serialize Map objects', () => {
            const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
            scene.sceneData.set('mapping', map);

            const serialized = SceneSerializer.serialize(scene);
            const parsed = JSON.parse(serialized as string);

            expect(parsed.sceneData.mapping.__type).toBe('Map');
        });

        test('should deserialize Map objects', () => {
            const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
            scene.sceneData.set('mapping', map);

            const serialized = SceneSerializer.serialize(scene);

            const newScene = new Scene({ name: 'NewScene' });
            SceneSerializer.deserialize(newScene, serialized, { componentRegistry });

            const restoredMap = newScene.sceneData.get('mapping');
            expect(restoredMap).toBeInstanceOf(Map);
            expect(restoredMap.get('key1')).toBe('value1');
            expect(restoredMap.get('key2')).toBe('value2');

            newScene.end();
        });

        test('should serialize Set objects', () => {
            const set = new Set([1, 2, 3]);
            scene.sceneData.set('numbers', set);

            const serialized = SceneSerializer.serialize(scene);
            const parsed = JSON.parse(serialized as string);

            expect(parsed.sceneData.numbers.__type).toBe('Set');
        });

        test('should deserialize Set objects', () => {
            const set = new Set([1, 2, 3]);
            scene.sceneData.set('numbers', set);

            const serialized = SceneSerializer.serialize(scene);

            const newScene = new Scene({ name: 'NewScene' });
            SceneSerializer.deserialize(newScene, serialized, { componentRegistry });

            const restoredSet = newScene.sceneData.get('numbers');
            expect(restoredSet).toBeInstanceOf(Set);
            expect(restoredSet.has(1)).toBe(true);
            expect(restoredSet.has(2)).toBe(true);
            expect(restoredSet.has(3)).toBe(true);

            newScene.end();
        });
    });

    describe('hierarchy serialization', () => {
        test('should serialize and deserialize entity hierarchy', () => {
            const hierarchySystem = new HierarchySystem();
            scene.addSystem(hierarchySystem);

            const root = scene.createEntity('Root');
            const child1 = scene.createEntity('Child1');
            const child2 = scene.createEntity('Child2');

            hierarchySystem.setParent(child1, root);
            hierarchySystem.setParent(child2, root);

            const serialized = SceneSerializer.serialize(scene);

            const newScene = new Scene({ name: 'NewScene' });
            const newHierarchySystem = new HierarchySystem();
            newScene.addSystem(newHierarchySystem);

            SceneSerializer.deserialize(newScene, serialized, { componentRegistry });

            const newRoot = newScene.findEntity('Root');
            expect(newRoot).not.toBeNull();

            const children = newHierarchySystem.getChildren(newRoot!);
            expect(children.length).toBe(2);

            newScene.end();
        });
    });
});
