import { Connection } from '../../../domain/models/Connection';
import { BaseCommand } from '@esengine/editor-runtime';
import { ITreeState } from '../ITreeState';

/**
 * 移除连接命令
 */
export class RemoveConnectionCommand extends BaseCommand {
    private removedConnection: Connection | null = null;

    constructor(
        private readonly state: ITreeState,
        private readonly from: string,
        private readonly to: string,
        private readonly fromProperty?: string,
        private readonly toProperty?: string
    ) {
        super();
    }

    execute(): void {
        const tree = this.state.getTree();

        const connection = tree.connections.find((c) =>
            c.matches(this.from, this.to, this.fromProperty, this.toProperty)
        );

        if (!connection) {
            throw new Error(`连接不存在: ${this.from} -> ${this.to}`);
        }

        this.removedConnection = connection;
        const newTree = tree.removeConnection(this.from, this.to, this.fromProperty, this.toProperty);
        this.state.setTree(newTree);
    }

    undo(): void {
        if (!this.removedConnection) {
            throw new Error('无法撤销：未保存已删除的连接');
        }

        const tree = this.state.getTree();
        const newTree = tree.addConnection(this.removedConnection);
        this.state.setTree(newTree);
    }

    getDescription(): string {
        return `移除连接: ${this.from} -> ${this.to}`;
    }
}
