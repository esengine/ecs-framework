import { ICommand } from './ICommand';

/**
 * 命令基类
 * 提供默认实现，具体命令继承此类
 */
export abstract class BaseCommand implements ICommand {
    abstract execute(): void;
    abstract undo(): void;
    abstract getDescription(): string;

    /**
     * 默认不支持合并
     */
    canMergeWith(_other: ICommand): boolean {
        return false;
    }

    /**
     * 默认抛出错误
     */
    mergeWith(_other: ICommand): ICommand {
        throw new Error(`${this.constructor.name} 不支持合并操作`);
    }
}
