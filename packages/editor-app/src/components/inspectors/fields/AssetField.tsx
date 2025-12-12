import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Image, X, Navigation, ChevronDown, Copy } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Core } from '@esengine/ecs-framework';
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

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (readonly || !assetRegistry) return;

        // Try to get GUID from drag data first
        const assetGuid = e.dataTransfer.getData('asset-guid');
        if (assetGuid && isGUID(assetGuid)) {
            // Validate extension if needed
            if (fileExtension) {
                const path = assetRegistry.getPathByGuid(assetGuid);
                if (path && !path.endsWith(fileExtension)) {
                    return; // Extension mismatch
                }
            }
            onChange(assetGuid);
            return;
        }

        // Handle asset-path: convert to GUID or register
        const assetPath = e.dataTransfer.getData('asset-path');
        if (assetPath && (!fileExtension || assetPath.endsWith(fileExtension))) {
            // Path might be absolute, convert to relative first
            let relativePath = assetPath;
            if (assetPath.includes(':') || assetPath.startsWith('/')) {
                relativePath = assetRegistry.absoluteToRelative(assetPath) || assetPath;
            }

            // 尝试多种路径格式 | Try multiple path formats
            const pathVariants = [relativePath, relativePath.replace(/\\/g, '/')];
            for (const variant of pathVariants) {
                const guid = assetRegistry.getGuidByPath(variant);
                if (guid) {
                    onChange(guid);
                    return;
                }
            }

            // GUID 不存在，尝试注册 | GUID not found, try to register
            const absolutePath = assetPath.includes(':') ? assetPath : null;
            if (absolutePath) {
                try {
                    const newGuid = await assetRegistry.registerAsset(absolutePath);
                    if (newGuid) {
                        console.log(`[AssetField] Registered dropped asset with GUID: ${newGuid}`);
                        onChange(newGuid);
                        return;
                    }
                } catch (error) {
                    console.error(`[AssetField] Failed to register dropped asset:`, error);
                }
            }

            console.error(`[AssetField] Cannot use dropped asset without GUID: "${assetPath}"`);
            return;
        }

        // Handle text/plain drops (might be GUID or path)
        const text = e.dataTransfer.getData('text/plain');
        if (text && (!fileExtension || text.endsWith(fileExtension))) {
            if (isGUID(text)) {
                onChange(text);
                return;
            }

            // Try to get GUID from path
            const pathVariants = [text, text.replace(/\\/g, '/')];
            for (const variant of pathVariants) {
                const guid = assetRegistry.getGuidByPath(variant);
                if (guid) {
                    onChange(guid);
                    return;
                }
            }

            console.error(`[AssetField] Cannot use dropped text without GUID: "${text}"`);
        }
    }, [onChange, fileExtension, readonly, assetRegistry]);

    const handleBrowse = useCallback(() => {
        if (readonly) return;
        setShowPicker(true);
    }, [readonly]);

    const handlePickerSelect = useCallback(async (path: string) => {
        // Convert path to GUID - 必须使用 GUID，不能使用路径！
        // Must use GUID, cannot use path!
        if (!assetRegistry) {
            console.error(`[AssetField] AssetRegistry not available, cannot select asset`);
            setShowPicker(false);
            return;
        }

        // Path might be absolute, convert to relative first
        let relativePath = path;
        if (path.includes(':') || path.startsWith('/')) {
            relativePath = assetRegistry.absoluteToRelative(path) || path;
        }

        // 尝试多种路径格式 | Try multiple path formats
        const pathVariants = [
            relativePath,
            relativePath.replace(/\\/g, '/'),  // 统一为正斜杠
        ];

        for (const variant of pathVariants) {
            const guid = assetRegistry.getGuidByPath(variant);
            if (guid) {
                console.log(`[AssetField] Found GUID for path "${path}": ${guid}`);
                onChange(guid);
                setShowPicker(false);
                return;
            }
        }

        // GUID 不存在，尝试注册资产（创建 .meta 文件）
        // GUID not found, try to register asset (create .meta file)
        console.warn(`[AssetField] GUID not found for path "${path}", registering asset...`);

        try {
            // 使用绝对路径注册 | Register using absolute path
            const absolutePath = path.includes(':') ? path : null;
            if (absolutePath) {
                const newGuid = await assetRegistry.registerAsset(absolutePath);
                if (newGuid) {
                    console.log(`[AssetField] Registered new asset with GUID: ${newGuid}`);
                    onChange(newGuid);
                    setShowPicker(false);
                    return;
                }
            }
        } catch (error) {
            console.error(`[AssetField] Failed to register asset:`, error);
        }

        // 注册失败，不能使用路径（会导致打包后找不到）
        // Registration failed, cannot use path (will fail after build)
        console.error(`[AssetField] Cannot use asset without GUID: "${path}". Please ensure the asset is in a managed directory (assets/, scripts/, scenes/).`);
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
