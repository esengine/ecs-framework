import { Connection } from '../../../domain/models/Connection';
import { BaseCommand } from '@esengine/editor-runtime';
import { ITreeState } from '../ITreeState';

/**
 * 添加连接命令
 */
export class AddConnectionCommand extends BaseCommand {
    constructor(
        private readonly state: ITreeState,
        private readonly connection: Connection
    ) {
        super();
    }

    execute(): void {
        const tree = this.state.getTree();
        const newTree = tree.addConnection(this.connection);
        this.state.setTree(newTree);
    }

    undo(): void {
        const tree = this.state.getTree();
        const newTree = tree.removeConnection(
            this.connection.from,
            this.connection.to,
            this.connection.fromProperty,
            this.connection.toProperty
        );
        this.state.setTree(newTree);
    }

    getDescription(): string {
        return `添加连接: ${this.connection.from} -> ${this.connection.to}`;
    }
}
