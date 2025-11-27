import { CommandManager, ICommand } from '@esengine/editor-runtime';
import { DeleteNodeCommand } from '../commands/tree/DeleteNodeCommand';
import { RemoveConnectionCommand } from '../commands/tree/RemoveConnectionCommand';
import { ITreeState } from '../commands/ITreeState';

/**
 * 删除节点用例
 * 删除节点时会自动删除相关连接
 */
export class DeleteNodeUseCase {
    constructor(
        private readonly commandManager: CommandManager,
        private readonly treeState: ITreeState
    ) {}

    /**
     * 删除单个节点
     */
    execute(nodeId: string): void {
        const tree = this.treeState.getTree();

        const relatedConnections = tree.connections.filter(
            (conn) => conn.from === nodeId || conn.to === nodeId
        );

        const commands: ICommand[] = [];

        relatedConnections.forEach((conn) => {
            commands.push(
                new RemoveConnectionCommand(
                    this.treeState,
                    conn.from,
                    conn.to,
                    conn.fromProperty,
                    conn.toProperty
                )
            );
        });

        commands.push(new DeleteNodeCommand(this.treeState, nodeId));

        this.commandManager.executeBatch(commands);
    }

    /**
     * 批量删除节点
     */
    executeBatch(nodeIds: string[]): void {
        const tree = this.treeState.getTree();
        const commands: ICommand[] = [];

        const nodeIdSet = new Set(nodeIds);

        const relatedConnections = tree.connections.filter(
            (conn) => nodeIdSet.has(conn.from) || nodeIdSet.has(conn.to)
        );

        relatedConnections.forEach((conn) => {
            commands.push(
                new RemoveConnectionCommand(
                    this.treeState,
                    conn.from,
                    conn.to,
                    conn.fromProperty,
                    conn.toProperty
                )
            );
        });

        nodeIds.forEach((nodeId) => {
            commands.push(new DeleteNodeCommand(this.treeState, nodeId));
        });

        this.commandManager.executeBatch(commands);
    }
}
