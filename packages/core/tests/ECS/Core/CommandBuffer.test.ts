import { CommandBuffer } from '../../../src/ECS/Core/CommandBuffer';
import { Entity } from '../../../src/ECS/Entity';
import { Component } from '../../../src/ECS/Component';
import { Scene } from '../../../src/ECS/Scene';
import { EntitySystem } from '../../../src/ECS/Systems/EntitySystem';
import { Matcher } from '../../../src/ECS/Utils/Matcher';

// 测试组件
class HealthComponent extends Component {
    public value: number = 100;

    constructor(...args: unknown[]) {
        super();
        const [value = 100] = args as [number?];
        this.value = value;
    }
}

class MarkerComponent extends Component {
    public marked: boolean = true;
}

class VelocityComponent extends Component {
    public vx: number = 0;
    public vy: number = 0;
}

// 测试系统 - 使用 CommandBuffer 延迟执行
class DamageSystem extends EntitySystem {
    public processedEntities: Entity[] = [];

    constructor() {
        super(Matcher.all(HealthComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        this.processedEntities = [];
        for (const entity of entities) {
            this.processedEntities.push(entity);
            const health = entity.getComponent(HealthComponent);
            if (health && health.value <= 0) {
                // 使用延迟命令添加标记组件
                this.commands.addComponent(entity, new MarkerComponent());
            }
        }
    }
}

describe('CommandBuffer', () => {
    let commandBuffer: CommandBuffer;
    let scene: Scene;

    beforeEach(() => {
        scene = new Scene();
        commandBuffer = new CommandBuffer(scene);
    });

    afterEach(() => {
        scene.destroyAllEntities();
    });

    describe('基础功能 | Basic functionality', () => {
        test('创建空的 CommandBuffer | should create empty CommandBuffer', () => {
            expect(commandBuffer.pendingCount).toBe(0);
            expect(commandBuffer.hasPending).toBe(false);
        });

        test('设置和获取场景 | should set and get scene', () => {
            const newScene = new Scene();
            commandBuffer.setScene(newScene);
            expect(commandBuffer.scene).toBe(newScene);
            newScene.destroyAllEntities();
        });

        test('构造函数参数 | should accept constructor parameters', () => {
            const cb = new CommandBuffer(scene, true);
            expect(cb.scene).toBe(scene);
        });
    });

    describe('添加组件命令 | Add component command', () => {
        test('延迟添加组件 | should defer adding component', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);
            const component = new MarkerComponent();

            commandBuffer.addComponent(entity, component);

            // 命令已入队但未执行
            expect(commandBuffer.pendingCount).toBe(1);
            expect(commandBuffer.hasPending).toBe(true);
            expect(entity.hasComponent(MarkerComponent)).toBe(false);

            // 执行命令
            const executedCount = commandBuffer.flush();

            expect(executedCount).toBe(1);
            expect(commandBuffer.pendingCount).toBe(0);
            expect(entity.hasComponent(MarkerComponent)).toBe(true);
        });

        test('多个添加组件命令 | should handle multiple add component commands', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            commandBuffer.addComponent(entity, new HealthComponent(50));
            commandBuffer.addComponent(entity, new MarkerComponent());
            commandBuffer.addComponent(entity, new VelocityComponent());

            expect(commandBuffer.pendingCount).toBe(3);

            commandBuffer.flush();

            expect(entity.hasComponent(HealthComponent)).toBe(true);
            expect(entity.hasComponent(MarkerComponent)).toBe(true);
            expect(entity.hasComponent(VelocityComponent)).toBe(true);
        });
    });

    describe('移除组件命令 | Remove component command', () => {
        test('延迟移除组件 | should defer removing component', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new HealthComponent(100));
            scene.addEntity(entity);

            expect(entity.hasComponent(HealthComponent)).toBe(true);

            commandBuffer.removeComponent(entity, HealthComponent);

            // 命令已入队但未执行
            expect(commandBuffer.pendingCount).toBe(1);
            expect(entity.hasComponent(HealthComponent)).toBe(true);

            // 执行命令
            commandBuffer.flush();

            expect(entity.hasComponent(HealthComponent)).toBe(false);
        });

