import { DomainError } from './DomainError';

export class PluginError extends DomainError {
    constructor(
        message: string,
        public readonly pluginId?: string,
        public readonly pluginName?: string,
        public readonly operation?: 'load' | 'activate' | 'deactivate' | 'execute',
        public readonly originalError?: Error
    ) {
        super(message);
    }

    getUserMessage(): string {
        const operationMap = {
            load: '加载',
            activate: '激活',
            deactivate: '停用',
            execute: '执行'
        };

        const operationText = this.operation ? operationMap[this.operation] : '操作';
        const pluginText = this.pluginName || this.pluginId || '插件';

        return `${pluginText}${operationText}失败: ${this.message}`;
    }

    static loadFailed(pluginId: string, error?: Error): PluginError {
        return new PluginError(
            error?.message || '插件加载失败',
            pluginId,
            undefined,
            'load',
            error
        );
    }

    static activateFailed(pluginId: string, pluginName: string, error?: Error): PluginError {
        return new PluginError(
            error?.message || '插件激活失败',
            pluginId,
            pluginName,
            'activate',
            error
        );
    }

    static executeFailed(pluginId: string, error?: Error): PluginError {
        return new PluginError(
            error?.message || '插件执行失败',
            pluginId,
            undefined,
            'execute',
            error
        );
    }
}
