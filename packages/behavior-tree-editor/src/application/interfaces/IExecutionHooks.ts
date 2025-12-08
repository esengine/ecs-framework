import { Node as BehaviorTreeNode } from '../../domain/models/Node';
import { Connection } from '../../domain/models/Connection';
import { ExecutionLog } from '../../utils/BehaviorTreeExecutor';
import { BlackboardValue } from '../../domain/models/Blackboard';
import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('ExecutionHooks');

type BlackboardVariables = Record<string, BlackboardValue>;
type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';

export interface ExecutionContext {
    nodes: BehaviorTreeNode[];
    connections: Connection[];
    blackboardVariables: BlackboardVariables;
    rootNodeId: string;
    tickCount: number;
}

export interface NodeStatusChangeEvent {
    nodeId: string;
    status: NodeExecutionStatus;
    previousStatus?: NodeExecutionStatus;
    timestamp: number;
}

export interface IExecutionHooks {
    beforePlay?(context: ExecutionContext): void | Promise<void>;

    afterPlay?(context: ExecutionContext): void | Promise<void>;

    beforePause?(): void | Promise<void>;

    afterPause?(): void | Promise<void>;

    beforeResume?(): void | Promise<void>;

    afterResume?(): void | Promise<void>;

    beforeStop?(): void | Promise<void>;

    afterStop?(): void | Promise<void>;

    beforeStep?(deltaTime: number): void | Promise<void>;

    afterStep?(deltaTime: number): void | Promise<void>;

    onTick?(tickCount: number, deltaTime: number): void | Promise<void>;

    onNodeStatusChange?(event: NodeStatusChangeEvent): void | Promise<void>;

    onExecutionComplete?(logs: ExecutionLog[]): void | Promise<void>;

    onBlackboardUpdate?(variables: BlackboardVariables): void | Promise<void>;

    onError?(error: Error, context?: string): void | Promise<void>;
}

export class ExecutionHooksManager {
    private hooks: Set<IExecutionHooks> = new Set();

    register(hook: IExecutionHooks): void {
        this.hooks.add(hook);
    }

    unregister(hook: IExecutionHooks): void {
        this.hooks.delete(hook);
    }

    clear(): void {
        this.hooks.clear();
    }

    async triggerBeforePlay(context: ExecutionContext): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.beforePlay) {
                try {
                    await hook.beforePlay(context);
                } catch (error) {
                    logger.error('Error in beforePlay hook:', error);
                }
            }
        }
    }

    async triggerAfterPlay(context: ExecutionContext): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.afterPlay) {
                try {
                    await hook.afterPlay(context);
                } catch (error) {
                    logger.error('Error in afterPlay hook:', error);
                }
            }
        }
    }

    async triggerBeforePause(): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.beforePause) {
                try {
                    await hook.beforePause();
                } catch (error) {
                    logger.error('Error in beforePause hook:', error);
                }
            }
        }
    }

    async triggerAfterPause(): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.afterPause) {
                try {
                    await hook.afterPause();
                } catch (error) {
                    logger.error('Error in afterPause hook:', error);
                }
            }
        }
    }

    async triggerBeforeResume(): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.beforeResume) {
                try {
                    await hook.beforeResume();
                } catch (error) {
                    logger.error('Error in beforeResume hook:', error);
                }
            }
        }
    }

    async triggerAfterResume(): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.afterResume) {
                try {
                    await hook.afterResume();
                } catch (error) {
                    logger.error('Error in afterResume hook:', error);
                }
            }
        }
    }

    async triggerBeforeStop(): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.beforeStop) {
                try {
                    await hook.beforeStop();
                } catch (error) {
                    logger.error('Error in beforeStop hook:', error);
                }
            }
        }
    }

    async triggerAfterStop(): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.afterStop) {
                try {
                    await hook.afterStop();
                } catch (error) {
                    logger.error('Error in afterStop hook:', error);
                }
            }
        }
    }

    async triggerBeforeStep(deltaTime: number): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.beforeStep) {
                try {
                    await hook.beforeStep(deltaTime);
                } catch (error) {
                    logger.error('Error in beforeStep hook:', error);
                }
            }
        }
    }

    async triggerAfterStep(deltaTime: number): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.afterStep) {
                try {
                    await hook.afterStep(deltaTime);
                } catch (error) {
                    logger.error('Error in afterStep hook:', error);
                }
            }
        }
    }

    async triggerOnTick(tickCount: number, deltaTime: number): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.onTick) {
                try {
                    await hook.onTick(tickCount, deltaTime);
                } catch (error) {
                    logger.error('Error in onTick hook:', error);
                }
            }
        }
    }

    async triggerOnNodeStatusChange(event: NodeStatusChangeEvent): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.onNodeStatusChange) {
                try {
                    await hook.onNodeStatusChange(event);
                } catch (error) {
                    logger.error('Error in onNodeStatusChange hook:', error);
                }
            }
        }
    }

    async triggerOnExecutionComplete(logs: ExecutionLog[]): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.onExecutionComplete) {
                try {
                    await hook.onExecutionComplete(logs);
                } catch (error) {
                    logger.error('Error in onExecutionComplete hook:', error);
                }
            }
        }
    }

    async triggerOnBlackboardUpdate(variables: BlackboardVariables): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.onBlackboardUpdate) {
                try {
                    await hook.onBlackboardUpdate(variables);
                } catch (error) {
                    logger.error('Error in onBlackboardUpdate hook:', error);
                }
            }
        }
    }

    async triggerOnError(error: Error, context?: string): Promise<void> {
        for (const hook of this.hooks) {
            if (hook.onError) {
                try {
                    await hook.onError(error, context);
                } catch (err) {
                    logger.error('Error in onError hook:', err);
                }
            }
        }
    }
}
