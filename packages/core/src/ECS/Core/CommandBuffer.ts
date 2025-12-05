import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentType } from './ComponentStorage';
import { IScene } from '../IScene';
import { createLogger } from '../../Utils/Logger';

const logger = createLogger('CommandBuffer');

/**
 * 延迟命令类型
 * Deferred command type
 */
export enum CommandType {
    /** 添加组件 | Add component */
    ADD_COMPONENT = 'add_component',
    /** 移除组件 | Remove component */
    REMOVE_COMPONENT = 'remove_component',
    /** 销毁实体 | Destroy entity */
    DESTROY_ENTITY = 'destroy_entity',
    /** 设置实体激活状态 | Set entity active state */
    SET_ENTITY_ACTIVE = 'set_entity_active'
}

/**
 * 延迟命令接口
 * Deferred command interface
 */
export interface DeferredCommand {
    /** 命令类型 | Command type */
    type: CommandType;
    /** 目标实体 | Target entity */
    entity: Entity;
    /** 组件实例（用于 ADD_COMPONENT）| Component instance (for ADD_COMPONENT) */
    component?: Component;
    /** 组件类型（用于 REMOVE_COMPONENT）| Component type (for REMOVE_COMPONENT) */
    componentType?: ComponentType;
    /** 布尔值（用于启用/激活状态）| Boolean value (for enabled/active state) */
    value?: boolean;
}

/**
 * 命令缓冲区 - 用于延迟执行实体操作
 * Command Buffer - for deferred entity operations
 *
 * 在系统的 process() 方法中使用 CommandBuffer 可以避免迭代过程中修改实体列表，
 * 从而提高性能（无需每帧拷贝数组）并保证迭代安全。
 *
 * Using CommandBuffer in system's process() method avoids modifying entity list during iteration,
 * improving performance (no array copy per frame) and ensuring iteration safety.
 *
 * @example
 * ```typescript
 * class DamageSystem extends EntitySystem {
 *     protected process(entities: readonly Entity[]): void {
 *         for (const entity of entities) {
 *             const health = entity.getComponent(Health);
 *             if (health.value <= 0) {
 *                 // 延迟到帧末执行，不影响当前迭代
 *                 // Deferred to end of frame, doesn't affect current iteration
 *                 this.commands.addComponent(entity, new DeadMarker());
 *                 this.commands.destroyEntity(entity);
 *             }
 *         }
 *     }
 * }
 * ```
 */
export class CommandBuffer {
    /** 命令队列 | Command queue */
    private _commands: DeferredCommand[] = [];

    /** 关联的场景 | Associated scene */
    private _scene: IScene | null = null;

    /** 是否启用调试日志 | Enable debug logging */
    private _debug: boolean = false;

    /**
     * 创建命令缓冲区
     * Create command buffer
     *
     * @param scene - 关联的场景 | Associated scene
     * @param debug - 是否启用调试 | Enable debug
     */
    constructor(scene?: IScene, debug: boolean = false) {
        this._scene = scene ?? null;
        this._debug = debug;
    }

    /**
     * 设置关联的场景
     * Set associated scene
     */
    public setScene(scene: IScene | null): void {
        this._scene = scene;
    }

    /**
     * 获取关联的场景
     * Get associated scene
     */
    public get scene(): IScene | null {
        return this._scene;
    }

    /**
     * 获取待执行的命令数量
     * Get pending command count
     */
    public get pendingCount(): number {
        return this._commands.length;
    }

    /**
     * 检查是否有待执行的命令
     * Check if there are pending commands
     */
    public get hasPending(): boolean {
        return this._commands.length > 0;
    }

    /**
     * 延迟添加组件
     * Deferred add component
     *
     * @param entity - 目标实体 | Target entity
     * @param component - 要添加的组件 | Component to add
     */
    public addComponent(entity: Entity, component: Component): void {
        this._commands.push({
            type: CommandType.ADD_COMPONENT,
            entity,
            component
        });

        if (this._debug) {
            logger.debug(`CommandBuffer: 延迟添加组件 ${component.constructor.name} 到实体 ${entity.name}`);
        }
    }

