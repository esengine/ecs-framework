/**
 * 纹理选择器组件
 * Texture Picker Component
 *
 * A component for selecting particle textures.
 * 用于选择粒子纹理的组件。
 */

import React, { useState, useCallback, useRef } from 'react';
import { Image, ChevronDown, FolderOpen, X } from 'lucide-react';

interface TexturePickerProps {
    /** 当前纹理路径 | Current texture path */
    value: string | null;
    /** 变化回调 | Change callback */
    onChange: (path: string | null) => void;
    /** 打开文件选择对话框 | Open file selection dialog */
    onBrowse?: () => Promise<string | null>;
    /** 纹理预览 URL | Texture preview URL */
    previewUrl?: string | null;
}

/**
 * 纹理选择器
 * Texture Picker
 */
export function TexturePicker({
    value,
    onChange,
    onBrowse,
    previewUrl,
}: TexturePickerProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 处理浏览按钮点击 | Handle browse button click
    const handleBrowse = useCallback(async () => {
        if (onBrowse) {
            const result = await onBrowse();
            if (result) {
                onChange(result);
            }
        }
    }, [onBrowse, onChange]);

    // 处理清除 | Handle clear
    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    }, [onChange]);

    // 处理拖放 | Handle drag & drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                // 这里理想情况下需要将文件转换为项目内的路径
                // In ideal case, we'd convert file to project path
                // For now, just use the file name
                onChange(file.name);
            }
        }
    }, [onChange]);

    // 获取显示名称 | Get display name
    const displayName = value ? value.split(/[\\/]/).pop() || value : null;

    return (
        <div className="texture-picker">
            <div className="asset-field-row">
                <span className="asset-field-label">Texture</span>
                <div className="asset-field-content">
                    {/* 缩略图 | Thumbnail */}
                    <div
                        className={`asset-field-thumbnail ${isDragOver ? 'dragging' : ''}`}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Texture preview" />
                        ) : (
                            <Image size={20} className="asset-field-thumbnail-icon" />
                        )}
                    </div>

                    <div className="asset-field-right">
                        {/* 下拉选择器 | Dropdown selector */}
                        <div
                            className={`asset-field-dropdown ${value ? 'has-value' : ''}`}
                            onClick={handleBrowse}
                        >
                            <span className="asset-field-value">
                                {displayName || 'None'}
                            </span>
                            <ChevronDown size={12} className="asset-field-dropdown-arrow" />
                        </div>

                        {/* 操作按钮 | Action buttons */}
                        <div className="asset-field-actions">
                            <button
                                className="asset-field-btn"
                                onClick={handleBrowse}
                                title="Browse..."
                            >
                                <FolderOpen size={12} />
                            </button>
                            {value && (
                                <button
                                    className="asset-field-btn asset-field-btn--clear"
                                    onClick={handleClear}
                                    title="Clear"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
