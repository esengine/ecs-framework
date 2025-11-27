import { Node } from '../../../domain/models/Node';
import { BaseCommand } from '@esengine/editor-runtime';
import { ITreeState } from '../ITreeState';

/**
 * 创建节点命令
 */
export class CreateNodeCommand extends BaseCommand {
    private createdNodeId: string;

    constructor(
        private readonly state: ITreeState,
        private readonly node: Node
    ) {
        super();
        this.createdNodeId = node.id;
    }

    execute(): void {
        const tree = this.state.getTree();
        const newTree = tree.addNode(this.node);
        this.state.setTree(newTree);
    }

    undo(): void {
        const tree = this.state.getTree();
        const newTree = tree.removeNode(this.createdNodeId);
        this.state.setTree(newTree);
    }

    getDescription(): string {
        return `创建节点: ${this.node.template.displayName}`;
    }
}
