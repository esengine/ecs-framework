import { IService } from '@esengine/ecs-framework';
import { BlackboardValueType, BlackboardVariable } from '../Types/TaskStatus';

/**
 * 全局黑板配置
 */
export interface GlobalBlackboardConfig {
    version: string;
    variables: BlackboardVariable[];
}

/**
 * 全局黑板服务
 *
 * 提供所有行为树共享的全局变量存储
 *
 * 使用方式：
 * ```typescript
 * // 注册服务（在 BehaviorTreePlugin.install 中自动完成）
 * core.services.registerSingleton(GlobalBlackboardService);
 *
 * // 获取服务
 * const blackboard = core.services.resolve(GlobalBlackboardService);
 * ```
 */
export class GlobalBlackboardService implements IService {
    private variables: Map<string, BlackboardVariable> = new Map();

    dispose(): void {
        this.variables.clear();
    }

    /**
     * 定义全局变量
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
        const variable: BlackboardVariable = {
            name,
            type,
            value: initialValue,
            readonly: options?.readonly ?? false
        };

        if (options?.description !== undefined) {
            variable.description = options.description;
        }

        this.variables.set(name, variable);
    }

    /**
     * 获取全局变量值
     */
    getValue<T = any>(name: string): T | undefined {
        const variable = this.variables.get(name);
        return variable?.value as T;
    }

    /**
     * 设置全局变量值
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
     * 检查全局变量是否存在
     */
    hasVariable(name: string): boolean {
        return this.variables.has(name);
    }

    /**
     * 删除全局变量
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
     * 获取所有变量
     */
    getAllVariables(): BlackboardVariable[] {
        return Array.from(this.variables.values());
    }

    /**
     * 清空所有全局变量
     */
    clear(): void {
        this.variables.clear();
    }

    /**
     * 批量设置变量
     */
    setVariables(values: Record<string, any>): void {
        for (const [name, value] of Object.entries(values)) {
            const variable = this.variables.get(name);
            if (variable && !variable.readonly) {
                variable.value = value;
            }
        }
    }

    /**
     * 批量获取变量
     */
    getVariables(names: string[]): Record<string, any> {
        const result: Record<string, any> = {};
        for (const name of names) {
            const value = this.getValue(name);
            if (value !== undefined) {
                result[name] = value;
            }
        }
        return result;
    }

    /**
     * 导出配置
     */
    exportConfig(): GlobalBlackboardConfig {
        return {
            version: '1.0',
            variables: Array.from(this.variables.values())
        };
    }

    /**
     * 导入配置
     */
    importConfig(config: GlobalBlackboardConfig): void {
        this.variables.clear();
        for (const variable of config.variables) {
            this.variables.set(variable.name, variable);
        }
    }

    /**
     * 序列化为 JSON
     */
    toJSON(): string {
        return JSON.stringify(this.exportConfig(), null, 2);
    }

    /**
     * 从 JSON 反序列化
     */
    static fromJSON(json: string): GlobalBlackboardConfig {
        return JSON.parse(json);
    }
}
