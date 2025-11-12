type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'failure';

export class DOMCache {
    private nodeElements: Map<string, Element> = new Map();
    private connectionElements: Map<string, Element> = new Map();
    private lastNodeStatus: Map<string, NodeExecutionStatus> = new Map();
    private statusTimers: Map<string, number> = new Map();

    getNode(nodeId: string): Element | undefined {
        let element = this.nodeElements.get(nodeId);
        if (!element) {
            element = document.querySelector(`[data-node-id="${nodeId}"]`) || undefined;
            if (element) {
                this.nodeElements.set(nodeId, element);
            }
        }
        return element;
    }

    getConnection(connectionKey: string): Element | undefined {
        let element = this.connectionElements.get(connectionKey);
        if (!element) {
            element = document.querySelector(`[data-connection-id="${connectionKey}"]`) || undefined;
            if (element) {
                this.connectionElements.set(connectionKey, element);
            }
        }
        return element;
    }

    getLastStatus(nodeId: string): NodeExecutionStatus | undefined {
        return this.lastNodeStatus.get(nodeId);
    }

    setLastStatus(nodeId: string, status: NodeExecutionStatus): void {
        this.lastNodeStatus.set(nodeId, status);
    }

    hasStatusChanged(nodeId: string, newStatus: NodeExecutionStatus): boolean {
        return this.lastNodeStatus.get(nodeId) !== newStatus;
    }

    getStatusTimer(nodeId: string): number | undefined {
        return this.statusTimers.get(nodeId);
    }

    setStatusTimer(nodeId: string, timerId: number): void {
        this.statusTimers.set(nodeId, timerId);
    }

    clearStatusTimer(nodeId: string): void {
        const timerId = this.statusTimers.get(nodeId);
        if (timerId) {
            clearTimeout(timerId);
            this.statusTimers.delete(nodeId);
        }
    }

    clearAllStatusTimers(): void {
        this.statusTimers.forEach((timerId) => clearTimeout(timerId));
        this.statusTimers.clear();
    }

    clearNodeCache(): void {
        this.nodeElements.clear();
    }

    clearConnectionCache(): void {
        this.connectionElements.clear();
    }

    clearStatusCache(): void {
        this.lastNodeStatus.clear();
    }

    clearAll(): void {
        this.clearNodeCache();
        this.clearConnectionCache();
        this.clearStatusCache();
        this.clearAllStatusTimers();
    }

    removeNodeClasses(nodeId: string, ...classes: string[]): void {
        const element = this.getNode(nodeId);
        if (element) {
            element.classList.remove(...classes);
        }
    }

    addNodeClasses(nodeId: string, ...classes: string[]): void {
        const element = this.getNode(nodeId);
        if (element) {
            element.classList.add(...classes);
        }
    }

    hasNodeClass(nodeId: string, className: string): boolean {
        const element = this.getNode(nodeId);
        return element?.classList.contains(className) || false;
    }

    setConnectionAttribute(connectionKey: string, attribute: string, value: string): void {
        const element = this.getConnection(connectionKey);
        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    getConnectionAttribute(connectionKey: string, attribute: string): string | null {
        const element = this.getConnection(connectionKey);
        return element?.getAttribute(attribute) || null;
    }

    forEachNode(callback: (element: Element, nodeId: string) => void): void {
        this.nodeElements.forEach((element, nodeId) => {
            callback(element, nodeId);
        });
    }

    forEachConnection(callback: (element: Element, connectionKey: string) => void): void {
        this.connectionElements.forEach((element, connectionKey) => {
            callback(element, connectionKey);
        });
    }
}
