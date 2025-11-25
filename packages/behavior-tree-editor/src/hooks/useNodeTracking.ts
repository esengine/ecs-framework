import { useState, useEffect, useRef } from '@esengine/editor-runtime';
import { BehaviorTreeNode } from '../stores';
import { ExecutionMode } from '../application/services/ExecutionController';

interface UseNodeTrackingParams {
    nodes: BehaviorTreeNode[];
    executionMode: ExecutionMode;
}

export function useNodeTracking(params: UseNodeTrackingParams) {
    const { nodes, executionMode } = params;

    const [uncommittedNodeIds, setUncommittedNodeIds] = useState<Set<string>>(new Set());
    const activeNodeIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (executionMode === 'idle') {
            setUncommittedNodeIds(new Set());
            activeNodeIdsRef.current = new Set(nodes.map((n) => n.id));
        } else if (executionMode === 'running' || executionMode === 'paused') {
            const currentNodeIds = new Set(nodes.map((n) => n.id));
            const newNodeIds = new Set<string>();

            currentNodeIds.forEach((id) => {
                if (!activeNodeIdsRef.current.has(id)) {
                    newNodeIds.add(id);
                }
            });

            if (newNodeIds.size > 0) {
                setUncommittedNodeIds((prev) => new Set([...prev, ...newNodeIds]));
            }
        }
    }, [nodes, executionMode]);

    return {
        uncommittedNodeIds
    };
}
