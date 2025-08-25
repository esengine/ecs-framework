import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { SnapshotManager, SnapshotStore, SceneWorldAdapter } from '../../../src/ECS/Core/Snapshot';
import { GlobalRNG } from '../../../src/Utils/PRNG/GlobalRNG';
import { Serializable, SerializableField } from '../../../src/ECS/Decorators/SerializationDecorators';
import { ECSComponent } from '../../../src/ECS/Decorators/TypeDecorators';
import { SchemaRegistry } from '../../../src/ECS/Core/Serialization/SchemaRegistry';
import { ComponentRegistry } from '../../../src/ECS/Core/ComponentStorage/ComponentRegistry';

// Schema注册表将在需要时初始化

// 测试组件
@ECSComponent('TestComponent')
@Serializable()
class TestComponent extends Component {
    @SerializableField({ id: 1, dataType: 'number' })
    public value: number;
    
    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

@ECSComponent('PositionComponent')
@Serializable()
class PositionComponent extends Component {
    @SerializableField({ id: 1, dataType: 'number' })
    public x: number;
    
    @SerializableField({ id: 2, dataType: 'number' })
    public y: number;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('VelocityComponent')
@Serializable()
class VelocityComponent extends Component {
    @SerializableField({ id: 1, dataType: 'number' })
    public vx: number;
    
