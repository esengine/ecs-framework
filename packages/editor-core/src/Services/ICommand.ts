export interface ICommand {
    execute(): void | Promise<void>;
    undo(): void | Promise<void>;
    getDescription(): string;
    canMergeWith(other: ICommand): boolean;
    mergeWith(other: ICommand): ICommand;
}

export interface ICommandManager {
    execute(command: ICommand): void;
    executeBatch(commands: ICommand[]): void;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    clear(): void;
    getUndoHistory(): string[];
    getRedoHistory(): string[];
}
