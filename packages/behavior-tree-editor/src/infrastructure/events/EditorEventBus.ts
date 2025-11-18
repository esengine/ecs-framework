import { createLogger } from '@esengine/ecs-framework';

const logger = createLogger('EditorEventBus');

type EventHandler<T = any> = (data: T) => void;

interface Subscription {
    unsubscribe: () => void;
}

export enum EditorEvent {
    NODE_CREATED = 'node:created',
    NODE_DELETED = 'node:deleted',
    NODE_UPDATED = 'node:updated',
    NODE_MOVED = 'node:moved',
    NODE_SELECTED = 'node:selected',

    CONNECTION_ADDED = 'connection:added',
    CONNECTION_REMOVED = 'connection:removed',

    EXECUTION_STARTED = 'execution:started',
    EXECUTION_PAUSED = 'execution:paused',
    EXECUTION_RESUMED = 'execution:resumed',
    EXECUTION_STOPPED = 'execution:stopped',
    EXECUTION_STEPPED = 'execution:stepped',
    EXECUTION_TICK = 'execution:tick',
    EXECUTION_NODE_STATUS_CHANGED = 'execution:node_status_changed',

    TREE_SAVED = 'tree:saved',
    TREE_LOADED = 'tree:loaded',
    TREE_VALIDATED = 'tree:validated',

    BLACKBOARD_VARIABLE_UPDATED = 'blackboard:variable_updated',
    BLACKBOARD_RESTORED = 'blackboard:restored',

    CANVAS_ZOOM_CHANGED = 'canvas:zoom_changed',
    CANVAS_PAN_CHANGED = 'canvas:pan_changed',
    CANVAS_RESET = 'canvas:reset',

    COMMAND_EXECUTED = 'command:executed',
    COMMAND_UNDONE = 'command:undone',
    COMMAND_REDONE = 'command:redone'
}

export class EditorEventBus {
    private listeners: Map<string, Set<EventHandler>> = new Map();
    private eventHistory: Array<{ event: string; data: any; timestamp: number }> = [];
    private maxHistorySize: number = 100;

    on<T = any>(event: EditorEvent | string, handler: EventHandler<T>): Subscription {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)!.add(handler);

        return {
            unsubscribe: () => this.off(event, handler)
        };
    }

    once<T = any>(event: EditorEvent | string, handler: EventHandler<T>): Subscription {
        const wrappedHandler = (data: T) => {
            handler(data);
            this.off(event, wrappedHandler);
        };

        return this.on(event, wrappedHandler);
    }

    off<T = any>(event: EditorEvent | string, handler: EventHandler<T>): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    emit<T = any>(event: EditorEvent | string, data?: T): void {
        if (this.eventHistory.length >= this.maxHistorySize) {
            this.eventHistory.shift();
        }
        this.eventHistory.push({
            event,
            data,
            timestamp: Date.now()
        });

        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(data);
                } catch (error) {
                    logger.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    clear(event?: EditorEvent | string): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    getListenerCount(event: EditorEvent | string): number {
        return this.listeners.get(event)?.size || 0;
    }

    getAllEvents(): string[] {
        return Array.from(this.listeners.keys());
    }

    getEventHistory(count?: number): Array<{ event: string; data: any; timestamp: number }> {
        if (count) {
            return this.eventHistory.slice(-count);
        }
        return [...this.eventHistory];
    }

    clearHistory(): void {
        this.eventHistory = [];
    }
}

let globalEventBus: EditorEventBus | null = null;

export function getGlobalEventBus(): EditorEventBus {
    if (!globalEventBus) {
        globalEventBus = new EditorEventBus();
    }
    return globalEventBus;
}

export function resetGlobalEventBus(): void {
    globalEventBus = null;
}
