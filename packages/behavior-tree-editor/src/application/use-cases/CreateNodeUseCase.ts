import type { NodeTemplate } from '@esengine/behavior-tree';
import { Node } from '../../domain/models/Node';
import { Position } from '../../domain/value-objects/Position';
import { INodeFactory } from '../../domain/interfaces/INodeFactory';
import { CommandManager } from '@esengine/editor-runtime';
import { CreateNodeCommand } from '../commands/tree/CreateNodeCommand';
import { ITreeState } from '../commands/ITreeState';

/**
 * 创建节点用例
 */
export class CreateNodeUseCase {
    constructor(
        private readonly nodeFactory: INodeFactory,
        private readonly commandManager: CommandManager,
        private readonly treeState: ITreeState
    ) {}

    /**
     * 执行创建节点操作
     */
    execute(template: NodeTemplate, position: Position, data?: Record<string, unknown>): Node {
        const node = this.nodeFactory.createNode(template, position, data);

        const command = new CreateNodeCommand(this.treeState, node);
        this.commandManager.execute(command);

        return node;
    }

    /**
     * 根据类型创建节点
     */
    executeByType(nodeType: string, position: Position, data?: Record<string, unknown>): Node {
        const node = this.nodeFactory.createNodeByType(nodeType, position, data);

        const command = new CreateNodeCommand(this.treeState, node);
        this.commandManager.execute(command);

        return node;
    }
}