    /**
     * 延迟移除组件
     * Deferred remove component
     *
     * @param entity - 目标实体 | Target entity
     * @param componentType - 要移除的组件类型 | Component type to remove
     */
    public removeComponent<T extends Component>(entity: Entity, componentType: ComponentType<T>): void {
        this._commands.push({
            type: CommandType.REMOVE_COMPONENT,
            entity,
            componentType
        });

        if (this._debug) {
            logger.debug(`CommandBuffer: 延迟移除组件 ${componentType.name} 从实体 ${entity.name}`);
        }
    }

    /**
     * 延迟销毁实体
     * Deferred destroy entity
     *
     * @param entity - 要销毁的实体 | Entity to destroy
     */
    public destroyEntity(entity: Entity): void {
        this._commands.push({
            type: CommandType.DESTROY_ENTITY,
            entity
        });

        if (this._debug) {
            logger.debug(`CommandBuffer: 延迟销毁实体 ${entity.name}`);
        }
    }

    /**
     * 延迟设置实体激活状态
     * Deferred set entity active state
     *
     * @param entity - 目标实体 | Target entity
     * @param active - 激活状态 | Active state
     */
    public setEntityActive(entity: Entity, active: boolean): void {
        this._commands.push({
            type: CommandType.SET_ENTITY_ACTIVE,
            entity,
            value: active
        });

        if (this._debug) {
            logger.debug(`CommandBuffer: 延迟设置实体 ${entity.name} 激活状态为 ${active}`);
        }
    }

    /**
     * 执行所有待处理的命令
     * Execute all pending commands
     *
     * 通常在帧末由 Scene 自动调用。
     * Usually called automatically by Scene at end of frame.
     *
     * @returns 执行的命令数量 | Number of commands executed
     */
    public flush(): number {
        if (this._commands.length === 0) {
            return 0;
        }

        const count = this._commands.length;

        if (this._debug) {
            logger.debug(`CommandBuffer: 开始执行 ${count} 个延迟命令`);
        }

        // 复制命令列表并清空，防止执行过程中有新命令加入
        // Copy and clear command list to prevent new commands during execution
        const commands = this._commands;
        this._commands = [];

        for (const cmd of commands) {
            this.executeCommand(cmd);
        }

        if (this._debug) {
            logger.debug(`CommandBuffer: 完成执行 ${count} 个延迟命令`);
        }

        return count;
    }

    /**
     * 执行单个命令
     * Execute single command
     */
    private executeCommand(cmd: DeferredCommand): void {
        // 检查实体是否仍然有效
        // Check if entity is still valid
        if (!cmd.entity.scene) {
            if (this._debug) {
                logger.debug(`CommandBuffer: 跳过命令，实体 ${cmd.entity.name} 已无效`);
            }
            return;
        }

        try {
            switch (cmd.type) {
                case CommandType.ADD_COMPONENT:
                    if (cmd.component) {
                        cmd.entity.addComponent(cmd.component);
                    }
                    break;

                case CommandType.REMOVE_COMPONENT:
                    if (cmd.componentType) {
                        cmd.entity.removeComponentByType(cmd.componentType);
                    }
                    break;

                case CommandType.DESTROY_ENTITY:
                    cmd.entity.destroy();
                    break;

                case CommandType.SET_ENTITY_ACTIVE:
                    if (cmd.value !== undefined) {
                        cmd.entity.active = cmd.value;
                    }
                    break;
            }
        } catch (error) {
            logger.error(`CommandBuffer: 执行命令失败`, { command: cmd, error });
        }
    }

    /**
     * 清空所有待处理的命令（不执行）
     * Clear all pending commands (without executing)
     */
    public clear(): void {
        if (this._debug && this._commands.length > 0) {
            logger.debug(`CommandBuffer: 清空 ${this._commands.length} 个未执行的命令`);
        }
        this._commands.length = 0;
    }

    /**
     * 销毁命令缓冲区
     * Dispose command buffer
     */
    public dispose(): void {
        this.clear();
        this._scene = null;
    }
}

