import { useState, useEffect, useCallback } from 'react';
import { Folder, File as FileIcon, Image as ImageIcon, Clock, HardDrive, Settings2 } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Core } from '@esengine/ecs-framework';
import { AssetRegistryService } from '@esengine/editor-core';
import { assetManager as globalAssetManager } from '@esengine/asset-system';
import { AssetFileInfo } from '../types';
import { ImagePreview, CodePreview, getLanguageFromExtension } from '../common';
import '../../../styles/EntityInspector.css';

interface AssetFileInspectorProps {
    fileInfo: AssetFileInfo;
    content?: string;
    isImage?: boolean;
}

/**
 * Built-in loader types (always available)
 * 内置加载器类型（始终可用）
 */
const BUILTIN_LOADER_TYPES = [
    'texture',
    'audio',
    'json',
    'text',
    'binary'
];

function formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatDate(timestamp?: number): string {
    if (!timestamp) return '未知';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function AssetFileInspector({ fileInfo, content, isImage }: AssetFileInspectorProps) {
    const IconComponent = fileInfo.isDirectory ? Folder : isImage ? ImageIcon : FileIcon;
    const iconColor = fileInfo.isDirectory ? '#dcb67a' : isImage ? '#a78bfa' : '#90caf9';

    // State for loader type selector
    const [currentLoaderType, setCurrentLoaderType] = useState<string | null>(null);
    const [availableLoaderTypes, setAvailableLoaderTypes] = useState<string[]>([]);
    const [detectedType, setDetectedType] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Load meta info and available loader types
    useEffect(() => {
        if (fileInfo.isDirectory) return;

        const loadMetaInfo = async () => {
            try {
                const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
                if (!assetRegistry?.isReady) return;

                const metaManager = assetRegistry.metaManager;
                const meta = await metaManager.getOrCreateMeta(fileInfo.path);

                // Get current loader type from meta
                setCurrentLoaderType(meta.loaderType || null);
                setDetectedType(meta.type);

                // Get available loader types from assetManager
                const loaderFactory = globalAssetManager.getLoaderFactory();
                const registeredTypes = loaderFactory?.getRegisteredTypes() || [];

                // Combine built-in types with registered types (deduplicated)
                const allTypes = new Set([...BUILTIN_LOADER_TYPES, ...registeredTypes]);
                setAvailableLoaderTypes(Array.from(allTypes).sort());
            } catch (error) {
                console.warn('Failed to load meta info:', error);
            }
        };

        loadMetaInfo();
    }, [fileInfo.path, fileInfo.isDirectory]);

    // Handle loader type change
    const handleLoaderTypeChange = useCallback(async (newType: string) => {
        if (fileInfo.isDirectory || isUpdating) return;

        setIsUpdating(true);
        try {
            const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
            if (!assetRegistry?.isReady) return;

            const metaManager = assetRegistry.metaManager;

            // Update meta with new loader type
            // Empty string means use auto-detection (remove override)
            const loaderType = newType === '' ? undefined : newType;
            await metaManager.updateMeta(fileInfo.path, { loaderType });

            setCurrentLoaderType(loaderType || null);
            console.log(`[AssetFileInspector] Updated loader type for ${fileInfo.name}: ${loaderType || '(auto)'}`);
        } catch (error) {
            console.error('Failed to update loader type:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [fileInfo.path, fileInfo.name, fileInfo.isDirectory, isUpdating]);

    return (
        <div className="entity-inspector">
            <div className="inspector-header">
                <IconComponent size={16} style={{ color: iconColor }} />
                <span className="entity-name">{fileInfo.name}</span>
            </div>

            <div className="inspector-content">
                <div className="inspector-section">
                    <div className="section-title">文件信息</div>
                    <div className="property-field">
                        <label className="property-label">类型</label>
                        <span className="property-value-text">
                            {fileInfo.isDirectory
                                ? '文件夹'
                                : fileInfo.extension
                                    ? `.${fileInfo.extension}`
                                    : '文件'}
                        </span>
                    </div>
                    {fileInfo.size !== undefined && !fileInfo.isDirectory && (
                        <div className="property-field">
                            <label className="property-label">
                                <HardDrive size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                大小
                            </label>
                            <span className="property-value-text">{formatFileSize(fileInfo.size)}</span>
                        </div>
                    )}
                    {fileInfo.modified !== undefined && (
                        <div className="property-field">
                            <label className="property-label">
                                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                修改时间
                            </label>
                            <span className="property-value-text">{formatDate(fileInfo.modified)}</span>
                        </div>
                    )}
                    <div className="property-field">
                        <label className="property-label">路径</label>
                        <span
                            className="property-value-text"
                            style={{
                                fontFamily: 'Consolas, Monaco, monospace',
                                fontSize: '11px',
                                color: '#666',
                                wordBreak: 'break-all'
                            }}
                        >
                            {fileInfo.path}
                        </span>
                    </div>
                </div>

                {/* Loader Type Section - only for files, not directories */}
                {!fileInfo.isDirectory && availableLoaderTypes.length > 0 && (
                    <div className="inspector-section">
                        <div className="section-title">
                            <Settings2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            加载设置
                        </div>
                        <div className="property-field">
                            <label className="property-label">加载器类型</label>
                            <select
                                className="property-select"
                                value={currentLoaderType || ''}
                                onChange={(e) => handleLoaderTypeChange(e.target.value)}
                                disabled={isUpdating}
                                style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    borderRadius: '4px',
                                    border: '1px solid #444',
                                    backgroundColor: '#2a2a2a',
                                    color: '#e0e0e0',
                                    cursor: isUpdating ? 'wait' : 'pointer'
                                }}
                            >
                                <option value="">
                                    自动检测 {detectedType ? `(${detectedType})` : ''}
                                </option>
                                {availableLoaderTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {currentLoaderType && (
                            <div
                                style={{
                                    marginTop: '4px',
                                    fontSize: '11px',
                                    color: '#888',
                                    fontStyle: 'italic'
                                }}
                            >
                                已覆盖自动检测，使用 "{currentLoaderType}" 加载器
                            </div>
                        )}
                    </div>
                )}

                {isImage && (
                    <div className="inspector-section">
                        <div className="section-title">图片预览</div>
                        <ImagePreview src={convertFileSrc(fileInfo.path)} alt={fileInfo.name} />
                    </div>
                )}

                {content && (
                    <div className="inspector-section code-preview-section">
                        <div className="section-title">文件预览</div>
                        <CodePreview
                            content={content}
                            language={getLanguageFromExtension(fileInfo.extension)}
                            height="100%"
                        />
                    </div>
                )}

                {!content && !isImage && !fileInfo.isDirectory && (
                    <div className="inspector-section">
                        <div
                            style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '13px'
                            }}
                        >
                            此文件类型不支持预览
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
