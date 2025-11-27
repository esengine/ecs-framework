/* tslint:disable */
/* eslint-disable */
/**
 * Initialize panic hook for better error messages in console.
 * 初始化panic hook以在控制台显示更好的错误信息。
 */
export function init(): void;
/**
 * Game engine main interface exposed to JavaScript.
 * 暴露给JavaScript的游戏引擎主接口。
 *
 * This is the primary entry point for the engine from TypeScript/JavaScript.
 * 这是从TypeScript/JavaScript访问引擎的主要入口点。
 */
export class GameEngine {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Get camera state.
   * 获取相机状态。
   *
   * # Returns | 返回
   * Array of [x, y, zoom, rotation] | 数组 [x, y, zoom, rotation]
   */
  getCamera(): Float32Array;
  /**
   * Set camera position, zoom, and rotation.
   * 设置相机位置、缩放和旋转。
   *
   * # Arguments | 参数
   * * `x` - Camera X position | 相机X位置
   * * `y` - Camera Y position | 相机Y位置
   * * `zoom` - Zoom level | 缩放级别
   * * `rotation` - Rotation in radians | 旋转角度（弧度）
   */
  setCamera(x: number, y: number, zoom: number, rotation: number): void;
  /**
   * Check if a key is currently pressed.
   * 检查某个键是否当前被按下。
   *
   * # Arguments | 参数
   * * `key_code` - The key code to check | 要检查的键码
   */
  isKeyDown(key_code: string): boolean;
  /**
   * Load a texture from URL.
   * 从URL加载纹理。
   *
   * # Arguments | 参数
   * * `id` - Unique texture identifier | 唯一纹理标识符
   * * `url` - Image URL to load | 要加载的图片URL
   */
  loadTexture(id: number, url: string): void;
  /**
   * Update input state. Should be called once per frame.
   * 更新输入状态。应该每帧调用一次。
   */
  updateInput(): void;
  /**
   * Create a new game engine from external WebGL context.
   * 从外部 WebGL 上下文创建引擎。
   *
   * This is designed for WeChat MiniGame and similar environments.
   * 适用于微信小游戏等环境。
   */
  static fromExternal(gl_context: any, width: number, height: number): GameEngine;
  /**
   * Set grid visibility.
   * 设置网格可见性。
   */
  setShowGrid(show: boolean): void;
  /**
   * Add a rectangle gizmo outline.
   * 添加矩形Gizmo边框。
   *
   * # Arguments | 参数
   * * `x` - Center X position | 中心X位置
   * * `y` - Center Y position | 中心Y位置
   * * `width` - Rectangle width | 矩形宽度
   * * `height` - Rectangle height | 矩形高度
   * * `rotation` - Rotation in radians | 旋转角度（弧度）
   * * `origin_x` - Origin X (0-1) | 原点X (0-1)
   * * `origin_y` - Origin Y (0-1) | 原点Y (0-1)
   * * `r`, `g`, `b`, `a` - Color (0.0-1.0) | 颜色
   * * `show_handles` - Whether to show transform handles | 是否显示变换手柄
   */
  addGizmoRect(x: number, y: number, width: number, height: number, rotation: number, origin_x: number, origin_y: number, r: number, g: number, b: number, a: number, show_handles: boolean): void;
  /**
   * Render sprites as overlay (without clearing screen).
   * 渲染精灵作为叠加层（不清除屏幕）。
   *
   * This is used for UI rendering on top of the world content.
   * 用于在世界内容上渲染 UI。
   */
  renderOverlay(): void;
  /**
   * Resize a specific viewport.
   * 调整特定视口大小。
   */
  resizeViewport(viewport_id: string, width: number, height: number): void;
  /**
   * Set clear color (background color).
   * 设置清除颜色（背景颜色）。
   *
   * # Arguments | 参数
   * * `r`, `g`, `b`, `a` - Color components (0.0-1.0) | 颜色分量 (0.0-1.0)
   */
  setClearColor(r: number, g: number, b: number, a: number): void;
  /**
   * Set gizmo visibility.
   * 设置辅助工具可见性。
   */
  setShowGizmos(show: boolean): void;
  /**
   * Get all registered viewport IDs.
   * 获取所有已注册的视口ID。
   */
  getViewportIds(): string[];
  /**
   * Register a new viewport.
   * 注册新视口。
   *
   * # Arguments | 参数
   * * `id` - Unique viewport identifier | 唯一视口标识符
   * * `canvas_id` - HTML canvas element ID | HTML canvas元素ID
   */
  registerViewport(id: string, canvas_id: string): void;
  /**
   * Render to a specific viewport.
   * 渲染到特定视口。
   */
  renderToViewport(viewport_id: string): void;
  /**
   * Set transform tool mode.
   * 设置变换工具模式。
   *
   * # Arguments | 参数
   * * `mode` - 0=Select, 1=Move, 2=Rotate, 3=Scale
   */
  setTransformMode(mode: number): void;
  /**
   * Get or load texture by path.
   * 按路径获取或加载纹理。
   *
   * # Arguments | 参数
   * * `path` - Image path/URL | 图片路径/URL
   */
  getOrLoadTextureByPath(path: string): number;
  /**
   * Get camera for a specific viewport.
   * 获取特定视口的相机。
   */
  getViewportCamera(viewport_id: string): Float32Array | undefined;
  /**
   * Set the active viewport.
   * 设置活动视口。
   */
  setActiveViewport(id: string): boolean;
  /**
   * Set camera for a specific viewport.
   * 为特定视口设置相机。
   */
  setViewportCamera(viewport_id: string, x: number, y: number, zoom: number, rotation: number): void;
  /**
   * Set viewport configuration.
   * 设置视口配置。
   */
  setViewportConfig(viewport_id: string, show_grid: boolean, show_gizmos: boolean): void;
  /**
   * Submit sprite batch data for rendering.
   * 提交精灵批次数据进行渲染。
   *
   * # Arguments | 参数
   * * `transforms` - Float32Array [x, y, rotation, scaleX, scaleY, originX, originY] per sprite
   *                  每个精灵的变换数据
   * * `texture_ids` - Uint32Array of texture IDs | 纹理ID数组
   * * `uvs` - Float32Array [u0, v0, u1, v1] per sprite | 每个精灵的UV坐标
   * * `colors` - Uint32Array of packed RGBA colors | 打包的RGBA颜色数组
   */
  submitSpriteBatch(transforms: Float32Array, texture_ids: Uint32Array, uvs: Float32Array, colors: Uint32Array): void;
  /**
   * Unregister a viewport.
   * 注销视口。
   */
  unregisterViewport(id: string): void;
  /**
   * Load texture by path, returning texture ID.
   * 按路径加载纹理，返回纹理ID。
   *
   * # Arguments | 参数
   * * `path` - Image path/URL to load | 要加载的图片路径/URL
   */
  loadTextureByPath(path: string): number;
  /**
   * Get texture ID by path.
   * 按路径获取纹理ID。
   *
   * # Arguments | 参数
   * * `path` - Image path to lookup | 要查找的图片路径
   */
  getTextureIdByPath(path: string): number | undefined;
  /**
   * Create a new game engine instance.
   * 创建新的游戏引擎实例。
   *
   * # Arguments | 参数
   * * `canvas_id` - The HTML canvas element ID | HTML canvas元素ID
   *
   * # Returns | 返回
   * A new GameEngine instance or an error | 新的GameEngine实例或错误
   */
  constructor(canvas_id: string);
  /**
   * Clear the screen with specified color.
   * 使用指定颜色清除屏幕。
   *
   * # Arguments | 参数
   * * `r` - Red component (0.0-1.0) | 红色分量
   * * `g` - Green component (0.0-1.0) | 绿色分量
   * * `b` - Blue component (0.0-1.0) | 蓝色分量
   * * `a` - Alpha component (0.0-1.0) | 透明度分量
   */
  clear(r: number, g: number, b: number, a: number): void;
  /**
   * Render the current frame.
   * 渲染当前帧。
   */
  render(): void;
  /**
   * Resize viewport.
   * 调整视口大小。
   *
   * # Arguments | 参数
   * * `width` - New viewport width | 新视口宽度
   * * `height` - New viewport height | 新视口高度
   */
  resize(width: number, height: number): void;
  /**
   * Get canvas width.
   * 获取画布宽度。
   */
  readonly width: number;
  /**
   * Get canvas height.
   * 获取画布高度。
   */
  readonly height: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_gameengine_free: (a: number, b: number) => void;
  readonly gameengine_addGizmoRect: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly gameengine_clear: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly gameengine_fromExternal: (a: any, b: number, c: number) => [number, number, number];
  readonly gameengine_getCamera: (a: number) => [number, number];
  readonly gameengine_getOrLoadTextureByPath: (a: number, b: number, c: number) => [number, number, number];
  readonly gameengine_getTextureIdByPath: (a: number, b: number, c: number) => number;
  readonly gameengine_getViewportCamera: (a: number, b: number, c: number) => [number, number];
  readonly gameengine_getViewportIds: (a: number) => [number, number];
  readonly gameengine_height: (a: number) => number;
  readonly gameengine_isKeyDown: (a: number, b: number, c: number) => number;
  readonly gameengine_loadTexture: (a: number, b: number, c: number, d: number) => [number, number];
  readonly gameengine_loadTextureByPath: (a: number, b: number, c: number) => [number, number, number];
  readonly gameengine_new: (a: number, b: number) => [number, number, number];
  readonly gameengine_registerViewport: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly gameengine_render: (a: number) => [number, number];
  readonly gameengine_renderOverlay: (a: number) => [number, number];
  readonly gameengine_renderToViewport: (a: number, b: number, c: number) => [number, number];
  readonly gameengine_resize: (a: number, b: number, c: number) => void;
  readonly gameengine_resizeViewport: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly gameengine_setActiveViewport: (a: number, b: number, c: number) => number;
  readonly gameengine_setCamera: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly gameengine_setClearColor: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly gameengine_setShowGizmos: (a: number, b: number) => void;
  readonly gameengine_setShowGrid: (a: number, b: number) => void;
  readonly gameengine_setTransformMode: (a: number, b: number) => void;
  readonly gameengine_setViewportCamera: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly gameengine_setViewportConfig: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly gameengine_submitSpriteBatch: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number];
  readonly gameengine_unregisterViewport: (a: number, b: number, c: number) => void;
  readonly gameengine_updateInput: (a: number) => void;
  readonly gameengine_width: (a: number) => number;
  readonly init: () => void;
  readonly wasm_bindgen__convert__closures_____invoke__hdbeb4a641c76f980: (a: number, b: number) => void;
  readonly wasm_bindgen__closure__destroy__h201da39d82f7cf6e: (a: number, b: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
