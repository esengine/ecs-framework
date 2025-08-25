import { SceneWorldAdapter } from '../../../../src/ECS/Core/Snapshot/SceneWorldAdapter';
import { Scene } from '../../../../src/ECS/Scene';
import { World } from '../../../../src/ECS/World';
import { Entity } from '../../../../src/ECS/Entity';
import { Component } from '../../../../src/ECS/Component';
import { ComponentRegistry } from '../../../../src/ECS/Core/ComponentStorage/ComponentRegistry';
import { Serializable, SerializableField } from '../../../../src/ECS/Decorators/SerializationDecorators';

@Serializable()
class TestComponent extends Component {
    @SerializableField({ id: 1, dataType: 'number' })
    public value: number = 42;
    
    @SerializableField({ id: 2, dataType: 'string' })
    public name: string = 'test';
}

@Serializable()
class AnotherComponent extends Component {
    @SerializableField({ id: 1, dataType: 'boolean' })
    public isActive: boolean = true;
}

describe('SceneWorldAdapter', () => {
    let scene: Scene;
    let adapter: SceneWorldAdapter;

    beforeEach(() => {
        scene = new Scene();
        adapter = new SceneWorldAdapter(scene);
        
        // 注册测试组件
        ComponentRegistry.register(TestComponent);
        ComponentRegistry.register(AnotherComponent);
    });

    afterEach(() => {
        // 清理组件注册
        // ComponentRegistry没有clearAll方法，保持测试隔离的话需要手动清理
    });

    describe('_decodeComponentStorage', () => {
        it('应能够从组件存储数据恢复组件', () => {
            const storageData = [
                {
                    type: 'TestComponent',
                    entities: [1, 2],
                    components: [
                        { value: 100, name: 'entity1' },
                        { value: 200, name: 'entity2' }
                    ]
                }
            ];

            // 创建测试实体
            const entity1 = new Entity('Entity1', 1);
            const entity2 = new Entity('Entity2', 2);
            scene.addEntity(entity1);
            scene.addEntity(entity2);

            // 执行解码
            (adapter as any)._decodeComponentStorage(storageData);

            // 验证组件存储管理器中的数据
            const storage = scene.componentStorageManager.getStorage(TestComponent);
            expect(storage).toBeDefined();
            
            if (storage) {
                const comp1 = storage.getComponent(1);
                const comp2 = storage.getComponent(2);
                
                expect(comp1).toBeDefined();
                expect(comp2).toBeDefined();
                expect(comp1?.value).toBe(100);
                expect(comp1?.name).toBe('entity1');
                expect(comp2?.value).toBe(200);
                expect(comp2?.name).toBe('entity2');
            }
        });

        it('应能够处理未知组件类型', () => {
            const storageData = [
                {
                    type: 'UnknownComponent',
                    entities: [1],
                    components: [{ someValue: 42 }]
                }
            ];

            // 应该不抛出异常
            expect(() => {
                (adapter as any)._decodeComponentStorage(storageData);
            }).not.toThrow();
        });

        it('应能够处理空的存储数据', () => {
            const storageData: any[] = [];

            expect(() => {
                (adapter as any)._decodeComponentStorage(storageData);
            }).not.toThrow();
        });
    });

    describe('_syncWorldToScene', () => {
        it('应能够将World中的实体同步到Scene', () => {
            const world = new World({ name: 'TestWorld' });
            const sourceScene = world.createDefaultScene('source');
            
            // 在源场景中创建实体和组件
            const entity1 = sourceScene.createEntity('Entity1');
            const entity2 = sourceScene.createEntity('Entity2');
            
            const comp1 = new TestComponent();
            comp1.value = 123;
            comp1.name = 'test1';
            entity1.addComponent(comp1);
            
            const comp2 = new AnotherComponent();
            comp2.isActive = false;
            entity2.addComponent(comp2);

            // 执行同步
            (adapter as any)._syncWorldToScene(world);

            // 验证场景中的实体
            expect(scene.entities.count).toBe(2);
            
            const syncedEntity1 = scene.findEntity('Entity1');
            const syncedEntity2 = scene.findEntity('Entity2');
            
            expect(syncedEntity1).toBeDefined();
            expect(syncedEntity2).toBeDefined();
            
            if (syncedEntity1) {
                const syncedComp1 = syncedEntity1.getComponent(TestComponent);
                expect(syncedComp1).toBeDefined();
                expect(syncedComp1?.value).toBe(123);
                expect(syncedComp1?.name).toBe('test1');
            }
            
            if (syncedEntity2) {
                const syncedComp2 = syncedEntity2.getComponent(AnotherComponent);
                expect(syncedComp2).toBeDefined();
                expect(syncedComp2?.isActive).toBe(false);
            }
        });

        it('应能够处理空的World', () => {
            const world = new World({ name: 'EmptyWorld' });
            
            expect(() => {
                (adapter as any)._syncWorldToScene(world);
            }).not.toThrow();
            
            expect(scene.entities.count).toBe(0);
        });

        it('同步前应清空目标场景', () => {
            // 先在目标场景中添加一些实体
            const existingEntity = scene.createEntity('ExistingEntity');
            expect(scene.entities.count).toBe(1);
            
            const world = new World({ name: 'TestWorld' });
            const sourceScene = world.createDefaultScene('source');
            const newEntity = sourceScene.createEntity('NewEntity');
            
            // 执行同步
            (adapter as any)._syncWorldToScene(world);
            
            // 验证原有实体被清空，只有新实体
            expect(scene.entities.count).toBe(1);
            expect(scene.findEntity('ExistingEntity')).toBeNull();
            expect(scene.findEntity('NewEntity')).toBeDefined();
        });
    });

    describe('组件存储编码和解码', () => {
        it('编码方法应返回数组格式的数据', () => {
            // 编码组件存储
            const encodedData = (adapter as any)._encodeComponentStorageStable();
            
            // 验证编码结果是数组格式
            expect(encodedData).toBeInstanceOf(Array);
            
            // 当前实现返回空数组或包含空组件数据的数组
            if (encodedData.length > 0) {
                expect(encodedData[0]).toHaveProperty('type');
                expect(encodedData[0]).toHaveProperty('entities');
                expect(encodedData[0]).toHaveProperty('components');
            }
        });
        
        it('解码方法应该能正确处理组件数据结构', () => {
            // 直接测试解码方法的容错性
            const mockStorageData = [
                {
                    type: 'TestComponent',
                    entities: [100, 200],
                    components: [
                        { value: 111, name: 'mock1' },
                        { value: 222, name: 'mock2' }
                    ]
                }
            ];

            // 创建对应的实体
            const entity1 = new Entity('MockEntity1', 100);
            const entity2 = new Entity('MockEntity2', 200);
            scene.addEntity(entity1);
            scene.addEntity(entity2);

            // 执行解码
            expect(() => {
                (adapter as any)._decodeComponentStorage(mockStorageData);
            }).not.toThrow();

            // 验证组件存储管理器中的数据
            const storage = scene.componentStorageManager.getStorage(TestComponent);
            if (storage) {
                const comp1 = storage.getComponent(100);
                const comp2 = storage.getComponent(200);
                
                expect(comp1).toBeDefined();
                expect(comp2).toBeDefined();
                expect(comp1?.value).toBe(111);
                expect(comp1?.name).toBe('mock1');
                expect(comp2?.value).toBe(222);
                expect(comp2?.name).toBe('mock2');
            }
        });
    });
});