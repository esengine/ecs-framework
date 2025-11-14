import { DomainError } from './DomainError';

/**
 * 节点未找到错误
 */
export class NodeNotFoundError extends DomainError {
    constructor(public readonly nodeId: string) {
        super(`节点未找到: ${nodeId}`);
    }
}
