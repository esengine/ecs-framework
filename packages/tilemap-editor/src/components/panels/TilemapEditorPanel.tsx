/**
 * Tilemap Editor Panel - Main editing panel
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Paintbrush,
    Eraser,
    PaintBucket,
    Grid3x3,
    Eye,
    EyeOff,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Map,
    Shield,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    PanelRightClose,
    PanelRightOpen,
    X,
    Search,
    Folder,
    FolderOpen,
    File,
    Image as ImageIcon
} from 'lucide-react';
import { Core, Entity } from '@esengine/ecs-framework';
import { MessageHub, ProjectService, IFileSystemService, type IFileSystem } from '@esengine/editor-core';
import { TilemapComponent, type ITilesetData } from '@esengine/tilemap';
import { useTilemapEditorStore, type TilemapToolType, type LayerState } from '../../stores/TilemapEditorStore';
import { TilemapCanvas } from '../TilemapCanvas';
import { TilesetPreview } from '../TilesetPreview';
import { LayerPanel } from './LayerPanel';
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
    title = 'Select Asset',
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

            // Use Tauri's asset protocol format
            const normalizedPath = node.path.replace(/\\/g, '/');
            setPreviewSrc(`https://asset.localhost/${normalizedPath}`);
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
                const fileSystem = Core.services.tryResolve<IFileSystem>(IFileSystemService);

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
                        placeholder="Search assets..."
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

                {/* Image Preview Tooltip */}
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
                                console.error('Preview image load error:', previewPath);
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to convert file path to URL
function convertFileSrc(path: string): string {
    // In Tauri, use convertFileSrc from @tauri-apps/api/core
    // For now, use a simple file:// protocol or asset protocol
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('asset://')) {
        return path;
    }
    return `asset://localhost/${encodeURIComponent(path)}`;
}

interface TilemapEditorPanelProps {
    projectPath?: string | null;
    messageHub?: MessageHub;
}

