import type { IModuleContext } from './IModuleContext';

export interface IEditorModule<TEvents = Record<string, unknown>> {
    readonly id: string;
    readonly name: string;
    readonly version?: string;
    readonly dependencies?: string[];

    load(context: IModuleContext<TEvents>): Promise<void>;
    unload?(): Promise<void>;
    reload?(): Promise<void>;
}
