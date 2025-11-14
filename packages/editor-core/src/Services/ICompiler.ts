export interface CompileResult {
    success: boolean;
    message: string;
    outputFiles?: string[];
    errors?: string[];
}

import type { IModuleContext } from '../Module/IModuleContext';

export interface CompilerContext {
    projectPath: string | null;
    moduleContext: IModuleContext;
    getService<T>(serviceClass: new (...args: unknown[]) => T): T | undefined;
}

export interface ICompiler<TOptions = unknown> {
    readonly id: string;
    readonly name: string;
    readonly description: string;

    compile(options: TOptions, context: CompilerContext): Promise<CompileResult>;

    createConfigUI?(onOptionsChange: (options: TOptions) => void, context: CompilerContext): React.ReactElement;

    validateOptions?(options: TOptions): string | null;
}
