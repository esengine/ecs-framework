/**
 * 网络库编译时宏定义
 * 这些宏在构建时会被具体的布尔值替换，用于实现客户端/服务端代码的编译时过滤
 */

declare global {
    const __CLIENT__: boolean;
    const __SERVER__: boolean;
}

export {};