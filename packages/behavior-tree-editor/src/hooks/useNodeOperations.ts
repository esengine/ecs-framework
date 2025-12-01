import { useCallback, useMemo, CommandManager } from '@esengine/editor-runtime';
import type { NodeTemplate } from '@esengine/behavior-tree';
import { Position } from '../domain/value-objects/Position';
import { INodeFactory } from '../domain/interfaces/INodeFactory';
import { TreeStateAdapter } from '../application/state/BehaviorTreeDataStore';
import { CreateNodeUseCase } from '../application/use-cases/CreateNodeUseCase';
import { DeleteNodeUseCase } from '../application/use-cases/DeleteNodeUseCase';
import { MoveNodeUseCase } from '../application/use-cases/MoveNodeUseCase';
import { UpdateNodeDataUseCase } from '../application/use-cases/UpdateNodeDataUseCase';

/**
 * 节点操作 Hook
 */
export function useNodeOperations(
    nodeFactory: INodeFactory,
    commandManager: CommandManager
) {
    const treeState = useMemo(() => TreeStateAdapter.getInstance(), []);

    const createNodeUseCase = useMemo(
        () => new CreateNodeUseCase(nodeFactory, commandManager, treeState),
        [nodeFactory, commandManager, treeState]
    );

    const deleteNodeUseCase = useMemo(
        () => new DeleteNodeUseCase(commandManager, treeState),
        [commandManager, treeState]
    );

    const moveNodeUseCase = useMemo(
        () => new MoveNodeUseCase(commandManager, treeState),
        [commandManager, treeState]
    );

    const updateNodeDataUseCase = useMemo(
        () => new UpdateNodeDataUseCase(commandManager, treeState),
        [commandManager, treeState]
    );

    const createNode = useCallback((
        template: NodeTemplate,
        position: Position,
        data?: Record<string, unknown>
    ) => {
        return createNodeUseCase.execute(template, position, data);
    }, [createNodeUseCase]);

    const createNodeByType = useCallback((
        nodeType: string,
        position: Position,
        data?: Record<string, unknown>
    ) => {
        return createNodeUseCase.executeByType(nodeType, position, data);
    }, [createNodeUseCase]);

    const deleteNode = useCallback((nodeId: string) => {
        deleteNodeUseCase.execute(nodeId);
    }, [deleteNodeUseCase]);

    const deleteNodes = useCallback((nodeIds: string[]) => {
        deleteNodeUseCase.executeBatch(nodeIds);
    }, [deleteNodeUseCase]);

    const moveNode = useCallback((nodeId: string, position: Position) => {
        moveNodeUseCase.execute(nodeId, position);
    }, [moveNodeUseCase]);

    const moveNodes = useCallback((moves: Array<{ nodeId: string; position: Position }>) => {
        moveNodeUseCase.executeBatch(moves);
    }, [moveNodeUseCase]);

    const updateNodeData = useCallback((nodeId: string, data: Record<string, unknown>) => {
        updateNodeDataUseCase.execute(nodeId, data);
    }, [updateNodeDataUseCase]);

    return useMemo(() => ({
        createNode,
        createNodeByType,
        deleteNode,
        deleteNodes,
        moveNode,
        moveNodes,
        updateNodeData
    }), [createNode, createNodeByType, deleteNode, deleteNodes, moveNode, moveNodes, updateNodeData]);
}
