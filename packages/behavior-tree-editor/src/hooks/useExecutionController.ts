import { useState, useEffect, useMemo, useRef, createLogger } from '@esengine/editor-runtime';
import { ExecutionController, ExecutionMode } from '../application/services/ExecutionController';
import { BlackboardManager } from '../application/services/BlackboardManager';
import { BehaviorTreeNode, Connection, useBehaviorTreeDataStore } from '../stores';
import { ExecutionLog } from '../utils/BehaviorTreeExecutor';
import { BlackboardValue } from '../domain/models/Blackboard';

const logger = createLogger('useExecutionController');

type BlackboardVariables = Record<string, BlackboardValue>;

interface UseExecutionControllerParams {
    rootNodeId: string;
    projectPath: string | null;
    blackboardVariables: BlackboardVariables;
    nodes: BehaviorTreeNode[];
    connections: Connection[];
    initialBlackboardVariables: BlackboardVariables;
    onBlackboardUpdate: (variables: BlackboardVariables) => void;
    onInitialBlackboardSave: (variables: BlackboardVariables) => void;
    onExecutingChange: (isExecuting: boolean) => void;
    onSaveNodesDataSnapshot: () => void;
    onRestoreNodesData: () => void;
    sortChildrenByPosition: () => void;
}

export function useExecutionController(params: UseExecutionControllerParams) {
    const {
        rootNodeId,
        projectPath,
        blackboardVariables,
        nodes,
        connections,
        onBlackboardUpdate,
        onInitialBlackboardSave,
        onExecutingChange,
        onSaveNodesDataSnapshot,
        onRestoreNodesData,
        sortChildrenByPosition
    } = params;

    const [executionMode, setExecutionMode] = useState<ExecutionMode>('idle');
    const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
    const [executionSpeed, setExecutionSpeed] = useState<number>(1.0);
    const [tickCount, setTickCount] = useState(0);

    const controller = useMemo(() => {
        return new ExecutionController({
            rootNodeId,
            projectPath,
            onLogsUpdate: setExecutionLogs,
            onBlackboardUpdate,
            onTickCountUpdate: setTickCount,
            onExecutionStatusUpdate: (statuses, orders) => {
                const store = useBehaviorTreeDataStore.getState();
                store.updateNodeExecutionStatuses(statuses, orders);
            }
            // 不在这里传递 onBreakpointHit，避免频繁重建
        });
    }, [rootNodeId, projectPath, onBlackboardUpdate]);

    const blackboardManager = useMemo(() => new BlackboardManager(), []);

    useEffect(() => {
        // 保存当前 controller 的引用，确保清理时使用正确的实例
        const currentController = controller;
        return () => {
            currentController.destroy();
        };
    }, [controller]);

    useEffect(() => {
        controller.setConnections(connections);
    }, [connections, controller]);

    useEffect(() => {
        if (executionMode === 'idle') return;

        const executorVars = controller.getBlackboardVariables();

        Object.entries(blackboardVariables).forEach(([key, value]) => {
            if (executorVars[key] !== value) {
                controller.updateBlackboardVariable(key, value);
            }
        });
    }, [blackboardVariables, executionMode, controller]);

    useEffect(() => {
        if (executionMode === 'idle') return;

        controller.updateNodes(nodes);
    }, [nodes, executionMode, controller]);

    const handlePlay = async () => {
        try {
            sortChildrenByPosition();
            logger.info('[Execute] Sorted children by position before execution');

            blackboardManager.setInitialVariables(blackboardVariables);
            blackboardManager.setCurrentVariables(blackboardVariables);
            onInitialBlackboardSave(blackboardManager.getInitialVariables());
            onSaveNodesDataSnapshot();
            onExecutingChange(true);

            setExecutionMode('running');
            await controller.play(nodes, blackboardVariables, connections);
        } catch (error) {
            logger.error('Failed to start execution:', error);
            setExecutionMode('idle');
            onExecutingChange(false);
        }
    };

    const handlePause = async () => {
        try {
            await controller.pause();
            const newMode = controller.getMode();
            setExecutionMode(newMode);
        } catch (error) {
            logger.error('Failed to pause/resume execution:', error);
        }
    };

    const handleStop = async () => {
        try {
            await controller.stop();
            setExecutionMode('idle');
            setTickCount(0);

            const restoredVars = blackboardManager.restoreInitialVariables();
            onBlackboardUpdate(restoredVars);
            onRestoreNodesData();
            useBehaviorTreeDataStore.getState().clearNodeExecutionStatuses();
            onExecutingChange(false);
        } catch (error) {
            logger.error('Failed to stop execution:', error);
        }
    };

    const handleStep = () => {
        controller.step();
        // 单步执行后保持idle状态，不需要专门的step状态
    };

    const handleReset = async () => {
        try {
            await controller.reset();
            setExecutionMode('idle');
            setTickCount(0);
        } catch (error) {
            logger.error('Failed to reset execution:', error);
        }
    };

    const handleSpeedChange = (speed: number) => {
        setExecutionSpeed(speed);
        controller.setSpeed(speed);
    };

    return {
        executionMode,
        executionLogs,
        executionSpeed,
        tickCount,
        handlePlay,
        handlePause,
        handleStop,
        handleStep,
        handleReset,
        handleSpeedChange,
        setExecutionLogs,
        controller,
        blackboardManager
    };
}
