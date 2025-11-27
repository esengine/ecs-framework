import { Position } from '../../domain/value-objects/Position';
import { CommandManager } from '@esengine/editor-runtime';
import { MoveNodeCommand } from '../commands/tree/MoveNodeCommand';
import { ITreeState } from '../commands/ITreeState';

/**
 * 移动节点用例
 */
export class MoveNodeUseCase {
    constructor(
        private readonly commandManager: CommandManager,
        private readonly treeState: ITreeState
    ) {}

    /**
     * 移动单个节点
     */
    execute(nodeId: string, newPosition: Position): void {
        const command = new MoveNodeCommand(this.treeState, nodeId, newPosition);
        this.commandManager.execute(command);
    }

    /**
     * 批量移动节点
     */
    executeBatch(moves: Array<{ nodeId: string; position: Position }>): void {
        const commands = moves.map(
            ({ nodeId, position }) => new MoveNodeCommand(this.treeState, nodeId, position)
        );
        this.commandManager.executeBatch(commands);
    }
}
