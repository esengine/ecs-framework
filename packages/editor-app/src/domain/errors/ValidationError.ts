import { DomainError } from './DomainError';

export class ValidationError extends DomainError {
    constructor(
        message: string,
        public readonly field?: string,
        public readonly value?: unknown
    ) {
        super(message);
    }

    getUserMessage(): string {
        if (this.field) {
            return `验证失败: ${this.field} - ${this.message}`;
        }
        return `验证失败: ${this.message}`;
    }

    static requiredField(field: string): ValidationError {
        return new ValidationError(`字段 ${field} 是必需的`, field);
    }

    static invalidValue(field: string, value: unknown, reason?: string): ValidationError {
        const message = reason
            ? `字段 ${field} 的值无效: ${reason}`
            : `字段 ${field} 的值无效`;
        return new ValidationError(message, field, value);
    }

    static invalidFormat(field: string, expectedFormat: string): ValidationError {
        return new ValidationError(
            `字段 ${field} 格式不正确，期望格式: ${expectedFormat}`,
            field
        );
    }
}
