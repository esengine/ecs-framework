import { CommandBuffer, OpType, SceneCommandBufferContext } from '../../../src/ECS/Core/CommandBuffer';
import { Scene } from '../../../src/ECS/Scene';
import { Component } from '../../../src/ECS/Component';
import { Entity } from '../../../src/ECS/Entity';

// 测试组件
class TestComponent extends Component {
    public value: number;
    
    constructor(value: number = 0) {
        super();
        this.value = value;
    }
}

class PositionComponent extends Component {
    public x: number;
    public y: number;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent extends Component {
    public vx: number;
    public vy: number;
    
    constructor(vx: number = 0, vy: number = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
    }
}

describe('CommandBuffer - 结构性命令缓冲系统测试', () => {
    let scene: Scene;
    let commandBuffer: CommandBuffer;
    let context: SceneCommandBufferContext;

    beforeEach(() => {
        scene = new Scene();
        context = new SceneCommandBufferContext(scene);
        commandBuffer = new CommandBuffer(context);
    });

    describe('基本功能测试', () => {
        test('应该能够创建CommandBuffer', () => {
            expect(commandBuffer).toBeInstanceOf(CommandBuffer);
            expect(commandBuffer.isEmpty).toBe(true);
            expect(commandBuffer.pendingCount).toBe(0);
        });

        test('应该能够设置执行上下文', () => {
            const newCommandBuffer = new CommandBuffer();
            expect(newCommandBuffer.isEmpty).toBe(true);
            
            newCommandBuffer.setContext(context);
            // 添加操作后上下文应该可用
            newCommandBuffer.createEntity('TestEntity');
            expect(newCommandBuffer.pendingCount).toBe(1);
        });

        test('应该能够清空操作缓冲', () => {
            commandBuffer.createEntity('Entity1');
            commandBuffer.createEntity('Entity2');
            expect(commandBuffer.pendingCount).toBe(2);
            
            commandBuffer.clear();
            expect(commandBuffer.isEmpty).toBe(true);
            expect(commandBuffer.pendingCount).toBe(0);
        });
    });

    describe('创建实体操作', () => {
        test('应该能够缓冲创建实体操作', () => {
            commandBuffer.createEntity('TestEntity');
            
            expect(commandBuffer.pendingCount).toBe(1);
            expect(commandBuffer.isEmpty).toBe(false);
            
            const stats = commandBuffer.getStats();
            expect(stats.opCounts.create).toBe(1);
        });

        test('应该能够在apply时创建实体', () => {
            const initialEntityCount = scene.entities.count;
            
            commandBuffer.createEntity('Entity1');
            commandBuffer.createEntity('Entity2');
            
            // apply前实体不应该被创建
            expect(scene.entities.count).toBe(initialEntityCount);
            
            commandBuffer.apply();
            
            // apply后实体应该被创建
            expect(scene.entities.count).toBe(initialEntityCount + 2);
            expect(scene.findEntity('Entity1')).not.toBeNull();
            expect(scene.findEntity('Entity2')).not.toBeNull();
        });

        test('应该能够使用ID提示创建实体', () => {
            commandBuffer.createEntity('EntityWithHint', 999);
            commandBuffer.apply();
            
            const entity = scene.findEntityById(999);
            expect(entity).not.toBeNull();
            expect(entity?.name).toBe('EntityWithHint');
        });
    });

    describe('销毁实体操作', () => {
        test('应该能够缓冲销毁实体操作', () => {
            commandBuffer.destroyEntity(123);
            
            expect(commandBuffer.pendingCount).toBe(1);
            const stats = commandBuffer.getStats();
            expect(stats.opCounts.destroy).toBe(1);
        });

        test('应该能够在apply时销毁实体', () => {
            // 先创建一个实体
            const entity = scene.createEntity('ToDestroy');
            const entityId = entity.id;
            
            expect(scene.findEntityById(entityId)).not.toBeNull();
            
            commandBuffer.destroyEntity(entityId);
            commandBuffer.apply();
            
            // 实体应该被销毁
            expect(scene.findEntityById(entityId)).toBeNull();
        });
    });

    describe('添加组件操作', () => {
        test('应该能够缓冲添加组件操作', () => {
            commandBuffer.addComponent(123, TestComponent, 100);
            
            expect(commandBuffer.pendingCount).toBe(1);
            const stats = commandBuffer.getStats();
            expect(stats.opCounts.add).toBe(1);
        });

        test('应该能够在apply时添加组件', () => {
            const entity = scene.createEntity('TestEntity');
            
            expect(entity.hasComponent(TestComponent)).toBe(false);
            
            commandBuffer.addComponent(entity.id, TestComponent, 100);
            commandBuffer.apply();
            
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.getComponent(TestComponent)?.value).toBe(100);
        });

        test('应该能够添加多个不同的组件', () => {
            const entity = scene.createEntity('TestEntity');
            
            commandBuffer.addComponent(entity.id, TestComponent, 100);
            commandBuffer.addComponent(entity.id, PositionComponent, 10, 20);
            commandBuffer.addComponent(entity.id, VelocityComponent, 1, 2);
            
            commandBuffer.apply();
            
            expect(entity.hasComponent(TestComponent)).toBe(true);
            expect(entity.hasComponent(PositionComponent)).toBe(true);
            expect(entity.hasComponent(VelocityComponent)).toBe(true);
            
            expect(entity.getComponent(TestComponent)?.value).toBe(100);
            expect(entity.getComponent(PositionComponent)?.x).toBe(10);
            expect(entity.getComponent(PositionComponent)?.y).toBe(20);
        });
    });

    describe('移除组件操作', () => {
        test('应该能够缓冲移除组件操作', () => {
            commandBuffer.removeComponent(123, TestComponent);
            
            expect(commandBuffer.pendingCount).toBe(1);
            const stats = commandBuffer.getStats();
            expect(stats.opCounts.remove).toBe(1);
        });

        test('应该能够在apply时移除组件', () => {
            const entity = scene.createEntity('TestEntity');
            entity.addComponent(new TestComponent(100));
            
            expect(entity.hasComponent(TestComponent)).toBe(true);
            
            commandBuffer.removeComponent(entity.id, TestComponent);
            commandBuffer.apply();
            
            expect(entity.hasComponent(TestComponent)).toBe(false);
        });
    });

    describe('操作排序和批处理', () => {
        test('操作应该按正确顺序执行：CREATE → ADD → REMOVE → DESTROY', () => {
            const entity = scene.createEntity('ExistingEntity');
            entity.addComponent(new TestComponent(100));
            
            // 故意以错误的顺序添加操作
            commandBuffer.destroyEntity(entity.id);           // DESTROY
            commandBuffer.addComponent(999, TestComponent, 50);  // ADD (新实体)
            commandBuffer.createEntity('NewEntity', 999);       // CREATE
            commandBuffer.removeComponent(entity.id, TestComponent); // REMOVE
            
            const operations = commandBuffer.getPendingOperations();
            expect(operations).toHaveLength(4);
            
            commandBuffer.apply();
            
            // 检查执行结果
            const newEntity = scene.findEntityById(999);
            expect(newEntity).not.toBeNull();
            expect(newEntity?.hasComponent(TestComponent)).toBe(true);
            expect(scene.findEntityById(entity.id)).toBeNull(); // 原实体应该被销毁
        });

        test('相同实体的操作应该按类型优先级排序', () => {
            const entity = scene.createEntity('TestEntity');
            const entityId = entity.id;
            
            // 添加不同类型的操作
            commandBuffer.removeComponent(entityId, TestComponent);
            commandBuffer.addComponent(entityId, TestComponent, 100);
            commandBuffer.destroyEntity(entityId);
            
            commandBuffer.apply();
            
            // 实体最终应该被销毁（DESTROY最后执行）
            expect(scene.findEntityById(entityId)).toBeNull();
        });

        test('CREATE操作应该优先执行', () => {
            // 先添加一个对不存在实体的ADD操作
            commandBuffer.addComponent(999, TestComponent, 100);
            // 然后添加CREATE操作
            commandBuffer.createEntity('NewEntity', 999);
            
            commandBuffer.apply();
            
            // 应该先创建实体，然后添加组件
            const entity = scene.findEntityById(999);
            expect(entity).not.toBeNull();
            expect(entity?.hasComponent(TestComponent)).toBe(true);
        });
    });

    describe('Scene集成测试', () => {
        test('Scene应该有CommandBuffer', () => {
            expect(scene.commandBuffer).toBeInstanceOf(CommandBuffer);
        });

        test('Scene.update应该自动应用CommandBuffer', () => {
            const initialCount = scene.entities.count;
            
            scene.commandBuffer.createEntity('UpdateEntity');
            expect(scene.entities.count).toBe(initialCount);
            
            scene.update();
            expect(scene.entities.count).toBe(initialCount + 1);
        });

        test('Scene.fixedUpdate应该自动应用CommandBuffer', () => {
            const initialCount = scene.entities.count;
            
            scene.commandBuffer.createEntity('FixedUpdateEntity');
            expect(scene.entities.count).toBe(initialCount);
            
            scene.fixedUpdate();
            expect(scene.entities.count).toBe(initialCount + 1);
        });
    });

    describe('统计信息测试', () => {
        test('应该正确统计操作数量', () => {
            commandBuffer.createEntity('Entity1');
            commandBuffer.createEntity('Entity2');
            commandBuffer.addComponent(123, TestComponent, 100);
            commandBuffer.removeComponent(456, TestComponent);
            commandBuffer.destroyEntity(789);
            
            const stats = commandBuffer.getStats();
            
            expect(stats.pendingOps).toBe(5);
            expect(stats.opCounts.create).toBe(2);
            expect(stats.opCounts.add).toBe(1);
            expect(stats.opCounts.remove).toBe(1);
            expect(stats.opCounts.destroy).toBe(1);
            expect(stats.totalProcessed).toBe(0);
            expect(stats.applyCount).toBe(0);
        });

        test('apply后应该更新统计信息', () => {
            commandBuffer.createEntity('Entity1');
            commandBuffer.createEntity('Entity2');
            
            const statsBefore = commandBuffer.getStats();
            expect(statsBefore.pendingOps).toBe(2);
            
            commandBuffer.apply();
            
            const statsAfter = commandBuffer.getStats();
            expect(statsAfter.pendingOps).toBe(0);
            expect(statsAfter.totalProcessed).toBe(2);
            expect(statsAfter.applyCount).toBe(1);
        });
    });

    describe('错误处理测试', () => {
        test('对不存在实体的操作应该安全处理', () => {
            commandBuffer.addComponent(99999, TestComponent, 100);
            commandBuffer.removeComponent(99999, TestComponent);
            commandBuffer.destroyEntity(99999);
            
            expect(() => commandBuffer.apply()).not.toThrow();
            
            const stats = commandBuffer.getStats();
            expect(stats.totalProcessed).toBe(0); // 操作失败，但不抛异常
        });

        test('空CommandBuffer的apply应该安全', () => {
            expect(commandBuffer.isEmpty).toBe(true);
            expect(() => commandBuffer.apply()).not.toThrow();
        });

        test('无上下文的CommandBuffer应该记录错误', () => {
            const noContextBuffer = new CommandBuffer();
            noContextBuffer.createEntity('TestEntity');
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            noContextBuffer.apply();
            
            consoleSpy.mockRestore();
        });
    });

    describe('复杂场景测试', () => {
        test('混合操作的复杂场景', () => {
            // 创建一些初始实体
            const entity1 = scene.createEntity('Entity1');
            const entity2 = scene.createEntity('Entity2');
            entity1.addComponent(new TestComponent(100));
            entity2.addComponent(new PositionComponent(10, 20));
            
            // 添加复杂的操作序列
            commandBuffer.createEntity('NewEntity1');
            commandBuffer.createEntity('NewEntity2');
            commandBuffer.addComponent(entity1.id, PositionComponent, 5, 10);
            commandBuffer.removeComponent(entity1.id, TestComponent);
            commandBuffer.addComponent(entity2.id, VelocityComponent, 1, 1);
            commandBuffer.destroyEntity(entity2.id);
            
            const initialCount = scene.entities.count;
            commandBuffer.apply();
            
            // 验证结果
            expect(scene.entities.count).toBe(initialCount + 1); // +2新实体 -1销毁实体
            expect(entity1.hasComponent(TestComponent)).toBe(false);
            expect(entity1.hasComponent(PositionComponent)).toBe(true);
            expect(scene.findEntityById(entity2.id)).toBeNull();
            expect(scene.findEntity('NewEntity1')).not.toBeNull();
            expect(scene.findEntity('NewEntity2')).not.toBeNull();
        });

        test('大量操作的性能测试', () => {
            const operationCount = 1000;
            
            const startTime = performance.now();
            
            // 添加大量操作
            for (let i = 0; i < operationCount; i++) {
                commandBuffer.createEntity(`Entity_${i}`);
                commandBuffer.addComponent(i + 1000, TestComponent, i);
            }
            
            expect(commandBuffer.pendingCount).toBe(operationCount * 2);
            
            commandBuffer.apply();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`${operationCount * 2}个操作处理耗时: ${duration.toFixed(2)}ms`);
            
            expect(commandBuffer.isEmpty).toBe(true);
            expect(scene.entities.count).toBeGreaterThanOrEqual(operationCount);
        });
    });
});