/**
 * 全局宏定义类型声明
 * 
 * 这些宏变量由构建工具在编译时定义，用于条件编译
 * 支持在客户端构建时移除服务端代码，在服务端构建时移除客户端代码
 */

/**
 * 客户端构建标志
 * 
 * 当构建客户端版本时为true，服务端版本时为false
 * 使用示例：
 * ```typescript
 * if (__CLIENT__) {
 *     // 只在客户端构建中包含的代码
 *     this.renderUI();
 * }
 * ```
 */
declare const __CLIENT__: boolean;

/**
 * 服务端构建标志
 * 
 * 当构建服务端版本时为true，客户端版本时为false
 * 使用示例：
 * ```typescript
 * if (__SERVER__) {
 *     // 只在服务端构建中包含的代码
 *     this.validateInput();
 *     this.saveToDatabase();
 * }
 * ```
 */
declare const __SERVER__: boolean;

/**
 * 开发环境标志（可选）
 * 
 * 当在开发环境时为true，生产环境时为false
 */
declare const __DEV__: boolean;

/**
 * 生产环境标志（可选）
 * 
 * 当在生产环境时为true，开发环境时为false
 */
declare const __PROD__: boolean;