export interface KeyBinding {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

export interface IUICommand {
    readonly id: string;
    readonly label: string;
    readonly icon?: string;
    readonly keybinding?: KeyBinding;
    readonly when?: () => boolean;
    execute(context?: unknown): void | Promise<void>;
}

export interface ICommandRegistry {
    register(command: IUICommand): void;
    unregister(commandId: string): void;
    execute(commandId: string, context?: unknown): Promise<void>;
    getCommand(commandId: string): IUICommand | undefined;
    getCommands(): IUICommand[];
    getKeybindings(): Array<{ command: IUICommand; keybinding: KeyBinding }>;
}
