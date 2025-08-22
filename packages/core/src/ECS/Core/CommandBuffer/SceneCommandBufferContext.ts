/**
 * Scene的CommandBuffer上下文适配器
 * 
 * 将Scene的实体和组件操作适配到CommandBuffer的执行上下文接口
 */

import { Component } from '../../Component';
import { Entity } from '../../Entity';
import { IScene } from '../../IScene';
import { EntityId, ICommandBufferContext } from './Types';
import { ILogger, createLogger } from '../../../Utils/Logger';

/**
 * Scene的CommandBuffer上下文实现
 * 
 * 将CommandBuffer的操作映射到Scene的具体实现
 */
export class SceneCommandBufferContext implements ICommandBufferContext {
    private _scene: IScene;
    private _logger: ILogger;

    /**
     * 创建Scene CommandBuffer上下文
     * @param scene 场景实例
     */
    constructor(scene: IScene) {
        this._scene = scene;
        this._logger = createLogger('SceneCommandBufferContext');
    }

    /**
     * 创建实体
     * @param name 实体名称
     * @param idHint ID提示
     * @returns 创建的实体
     */
    public createEntity(name?: string, idHint?: EntityId): Entity {
        try {
            if (idHint !== undefined) {
                if (this._scene.findEntityById(idHint)) {
                    this._logger.warn(`实体ID ${idHint} 已存在，使用自动分配ID`);
                    return this._scene.createEntity(name || `Entity_${idHint}`);
                }
                
                const entity = new Entity(name || `Entity_${idHint}`, idHint);
                entity.scene = this._scene;
                this._scene.addEntity(entity);
                return entity;
            } else {
                return this._scene.createEntity(name || 'Entity');
            }
        } catch (error) {
            this._logger.error('创建实体时发生错误:', error);
            throw error;
        }
    }

    /**
     * 销毁实体
     * @param entityId 实体ID
     * @returns 是否成功销毁
     */
    public destroyEntity(entityId: EntityId): boolean {
        const entity = this.getEntity(entityId);
        if (!entity) {
            this._logger.debug(`尝试销毁不存在的实体: ${entityId}`);
            return false;
        }

        try {
            entity.destroy();
            return true;
        } catch (error) {
            this._logger.error(`销毁实体 ${entityId} 时发生错误:`, error);
            return false;
        }
    }

    /**
     * 添加组件到实体
     * @param entityId 实体ID
     * @param ComponentClass 组件类
     * @param args 组件构造参数
     * @returns 是否成功添加
     */
    public addComponent<T extends Component>(
        entityId: EntityId,
        ComponentClass: new (...args: any[]) => T,
        ...args: any[]
    ): boolean {
        const entity = this.getEntity(entityId);
        if (!entity) {
            this._logger.debug(`尝试向不存在的实体 ${entityId} 添加组件 ${ComponentClass.name}`);
            return false;
        }

        try {
            const component = new ComponentClass(...args);
            entity.addComponent(component);
            return true;
        } catch (error) {
            this._logger.error(`向实体 ${entityId} 添加组件 ${ComponentClass.name} 时发生错误:`, error);
            return false;
        }
    }

    /**
     * 从实体移除组件
     * @param entityId 实体ID
     * @param ComponentClass 组件类
     * @returns 是否成功移除
     */
    public removeComponent<T extends Component>(
        entityId: EntityId,
        ComponentClass: new (...args: any[]) => T
    ): boolean {
        const entity = this.getEntity(entityId);
        if (!entity) {
            this._logger.debug(`尝试从不存在的实体 ${entityId} 移除组件 ${ComponentClass.name}`);
            return false;
        }

        try {
            const removedComponent = entity.removeComponentByType(ComponentClass);
            return removedComponent !== null;
        } catch (error) {
            this._logger.error(`从实体 ${entityId} 移除组件 ${ComponentClass.name} 时发生错误:`, error);
            return false;
        }
    }

    /**
     * 根据ID获取实体
     * @param entityId 实体ID
     * @returns 实体实例，不存在则返回null
     */
    public getEntity(entityId: EntityId): Entity | null {
        return this._scene.findEntityById(entityId);
    }

    /**
     * 获取关联的场景
     */
    public get scene(): IScene {
        return this._scene;
    }
}