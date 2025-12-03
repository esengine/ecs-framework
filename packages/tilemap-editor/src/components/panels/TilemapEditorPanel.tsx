/**
 * Tilemap Editor Panel - Main editing panel with 3-column layout
 * Tilemap 编辑器面板 - 三栏布局的主编辑面板
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Grid3x3,
    Eye,
    EyeOff,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Save,
    X,
    Search,
    Folder,
    FolderOpen,
    File,
    Image as ImageIcon,
    AlertTriangle,
    Box,
    Map
} from 'lucide-react';
import { Core } from '@esengine/ecs-framework';
import { MessageHub, ProjectService, IFileSystemService, type IFileSystem, type IDialog } from '@esengine/editor-core';
import { TilemapComponent, type ITilesetData, type ResizeAnchor } from '@esengine/tilemap';
import { useTilemapEditorStore, type TilemapToolType, type LayerState } from '../../stores/TilemapEditorStore';
import { TilemapCanvas } from '../TilemapCanvas';
import { TileSetSelectorPanel } from './TileSetSelectorPanel';
import { TilemapDetailsPanel } from './TilemapDetailsPanel';
import '../../styles/TilemapEditor.css';

// Asset Picker Dialog component
interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}

interface AssetPickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
    title?: string;
    fileExtensions?: string[];
}

function AssetPickerDialog({
    isOpen,
    onClose,
    onSelect,
    title = '选择资产',
    fileExtensions = []
}: AssetPickerDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [assets, setAssets] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewPath, setPreviewPath] = useState<string | null>(null);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);

    const isImageFile = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
    };

    const handleMouseEnter = (e: React.MouseEvent, node: FileNode) => {
        if (!node.isDirectory && isImageFile(node.name)) {
            const rect = e.currentTarget.getBoundingClientRect();
            setPreviewPosition({ x: rect.right + 10, y: rect.top - 50 });
            setPreviewPath(node.path);

            const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
            if (fileSystem) {
                const assetUrl = fileSystem.convertToAssetUrl(node.path);
                setPreviewSrc(assetUrl);
            }
        }
    };

    const handleMouseLeave = () => {
        setPreviewPath(null);
        setPreviewSrc(null);
    };

    useEffect(() => {
        if (!isOpen) return;

        const loadAssets = async () => {
            setLoading(true);
            try {
                const projectService = Core.services.tryResolve(ProjectService);
                const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;

                const currentProject = projectService?.getCurrentProject();
                if (projectService && currentProject && fileSystem) {
                    const projectPath = currentProject.path.replace(/\//g, '\\');
                    const assetsPath = `${projectPath}\\assets`;

                    const buildTree = async (dirPath: string): Promise<FileNode[]> => {
                        const entries = await fileSystem.listDirectory(dirPath);
                        const nodes: FileNode[] = [];

                        for (const entry of entries) {
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
                            }

                            nodes.push(node);
                        }

                        return nodes.sort((a, b) => {
                            if (a.isDirectory && !b.isDirectory) return -1;
                            if (!a.isDirectory && b.isDirectory) return 1;
                            return a.name.localeCompare(b.name);
                        });
                    };

                    const tree = await buildTree(assetsPath);
                    setAssets(tree);
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
    }, [isOpen]);

    const filterNode = useCallback((node: FileNode): FileNode | null => {
        if (!node.isDirectory && fileExtensions.length > 0) {
            const hasValidExtension = fileExtensions.some((ext) =>
                node.name.toLowerCase().endsWith(ext.toLowerCase())
            );
            if (!hasValidExtension) return null;
        }

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
    }, [searchTerm, fileExtensions]);

    const filteredAssets = assets
        .map(filterNode)
        .filter((n): n is FileNode => n !== null);

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

    const handleSelect = useCallback((node: FileNode) => {
        if (node.isDirectory) {
            toggleFolder(node.path);
        } else {
            setSelectedPath(node.path);
        }
    }, [toggleFolder]);

    const toRelativePath = useCallback((absolutePath: string): string => {
        const projectService = Core.services.tryResolve(ProjectService);
        const currentProject = projectService?.getCurrentProject();
        if (currentProject) {
            const projectPath = currentProject.path.replace(/\\/g, '/');
            const normalizedAbsolute = absolutePath.replace(/\\/g, '/');
            if (normalizedAbsolute.startsWith(projectPath)) {
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
        if (!node.isDirectory) {
            onSelect(toRelativePath(node.path));
            onClose();
        }
    }, [onSelect, onClose, toRelativePath]);

    const getFileIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                return <ImageIcon size={14} />;
            default:
                return <File size={14} />;
        }
    };

    const renderNode = (node: FileNode, depth: number = 0) => {
        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedPath === node.path;

        return (
            <div key={node.path}>
                <div
                    className={`asset-picker-item ${isSelected ? 'selected' : ''}`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => handleSelect(node)}
                    onDoubleClick={() => handleDoubleClick(node)}
                    onMouseEnter={(e) => handleMouseEnter(e, node)}
                    onMouseLeave={handleMouseLeave}
                >
                    <span className="asset-picker-item-icon">
                        {node.isDirectory ? (
                            isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
                        ) : (
                            getFileIcon(node.name)
                        )}
                    </span>
                    <span className="asset-picker-item-name">{node.name}</span>
                </div>
                {node.isDirectory && isExpanded && node.children && (
                    <div>
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
                        placeholder="搜索资产..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="asset-picker-content">
                    {loading ? (
                        <div className="asset-picker-loading">加载资产中...</div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="asset-picker-empty">未找到资产</div>
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
                            <span className="placeholder">未选择资产</span>
                        )}
                    </div>
                    <div className="asset-picker-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            取消
                        </button>
                        <button
                            className="btn-confirm"
                            onClick={handleConfirm}
                            disabled={!selectedPath}
                        >
                            选择
                        </button>
                    </div>
                </div>

                {previewPath && previewSrc && (
                    <div
                        className="asset-picker-preview"
                        style={{
                            left: previewPosition.x,
                            top: previewPosition.y
                        }}
                    >
                        <img
                            src={previewSrc}
                            alt="Preview"
                            style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Resize Map Dialog component
interface ResizeMapDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (width: number, height: number, anchor: ResizeAnchor) => void;
    currentWidth: number;
    currentHeight: number;
}

function ResizeMapDialog({
    isOpen,
    onClose,
    onConfirm,
    currentWidth,
    currentHeight
}: ResizeMapDialogProps) {
    const [newWidth, setNewWidth] = useState(currentWidth);
    const [newHeight, setNewHeight] = useState(currentHeight);
    const [anchor, setAnchor] = useState<ResizeAnchor>('bottom-left');

    useEffect(() => {
        if (isOpen) {
            setNewWidth(currentWidth);
            setNewHeight(currentHeight);
        }
    }, [isOpen, currentWidth, currentHeight]);

    if (!isOpen) return null;

    const anchorPositions: ResizeAnchor[] = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];

    const handleConfirm = () => {
        if (newWidth > 0 && newHeight > 0) {
            onConfirm(newWidth, newHeight, anchor);
            onClose();
        }
    };

    return (
        <div className="asset-picker-overlay" onClick={onClose}>
            <div className="asset-picker-dialog resize-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '320px' }}>
                <div className="asset-picker-header">
                    <h3>调整地图大小</h3>
                    <button className="asset-picker-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="resize-dialog-content" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#888' }}>
                                宽度 (瓦片)
                            </label>
                            <input
                                type="number"
                                value={newWidth}
                                onChange={(e) => setNewWidth(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1e1e1e',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    color: '#e0e0e0'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#888' }}>
                                高度 (瓦片)
                            </label>
                            <input
                                type="number"
                                value={newHeight}
                                onChange={(e) => setNewHeight(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#1e1e1e',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    color: '#e0e0e0'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#888' }}>
                            锚点位置
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '4px',
                            width: '120px',
                            margin: '0 auto'
                        }}>
                            {anchorPositions.map((pos) => (
                                <button
                                    key={pos}
                                    onClick={() => setAnchor(pos)}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        backgroundColor: anchor === pos ? '#0078d4' : '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title={pos}
                                >
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        backgroundColor: anchor === pos ? '#fff' : '#666',
                                        borderRadius: '50%'
                                    }} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="asset-picker-footer">
                    <div className="asset-picker-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            取消
                        </button>
                        <button
                            className="btn-confirm"
                            onClick={handleConfirm}
                            disabled={newWidth === currentWidth && newHeight === currentHeight}
                        >
                            调整大小
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to convert file path to URL
function convertFileSrc(path: string): string {
    const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
    if (fileSystem) {
        return fileSystem.convertToAssetUrl(path);
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return path;
}

interface TilemapEditorPanelProps {
    projectPath?: string | null;
    messageHub?: MessageHub;
}

// Resizable Panel Divider Component
interface PanelDividerProps {
    onDrag: (delta: number) => void;
    direction: 'horizontal' | 'vertical';
}

const PanelDivider: React.FC<PanelDividerProps> = ({ onDrag, direction }) => {
    const isDraggingRef = useRef(false);
    const lastPosRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        lastPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
            const delta = currentPos - lastPosRef.current;
            lastPosRef.current = currentPos;
            onDrag(delta);
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`panel-divider ${direction}`}
            onMouseDown={handleMouseDown}
        />
    );
};

export const TilemapEditorPanel: React.FC<TilemapEditorPanelProps> = ({ messageHub: propMessageHub }) => {
    const [tilemap, setTilemap] = useState<TilemapComponent | null>(null);
    const [_entity, setEntity] = useState<unknown>(null);

    // Panel widths for resizable layout - smaller defaults to give viewport more space
    const [leftPanelWidth, setLeftPanelWidth] = useState(180);
    const [rightPanelWidth, setRightPanelWidth] = useState(220);

    const handleLeftDividerDrag = useCallback((delta: number) => {
        setLeftPanelWidth(prev => Math.max(120, Math.min(350, prev + delta)));
    }, []);

    const handleRightDividerDrag = useCallback((delta: number) => {
        setRightPanelWidth(prev => Math.max(180, Math.min(400, prev - delta)));
    }, []);
    const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);
    const [tilemapKey, setTilemapKey] = useState('');
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [showResizeDialog, setShowResizeDialog] = useState(false);
    const [activeTilesetIndex, setActiveTilesetIndex] = useState(0);
    // Material picker state
    const [showMaterialPicker, setShowMaterialPicker] = useState(false);
    const [materialPickerLayerIndex, setMaterialPickerLayerIndex] = useState(0);

    const messageHub = propMessageHub || Core.services.resolve(MessageHub);

    const {
        entityId,
        pendingFilePath,
        currentFilePath,
        zoom,
        showGrid,
        showCollision,
        tileHeight,
        tilesetImageUrl,
        tilesetColumns,
        tilesetRows,
        setEntityId,
        setPendingFilePath,
        setCurrentFilePath,
        setZoom,
        setShowGrid,
        setShowCollision,
        setPan,
        setTileset,
        setLayers,
        setCurrentLayer,
        currentLayer,
        undo,
        redo
    } = useTilemapEditorStore();

    // Load tileset from component (defined early for use in effects)
    const loadTilesetFromComponent = useCallback((tilemapComp: TilemapComponent) => {
        const tilesetRef = tilemapComp.tilesets[activeTilesetIndex];
        if (!tilesetRef) {
            setTileset(null, 0, 0, tilemapComp.tileWidth, tilemapComp.tileHeight);
            return;
        }

        const tilesetPath = tilesetRef.source;

        const projectService = Core.services.tryResolve(ProjectService);
        const currentProject = projectService?.getCurrentProject();
        let absolutePath = tilesetPath;
        if (currentProject && !tilesetPath.startsWith('/') && !tilesetPath.match(/^[a-zA-Z]:/)) {
            const projectPath = currentProject.path.replace(/\\/g, '/');
            absolutePath = `${projectPath}/${tilesetPath}`.replace(/\\/g, '/');
        }

        const imageUrl = convertFileSrc(absolutePath);

        if (tilesetRef.data) {
            const tilesetData = tilesetRef.data;
            setTileset(imageUrl, tilesetData.columns, tilesetData.rows, tilesetData.tileWidth, tilesetData.tileHeight);
        } else {
            const img = new Image();
            img.onload = () => {
                const columns = Math.floor(img.width / tilemapComp.tileWidth);
                const rows = Math.floor(img.height / tilemapComp.tileHeight);

                const tilesetData: ITilesetData = {
                    name: 'tileset',
                    version: 1,
                    image: tilesetPath,
                    imageWidth: img.width,
                    imageHeight: img.height,
                    tileWidth: tilemapComp.tileWidth,
                    tileHeight: tilemapComp.tileHeight,
                    tileCount: columns * rows,
                    columns,
                    rows
                };
                tilemapComp.setTilesetData(activeTilesetIndex, tilesetData);
                setTileset(imageUrl, columns, rows, tilemapComp.tileWidth, tilemapComp.tileHeight);
            };
            img.onerror = () => {
                setTileset(null, 0, 0, tilemapComp.tileWidth, tilemapComp.tileHeight);
            };
            img.src = imageUrl;
        }
    }, [activeTilesetIndex, setTileset]);

    // Load file from pendingFilePath on mount (for file-based editing via double-click)
    useEffect(() => {
        if (!pendingFilePath) return;

        const loadTilemapFile = async () => {
            try {
                const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
                if (!fileSystem) {
                    console.error('[TilemapEditorPanel] FileSystem service not available');
                    return;
                }

                // Clear entity-based editing state
                setEntityId('');
                setEntity(null);

                // Load tilemap data from file
                const content = await fileSystem.readFile(pendingFilePath);
                const tilemapData = JSON.parse(content);

                // Create a standalone TilemapComponent
                const tilemapComp = new TilemapComponent();
                tilemapComp.applyTilemapData(tilemapData);
                tilemapComp.tilemapAssetGuid = pendingFilePath;

                setCurrentFilePath(pendingFilePath);
                setTilemap(tilemapComp);

                // Load tileset
                loadTilesetFromComponent(tilemapComp);

                // Set up layers
                const layerStates: LayerState[] = tilemapComp.layers.map((layer) => ({
                    id: layer.id,
                    name: layer.name,
                    visible: layer.visible,
                    locked: false,
                    opacity: layer.opacity,
                    color: layer.color ?? '#ffffff',
                    hiddenInGame: layer.hiddenInGame ?? false
                }));
                setLayers(layerStates);
                setCurrentLayer(0);

                setTilemapKey(`file-${Date.now()}`);

                // Clear pending file after loading
                setPendingFilePath(null);

                console.log('[TilemapEditorPanel] Loaded tilemap from file:', pendingFilePath);
            } catch (error) {
                console.error('[TilemapEditorPanel] Failed to load tilemap file:', error);
                setPendingFilePath(null);
                messageHub?.publish('notification:show', {
                    type: 'error',
                    message: `Failed to load tilemap: ${error instanceof Error ? error.message : String(error)}`,
                    duration: 3000
                });
            }
        };

        loadTilemapFile();
    }, [pendingFilePath, setEntityId, setCurrentFilePath, setPendingFilePath, setLayers, setCurrentLayer, loadTilesetFromComponent, messageHub]);

    // Listen for tilemap edit requests (entity-based)
    useEffect(() => {
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('tilemap:edit', (data: { entityId: string }) => {
            // Clear file-based editing state when switching to entity mode
            setCurrentFilePath(null);
            setEntityId(data.entityId);
        });

        return unsubscribe;
    }, [messageHub, setEntityId, setCurrentFilePath]);

    // Load tilemap component when entityId changes
    useEffect(() => {
        if (!entityId) {
            // Don't clear tilemap if we're in file-based editing mode
            if (!currentFilePath) {
                setTilemap(null);
                setEntity(null);
            }
            return;
        }

        const scene = Core.scene;
        if (!scene) return;

        const foundEntity = scene.findEntityById(parseInt(entityId, 10));
        if (!foundEntity) return;

        const tilemapComp = foundEntity.getComponent(TilemapComponent);
        if (!tilemapComp) return;

        setEntity(foundEntity);
        setTilemap(tilemapComp);
        loadTilesetFromComponent(tilemapComp);

        const layerStates: LayerState[] = tilemapComp.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity,
            color: layer.color ?? '#ffffff',
            hiddenInGame: layer.hiddenInGame ?? false
        }));
        setLayers(layerStates);
        setCurrentLayer(0);
    }, [entityId, currentFilePath, loadTilesetFromComponent, setLayers, setCurrentLayer]);

    // Listen for scene modifications
    useEffect(() => {
        if (!messageHub || !tilemap) return;

        const unsubscribeModified = messageHub.subscribe('scene:modified', () => {
            loadTilesetFromComponent(tilemap);
        });

        const unsubscribeRestored = messageHub.subscribe('scene:restored', () => {
            if (!entityId) return;
            const scene = Core.scene;
            if (!scene) return;

            const foundEntity = scene.findEntityById(parseInt(entityId, 10));
            if (!foundEntity) return;

            const newTilemap = foundEntity.getComponent(TilemapComponent);
            if (!newTilemap) return;

            setTilemap(newTilemap);
            loadTilesetFromComponent(newTilemap);
        });

        return () => {
            unsubscribeModified();
            unsubscribeRestored();
        };
    }, [messageHub, tilemap, entityId, loadTilesetFromComponent]);

    // Load tileset image
    useEffect(() => {
        if (!tilesetImageUrl) {
            setTilesetImage(null);
            return;
        }

        const img = new Image();
        img.onload = () => setTilesetImage(img);
        img.src = tilesetImageUrl;
    }, [tilesetImageUrl]);

    const handleTilemapChange = useCallback(() => {
        messageHub?.publish('scene:modified', {});
    }, [messageHub]);

    // Handle tile animation change from animation editor
    const handleTileAnimationChange = useCallback((tileId: number, animation: import('@esengine/tilemap').ITileAnimation | null) => {
        if (!tilemap) return;

        const tilesetRef = tilemap.tilesets[activeTilesetIndex];
        if (!tilesetRef?.data) return;

        // Ensure tiles array exists
        if (!tilesetRef.data.tiles) {
            tilesetRef.data.tiles = [];
        }

        // Find or create tile metadata
        let tileMetadata = tilesetRef.data.tiles.find(t => t.id === tileId);
        if (!tileMetadata) {
            tileMetadata = { id: tileId };
            tilesetRef.data.tiles.push(tileMetadata);
        }

        // Update animation
        if (animation) {
            tileMetadata.animation = animation;
        } else {
            delete tileMetadata.animation;
            // Remove empty tile metadata
            if (!tileMetadata.type && !tileMetadata.properties) {
                const index = tilesetRef.data.tiles.indexOf(tileMetadata);
                if (index >= 0) {
                    tilesetRef.data.tiles.splice(index, 1);
                }
            }
        }

        handleTilemapChange();
    }, [tilemap, activeTilesetIndex, handleTilemapChange]);

    // Get active tileset data for animation editor
    const activeTilesetData = tilemap?.tilesets[activeTilesetIndex]?.data;

    const handleSaveTilemap = useCallback(async () => {
        if (!tilemap) return;

        try {
            const tilemapData = tilemap.exportToData();
            const jsonContent = JSON.stringify(tilemapData, null, 2);

            // Use tilemapAssetGuid or currentFilePath for file-based editing
            const tilemapAssetPath = tilemap.tilemapAssetGuid || currentFilePath;
            if (!tilemapAssetPath) {
                console.warn('Tilemap asset path not set');
                messageHub?.publish('notification:show', {
                    type: 'warning',
                    message: 'Cannot save: No tilemap file associated. Please set a tilemap asset path first.',
                    duration: 3000
                });
                return;
            }

            const projectService = Core.services.tryResolve(ProjectService);
            const currentProject = projectService?.getCurrentProject();
            if (!currentProject) return;

            const normalizedAssetPath = tilemapAssetPath.replace(/\\/g, '/');
            const normalizedProjectPath = currentProject.path.replace(/\\/g, '/');

            let absolutePath: string;
            if (normalizedAssetPath.match(/^[a-zA-Z]:/) || normalizedAssetPath.startsWith('/')) {
                absolutePath = normalizedAssetPath;
            } else {
                absolutePath = `${normalizedProjectPath}/${normalizedAssetPath}`;
            }

            const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;
            if (fileSystem) {
                await fileSystem.writeFile(absolutePath, jsonContent);

                messageHub?.publish('notification:show', {
                    type: 'success',
                    message: 'Tilemap saved',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Failed to save tilemap:', error);
            messageHub?.publish('notification:show', {
                type: 'error',
                message: `Save failed: ${error instanceof Error ? error.message : String(error)}`,
                duration: 3000
            });
        }
    }, [tilemap, currentFilePath, messageHub]);

    // Handle undo action
    const handleUndo = useCallback(() => {
        if (!tilemap) return;

        const previousData = undo();
        if (previousData) {
            tilemap.setLayerData(currentLayer, previousData);
            handleTilemapChange();
        }
    }, [tilemap, currentLayer, undo, handleTilemapChange]);

    // Handle redo action
    const handleRedo = useCallback(() => {
        if (!tilemap) return;

        const nextData = redo();
        if (nextData) {
            tilemap.setLayerData(currentLayer, nextData);
            handleTilemapChange();
        }
    }, [tilemap, currentLayer, redo, handleTilemapChange]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if Ctrl or Cmd is pressed
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveTilemap();
                        break;
                    case 'z':
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.shiftKey) {
                            // Ctrl+Shift+Z = Redo
                            handleRedo();
                        } else {
                            // Ctrl+Z = Undo
                            handleUndo();
                        }
                        break;
                    case 'y':
                        // Ctrl+Y = Redo (Windows style)
                        e.preventDefault();
                        e.stopPropagation();
                        handleRedo();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [handleSaveTilemap, handleUndo, handleRedo]);

    const handleZoomIn = () => setZoom(Math.min(10, zoom * 1.2));
    const handleZoomOut = () => setZoom(Math.max(0.1, zoom / 1.2));
    const handleResetView = () => {
        setZoom(1);
        setPan(0, 0);
    };

    // 退出全屏模式 (reserved for future use)
    const _handleExitFullscreen = useCallback(() => {
        messageHub?.publish('editor:fullscreen', { fullscreen: false });
    }, [messageHub]);

    // Layer operations
    const handleAddLayer = useCallback(() => {
        if (!tilemap) return;
        tilemap.addLayer(`Layer ${tilemap.layers.length + 1}`);
        const layerStates: LayerState[] = tilemap.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity,
            color: layer.color ?? '#ffffff',
            hiddenInGame: layer.hiddenInGame ?? false
        }));
        setLayers(layerStates);
        setCurrentLayer(tilemap.layers.length - 1);
        tilemap.renderDirty = true;
        handleTilemapChange();
    }, [tilemap, setLayers, setCurrentLayer, handleTilemapChange]);

    const handleRemoveLayer = useCallback((index: number) => {
        if (!tilemap || tilemap.layers.length <= 1) return;
        tilemap.removeLayer(index);
        const layerStates: LayerState[] = tilemap.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity,
            color: layer.color ?? '#ffffff',
            hiddenInGame: layer.hiddenInGame ?? false
        }));
        setLayers(layerStates);
        const { currentLayer } = useTilemapEditorStore.getState();
        if (currentLayer >= tilemap.layers.length) {
            setCurrentLayer(tilemap.layers.length - 1);
        }
        tilemap.renderDirty = true;
        handleTilemapChange();
    }, [tilemap, setLayers, setCurrentLayer, handleTilemapChange]);

    const handleMoveLayer = useCallback((fromIndex: number, toIndex: number) => {
        if (!tilemap) return;
        if (toIndex < 0 || toIndex >= tilemap.layers.length) return;
        tilemap.moveLayer(fromIndex, toIndex);
        const layerStates: LayerState[] = tilemap.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity,
            color: layer.color ?? '#ffffff',
            hiddenInGame: layer.hiddenInGame ?? false
        }));
        setLayers(layerStates);
        setCurrentLayer(toIndex);
        tilemap.renderDirty = true;
        handleTilemapChange();
    }, [tilemap, setLayers, setCurrentLayer, handleTilemapChange]);

    const handleDuplicateLayer = useCallback((index: number) => {
        if (!tilemap) return;
        const newLayer = tilemap.duplicateLayer(index);
        if (!newLayer) return;

        const layerStates: LayerState[] = tilemap.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity,
            color: layer.color ?? '#ffffff',
            hiddenInGame: layer.hiddenInGame ?? false
        }));
        setLayers(layerStates);
        setCurrentLayer(index + 1); // Select the new duplicated layer
        tilemap.renderDirty = true;
        handleTilemapChange();
    }, [tilemap, setLayers, setCurrentLayer, handleTilemapChange]);

    // Tileset operations
    const handleAddTileset = useCallback(() => {
        if (!tilemap) return;
        setShowAssetPicker(true);
    }, [tilemap]);

    const handleTilesetSelected = useCallback((path: string) => {
        if (!tilemap) return;
        tilemap.addTileset(path);
        setActiveTilesetIndex(tilemap.tilesets.length - 1);
        loadTilesetFromComponent(tilemap);
        handleTilemapChange();
    }, [tilemap, loadTilesetFromComponent, handleTilemapChange]);

    const handleTilesetChange = useCallback((index: number) => {
        setActiveTilesetIndex(index);
        if (tilemap) {
            loadTilesetFromComponent(tilemap);
        }
    }, [tilemap, loadTilesetFromComponent]);

    // Resize map
    const handleResizeMap = useCallback((newWidth: number, newHeight: number, anchor: ResizeAnchor) => {
        if (!tilemap) return;
        tilemap.resize(newWidth, newHeight, anchor);
        setTilemapKey(`${newWidth}-${newHeight}-${Date.now()}`);
        handleTilemapChange();
    }, [tilemap, handleTilemapChange]);

    // Layer material selection
    const handleSelectLayerMaterial = useCallback((layerIndex: number) => {
        setMaterialPickerLayerIndex(layerIndex);
        setShowMaterialPicker(true);
    }, []);

    const handleMaterialSelected = useCallback((path: string) => {
        if (!tilemap) return;
        tilemap.setLayerMaterial(materialPickerLayerIndex, path);
        handleTilemapChange();
    }, [tilemap, materialPickerLayerIndex, handleTilemapChange]);

    // Get tileset list
    const tilesetOptions = tilemap?.tilesets.map((t, i) => ({
        name: t.data?.name || `Tileset ${i + 1}`,
        path: t.source
    })) || [];

    // Empty state
    if (!tilemap) {
        return (
            <div className="tilemap-editor-panel">
                <div className="tilemap-editor-empty">
                    <Map size={48} />
                    <h3>未选择瓦片地图</h3>
                    <p>
                        选择带有 TilemapComponent 的实体
                        <br />
                        并点击"编辑瓦片地图"开始编辑。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="tilemap-editor-panel">
            {/* Left Panel - Tile Set Selector */}
            <div style={{ width: leftPanelWidth, flexShrink: 0 }}>
                <TileSetSelectorPanel
                    tilesets={tilesetOptions}
                    activeTilesetIndex={activeTilesetIndex}
                    activeTileset={activeTilesetData}
                    tilesetImage={tilesetImage}
                    onTilesetChange={handleTilesetChange}
                    onAddTileset={handleAddTileset}
                    onTileAnimationChange={handleTileAnimationChange}
                />
            </div>

            {/* Left Divider */}
            <PanelDivider direction="horizontal" onDrag={handleLeftDividerDrag} />

            {/* Center - Viewport */}
            <div className="tilemap-viewport">
                {/* Viewport top toolbar */}
                <div className="viewport-toolbar">
                    <div className="viewport-toolbar-left">
                        <div className="viewport-btn-group">
                            <button
                                className={`viewport-btn icon ${showGrid ? 'active' : ''}`}
                                onClick={() => setShowGrid(!showGrid)}
                                title="切换网格"
                            >
                                <Grid3x3 size={14} />
                            </button>
                            <button
                                className={`viewport-btn icon ${showCollision ? 'active' : ''}`}
                                onClick={() => setShowCollision(!showCollision)}
                                title="显示碰撞"
                            >
                                <Box size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="viewport-toolbar-center">
                        <button className="viewport-btn" onClick={handleSaveTilemap} title="保存 (Ctrl+S)">
                            <Save size={14} />
                            <span>保存</span>
                        </button>
                    </div>

                    <div className="viewport-toolbar-right">
                        <div className="viewport-btn-group">
                            <button className="viewport-btn icon" onClick={handleZoomOut} title="缩小">
                                <ZoomOut size={14} />
                            </button>
                            <span className="zoom-display">{Math.round(zoom * 100)}%</span>
                            <button className="viewport-btn icon" onClick={handleZoomIn} title="放大">
                                <ZoomIn size={14} />
                            </button>
                            <button className="viewport-btn icon" onClick={handleResetView} title="重置视图">
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info overlay */}
                <div className="viewport-info-overlay">
                    <div className="info-item">
                        <strong>碰撞几何体 (烘焙)</strong>
                    </div>
                    <div className="info-item warning">
                        <AlertTriangle size={12} />
                        警告: 碰撞已启用但没有形状
                    </div>
                    <div className="info-item">
                        <strong>渲染几何体 (烘焙)</strong>
                    </div>
                    <div className="info-item">区段: 0</div>
                    <div className="info-item">三角形: 0 (遮罩)</div>
                    <div className="info-item">近似大小: {tilemap.width * tilemap.tileWidth}x{tilemap.height * tilemap.tileHeight}</div>
                </div>

                {/* Viewport */}
                <div className="viewport-canvas-container">
                    <TilemapCanvas
                        key={tilemapKey}
                        tilemap={tilemap}
                        tilesetImage={tilesetImage}
                        onTilemapChange={handleTilemapChange}
                    />
                </div>

                {/* Scale ruler - width represents 100 pixels at current zoom */}
                <div className="viewport-ruler">
                    <div className="ruler-marker">
                        <div className="ruler-line" style={{ width: 100 * zoom }} />
                        <span>{(100 / zoom / tilemap.tileWidth).toFixed(1)} 格</span>
                    </div>
                </div>

                {/* Beta preview watermark */}
                <div className="viewport-watermark">测试预览</div>
            </div>

            {/* Right Divider */}
            <PanelDivider direction="horizontal" onDrag={handleRightDividerDrag} />

            {/* Right Panel - Details */}
            <div style={{ width: rightPanelWidth, flexShrink: 0 }}>
                <TilemapDetailsPanel
                    tilemap={tilemap}
                    onAddLayer={handleAddLayer}
                    onRemoveLayer={handleRemoveLayer}
                    onMoveLayer={handleMoveLayer}
                    onDuplicateLayer={handleDuplicateLayer}
                    onTilemapChange={handleTilemapChange}
                    onOpenAssetPicker={() => setShowAssetPicker(true)}
                    onSelectLayerMaterial={handleSelectLayerMaterial}
                />
            </div>

            {/* Dialogs */}
            <AssetPickerDialog
                isOpen={showAssetPicker}
                onClose={() => setShowAssetPicker(false)}
                onSelect={handleTilesetSelected}
                title="选择瓦片集图片"
                fileExtensions={['.png', '.jpg', '.jpeg', '.webp']}
            />

            {/* Material Picker Dialog */}
            <AssetPickerDialog
                isOpen={showMaterialPicker}
                onClose={() => setShowMaterialPicker(false)}
                onSelect={handleMaterialSelected}
                title="选择图层材质"
                fileExtensions={['.mat', '.mat.json']}
            />

            <ResizeMapDialog
                isOpen={showResizeDialog}
                onClose={() => setShowResizeDialog(false)}
                onConfirm={handleResizeMap}
                currentWidth={tilemap.width}
                currentHeight={tilemap.height}
            />
        </div>
    );
};
