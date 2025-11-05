export interface IEditorDataStore<TNode, TConnection> {
    getNodes(): TNode[];
    getConnections(): TConnection[];
    getNode(nodeId: string): TNode | undefined;
    getConnection(connectionId: string): TConnection | undefined;
    addNode(node: TNode): void;
    removeNode(nodeId: string): void;
    updateNode(nodeId: string, updates: Partial<TNode>): void;
    addConnection(connection: TConnection): void;
    removeConnection(connectionId: string): void;
    clear(): void;
}
