import { IService } from '@esengine/ecs-framework';
import { ComponentType } from 'react';

/**
 * 窗口描述符
 */
export interface WindowDescriptor {
    /**
     * 窗口唯一标识
     */
    id: string;

    /**
     * 窗口组件
     */
    component: ComponentType<any>;

    /**
     * 窗口标题
     */
    title?: string;

    /**
     * 默认宽度
     */
    defaultWidth?: number;

    /**
     * 默认高度
     */
    defaultHeight?: number;
}

/**
 * 窗口实例
 */
export interface WindowInstance {
    /**
     * 窗口描述符
     */
    descriptor: WindowDescriptor;

    /**
     * 是否打开
     */
    isOpen: boolean;

    /**
     * 窗口参数
     */
    params?: Record<string, any>;
}

/**
 * 窗口注册表服务
 *
 * 管理插件注册的窗口组件
 */
export class WindowRegistry implements IService {
    private windows: Map<string, WindowDescriptor> = new Map();
    private openWindows: Map<string, WindowInstance> = new Map();
    private listeners: Set<() => void> = new Set();

    /**
     * 注册窗口
     */
    registerWindow(descriptor: WindowDescriptor): void {
        if (this.windows.has(descriptor.id)) {
            console.warn(`Window ${descriptor.id} is already registered`);
            return;
        }
        this.windows.set(descriptor.id, descriptor);
    }

    /**
     * 取消注册窗口
     */
    unregisterWindow(windowId: string): void {
        this.windows.delete(windowId);
        this.openWindows.delete(windowId);
        this.notifyListeners();
    }

    /**
     * 获取窗口描述符
     */
    getWindow(windowId: string): WindowDescriptor | undefined {
        return this.windows.get(windowId);
    }

    /**
     * 获取所有窗口描述符
     */
    getAllWindows(): WindowDescriptor[] {
        return Array.from(this.windows.values());
    }

    /**
     * 打开窗口
     */
    openWindow(windowId: string, params?: Record<string, any>): void {
        const descriptor = this.windows.get(windowId);
        if (!descriptor) {
            console.warn(`Window ${windowId} is not registered`);
            return;
        }

        this.openWindows.set(windowId, {
            descriptor,
            isOpen: true,
            params
        });
        this.notifyListeners();
    }

    /**
     * 关闭窗口
     */
    closeWindow(windowId: string): void {
        this.openWindows.delete(windowId);
        this.notifyListeners();
    }

    /**
     * 获取打开的窗口实例
     */
    getOpenWindow(windowId: string): WindowInstance | undefined {
        return this.openWindows.get(windowId);
    }

    /**
     * 获取所有打开的窗口
     */
    getAllOpenWindows(): WindowInstance[] {
        return Array.from(this.openWindows.values());
    }

    /**
     * 检查窗口是否打开
     */
    isWindowOpen(windowId: string): boolean {
        return this.openWindows.has(windowId);
    }

    /**
     * 添加变化监听器
     */
    addListener(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * 清空所有窗口
     */
    clear(): void {
        this.windows.clear();
        this.openWindows.clear();
        this.listeners.clear();
    }

    /**
     * 释放资源
     */
    dispose(): void {
        this.clear();
    }
}
