import { useState, useEffect } from 'react';
import { X, File, FolderTree, FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
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
                title: '选择资产输出目录',
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
                title: '选择类型定义输出目录',
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
            setExportMessage('错误：请选择资产输出路径');
            return;
        }

        if (!typeOutputPath) {
            setExportMessage('错误：请选择类型定义输出路径');
            return;
        }

        if (selectedMode === 'workspace' && selectedFiles.size === 0) {
            setExportMessage('错误：请至少选择一个文件');
            return;
        }

        if (selectedMode === 'single' && !currentFileName) {
            setExportMessage('错误：没有可导出的当前文件');
            return;
        }

        // 保存路径到 localStorage
        localStorage.setItem('export-asset-path', assetOutputPath);
        localStorage.setItem('export-type-path', typeOutputPath);

        setIsExporting(true);
        setExportProgress(0);
        setExportMessage('正在导出...');

        try {
            await onExport({
                mode: selectedMode,
                assetOutputPath,
                typeOutputPath,
                selectedFiles: selectedMode === 'workspace' ? Array.from(selectedFiles) : [currentFileName!],
                fileFormats
            });

            setExportProgress(100);
            setExportMessage('导出成功！');
        } catch (error) {
            setExportMessage(`导出失败：${error}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="export-dialog-overlay">
            <div className="export-dialog" style={{ maxWidth: '700px', width: '90%' }}>
                <div className="export-dialog-header">
                    <h3>导出运行时资产</h3>
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
                            工作区导出
                        </button>
                        <button
                            className={`export-mode-tab ${selectedMode === 'single' ? 'active' : ''}`}
                            onClick={() => setSelectedMode('single')}
                        >
                            <File size={16} />
                            当前文件
                        </button>
                    </div>

                    {/* 资产输出路径 */}
                    <div className="export-section">
                        <h4>资产输出路径</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={assetOutputPath}
                                onChange={(e) => setAssetOutputPath(e.target.value)}
                                placeholder="选择资产输出目录（.btree.bin / .btree.json）..."
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
                                浏览
                            </button>
                        </div>
                    </div>

                    {/* TypeScript 类型定义输出路径 */}
                    <div className="export-section">
                        <h4>TypeScript 类型定义输出路径</h4>
                        <div style={{ marginBottom: '12px', fontSize: '11px', color: '#999', lineHeight: '1.5' }}>
                            {selectedMode === 'workspace' ? (
                                <>
                                    将导出以下类型定义：<br />
                                    • 每个行为树的黑板变量类型（.d.ts）<br />
                                    • 全局黑板变量类型（GlobalBlackboard.ts）
                                </>
                            ) : (
                                '将导出当前行为树的黑板变量类型（.d.ts）'
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={typeOutputPath}
                                onChange={(e) => setTypeOutputPath(e.target.value)}
                                placeholder="选择类型定义输出目录..."
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
                                浏览
                            </button>
                        </div>
                    </div>

                    {/* 文件列表 */}
                    {selectedMode === 'workspace' && availableFiles.length > 0 && (
                        <div className="export-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0, fontSize: '13px', color: '#ccc' }}>
                                    选择要导出的文件 ({selectedFiles.size}/{availableFiles.length})
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
                                    {selectAll ? '取消全选' : '全选'}
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
                                            <option value="binary">二进制</option>
                                            <option value="json">JSON</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 单文件模式 */}
                    {selectedMode === 'single' && (
                        <div className="export-section">
                            <h4>当前文件</h4>
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
                                            <option value="binary">二进制</option>
                                            <option value="json">JSON</option>
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
                                    <div>没有打开的行为树文件</div>
                                    <div style={{ fontSize: '11px', marginTop: '8px' }}>
                                        请先在编辑器中打开一个行为树文件
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
                            color: exportMessage.startsWith('错误') ? '#f48771' : exportMessage.includes('成功') ? '#89d185' : '#ccc',
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
                        关闭
                    </button>
                    <button
                        onClick={handleExport}
                        className="export-dialog-btn export-dialog-btn-primary"
                        disabled={isExporting}
                        style={{ opacity: isExporting ? 0.5 : 1 }}
                    >
                        {isExporting ? '导出中...' : '导出'}
                    </button>
                </div>
            </div>
        </div>
    );
};
