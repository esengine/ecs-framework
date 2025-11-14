import { ICommand } from './ICommand';

/**
 * 命令历史记录配置
 */
export interface CommandManagerConfig {
    /**
     * 最大历史记录数量
     */
    maxHistorySize?: number;

    /**
     * 是否自动合并相似命令
     */
    autoMerge?: boolean;
}

/**
 * 命令管理器
 * 管理命令的执行、撤销、重做以及历史记录
 */
export class CommandManager {
    private undoStack: ICommand[] = [];
    private redoStack: ICommand[] = [];
    private readonly config: Required<CommandManagerConfig>;
    private isExecuting = false;

    constructor(config: CommandManagerConfig = {}) {
        this.config = {
            maxHistorySize: config.maxHistorySize ?? 100,
            autoMerge: config.autoMerge ?? true
        };
    }

    /**
     * 执行命令
     */
    execute(command: ICommand): void {
        if (this.isExecuting) {
            throw new Error('不能在命令执行过程中执行新命令');
        }

        this.isExecuting = true;

        try {
            command.execute();

            if (this.config.autoMerge && this.undoStack.length > 0) {
                const lastCommand = this.undoStack[this.undoStack.length - 1];
                if (lastCommand && lastCommand.canMergeWith(command)) {
                    const mergedCommand = lastCommand.mergeWith(command);
                    this.undoStack[this.undoStack.length - 1] = mergedCommand;
                    this.redoStack = [];
                    return;
                }
            }

            this.undoStack.push(command);
            this.redoStack = [];

            if (this.undoStack.length > this.config.maxHistorySize) {
                this.undoStack.shift();
            }
        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * 撤销上一个命令
     */
    undo(): void {
        if (this.isExecuting) {
            throw new Error('不能在命令执行过程中撤销');
        }

        const command = this.undoStack.pop();
        if (!command) {
            return;
        }

        this.isExecuting = true;

        try {
            command.undo();
            this.redoStack.push(command);
        } catch (error) {
            this.undoStack.push(command);
            throw error;
        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * 重做上一个被撤销的命令
     */
    redo(): void {
        if (this.isExecuting) {
            throw new Error('不能在命令执行过程中重做');
        }

        const command = this.redoStack.pop();
        if (!command) {
            return;
        }

        this.isExecuting = true;

        try {
            command.execute();
            this.undoStack.push(command);
        } catch (error) {
            this.redoStack.push(command);
            throw error;
        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * 检查是否可以撤销
     */
    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * 检查是否可以重做
     */
    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * 获取撤销栈的描述列表
     */
    getUndoHistory(): string[] {
        return this.undoStack.map((cmd) => cmd.getDescription());
    }

    /**
     * 获取重做栈的描述列表
     */
    getRedoHistory(): string[] {
        return this.redoStack.map((cmd) => cmd.getDescription());
    }

    /**
     * 清空所有历史记录
     */
    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * 批量执行命令（作为单一操作，可以一次撤销）
     */
    executeBatch(commands: ICommand[]): void {
        if (commands.length === 0) {
            return;
        }

        const batchCommand = new BatchCommand(commands);
        this.execute(batchCommand);
    }
}

/**
 * 批量命令
 * 将多个命令组合为一个命令
 */
class BatchCommand implements ICommand {
    constructor(private readonly commands: ICommand[]) {}

    execute(): void {
        for (const command of this.commands) {
            command.execute();
        }
    }

    undo(): void {
        for (let i = this.commands.length - 1; i >= 0; i--) {
            const command = this.commands[i];
            if (command) {
                command.undo();
            }
        }
    }

    getDescription(): string {
        return `批量操作 (${this.commands.length} 个命令)`;
    }

    canMergeWith(): boolean {
        return false;
    }

    mergeWith(): ICommand {
        throw new Error('批量命令不支持合并');
    }
}
