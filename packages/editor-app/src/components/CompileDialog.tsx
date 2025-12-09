import { useState, useEffect } from 'react';
import { X, Cpu } from 'lucide-react';
import { ICompiler, CompileResult, CompilerContext } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import '../styles/CompileDialog.css';

interface CompileDialogProps<TOptions = unknown> {
    isOpen: boolean;
    onClose: () => void;
    compiler: ICompiler<TOptions>;
    context: CompilerContext;
    initialOptions?: TOptions;
}

export function CompileDialog<TOptions = unknown>({
    isOpen,
    onClose,
    compiler,
    context,
    initialOptions
}: CompileDialogProps<TOptions>) {
    const { t } = useLocale();
    const [options, setOptions] = useState<TOptions>(initialOptions as TOptions);
    const [isCompiling, setIsCompiling] = useState(false);
    const [result, setResult] = useState<CompileResult | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && initialOptions) {
            setOptions(initialOptions);
            setResult(null);
            setValidationError(null);
        }
    }, [isOpen, initialOptions]);

    useEffect(() => {
        if (compiler.validateOptions && options) {
            const error = compiler.validateOptions(options);
            setValidationError(error);
        }
    }, [options, compiler]);

    if (!isOpen) return null;

    const handleCompile = async () => {
        if (validationError) {
            return;
        }

        setIsCompiling(true);
        setResult(null);

        try {
            const compileResult = await compiler.compile(options, context);
            setResult(compileResult);
        } catch (error) {
            setResult({
                success: false,
                message: `${t('compileDialog.compileFailed')}: ${error}`,
                errors: [String(error)]
            });
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div className="compile-dialog-overlay">
            <div className="compile-dialog">
                <div className="compile-dialog-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cpu size={20} />
                        <h3>{compiler.name}</h3>
                    </div>
                    <button onClick={onClose} className="compile-dialog-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="compile-dialog-content">
                    {compiler.description && (
                        <div className="compile-dialog-description">
                            {compiler.description}
                        </div>
                    )}

                    {compiler.createConfigUI && compiler.createConfigUI(setOptions, context)}

                    {validationError && (
                        <div className="compile-dialog-error">
                            {validationError}
                        </div>
                    )}

                    {result && (
                        <div className={`compile-dialog-result ${result.success ? 'success' : 'error'}`}>
                            <div className="compile-dialog-result-message">
                                {result.message}
                            </div>
                            {result.outputFiles && result.outputFiles.length > 0 && (
                                <div className="compile-dialog-output-files">
                                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('compileDialog.outputFiles')}:</div>
                                    {result.outputFiles.map((file, index) => (
                                        <div key={index} className="compile-dialog-output-file">
                                            {file}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {result.errors && result.errors.length > 0 && (
                                <div className="compile-dialog-errors">
                                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('compileDialog.errors')}:</div>
                                    {result.errors.map((error, index) => (
                                        <div key={index} className="compile-dialog-error-item">
                                            {error}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="compile-dialog-footer">
                    <button
                        onClick={onClose}
                        className="compile-dialog-btn compile-dialog-btn-cancel"
                        disabled={isCompiling}
                    >
                        {t('compileDialog.close')}
                    </button>
                    <button
                        onClick={handleCompile}
                        className="compile-dialog-btn compile-dialog-btn-primary"
                        disabled={isCompiling || !!validationError}
                    >
                        {isCompiling ? t('compileDialog.compiling') : t('compileDialog.compile')}
                    </button>
                </div>
            </div>
        </div>
    );
}
