/**
 * 序列化系统测试
 */

import { Component } from '../../../src/ECS/Component';
import { Scene } from '../../../src/ECS/Scene';
import { Entity } from '../../../src/ECS/Entity';
import {
    Serializable,
    Serialize,
    SerializeAsMap,
    SerializeAsSet,
    IgnoreSerialization,
    ComponentSerializer,
    EntitySerializer,
    SceneSerializer,
    VersionMigrationManager,
    MigrationBuilder
} from '../../../src/ECS/Serialization';
import { ECSComponent } from '../../../src/ECS/Decorators';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage';

// 测试组件定义
@ECSComponent('Position')
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

@ECSComponent('Velocity')
@Serializable({ version: 1 })
class VelocityComponent extends Component {
    @Serialize()
    public dx: number = 0;

    @Serialize()
    public dy: number = 0;
}

@ECSComponent('Player')
@Serializable({ version: 1 })
class PlayerComponent extends Component {
    @Serialize()
    public name: string = '';

    @Serialize()
    public level: number = 1;

    @SerializeAsMap()
    public inventory: Map<string, number> = new Map();

    @SerializeAsSet()
    public tags: Set<string> = new Set();

    @IgnoreSerialization()
    public tempCache: any = null;
}

@ECSComponent('Health')
@Serializable({ version: 1 })
class HealthComponent extends Component {
    @Serialize()
    public current: number = 100;

    @Serialize()
    public max: number = 100;
}

// 非可序列化组件
class NonSerializableComponent extends Component {
    public data: any = null;
}