    @SerializableField({ id: 2, dataType: 'number' })
    public vy: number;
    
    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

// 全局注册组件类，用于反序列化
(globalThis as any)['TestComponent'] = TestComponent;
(globalThis as any)['PositionComponent'] = PositionComponent;
(globalThis as any)['VelocityComponent'] = VelocityComponent;

describe('快照系统测试', () => {
    let scene: Scene;
    let snapshotManager: SnapshotManager;

    beforeEach(() => {
        GlobalRNG.seed(12345);
        
        // 初始化Schema注册表（测试环境）
        if (!SchemaRegistry.isInitialized()) {
            SchemaRegistry.init();
        }
        
        scene = new Scene();
        snapshotManager = scene.snapshotManager;
        
        // 注册组件到ComponentRegistry
        ComponentRegistry.register(TestComponent as any);
        ComponentRegistry.register(PositionComponent as any);
        ComponentRegistry.register(VelocityComponent as any);
    });

    describe('SnapshotStore 基础功能', () => {
        let store: SnapshotStore;
        let adapter: SceneWorldAdapter;

        beforeEach(() => {
            adapter = new SceneWorldAdapter(scene);
            store = new SnapshotStore({ windowFrames: 5 }, adapter);
        });

        test('应该能够创建SnapshotStore', () => {
            expect(store).toBeDefined();
            expect(store.count).toBe(0);
        });

        test('应该能够捕获快照', () => {
            // 创建一些实体和组件
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(42));

            const snapshot = store.capture(1, 12345);
            
            expect(snapshot).not.toBeNull();
            expect(snapshot!.frame).toBe(1);
            expect(snapshot!.seed).toBe(12345);
            expect(snapshot!.payload.byteLength).toBeGreaterThan(0);
            expect(store.count).toBe(1);
        });

        test('应该能够恢复快照', () => {
            // 创建初始状态
            const entity1 = scene.createEntity('Entity1');
            entity1.addComponent(new TestComponent(100));
            
            // 捕获快照
            const snapshot = store.capture(1);
            expect(snapshot).not.toBeNull();

            // 修改状态
            const entity2 = scene.createEntity('Entity2');
            entity2.addComponent(new TestComponent(200));
            expect(scene.entities.count).toBe(2);

            // 恢复快照
            const success = store.restore(snapshot!);
            expect(success).toBe(true);
            
            // 验证状态已恢复
            expect(scene.entities.count).toBe(1);
            expect(scene.findEntity('Entity1')).not.toBeNull();
            expect(scene.findEntity('Entity2')).toBeNull();
        });

        test('应该能够在环形缓冲区中管理多个快照', () => {
            // 创建超过窗口大小的快照
            for (let i = 0; i < 8; i++) {
                const entity = scene.createEntity(`Entity${i}`);
                entity.addComponent(new TestComponent(i * 10));
                store.capture(i);
            }

            // 应该只保留最新的5个快照
            expect(store.count).toBe(5);

            // 最早的快照应该被覆盖
            const oldestSnapshot = store.findNearest(0);
            expect(oldestSnapshot).toBeNull();

            const newestSnapshot = store.findNearest(7);
            expect(newestSnapshot).not.toBeNull();
            expect(newestSnapshot!.frame).toBe(7);
        });

        test('应该能够查找最接近的快照', () => {
            // 创建几个快照
            store.capture(1);
            store.capture(5);
            store.capture(10);

            // 查找最接近的快照
            expect(store.findNearest(0)?.frame).toBeUndefined();
            expect(store.findNearest(1)?.frame).toBe(1);
            expect(store.findNearest(3)?.frame).toBe(1);
            expect(store.findNearest(7)?.frame).toBe(5);
            expect(store.findNearest(15)?.frame).toBe(10);
        });
    });

    describe('SceneWorldAdapter 序列化', () => {
        let adapter: SceneWorldAdapter;

        beforeEach(() => {
            adapter = new SceneWorldAdapter(scene);
        });

        test('应该能够编码空场景', () => {
            const buffer = adapter.encode();
            expect(buffer.byteLength).toBeGreaterThan(0);

            const signature = adapter.signature();
            expect(signature).toBeGreaterThan(0);
        });

        test('应该能够编码和解码简单实体', () => {
            // 创建测试实体
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(42));
            entity.addComponent(new PositionComponent(10, 20));

            const originalSig = adapter.signature();
            const buffer = adapter.encode();

            // 清空场景
            scene.destroyAllEntities();
            expect(scene.entities.count).toBe(0);

            // 恢复场景
            adapter.decode(buffer);

            // 验证恢复结果
            expect(scene.entities.count).toBe(1);
            const restoredEntity = scene.findEntity('TestEntity');
            expect(restoredEntity).not.toBeNull();
            expect(restoredEntity!.hasComponent(TestComponent)).toBe(true);
            expect(restoredEntity!.hasComponent(PositionComponent)).toBe(true);
            
            const testComp = restoredEntity!.getComponent(TestComponent);
            const posComp = restoredEntity!.getComponent(PositionComponent);
            expect(testComp?.value).toBe(42);
            expect(posComp?.x).toBe(10);
            expect(posComp?.y).toBe(20);

            // 验证签名一致性
            const restoredSig = adapter.signature();
            expect(restoredSig).toBe(originalSig);
        });

        test('应该能够处理复杂场景状态', () => {
            // 创建多个实体和组件
            for (let i = 0; i < 10; i++) {
                const entity = scene.createEntity(`Entity_${i}`);
                entity.tag = i % 3;
                entity.addComponent(new TestComponent(i * 10));
                
                if (i % 2 === 0) {
                    entity.addComponent(new PositionComponent(i, i * 2));
                }
                
                if (i % 3 === 0) {
                    entity.addComponent(new VelocityComponent(i * 0.1, i * 0.2));
                }
            }

            const originalCount = scene.entities.count;
            const originalSig = adapter.signature();
            
            // 编码和解码
            const buffer = adapter.encode();
            scene.destroyAllEntities();
            adapter.decode(buffer);

            // 验证恢复结果
            expect(scene.entities.count).toBe(originalCount);
            expect(adapter.signature()).toBe(originalSig);

            // 验证实体数据
            for (let i = 0; i < 10; i++) {
                const entity = scene.findEntity(`Entity_${i}`);
                expect(entity).not.toBeNull();
                expect(entity!.tag).toBe(i % 3);
                
                const testComp = entity!.getComponent(TestComponent);
                expect(testComp?.value).toBe(i * 10);
            }
        });
    });

