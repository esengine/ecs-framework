import { Position } from '../../../domain/value-objects/Position';
import { BaseCommand, ICommand } from '@esengine/editor-runtime';
import { ITreeState } from '../ITreeState';

/**
 * 移动节点命令
 * 支持合并连续的移动操作
 */
export class MoveNodeCommand extends BaseCommand {
    private oldPosition: Position;

    constructor(
        private readonly state: ITreeState,
        private readonly nodeId: string,
        private readonly newPosition: Position
    ) {
        super();
        const tree = this.state.getTree();
        const node = tree.getNode(nodeId);
        this.oldPosition = node.position;
    }

    execute(): void {
        const tree = this.state.getTree();
        const newTree = tree.updateNode(this.nodeId, (node) =>
            node.moveToPosition(this.newPosition)
        );
        this.state.setTree(newTree);
    }

    undo(): void {
        const tree = this.state.getTree();
        const newTree = tree.updateNode(this.nodeId, (node) =>
            node.moveToPosition(this.oldPosition)
        );
        this.state.setTree(newTree);
    }

    getDescription(): string {
        return `移动节点: ${this.nodeId}`;
    }

    /**
     * 移动命令可以合并
     */
    canMergeWith(other: ICommand): boolean {
        if (!(other instanceof MoveNodeCommand)) {
            return false;
        }
        return this.nodeId === other.nodeId;
    }

    /**
     * 合并移动命令
     * 保留初始位置，更新最终位置
     */
    mergeWith(other: ICommand): ICommand {
        if (!(other instanceof MoveNodeCommand)) {
            throw new Error('只能与 MoveNodeCommand 合并');
        }

        if (this.nodeId !== other.nodeId) {
            throw new Error('只能合并同一节点的移动命令');
        }

        const merged = new MoveNodeCommand(
            this.state,
            this.nodeId,
            other.newPosition
        );
        merged.oldPosition = this.oldPosition;
        return merged;
    }
}
