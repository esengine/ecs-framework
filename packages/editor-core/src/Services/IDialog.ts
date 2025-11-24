export interface DialogOptions {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
}

export interface OpenDialogOptions extends DialogOptions {
    directory?: boolean;
    multiple?: boolean;
}

export interface SaveDialogOptions extends DialogOptions {
    defaultFileName?: string;
}

export interface IDialog {
    dispose(): void;
    openDialog(options: OpenDialogOptions): Promise<string | string[] | null>;
    saveDialog(options: SaveDialogOptions): Promise<string | null>;
    showMessage(title: string, message: string, type?: 'info' | 'warning' | 'error'): Promise<void>;
    showConfirm(title: string, message: string): Promise<boolean>;
}

// Service identifier for DI registration
export const IDialogService = Symbol('IDialogService');
