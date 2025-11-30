/**
 * 命令接口
 * 实现命令模式，支持撤销/重做功能
 */
export interface ICommand {
    /**
     * 执行命令
     */
    execute(): void;

    /**
     * 撤销命令
     */
    undo(): void;

    /**
     * 获取命令描述（用于显示历史记录）
     */
    getDescription(): string;

    /**
     * 检查命令是否可以合并
     * 用于优化撤销/重做历史，例如连续的移动操作可以合并为一个
     */
    canMergeWith(other: ICommand): boolean;

    /**
     * 与另一个命令合并
     */
    mergeWith(other: ICommand): ICommand;
}
