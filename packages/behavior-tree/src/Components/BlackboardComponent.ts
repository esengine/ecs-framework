import { Component, ECSComponent } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import { BlackboardValueType } from '../Types/TaskStatus';

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
 * 通常附加到行为树的根节点上
 */
@ECSComponent('Blackboard')
@Serializable({ version: 1 })
export class BlackboardComponent extends Component {
    /** 存储的变量 */
    @Serialize()
    private variables: Map<string, BlackboardVariable> = new Map();

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
     */
    getValue<T = any>(name: string): T | undefined {
        const variable = this.variables.get(name);
        return variable?.value as T;
    }

    /**
     * 设置变量值
     */
    setValue(name: string, value: any, force: boolean = false): boolean {
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
     * 检查变量是否存在
     */
    hasVariable(name: string): boolean {
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
     * 清空所有变量
     */
    clear(): void {
        this.variables.clear();
    }
}
