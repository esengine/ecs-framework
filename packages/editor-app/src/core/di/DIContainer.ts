import 'reflect-metadata';
import { container, DependencyContainer, InjectionToken, Lifecycle } from 'tsyringe';

export class DIContainer {
    private readonly container: DependencyContainer;

    constructor(parent?: DependencyContainer) {
        this.container = parent ? parent.createChildContainer() : container;
    }

    registerSingleton<T>(token: InjectionToken<T>, implementation?: new (...args: unknown[]) => T): void {
        if (implementation) {
            this.container.register(token, { useClass: implementation }, { lifecycle: Lifecycle.Singleton });
        } else {
            this.container.registerSingleton(token as new (...args: unknown[]) => T);
        }
    }

    registerInstance<T>(token: InjectionToken<T>, instance: T): void {
        this.container.registerInstance(token, instance);
    }

    registerTransient<T>(token: InjectionToken<T>, implementation: new (...args: unknown[]) => T): void {
        this.container.register(token, { useClass: implementation }, { lifecycle: Lifecycle.Transient });
    }

    registerFactory<T>(token: InjectionToken<T>, factory: (container: DependencyContainer) => T): void {
        this.container.register(token, { useFactory: factory });
    }

    resolve<T>(token: InjectionToken<T>): T {
        return this.container.resolve(token);
    }

    isRegistered<T>(token: InjectionToken<T>): boolean {
        return this.container.isRegistered(token);
    }

    createChild(): DIContainer {
        return new DIContainer(this.container);
    }

    getNativeContainer(): DependencyContainer {
        return this.container;
    }

    dispose(): void {
        this.container.clearInstances();
    }
}

export const globalContainer = new DIContainer();
