export interface KeyBinding {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

export interface ICommand {
    readonly id: string;
    readonly label: string;
    readonly icon?: string;
    readonly keybinding?: KeyBinding;
    readonly when?: () => boolean;
    execute(context?: unknown): void | Promise<void>;
}

export interface ICommandRegistry {
    register(command: ICommand): void;
    unregister(commandId: string): void;
    execute(commandId: string, context?: unknown): Promise<void>;
    getCommand(commandId: string): ICommand | undefined;
    getCommands(): ICommand[];
    getKeybindings(): Array<{ command: ICommand; keybinding: KeyBinding }>;
}
