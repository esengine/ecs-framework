import { NodeType, type NodeTemplate } from '@esengine/behavior-tree';
import { Icons } from '@esengine/editor-runtime';
import type { LucideIcon } from '@esengine/editor-runtime';

const {
    List, GitBranch, Layers, Shuffle, RotateCcw,
    Repeat, CheckCircle, XCircle, CheckCheck, HelpCircle, Snowflake, Timer,
    Clock, FileText, Edit, Calculator, Code,
    Equal, Dices, Settings,
    Database, TreePine
} = Icons;

export const ICON_MAP: Record<string, LucideIcon> = {
    List,
    GitBranch,
    Layers,
    Shuffle,
    RotateCcw,
    Repeat,
    CheckCircle,
    XCircle,
    CheckCheck,
    HelpCircle,
    Snowflake,
    Timer,
    Clock,
    FileText,
    Edit,
    Calculator,
    Code,
    Equal,
    Dices,
    Settings,
    Database,
    TreePine
};

export const ROOT_NODE_TEMPLATE: NodeTemplate = {
    type: NodeType.Composite,
    displayName: '根节点',
    category: '根节点',
    icon: 'TreePine',
    description: '行为树根节点',
    color: '#FFD700',
    defaultConfig: {
        nodeType: 'root'
    },
    properties: []
};

export const DEFAULT_EDITOR_CONFIG = {
    enableSnapping: false,
    gridSize: 20,
    minZoom: 0.1,
    maxZoom: 3,
    showGrid: true,
    showMinimap: false,
    defaultRootNodePosition: {
        x: 400,
        y: 100
    }
};
