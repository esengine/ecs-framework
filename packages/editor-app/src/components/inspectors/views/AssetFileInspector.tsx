import { Folder, File as FileIcon, Image as ImageIcon, Clock, HardDrive } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { AssetFileInfo } from '../types';
import { ImagePreview } from '../common';
import '../../../styles/EntityInspector.css';

interface AssetFileInspectorProps {
    fileInfo: AssetFileInfo;
    content?: string;
    isImage?: boolean;
}

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

                {isImage && (
                    <div className="inspector-section">
                        <div className="section-title">图片预览</div>
                        <ImagePreview src={convertFileSrc(fileInfo.path)} alt={fileInfo.name} />
                    </div>
                )}

                {content && (
                    <div className="inspector-section">
                        <div className="section-title">文件预览</div>
                        <div className="file-preview-content">{content}</div>
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
