/**
 * @esengine/node-editor
 *
 * Universal node-based visual editor for blueprint, shader graph, and state machine.
 * 通用节点式可视化编辑器，用于蓝图、着色器图和状态机
 *
 * @packageDocumentation
 */

// Import styles (导入样式)
import './styles/index.css';

// Domain models (领域模型)
export {
    // Models
    Graph,
    GraphNode,
    Pin,
    Connection,
    // Types
    type NodeTemplate,
    type NodeCategory,
    type PinDefinition
} from './domain/models';

// Value objects (值对象)
export {
    Position,
    PinType,
    type PinDirection,
    type PinCategory,
    type PinShape,
    getDefaultPinShape
} from './domain/value-objects';

// Components (组件)
export {
    // Main editor component
    NodeEditor,
    type NodeEditorProps,
    type NodeExecutionStates,
    // Canvas components
    GraphCanvas,
    useCanvasTransform,
    type GraphCanvasProps,
    type CanvasTransform,
    // Node components
    GraphNodeComponent,
    MemoizedGraphNodeComponent,
    type GraphNodeComponentProps,
    type NodeExecutionState,
    // Pin components
    NodePin,
    PinRow,
    type NodePinProps,
    type PinRowProps,
    // Connection components
    ConnectionLine,
    ConnectionPreview,
    ConnectionLayer,
    type ConnectionLineProps,
    type ConnectionPreviewProps,
    type ConnectionLayerProps,
    // Menu components
    NodeContextMenu,
    type NodeContextMenuProps,
    // Dialog components
    ConfirmDialog,
    type ConfirmDialogProps
} from './components';
