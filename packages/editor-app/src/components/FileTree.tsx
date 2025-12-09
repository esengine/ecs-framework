import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    Folder, ChevronRight, ChevronDown, File, Edit3, Trash2, FolderOpen, Copy, FileText, FolderPlus, Plus,
    Save, Tag, Link, FileSearch, Globe, Package, Clipboard, RefreshCw, Settings
} from 'lucide-react';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import { MessageHub, FileActionRegistry, AssetRegistryService } from '@esengine/editor-core';
import { SettingsService } from '../services/SettingsService';
import { Core } from '@esengine/ecs-framework';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { PromptDialog } from './PromptDialog';
import { useLocale } from '../hooks/useLocale';
import '../styles/FileTree.css';

/**
 * 根据图标名称获取 Lucide 图标组件
 */
function getIconComponent(iconName: string | undefined, size: number = 16): React.ReactNode {
    if (!iconName) return <Plus size={size} />;
    const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
    const IconComponent = icons[iconName];
    if (IconComponent) {
        return <IconComponent size={size} />;
    }
    return <Plus size={size} />;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: number;
  modified?: number;
  children?: TreeNode[];
  expanded?: boolean;
  loaded?: boolean;
}

interface FileTreeProps {
  rootPath: string | null;
  onSelectFile?: (path: string) => void;
  onSelectFiles?: (paths: string[], modifiers: { ctrlKey: boolean; shiftKey: boolean }) => void;
  selectedPath?: string | null;
  selectedPaths?: Set<string>;
  messageHub?: MessageHub;
  searchQuery?: string;
  showFiles?: boolean;
  onOpenScene?: (scenePath: string) => void;
}

export interface FileTreeHandle {
  collapseAll: () => void;
  refresh: () => void;
  revealPath: (targetPath: string) => Promise<void>;
}

