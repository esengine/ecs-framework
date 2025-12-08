export interface CompileResult {
    success: boolean;
    message: string;
    outputFiles?: string[];
    errors?: string[];
}

import type { IFileSystem } from './IFileSystem';
import type { IDialog } from './IDialog';
import type { IService, ServiceType } from '@esengine/ecs-framework';

export interface CompilerModuleContext {
    fileSystem: IFileSystem;
    dialog: IDialog;
}

export interface CompilerContext {
    projectPath: string | null;
    moduleContext: CompilerModuleContext;
    getService<T extends IService>(serviceClass: ServiceType<T>): T | undefined;
}

export interface ICompiler<TOptions = unknown> {
    readonly id: string;
    readonly name: string;
    readonly description: string;

    compile(options: TOptions, context: CompilerContext): Promise<CompileResult>;

    createConfigUI?(onOptionsChange: (options: TOptions) => void, context: CompilerContext): React.ReactElement;

    validateOptions?(options: TOptions): string | null;
}
