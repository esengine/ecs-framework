import { Component, ECSComponent, Core } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { BlackboardValueType } from '../Types/TaskStatus';
import { GlobalBlackboardService } from '../Services/GlobalBlackboardService';

/**
 * 黑板变量定义
 */
export interface BlackboardVariable {
    name: string;
    type: BlackboardValueType;
    value: any;
    readonly?: boolean;
    description?: string;
}

/**
 * 黑板组件 - 用于节点间共享数据
 *
 * 支持分层查找：
 * 1. 先查找本地变量
 * 2. 如果找不到，自动查找全局 Blackboard
 *
 * 通常附加到行为树的根节点上
 */
@ECSComponent('Blackboard')
@Serializable({ version: 1 })
export class BlackboardComponent extends Component {
    /** 存储的本地变量 */
    @Serialize()
    private variables: Map<string, BlackboardVariable> = new Map();

    /** 是否启用全局 Blackboard 查找 */
    private useGlobalBlackboard: boolean = true;

    /**
     * 定义一个新变量
     */
    defineVariable(
        name: string,
        type: BlackboardValueType,
        initialValue: any,
        options?: {
            readonly?: boolean;
            description?: string;
        }
    ): void {
        this.variables.set(name, {
            name,
            type,
            value: initialValue,
            readonly: options?.readonly ?? false,
            description: options?.description
        });
    }

    /**
     * 获取变量值
     * 先查找本地变量，找不到则查找全局变量
     */
    getValue<T = any>(name: string): T | undefined {
        const variable = this.variables.get(name);
        if (variable !== undefined) {
            return variable.value as T;
        }

        if (this.useGlobalBlackboard) {
            return Core.services.resolve(GlobalBlackboardService).getValue<T>(name);
        }

        return undefined;
    }

    /**
     * 获取本地变量值（不查找全局）
     */
    getLocalValue<T = any>(name: string): T | undefined {
        const variable = this.variables.get(name);
        return variable?.value as T;
    }

    /**
     * 设置变量值
     * 优先设置本地变量，如果本地不存在且全局存在，则设置全局变量
     */
    setValue(name: string, value: any, force: boolean = false): boolean {
        const variable = this.variables.get(name);

        if (variable) {
            if (variable.readonly && !force) {
                return false;
            }
            variable.value = value;
            return true;
        }

        if (this.useGlobalBlackboard) {
            return Core.services.resolve(GlobalBlackboardService).setValue(name, value, force);
        }

        return false;
    }

    /**
     * 设置本地变量值（不影响全局）
     */
    setLocalValue(name: string, value: any, force: boolean = false): boolean {
        const variable = this.variables.get(name);

        if (!variable) {
            return false;
        }

        if (variable.readonly && !force) {
            return false;
        }

        variable.value = value;
        return true;
    }

    /**
     * 检查变量是否存在（包括本地和全局）
     */
    hasVariable(name: string): boolean {
        if (this.variables.has(name)) {
            return true;
        }

        if (this.useGlobalBlackboard) {
            return Core.services.resolve(GlobalBlackboardService).hasVariable(name);
        }

        return false;
    }

    /**
     * 检查本地变量是否存在
     */
    hasLocalVariable(name: string): boolean {
        return this.variables.has(name);
    }

    /**
     * 删除变量
     */
    removeVariable(name: string): boolean {
        return this.variables.delete(name);
    }

    /**
     * 获取所有变量名
     */
    getVariableNames(): string[] {
        return Array.from(this.variables.keys());
    }

    /**
     * 清空所有本地变量
     */
    clear(): void {
        this.variables.clear();
    }

    /**
     * 启用/禁用全局 Blackboard 查找
     */
    setUseGlobalBlackboard(enabled: boolean): void {
        this.useGlobalBlackboard = enabled;
    }

    /**
     * 是否启用全局 Blackboard 查找
     */
    isUsingGlobalBlackboard(): boolean {
        return this.useGlobalBlackboard;
    }

    /**
     * 获取所有变量（包括本地和全局）
     */
    getAllVariables(): BlackboardVariable[] {
        const locals = Array.from(this.variables.values());

        if (this.useGlobalBlackboard) {
            const globals = Core.services.resolve(GlobalBlackboardService).getAllVariables();
            const localNames = new Set(this.variables.keys());
            const filteredGlobals = globals.filter(v => !localNames.has(v.name));
            return [...locals, ...filteredGlobals];
        }

        return locals;
    }

    /**
     * 获取全局 Blackboard 服务的引用
     */
    static getGlobalBlackboard(): GlobalBlackboardService {
        return Core.services.resolve(GlobalBlackboardService);
    }
}
