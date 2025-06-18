/**
 * 事件管理器 - 统一处理面板的事件通信
 */
export class EventManager {
    private static instance: EventManager;
    private eventListeners: Map<string, EventListener[]> = new Map();

    private constructor() {}

    static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    /**
     * 添加事件监听器
     */
    addEventListener(eventType: string, listener: EventListener): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        
        const listeners = this.eventListeners.get(eventType)!;
        listeners.push(listener);
        
        // 添加到DOM
        document.addEventListener(eventType, listener);
        
        console.log(`[EventManager] 添加事件监听器: ${eventType}`);
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(eventType: string, listener: EventListener): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
                document.removeEventListener(eventType, listener);
                console.log(`[EventManager] 移除事件监听器: ${eventType}`);
            }
        }
    }

    /**
     * 移除特定类型的所有监听器
     */
    removeAllListeners(eventType: string): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(listener => {
                document.removeEventListener(eventType, listener);
            });
            this.eventListeners.delete(eventType);
            console.log(`[EventManager] 移除所有 ${eventType} 事件监听器`);
        }
    }

    /**
     * 清理所有事件监听器
     */
    cleanup(): void {
        this.eventListeners.forEach((listeners, eventType) => {
            listeners.forEach(listener => {
                document.removeEventListener(eventType, listener);
            });
        });
        this.eventListeners.clear();
        console.log('[EventManager] 清理所有事件监听器');
    }

    /**
     * 发送消息到主进程
     */
    static sendToMain(message: string, ...args: any[]): void {
        try {
            if (typeof (window as any).sendToMain === 'function') {
                (window as any).sendToMain(message, ...args);
                console.log(`[EventManager] 发送消息到主进程: ${message}`, args);
            } else {
                console.error('[EventManager] sendToMain 方法不可用');
            }
        } catch (error) {
            console.error('[EventManager] 发送消息失败:', error);
        }
    }

    /**
     * 触发自定义事件
     */
    static dispatch(eventType: string, detail?: any): void {
        try {
            const event = new CustomEvent(eventType, { detail });
            document.dispatchEvent(event);
            console.log(`[EventManager] 触发事件: ${eventType}`, detail);
        } catch (error) {
            console.error(`[EventManager] 触发事件失败: ${eventType}`, error);
        }
    }
} 