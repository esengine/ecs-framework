import { DomainError } from './DomainError';

export class FileOperationError extends DomainError {
    constructor(
        message: string,
        public readonly filePath?: string,
        public readonly operation?: 'read' | 'write' | 'delete' | 'parse' | 'create',
        public readonly originalError?: Error
    ) {
        super(message);
    }

    getUserMessage(): string {
        const operationMap = {
            read: '读取',
            write: '写入',
            delete: '删除',
            parse: '解析',
            create: '创建'
        };

        const operationText = this.operation ? operationMap[this.operation] : '操作';
        const fileText = this.filePath ? ` ${this.filePath}` : '';

        return `文件${operationText}失败${fileText}: ${this.message}`;
    }

    static readFailed(filePath: string, error?: Error): FileOperationError {
        return new FileOperationError(
            error?.message || '无法读取文件',
            filePath,
            'read',
            error
        );
    }

    static writeFailed(filePath: string, error?: Error): FileOperationError {
        return new FileOperationError(
            error?.message || '无法写入文件',
            filePath,
            'write',
            error
        );
    }

    static parseFailed(filePath: string, error?: Error): FileOperationError {
        return new FileOperationError(
            error?.message || '文件格式不正确',
            filePath,
            'parse',
            error
        );
    }
}