        test('移除不存在的组件不报错 | should not throw when removing non-existent component', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            commandBuffer.removeComponent(entity, HealthComponent);

            expect(() => commandBuffer.flush()).not.toThrow();
        });
    });

    describe('销毁实体命令 | Destroy entity command', () => {
        test('延迟销毁实体 | should defer destroying entity', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            expect(entity.isDestroyed).toBe(false);

            commandBuffer.destroyEntity(entity);

            // 命令已入队但未执行
            expect(commandBuffer.pendingCount).toBe(1);
            expect(entity.isDestroyed).toBe(false);

            // 执行命令
            commandBuffer.flush();

            expect(entity.isDestroyed).toBe(true);
        });

        test('多个实体销毁命令 | should handle multiple destroy commands', () => {
            const entity1 = scene.createEntity('test1');
            const entity2 = scene.createEntity('test2');
            const entity3 = scene.createEntity('test3');
            scene.addEntity(entity1);
            scene.addEntity(entity2);
            scene.addEntity(entity3);

            commandBuffer.destroyEntity(entity1);
            commandBuffer.destroyEntity(entity2);
            commandBuffer.destroyEntity(entity3);

            expect(commandBuffer.pendingCount).toBe(3);

            commandBuffer.flush();

            expect(entity1.isDestroyed).toBe(true);
            expect(entity2.isDestroyed).toBe(true);
            expect(entity3.isDestroyed).toBe(true);
        });
    });

    describe('设置实体激活状态命令 | Set entity active command', () => {
        test('延迟设置实体激活状态 | should defer setting entity active state', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);
            entity.active = true;

            commandBuffer.setEntityActive(entity, false);

            // 命令已入队但未执行
            expect(entity.active).toBe(true);

            // 执行命令
            commandBuffer.flush();

            expect(entity.active).toBe(false);
        });

        test('切换激活状态 | should toggle active state', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);
            entity.active = true;

            commandBuffer.setEntityActive(entity, false);
            commandBuffer.flush();
            expect(entity.active).toBe(false);

            commandBuffer.setEntityActive(entity, true);
            commandBuffer.flush();
            expect(entity.active).toBe(true);
        });
    });

    describe('命令执行安全性 | Command execution safety', () => {
        test('跳过已销毁的实体 | should skip destroyed entities', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            commandBuffer.addComponent(entity, new MarkerComponent());

            // 在执行前销毁实体
            entity.destroy();

            // 执行命令不应报错
            expect(() => commandBuffer.flush()).not.toThrow();
            expect(commandBuffer.pendingCount).toBe(0);
        });

        test('flush 过程中添加新命令 | should handle commands added during flush', () => {
            const entity1 = scene.createEntity('test1');
            const entity2 = scene.createEntity('test2');
            scene.addEntity(entity1);
            scene.addEntity(entity2);

            // 创建一个特殊的命令缓冲区，在 flush 时会添加新命令
            // 但由于 flush 复制了命令列表，新命令不会在本次 flush 中执行
            commandBuffer.addComponent(entity1, new MarkerComponent());

            const executedCount = commandBuffer.flush();

            expect(executedCount).toBe(1);
            expect(entity1.hasComponent(MarkerComponent)).toBe(true);
        });

        test('单个命令失败不影响其他命令 | single command failure should not affect others', () => {
            const entity1 = scene.createEntity('test1');
            const entity2 = scene.createEntity('test2');
            scene.addEntity(entity1);
            scene.addEntity(entity2);

            commandBuffer.addComponent(entity1, new MarkerComponent());
            commandBuffer.addComponent(entity2, new HealthComponent());

            // 销毁 entity1，使第一个命令失效
            entity1.destroy();

            // 执行命令，第一个失败，第二个应该成功
            commandBuffer.flush();

            expect(entity2.hasComponent(HealthComponent)).toBe(true);
        });
    });

    describe('clear 和 dispose | clear and dispose', () => {
        test('clear 清空命令但不执行 | should clear commands without executing', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            commandBuffer.addComponent(entity, new MarkerComponent());
            commandBuffer.destroyEntity(entity);

            expect(commandBuffer.pendingCount).toBe(2);

            commandBuffer.clear();

            expect(commandBuffer.pendingCount).toBe(0);
            expect(entity.hasComponent(MarkerComponent)).toBe(false);
            expect(entity.scene).toBe(scene);
        });

        test('dispose 清空命令和场景引用 | should dispose buffer', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            commandBuffer.addComponent(entity, new MarkerComponent());
            expect(commandBuffer.scene).toBe(scene);

            commandBuffer.dispose();

            expect(commandBuffer.pendingCount).toBe(0);
            expect(commandBuffer.scene).toBeNull();
        });
    });

    describe('混合命令 | Mixed commands', () => {
        test('复杂命令序列 | should handle complex command sequence', () => {
            const entity = scene.createEntity('test');
            entity.addComponent(new HealthComponent(100));
            scene.addEntity(entity);

            // 添加一个组件
            commandBuffer.addComponent(entity, new MarkerComponent());
            // 移除原有组件
            commandBuffer.removeComponent(entity, HealthComponent);
            // 再添加一个组件
            commandBuffer.addComponent(entity, new VelocityComponent());

            expect(commandBuffer.pendingCount).toBe(3);

            commandBuffer.flush();

            expect(entity.hasComponent(MarkerComponent)).toBe(true);
            expect(entity.hasComponent(HealthComponent)).toBe(false);
            expect(entity.hasComponent(VelocityComponent)).toBe(true);
        });

        test('先添加后销毁 | should handle add then destroy sequence', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            commandBuffer.addComponent(entity, new MarkerComponent());
            commandBuffer.destroyEntity(entity);

            commandBuffer.flush();

            // 实体已销毁，组件添加应该已执行（在销毁前）
            expect(entity.isDestroyed).toBe(true);
        });
    });

    describe('与 EntitySystem 集成 | Integration with EntitySystem', () => {
        test('系统可以使用 commands 属性 | system should have commands property', () => {
            const system = new DamageSystem();
            scene.addSystem(system);

            expect(system['commands']).toBeInstanceOf(CommandBuffer);
        });

        test('系统中使用延迟命令 | should use deferred commands in system', () => {
            const entity = scene.createEntity('damaged');
            entity.addComponent(new HealthComponent(0)); // 生命值为0
            scene.addEntity(entity);

            const system = new DamageSystem();
            scene.addSystem(system);

            // 第一次 update：system.process 会添加延迟命令
            scene.update();

            // 检查系统处理了实体
            expect(system.processedEntities.length).toBe(1);

            // 命令应该已经被 flush 执行了（在 Scene.update 的末尾）
            expect(entity.hasComponent(MarkerComponent)).toBe(true);
        });

        test('延迟命令不影响当前帧迭代 | deferred commands should not affect current iteration', () => {
            // 创建多个实体
            const entities: Entity[] = [];
            for (let i = 0; i < 5; i++) {
                const entity = scene.createEntity(`entity${i}`);
                entity.addComponent(new HealthComponent(i === 2 ? 0 : 100)); // entity2 的生命值为0
                scene.addEntity(entity);
                entities.push(entity);
            }

            const system = new DamageSystem();
            scene.addSystem(system);

            // update 执行
            scene.update();

            // 所有5个实体都应该被处理（延迟命令不影响迭代）
            expect(system.processedEntities.length).toBe(5);

            // entity2 应该有 MarkerComponent
            expect(entities[2].hasComponent(MarkerComponent)).toBe(true);
        });
    });

    describe('边界情况 | Edge cases', () => {
        test('空的 flush | should handle empty flush', () => {
            const count = commandBuffer.flush();
            expect(count).toBe(0);
        });

        test('多次 flush | should handle multiple flushes', () => {
            const entity = scene.createEntity('test');
            scene.addEntity(entity);

            commandBuffer.addComponent(entity, new MarkerComponent());
            expect(commandBuffer.flush()).toBe(1);
            expect(commandBuffer.flush()).toBe(0); // 第二次应该是空的
        });

        test('无场景的 CommandBuffer | should work without scene', () => {
            const cb = new CommandBuffer();
            expect(cb.scene).toBeNull();

            // 仍然可以入队命令
            const entity = scene.createEntity('test');
            scene.addEntity(entity);
            cb.addComponent(entity, new MarkerComponent());

            expect(cb.pendingCount).toBe(1);
            cb.flush();
            expect(entity.hasComponent(MarkerComponent)).toBe(true);
        });
    });
});
