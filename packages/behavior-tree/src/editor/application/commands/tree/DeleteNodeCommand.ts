import { Node } from '../../../domain/models/Node';
import { BaseCommand } from '@esengine/editor-runtime';
import { ITreeState } from '../ITreeState';

/**
 * 删除节点命令
 */
export class DeleteNodeCommand extends BaseCommand {
    private deletedNode: Node | null = null;

    constructor(
        private readonly state: ITreeState,
        private readonly nodeId: string
    ) {
        super();
    }

    execute(): void {
        const tree = this.state.getTree();
        this.deletedNode = tree.getNode(this.nodeId);
        const newTree = tree.removeNode(this.nodeId);
        this.state.setTree(newTree);
    }

    undo(): void {
        if (!this.deletedNode) {
            throw new Error('无法撤销：未保存已删除的节点');
        }

        const tree = this.state.getTree();
        const newTree = tree.addNode(this.deletedNode);
        this.state.setTree(newTree);
    }

    getDescription(): string {
        return `删除节点: ${this.deletedNode?.template.displayName ?? this.nodeId}`;
    }
}
