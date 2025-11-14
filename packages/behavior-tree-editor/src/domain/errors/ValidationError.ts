import { DomainError } from './DomainError';

/**
 * 验证错误
 * 当业务规则验证失败时抛出
 */
export class ValidationError extends DomainError {
    constructor(
        message: string,
        public readonly field?: string,
        public readonly value?: unknown
    ) {
        super(message);
    }

    static rootNodeMaxChildren(): ValidationError {
        return new ValidationError(
            '根节点只能连接一个子节点',
            'children'
        );
    }

    static decoratorNodeMaxChildren(): ValidationError {
        return new ValidationError(
            '装饰节点只能连接一个子节点',
            'children'
        );
    }

    static leafNodeNoChildren(): ValidationError {
        return new ValidationError(
            '叶子节点不能有子节点',
            'children'
        );
    }

    static circularReference(nodeId: string): ValidationError {
        return new ValidationError(
            `检测到循环引用，节点 ${nodeId} 不能连接到自己或其子节点`,
            'connection',
            nodeId
        );
    }

    static invalidConnection(from: string, to: string, reason: string): ValidationError {
        return new ValidationError(
            `无效的连接：${reason}`,
            'connection',
            { from, to }
        );
    }
}
