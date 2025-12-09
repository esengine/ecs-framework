import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Folder, FolderOpen, File, Image, FileText, Music, Video, Database, AlertTriangle } from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { ProjectService, AssetRegistryService, MANAGED_ASSET_DIRECTORIES } from '@esengine/editor-core';
import { TauriFileSystemService } from '../../services/TauriFileSystemService';
import './AssetPickerDialog.css';

interface AssetPickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
    title?: string;
    fileExtensions?: string[];  // e.g., ['.png', '.jpg']
    placeholder?: string;
}

interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
    /** Asset GUID (only for files with registered GUIDs) */
    guid?: string;
    /** Whether this is a root managed directory */
    isRootManaged?: boolean;
}

export function AssetPickerDialog({
    isOpen,
    onClose,
    onSelect,
    title = 'Select Asset',
    fileExtensions = [],
    placeholder = 'Search assets...'
}: AssetPickerDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [assets, setAssets] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);

    // Get AssetRegistryService for GUID lookup
    const assetRegistry = useMemo(() => {
        return Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
    }, []);

    // Load project assets - ONLY from managed directories (assets, scripts, scenes)
    useEffect(() => {
        if (!isOpen) return;

        const loadAssets = async () => {
            setLoading(true);
            try {
                const projectService = Core.services.tryResolve(ProjectService);
                const fileSystem = new TauriFileSystemService();

                const currentProject = projectService?.getCurrentProject();
                if (projectService && currentProject) {
                    const projectPath = currentProject.path;
                    const normalizedProjectPath = projectPath.replace(/\\/g, '/');

                    // 排除的目录名 | Excluded directory names
                    const excludedDirs = new Set([
                        'node_modules', '.git', '.idea', '.vscode', 'dist', 'build',
                        'temp', 'tmp', '.cache', 'coverage', '__pycache__'
                    ]);

                    // Helper to get relative path from absolute path
                    const getRelativePath = (absPath: string): string => {
                        const normalizedAbs = absPath.replace(/\\/g, '/');
                        if (normalizedAbs.startsWith(normalizedProjectPath)) {
                            return normalizedAbs.substring(normalizedProjectPath.length + 1);
                        }
                        return absPath;
                    };

                    const buildTree = async (dirPath: string): Promise<FileNode[]> => {
                        const entries = await fileSystem.listDirectory(dirPath);
                        const nodes: FileNode[] = [];

                        for (const entry of entries) {
                            // 跳过排除的目录 | Skip excluded directories
                            if (entry.isDirectory && excludedDirs.has(entry.name)) {
                                continue;
                            }

                            // 跳过隐藏文件/目录（以.开头，除了当前目录）
                            // Skip hidden files/directories (starting with ., except current dir)
                            if (entry.name.startsWith('.') && entry.name !== '.') {
                                continue;
                            }

                            // Skip .meta files
                            if (entry.name.endsWith('.meta')) {
                                continue;
                            }

                            const node: FileNode = {
                                name: entry.name,
                                path: entry.path,
                                isDirectory: entry.isDirectory
                            };

                            if (entry.isDirectory) {
                                try {
                                    node.children = await buildTree(entry.path);
                                } catch {
                                    node.children = [];
                                }
                            } else {
                                // Try to get GUID for the file
                                if (assetRegistry) {
                                    const relativePath = getRelativePath(entry.path);
                                    const guid = assetRegistry.getGuidByPath(relativePath);
                                    if (guid) {
                                        node.guid = guid;
                                    }
                                }
                            }

                            nodes.push(node);
                        }

                        // Sort: folders first, then files, alphabetically
                        return nodes.sort((a, b) => {
                            if (a.isDirectory && !b.isDirectory) return -1;
                            if (!a.isDirectory && b.isDirectory) return 1;
                            return a.name.localeCompare(b.name);
                        });
                    };

                    // Only load managed directories (assets, scripts, scenes)
                    const sep = projectPath.includes('\\') ? '\\' : '/';
                    const managedNodes: FileNode[] = [];

                    for (const dirName of MANAGED_ASSET_DIRECTORIES) {
                        const dirPath = `${projectPath}${sep}${dirName}`;
                        try {
                            const exists = await fileSystem.exists(dirPath);
                            if (exists) {
                                const children = await buildTree(dirPath);
                                managedNodes.push({
                                    name: dirName,
                                    path: dirPath,
                                    isDirectory: true,
                                    children,
                                    isRootManaged: true
                                });
                            }
                        } catch {
                            // Directory doesn't exist, skip
                        }
                    }

                    setAssets(managedNodes);

                    // Auto-expand managed directories
                    setExpandedFolders(new Set(managedNodes.map(n => n.path)));
                }
            } catch (error) {
                console.error('Failed to load assets:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAssets();
        setSelectedPath(null);
        setSearchTerm('');
    }, [isOpen, assetRegistry]);

    // Filter assets based on search and file extensions
    const filteredAssets = useMemo(() => {
        const filterNode = (node: FileNode): FileNode | null => {
            // Check file extension filter
            if (!node.isDirectory && fileExtensions.length > 0) {
                const hasValidExtension = fileExtensions.some((ext) =>
                    node.name.toLowerCase().endsWith(ext.toLowerCase())
                );
                if (!hasValidExtension) return null;
            }

            // Check search term
            const matchesSearch = !searchTerm ||
                node.name.toLowerCase().includes(searchTerm.toLowerCase());

            if (node.isDirectory && node.children) {
                const filteredChildren = node.children
                    .map(filterNode)
                    .filter((n): n is FileNode => n !== null);

                if (filteredChildren.length > 0 || matchesSearch) {
                    return { ...node, children: filteredChildren };
                }
                return null;
            }

            return matchesSearch ? node : null;
        };

        return assets
            .map(filterNode)
            .filter((n): n is FileNode => n !== null);
    }, [assets, searchTerm, fileExtensions]);

    const toggleFolder = useCallback((path: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    // Track selected node (to check for GUID)
    const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);

    const handleSelect = useCallback((node: FileNode) => {
        if (node.isDirectory) {
            toggleFolder(node.path);
        } else {
            // Only allow selecting files with GUID
            if (node.guid) {
                setSelectedPath(node.path);
                setSelectedNode(node);
            }
            // Files without GUID cannot be selected
        }
    }, [toggleFolder]);

    // Convert absolute path to relative path based on project root
    const toRelativePath = useCallback((absolutePath: string): string => {
        const projectService = Core.services.tryResolve(ProjectService);
        const currentProject = projectService?.getCurrentProject();
        if (currentProject) {
            const projectPath = currentProject.path.replace(/\\/g, '/');
            const normalizedAbsolute = absolutePath.replace(/\\/g, '/');
            if (normalizedAbsolute.startsWith(projectPath)) {
                // Return relative path from project root
                return normalizedAbsolute.substring(projectPath.length + 1);
            }
        }
        return absolutePath;
    }, []);

    const handleConfirm = useCallback(() => {
        if (selectedPath) {
            onSelect(toRelativePath(selectedPath));
            onClose();
        }
    }, [selectedPath, onSelect, onClose, toRelativePath]);

    const handleDoubleClick = useCallback((node: FileNode) => {
        if (!node.isDirectory && node.guid) {
            // Double-click on file with GUID selects it
            onSelect(toRelativePath(node.path));
            onClose();
        } else if (node.isDirectory) {
            // Double-click on folder toggles expansion
            toggleFolder(node.path);
        }
    }, [onSelect, onClose, toRelativePath, toggleFolder]);

    const getFileIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                return <Image size={14} />;
            case 'mp3':
            case 'wav':
            case 'ogg':
                return <Music size={14} />;
            case 'mp4':
            case 'webm':
                return <Video size={14} />;
            case 'json':
            case 'txt':
            case 'md':
                return <FileText size={14} />;
            default:
                return <File size={14} />;
        }
    };

    const renderNode = (node: FileNode, depth: number = 0) => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedPath === node.path;
        const hasGuid = node.isDirectory || !!node.guid;
        const isDisabled = !node.isDirectory && !node.guid;

        return (
            <div key={node.path}>
                <div
                    className={`asset-picker-item ${isSelected ? 'selected' : ''} ${node.isRootManaged ? 'managed-root' : ''} ${isDisabled ? 'disabled' : ''}`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => handleSelect(node)}
                    onDoubleClick={() => handleDoubleClick(node)}
                    title={isDisabled ? 'This file has no GUID and cannot be referenced' : undefined}
                >
                    <span className="asset-picker-item__icon">
                        {node.isDirectory ? (
                            node.isRootManaged ? (
                                <Database size={14} className="managed-icon" />
                            ) : (
                                isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
                            )
                        ) : (
                            getFileIcon(node.name)
                        )}
                    </span>
                    <span className="asset-picker-item__name">{node.name}</span>
                    {node.isRootManaged && (
                        <span className="managed-badge">GUID</span>
                    )}
                    {isDisabled && (
                        <span className="no-guid-badge" title="No GUID - cannot be referenced">
                            <AlertTriangle size={12} />
                        </span>
                    )}
                </div>
                {node.isDirectory && isExpanded && node.children && (
                    <div className="asset-picker-children">
                        {node.children.map((child) => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="asset-picker-overlay" onClick={onClose}>
            <div className="asset-picker-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="asset-picker-header">
                    <h3>{title}</h3>
                    <button className="asset-picker-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="asset-picker-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="asset-picker-content">
                    {loading ? (
                        <div className="asset-picker-loading">Loading assets...</div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="asset-picker-empty">No assets found</div>
                    ) : (
                        <div className="asset-picker-tree">
                            {filteredAssets.map((node) => renderNode(node))}
                        </div>
                    )}
                </div>

                <div className="asset-picker-footer">
                    <div className="asset-picker-selected">
                        {selectedPath ? (
                            <span title={selectedPath}>
                                {selectedPath.split(/[\\/]/).pop()}
                            </span>
                        ) : (
                            <span className="placeholder">No asset selected</span>
                        )}
                    </div>
                    <div className="asset-picker-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn-confirm"
                            onClick={handleConfirm}
                            disabled={!selectedPath}
                        >
                            Select
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
