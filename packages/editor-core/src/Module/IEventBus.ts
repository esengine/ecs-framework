import type { Observable } from 'rxjs';

export type Unsubscribe = () => void;

export interface IEventBus<TEvents = Record<string, unknown>> {
    publish<K extends keyof TEvents>(topic: K, data: TEvents[K]): Promise<void>;

    subscribe<K extends keyof TEvents>(
        topic: K,
        handler: (data: TEvents[K]) => void | Promise<void>
    ): Unsubscribe;

    observe<K extends keyof TEvents>(topic: K): Observable<TEvents[K]>;

    dispose(): void;
}
