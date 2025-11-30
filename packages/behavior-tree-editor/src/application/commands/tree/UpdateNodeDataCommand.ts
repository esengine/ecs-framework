import { BaseCommand } from '@esengine/editor-runtime';
import { ITreeState } from '../ITreeState';

/**
 * 更新节点数据命令
 */
export class UpdateNodeDataCommand extends BaseCommand {
    private oldData: Record<string, unknown>;

    constructor(
        private readonly state: ITreeState,
        private readonly nodeId: string,
        private readonly newData: Record<string, unknown>
    ) {
        super();
        const tree = this.state.getTree();
        const node = tree.getNode(nodeId);
        this.oldData = node.data;
    }

    execute(): void {
        const tree = this.state.getTree();
        const newTree = tree.updateNode(this.nodeId, (node) =>
            node.updateData(this.newData)
        );
        this.state.setTree(newTree);
    }

    undo(): void {
        const tree = this.state.getTree();
        const newTree = tree.updateNode(this.nodeId, (node) =>
            node.updateData(this.oldData)
        );
        this.state.setTree(newTree);
    }

    getDescription(): string {
        return `更新节点数据: ${this.nodeId}`;
    }
}