export const FileTree = forwardRef<FileTreeHandle, FileTreeProps>(({ rootPath, onSelectFile, onSelectFiles, selectedPath, selectedPaths, messageHub, searchQuery, showFiles = true, onOpenScene }, ref) => {
    const { t } = useLocale();
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [internalSelectedPath, setInternalSelectedPath] = useState<string | null>(null);
    const [lastSelectedFilePath, setLastSelectedFilePath] = useState<string | null>(null);

    // Flatten visible file nodes for range selection
    const getVisibleFilePaths = (nodes: TreeNode[]): string[] => {
        const paths: string[] = [];
        const traverse = (nodeList: TreeNode[]) => {
            for (const node of nodeList) {
                if (node.type === 'file') {
                    paths.push(node.path);
                } else if (node.type === 'folder' && node.expanded && node.children) {
                    traverse(node.children);
                }
            }
        };
        traverse(nodes);
        return paths;
    };
    const [contextMenu, setContextMenu] = useState<{
        position: { x: number; y: number };
        node: TreeNode | null;
    } | null>(null);
    const [renamingNode, setRenamingNode] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ node: TreeNode } | null>(null);
    const [promptDialog, setPromptDialog] = useState<{
        type: 'create-file' | 'create-folder' | 'create-template';
        parentPath: string;
        templateExtension?: string;
        templateGetContent?: (fileName: string) => string | Promise<string>;
    } | null>(null);
    const [filteredTree, setFilteredTree] = useState<TreeNode[]>([]);
    const fileActionRegistry = Core.services.resolve(FileActionRegistry);

    const collapseAll = () => {
        const collapseNode = (node: TreeNode): TreeNode => {
            if (node.type === 'folder') {
                return {
                    ...node,
                    expanded: false,
                    children: node.children ? node.children.map(collapseNode) : node.children
                };
            }
            return node;
        };

        const collapsedTree = tree.map((node) => collapseNode(node));
        setTree(collapsedTree);
    };

    // Expand tree to reveal a specific file path
    const revealPath = async (targetPath: string) => {
        if (!rootPath) return;

        // Normalize paths to use forward slashes for comparison
        const normalizedTargetPath = targetPath.replace(/\\/g, '/');
        const normalizedRootPath = rootPath.replace(/\\/g, '/');

        if (!normalizedTargetPath.startsWith(normalizedRootPath)) return;

        // Get path segments between root and target
        const relativePath = normalizedTargetPath.substring(normalizedRootPath.length).replace(/^[/\\]/, '');
        const segments = relativePath.split(/[/\\]/);

        // Build list of folder paths to expand
        const pathsToExpand: string[] = [];
        let currentPath = rootPath;
        for (let i = 0; i < segments.length - 1; i++) {
            currentPath = `${currentPath}/${segments[i]}`;
            pathsToExpand.push(currentPath.replace(/\//g, '\\'));
        }

        // Recursively expand nodes and load children
        const expandToPath = async (nodes: TreeNode[], pathSet: Set<string>): Promise<TreeNode[]> => {
            const result: TreeNode[] = [];
            for (const node of nodes) {
                const normalizedPath = node.path.replace(/\//g, '\\');
                if (node.type === 'folder' && pathSet.has(normalizedPath)) {
                    // Load children if not loaded
                    let children = node.children;
                    if (!node.loaded || !children) {
                        try {
                            const entries = await TauriAPI.listDirectory(node.path);
                            children = entries.map((entry: DirectoryEntry) => ({
                                name: entry.name,
                                path: entry.path,
                                type: entry.is_dir ? 'folder' as const : 'file' as const,
                                size: entry.size,
                                modified: entry.modified,
                                expanded: false,
                                loaded: false
                            })).sort((a, b) => {
                                if (a.type === b.type) return a.name.localeCompare(b.name);
                                return a.type === 'folder' ? -1 : 1;
                            });
                        } catch (error) {
                            children = [];
                        }
                    }
                    // Recursively expand children
                    const expandedChildren = await expandToPath(children, pathSet);
                    result.push({
                        ...node,
                        expanded: true,
                        loaded: true,
                        children: expandedChildren
                    });
                } else if (node.type === 'folder' && node.children) {
                    // Keep existing state for non-target folders
                    result.push({
                        ...node,
                        children: await expandToPath(node.children, pathSet)
                    });
                } else {
                    result.push(node);
                }
            }
            return result;
        };

        const pathSet = new Set(pathsToExpand);
        const expandedTree = await expandToPath(tree, pathSet);
        setTree(expandedTree);
        setInternalSelectedPath(targetPath);
    };

    useImperativeHandle(ref, () => ({
        collapseAll,
        refresh: refreshTree,
        revealPath
    }));

    useEffect(() => {
        if (rootPath) {
            loadRootDirectory(rootPath);
        } else {
            setTree([]);
        }
    }, [rootPath]);

    useEffect(() => {
        if (selectedPath) {
            setInternalSelectedPath(selectedPath);
        }
    }, [selectedPath]);

    useEffect(() => {
        const performSearch = async () => {
            const filterByFileType = (nodes: TreeNode[]): TreeNode[] => {
                return nodes
                    .filter((node) => showFiles || node.type === 'folder')
                    .map((node) => ({
                        ...node,
                        children: node.children ? filterByFileType(node.children) : node.children
                    }));
            };

            let result = filterByFileType(tree);

            if (searchQuery && searchQuery.trim()) {
                const query = searchQuery.toLowerCase();

                const loadAndFilterTree = async (nodes: TreeNode[]): Promise<TreeNode[]> => {
                    const filtered: TreeNode[] = [];

                    for (const node of nodes) {
                        const nameMatches = node.name.toLowerCase().includes(query);
                        let filteredChildren: TreeNode[] = [];

                        if (node.type === 'folder') {
                            let childrenToSearch = node.children || [];

                            if (!node.loaded) {
                                try {
                                    const entries = await TauriAPI.listDirectory(node.path);
                                    childrenToSearch = entriesToNodes(entries);
                                } catch (error) {
                                    console.error('Failed to load children for search:', error);
                                }
                            }

                            if (childrenToSearch.length > 0) {
                                filteredChildren = await loadAndFilterTree(childrenToSearch);
                            }
                        }

                        if (nameMatches || filteredChildren.length > 0) {
                            filtered.push({
                                ...node,
                                expanded: filteredChildren.length > 0,
                                loaded: true,
                                children: filteredChildren.length > 0 ? filteredChildren : (node.type === 'folder' ? [] : undefined)
                            });
                        }
                    }

                    return filtered;
                };

                result = await loadAndFilterTree(result);
            }

            setFilteredTree(result);
        };

        performSearch();
    }, [searchQuery, tree, showFiles]);

    const loadRootDirectory = async (path: string) => {
        setLoading(true);
        try {
            const entries = await TauriAPI.listDirectory(path);
            const children = entriesToNodes(entries);

            // 创建根节点
            const rootName = path.split(/[/\\]/).filter((p) => p).pop() || 'Project';
            const rootNode: TreeNode = {
                name: rootName,
                path: path,
                type: 'folder',
                children: children,
                expanded: true,
                loaded: true
            };

            setTree([rootNode]);
        } catch (error) {
            console.error('Failed to load directory:', error);
            setTree([]);
        } finally {
            setLoading(false);
        }
    };

    const entriesToNodes = (entries: DirectoryEntry[]): TreeNode[] => {
        return entries
            .sort((a, b) => {
                if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
                return a.is_dir ? -1 : 1;
            })
            .map((entry) => ({
                name: entry.name,
                path: entry.path,
                type: entry.is_dir ? 'folder' as const : 'file' as const,
                size: entry.size,
                modified: entry.modified,
                children: entry.is_dir ? [] : undefined,
                expanded: false,
                loaded: entry.is_dir ? false : undefined
            }));
    };

    const loadChildren = async (node: TreeNode): Promise<TreeNode[]> => {
        try {
            const entries = await TauriAPI.listDirectory(node.path);
            return entriesToNodes(entries);
        } catch (error) {
            console.error('Failed to load children:', error);
            return [];
        }
    };

    const toggleNode = async (nodePath: string) => {
        const updateTree = async (nodes: TreeNode[]): Promise<TreeNode[]> => {
            const newNodes: TreeNode[] = [];
            for (const node of nodes) {
                if (node.path === nodePath) {
                    if (!node.loaded) {
                        const children = await loadChildren(node);
                        newNodes.push({
                            ...node,
                            expanded: true,
                            loaded: true,
                            children
                        });
                    } else {
                        newNodes.push({
                            ...node,
                            expanded: !node.expanded
                        });
                    }
                } else if (node.children) {
                    newNodes.push({
                        ...node,
                        children: await updateTree(node.children)
                    });
                } else {
                    newNodes.push(node);
                }
            }
            return newNodes;
        };

        const newTree = await updateTree(tree);
        setTree(newTree);
    };

    const refreshTree = async () => {
        if (!rootPath) return;

        // 保存当前展开状态
        const expandedPaths = new Set<string>();
        const collectExpandedPaths = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                if (node.type === 'folder' && node.expanded) {
                    expandedPaths.add(node.path);
                    if (node.children) {
                        collectExpandedPaths(node.children);
                    }
                }
            }
        };
        collectExpandedPaths(tree);

        // 重新加载根目录，获取最新的文件结构
        try {
            const entries = await TauriAPI.listDirectory(rootPath);
            const children = entriesToNodes(entries);

            const rootName = rootPath.split(/[/\\]/).filter((p) => p).pop() || 'Project';
            let rootNode: TreeNode = {
                name: rootName,
                path: rootPath,
                type: 'folder',
                children: children,
                expanded: true,
                loaded: true
            };

            // 恢复展开状态
            if (expandedPaths.size > 0) {
                const restoreExpandedState = async (node: TreeNode): Promise<TreeNode> => {
                    if (node.type === 'folder' && expandedPaths.has(node.path)) {
                        let children = node.children || [];
                        if (!node.loaded && node.children) {
                            children = await loadChildren(node);
                        }
                        const restoredChildren = await Promise.all(
                            children.map((child) => restoreExpandedState(child))
                        );
                        return {
                            ...node,
                            expanded: true,
                            loaded: true,
                            children: restoredChildren
                        };
                    } else if (node.type === 'folder' && node.children) {
                        const restoredChildren = await Promise.all(
                            node.children.map((child) => restoreExpandedState(child))
                        );
                        return {
                            ...node,
                            children: restoredChildren
                        };
                    }
                    return node;
                };

                rootNode = await restoreExpandedState(rootNode);
            }

            setTree([rootNode]);
        } catch (error) {
            console.error('Failed to refresh directory:', error);
        }
    };

    const expandAll = async () => {
        const expandNode = async (node: TreeNode): Promise<TreeNode> => {
            if (node.type === 'folder') {
                let children = node.children || [];

                if (!node.loaded) {
                    try {
                        const entries = await TauriAPI.listDirectory(node.path);
                        children = entriesToNodes(entries);
                    } catch (error) {
                        console.error('Failed to load children:', error);
                        children = [];
                    }
                }

                const expandedChildren = await Promise.all(
                    children.map((child) => expandNode(child))
                );

                return {
                    ...node,
                    expanded: true,
                    loaded: true,
                    children: expandedChildren
                };
            }
            return node;
        };

        const expandedTree = await Promise.all(tree.map((node) => expandNode(node)));
        setTree(expandedTree);
    };

    const handleRename = async (node: TreeNode) => {
        if (!newName || newName === node.name) {
            setRenamingNode(null);
            return;
        }

        const pathParts = node.path.split(/[/\\]/);
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');

        try {
            await TauriAPI.renameFileOrFolder(node.path, newPath);
            await refreshTree();
            setRenamingNode(null);
            setNewName('');
        } catch (error) {
            console.error('Failed to rename:', error);
            alert(`${t('fileTree.renameFailed')}: ${error}`);
        }
    };

    const handleDeleteClick = (node: TreeNode) => {
        setContextMenu(null);
        setDeleteDialog({ node });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog) return;

        const node = deleteDialog.node;
        setDeleteDialog(null);

        try {
            if (node.type === 'folder') {
                await TauriAPI.deleteFolder(node.path);
            } else {
                await TauriAPI.deleteFile(node.path);
            }
            await refreshTree();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert(`${t('fileTree.deleteFailed')}: ${error}`);
        }
    };

    const handleCreateFileClick = (parentPath: string) => {
        setContextMenu(null);
        setPromptDialog({ type: 'create-file', parentPath });
    };

    const handleCreateFolderClick = (parentPath: string) => {
        setContextMenu(null);
        setPromptDialog({ type: 'create-folder', parentPath });
    };

    const handleCreateTemplateFileClick = (parentPath: string, template: any) => {
        setContextMenu(null);
        setPromptDialog({
            type: 'create-template',
            parentPath,
            templateExtension: template.extension,
            templateGetContent: template.getContent
        });
    };

    const handlePromptConfirm = async (value: string) => {
        if (!promptDialog) return;

        const { type, parentPath, templateExtension, templateGetContent } = promptDialog;
        setPromptDialog(null);

        let fileName = value;
        let targetPath = `${parentPath}/${value}`;

        try {
            if (type === 'create-file') {
                await TauriAPI.createFile(targetPath);
            } else if (type === 'create-folder') {
                await TauriAPI.createDirectory(targetPath);
            } else if (type === 'create-template' && templateExtension && templateGetContent) {
                if (!fileName.endsWith(`.${templateExtension}`)) {
                    fileName = `${fileName}.${templateExtension}`;
                    targetPath = `${parentPath}/${fileName}`;
                }
                // 获取内容并通过后端 API 写入文件
                const content = await templateGetContent(fileName);
                await TauriAPI.writeFileContent(targetPath, content);
            }
            await refreshTree();
        } catch (error) {
            console.error(`Failed to ${type}:`, error);
            const errorKey = type === 'create-file' ? 'fileTree.createFileFailed' :
                type === 'create-folder' ? 'fileTree.createFolderFailed' : 'fileTree.createTemplateFailed';
            alert(`${t(errorKey)}: ${error}`);
        }
    };

    const getContextMenuItems = (node: TreeNode | null): ContextMenuItem[] => {
        if (!node) {
            const baseItems: ContextMenuItem[] = [
                {
                    label: t('fileTree.newFile'),
                    icon: <FileText size={16} />,
                    onClick: () => rootPath && handleCreateFileClick(rootPath)
                },
                {
                    label: t('fileTree.newFolder'),
                    icon: <FolderPlus size={16} />,
                    onClick: () => rootPath && handleCreateFolderClick(rootPath)
                }
            ];

            if (fileActionRegistry && rootPath) {
                const templates = fileActionRegistry.getCreationTemplates();
                if (templates.length > 0) {
                    baseItems.push({ label: '', separator: true, onClick: () => {} });
                    for (const template of templates) {
                        baseItems.push({
                            label: template.label,
                            icon: getIconComponent(template.icon, 16),
                            onClick: () => handleCreateTemplateFileClick(rootPath, template)
                        });
                    }
                }
            }

            return baseItems;
        }

        const items: ContextMenuItem[] = [];

        if (node.type === 'file') {
            items.push({
                label: t('fileTree.openFile'),
                icon: <File size={16} />,
                onClick: async () => {
                    try {
                        await TauriAPI.openFileWithSystemApp(node.path);
                    } catch (error) {
                        console.error('Failed to open file:', error);
                    }
                }
            });

            if (fileActionRegistry) {
                const handlers = fileActionRegistry.getHandlersForFile(node.path);
                for (const handler of handlers) {
                    if (handler.getContextMenuItems) {
                        const parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
                        const pluginItems = handler.getContextMenuItems(node.path, parentPath);
                        for (const pluginItem of pluginItems) {
                            items.push({
                                label: pluginItem.label,
                                icon: pluginItem.icon,
                                onClick: () => pluginItem.onClick(node.path, parentPath),
                                disabled: pluginItem.disabled,
                                separator: pluginItem.separator
                            });
                        }
                    }
                }
            }

            items.push({ label: '', separator: true, onClick: () => {} });

            // 文件操作菜单项 | File operation menu items
            items.push({
                label: t('fileTree.save'),
                icon: <Save size={16} />,
                shortcut: 'Ctrl+S',
                onClick: () => {
                    // TODO: 实现保存功能
                    console.log('Save file:', node.path);
                }
            });
        }

        items.push({
            label: t('fileTree.rename'),
            icon: <Edit3 size={16} />,
            shortcut: 'F2',
            onClick: () => {
                setRenamingNode(node.path);
                setNewName(node.name);
            }
        });

        items.push({
            label: t('fileTree.batchRename'),
            icon: <Edit3 size={16} />,
            shortcut: 'Shift+F2',
            disabled: true, // TODO: 实现批量重命名
            onClick: () => {
                console.log('Batch rename');
            }
        });

        items.push({
            label: t('fileTree.duplicate'),
            icon: <Clipboard size={16} />,
            shortcut: 'Ctrl+D',
            onClick: () => {
                // TODO: 实现复制功能
                console.log('Duplicate:', node.path);
            }
        });

        items.push({
            label: t('fileTree.delete'),
            icon: <Trash2 size={16} />,
            shortcut: 'Delete',
            onClick: () => handleDeleteClick(node)
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 资产操作子菜单 | Asset operations submenu
        items.push({
            label: t('fileTree.assetActions'),
            icon: <Settings size={16} />,
            onClick: () => {},
            children: [
                {
                    label: t('fileTree.reimport'),
                    icon: <RefreshCw size={16} />,
                    onClick: () => {
                        console.log('Reimport asset:', node.path);
                    }
                },
                {
                    label: t('fileTree.exportAsset'),
                    icon: <Package size={16} />,
                    onClick: () => {
                        console.log('Export asset:', node.path);
                    }
                },
                { label: '', separator: true, onClick: () => {} },
                {
                    label: t('fileTree.migrateAsset'),
                    icon: <Folder size={16} />,
                    onClick: () => {
                        console.log('Migrate asset:', node.path);
                    }
                }
            ]
        });

        // 资产本地化子菜单 | Asset localization submenu
        items.push({
            label: t('fileTree.assetLocalization'),
            icon: <Globe size={16} />,
            onClick: () => {},
            children: [
                {
                    label: t('fileTree.createLocalizedAsset'),
                    onClick: () => {
                        console.log('Create localized asset:', node.path);
                    }
                },
                {
                    label: t('fileTree.importTranslation'),
                    onClick: () => {
                        console.log('Import translation:', node.path);
                    }
                },
                {
                    label: t('fileTree.exportTranslation'),
                    onClick: () => {
                        console.log('Export translation:', node.path);
                    }
                }
            ]
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 标签和引用 | Tags and references
        items.push({
            label: t('fileTree.manageTags'),
            icon: <Tag size={16} />,
            shortcut: 'Ctrl+T',
            onClick: () => {
                console.log('Manage tags:', node.path);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 路径复制选项 | Path copy options
        items.push({
            label: t('fileTree.copyReference'),
            icon: <Link size={16} />,
            shortcut: 'Ctrl+C',
            onClick: () => {
                navigator.clipboard.writeText(node.path);
            }
        });

        items.push({
            label: t('fileTree.copyObjectPath'),
            icon: <Copy size={16} />,
            shortcut: 'Ctrl+Shift+C',
            onClick: () => {
                // 生成对象路径格式 | Generate object path format
                const objectPath = node.path.replace(/\\/g, '/');
                navigator.clipboard.writeText(objectPath);
            }
        });

        items.push({
            label: t('fileTree.copyPackagePath'),
            icon: <Package size={16} />,
            shortcut: 'Ctrl+Alt+C',
            onClick: () => {
                // 生成包路径格式 | Generate package path format
                const packagePath = '/' + node.path.replace(/\\/g, '/').split('/').slice(-2).join('/');
                navigator.clipboard.writeText(packagePath);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        // 引用查看器 | Reference viewer
        items.push({
            label: t('fileTree.referenceViewer'),
            icon: <FileSearch size={16} />,
            shortcut: 'Alt+Shift+R',
            onClick: () => {
                console.log('Open reference viewer:', node.path);
            }
        });

        items.push({
            label: t('fileTree.sizeMap'),
            icon: <FileSearch size={16} />,
            shortcut: 'Alt+Shift+D',
            onClick: () => {
                console.log('Show size map:', node.path);
            }
        });

        items.push({ label: '', separator: true, onClick: () => {} });

        if (node.type === 'folder') {
            items.push({
                label: t('fileTree.newFile'),
                icon: <FileText size={16} />,
                onClick: () => handleCreateFileClick(node.path)
            });

            items.push({
                label: t('fileTree.newFolder'),
                icon: <FolderPlus size={16} />,
                onClick: () => handleCreateFolderClick(node.path)
            });

            if (fileActionRegistry) {
                const templates = fileActionRegistry.getCreationTemplates();
                if (templates.length > 0) {
                    items.push({ label: '', separator: true, onClick: () => {} });
                    for (const template of templates) {
                        items.push({
                            label: template.label,
                            icon: getIconComponent(template.icon, 16),
                            onClick: () => handleCreateTemplateFileClick(node.path, template)
                        });
                    }
                }
            }

            items.push({ label: '', separator: true, onClick: () => {} });
        }

        items.push({
            label: t('fileTree.showInExplorer'),
            icon: <FolderOpen size={16} />,
            onClick: async () => {
                try {
                    console.log('[FileTree] showInFolder path:', node.path);
                    await TauriAPI.showInFolder(node.path);
                } catch (error) {
                    console.error('Failed to show in folder:', error, 'Path:', node.path);
                }
            }
        });

        return items;
    };

    const handleNodeClick = (node: TreeNode, e: React.MouseEvent) => {
        if (node.type === 'folder') {
            setInternalSelectedPath(node.path);
            onSelectFile?.(node.path);
            toggleNode(node.path);
        } else {
            setInternalSelectedPath(node.path);

            // Support multi-select with Ctrl/Cmd or Shift
            if (onSelectFiles) {
                if (e.shiftKey && lastSelectedFilePath) {
                    // Range select with Shift
                    const treeToUse = searchQuery ? filteredTree : tree;
                    const visiblePaths = getVisibleFilePaths(treeToUse);
                    const lastIndex = visiblePaths.indexOf(lastSelectedFilePath);
                    const currentIndex = visiblePaths.indexOf(node.path);
                    if (lastIndex !== -1 && currentIndex !== -1) {
                        const start = Math.min(lastIndex, currentIndex);
                        const end = Math.max(lastIndex, currentIndex);
                        const rangePaths = visiblePaths.slice(start, end + 1);
                        onSelectFiles(rangePaths, { ctrlKey: false, shiftKey: true });
                    } else {
                        onSelectFiles([node.path], { ctrlKey: false, shiftKey: false });
                        setLastSelectedFilePath(node.path);
                    }
                } else {
                    onSelectFiles([node.path], { ctrlKey: e.ctrlKey || e.metaKey, shiftKey: false });
                    setLastSelectedFilePath(node.path);
                }
            } else {
                setLastSelectedFilePath(node.path);
            }

            const extension = node.name.includes('.') ? node.name.split('.').pop() : undefined;
            messageHub?.publish('asset-file:selected', {
                fileInfo: {
                    name: node.name,
                    path: node.path,
                    extension,
                    size: node.size,
                    modified: node.modified,
                    isDirectory: false
                }
            });
        }
    };

    const handleNodeDoubleClick = async (node: TreeNode) => {
        if (node.type === 'file') {
            // Handle .ecs scene files
            const ext = node.name.split('.').pop()?.toLowerCase();
            if (ext === 'ecs' && onOpenScene) {
                onOpenScene(node.path);
                return;
            }

            // 脚本文件使用配置的编辑器打开
            // Open script files with configured editor
            if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
                const settings = SettingsService.getInstance();
                const editorCommand = settings.getScriptEditorCommand();

                if (editorCommand) {
                    // 使用项目路径，如果没有则使用文件所在目录
                    // Use project path, or file's parent directory if not available
                    const workingDir = rootPath || node.path.substring(0, node.path.lastIndexOf('\\')) || node.path.substring(0, node.path.lastIndexOf('/'));
                    try {
                        await TauriAPI.openWithEditor(workingDir, editorCommand, node.path);
                        return;
                    } catch (error) {
                        console.error('Failed to open with editor:', error);
                        // 如果失败，回退到系统默认应用
                        // Fall back to system default app if failed
                    }
                }
            }

            if (fileActionRegistry) {
                const handled = await fileActionRegistry.handleDoubleClick(node.path);
                if (handled) {
                    return;
                }
            }

            try {
                await TauriAPI.openFileWithSystemApp(node.path);
            } catch (error) {
                console.error('Failed to open file:', error);
            }
        }
    };

    const handleContextMenu = (e: React.MouseEvent, node: TreeNode | null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            position: { x: e.clientX, y: e.clientY },
            node
        });
    };

    const renderNode = (node: TreeNode, level: number = 0) => {
        // Normalize paths for comparison (handle forward/backward slashes)
        const normalizedNodePath = node.path.replace(/\\/g, '/');
        const normalizedInternalPath = internalSelectedPath?.replace(/\\/g, '/');
        const normalizedSelectedPath = selectedPath?.replace(/\\/g, '/');

        // Check if this node is selected, normalizing paths for comparison
        let isSelected = false;
        if (selectedPaths) {
            // Check both original path and normalized path in selectedPaths set
            isSelected = selectedPaths.has(node.path) || selectedPaths.has(normalizedNodePath);
        } else {
            isSelected = (normalizedInternalPath || normalizedSelectedPath) === normalizedNodePath;
        }

        const isRenaming = renamingNode === node.path;
        const indent = level * 16;

        return (
            <div key={node.path}>
                <div
                    className={`tree-node ${isSelected ? 'selected' : ''}`}
                    style={{ paddingLeft: `${indent}px`, cursor: node.type === 'file' ? 'grab' : 'pointer' }}
                    onClick={(e) => !isRenaming && handleNodeClick(node, e)}
                    onDoubleClick={() => !isRenaming && handleNodeDoubleClick(node)}
                    onContextMenu={(e) => handleContextMenu(e, node)}
                    draggable={node.type === 'file' && !isRenaming}
                    onDragStart={(e) => {
                        if (node.type === 'file' && !isRenaming) {
                            e.dataTransfer.effectAllowed = 'copy';

                            // Get all selected files for multi-file drag
                            const selectedFiles = selectedPaths && selectedPaths.has(node.path) && selectedPaths.size > 1
                                ? Array.from(selectedPaths).map((p) => {
                                    const name = p.split(/[/\\]/).pop() || '';
                                    const ext = name.includes('.') ? name.split('.').pop() : '';
                                    return { type: 'file', path: p, name, extension: ext };
                                })
                                : [{
                                    type: 'file',
                                    path: node.path,
                                    name: node.name,
                                    extension: node.name.includes('.') ? node.name.split('.').pop() : ''
                                }];

                            // Set drag data as JSON array for multi-file support
                            e.dataTransfer.setData('application/json', JSON.stringify(selectedFiles));
                            e.dataTransfer.setData('asset-path', node.path);
                            e.dataTransfer.setData('asset-name', node.name);
                            const ext = node.name.includes('.') ? node.name.split('.').pop() : '';
                            e.dataTransfer.setData('asset-extension', ext || '');
                            e.dataTransfer.setData('text/plain', node.path);

                            // Add GUID for new asset reference system
                            const assetRegistry = Core.services.tryResolve(AssetRegistryService) as AssetRegistryService | null;
                            if (assetRegistry) {
                                // Convert absolute path to relative path for GUID lookup
                                const relativePath = assetRegistry.absoluteToRelative(node.path);
                                if (relativePath) {
                                    const guid = assetRegistry.getGuidByPath(relativePath);
                                    if (guid) {
                                        e.dataTransfer.setData('asset-guid', guid);
                                    }
                                }
                            }

                            // 添加视觉反馈
                            e.currentTarget.style.opacity = '0.5';
                        }
                    }}
                    onDragEnd={(e) => {
                        // 恢复透明度
                        e.currentTarget.style.opacity = '1';
                    }}
                >
                    <span className="tree-arrow">
                        {node.type === 'folder' ? (
                            node.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : (
                            <span style={{ width: '14px', display: 'inline-block' }} />
                        )}
                    </span>
                    <span className="tree-icon">
                        {node.type === 'folder' ? (
                            node.name.toLowerCase() === 'plugins' || node.name.toLowerCase() === '.ecs' ? (
                                <Folder size={16} className="system-folder-icon" style={{ color: '#42a5f5' }} />
                            ) : (
                                <Folder size={16} style={{ color: '#ffa726' }} />
                            )
                        ) : (
                            <File size={16} style={{ color: '#90caf9' }} />
                        )}
                    </span>
                    {isRenaming ? (
                        <input
                            type="text"
                            className="tree-rename-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => handleRename(node)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRename(node);
                                } else if (e.key === 'Escape') {
                                    setRenamingNode(null);
                                }
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="tree-label">{node.name}</span>
                    )}
                </div>
                {node.type === 'folder' && node.expanded && node.children && (
                    <div className="tree-children">
                        {node.children.map((child) => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="file-tree loading">{t('fileTree.loading')}</div>;
    }

    if (!rootPath || tree.length === 0) {
        return <div className="file-tree empty">{t('fileTree.noFolders')}</div>;
    }

    return (
        <>
            <div
                className="file-tree"
                onContextMenu={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.classList.contains('file-tree')) {
                        handleContextMenu(e, null);
                    }
                }}
            >
                {filteredTree.map((node) => renderNode(node))}
            </div>
            {contextMenu && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.node)}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                />
            )}
            {deleteDialog && (
                <ConfirmDialog
                    title={t('fileTree.confirmDelete')}
                    message={
                        deleteDialog.node.type === 'folder'
                            ? t('fileTree.confirmDeleteFolder', { name: deleteDialog.node.name })
                            : t('fileTree.confirmDeleteFile', { name: deleteDialog.node.name })
                    }
                    confirmText={t('fileTree.delete')}
                    cancelText={t('fileTree.cancel')}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteDialog(null)}
                />
            )}
            {promptDialog && (
                <PromptDialog
                    title={
                        promptDialog.type === 'create-file' ? t('fileTree.newFileTitle') :
                            promptDialog.type === 'create-folder' ? t('fileTree.newFolderTitle') :
                                t('fileTree.newFileTitle')
                    }
                    message={
                        promptDialog.type === 'create-file' ? t('fileTree.enterFileName') :
                            promptDialog.type === 'create-folder' ? t('fileTree.enterFolderName') :
                                t('fileTree.enterTemplateFileName', { ext: promptDialog.templateExtension || '' })
                    }
                    placeholder={
                        promptDialog.type === 'create-file' ? t('fileTree.fileNamePlaceholder') :
                            promptDialog.type === 'create-folder' ? t('fileTree.folderNamePlaceholder') :
                                t('fileTree.templateNamePlaceholder')
                    }
                    confirmText={t('fileTree.create')}
                    cancelText={t('fileTree.cancel')}
                    onConfirm={handlePromptConfirm}
                    onCancel={() => setPromptDialog(null)}
                />
            )}
        </>
    );
});
