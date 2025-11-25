import { Core, createLogger, MessageHub } from '@esengine/editor-runtime';

const logger = createLogger('NotificationService');

export class NotificationService {
    private static instance: NotificationService;
    private messageHub: MessageHub | null = null;

    private constructor() {
        // 尝试从 Core 获取 MessageHub
        try {
            this.messageHub = Core.services.resolve(MessageHub);
        } catch (error) {
            logger.warn('MessageHub not available, toast notifications will be disabled');
        }
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
        if (!this.messageHub) {
            logger.info(`[Toast ${type}] ${message}`);
            return;
        }

        const notification = {
            type,
            message,
            timestamp: Date.now()
        };

        this.messageHub.publish('notification:show', notification);
    }

    public success(message: string): void {
        this.showToast(message, 'success');
    }

    public error(message: string): void {
        this.showToast(message, 'error');
    }

    public warning(message: string): void {
        this.showToast(message, 'warning');
    }

    public info(message: string): void {
        this.showToast(message, 'info');
    }
}

// 导出单例实例的便捷方法
export const showToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
    NotificationService.getInstance().showToast(message, type);
};
