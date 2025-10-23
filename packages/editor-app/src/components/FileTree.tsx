import { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { TauriAPI, DirectoryEntry } from '../api/tauri';
import '../styles/FileTree.css';

interface TreeNode {
  name: string;
  path: string;
  type: 'folder';
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
      const children = entriesToNodes(entries);

      // 创建根节点
      const rootName = path.split(/[/\\]/).filter(p => p).pop() || 'Project';
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
    // 只显示文件夹，过滤掉文件
    return entries
      .filter(entry => entry.is_dir)
      .map(entry => ({
        name: entry.name,
        path: entry.path,
        type: 'folder' as const,
        children: [],
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

  const handleNodeClick = (node: TreeNode) => {
    onSelectFile?.(node.path);
    toggleNode(node.path);
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
          <span className="tree-arrow">
            {node.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className="tree-icon">
            <Folder size={16} />
          </span>
          <span className="tree-label">{node.name}</span>
        </div>
        {node.expanded && node.children && (
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
    return <div className="file-tree empty">No folders</div>;
  }

  return (
    <div className="file-tree">
      {tree.map(node => renderNode(node))}
    </div>
  );
}
