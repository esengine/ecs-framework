/**
 * Physics 2D Components Module (Lightweight)
 * 2D 物理组件模块（轻量级）
 *
 * 仅注册组件，不包含 WASM 依赖
 * 用于编辑器中的组件序列化/反序列化
 */

import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModuleLoader } from '@esengine/ecs-components';

// Components (no WASM dependency)
import { Rigidbody2DComponent } from './components/Rigidbody2DComponent';
import { BoxCollider2DComponent } from './components/BoxCollider2DComponent';
import { CircleCollider2DComponent } from './components/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from './components/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from './components/PolygonCollider2DComponent';

/**
 * Physics 2D Components Module (Lightweight)
 * 2D 物理组件模块（轻量级）
 *
 * 仅实现组件注册，不包含系统创建和 WASM 初始化
 * 用于编辑器场景序列化
 */
export class Physics2DComponentsModule implements IRuntimeModuleLoader {
    /**
     * 注册组件到 ComponentRegistry
     */
    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(Rigidbody2DComponent);
        registry.register(BoxCollider2DComponent);
        registry.register(CircleCollider2DComponent);
        registry.register(CapsuleCollider2DComponent);
        registry.register(PolygonCollider2DComponent);
    }

    /**
     * 不创建系统（完整运行时模块负责）
     */
    createSystems(): void {
        // No-op: Systems are created by the full runtime module
    }
}

/**
 * 默认导出模块实例
 */
export const physics2DComponentsModule = new Physics2DComponentsModule();
export default physics2DComponentsModule;
