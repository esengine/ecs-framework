import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Image, X, Navigation, ChevronDown, Copy } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Core } from '@esengine/esengine';
import { ProjectService, AssetRegistryService } from '@esengine/editor-core';
import { AssetPickerDialog } from '../../../components/dialogs/AssetPickerDialog';
import './AssetField.css';

interface AssetFieldProps {
    label?: string;
    /** Value can be GUID or path (for backward compatibility) */
    value: string | null;
    onChange: (value: string | null) => void;
    fileExtension?: string;
    placeholder?: string;
    readonly?: boolean;
    onNavigate?: (path: string) => void;
    onCreate?: () => void;
}

/**
 * Check if a string is a valid UUID v4 (GUID format)
 */
function isGUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
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

    // Get AssetRegistryService for GUID ↔ Path conversion
    const assetRegistry = useMemo(() => {
        return Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
    }, []);

    // Resolve value to path (value can be GUID or path)
    const resolvedPath = useMemo(() => {
        if (!value) return null;

        // If value is a GUID, resolve to path
        if (isGUID(value) && assetRegistry) {
            return assetRegistry.getPathByGuid(value) || null;
        }

        // Otherwise treat as path (backward compatibility)
        return value;
    }, [value, assetRegistry]);

    // 检测是否是图片资源
    const isImageAsset = useCallback((path: string | null) => {
        if (!path) return false;
        return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].some(ext =>
            path.toLowerCase().endsWith(ext)
        );
    }, []);

    // 加载缩略图（使用 resolvedPath）
    useEffect(() => {
        if (resolvedPath && isImageAsset(resolvedPath)) {
            // 获取项目路径并构建完整路径
            const projectService = Core.services.tryResolve(ProjectService);
            const projectPath = projectService?.getCurrentProject()?.path;

            if (projectPath) {
                // 构建完整的文件路径
                const fullPath = resolvedPath.startsWith('/') || resolvedPath.includes(':')
                    ? resolvedPath
                    : `${projectPath}/${resolvedPath}`;

                try {
                    const url = convertFileSrc(fullPath);
                    setThumbnailUrl(url);
                } catch {
                    setThumbnailUrl(null);
                }
            } else {
                // 没有项目路径时，尝试直接使用 resolvedPath
                try {
                    const url = convertFileSrc(resolvedPath);
                    setThumbnailUrl(url);
                } catch {
                    setThumbnailUrl(null);
                }
            }
        } else {
            setThumbnailUrl(null);
        }
    }, [resolvedPath, isImageAsset]);

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

        // Try to get GUID from drag data first
        const assetGuid = e.dataTransfer.getData('asset-guid');
        if (assetGuid && isGUID(assetGuid)) {
            // Validate extension if needed
            if (fileExtension && assetRegistry) {
                const path = assetRegistry.getPathByGuid(assetGuid);
                if (path && !path.endsWith(fileExtension)) {
                    return; // Extension mismatch
                }
            }
            onChange(assetGuid);
            return;
        }

        // Fallback: handle asset-path and convert to GUID
        const assetPath = e.dataTransfer.getData('asset-path');
        if (assetPath && (!fileExtension || assetPath.endsWith(fileExtension))) {
            // Try to get GUID from path
            if (assetRegistry) {
                // Path might be absolute, convert to relative first
                let relativePath = assetPath;
                if (assetPath.includes(':') || assetPath.startsWith('/')) {
                    relativePath = assetRegistry.absoluteToRelative(assetPath) || assetPath;
                }
                const guid = assetRegistry.getGuidByPath(relativePath);
                if (guid) {
                    onChange(guid);
                    return;
                }
            }
            // Fallback to path if GUID not found (backward compatibility)
            onChange(assetPath);
            return;
        }

        // Handle file drops
        const files = Array.from(e.dataTransfer.files);
        const file = files.find((f) =>
            !fileExtension || f.name.endsWith(fileExtension)
        );

        if (file) {
            // For file drops, we still use filename (need to register first)
            onChange(file.name);
            return;
        }

        const text = e.dataTransfer.getData('text/plain');
        if (text && (!fileExtension || text.endsWith(fileExtension))) {
            // Try to convert to GUID if it's a path
            if (assetRegistry && !isGUID(text)) {
                const guid = assetRegistry.getGuidByPath(text);
                if (guid) {
                    onChange(guid);
                    return;
                }
            }
            onChange(text);
        }
    }, [onChange, fileExtension, readonly, assetRegistry]);

    const handleBrowse = useCallback(() => {
        if (readonly) return;
        setShowPicker(true);
    }, [readonly]);

    const handlePickerSelect = useCallback((path: string) => {
        // Convert path to GUID if possible
        if (assetRegistry) {
            // Path might be absolute, convert to relative first
            let relativePath = path;
            if (path.includes(':') || path.startsWith('/')) {
                relativePath = assetRegistry.absoluteToRelative(path) || path;
            }
            const guid = assetRegistry.getGuidByPath(relativePath);
            if (guid) {
                onChange(guid);
                setShowPicker(false);
                return;
            }
        }
        // Fallback to path if GUID not found
        onChange(path);
        setShowPicker(false);
    }, [onChange, assetRegistry]);

    const handleClear = useCallback(() => {
        if (!readonly) {
            onChange(null);
        }
    }, [onChange, readonly]);

    const getFileName = (path: string | null) => {
        if (!path) return placeholder;
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
    };

    // Display name uses resolvedPath
    const displayName = resolvedPath ? getFileName(resolvedPath) : placeholder;

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
                        className={`asset-field__dropdown ${resolvedPath ? 'has-value' : ''} ${isDragging ? 'dragging' : ''}`}
                        onClick={!readonly ? handleBrowse : undefined}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        title={resolvedPath || placeholder}
                    >
                        <span className="asset-field__value">
                            {displayName}
                        </span>
                        <ChevronDown size={12} className="asset-field__dropdown-arrow" />
                    </div>

                    {/* 操作按钮行 */}
                    <div className="asset-field__actions">
                        {/* 定位按钮 */}
                        {resolvedPath && onNavigate && (
                            <button
                                className="asset-field__btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate(resolvedPath);
                                }}
                                title="Locate in Asset Browser"
                            >
                                <Navigation size={12} />
                            </button>
                        )}

                        {/* 复制路径按钮 - copy path, not GUID */}
                        {resolvedPath && (
                            <button
                                className="asset-field__btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(resolvedPath);
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
