import { useState, useEffect } from 'react';
import { X, File, FolderTree, FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useLocale } from '../hooks/useLocale';
import '../styles/ExportRuntimeDialog.css';

interface ExportRuntimeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
    hasProject: boolean;
    availableFiles: string[];
    currentFileName?: string;
    projectPath?: string;
}

export interface ExportOptions {
    mode: 'single' | 'workspace';
    assetOutputPath: string;
    typeOutputPath: string;
    selectedFiles: string[];
    fileFormats: Map<string, 'json' | 'binary'>;
}

/**
 * 导出运行时资产对话框
 */
export const ExportRuntimeDialog: React.FC<ExportRuntimeDialogProps> = ({
    isOpen,
    onClose,
    onExport,
    hasProject,
    availableFiles,
    currentFileName,
    projectPath
}) => {
    const { t } = useLocale();
    const [selectedMode, setSelectedMode] = useState<'single' | 'workspace'>('workspace');
    const [assetOutputPath, setAssetOutputPath] = useState('');
    const [typeOutputPath, setTypeOutputPath] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [fileFormats, setFileFormats] = useState<Map<string, 'json' | 'binary'>>(new Map());
    const [selectAll, setSelectAll] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportMessage, setExportMessage] = useState('');

    // 从 localStorage 加载上次的路径
    useEffect(() => {
        if (isOpen && projectPath) {
            const savedAssetPath = localStorage.getItem('export-asset-path');
            const savedTypePath = localStorage.getItem('export-type-path');

            if (savedAssetPath) {
                setAssetOutputPath(savedAssetPath);
            }
            if (savedTypePath) {
                setTypeOutputPath(savedTypePath);
            }
        }
    }, [isOpen, projectPath]);

    useEffect(() => {
        if (isOpen) {
            if (selectedMode === 'workspace') {
                const newSelectedFiles = new Set(availableFiles);
                setSelectedFiles(newSelectedFiles);
                setSelectAll(true);

                const newFormats = new Map<string, 'json' | 'binary'>();
                availableFiles.forEach((file) => {
                    newFormats.set(file, 'binary');
                });
                setFileFormats(newFormats);
            } else {
                setSelectedFiles(new Set());
                setSelectAll(false);
                if (currentFileName) {
                    const newFormats = new Map<string, 'json' | 'binary'>();
                    newFormats.set(currentFileName, 'binary');
                    setFileFormats(newFormats);
                }
            }
        }
    }, [isOpen, selectedMode, availableFiles, currentFileName]);

    if (!isOpen) return null;

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedFiles(new Set());
            setSelectAll(false);
        } else {
            setSelectedFiles(new Set(availableFiles));
            setSelectAll(true);
        }
    };

    const handleToggleFile = (file: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(file)) {
            newSelected.delete(file);
        } else {
            newSelected.add(file);
        }
        setSelectedFiles(newSelected);
        setSelectAll(newSelected.size === availableFiles.length);
    };

    const handleFileFormatChange = (file: string, format: 'json' | 'binary') => {
        const newFormats = new Map(fileFormats);
        newFormats.set(file, format);
        setFileFormats(newFormats);
    };

    const handleBrowseAssetPath = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: t('exportRuntime.selectAssetDir'),
                defaultPath: assetOutputPath || projectPath
            });
            if (selected) {
                const path = selected as string;
                setAssetOutputPath(path);
                localStorage.setItem('export-asset-path', path);
            }
        } catch (error) {
            console.error('Failed to browse asset path:', error);
        }
    };

    const handleBrowseTypePath = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: t('exportRuntime.selectTypeDir'),
                defaultPath: typeOutputPath || projectPath
            });
            if (selected) {
                const path = selected as string;
                setTypeOutputPath(path);
                localStorage.setItem('export-type-path', path);
            }
        } catch (error) {
            console.error('Failed to browse type path:', error);
        }
    };

    const handleExport = async () => {
        if (!assetOutputPath) {
            setExportMessage(t('exportRuntime.errorSelectAssetPath'));
            return;
        }

        if (!typeOutputPath) {
            setExportMessage(t('exportRuntime.errorSelectTypePath'));
            return;
        }

        if (selectedMode === 'workspace' && selectedFiles.size === 0) {
            setExportMessage(t('exportRuntime.errorSelectFile'));
            return;
        }

        if (selectedMode === 'single' && !currentFileName) {
            setExportMessage(t('exportRuntime.errorNoCurrentFile'));
            return;
        }

        // 保存路径到 localStorage
        localStorage.setItem('export-asset-path', assetOutputPath);
        localStorage.setItem('export-type-path', typeOutputPath);

        setIsExporting(true);
        setExportProgress(0);
        setExportMessage(t('exportRuntime.exporting'));

        try {
            await onExport({
                mode: selectedMode,
                assetOutputPath,
                typeOutputPath,
                selectedFiles: selectedMode === 'workspace' ? Array.from(selectedFiles) : [currentFileName!],
                fileFormats
            });

            setExportProgress(100);
            setExportMessage(t('exportRuntime.exportSuccess'));
        } catch (error) {
            setExportMessage(t('exportRuntime.exportFailed', { error: String(error) }));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="export-dialog-overlay">
            <div className="export-dialog" style={{ maxWidth: '700px', width: '90%' }}>
                <div className="export-dialog-header">
                    <h3>{t('exportRuntime.title')}</h3>
                    <button onClick={onClose} className="export-dialog-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="export-dialog-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* Tab 页签 */}
                    <div className="export-mode-tabs">
                        <button
                            className={`export-mode-tab ${selectedMode === 'workspace' ? 'active' : ''}`}
                            onClick={() => hasProject ? setSelectedMode('workspace') : null}
                            disabled={!hasProject}
                        >
                            <FolderTree size={16} />
                            {t('exportRuntime.workspaceExport')}
                        </button>
                        <button
                            className={`export-mode-tab ${selectedMode === 'single' ? 'active' : ''}`}
                            onClick={() => setSelectedMode('single')}
                        >
                            <File size={16} />
                            {t('exportRuntime.currentFile')}
                        </button>
                    </div>

                    {/* 资产输出路径 */}
                    <div className="export-section">
                        <h4>{t('exportRuntime.assetOutputPath')}</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={assetOutputPath}
                                onChange={(e) => setAssetOutputPath(e.target.value)}
                                placeholder={t('exportRuntime.selectAssetDirPlaceholder')}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    backgroundColor: '#2d2d2d',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '4px',
                                    color: '#cccccc',
                                    fontSize: '12px'
                                }}
                            />
                            <button
                                onClick={handleBrowseAssetPath}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#0e639c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FolderOpen size={14} />
                                {t('exportRuntime.browse')}
                            </button>
                        </div>
                    </div>

                    {/* TypeScript 类型定义输出路径 */}
                    <div className="export-section">
                        <h4>{t('exportRuntime.typeOutputPath')}</h4>
                        <div style={{ marginBottom: '12px', fontSize: '11px', color: '#999', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                            {selectedMode === 'workspace'
                                ? t('exportRuntime.typeOutputHintWorkspace')
                                : t('exportRuntime.typeOutputHintSingle')
                            }
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={typeOutputPath}
                                onChange={(e) => setTypeOutputPath(e.target.value)}
                                placeholder={t('exportRuntime.selectTypeDirPlaceholder')}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    backgroundColor: '#2d2d2d',
                                    border: '1px solid #3a3a3a',
                                    borderRadius: '4px',
                                    color: '#cccccc',
                                    fontSize: '12px'
                                }}
                            />
                            <button
                                onClick={handleBrowseTypePath}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#0e639c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FolderOpen size={14} />
                                {t('exportRuntime.browse')}
                            </button>
                        </div>
                    </div>

                    {/* 文件列表 */}
                    {selectedMode === 'workspace' && availableFiles.length > 0 && (
                        <div className="export-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0, fontSize: '13px', color: '#ccc' }}>
                                    {t('exportRuntime.selectFilesToExport')} ({selectedFiles.size}/{availableFiles.length})
                                </h4>
                                <button
                                    onClick={handleSelectAll}
                                    style={{
                                        padding: '4px 12px',
                                        backgroundColor: '#3a3a3a',
                                        border: 'none',
                                        borderRadius: '3px',
                                        color: '#ccc',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    {selectAll ? t('exportRuntime.deselectAll') : t('exportRuntime.selectAll')}
                                </button>
                            </div>
                            <div className="export-file-list">
                                {availableFiles.map((file) => (
                                    <div
                                        key={file}
                                        className={`export-file-item ${selectedFiles.has(file) ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="export-file-checkbox"
                                            checked={selectedFiles.has(file)}
                                            onChange={() => handleToggleFile(file)}
                                        />
                                        <div className="export-file-name">
                                            <File size={14} />
                                            {file}.btree
                                        </div>
                                        <select
                                            className="export-file-format"
                                            value={fileFormats.get(file) || 'binary'}
                                            onChange={(e) => handleFileFormatChange(file, e.target.value as 'json' | 'binary')}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="binary">{t('exportRuntime.binary')}</option>
                                            <option value="json">{t('exportRuntime.json')}</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 单文件模式 */}
                    {selectedMode === 'single' && (
                        <div className="export-section">
                            <h4>{t('exportRuntime.currentFile')}</h4>
                            {currentFileName ? (
                                <div className="export-file-list">
                                    <div className="export-file-item selected">
                                        <div className="export-file-name" style={{ paddingLeft: '8px' }}>
                                            <File size={14} />
                                            {currentFileName}.btree
                                        </div>
                                        <select
                                            className="export-file-format"
                                            value={fileFormats.get(currentFileName) || 'binary'}
                                            onChange={(e) => handleFileFormatChange(currentFileName, e.target.value as 'json' | 'binary')}
                                        >
                                            <option value="binary">{t('exportRuntime.binary')}</option>
                                            <option value="json">{t('exportRuntime.json')}</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#999',
                                    fontSize: '13px',
                                    backgroundColor: '#252525',
                                    borderRadius: '6px',
                                    border: '1px solid #3a3a3a'
                                }}>
                                    <File size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                    <div>{t('exportRuntime.noOpenFile')}</div>
                                    <div style={{ fontSize: '11px', marginTop: '8px' }}>
                                        {t('exportRuntime.openFileHint')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="export-dialog-footer">
                    {exportMessage && (
                        <div style={{
                            flex: 1,
                            fontSize: '12px',
                            color: exportMessage.includes('Error') || exportMessage.includes('错误') ? '#f48771' : exportMessage.includes('success') || exportMessage.includes('成功') ? '#89d185' : '#ccc',
                            paddingLeft: '8px'
                        }}>
                            {exportMessage}
                        </div>
                    )}
                    {isExporting && (
                        <div style={{
                            flex: 1,
                            height: '4px',
                            backgroundColor: '#3a3a3a',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            marginRight: '12px'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${exportProgress}%`,
                                backgroundColor: '#0e639c',
                                transition: 'width 0.3s'
                            }}></div>
                        </div>
                    )}
                    <button onClick={onClose} className="export-dialog-btn export-dialog-btn-cancel">
                        {t('exportRuntime.close')}
                    </button>
                    <button
                        onClick={handleExport}
                        className="export-dialog-btn export-dialog-btn-primary"
                        disabled={isExporting}
                        style={{ opacity: isExporting ? 0.5 : 1 }}
                    >
                        {isExporting ? t('exportRuntime.exporting') : t('exportRuntime.export')}
                    </button>
                </div>
            </div>
        </div>
    );
};
