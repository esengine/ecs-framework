import { useState, useEffect, useRef, useCallback } from 'react';
import { Core, IService, ServiceType } from '@esengine/ecs-framework';
import { CompilerRegistry, ICompiler, CompilerContext, CompileResult, IFileSystem, IDialog, FileEntry } from '@esengine/editor-core';
import { X, Play, Loader2 } from 'lucide-react';
import { open as tauriOpen, save as tauriSave, message as tauriMessage, confirm as tauriConfirm } from '@tauri-apps/plugin-dialog';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { useLocale } from '../hooks/useLocale';
import '../styles/CompilerConfigDialog.css';

interface DirectoryEntry {
    name: string;
    path: string;
    is_dir: boolean;
}

interface CompilerConfigDialogProps {
    isOpen: boolean;
    compilerId: string;
    projectPath: string | null;
    currentFileName?: string;
    onClose: () => void;
    onCompileComplete?: (result: CompileResult) => void;
}

export const CompilerConfigDialog: React.FC<CompilerConfigDialogProps> = ({
    isOpen,
    compilerId,
    projectPath,
    currentFileName,
    onClose,
    onCompileComplete
}) => {
    const { t } = useLocale();
    const [compiler, setCompiler] = useState<ICompiler | null>(null);
    const [options, setOptions] = useState<unknown>(null);
    const [isCompiling, setIsCompiling] = useState(false);
    const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
    const optionsRef = useRef<unknown>(null);

    useEffect(() => {
        if (isOpen && compilerId) {
            try {
                const registry = Core.services.resolve(CompilerRegistry);
                const comp = registry.get(compilerId);
                setCompiler(comp || null);
            } catch (error) {
                console.error('[CompilerConfigDialog] Failed to resolve CompilerRegistry:', error);
                setCompiler(null);
            }
        }
    }, [isOpen, compilerId]);

    const handleOptionsChange = useCallback((newOptions: unknown) => {
        optionsRef.current = newOptions;
        setOptions(newOptions);
    }, []);

    const createFileSystem = (): IFileSystem => ({
        readFile: async (path: string) => {
            return await invoke<string>('read_file_content', { path });
        },
        writeFile: async (path: string, content: string) => {
            await invoke('write_file_content', { path, content });
        },
        writeBinary: async (path: string, data: Uint8Array) => {
            await invoke('write_binary_file', { filePath: path, content: Array.from(data) });
        },
        exists: async (path: string) => {
            return await invoke<boolean>('path_exists', { path });
        },
        createDirectory: async (path: string) => {
            await invoke('create_directory', { path });
        },
        listDirectory: async (path: string): Promise<FileEntry[]> => {
            const entries = await invoke<DirectoryEntry[]>('list_directory', { path });
            return entries.map((e) => ({
                name: e.name,
                path: e.path,
                isDirectory: e.is_dir
            }));
        },
        deleteFile: async (path: string) => {
            await invoke('delete_file', { path });
        },
        deleteDirectory: async (path: string) => {
            await invoke('delete_folder', { path });
        },
        scanFiles: async (dir: string, pattern: string) => {
            // Check if directory exists, create if not
            const dirExists = await invoke<boolean>('path_exists', { path: dir });
            if (!dirExists) {
                await invoke('create_directory', { path: dir });
                return []; // New directory has no files
            }
            const entries = await invoke<DirectoryEntry[]>('list_directory', { path: dir });
            const ext = pattern.replace(/\*/g, '');
            return entries
                .filter((e) => !e.is_dir && e.name.endsWith(ext))
                .map((e) => e.name.replace(ext, ''));
        },
        convertToAssetUrl: (filePath: string) => {
            return convertFileSrc(filePath);
        },
        dispose: () => {}
    });

    const createDialog = (): IDialog => ({
        openDialog: async (opts) => {
            const result = await tauriOpen({
                directory: opts.directory,
                multiple: opts.multiple,
                title: opts.title,
                defaultPath: opts.defaultPath
            });
            return result;
        },
        saveDialog: async (opts) => {
            const result = await tauriSave({
                title: opts.title,
                defaultPath: opts.defaultPath,
                filters: opts.filters
            });
            return result;
        },
        showMessage: async (title: string, message: string, type?: 'info' | 'warning' | 'error') => {
            await tauriMessage(message, { title, kind: type || 'info' });
        },
        showConfirm: async (title: string, message: string) => {
            return await tauriConfirm(message, { title });
        },
        dispose: () => {}
    });

    const createContext = (): CompilerContext => ({
        projectPath,
        moduleContext: {
            fileSystem: createFileSystem(),
            dialog: createDialog()
        },
        getService: <T extends IService>(serviceClass: ServiceType<T>): T | undefined => {
            try {
                return Core.services.resolve(serviceClass);
            } catch {
                return undefined;
            }
        }
    });

    const handleCompile = async () => {
        if (!compiler || !optionsRef.current) return;

        setIsCompiling(true);
        setCompileResult(null);

        try {
            const context = createContext();
            const result = await compiler.compile(optionsRef.current, context);
            setCompileResult(result);
            onCompileComplete?.(result);

            if (result.success) {
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            setCompileResult({
                success: false,
                message: t('compilerConfig.compileFailed', { error: String(error) }),
                errors: [String(error)]
            });
        } finally {
            setIsCompiling(false);
        }
    };

    if (!isOpen) return null;

    const context = createContext();

    return (
        <div className="compiler-dialog-overlay">
            <div className="compiler-dialog">
                <div className="compiler-dialog-header">
                    <h3>{compiler?.name || t('compilerConfig.title')}</h3>
                    <button className="close-button" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="compiler-dialog-body">
                    {compiler?.createConfigUI ? (
                        compiler.createConfigUI(handleOptionsChange, context)
                    ) : (
                        <div className="no-config">
                            {compiler ? t('compilerConfig.noConfigUI') : t('compilerConfig.compilerNotFound')}
                        </div>
                    )}
                </div>

                {compileResult && (
                    <div className={`compile-result ${compileResult.success ? 'success' : 'error'}`}>
                        <div className="result-message">{compileResult.message}</div>
                        {compileResult.outputFiles && compileResult.outputFiles.length > 0 && (
                            <div className="output-files">
                                {t('compilerConfig.generatedFiles', { count: compileResult.outputFiles.length })}
                            </div>
                        )}
                        {compileResult.errors && compileResult.errors.length > 0 && (
                            <div className="error-list">
                                {compileResult.errors.map((err, i) => (
                                    <div key={i} className="error-item">{err}</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="compiler-dialog-footer">
                    <button
                        className="cancel-button"
                        onClick={onClose}
                        disabled={isCompiling}
                    >
                        {t('compilerConfig.cancel')}
                    </button>
                    <button
                        className="compile-button"
                        onClick={handleCompile}
                        disabled={isCompiling || !compiler || !options}
                    >
                        {isCompiling ? (
                            <>
                                <Loader2 size={16} className="spinning" />
                                {t('compilerConfig.compiling')}
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                {t('compilerConfig.compile')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
