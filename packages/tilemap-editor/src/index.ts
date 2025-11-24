/**
 * Tilemap Editor Package
 */

// Plugin
export { TilemapEditorPlugin, tilemapEditorPlugin } from './TilemapEditorPlugin';

// Components
export { TilemapEditorPanel } from './components/panels/TilemapEditorPanel';
export { TilesetPanel } from './components/panels/TilesetPanel';
export { TilemapCanvas } from './components/TilemapCanvas';
export { TilesetPreview } from './components/TilesetPreview';

// Store
export { useTilemapEditorStore } from './stores/TilemapEditorStore';
export type { TilemapEditorState, TilemapToolType, TileSelection } from './stores/TilemapEditorStore';

// Tools
export type { ITilemapTool, ToolContext } from './tools/ITilemapTool';
export { BrushTool } from './tools/BrushTool';
export { EraserTool } from './tools/EraserTool';
export { FillTool } from './tools/FillTool';

// Providers
export { TilemapInspectorProvider } from './providers/TilemapInspectorProvider';

// Default export
import { tilemapEditorPlugin as _plugin } from './TilemapEditorPlugin';
export default _plugin;
