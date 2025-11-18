import { BehaviorTreeExecutor, ExecutionStatus, ExecutionLog } from '../../utils/BehaviorTreeExecutor';
import { BehaviorTreeNode, Connection } from '../../stores';
import type { NodeExecutionStatus } from '../../stores';
import { BlackboardValue } from '../../domain/models/Blackboard';
import { DOMCache } from '../../utils/DOMCache';
import { EditorEventBus, EditorEvent } from '../../infrastructure/events/EditorEventBus';
import { ExecutionHooksManager } from '../interfaces/IExecutionHooks';
import type { Breakpoint } from '../../types/Breakpoint';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('ExecutionController');

export type ExecutionMode = 'idle' | 'running' | 'paused';
type BlackboardVariables = Record<string, BlackboardValue>;

interface ExecutionControllerConfig {
    rootNodeId: string;
    projectPath: string | null;
    onLogsUpdate: (logs: ExecutionLog[]) => void;
    onBlackboardUpdate: (variables: BlackboardVariables) => void;
    onTickCountUpdate: (count: number) => void;
    onExecutionStatusUpdate: (statuses: Map<string, NodeExecutionStatus>, orders: Map<string, number>) => void;
    onBreakpointHit?: (nodeId: string, nodeName: string) => void;
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

    private stepByStepMode: boolean = true;
    private pendingStatusUpdates: ExecutionStatus[] = [];
    private currentlyDisplayedIndex: number = 0;
    private lastStepTime: number = 0;
    private stepInterval: number = 200;

    // 存储断点回调的引用
    private breakpointCallback: ((nodeId: string, nodeName: string) => void) | null = null;

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
        this.lastTickTime = 0;
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

            // 设置断点触发回调（使用存储的回调）
            if (this.breakpointCallback) {
                this.executor.setBreakpointCallback(this.breakpointCallback);
            }

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
            this.lastStepTime = 0;
            this.pendingStatusUpdates = [];
            this.currentlyDisplayedIndex = 0;

            this.domCache.clearAllStatusTimers();
            this.domCache.clearStatusCache();

            this.config.onExecutionStatusUpdate(new Map(), new Map());

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

    async step(): Promise<void> {
        if (this.mode === 'running') {
            await this.pause();
        }

        if (this.mode === 'idle') {
            if (!this.currentNodes.length) {
                logger.warn('No tree loaded for step execution');
                return;
            }

            if (!this.executor) {
                this.executor = new BehaviorTreeExecutor();
            }

            this.executor.buildTree(
                this.currentNodes,
                this.config.rootNodeId,
                this.currentBlackboard,
                this.currentConnections,
                this.handleExecutionStatusUpdate.bind(this)
            );

            if (this.breakpointCallback) {
                this.executor.setBreakpointCallback(this.breakpointCallback);
            }

            this.executor.start();
        }

        try {
            await this.hooksManager?.triggerBeforeStep?.(0);

            if (this.stepByStepMode && this.pendingStatusUpdates.length > 0) {
                if (this.currentlyDisplayedIndex < this.pendingStatusUpdates.length) {
                    this.displayNextNode();
                } else {
                    this.executeSingleTick();
                }
            } else {
                this.executeSingleTick();
            }

            this.eventBus?.emit(EditorEvent.EXECUTION_STEPPED, { tickCount: this.tickCount });
            await this.hooksManager?.triggerAfterStep?.(0);
        } catch (error) {
            console.error('Error in step:', error);
            await this.hooksManager?.triggerOnError(error as Error, 'step');
        }

        this.mode = 'paused';
    }

