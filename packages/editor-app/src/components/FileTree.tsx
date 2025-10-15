import { useState, useEffect } from 'react';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import '../styles/FileTree.css';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: TreeNode[];
  expanded?: boolean;
  loaded?: boolean;
}

interface FileTreeProps {
  rootPath: string | null;
  onSelectFile?: (path: string) => void;
  selectedPath?: string | null;
}

export function FileTree({ rootPath, onSelectFile, selectedPath }: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rootPath) {
      loadRootDirectory(rootPath);
    } else {
      setTree([]);
    }
  }, [rootPath]);

  const loadRootDirectory = async (path: string) => {
    setLoading(true);
    try {
      const entries = await TauriAPI.listDirectory(path);
      const nodes = entriesToNodes(entries);
      setTree(nodes);
    } catch (error) {
      console.error('Failed to load directory:', error);
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  const entriesToNodes = (entries: DirectoryEntry[]): TreeNode[] => {
    return entries.map(entry => ({
      name: entry.name,
      path: entry.path,
      type: entry.is_dir ? 'folder' : 'file',
      extension: !entry.is_dir && entry.name.includes('.')
        ? entry.name.split('.').pop()
        : undefined,
      children: entry.is_dir ? [] : undefined,
      expanded: false,
      loaded: false
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
        if (node.path === nodePath && node.type === 'folder') {
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

  const handleNodeClick = (node: TreeNode) => {
    onSelectFile?.(node.path);
    if (node.type === 'folder') {
      toggleNode(node.path);
    }
  };

  const getFileIcon = (extension?: string) => {
    switch (extension?.toLowerCase()) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return '📄';
      case 'json':
        return '📋';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isSelected = selectedPath === node.path;
    const indent = level * 16;

    return (
      <div key={node.path}>
        <div
          className={`tree-node ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {node.type === 'folder' && (
            <span className="tree-arrow">
              {node.expanded ? '▼' : '▶'}
            </span>
          )}
          <span className="tree-icon">
            {node.type === 'folder' ? '📁' : getFileIcon(node.extension)}
          </span>
          <span className="tree-label">{node.name}</span>
        </div>
        {node.type === 'folder' && node.expanded && node.children && (
          <div className="tree-children">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="file-tree loading">Loading...</div>;
  }

  if (!rootPath || tree.length === 0) {
    return <div className="file-tree empty">No files</div>;
  }

  return (
    <div className="file-tree">
      {tree.map(node => renderNode(node))}
    </div>
  );
}
