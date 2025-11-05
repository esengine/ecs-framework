import { NodeTemplate, NodeType } from '@esengine/behavior-tree';
import {
    List, GitBranch, Layers, Shuffle, RotateCcw,
    Repeat, CheckCircle, XCircle, CheckCheck, HelpCircle, Snowflake, Timer,
    Clock, FileText, Edit, Calculator, Code,
    Equal, Dices, Settings,
    Database, TreePine,
    LucideIcon
} from 'lucide-react';

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
