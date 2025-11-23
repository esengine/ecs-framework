import { Subject, Observable, Subscription } from 'rxjs';
import { singleton } from 'tsyringe';
import type { IEventBus, Unsubscribe } from '../interfaces/IEventBus';

@singleton()
export class TypedEventBus<TEvents = Record<string, unknown>> implements IEventBus<TEvents> {
    private subjects = new Map<keyof TEvents, Subject<TEvents[keyof TEvents]>>();
    private subscriptions: Subscription[] = [];

    async publish<K extends keyof TEvents>(topic: K, data: TEvents[K]): Promise<void> {
        const subject = this.getSubject(topic);
        subject.next(data);
    }

    subscribe<K extends keyof TEvents>(
        topic: K,
        handler: (data: TEvents[K]) => void | Promise<void>
    ): Unsubscribe {
        const subscription = this.observe(topic).subscribe(async (data) => {
            try {
                await handler(data);
            } catch (error) {
                console.error(`Error in event handler for topic ${String(topic)}:`, error);
            }
        });

        this.subscriptions.push(subscription);

        return () => {
            subscription.unsubscribe();
            const index = this.subscriptions.indexOf(subscription);
            if (index !== -1) {
                this.subscriptions.splice(index, 1);
            }
        };
    }

    observe<K extends keyof TEvents>(topic: K): Observable<TEvents[K]> {
        return this.getSubject(topic).asObservable() as Observable<TEvents[K]>;
    }

    dispose(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.subscriptions = [];
        this.subjects.forEach((subject) => subject.complete());
        this.subjects.clear();
    }

    private getSubject<K extends keyof TEvents>(topic: K): Subject<TEvents[K]> {
        let subject = this.subjects.get(topic) as Subject<TEvents[K]> | undefined;
        if (!subject) {
            subject = new Subject<TEvents[K]>();
            this.subjects.set(topic, subject as unknown as Subject<TEvents[keyof TEvents]>);
        }
        return subject;
    }
}
