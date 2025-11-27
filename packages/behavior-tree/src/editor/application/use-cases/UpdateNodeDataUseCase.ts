import { CommandManager } from '@esengine/editor-runtime';
import { UpdateNodeDataCommand } from '../commands/tree/UpdateNodeDataCommand';
import { ITreeState } from '../commands/ITreeState';

/**
 * 更新节点数据用例
 */
export class UpdateNodeDataUseCase {
    constructor(
        private readonly commandManager: CommandManager,
        private readonly treeState: ITreeState
    ) {}

    /**
     * 更新节点数据
     */
    execute(nodeId: string, data: Record<string, unknown>): void {
        const command = new UpdateNodeDataCommand(this.treeState, nodeId, data);
        this.commandManager.execute(command);
    }
}
