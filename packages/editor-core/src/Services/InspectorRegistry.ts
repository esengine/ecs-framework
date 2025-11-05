import { IInspectorProvider, InspectorContext } from './IInspectorProvider';
import React from 'react';

/**
 * Inspector注册表
 * 管理所有Inspector提供器
 */
export class InspectorRegistry {
    private providers: Map<string, IInspectorProvider> = new Map();

    /**
     * 注册Inspector提供器
     */
    register(provider: IInspectorProvider): void {
        if (this.providers.has(provider.id)) {
            console.warn(`Inspector provider with id "${provider.id}" is already registered`);
            return;
        }
        this.providers.set(provider.id, provider);
    }

    /**
     * 注销Inspector提供器
     */
    unregister(providerId: string): void {
        this.providers.delete(providerId);
    }

    /**
     * 获取指定ID的提供器
     */
    getProvider(providerId: string): IInspectorProvider | undefined {
        return this.providers.get(providerId);
    }

    /**
     * 获取所有提供器
     */
    getAllProviders(): IInspectorProvider[] {
        return Array.from(this.providers.values());
    }

    /**
     * 查找可以处理指定目标的提供器
     * 按优先级排序，返回第一个可以处理的提供器
     */
    findProvider(target: unknown): IInspectorProvider | undefined {
        const providers = Array.from(this.providers.values())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const provider of providers) {
            if (provider.canHandle(target)) {
                return provider;
            }
        }

        return undefined;
    }

    /**
     * 渲染Inspector内容
     * 自动查找合适的提供器并渲染
     */
    render(target: unknown, context: InspectorContext): React.ReactElement | null {
        const provider = this.findProvider(target);
        if (!provider) {
            return null;
        }

        return provider.render(target, context);
    }

    /**
     * 清空所有提供器
     */
    clear(): void {
        this.providers.clear();
    }
}
