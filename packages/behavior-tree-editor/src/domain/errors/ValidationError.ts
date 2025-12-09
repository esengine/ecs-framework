import { DomainError } from './DomainError';
import { translateBT } from '../../hooks/useBTLocale';

/**
 * 验证错误
 * Validation Error
 *
 * 当业务规则验证失败时抛出
 * Thrown when business rule validation fails
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
            translateBT('validation.rootNodeMaxChildren'),
            'children'
        );
    }

    static decoratorNodeMaxChildren(): ValidationError {
        return new ValidationError(
            translateBT('validation.decoratorNodeMaxChildren'),
            'children'
        );
    }

    static leafNodeNoChildren(): ValidationError {
        return new ValidationError(
            translateBT('validation.leafNodeNoChildren'),
            'children'
        );
    }

    static circularReference(nodeId: string): ValidationError {
        return new ValidationError(
            translateBT('validation.circularReference', undefined, { nodeId }),
            'connection',
            nodeId
        );
    }

    static invalidConnection(from: string, to: string, reason: string): ValidationError {
        return new ValidationError(
            translateBT('validation.invalidConnection', undefined, { reason }),
            'connection',
            { from, to }
        );
    }
}
