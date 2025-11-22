import { singleton } from 'tsyringe';
import type { INotification, NotificationType } from '@esengine/editor-core';

@singleton()
export class NotificationService implements INotification {
    private showCallback?: (message: string, type?: NotificationType, duration?: number) => void;
    private hideCallback?: (id: string) => void;

    setCallbacks(
        showCallback: (message: string, type?: NotificationType, duration?: number) => void,
        hideCallback: (id: string) => void
    ): void {
        this.showCallback = showCallback;
        this.hideCallback = hideCallback;
    }

    show(message: string, type: NotificationType = 'info', duration: number = 3000): void {
        if (this.showCallback) {
            this.showCallback(message, type, duration);
        } else {
            console.warn('[NotificationService] showCallback not set, message:', message);
        }
    }

    warning(title: string, message: string, duration: number = 5000): void {
        this.show(`${title}: ${message}`, 'warning', duration);
    }

    error(title: string, message: string, duration: number = 5000): void {
        this.show(`${title}: ${message}`, 'error', duration);
    }

    info(title: string, message: string, duration: number = 3000): void {
        this.show(`${title}: ${message}`, 'info', duration);
    }

    success(title: string, message: string, duration: number = 3000): void {
        this.show(`${title}: ${message}`, 'success', duration);
    }

    hide(id: string): void {
        if (this.hideCallback) {
            this.hideCallback(id);
        } else {
            console.warn('[NotificationService] hideCallback not set');
        }
    }

    dispose(): void {
        this.showCallback = undefined;
        this.hideCallback = undefined;
    }
}
