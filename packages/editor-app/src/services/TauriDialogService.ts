import { singleton } from 'tsyringe';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { IDialog, OpenDialogOptions, SaveDialogOptions } from '@esengine/editor-core';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

export interface IDialogExtended extends IDialog {
    setConfirmCallback(callback: (data: ConfirmDialogData) => void): void;
    setLocale(locale: string): void;
}

const dialogTranslations = {
    en: { confirm: 'Confirm', cancel: 'Cancel' },
    zh: { confirm: '确定', cancel: '取消' },
    es: { confirm: 'Confirmar', cancel: 'Cancelar' }
} as const;

type LocaleKey = keyof typeof dialogTranslations;

@singleton()
export class TauriDialogService implements IDialogExtended {
    private showConfirmCallback?: (data: ConfirmDialogData) => void;
    private locale: string = 'zh';

    dispose(): void {
        this.showConfirmCallback = undefined;
    }

    setConfirmCallback(callback: (data: ConfirmDialogData) => void): void {
        this.showConfirmCallback = callback;
    }

    setLocale(locale: string): void {
        this.locale = locale;
    }

    async openDialog(options: OpenDialogOptions): Promise<string | string[] | null> {
        const result = await open({
            multiple: options.multiple || false,
            directory: options.directory || false,
            filters: options.filters,
            defaultPath: options.defaultPath,
            title: options.title
        });

        return result;
    }

    async saveDialog(options: SaveDialogOptions): Promise<string | null> {
        const result = await save({
            filters: options.filters,
            defaultPath: options.defaultPath,
            title: options.title
        });

        return result;
    }

    async showMessage(title: string, messageText: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
        console.warn('[TauriDialogService] showMessage not implemented with custom UI, use notification instead');
    }

    async showConfirm(title: string, messageText: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.showConfirmCallback) {
                let resolved = false;
                const handleResolve = (result: boolean) => {
                    if (!resolved) {
                        resolved = true;
                        resolve(result);
                    }
                };

                const localeKey = (this.locale in dialogTranslations ? this.locale : 'en') as LocaleKey;
                const texts = dialogTranslations[localeKey];
                const confirmText = texts.confirm;
                const cancelText = texts.cancel;

                this.showConfirmCallback({
                    title,
                    message: messageText,
                    confirmText,
                    cancelText,
                    onConfirm: () => handleResolve(true),
                    onCancel: () => handleResolve(false)
                });
            } else {
                console.warn('[TauriDialogService] showConfirmCallback not set');
                resolve(false);
            }
        });
    }
}
