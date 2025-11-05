export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface INotification {
    show(message: string, type?: NotificationType, duration?: number): void;
    hide(id: string): void;
}
