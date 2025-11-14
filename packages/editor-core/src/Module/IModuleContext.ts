import type { DependencyContainer } from 'tsyringe';
import type { IEventBus } from './IEventBus';
import type { ICommandRegistry } from './ICommandRegistry';
import type { IPanelRegistry } from './IPanelRegistry';
import type { IFileSystem } from '../Services/IFileSystem';
import type { IDialog } from '../Services/IDialog';
import type { INotification } from '../Services/INotification';
import type { InspectorRegistry } from '../Services/InspectorRegistry';

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
