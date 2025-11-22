import React, { useState, useRef, useCallback } from 'react';
import { FileText, Search, X, FolderOpen, ArrowRight, Package } from 'lucide-react';
import { AssetPickerDialog } from '../../../components/dialogs/AssetPickerDialog';
import './AssetField.css';

interface AssetFieldProps {
    label?: string;
    value: string | null;
    onChange: (value: string | null) => void;
    fileExtension?: string;  // 例如: '.btree'
    placeholder?: string;
    readonly?: boolean;
    onNavigate?: (path: string) => void;  // 导航到资产
}

export function AssetField({
    label,
    value,
    onChange,
    fileExtension = '',
    placeholder = 'None',
    readonly = false,
    onNavigate
}: AssetFieldProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const inputRef = useRef<HTMLDivElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!readonly) {
            setIsDragging(true);
        }
    }, [readonly]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (readonly) return;

        // 处理从文件系统拖入的文件
        const files = Array.from(e.dataTransfer.files);
        const file = files.find(f =>
            !fileExtension || f.name.endsWith(fileExtension)
        );

        if (file) {
            // Web File API 没有 path 属性，使用 name
            onChange(file.name);
            return;
        }

        // 处理从资产面板拖入的文件路径
        const assetPath = e.dataTransfer.getData('asset-path');
        if (assetPath && (!fileExtension || assetPath.endsWith(fileExtension))) {
            onChange(assetPath);
            return;
        }

        // 兼容纯文本拖拽
        const text = e.dataTransfer.getData('text/plain');
        if (text && (!fileExtension || text.endsWith(fileExtension))) {
            onChange(text);
        }
    }, [onChange, fileExtension, readonly]);

    const handleBrowse = useCallback(() => {
        if (readonly) return;
        setShowPicker(true);
    }, [readonly]);

    const handlePickerSelect = useCallback((path: string) => {
        onChange(path);
        setShowPicker(false);
    }, [onChange]);

    const handleClear = useCallback(() => {
        if (!readonly) {
            onChange(null);
        }
    }, [onChange, readonly]);

    const getFileName = (path: string) => {
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
    };

    return (
        <div className="asset-field">
            {label && <label className="asset-field__label">{label}</label>}
            <div
                className={`asset-field__container ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* 资产图标 */}
                <div className="asset-field__icon">
                    {value ? (
                        fileExtension === '.btree' ?
                            <FileText size={14} /> :
                            <Package size={14} />
                    ) : (
                        <Package size={14} style={{ opacity: 0.5 }} />
                    )}
                </div>

                {/* 资产选择框 */}
                <div
                    ref={inputRef}
                    className={`asset-field__input ${value ? 'has-value' : 'empty'}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={!readonly ? handleBrowse : undefined}
                    title={value || placeholder}
                >
                    <span className="asset-field__value">
                        {value ? getFileName(value) : placeholder}
                    </span>
                </div>

                {/* 操作按钮组 */}
                <div className="asset-field__actions">
                    {/* 浏览按钮 */}
                    {!readonly && (
                        <button
                            className="asset-field__button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleBrowse();
                            }}
                            title="浏览..."
                        >
                            <Search size={12} />
                        </button>
                    )}

                    {/* 导航/定位按钮 */}
                    {onNavigate && (
                        <button
                            className="asset-field__button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (value) {
                                    onNavigate(value);
                                } else {
                                    handleBrowse();
                                }
                            }}
                            title={value ? "在资产浏览器中显示" : "选择资产"}
                        >
                            {value ? <ArrowRight size={12} /> : <FolderOpen size={12} />}
                        </button>
                    )}

                    {/* 清除按钮 */}
                    {value && !readonly && (
                        <button
                            className="asset-field__button asset-field__button--clear"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            title="清除"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            <AssetPickerDialog
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                onSelect={handlePickerSelect}
                title="Select Asset"
                fileExtensions={fileExtension ? [fileExtension] : []}
            />
        </div>
    );
}