import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Folder, FolderOpen, FolderPlus } from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { ProjectService, IFileSystemService } from '@esengine/editor-core';
import type { IFileSystem } from '@esengine/editor-core';
import './AssetPickerDialog.css';

interface AssetSaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (path: string) => void;
    title?: string;
    defaultFileName?: string;
    fileExtension?: string;  // e.g., '.tilemap.json'
    placeholder?: string;
}

interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}

export function AssetSaveDialog({
    isOpen,
    onClose,
    onSave,
    title = 'Save Asset',
    defaultFileName = 'new-asset',
    fileExtension = '',
    placeholder = 'Search folders...'
}: AssetSaveDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [fileName, setFileName] = useState(defaultFileName);
    const [folders, setFolders] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [projectPath, setProjectPath] = useState('');
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Load project folders
    useEffect(() => {
        if (!isOpen) return;

        const loadFolders = async () => {
            setLoading(true);
            try {
                const projectService = Core.services.tryResolve(ProjectService);
                const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);

                const currentProject = projectService?.getCurrentProject();
                if (projectService && currentProject && fileSystem) {
                    const projPath = currentProject.path;
                    setProjectPath(projPath);
                    const assetsPath = `${projPath}/assets`;

                    // Set default selected folder to assets
                    setSelectedFolder(assetsPath);

                    const buildTree = async (dirPath: string): Promise<FileNode[]> => {
                        const entries = await fileSystem.listDirectory(dirPath);
                        const nodes: FileNode[] = [];

                        for (const entry of entries) {
                            // Only include directories
                            if (entry.isDirectory) {
                                const node: FileNode = {
                                    name: entry.name,
                                    path: entry.path,
                                    isDirectory: true
                                };

                                try {
                                    node.children = await buildTree(entry.path);
                                } catch {
                                    node.children = [];
                                }

                                nodes.push(node);
                            }
                        }

                        // Sort alphabetically
                        return nodes.sort((a, b) => a.name.localeCompare(b.name));
                    };

                    const tree = await buildTree(assetsPath);
                    // Add root assets folder
                    const rootNode: FileNode = {
                        name: 'assets',
                        path: assetsPath,
                        isDirectory: true,
                        children: tree
                    };
                    setFolders([rootNode]);
                    setExpandedFolders(new Set([assetsPath]));
                }
            } catch (error) {
                console.error('Failed to load folders:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFolders();
        setFileName(defaultFileName);
        setSearchTerm('');
    }, [isOpen, defaultFileName]);

    // Filter folders based on search
    const filteredFolders = useMemo(() => {
        if (!searchTerm) return folders;

        const filterNode = (node: FileNode): FileNode | null => {
            const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());

            if (node.children) {
                const filteredChildren = node.children
                    .map(filterNode)
                    .filter((n): n is FileNode => n !== null);

                if (filteredChildren.length > 0 || matchesSearch) {
                    return { ...node, children: filteredChildren };
                }
            }

            return matchesSearch ? node : null;
        };

        return folders
            .map(filterNode)
            .filter((n): n is FileNode => n !== null);
    }, [folders, searchTerm]);

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

    const handleSelectFolder = useCallback((node: FileNode) => {
        setSelectedFolder(node.path);
        if (!expandedFolders.has(node.path)) {
            toggleFolder(node.path);
        }
    }, [expandedFolders, toggleFolder]);

    // Convert absolute path to relative path based on project root
    const toRelativePath = useCallback((absolutePath: string): string => {
        if (projectPath) {
            const normalizedProject = projectPath.replace(/\\/g, '/');
            const normalizedAbsolute = absolutePath.replace(/\\/g, '/');
            if (normalizedAbsolute.startsWith(normalizedProject)) {
                return normalizedAbsolute.substring(normalizedProject.length + 1);
            }
        }
        return absolutePath;
    }, [projectPath]);

    const handleSave = useCallback(() => {
        if (selectedFolder && fileName) {
            // Ensure file has correct extension
            let finalFileName = fileName;
            if (fileExtension && !finalFileName.endsWith(fileExtension)) {
                finalFileName += fileExtension;
            }

            const fullPath = `${selectedFolder}/${finalFileName}`.replace(/\\/g, '/');
            onSave(toRelativePath(fullPath));
            onClose();
        }
    }, [selectedFolder, fileName, fileExtension, onSave, onClose, toRelativePath]);

    const handleCreateFolder = useCallback(async () => {
        if (!selectedFolder || !newFolderName.trim()) return;

        const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);
        if (!fileSystem) return;

        try {
            const newFolderPath = `${selectedFolder}/${newFolderName.trim()}`.replace(/\\/g, '/');
            await fileSystem.createDirectory(newFolderPath);

            // Add new folder to tree
            const addFolderToTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.path === selectedFolder) {
                        const newNode: FileNode = {
                            name: newFolderName.trim(),
                            path: newFolderPath,
                            isDirectory: true,
                            children: []
                        };
                        return {
                            ...node,
                            children: [...(node.children || []), newNode].sort((a, b) => a.name.localeCompare(b.name))
                        };
                    }
                    if (node.children) {
                        return { ...node, children: addFolderToTree(node.children) };
                    }
                    return node;
                });
            };

            setFolders(addFolderToTree(folders));
            setSelectedFolder(newFolderPath);
            setExpandedFolders(prev => new Set([...prev, selectedFolder]));
            setShowNewFolderInput(false);
            setNewFolderName('');
        } catch (error) {
            console.error('Failed to create folder:', error);
        }
    }, [selectedFolder, newFolderName, folders]);

    const renderNode = (node: FileNode, depth: number = 0) => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedFolder === node.path;

        return (
            <div key={node.path}>
                <div
                    className={`asset-picker-item ${isSelected ? 'selected' : ''}`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => handleSelectFolder(node)}
                    onDoubleClick={() => toggleFolder(node.path)}
                >
                    <span className="asset-picker-item__icon">
                        {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                    </span>
                    <span className="asset-picker-item__name">{node.name}</span>
                </div>
                {isExpanded && node.children && (
                    <div className="asset-picker-children">
                        {node.children.map((child) => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const getDisplayPath = () => {
        if (!selectedFolder) return '';
        const relativePath = toRelativePath(selectedFolder);
        let finalFileName = fileName;
        if (fileExtension && !finalFileName.endsWith(fileExtension)) {
            finalFileName += fileExtension;
        }
        return `${relativePath}/${finalFileName}`;
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
                    />
                </div>

                <div className="asset-picker-content">
                    {loading ? (
                        <div className="asset-picker-loading">Loading folders...</div>
                    ) : filteredFolders.length === 0 ? (
                        <div className="asset-picker-empty">No folders found</div>
                    ) : (
                        <div className="asset-picker-tree">
                            {filteredFolders.map((node) => renderNode(node))}
                        </div>
                    )}
                </div>

                {/* New folder input */}
                {showNewFolderInput && (
                    <div className="asset-save-new-folder">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="New folder name"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') {
                                    setShowNewFolderInput(false);
                                    setNewFolderName('');
                                }
                            }}
                        />
                        <button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                            Create
                        </button>
                        <button onClick={() => {
                            setShowNewFolderInput(false);
                            setNewFolderName('');
                        }}>
                            Cancel
                        </button>
                    </div>
                )}

                {/* New folder button */}
                {!showNewFolderInput && selectedFolder && (
                    <div className="asset-save-new-folder-btn">
                        <button onClick={() => setShowNewFolderInput(true)}>
                            <FolderPlus size={14} />
                            New Folder
                        </button>
                    </div>
                )}

                <div className="asset-save-filename">
                    <label>File name:</label>
                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter file name"
                        autoFocus
                    />
                    {fileExtension && (
                        <span className="asset-save-extension">{fileExtension}</span>
                    )}
                </div>

                <div className="asset-picker-footer">
                    <div className="asset-picker-selected">
                        {selectedFolder ? (
                            <span title={getDisplayPath()}>
                                {getDisplayPath()}
                            </span>
                        ) : (
                            <span className="placeholder">Select a folder</span>
                        )}
                    </div>
                    <div className="asset-picker-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn-confirm"
                            onClick={handleSave}
                            disabled={!selectedFolder || !fileName}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
