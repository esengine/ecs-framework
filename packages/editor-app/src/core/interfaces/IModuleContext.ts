import type { DependencyContainer } from 'tsyringe';
import type { IEventBus } from './IEventBus';
import type { ICommandRegistry } from './ICommandRegistry';
import type { IPanelRegistry } from './IPanelRegistry';
import type { IFileSystem, IDialog, INotification, InspectorRegistry } from '@esengine/editor-core';

export interface IModuleContext<TEvents = Record<string, unknown>> {
    readonly container: DependencyContainer;
    readonly eventBus: IEventBus<TEvents>;
    readonly commands: ICommandRegistry;
    readonly panels: IPanelRegistry;
    readonly fileSystem: IFileSystem;
    readonly dialog: IDialog;
    readonly notification: INotification;
    readonly inspectorRegistry: InspectorRegistry;
}
