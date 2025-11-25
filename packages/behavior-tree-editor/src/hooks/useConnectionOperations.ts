import { useCallback, useMemo, CommandManager, createLogger } from '@esengine/editor-runtime';
import { ConnectionType } from '../domain/models/Connection';
import { IValidator } from '../domain/interfaces/IValidator';
import { TreeStateAdapter } from '../application/state/BehaviorTreeDataStore';
import { AddConnectionUseCase } from '../application/use-cases/AddConnectionUseCase';
import { RemoveConnectionUseCase } from '../application/use-cases/RemoveConnectionUseCase';

const logger = createLogger('useConnectionOperations');

/**
 * 连接操作 Hook
 */
export function useConnectionOperations(
    validator: IValidator,
    commandManager: CommandManager
) {
    const treeState = useMemo(() => TreeStateAdapter.getInstance(), []);

    const addConnectionUseCase = useMemo(
        () => new AddConnectionUseCase(commandManager, treeState, validator),
        [commandManager, treeState, validator]
    );

    const removeConnectionUseCase = useMemo(
        () => new RemoveConnectionUseCase(commandManager, treeState),
        [commandManager, treeState]
    );

    const addConnection = useCallback((
        from: string,
        to: string,
        connectionType: ConnectionType = 'node',
        fromProperty?: string,
        toProperty?: string
    ) => {
        try {
            return addConnectionUseCase.execute(from, to, connectionType, fromProperty, toProperty);
        } catch (error) {
            logger.error('添加连接失败:', error);
            throw error;
        }
    }, [addConnectionUseCase]);

    const removeConnection = useCallback((
        from: string,
        to: string,
        fromProperty?: string,
        toProperty?: string
    ) => {
        try {
            removeConnectionUseCase.execute(from, to, fromProperty, toProperty);
        } catch (error) {
            logger.error('移除连接失败:', error);
            throw error;
        }
    }, [removeConnectionUseCase]);

    return useMemo(() => ({
        addConnection,
        removeConnection
    }), [addConnection, removeConnection]);
}
