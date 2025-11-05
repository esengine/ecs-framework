import { singleton } from 'tsyringe';
import { open, save, message, ask } from '@tauri-apps/plugin-dialog';
import type { IDialog, OpenDialogOptions, SaveDialogOptions } from '@esengine/editor-core';

@singleton()
export class TauriDialogService implements IDialog {
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
        await message(messageText, { title, kind: type });
    }

    async showConfirm(title: string, messageText: string): Promise<boolean> {
        const result = await ask(messageText, {
            title,
            kind: 'info',
            okLabel: '确定',
            cancelLabel: '取消'
        });
        return result;
    }
}
