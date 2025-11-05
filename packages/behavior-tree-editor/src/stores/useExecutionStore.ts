import { create } from 'zustand';

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';

interface ExecutionState {
    isExecuting: boolean;
    nodeExecutionStatuses: Map<string, NodeExecutionStatus>;
    nodeExecutionOrders: Map<string, number>;

    setIsExecuting: (isExecuting: boolean) => void;
    setNodeExecutionStatus: (nodeId: string, status: NodeExecutionStatus) => void;
    updateNodeExecutionStatuses: (
        statuses: Map<string, NodeExecutionStatus>,
        orders?: Map<string, number>
    ) => void;
    clearNodeExecutionStatuses: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
    isExecuting: false,
    nodeExecutionStatuses: new Map(),
    nodeExecutionOrders: new Map(),

    setIsExecuting: (isExecuting) => set({ isExecuting }),

    setNodeExecutionStatus: (nodeId, status) => set((state) => {
        const newStatuses = new Map(state.nodeExecutionStatuses);
        newStatuses.set(nodeId, status);
        return { nodeExecutionStatuses: newStatuses };
    }),

    updateNodeExecutionStatuses: (statuses, orders) => set((state) => ({
        nodeExecutionStatuses: new Map(statuses),
        nodeExecutionOrders: orders ? new Map(orders) : state.nodeExecutionOrders
    })),

    clearNodeExecutionStatuses: () => set({
        nodeExecutionStatuses: new Map(),
        nodeExecutionOrders: new Map()
    })
}));
