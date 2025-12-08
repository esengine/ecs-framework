import { type GlobalBlackboardConfig, BlackboardValueType, type BlackboardVariable } from '@esengine/behavior-tree';
import { createLogger } from '@esengine/esengine';

const logger = createLogger('GlobalBlackboardService');

export type GlobalBlackboardValue =
    | string
    | number
    | boolean
    | { x: number; y: number }
    | { x: number; y: number; z: number }
    | Record<string, string | number | boolean>
    | Array<string | number | boolean>;

export interface GlobalBlackboardVariable {
    key: string;
    type: BlackboardValueType;
    defaultValue: GlobalBlackboardValue;
    description?: string;
}

/**
 * 全局黑板服务
 * 管理跨行为树共享的全局变量
 */
export class GlobalBlackboardService {
    private static instance: GlobalBlackboardService;
    private variables: Map<string, GlobalBlackboardVariable> = new Map();
    private changeCallbacks: Array<() => void> = [];
    private projectPath: string | null = null;

    private constructor() {}

    static getInstance(): GlobalBlackboardService {
        if (!this.instance) {
            this.instance = new GlobalBlackboardService();
        }
        return this.instance;
    }

    /**
     * 设置项目路径
     */
    setProjectPath(path: string | null): void {
        this.projectPath = path;
    }

    /**
     * 获取项目路径
     */
    getProjectPath(): string | null {
        return this.projectPath;
    }

    /**
     * 添加全局变量
     */
    addVariable(variable: GlobalBlackboardVariable): void {
        if (this.variables.has(variable.key)) {
            throw new Error(`全局变量 "${variable.key}" 已存在`);
        }
        this.variables.set(variable.key, variable);
        this.notifyChange();
    }

    /**
     * 更新全局变量
     */
    updateVariable(key: string, updates: Partial<Omit<GlobalBlackboardVariable, 'key'>>): void {
        const variable = this.variables.get(key);
        if (!variable) {
            throw new Error(`全局变量 "${key}" 不存在`);
        }
        this.variables.set(key, { ...variable, ...updates });
        this.notifyChange();
    }

    /**
     * 删除全局变量
     */
    deleteVariable(key: string): boolean {
        const result = this.variables.delete(key);
        if (result) {
            this.notifyChange();
        }
        return result;
    }

    /**
     * 重命名全局变量
     */
    renameVariable(oldKey: string, newKey: string): void {
        if (!this.variables.has(oldKey)) {
            throw new Error(`全局变量 "${oldKey}" 不存在`);
        }
        if (this.variables.has(newKey)) {
            throw new Error(`全局变量 "${newKey}" 已存在`);
        }

        const variable = this.variables.get(oldKey)!;
        this.variables.delete(oldKey);
        this.variables.set(newKey, { ...variable, key: newKey });
        this.notifyChange();
    }

    /**
     * 获取全局变量
     */
    getVariable(key: string): GlobalBlackboardVariable | undefined {
        return this.variables.get(key);
    }

    /**
     * 获取所有全局变量
     */
    getAllVariables(): GlobalBlackboardVariable[] {
        return Array.from(this.variables.values());
    }

    getVariablesMap(): Record<string, GlobalBlackboardValue> {
        const map: Record<string, GlobalBlackboardValue> = {};
        for (const [, variable] of this.variables) {
            map[variable.key] = variable.defaultValue;
        }
        return map;
    }

    /**
     * 检查变量是否存在
     */
    hasVariable(key: string): boolean {
        return this.variables.has(key);
    }

    /**
     * 清空所有变量
     */
    clear(): void {
        this.variables.clear();
        this.notifyChange();
    }

    /**
     * 导出为全局黑板配置
     */
    toConfig(): GlobalBlackboardConfig {
        const variables: BlackboardVariable[] = [];

        for (const variable of this.variables.values()) {
            variables.push({
                name: variable.key,
                type: variable.type,
                value: variable.defaultValue,
                description: variable.description
            });
        }

        return { version: '1.0', variables };
    }

    /**
     * 从配置导入
     */
    fromConfig(config: GlobalBlackboardConfig): void {
        this.variables.clear();

        if (config.variables && Array.isArray(config.variables)) {
            for (const variable of config.variables) {
                this.variables.set(variable.name, {
                    key: variable.name,
                    type: variable.type,
                    defaultValue: variable.value as GlobalBlackboardValue,
                    description: variable.description
                });
            }
        }

        this.notifyChange();
    }

    /**
     * 序列化为 JSON
     */
    toJSON(): string {
        return JSON.stringify(this.toConfig(), null, 2);
    }

    /**
     * 从 JSON 反序列化
     */
    fromJSON(json: string): void {
        try {
            const config = JSON.parse(json) as GlobalBlackboardConfig;
            this.fromConfig(config);
        } catch (error) {
            logger.error('Failed to parse global blackboard JSON:', error);
            throw new Error('无效的全局黑板配置格式');
        }
    }

    /**
     * 监听变化
     */
    onChange(callback: () => void): () => void {
        this.changeCallbacks.push(callback);
        return () => {
            const index = this.changeCallbacks.indexOf(callback);
            if (index > -1) {
                this.changeCallbacks.splice(index, 1);
            }
        };
    }

    private notifyChange(): void {
        this.changeCallbacks.forEach((cb) => {
            try {
                cb();
            } catch (error) {
                logger.error('Error in global blackboard change callback:', error);
            }
        });
    }
}
