/**
 * 插件服务注册表
 * Plugin Service Registry
 *
 * 从 @esengine/plugin-types 重新导出基础类型，
 * 并添加 engine-core 特定的 Token。
 *
 * Re-exports base types from @esengine/plugin-types,
 * and adds engine-core specific tokens.
 *
 * 设计原则 | Design principles:
 * 1. 类型安全 - 使用 ServiceToken 携带类型信息
 * 2. 显式依赖 - 通过导入 token 明确表达依赖关系
 * 3. 可选依赖 - get 返回 undefined，require 抛异常
 * 4. 单一职责 - 只负责服务注册和查询，不涉及生命周期管理
 * 5. 谁定义接口，谁导出 Token - 各模块定义自己的接口和 Token
 */

// 重新导出 plugin-types 的基础类型 | Re-export base types from plugin-types
import { createServiceToken } from '@esengine/plugin-types';
export {
    PluginServiceRegistry,
    createServiceToken,
    type ServiceToken
} from '@esengine/plugin-types';

// ============================================================================
// engine-core 内部 Token | engine-core Internal Tokens
// ============================================================================

/**
 * Transform 组件类型 | Transform component type
 *
 * 使用 any 类型以允许各模块使用自己的 ITransformComponent 接口定义。
 * Using any type to allow modules to use their own ITransformComponent interface definition.
 *
 * 这是 engine-core 自己定义的 Token，因为 TransformComponent 在此模块中定义。
 * This is a Token defined by engine-core itself, as TransformComponent is defined in this module.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TransformTypeToken = createServiceToken<new (...args: any[]) => any>('transformType');
