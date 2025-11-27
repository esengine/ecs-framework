import { CommandManager } from '@esengine/editor-runtime';
import { RemoveConnectionCommand } from '../commands/tree/RemoveConnectionCommand';
import { ITreeState } from '../commands/ITreeState';

/**
 * 移除连接用例
 */
export class RemoveConnectionUseCase {
    constructor(
        private readonly commandManager: CommandManager,
        private readonly treeState: ITreeState
    ) {}

    /**
     * 执行移除连接操作
     */
    execute(from: string, to: string, fromProperty?: string, toProperty?: string): void {
        const command = new RemoveConnectionCommand(
            this.treeState,
            from,
            to,
            fromProperty,
            toProperty
        );
        this.commandManager.execute(command);
    }
}
