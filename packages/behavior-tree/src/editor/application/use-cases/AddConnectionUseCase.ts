import { Connection, ConnectionType } from '../../domain/models/Connection';
import { CommandManager } from '@esengine/editor-runtime';
import { AddConnectionCommand } from '../commands/tree/AddConnectionCommand';
import { ITreeState } from '../commands/ITreeState';
import { IValidator } from '../../domain/interfaces/IValidator';

/**
 * 添加连接用例
 */
export class AddConnectionUseCase {
    constructor(
        private readonly commandManager: CommandManager,
        private readonly treeState: ITreeState,
        private readonly validator: IValidator
    ) {}

    /**
     * 执行添加连接操作
     */
    execute(
        from: string,
        to: string,
        connectionType: ConnectionType = 'node',
        fromProperty?: string,
        toProperty?: string
    ): Connection {
        const connection = new Connection(from, to, connectionType, fromProperty, toProperty);

        const tree = this.treeState.getTree();
        const validationResult = this.validator.validateConnection(connection, tree);

        if (!validationResult.isValid) {
            const errorMessages = validationResult.errors.map((e) => e.message).join(', ');
            throw new Error(`连接验证失败: ${errorMessages}`);
        }

        const command = new AddConnectionCommand(this.treeState, connection);
        this.commandManager.execute(command);

        return connection;
    }
}
