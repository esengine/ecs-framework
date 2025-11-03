import { BehaviorTreeExecutor, ExecutionStatus, ExecutionLog } from '../../utils/BehaviorTreeExecutor';
import { BehaviorTreeNode, Connection } from '../../stores/behaviorTreeStore';
import { BlackboardValue } from '../../domain/models/Blackboard';
import { DOMCache } from '../../presentation/utils/DOMCache';
import { EditorEventBus, EditorEvent } from '../../infrastructure/events/EditorEventBus';
import { ExecutionHooksManager } from '../interfaces/IExecutionHooks';

export type ExecutionMode = 'idle' | 'running' | 'paused' | 'step';
type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';
type BlackboardVariables = Record<string, BlackboardValue>;

interface ExecutionControllerConfig {
    rootNodeId: string;
    projectPath: string | null;
    onLogsUpdate: (logs: ExecutionLog[]) => void;
    onBlackboardUpdate: (variables: BlackboardVariables) => void;
    onTickCountUpdate: (count: number) => void;
    eventBus?: EditorEventBus;
    hooksManager?: ExecutionHooksManager;
}

export class ExecutionController {
    private executor: BehaviorTreeExecutor | null = null;
    private mode: ExecutionMode = 'idle';
    private animationFrameId: number | null = null;
    private lastTickTime: number = 0;
    private speed: number = 1.0;
    private tickCount: number = 0;

    private domCache: DOMCache = new DOMCache();
    private eventBus?: EditorEventBus;
    private hooksManager?: ExecutionHooksManager;

    private config: ExecutionControllerConfig;
    private currentNodes: BehaviorTreeNode[] = [];
    private currentConnections: Connection[] = [];
    private currentBlackboard: BlackboardVariables = {};

    constructor(config: ExecutionControllerConfig) {
        this.config = config;
        this.executor = new BehaviorTreeExecutor();
        this.eventBus = config.eventBus;
        this.hooksManager = config.hooksManager;
    }

    getMode(): ExecutionMode {
        return this.mode;
    }

    getTickCount(): number {
        return this.tickCount;
    }

    getSpeed(): number {
        return this.speed;
    }

    setSpeed(speed: number): void {
        this.speed = speed;
    }

    async play(
        nodes: BehaviorTreeNode[],
        blackboardVariables: BlackboardVariables,
        connections: Connection[]
    ): Promise<void> {
        if (this.mode === 'running') return;

        this.currentNodes = nodes;
        this.currentConnections = connections;
        this.currentBlackboard = blackboardVariables;

        const context = {
            nodes,
            connections,
            blackboardVariables,
            rootNodeId: this.config.rootNodeId,
            tickCount: 0
        };

        try {
            await this.hooksManager?.triggerBeforePlay(context);

            this.mode = 'running';
            this.tickCount = 0;
            this.lastTickTime = 0;

            if (!this.executor) {
                this.executor = new BehaviorTreeExecutor();
            }

            this.executor.buildTree(
                nodes,
                this.config.rootNodeId,
                blackboardVariables,
                connections,
                this.handleExecutionStatusUpdate.bind(this)
            );

            this.executor.start();
            this.animationFrameId = requestAnimationFrame(this.tickLoop.bind(this));

            this.eventBus?.emit(EditorEvent.EXECUTION_STARTED, context);
            await this.hooksManager?.triggerAfterPlay(context);
        } catch (error) {
            console.error('Error in play:', error);
            await this.hooksManager?.triggerOnError(error as Error, 'play');
            throw error;
        }
    }

