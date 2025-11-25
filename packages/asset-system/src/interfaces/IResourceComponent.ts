/**
 * 资源组件接口 - 用于依赖运行时资源的组件（纹理、音频等）
 * Interface for components that depend on runtime resources (textures, audio, etc.)
 *
 * 实现此接口的组件可以参与 SceneResourceManager 管理的集中式资源加载
 * Components implementing this interface can participate in centralized resource loading managed by SceneResourceManager
 */

/**
 * 资源引用 - 包含路径和运行时 ID
 * Resource reference with path and runtime ID
 */
export interface ResourceReference {
    /** 资源路径（例如 "assets/sprites/player.png"）/ Asset path (e.g., "assets/sprites/player.png") */
    path: string;
    /** 引擎分配的运行时资源 ID（例如 GPU 上的纹理 ID）/ Runtime resource ID assigned by engine (e.g., texture ID on GPU) */
    runtimeId?: number;
    /** 资源类型标识符 / Resource type identifier */
    type: 'texture' | 'audio' | 'font' | 'data';
}

/**
 * 资源组件接口
 * Resource component interface
 *
 * 实现此接口的组件可以在场景启动前由 SceneResourceManager 集中加载资源
 * Components implementing this interface can have their resources loaded centrally by SceneResourceManager before the scene starts
 */
export interface IResourceComponent {
    /**
     * 获取此组件需要的所有资源引用
     * Get all resource references needed by this component
     *
     * 在场景加载期间调用以收集资源路径
     * Called during scene loading to collect resource paths
     */
    getResourceReferences(): ResourceReference[];

    /**
     * 设置已加载资源的运行时 ID
     * Set runtime IDs for loaded resources
     *
     * 在 SceneResourceManager 加载资源后调用
     * Called after resources are loaded by SceneResourceManager
     *
     * @param pathToId 资源路径到运行时 ID 的映射 / Map of resource paths to runtime IDs
     */
    setResourceIds(pathToId: Map<string, number>): void;
}

/**
 * 类型守卫 - 检查组件是否实现了 IResourceComponent
 * Type guard to check if a component implements IResourceComponent
 */
export function isResourceComponent(component: any): component is IResourceComponent {
    return (
        component !== null &&
        typeof component === 'object' &&
        typeof component.getResourceReferences === 'function' &&
        typeof component.setResourceIds === 'function'
    );
}
