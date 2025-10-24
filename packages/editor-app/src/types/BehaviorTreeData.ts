import { BehaviorTreeNode, Connection } from '../stores/behaviorTreeStore';

/**
 * 行为树编辑器数据格式
 */
export interface EditorBehaviorTreeData {
    version: string;
    metadata: {
        name: string;
        description: string;
        createdAt: string;
        modifiedAt: string;
    };
    nodes: BehaviorTreeNode[];
    connections: Connection[];
    blackboard: Record<string, any>;
    canvasState: {
        offset: { x: number; y: number };
        scale: number;
    };
}
