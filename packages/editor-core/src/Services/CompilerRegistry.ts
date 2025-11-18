import { IService } from '@esengine/ecs-framework';
import { ICompiler } from './ICompiler';

export class CompilerRegistry implements IService {
    private compilers: Map<string, ICompiler> = new Map();

    register(compiler: ICompiler): void {
        if (this.compilers.has(compiler.id)) {
            console.warn(`Compiler with id "${compiler.id}" is already registered. Overwriting.`);
        }
        this.compilers.set(compiler.id, compiler);
        console.log(`[CompilerRegistry] Registered compiler: ${compiler.name} (${compiler.id})`);
    }

    unregister(compilerId: string): void {
        this.compilers.delete(compilerId);
        console.log(`[CompilerRegistry] Unregistered compiler: ${compilerId}`);
    }

    get(compilerId: string): ICompiler | undefined {
        return this.compilers.get(compilerId);
    }

    getAll(): ICompiler[] {
        return Array.from(this.compilers.values());
    }

    clear(): void {
        this.compilers.clear();
    }

    dispose(): void {
        this.clear();
    }
}
