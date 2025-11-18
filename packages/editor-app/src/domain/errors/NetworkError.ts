import { DomainError } from './DomainError';

export class NetworkError extends DomainError {
    constructor(
        message: string,
        public readonly url?: string,
        public readonly statusCode?: number,
        public readonly method?: string,
        public readonly originalError?: Error
    ) {
        super(message);
    }

    getUserMessage(): string {
        if (this.statusCode) {
            return `网络请求失败 (${this.statusCode}): ${this.message}`;
        }
        return `网络请求失败: ${this.message}`;
    }

    static requestFailed(url: string, error?: Error): NetworkError {
        return new NetworkError(error?.message || '请求失败', url, undefined, undefined, error);
    }

    static timeout(url: string): NetworkError {
        return new NetworkError('请求超时', url);
    }

    static unauthorized(): NetworkError {
        return new NetworkError('未授权，请先登录', undefined, 401);
    }

    static forbidden(): NetworkError {
        return new NetworkError('没有权限访问此资源', undefined, 403);
    }

    static notFound(url: string): NetworkError {
        return new NetworkError('资源不存在', url, 404);
    }

    static serverError(): NetworkError {
        return new NetworkError('服务器错误', undefined, 500);
    }
}
