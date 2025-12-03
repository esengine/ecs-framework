/**
 * Type definitions for engine bridge.
 * 引擎桥接层的类型定义。
 */

/**
 * Material property override for rendering.
 * 用于渲染的材质属性覆盖。
 */
export interface MaterialPropertyOverride {
    /** Uniform type. | Uniform 类型。 */
    type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'int';
    /** Uniform value. | Uniform 值。 */
    value: number | number[];
}

/**
 * Material overrides map.
 * 材质覆盖映射。
 */
export type MaterialOverrides = Record<string, MaterialPropertyOverride>;

/**
 * Sprite render data for batch submission.
 * 用于批量提交的精灵渲染数据。
 */
export interface SpriteRenderData {
    /** Position X. | X位置。 */
    x: number;
    /** Position Y. | Y位置。 */
    y: number;
    /** Rotation in radians. | 旋转角度（弧度）。 */
    rotation: number;
    /** Scale X. | X缩放。 */
    scaleX: number;
    /** Scale Y. | Y缩放。 */
    scaleY: number;
    /** Origin X (0-1). | 原点X（0-1）。 */
    originX: number;
    /** Origin Y (0-1). | 原点Y（0-1）。 */
    originY: number;
    /** Texture ID. | 纹理ID。 */
    textureId: number;
    /** UV coordinates [u0, v0, u1, v1]. | UV坐标。 */
    uv: [number, number, number, number];
    /** Packed RGBA color. | 打包的RGBA颜色。 */
    color: number;
    /** Material ID (0 = default material). | 材质ID（0 = 默认材质）。 */
    materialId?: number;
    /**
     * Material property overrides (instance level).
     * 材质属性覆盖（实例级别）。
     */
    materialOverrides?: MaterialOverrides;
}

/**
 * Texture load request.
 * 纹理加载请求。
 */
export interface TextureLoadRequest {
    /** Unique texture ID. | 唯一纹理ID。 */
    id: number;
    /** Image URL. | 图片URL。 */
    url: string;
}

/**
 * Engine statistics.
 * 引擎统计信息。
 */
export interface EngineStats {
    /** Frames per second. | 每秒帧数。 */
    fps: number;
    /** Number of draw calls. | 绘制调用次数。 */
    drawCalls: number;
    /** Number of sprites rendered. | 渲染的精灵数量。 */
    spriteCount: number;
    /** Frame time in milliseconds. | 帧时间（毫秒）。 */
    frameTime: number;
}

/**
 * Camera configuration.
 * 相机配置。
 */
export interface CameraConfig {
    /** Camera X position. | 相机X位置。 */
    x: number;
    /** Camera Y position. | 相机Y位置。 */
    y: number;
    /** Zoom level. | 缩放级别。 */
    zoom: number;
    /** Rotation in radians. | 旋转角度（弧度）。 */
    rotation: number;
}
