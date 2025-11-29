import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Image, X, Navigation, ChevronDown, Copy } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Core } from '@esengine/ecs-framework';
import { ProjectService } from '@esengine/editor-core';
import { AssetPickerDialog } from '../../../components/dialogs/AssetPickerDialog';
import './AssetField.css';

interface AssetFieldProps {
    label?: string;
    value: string | null;
    onChange: (value: string | null) => void;
    fileExtension?: string;
    placeholder?: string;
    readonly?: boolean;
    onNavigate?: (path: string) => void;
    onCreate?: () => void;
}

export function AssetField({
    label,
    value,
    onChange,
    fileExtension = '',
    placeholder = 'None',
    readonly = false,
    onNavigate,
    onCreate
}: AssetFieldProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    // 检测是否是图片资源
    const isImageAsset = useCallback((path: string | null) => {
        if (!path) return false;
        return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].some(ext =>
            path.toLowerCase().endsWith(ext)
        );
    }, []);

    // 加载缩略图
    useEffect(() => {
        if (value && isImageAsset(value)) {
            // 获取项目路径并构建完整路径
            const projectService = Core.services.tryResolve(ProjectService);
            const projectPath = projectService?.getCurrentProject()?.path;

            if (projectPath) {
                // 构建完整的文件路径
                const fullPath = value.startsWith('/') || value.includes(':')
                    ? value
                    : `${projectPath}/${value}`;

                try {
                    const url = convertFileSrc(fullPath);
                    setThumbnailUrl(url);
                } catch {
                    setThumbnailUrl(null);
                }
            } else {
                // 没有项目路径时，尝试直接使用 value
                try {
                    const url = convertFileSrc(value);
                    setThumbnailUrl(url);
                } catch {
                    setThumbnailUrl(null);
                }
            }
        } else {
            setThumbnailUrl(null);
        }
    }, [value, isImageAsset]);

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

        const files = Array.from(e.dataTransfer.files);
        const file = files.find((f) =>
            !fileExtension || f.name.endsWith(fileExtension)
        );

        if (file) {
            onChange(file.name);
            return;
        }

        const assetPath = e.dataTransfer.getData('asset-path');
        if (assetPath && (!fileExtension || assetPath.endsWith(fileExtension))) {
            onChange(assetPath);
            return;
        }

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
            <div className="asset-field__content">
                {/* 缩略图预览 */}
                <div
                    className={`asset-field__thumbnail ${isDragging ? 'dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" />
                    ) : (
                        <Image size={18} className="asset-field__thumbnail-icon" />
                    )}
                </div>

                {/* 右侧区域 */}
                <div className="asset-field__right">
                    {/* 下拉选择框 */}
                    <div
                        ref={inputRef}
                        className={`asset-field__dropdown ${value ? 'has-value' : ''} ${isDragging ? 'dragging' : ''}`}
                        onClick={!readonly ? handleBrowse : undefined}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        title={value || placeholder}
                    >
                        <span className="asset-field__value">
                            {value ? getFileName(value) : placeholder}
                        </span>
                        <ChevronDown size={12} className="asset-field__dropdown-arrow" />
                    </div>

                    {/* 操作按钮行 */}
                    <div className="asset-field__actions">
                        {/* 定位按钮 */}
                        {value && onNavigate && (
                            <button
                                className="asset-field__btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate(value);
                                }}
                                title="Locate in Asset Browser"
                            >
                                <Navigation size={12} />
                            </button>
                        )}

                        {/* 复制路径按钮 */}
                        {value && (
                            <button
                                className="asset-field__btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(value);
                                }}
                                title="Copy Path"
                            >
                                <Copy size={12} />
                            </button>
                        )}

                        {/* 清除按钮 */}
                        {value && !readonly && (
                            <button
                                className="asset-field__btn asset-field__btn--clear"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                                title="Clear"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
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