export const TilemapEditorPanel: React.FC<TilemapEditorPanelProps> = ({ messageHub: propMessageHub }) => {
    const [tilemap, setTilemap] = useState<TilemapComponent | null>(null);
    const [entity, setEntity] = useState<Entity | null>(null);
    const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);
    const [tilemapKey, setTilemapKey] = useState('');
    const [showTilesetPanel, setShowTilesetPanel] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const [tilesetHeight, setTilesetHeight] = useState(200);
    const [isResizing, setIsResizing] = useState(false);
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const messageHub = propMessageHub || Core.services.resolve(MessageHub);

    const {
        entityId,
        currentTool,
        zoom,
        showGrid,
        showCollision,
        editingCollision,
        tileWidth,
        tileHeight,
        tilesetImageUrl,
        tilesetColumns,
        tilesetRows,
        selectedTiles,
        setEntityId,
        setCurrentTool,
        setZoom,
        setShowGrid,
        setShowCollision,
        setEditingCollision,
        setPan,
        setTileset,
        setLayers,
        setCurrentLayer
    } = useTilemapEditorStore();

    // Listen for tilemap edit requests
    useEffect(() => {
        if (!messageHub) return;

        const unsubscribe = messageHub.subscribe('tilemap:edit', (data: { entityId: string }) => {
            setEntityId(data.entityId);
        });

        return unsubscribe;
    }, [messageHub, setEntityId]);

    // Helper to load tileset from component
    const loadTilesetFromComponent = (tilemapComp: TilemapComponent) => {
        // Get tileset source from first tileset
        const tilesetRef = tilemapComp.tilesets[0];
        if (!tilesetRef) {
            setTileset(null, 0, 0, tilemapComp.tileWidth, tilemapComp.tileHeight);
            return;
        }

        const tilesetPath = tilesetRef.source;
        const imageUrl = convertFileSrc(tilesetPath);
        const img = new Image();
        img.onload = () => {
            const columns = Math.floor(img.width / tilemapComp.tileWidth);
            const rows = Math.floor(img.height / tilemapComp.tileHeight);

            // Create tileset data and set it
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
            tilemapComp.setTilesetData(0, tilesetData);
            setTileset(imageUrl, columns, rows, tilemapComp.tileWidth, tilemapComp.tileHeight);
        };
        img.onerror = () => {
            setTileset(null, 0, 0, tilemapComp.tileWidth, tilemapComp.tileHeight);
        };
        img.src = imageUrl;
    };

    // Load tilemap component when entityId changes
    useEffect(() => {
        if (!entityId) {
            setTilemap(null);
            setEntity(null);
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

        // Sync layers to store
        const layerStates: LayerState[] = tilemapComp.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity
        }));
        setLayers(layerStates);
        setCurrentLayer(0);
    }, [entityId, setTileset, setLayers, setCurrentLayer]);

    // Listen for scene modifications
    useEffect(() => {
        if (!messageHub || !tilemap) return;

        const unsubscribeModified = messageHub.subscribe('scene:modified', () => {
            loadTilesetFromComponent(tilemap);
            setTilemapKey(`${tilemap.width}-${tilemap.height}-${Date.now()}`);
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
    }, [messageHub, tilemap, tilesetImageUrl, setTileset, entityId]);

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

    const handleTilemapChange = () => {
        messageHub?.publish('scene:modified', {});
    };

    const handleToolChange = (tool: TilemapToolType) => {
        setCurrentTool(tool);
    };

    const handleZoomIn = () => setZoom(Math.min(10, zoom * 1.2));
    const handleZoomOut = () => setZoom(Math.max(0.1, zoom / 1.2));
    const handleResetView = () => {
        setZoom(1);
        setPan(0, 0);
    };

    // Layer operations
    const handleAddLayer = () => {
        if (!tilemap) return;
        tilemap.addLayer(`Layer ${tilemap.layers.length + 1}`);
        const layerStates: LayerState[] = tilemap.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity
        }));
        setLayers(layerStates);
        setCurrentLayer(tilemap.layers.length - 1);
        tilemap.renderDirty = true;
        handleTilemapChange();
    };

    const handleRemoveLayer = (index: number) => {
        if (!tilemap || tilemap.layers.length <= 1) return;
        tilemap.removeLayer(index);
        const layerStates: LayerState[] = tilemap.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity
        }));
        setLayers(layerStates);
        const { currentLayer } = useTilemapEditorStore.getState();
        if (currentLayer >= tilemap.layers.length) {
            setCurrentLayer(tilemap.layers.length - 1);
        }
        tilemap.renderDirty = true;
        handleTilemapChange();
    };

    const handleMoveLayer = (fromIndex: number, toIndex: number) => {
        if (!tilemap) return;
        if (toIndex < 0 || toIndex >= tilemap.layers.length) return;
        tilemap.moveLayer(fromIndex, toIndex);
        const layerStates: LayerState[] = tilemap.layers.map((layer) => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            locked: false,
            opacity: layer.opacity
        }));
        setLayers(layerStates);
        setCurrentLayer(toIndex);
        tilemap.renderDirty = true;
        handleTilemapChange();
    };

    // Tileset operations
    const handleAddTileset = () => {
        if (!tilemap) return;
        setShowAssetPicker(true);
    };

    const handleTilesetSelected = (path: string) => {
        if (!tilemap) return;
        tilemap.addTileset(path);
        loadTilesetFromComponent(tilemap);
        handleTilemapChange();
    };

    // Handle resize
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const startY = e.clientY;
        const startHeight = tilesetHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientY - startY;
            const newHeight = Math.max(100, Math.min(400, startHeight + delta));
            setTilesetHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRemoveTileset = (index: number) => {
        if (!tilemap) return;
        tilemap.removeTileset(index);
        if (tilemap.tilesets.length === 0) {
            setTileset(null, 0, 0, tilemap.tileWidth, tilemap.tileHeight);
        } else {
            loadTilesetFromComponent(tilemap);
        }
        handleTilemapChange();
    };

    if (!tilemap) {
        return (
            <div className="tilemap-editor-panel">
                <div className="tilemap-editor-empty">
                    <Map size={48} />
                    <h3>No Tilemap Selected</h3>
                    <p>
                        Select an entity with a TilemapComponent
                        <br />
                        and click "Edit Tilemap" to start editing.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="tilemap-editor-panel">
            {/* Toolbar */}
            <div className="tilemap-editor-toolbar">
                <div className="tool-group">
                    <button
                        className={`tool-btn ${currentTool === 'brush' ? 'active' : ''}`}
                        onClick={() => handleToolChange('brush')}
                        title="Brush (B)"
                    >
                        <Paintbrush size={16} />
                    </button>
                    <button
                        className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                        onClick={() => handleToolChange('eraser')}
                        title="Eraser (E)"
                    >
                        <Eraser size={16} />
                    </button>
                    <button
                        className={`tool-btn ${currentTool === 'fill' ? 'active' : ''}`}
                        onClick={() => handleToolChange('fill')}
                        title="Fill (G)"
                    >
                        <PaintBucket size={16} />
                    </button>
                </div>

                <div className="separator" />

                <div className="tool-group">
                    <button
                        className={`tool-btn ${showGrid ? 'active' : ''}`}
                        onClick={() => setShowGrid(!showGrid)}
                        title="Toggle Grid"
                    >
                        <Grid3x3 size={16} />
                    </button>
                    <button
                        className={`tool-btn ${showCollision ? 'active' : ''}`}
                        onClick={() => setShowCollision(!showCollision)}
                        title="Show Collision"
                    >
                        {showCollision ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                        className={`tool-btn ${editingCollision ? 'active' : ''}`}
                        onClick={() => setEditingCollision(!editingCollision)}
                        title="Edit Collision Layer"
                    >
                        <Shield size={16} />
                    </button>
                </div>

                <div className="zoom-control">
                    <button className="tool-btn" onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOut size={16} />
                    </button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button className="tool-btn" onClick={handleZoomIn} title="Zoom In">
                        <ZoomIn size={16} />
                    </button>
                    <button className="tool-btn" onClick={handleResetView} title="Reset View">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="tilemap-editor-content">
                {/* Canvas */}
                <TilemapCanvas
                    key={tilemapKey}
                    tilemap={tilemap}
                    tilesetImage={tilesetImage}
                    onTilemapChange={handleTilemapChange}
                />

                {/* Sidebar toggle button */}
                <button
                    className="sidebar-toggle"
                    onClick={() => setShowSidebar(!showSidebar)}
                    title={showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
                >
                    {showSidebar ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                </button>

                {/* Right sidebar with tileset and layers */}
                {showSidebar && (
                    <div className="tilemap-editor-sidebar" ref={sidebarRef}>
                        {/* Tileset Section */}
                        <div className="tileset-section">
                            <div
                                className="section-header"
                                onClick={() => setShowTilesetPanel(!showTilesetPanel)}
                            >
                                {showTilesetPanel ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span>Tileset</span>
                                <div className="section-actions">
                                    <button
                                        className="section-btn"
                                        onClick={(e) => { e.stopPropagation(); handleAddTileset(); }}
                                        title="Add Tileset"
                                    >
                                        <Plus size={12} />
                                    </button>
                                    {tilemap.tilesets.length > 0 && (
                                        <button
                                            className="section-btn"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveTileset(0); }}
                                            title="Remove Tileset"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {showTilesetPanel && (
                                <div className="tileset-content" style={{ height: tilesetHeight }}>
                                    {tilesetImageUrl ? (
                                        <>
                                            <TilesetPreview
                                                imageUrl={tilesetImageUrl}
                                                tileWidth={tileWidth}
                                                tileHeight={tileHeight}
                                                columns={tilesetColumns}
                                                rows={tilesetRows}
                                            />
                                            {selectedTiles && (
                                                <div className="tileset-info">
                                                    Selected: {selectedTiles.width}×{selectedTiles.height}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="tileset-empty-state">
                                            <p>No tileset</p>
                                            <button onClick={handleAddTileset}>
                                                <Plus size={14} />
                                                Add Tileset
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Resize handle */}
                            {showTilesetPanel && (
                                <div
                                    className={`resize-handle ${isResizing ? 'active' : ''}`}
                                    onMouseDown={handleResizeStart}
                                />
                            )}
                        </div>

                        {/* Layer Panel */}
                        <LayerPanel
                            tilemap={tilemap}
                            onAddLayer={handleAddLayer}
                            onRemoveLayer={handleRemoveLayer}
                            onMoveLayer={handleMoveLayer}
                        />
                    </div>
                )}
            </div>

            {/* Info bar */}
            <div className="tilemap-info-bar">
                <span>
                    Size: {tilemap.width}×{tilemap.height}
                </span>
                <span>
                    Tile: {tileWidth}×{tileHeight}
                </span>
                {entity && <span>Entity: {entity.name}</span>}
                {editingCollision && <span style={{ color: '#ff6b6b' }}>Editing Collision</span>}
            </div>

            {/* Asset Picker Dialog */}
            <AssetPickerDialog
                isOpen={showAssetPicker}
                onClose={() => setShowAssetPicker(false)}
                onSelect={handleTilesetSelected}
                title="Select Tileset Image"
                fileExtensions={['.png', '.jpg', '.jpeg', '.webp']}
            />
        </div>
    );
};