describe('ECS Serialization System', () => {
    let scene: Scene;

    beforeEach(() => {
        // 清空测试环境
        ComponentRegistry.reset();

        // 重新注册测试组件（因为reset会清空所有注册）
        ComponentRegistry.register(PositionComponent);
        ComponentRegistry.register(VelocityComponent);
        ComponentRegistry.register(PlayerComponent);
        ComponentRegistry.register(HealthComponent);

        // 创建测试场景
        scene = new Scene();
    });

    describe('Component Serialization', () => {
        it('should serialize a simple component', () => {
            const position = new PositionComponent(100, 200);
            const serialized = ComponentSerializer.serialize(position);

            expect(serialized).not.toBeNull();
            expect(serialized!.type).toBe('Position');
            expect(serialized!.version).toBe(1);
            expect(serialized!.data.x).toBe(100);
            expect(serialized!.data.y).toBe(200);
        });

        it('should deserialize a simple component', () => {
            const serializedData = {
                type: 'Position',
                version: 1,
                data: { x: 150, y: 250 }
            };

            const registry = ComponentRegistry.getAllComponentNames() as Map<string, any>;
            const component = ComponentSerializer.deserialize(serializedData, registry);

            expect(component).not.toBeNull();
            expect(component).toBeInstanceOf(PositionComponent);
            expect((component as PositionComponent).x).toBe(150);
            expect((component as PositionComponent).y).toBe(250);
        });

        it('should serialize Map fields', () => {
            const player = new PlayerComponent();
            player.name = 'Hero';
            player.level = 5;
            player.inventory.set('sword', 1);
            player.inventory.set('potion', 10);

            const serialized = ComponentSerializer.serialize(player);

            expect(serialized).not.toBeNull();
            expect(serialized!.data.inventory).toEqual([
                ['sword', 1],
                ['potion', 10]
            ]);
        });

        it('should deserialize Map fields', () => {
            const serializedData = {
                type: 'Player',
                version: 1,
                data: {
                    name: 'Hero',
                    level: 5,
                    inventory: [
                        ['sword', 1],
                        ['potion', 10]
                    ],
                    tags: ['warrior', 'hero']
                }
            };

            const registry = ComponentRegistry.getAllComponentNames() as Map<string, any>;
            const component = ComponentSerializer.deserialize(
                serializedData,
                registry
            ) as PlayerComponent;

            expect(component).not.toBeNull();
            expect(component.inventory.get('sword')).toBe(1);
            expect(component.inventory.get('potion')).toBe(10);
            expect(component.tags.has('warrior')).toBe(true);
            expect(component.tags.has('hero')).toBe(true);
        });

        it('should ignore fields marked with @IgnoreSerialization', () => {
            const player = new PlayerComponent();
            player.tempCache = { foo: 'bar' };

            const serialized = ComponentSerializer.serialize(player);

            expect(serialized).not.toBeNull();
            expect(serialized!.data.tempCache).toBeUndefined();
        });

        it('should return null for non-serializable components', () => {
            const nonSerializable = new NonSerializableComponent();
            const serialized = ComponentSerializer.serialize(nonSerializable);

            expect(serialized).toBeNull();
        });
    });

    describe('Entity Serialization', () => {
        it('should serialize an entity with components', () => {
            const entity = scene.createEntity('Player');
            entity.addComponent(new PositionComponent(50, 100));
            entity.addComponent(new VelocityComponent());
            entity.tag = 10;

            const serialized = EntitySerializer.serialize(entity);

            expect(serialized.id).toBe(entity.id);
            expect(serialized.name).toBe('Player');
            expect(serialized.tag).toBe(10);
            expect(serialized.components.length).toBe(2);
        });

        it('should serialize entity hierarchy', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');

            parent.addComponent(new PositionComponent(0, 0));
            child.addComponent(new PositionComponent(10, 10));
            parent.addChild(child);

            const serialized = EntitySerializer.serialize(parent);

            expect(serialized.children.length).toBe(1);
            expect(serialized.children[0].id).toBe(child.id);
            expect(serialized.children[0].name).toBe('Child');
        });

        it('should deserialize an entity', () => {
            const serializedEntity = {
                id: 1,
                name: 'TestEntity',
                tag: 5,
                active: true,
                enabled: true,
                updateOrder: 0,
                components: [
                    {
                        type: 'Position',
                        version: 1,
                        data: { x: 100, y: 200 }
                    }
                ],
                children: []
            };

            const registry = ComponentRegistry.getAllComponentNames() as Map<string, any>;
            let idCounter = 10;
            const entity = EntitySerializer.deserialize(
                serializedEntity,
                registry,
                () => idCounter++,
                false,
                scene
            );

            expect(entity.name).toBe('TestEntity');
            expect(entity.tag).toBe(5);
            expect(entity.components.length).toBe(1);
        });
    });

    describe('Scene Serialization', () => {
        let scene: Scene;

        beforeEach(() => {
            scene = new Scene({ name: 'TestScene' });
        });

        afterEach(() => {
            scene.end();
        });

        it('should serialize a scene', () => {
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new PositionComponent(10, 20));

            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new PlayerComponent());

            const saveData = scene.serialize({ format: 'json', pretty: true });

            expect(saveData).toBeTruthy();
            expect(typeof saveData).toBe('string');

            const parsed = JSON.parse(saveData as string);
            expect(parsed.name).toBe('TestScene');
            expect(parsed.version).toBe(1);
            expect(parsed.entities.length).toBe(2);
        });

        it('should deserialize a scene with replace strategy', () => {
            // 创建初始实体
            const entity1 = scene.createEntity('Initial');
            entity1.addComponent(new PositionComponent(0, 0));

            // 序列化
            const entity2 = scene.createEntity('ToSave');
            entity2.addComponent(new PositionComponent(100, 100));
            const saveData = scene.serialize();

            // 清空并重新加载
            scene.deserialize(saveData, {
                strategy: 'replace',
                // componentRegistry会自动从ComponentRegistry获取
            });

            expect(scene.entities.count).toBeGreaterThan(0);
        });

        it('should filter components during serialization', () => {
            const entity = scene.createEntity('Mixed');
            entity.addComponent(new PositionComponent(1, 2));
            entity.addComponent(new PlayerComponent());
            entity.addComponent(new HealthComponent());

            const saveData = scene.serialize({
                components: [PositionComponent, PlayerComponent],
                format: 'json'
            });

            const parsed = JSON.parse(saveData as string);
            expect(parsed.entities.length).toBeGreaterThan(0);
        });

        it('should preserve entity hierarchy', () => {
            const parent = scene.createEntity('Parent');
            const child = scene.createEntity('Child');
            parent.addChild(child);

            parent.addComponent(new PositionComponent(0, 0));
            child.addComponent(new PositionComponent(10, 10));

            const saveData = scene.serialize({ format: 'json' });
            const parsed = JSON.parse(saveData as string);

            // 只有父实体在顶层
            expect(parsed.entities.length).toBe(1);
            expect(parsed.entities[0].children.length).toBe(1);
        });

        it('should validate save data', () => {
            const entity = scene.createEntity('Test');
            entity.addComponent(new PositionComponent(5, 5));

            const saveData = scene.serialize({ format: 'json' });
            const validation = SceneSerializer.validate(saveData as string);

            expect(validation.valid).toBe(true);
            expect(validation.version).toBe(1);
        });

        it('should get save data info', () => {
            const entity = scene.createEntity('InfoTest');
            entity.addComponent(new PositionComponent(1, 1));

            const saveData = scene.serialize({ format: 'json' });
            const info = SceneSerializer.getInfo(saveData as string);

            expect(info).not.toBeNull();
            expect(info!.name).toBe('TestScene');
            expect(info!.version).toBe(1);
        });
    });

    describe('Version Migration', () => {
        @ECSComponent('OldPlayer')
        @Serializable({ version: 1 })
        class OldPlayerV1 extends Component {
            @Serialize()
            public name: string = '';

            @Serialize()
            public hp: number = 100;
        }

        @ECSComponent('OldPlayer')
        @Serializable({ version: 2 })
        class OldPlayerV2 extends Component {
            @Serialize()
            public name: string = '';

            @Serialize()
            public health: number = 100; // 重命名了字段

            @Serialize()
            public maxHealth: number = 100; // 新增字段
        }

        beforeEach(() => {
            VersionMigrationManager.clearMigrations();
        });

        it('should migrate component from v1 to v2', () => {
            // 注册迁移
            VersionMigrationManager.registerComponentMigration(
                'OldPlayer',
                1,
                2,
                (data) => {
                    return {
                        name: data.name,
                        health: data.hp,
                        maxHealth: data.hp
                    };
                }
            );

            const v1Data = {
                type: 'OldPlayer',
                version: 1,
                data: { name: 'Hero', hp: 80 }
            };

            const migrated = VersionMigrationManager.migrateComponent(v1Data, 2);

            expect(migrated.version).toBe(2);
            expect(migrated.data.health).toBe(80);
            expect(migrated.data.maxHealth).toBe(80);
            expect(migrated.data.hp).toBeUndefined();
        });

        it('should use MigrationBuilder for component migration', () => {
            new MigrationBuilder()
                .forComponent('Player')
                .fromVersionToVersion(1, 2)
                .migrate((data: any) => {
                    data.experience = 0;
                    return data;
                });

            expect(VersionMigrationManager.canMigrateComponent('Player', 1, 2)).toBe(true);
        });

        it('should check migration path availability', () => {
            VersionMigrationManager.registerComponentMigration('Test', 1, 2, (d) => d);
            VersionMigrationManager.registerComponentMigration('Test', 2, 3, (d) => d);

            expect(VersionMigrationManager.canMigrateComponent('Test', 1, 3)).toBe(true);
            expect(VersionMigrationManager.canMigrateComponent('Test', 1, 4)).toBe(false);
        });

        it('should get migration path', () => {
            VersionMigrationManager.registerComponentMigration('PathTest', 1, 2, (d) => d);
            VersionMigrationManager.registerComponentMigration('PathTest', 2, 3, (d) => d);

            const path = VersionMigrationManager.getComponentMigrationPath('PathTest');

            expect(path).toEqual([1, 2]);
        });
    });

    // ComponentTypeRegistry已被移除，现在使用ComponentRegistry自动管理组件类型

    describe('Integration Tests', () => {
        it('should perform full save/load cycle', () => {
            const scene1 = new Scene({ name: 'SaveTest' });

            // 创建复杂实体
            const player = scene1.createEntity('Player');
            const playerComp = new PlayerComponent();
            playerComp.name = 'TestHero';
            playerComp.level = 10;
            playerComp.inventory.set('sword', 1);
            playerComp.inventory.set('shield', 1);
            playerComp.tags.add('warrior');

            player.addComponent(playerComp);
            player.addComponent(new PositionComponent(100, 200));
            player.addComponent(new HealthComponent());

            // 创建子实体
            const weapon = scene1.createEntity('Weapon');
            weapon.addComponent(new PositionComponent(5, 0));
            player.addChild(weapon);

            // 序列化
            const saveData = scene1.serialize();

            // 新场景
            const scene2 = new Scene({ name: 'LoadTest' });

            // 反序列化
            scene2.deserialize(saveData, {
                strategy: 'replace',
                // componentRegistry会自动从ComponentRegistry获取
            });

            // 验证
            const loadedPlayer = scene2.findEntity('Player');
            expect(loadedPlayer).not.toBeNull();

            const loadedPlayerComp = loadedPlayer!.getComponent(PlayerComponent as any) as PlayerComponent;
            expect(loadedPlayerComp).not.toBeNull();
            expect(loadedPlayerComp.name).toBe('TestHero');
            expect(loadedPlayerComp.level).toBe(10);
            expect(loadedPlayerComp.inventory.get('sword')).toBe(1);
            expect(loadedPlayerComp.tags.has('warrior')).toBe(true);

            // 验证层级结构
            expect(loadedPlayer!.childCount).toBe(1);

            scene1.end();
            scene2.end();
        });

        it('should serialize and deserialize scene custom data', () => {
            const scene1 = new Scene({ name: 'SceneDataTest' });

            // 设置场景自定义数据
            scene1.sceneData.set('weather', 'rainy');
            scene1.sceneData.set('timeOfDay', 14.5);
            scene1.sceneData.set('difficulty', 'hard');
            scene1.sceneData.set('checkpoint', { x: 100, y: 200 });
            scene1.sceneData.set('tags', new Set(['action', 'adventure']));
            scene1.sceneData.set('metadata', new Map([['author', 'test'], ['version', '1.0']]));

            // 序列化
            const saveData = scene1.serialize();

            // 新场景
            const scene2 = new Scene({ name: 'LoadTest' });

            // 反序列化
            scene2.deserialize(saveData, {
                strategy: 'replace',
                // componentRegistry会自动从ComponentRegistry获取
            });

            // 验证场景数据
            expect(scene2.sceneData.get('weather')).toBe('rainy');
            expect(scene2.sceneData.get('timeOfDay')).toBe(14.5);
            expect(scene2.sceneData.get('difficulty')).toBe('hard');
            expect(scene2.sceneData.get('checkpoint')).toEqual({ x: 100, y: 200 });

            const tags = scene2.sceneData.get('tags');
            expect(tags).toBeInstanceOf(Set);
            expect(tags.has('action')).toBe(true);
            expect(tags.has('adventure')).toBe(true);

            const metadata = scene2.sceneData.get('metadata');
            expect(metadata).toBeInstanceOf(Map);
            expect(metadata.get('author')).toBe('test');
            expect(metadata.get('version')).toBe('1.0');

            scene1.end();
            scene2.end();
        });

        it('should serialize and deserialize using binary format', () => {
            const scene1 = new Scene({ name: 'BinaryTest' });

            // 创建测试数据
            const player = scene1.createEntity('Player');
            const playerComp = new PlayerComponent();
            playerComp.name = 'BinaryHero';
            playerComp.level = 5;
            playerComp.inventory.set('sword', 1);
            player.addComponent(playerComp);
            player.addComponent(new PositionComponent(100, 200));

            scene1.sceneData.set('weather', 'sunny');
            scene1.sceneData.set('score', 9999);

            // 二进制序列化
            const binaryData = scene1.serialize({ format: 'binary' });

            // 验证是Buffer类型
            expect(Buffer.isBuffer(binaryData)).toBe(true);

            // JSON序列化对比
            const jsonData = scene1.serialize({ format: 'json', pretty: false });

            // 二进制应该更小
            const binarySize = (binaryData as Buffer).length;
            const jsonSize = (jsonData as string).length;
            console.log(`Binary size: ${binarySize} bytes, JSON size: ${jsonSize} bytes`);
            expect(binarySize).toBeLessThan(jsonSize);

            // 新场景反序列化二进制数据
            const scene2 = new Scene({ name: 'LoadTest' });
            scene2.deserialize(binaryData, {
                strategy: 'replace',
                // componentRegistry会自动从ComponentRegistry获取
            });

            // 验证数据完整性
            const loadedPlayer = scene2.findEntity('Player');
            expect(loadedPlayer).not.toBeNull();

            const loadedPlayerComp = loadedPlayer!.getComponent(PlayerComponent as any) as PlayerComponent;
            expect(loadedPlayerComp.name).toBe('BinaryHero');
            expect(loadedPlayerComp.level).toBe(5);
            expect(loadedPlayerComp.inventory.get('sword')).toBe(1);

            const loadedPos = loadedPlayer!.getComponent(PositionComponent as any) as PositionComponent;
            expect(loadedPos.x).toBe(100);
            expect(loadedPos.y).toBe(200);

            expect(scene2.sceneData.get('weather')).toBe('sunny');
            expect(scene2.sceneData.get('score')).toBe(9999);

            scene1.end();
            scene2.end();
        });

        it('should handle complex nested data in binary format', () => {
            const scene1 = new Scene({ name: 'NestedBinaryTest' });

            // 复杂嵌套数据
            scene1.sceneData.set('config', {
                graphics: {
                    quality: 'high',
                    resolution: { width: 1920, height: 1080 }
                },
                audio: {
                    masterVolume: 0.8,
                    effects: new Map([['music', 0.7], ['sfx', 0.9]])
                },
                tags: new Set(['multiplayer', 'ranked']),
                timestamp: new Date('2024-01-01')
            });

            // 二进制序列化
            const binaryData = scene1.serialize({ format: 'binary' });

            // 反序列化
            const scene2 = new Scene({ name: 'LoadTest' });
            scene2.deserialize(binaryData, {
                // componentRegistry会自动从ComponentRegistry获取
            });

            const config = scene2.sceneData.get('config');
            expect(config.graphics.quality).toBe('high');
            expect(config.graphics.resolution.width).toBe(1920);
            expect(config.audio.masterVolume).toBe(0.8);
            expect(config.audio.effects.get('music')).toBe(0.7);
            expect(config.tags.has('multiplayer')).toBe(true);
            expect(config.timestamp).toBeInstanceOf(Date);

            scene1.end();
            scene2.end();
        });
    });
});