    async pause(): Promise<void> {
        try {
            if (this.mode === 'running') {
                await this.hooksManager?.triggerBeforePause();

                this.mode = 'paused';

                if (this.executor) {
                    this.executor.pause();
                }

                if (this.animationFrameId !== null) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }

                this.eventBus?.emit(EditorEvent.EXECUTION_PAUSED);
                await this.hooksManager?.triggerAfterPause();
            } else if (this.mode === 'paused') {
                await this.hooksManager?.triggerBeforeResume();

                this.mode = 'running';
                this.lastTickTime = 0;

                if (this.executor) {
                    this.executor.resume();
                }

                this.animationFrameId = requestAnimationFrame(this.tickLoop.bind(this));

                this.eventBus?.emit(EditorEvent.EXECUTION_RESUMED);
                await this.hooksManager?.triggerAfterResume();
            }
        } catch (error) {
            console.error('Error in pause/resume:', error);
            await this.hooksManager?.triggerOnError(error as Error, 'pause');
            throw error;
        }
    }

    async stop(): Promise<void> {
        try {
            await this.hooksManager?.triggerBeforeStop();

            this.mode = 'idle';
            this.tickCount = 0;
            this.lastTickTime = 0;

            this.domCache.clearAllStatusTimers();
            this.domCache.clearStatusCache();

            this.domCache.forEachNode((node) => {
                node.classList.remove('running', 'success', 'failure', 'executed');
            });

            this.domCache.forEachConnection((path) => {
                const connectionType = path.getAttribute('data-connection-type');
                if (connectionType === 'property') {
                    path.setAttribute('stroke', '#9c27b0');
                } else {
                    path.setAttribute('stroke', '#0e639c');
                }
                path.setAttribute('stroke-width', '2');
            });

            if (this.animationFrameId !== null) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            if (this.executor) {
                this.executor.stop();
            }

            this.eventBus?.emit(EditorEvent.EXECUTION_STOPPED);
            await this.hooksManager?.triggerAfterStop();
        } catch (error) {
            console.error('Error in stop:', error);
            await this.hooksManager?.triggerOnError(error as Error, 'stop');
            throw error;
        }
    }

    async reset(): Promise<void> {
        await this.stop();

        if (this.executor) {
            this.executor.cleanup();
        }
    }

    step(): void {
        // 单步执行功能预留
    }

    updateBlackboardVariable(key: string, value: BlackboardValue): void {
        if (this.executor && this.mode !== 'idle') {
            this.executor.updateBlackboardVariable(key, value);
        }
    }

    getBlackboardVariables(): BlackboardVariables {
        if (this.executor) {
            return this.executor.getBlackboardVariables();
        }
        return {};
    }

    clearDOMCache(): void {
        this.domCache.clearAll();
    }

    destroy(): void {
        this.stop();

        if (this.executor) {
            this.executor.destroy();
            this.executor = null;
        }
    }

    private tickLoop(currentTime: number): void {
        if (this.mode !== 'running') {
            return;
        }

        if (!this.executor) {
            return;
        }

        const baseTickInterval = 16.67;
        const tickInterval = baseTickInterval / this.speed;

        if (this.lastTickTime === 0 || (currentTime - this.lastTickTime) >= tickInterval) {
            const deltaTime = 0.016;

            this.executor.tick(deltaTime);

            this.tickCount = this.executor.getTickCount();
            this.config.onTickCountUpdate(this.tickCount);

            this.lastTickTime = currentTime;
        }

        this.animationFrameId = requestAnimationFrame(this.tickLoop.bind(this));
    }

    private handleExecutionStatusUpdate(
        statuses: ExecutionStatus[],
        logs: ExecutionLog[],
        runtimeBlackboardVars?: BlackboardVariables
    ): void {
        this.config.onLogsUpdate([...logs]);

        if (runtimeBlackboardVars) {
            this.config.onBlackboardUpdate(runtimeBlackboardVars);
        }

        const statusMap: Record<string, NodeExecutionStatus> = {};

        statuses.forEach((s) => {
            statusMap[s.nodeId] = s.status;

            if (!this.domCache.hasStatusChanged(s.nodeId, s.status)) {
                return;
            }
            this.domCache.setLastStatus(s.nodeId, s.status);

            const nodeElement = this.domCache.getNode(s.nodeId);
            if (!nodeElement) {
                return;
            }

            this.domCache.removeNodeClasses(s.nodeId, 'running', 'success', 'failure', 'executed');

            if (s.status === 'running') {
                this.domCache.addNodeClasses(s.nodeId, 'running');
            } else if (s.status === 'success') {
                this.domCache.addNodeClasses(s.nodeId, 'success');

                this.domCache.clearStatusTimer(s.nodeId);

                const timer = window.setTimeout(() => {
                    this.domCache.removeNodeClasses(s.nodeId, 'success');
                    this.domCache.addNodeClasses(s.nodeId, 'executed');
                    this.domCache.clearStatusTimer(s.nodeId);
                }, 2000);

                this.domCache.setStatusTimer(s.nodeId, timer);
            } else if (s.status === 'failure') {
                this.domCache.addNodeClasses(s.nodeId, 'failure');

                this.domCache.clearStatusTimer(s.nodeId);

                const timer = window.setTimeout(() => {
                    this.domCache.removeNodeClasses(s.nodeId, 'failure');
                    this.domCache.clearStatusTimer(s.nodeId);
                }, 2000);

                this.domCache.setStatusTimer(s.nodeId, timer);
            }
        });

        this.updateConnectionStyles(statusMap);
    }

    private updateConnectionStyles(
        statusMap: Record<string, NodeExecutionStatus>,
        connections?: Connection[]
    ): void {
        if (!connections) return;

        connections.forEach((conn) => {
            const connKey = `${conn.from}-${conn.to}`;

            const pathElement = this.domCache.getConnection(connKey);
            if (!pathElement) {
                return;
            }

            const fromStatus = statusMap[conn.from];
            const toStatus = statusMap[conn.to];
            const isActive = fromStatus === 'running' || toStatus === 'running';

            if (conn.connectionType === 'property') {
                this.domCache.setConnectionAttribute(connKey, 'stroke', '#9c27b0');
                this.domCache.setConnectionAttribute(connKey, 'stroke-width', '2');
            } else if (isActive) {
                this.domCache.setConnectionAttribute(connKey, 'stroke', '#ffa726');
                this.domCache.setConnectionAttribute(connKey, 'stroke-width', '3');
            } else {
                const isExecuted = this.domCache.hasNodeClass(conn.from, 'executed') &&
                                 this.domCache.hasNodeClass(conn.to, 'executed');

                if (isExecuted) {
                    this.domCache.setConnectionAttribute(connKey, 'stroke', '#4caf50');
                    this.domCache.setConnectionAttribute(connKey, 'stroke-width', '2.5');
                } else {
                    this.domCache.setConnectionAttribute(connKey, 'stroke', '#0e639c');
                    this.domCache.setConnectionAttribute(connKey, 'stroke-width', '2');
                }
            }
        });
    }

    setConnections(connections: Connection[]): void {
        if (this.mode !== 'idle') {
            const currentStatuses: Record<string, NodeExecutionStatus> = {};
            connections.forEach((conn) => {
                const fromStatus = this.domCache.getLastStatus(conn.from);
                const toStatus = this.domCache.getLastStatus(conn.to);
                if (fromStatus) currentStatuses[conn.from] = fromStatus;
                if (toStatus) currentStatuses[conn.to] = toStatus;
            });
            this.updateConnectionStyles(currentStatuses, connections);
        }
    }
}