    describe('SnapshotManager 高级功能', () => {
        test('应该能够创建SnapshotManager', () => {
            expect(snapshotManager).toBeDefined();
            expect(snapshotManager.enabled).toBe(true);
            expect(snapshotManager.currentFrame).toBe(0);
        });

        test('应该能够手动捕获和恢复快照', () => {
            // 创建初始状态
            const entity = scene.createEntity('InitialEntity');
            entity.addComponent(new TestComponent(100));

            // 捕获快照
            const snapshot = snapshotManager.capture(1);
            expect(snapshot).not.toBeNull();
            expect(snapshot!.frame).toBe(1);

            // 修改状态
            scene.createEntity('NewEntity');
            expect(scene.entities.count).toBe(2);

            // 恢复快照
            const result = snapshotManager.restore(1);
            expect(result.success).toBe(true);
            expect(result.snapshot).toBeDefined();
            expect(snapshotManager.currentFrame).toBe(1);

            // 验证状态
            expect(scene.entities.count).toBe(1);
            expect(scene.findEntity('InitialEntity')).not.toBeNull();
            expect(scene.findEntity('NewEntity')).toBeNull();
        });

        test('应该能够启用自动快照', () => {
            snapshotManager.setAutoSnapshot(true, 5);

            // 模拟帧更新
            for (let i = 0; i < 20; i++) {
                scene.createEntity(`Entity_${i}`);
                snapshotManager.update();
            }

            // 应该有自动快照
            const stats = snapshotManager.getStats();
            expect(stats.snapshotCount).toBeGreaterThan(0);
            expect(stats.currentFrame).toBe(20);
        });

        test('应该能够处理精确帧恢复', () => {
            // 创建多个快照
            for (let i = 1; i <= 5; i++) {
                const entity = scene.createEntity(`Entity_${i}`);
                entity.addComponent(new TestComponent(i * 10));
                snapshotManager.capture(i * 2); // 帧: 2, 4, 6, 8, 10
            }

            // 尝试精确帧恢复
            const exactResult = snapshotManager.restoreExact(6);
            expect(exactResult.success).toBe(true);
            expect(exactResult.snapshot!.frame).toBe(6);
            expect(snapshotManager.currentFrame).toBe(6);

            // 尝试不存在的精确帧
            const noExactResult = snapshotManager.restoreExact(7);
            expect(noExactResult.success).toBe(false);
            expect(noExactResult.error).toContain('未找到帧 7 的精确快照');
        });

        test('应该能够禁用和启用快照系统', () => {
            snapshotManager.disable();
            expect(snapshotManager.enabled).toBe(false);

            const snapshot = snapshotManager.capture(1);
            expect(snapshot).toBeNull();

            snapshotManager.enable();
            expect(snapshotManager.enabled).toBe(true);

            const snapshot2 = snapshotManager.capture(2);
            expect(snapshot2).not.toBeNull();
        });

        test('应该能够获取统计信息', () => {
            // 创建一些快照
            for (let i = 0; i < 3; i++) {
                scene.createEntity(`Entity_${i}`);
                snapshotManager.capture(i);
            }

            const stats = snapshotManager.getStats();
            expect(stats.enabled).toBe(true);
            expect(stats.snapshotCount).toBe(3);
            expect(stats.totalBytes).toBeGreaterThan(0);
            expect(stats.storeStats).toBeDefined();
        });
    });

    describe('快照一致性验证', () => {
        test('快照恢复后状态签名应该一致', () => {
            const adapter = new SceneWorldAdapter(scene);

            // 创建复杂状态
            for (let i = 0; i < 5; i++) {
                const entity = scene.createEntity(`Entity_${i}`);
                entity.addComponent(new TestComponent(i * 100));
                entity.addComponent(new PositionComponent(i * 10, i * 20));
            }

            const originalSig = adapter.signature();
            
            // 捕获快照
            const snapshot = snapshotManager.capture(1);
            expect(snapshot).not.toBeNull();
            expect(snapshot!.worldSig).toBe(originalSig);

            // 修改状态
            scene.createEntity('ExtraEntity');
            expect(adapter.signature()).not.toBe(originalSig);

            // 恢复快照
            const result = snapshotManager.restore(1);
            expect(result.success).toBe(true);

            // 验证签名恢复
            expect(adapter.signature()).toBe(originalSig);
        });

        test('应该能够验证快照完整性', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(42));

            const snapshot = snapshotManager.capture(1);
            expect(snapshot).not.toBeNull();
            expect(snapshot!.validate()).toBe(true);

            // 验证存储完整性
            expect(snapshotManager.validate()).toBe(true);
        });
    });
});