    private executeSingleTick(): void {
        if (!this.executor) return;

        const deltaTime = 16.67 / 1000;
        this.executor.tick(deltaTime);

        this.tickCount = this.executor.getTickCount();
        this.config.onTickCountUpdate(this.tickCount);
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

    updateNodes(nodes: BehaviorTreeNode[]): void {
        if (this.mode === 'idle' || !this.executor) {
            return;
        }

        this.currentNodes = nodes;

        this.executor.buildTree(
            nodes,
            this.config.rootNodeId,
            this.currentBlackboard,
            this.currentConnections,
            this.handleExecutionStatusUpdate.bind(this)
        );

        // 设置断点触发回调（使用存储的回调）
        if (this.breakpointCallback) {
            this.executor.setBreakpointCallback(this.breakpointCallback);
        }

        this.executor.start();
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

        if (this.stepByStepMode) {
            this.handleStepByStepExecution(currentTime);
        } else {
            this.handleNormalExecution(currentTime);
        }

        this.animationFrameId = requestAnimationFrame(this.tickLoop.bind(this));
    }

    private handleNormalExecution(currentTime: number): void {
        const baseTickInterval = 16.67;
        const scaledTickInterval = baseTickInterval / this.speed;

        if (this.lastTickTime === 0) {
            this.lastTickTime = currentTime;
        }

        const elapsed = currentTime - this.lastTickTime;

        if (elapsed >= scaledTickInterval) {
            const deltaTime = baseTickInterval / 1000;

            this.executor!.tick(deltaTime);

            this.tickCount = this.executor!.getTickCount();
            this.config.onTickCountUpdate(this.tickCount);

            this.lastTickTime = currentTime;
        }
    }

    private handleStepByStepExecution(currentTime: number): void {
        if (this.lastStepTime === 0) {
            this.lastStepTime = currentTime;
        }

        const stepElapsed = currentTime - this.lastStepTime;
        const actualStepInterval = this.stepInterval / this.speed;

        if (stepElapsed >= actualStepInterval) {
            if (this.currentlyDisplayedIndex < this.pendingStatusUpdates.length) {
                this.displayNextNode();
                this.lastStepTime = currentTime;
            } else {
                if (this.lastTickTime === 0) {
                    this.lastTickTime = currentTime;
                }

                const tickElapsed = currentTime - this.lastTickTime;
                const baseTickInterval = 16.67;
                const scaledTickInterval = baseTickInterval / this.speed;

                if (tickElapsed >= scaledTickInterval) {
                    const deltaTime = baseTickInterval / 1000;
                    this.executor!.tick(deltaTime);
                    this.tickCount = this.executor!.getTickCount();
                    this.config.onTickCountUpdate(this.tickCount);
                    this.lastTickTime = currentTime;
                }
            }
        }
    }

    private displayNextNode(): void {
        if (this.currentlyDisplayedIndex >= this.pendingStatusUpdates.length) {
            return;
        }

        const statusesToDisplay = this.pendingStatusUpdates.slice(0, this.currentlyDisplayedIndex + 1);
        const currentNode = this.pendingStatusUpdates[this.currentlyDisplayedIndex];

        if (!currentNode) {
            return;
        }

        const statusMap = new Map<string, NodeExecutionStatus>();
        const orderMap = new Map<string, number>();

        statusesToDisplay.forEach((s) => {
            statusMap.set(s.nodeId, s.status);
            if (s.executionOrder !== undefined) {
                orderMap.set(s.nodeId, s.executionOrder);
            }
        });

        const nodeName = this.currentNodes.find((n) => n.id === currentNode.nodeId)?.template.displayName || 'Unknown';
        logger.info(`[StepByStep] Displaying ${this.currentlyDisplayedIndex + 1}/${this.pendingStatusUpdates.length} | ${nodeName} | Order: ${currentNode.executionOrder} | ID: ${currentNode.nodeId}`);
        this.config.onExecutionStatusUpdate(statusMap, orderMap);

        this.currentlyDisplayedIndex++;
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

        if (this.stepByStepMode) {
            const statusesWithOrder = statuses.filter((s) => s.executionOrder !== undefined);

            if (statusesWithOrder.length > 0) {
                const minOrder = Math.min(...statusesWithOrder.map((s) => s.executionOrder!));

                if (minOrder === 1 || this.pendingStatusUpdates.length === 0) {
                    this.pendingStatusUpdates = statusesWithOrder.sort((a, b) =>
                        (a.executionOrder || 0) - (b.executionOrder || 0)
                    );
                    this.currentlyDisplayedIndex = 0;
                    this.lastStepTime = 0;
                } else {
                    const maxExistingOrder = this.pendingStatusUpdates.length > 0
                        ? Math.max(...this.pendingStatusUpdates.map((s) => s.executionOrder || 0))
                        : 0;

                    const newStatuses = statusesWithOrder.filter((s) =>
                        (s.executionOrder || 0) > maxExistingOrder
                    );

                    if (newStatuses.length > 0) {
                        logger.info(`[StepByStep] Appending ${newStatuses.length} new nodes, orders:`, newStatuses.map((s) => s.executionOrder));
                        this.pendingStatusUpdates = [
                            ...this.pendingStatusUpdates,
                            ...newStatuses
                        ].sort((a, b) => (a.executionOrder || 0) - (b.executionOrder || 0));
                    }
                }
            }
        } else {
            const statusMap = new Map<string, NodeExecutionStatus>();
            const orderMap = new Map<string, number>();

            statuses.forEach((s) => {
                statusMap.set(s.nodeId, s.status);
                if (s.executionOrder !== undefined) {
                    orderMap.set(s.nodeId, s.executionOrder);
                }
            });

            this.config.onExecutionStatusUpdate(statusMap, orderMap);
        }
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

    setBreakpoints(breakpoints: Map<string, Breakpoint>): void {
        if (this.executor) {
            this.executor.setBreakpoints(breakpoints);
        }
    }

    /**
     * 设置断点触发回调
     */
    setBreakpointCallback(callback: (nodeId: string, nodeName: string) => void): void {
        this.breakpointCallback = callback;
        // 如果 executor 已存在，立即设置
        if (this.executor) {
            this.executor.setBreakpointCallback(callback);
        }
    }
}
