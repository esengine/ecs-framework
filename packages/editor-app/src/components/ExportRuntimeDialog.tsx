import { useState } from 'react';
import { X, FileJson, Binary, Info } from 'lucide-react';
import '../styles/ExportRuntimeDialog.css';

interface ExportRuntimeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: 'json' | 'binary') => void;
}

/**
 * 导出运行时资产对话框
 */
export const ExportRuntimeDialog: React.FC<ExportRuntimeDialogProps> = ({
    isOpen,
    onClose,
    onExport
}) => {
    const [selectedFormat, setSelectedFormat] = useState<'json' | 'binary'>('binary');

    if (!isOpen) return null;

    const handleExport = () => {
        onExport(selectedFormat);
        onClose();
    };

    return (
        <div className="export-dialog-overlay" onClick={onClose}>
            <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="export-dialog-header">
                    <h3>导出运行时资产</h3>
                    <button onClick={onClose} className="export-dialog-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="export-dialog-content">
                    <div className="export-dialog-info">
                        <Info size={16} />
                        <span>选择导出格式，用于游戏运行时加载</span>
                    </div>

                    <div className="export-format-options">
                        <div
                            className={`export-format-option ${selectedFormat === 'json' ? 'selected' : ''}`}
                            onClick={() => setSelectedFormat('json')}
                        >
                            <div className="export-format-icon">
                                <FileJson size={32} />
                            </div>
                            <div className="export-format-info">
                                <h4>JSON 格式</h4>
                                <p className="export-format-desc">
                                    文本格式，可读性好
                                </p>
                                <div className="export-format-features">
                                    <span className="feature-tag">易于调试</span>
                                    <span className="feature-tag">版本控制友好</span>
                                    <span className="feature-tag">体积较大</span>
                                </div>
                                <div className="export-format-extension">.btree.json</div>
                            </div>
                        </div>

                        <div
                            className={`export-format-option ${selectedFormat === 'binary' ? 'selected' : ''}`}
                            onClick={() => setSelectedFormat('binary')}
                        >
                            <div className="export-format-icon">
                                <Binary size={32} />
                            </div>
                            <div className="export-format-info">
                                <h4>二进制格式</h4>
                                <p className="export-format-desc">
                                    紧凑的二进制编码（MessagePack）
                                </p>
                                <div className="export-format-features">
                                    <span className="feature-tag">体积小</span>
                                    <span className="feature-tag">加载快</span>
                                    <span className="feature-tag recommended">推荐用于生产</span>
                                </div>
                                <div className="export-format-extension">.btree.bin</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="export-dialog-footer">
                    <button onClick={onClose} className="export-dialog-btn export-dialog-btn-cancel">
                        取消
                    </button>
                    <button onClick={handleExport} className="export-dialog-btn export-dialog-btn-primary">
                        导出
                    </button>
                </div>
            </div>
        </div>
    );
};
